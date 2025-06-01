import os
import json
import uuid
import asyncio
import aiohttp
import websockets
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, Form, HTTPException, BackgroundTasks, Depends
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union
import base64
import time
import logging
from concurrent.futures import ThreadPoolExecutor
import glob
from pathlib import Path
from dataclasses import dataclass
from enum import Enum
import psutil
import platform

# 配置类
class Environment(str, Enum):
    DEVELOPMENT = "development"
    PRODUCTION = "production"

class Config:
    """应用配置"""
    ENV: Environment = Environment(os.getenv("ENVIRONMENT", "development"))
    COMFYUI_SERVER: str = os.getenv("COMFYUI_SERVER", "http://127.0.0.1:8188")
    MAX_WORKERS: int = int(os.getenv("MAX_WORKERS", "4"))
    SESSION_TIMEOUT: int = int(os.getenv("SESSION_TIMEOUT", "1800"))  # 30分钟
    CLEANUP_INTERVAL: int = int(os.getenv("CLEANUP_INTERVAL", "300"))  # 5分钟
    MAX_ACTIVE_SESSIONS: int = int(os.getenv("MAX_ACTIVE_SESSIONS", "100"))  # 最大活动会话数
    UPLOAD_DIR: str = "uploads"
    OUTPUT_DIR: str = "output"
    STATIC_DIR: str = "static"
    WORKFLOW_DIR: str = "workflow"

config = Config()

# 日志配置
def setup_logging():
    """配置日志"""
    log_level = logging.DEBUG if config.ENV == Environment.DEVELOPMENT else logging.INFO
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    return logging.getLogger(__name__)

logger = setup_logging()

# 数据模型
class StyleConfig(BaseModel):
    """风格配置"""
    style_name: str = Field(default="realistic", description="风格名称")

class WebSocketMessage(BaseModel):
    """WebSocket消息模型"""
    type: str
    sketch_data: Optional[str] = None
    style: Optional[str] = None
    image_data: Optional[str] = None

@dataclass
class Session:
    """会话状态"""
    session_id: str
    sketch_path: Optional[str] = None
    result_path: Optional[str] = None
    style_config: Optional[StyleConfig] = None
    is_processing: bool = False
    last_update: float = Field(default_factory=time.time)
    websocket: Optional[WebSocket] = None
    needs_reprocess: bool = False
    last_heartbeat: float = Field(default_factory=time.time)
    is_alive: bool = True

# 应用状态
class AppState:
    """应用状态管理"""
    def __init__(self):
        self.active_sessions: Dict[str, Session] = {}
        self.executor = ThreadPoolExecutor(max_workers=config.MAX_WORKERS)
        self._lock = asyncio.Lock()

    async def create_session(self, session_id: str) -> Optional[Session]:
        """创建新会话，带并发控制"""
        async with self._lock:
            if len(self.active_sessions) >= config.MAX_ACTIVE_SESSIONS:
                logger.warning(f"达到最大会话数限制: {config.MAX_ACTIVE_SESSIONS}")
                return None
            session = Session(session_id=session_id)
            self.active_sessions[session_id] = session
            return session

    def get_session(self, session_id: str) -> Optional[Session]:
        """获取会话"""
        return self.active_sessions.get(session_id)

    def remove_session(self, session_id: str):
        """移除会话"""
        if session_id in self.active_sessions:
            del self.active_sessions[session_id]

    async def cleanup_expired_sessions(self):
        """清理过期会话，带资源释放"""
        current_time = time.time()
        expired_sessions = [
            session_id for session_id, session in self.active_sessions.items()
            if current_time - session.last_update > config.SESSION_TIMEOUT
        ]
        
        for session_id in expired_sessions:
            session = self.active_sessions.get(session_id)
            if session:
                # 清理会话资源
                if session.websocket:
                    try:
                        await session.websocket.close()
                    except Exception as e:
                        logger.error(f"关闭WebSocket连接失败: {session_id}, {str(e)}")
                
                # 清理临时文件
                if session.sketch_path and os.path.exists(session.sketch_path):
                    try:
                        os.remove(session.sketch_path)
                    except Exception as e:
                        logger.error(f"删除草图文件失败: {session.sketch_path}, {str(e)}")
                
                if session.result_path and os.path.exists(session.result_path):
                    try:
                        os.remove(session.result_path)
                    except Exception as e:
                        logger.error(f"删除结果文件失败: {session.result_path}, {str(e)}")
                
                self.remove_session(session_id)
                logger.info(f"已清理过期会话: {session_id}")

state = AppState()

# 工具函数
def create_required_directories():
    """创建必要的目录"""
    for directory in [config.UPLOAD_DIR, config.OUTPUT_DIR, config.STATIC_DIR]:
        Path(directory).mkdir(parents=True, exist_ok=True)

def image_to_base64(image_path: str) -> str:
    """将图像转换为base64"""
    with open(image_path, "rb") as img_file:
        return base64.b64encode(img_file.read()).decode('utf-8')

def base64_to_image(base64_string: str, output_path: str) -> str:
    """将base64转换为图像"""
    img_data = base64.b64decode(base64_string)
    with open(output_path, "wb") as f:
        f.write(img_data)
    return output_path

# ComfyUI 相关函数
async def send_workflow_to_comfyui(session: aiohttp.ClientSession, workflow: dict) -> Optional[str]:
    """发送工作流到ComfyUI并获取prompt_id"""
    async with session.post(f"{config.COMFYUI_SERVER}/api/prompt", json=workflow) as response:
        if response.status != 200:
            error_text = await response.text()
            logger.error(f"发送工作流到 ComfyUI 失败: {error_text}")
            return None
        
        prompt_response = await response.json()
        prompt_id = prompt_response.get('prompt_id')
        if not prompt_id:
            logger.error("未收到 prompt_id")
            return None
        
        logger.info(f"从 ComfyUI 获取到 prompt_id: {prompt_id}")
        return prompt_id

def calculate_progress(messages: List) -> float:
    """计算处理进度"""
    if not messages:
        return 0
    total_messages = len(messages)
    completed_messages = sum(1 for msg in messages if msg[0] in ['execution_cached', 'execution_success'])
    return completed_messages / total_messages if total_messages > 0 else 0

async def wait_for_comfyui_processing(session: aiohttp.ClientSession, prompt_id: str, session_id: str) -> bool:
    """等待ComfyUI处理完成并发送进度更新"""
    while True:
        async with session.get(f"{config.COMFYUI_SERVER}/api/history") as history_response:
            history_data = await history_response.json()
            queue_data = history_data.get(prompt_id, {})
            status = queue_data.get('status', {})
            
            if status.get('status_str') == 'success' and status.get('completed'):
                logger.info(f"ComfyUI 处理完成，prompt_id: {prompt_id}")
                return True
            elif status.get('status_str') == 'error':
                error_msg = status.get('error')
                logger.error(f"ComfyUI 处理出错: {error_msg}")
                return False
            
            # 发送进度更新
            if session := state.get_session(session_id):
                if session.websocket:
                    progress = calculate_progress(status.get('messages', []))
                    if config.ENV == Environment.DEVELOPMENT:
                        logger.debug(f"处理进度: {progress * 100:.1f}%")
                    
                    await session.websocket.send_json({
                        "status": "processing",
                        "progress": progress
                    })
            
            await asyncio.sleep(0.5)

def find_image_output(outputs: Dict) -> Optional[Dict]:
    """在输出中查找图像节点"""
    for node_id, node_output in outputs.items():
        if 'images' in node_output:
            return node_output['images'][0]
    return None

def construct_output_path(image_output: Dict) -> Optional[str]:
    """构建输出文件路径"""
    image_filename = image_output['filename']
    image_subfolder = image_output.get('subfolder', '')
    
    output_path = os.path.join(config.OUTPUT_DIR, image_filename)
    if image_subfolder:
        output_path = os.path.join(config.OUTPUT_DIR, image_subfolder, image_filename)
    
    if not os.path.exists(output_path):
        logger.error(f"输出文件不存在: {output_path}")
        return None
    
    return output_path

async def get_comfyui_result(session: aiohttp.ClientSession, prompt_id: str) -> Optional[str]:
    """获取ComfyUI处理结果"""
    async with session.get(f"{config.COMFYUI_SERVER}/api/history/{prompt_id}") as history_response:
        history_data = await history_response.json()
        
        if config.ENV == Environment.DEVELOPMENT:
            logger.debug(f"获取到历史记录: {json.dumps(history_data, indent=2)}")
        
        prompt_data = history_data.get(prompt_id, {})
        if not prompt_data:
            logger.error(f"未找到 prompt_id {prompt_id} 的数据")
            return None
            
        outputs = prompt_data.get('outputs', {})
        if not outputs:
            logger.error("历史记录中未找到输出")
            return None
        
        image_output = find_image_output(outputs)
        if not image_output:
            logger.error("未找到图像输出")
            return None
        
        return construct_output_path(image_output)

def create_comfyui_workflow(sketch_path: str, style_config: StyleConfig) -> dict:
    """根据风格配置创建ComfyUI工作流"""
    style_file = Path(config.WORKFLOW_DIR) / f"{style_config.style_name}.json"
    
    if not style_file.exists():
        style_file = Path(config.WORKFLOW_DIR) / "realistic.json"
    
    with open(style_file, 'r') as f:
        workflow = json.load(f)
    
    for node_id, node in workflow["prompt"].items():
        if node.get("class_type") == "LoadImage" and "inputs" in node and "image" in node["inputs"]:
            if node["inputs"]["image"] == "PLACEHOLDER_PATH":
                node["inputs"]["image"] = sketch_path
    
    return workflow

async def send_to_comfyui(sketch_path: str, style_config: StyleConfig, session_id: str) -> Optional[str]:
    """发送草图到ComfyUI并获取生成的图像"""
    try:
        logger.info(f"开始处理会话 {session_id} 的草图: {sketch_path}")
        workflow = create_comfyui_workflow(sketch_path, style_config)
        logger.info(f"已创建工作流，使用风格: {style_config.style_name}")
        
        async with aiohttp.ClientSession() as session:
            prompt_id = await send_workflow_to_comfyui(session, workflow)
            if not prompt_id:
                return None
            
            success = await wait_for_comfyui_processing(session, prompt_id, session_id)
            if not success:
                return None
            
            return await get_comfyui_result(session, prompt_id)
            
    except Exception as e:
        logger.error(f"处理过程中出错: {str(e)}")
        return None

# FastAPI 应用
app = FastAPI(
    title="Real-time Drawing API",
    description="API for real-time drawing with ComfyUI backend",
    version="1.0.0"
)

# 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# 静态文件
app.mount("/static", StaticFiles(directory=config.STATIC_DIR), name="static")

# API 路由
@app.get("/")
async def read_root():
    """返回前端页面"""
    return FileResponse("static/index.html")

@app.post("/api/sketch")
async def upload_sketch(
    file: UploadFile = File(...),
    style_name: str = Form("realistic"),
    session_id: Optional[str] = Form(None)
):
    """上传草图并开始处理"""
    try:
        logger.info(f"Received sketch upload request: style_name={style_name}, session_id={session_id}")
        
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        session_id = session_id or str(uuid.uuid4())
        style_config = StyleConfig(style_name=style_name)
        
        session = state.get_session(session_id) or state.create_session(session_id)
        session.style_config = style_config
        session.last_update = time.time()
        
        sketch_path = os.path.join(config.UPLOAD_DIR, f"{session_id}_{int(time.time())}.png")
        with open(sketch_path, "wb") as buffer:
            buffer.write(await file.read())
        
        session.sketch_path = sketch_path
        
        return JSONResponse({
            "session_id": session_id,
            "status": "uploaded",
            "message": "Sketch uploaded successfully",
            "websocket_url": f"/api/ws/{session_id}"
        })
    except Exception as e:
        logger.error(f"Error uploading sketch: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/styles")
async def get_styles():
    """获取可用的风格列表"""
    try:
        style_files = glob.glob(f"{config.WORKFLOW_DIR}/*.json")
        styles = [Path(f).stem for f in style_files]
        return JSONResponse({"styles": styles or ["realistic"]})
    except Exception as e:
        logger.error(f"Error getting styles: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/result/{session_id}")
async def get_result(session_id: str):
    """获取生成的图像结果"""
    session = state.get_session(session_id)
    if not session or not session.result_path:
        raise HTTPException(status_code=404, detail="Result not found")
    
    if not os.path.exists(session.result_path):
        raise HTTPException(status_code=404, detail="Result file not found")
    
    return FileResponse(session.result_path)

@app.websocket("/api/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """WebSocket连接，用于实时更新"""
    try:
        await websocket.accept()
        logger.info(f"WebSocket连接已建立: {session_id}")
        
        session = state.get_session(session_id)
        if not session:
            await websocket.close(code=1000, reason="Session not found")
            return
        
        session.websocket = websocket
        session.last_update = time.time()
        session.last_heartbeat = time.time()
        session.is_alive = True
        
        # 启动心跳检测任务
        heartbeat_task = asyncio.create_task(heartbeat_check(session_id))
        
        if session.sketch_path and not session.is_processing:
            asyncio.create_task(process_sketch_task(session_id))
        
        while True:
            try:
                data = await websocket.receive_text()
                message = WebSocketMessage.parse_raw(data)
                
                if message.type == "heartbeat":
                    session.last_heartbeat = time.time()
                    await websocket.send_json({"type": "heartbeat_ack"})
                elif message.type == "sketch_update" and message.sketch_data:
                    await handle_sketch_update(session, message)
                elif message.type == "comfyui_image" and message.image_data:
                    await handle_comfyui_image(session, message)
                    
            except json.JSONDecodeError:
                logger.error(f"无效的JSON消息: {session_id}")
                await websocket.send_json({
                    "status": "error",
                    "message": "无效的JSON消息"
                })
    except WebSocketDisconnect:
        logger.info(f"WebSocket连接已断开: {session_id}")
    except Exception as e:
        logger.error(f"WebSocket连接错误: {session_id}, {str(e)}")
    finally:
        if session := state.get_session(session_id):
            session.websocket = None
            session.is_alive = False
            # 取消心跳检测任务
            if 'heartbeat_task' in locals():
                heartbeat_task.cancel()

async def heartbeat_check(session_id: str):
    """WebSocket心跳检测"""
    while True:
        try:
            session = state.get_session(session_id)
            if not session or not session.is_alive:
                break
                
            current_time = time.time()
            if current_time - session.last_heartbeat > 30:  # 30秒无心跳则断开
                logger.warning(f"会话 {session_id} 心跳超时")
                if session.websocket:
                    await session.websocket.close(code=1000, reason="Heartbeat timeout")
                session.is_alive = False
                break
                
            await asyncio.sleep(10)  # 每10秒检查一次
        except Exception as e:
            logger.error(f"心跳检测错误: {session_id}, {str(e)}")
            break

async def handle_sketch_update(session: Session, message: WebSocketMessage):
    """处理草图更新"""
    try:
        sketch_data = message.sketch_data
        if sketch_data.startswith("data:image/"):
            sketch_data = sketch_data.split(",")[1]
        
        sketch_path = os.path.join(config.UPLOAD_DIR, f"{session.session_id}_{int(time.time())}.png")
        base64_to_image(sketch_data, sketch_path)
        
        session.sketch_path = sketch_path
        session.last_update = time.time()
        
        if not session.is_processing:
            asyncio.create_task(process_sketch_task(session.session_id))
    except Exception as e:
        logger.error(f"处理草图更新时出错: {str(e)}")
        if session.websocket:
            await session.websocket.send_json({
                "status": "error",
                "message": f"处理草图更新时出错: {str(e)}"
            })

async def handle_comfyui_image(session: Session, message: WebSocketMessage):
    """处理ComfyUI图像"""
    try:
        if not message.image_data.startswith("data:image/"):
            raise ValueError("图片数据格式错误")
        
        result_path = os.path.join(config.OUTPUT_DIR, f"{session.session_id}_{int(time.time())}.png")
        base64_to_image(message.image_data, result_path)
        
        session.result_path = result_path
        
        if session.websocket:
            await session.websocket.send_json({
                "status": "completed",
                "result_url": f"/api/result/{session.session_id}"
            })
    except Exception as e:
        logger.error(f"处理ComfyUI图像时出错: {str(e)}")
        if session.websocket:
            await session.websocket.send_json({
                "status": "error",
                "message": f"处理ComfyUI图像时出错: {str(e)}"
            })

async def process_sketch_task(session_id: str):
    """处理草图并生成图像的后台任务"""
    session = state.get_session(session_id)
    if not session or session.is_processing or not session.sketch_path:
        return
    
    try:
        session.is_processing = True
        
        if session.websocket:
            await session.websocket.send_json({
                "status": "processing",
                "message": "Processing sketch..."
            })
        
        result_path = await send_to_comfyui(session.sketch_path, session.style_config, session_id)
        
        if result_path:
            session.result_path = result_path
            if session.websocket:
                await session.websocket.send_json({
                    "status": "completed",
                    "result_url": f"/api/result/{session_id}"
                })
        else:
            if session.websocket:
                await session.websocket.send_json({
                    "status": "error",
                    "message": "Failed to generate image"
                })
    except Exception as e:
        logger.error(f"Error processing sketch: {str(e)}")
        if session.websocket:
            await session.websocket.send_json({
                "status": "error",
                "message": f"Error: {str(e)}"
            })
    finally:
        session.is_processing = False

# 启动和清理
@app.on_event("startup")
async def startup_event():
    """应用启动时的初始化"""
    create_required_directories()
    asyncio.create_task(cleanup_sessions())

async def cleanup_sessions():
    """定期清理过期会话"""
    while True:
        try:
            await state.cleanup_expired_sessions()
            # 检查系统资源使用情况
            await check_system_resources()
        except Exception as e:
            logger.error(f"清理会话时发生错误: {str(e)}")
        await asyncio.sleep(config.CLEANUP_INTERVAL)

async def check_system_resources():
    """检查系统资源使用情况"""
    try:
        process = psutil.Process()
        
        # 检查内存使用
        memory_percent = process.memory_percent()
        if memory_percent > 80:
            logger.warning(f"内存使用率过高: {memory_percent}%")
            # 强制清理一些会话
            await state.cleanup_expired_sessions()
        
        # 检查CPU使用
        cpu_percent = process.cpu_percent(interval=1)
        if cpu_percent > 80:
            logger.warning(f"CPU使用率过高: {cpu_percent}%")
    except Exception as e:
        logger.error(f"检查系统资源时发生错误: {str(e)}")

class SystemStatus(BaseModel):
    """系统状态模型"""
    cpu_percent: float
    memory_percent: float
    disk_percent: float
    active_sessions: int
    max_sessions: int
    uptime: float
    platform: str
    python_version: str

@app.get("/api/health")
async def health_check():
    """健康检查端点"""
    try:
        process = psutil.Process()
        system_status = SystemStatus(
            cpu_percent=process.cpu_percent(),
            memory_percent=process.memory_percent(),
            disk_percent=psutil.disk_usage('/').percent,
            active_sessions=len(state.active_sessions),
            max_sessions=config.MAX_ACTIVE_SESSIONS,
            uptime=time.time() - process.create_time(),
            platform=platform.platform(),
            python_version=platform.python_version()
        )
        
        # 检查关键指标
        is_healthy = (
            system_status.cpu_percent < 90 and
            system_status.memory_percent < 90 and
            system_status.disk_percent < 90 and
            system_status.active_sessions < config.MAX_ACTIVE_SESSIONS
        )
        
        return JSONResponse({
            "status": "healthy" if is_healthy else "unhealthy",
            "system_status": system_status.dict(),
            "timestamp": time.time()
        })
    except Exception as e:
        logger.error(f"健康检查失败: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": f"健康检查失败: {str(e)}",
                "timestamp": time.time()
            }
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)