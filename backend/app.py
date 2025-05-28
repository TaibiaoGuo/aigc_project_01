import os
import json
import uuid
import asyncio
import aiohttp
import websockets
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import numpy as np
import cv2
from PIL import Image
import io
import base64
import time
import logging
from concurrent.futures import ThreadPoolExecutor
import glob

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 创建FastAPI应用
app = FastAPI(title="Real-time Drawing API", description="API for real-time drawing with ComfyUI backend")

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有来源，生产环境中应该限制
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# 挂载静态文件目录
app.mount("/static", StaticFiles(directory="static"), name="static")

# ComfyUI服务器配置
COMFYUI_SERVER = os.environ.get("COMFYUI_SERVER", "http://127.0.0.1:8188")

# 存储用户会话
active_sessions = {}

# 存储WebSocket连接
connected_clients = {}

# 线程池执行器，用于处理图像生成任务
executor = ThreadPoolExecutor(max_workers=4)  # 根据GPU能力调整

# 风格配置
class StyleConfig(BaseModel):
    style_name: str = "realistic"  # 默认风格

# 会话状态
class SessionState:
    def __init__(self, session_id: str, style_config: StyleConfig):
        self.session_id = session_id
        self.style_config = style_config
        self.sketch_path = None
        self.result_path = None
        self.is_processing = False
        self.last_update = time.time()
        self.websocket = None

# 创建工作目录
os.makedirs("uploads", exist_ok=True)
os.makedirs("results", exist_ok=True)
os.makedirs("static", exist_ok=True)

# 辅助函数：将图像转换为base64
def image_to_base64(image_path):
    with open(image_path, "rb") as img_file:
        return base64.b64encode(img_file.read()).decode('utf-8')

# 辅助函数：将base64转换为图像
def base64_to_image(base64_string, output_path):
    img_data = base64.b64decode(base64_string)
    with open(output_path, "wb") as f:
        f.write(img_data)
    return output_path

# 与ComfyUI通信的函数
async def send_to_comfyui(sketch_path, style_config, session_id):
    """发送草图到ComfyUI并获取生成的图像"""
    try:
        logger.info(f"开始处理会话 {session_id} 的草图: {sketch_path}")
        # 构建ComfyUI工作流
        workflow = create_comfyui_workflow(sketch_path, style_config)
        logger.info(f"已创建工作流，使用风格: {style_config.style_name}")
        
        # 发送请求到ComfyUI
        async with aiohttp.ClientSession() as session:
            # 1. 发送工作流
            logger.info(f"正在发送工作流到 ComfyUI: {COMFYUI_SERVER}/api/prompt")
            async with session.post(f"{COMFYUI_SERVER}/api/prompt", json=workflow) as response:
                if response.status != 200:
                    error_text = await response.text()
                    logger.error(f"发送工作流到 ComfyUI 失败: {error_text}")
                    return None
                
                prompt_response = await response.json()
                prompt_id = prompt_response.get('prompt_id')
                logger.info(f"从 ComfyUI 获取到 prompt_id: {prompt_id}")
                
                if not prompt_id:
                    logger.error("未收到 prompt_id")
                    return None
                
                # 2. 等待处理完成
                logger.info(f"开始等待 ComfyUI 处理完成，prompt_id: {prompt_id}")
                while True:
                    async with session.get(f"{COMFYUI_SERVER}/api/history") as history_response:
                        history_data = await history_response.json()
                        queue_data = history_data.get(prompt_id, {})
                        status = queue_data.get('status', {})
                        
                        # 添加状态检查日志
                        logger.info(f"当前状态: {json.dumps(status, indent=2)}")
                        
                        if status.get('status') == 'completed':
                            logger.info(f"ComfyUI 处理完成，prompt_id: {prompt_id}")
                            break
                        elif status.get('status') == 'error':
                            error_msg = status.get('error')
                            logger.error(f"ComfyUI 处理出错: {error_msg}")
                            return None
                        
                        # 发送进度更新
                        if session_id in active_sessions and active_sessions[session_id].websocket:
                            queue_data = history_data.get(prompt_id, {})
                            running_prompts = queue_data.get('running_prompts', {})
                            prompt_data = running_prompts.get(prompt_id, {})
                            progress = prompt_data.get('progress', 0)
                            
                            # 添加详细的调试日志
                            logger.debug(f"队列数据: {json.dumps(queue_data, indent=2)}")
                            logger.debug(f"运行中的提示: {json.dumps(running_prompts, indent=2)}")
                            logger.debug(f"当前提示数据: {json.dumps(prompt_data, indent=2)}")
                            logger.debug(f"处理进度: {progress * 100:.1f}%")
                            
                            await active_sessions[session_id].websocket.send_json({
                                "status": "processing",
                                "progress": progress
                            })
                        
                        await asyncio.sleep(0.5)
                
                # 3. 获取结果
                logger.info(f"正在获取处理结果，prompt_id: {prompt_id}")
                async with session.get(f"{COMFYUI_SERVER}/api/history/{prompt_id}") as history_response:
                    history_data = await history_response.json()
                    
                    # 从历史记录中提取图像节点的输出
                    outputs = history_data.get('outputs', {})
                    if not outputs:
<<<<<<< HEAD
                        # 检查是否有 WebSocket 输出
                        for node_id, node in workflow["prompt"].items():
                            if node.get("class_type") == "ETN_SendImageWebSocket":
                                # 如果使用 WebSocket 节点，直接返回成功
                                result_path = f"results/{session_id}_{int(time.time())}.png"
                                # 创建一个空文件作为占位符
                                with open(result_path, 'wb') as f:
                                    f.write(b'')
                                return result_path
                        logger.error("No outputs found in history")
=======
                        logger.error("历史记录中未找到输出")
>>>>>>> aea2954... feature:增强日志记录功能，添加详细的调试信息和错误处理提示，以便更好地跟踪 ComfyUI 处理过程中的状态和输出。
                        return None
                    
                    # 找到图像节点的输出
                    image_output = None
                    for node_id, node_output in outputs.items():
                        if 'images' in node_output:
                            image_output = node_output['images'][0]
                            break
                    
                    if not image_output:
                        logger.error("未找到图像输出")
                        return None
                    
                    # 下载图像
                    image_filename = image_output['filename']
                    image_subfolder = image_output.get('subfolder', '')
<<<<<<< HEAD
                    image_url = f"{COMFYUI_SERVER}/view?filename={image_filename}&subfolder={image_subfolder}"
                    
                    async with session.get(image_url) as img_response:
                        if img_response.status != 200:
                            logger.error(f"Error downloading image: {await img_response.text()}")
                            return None
                        
                        # 保存图像
                        result_path = f"results/{session_id}_{int(time.time())}.png"
                        with open(result_path, 'wb') as f:
                            f.write(await img_response.read())
                        
                        return result_path
=======
                    logger.info(f"图像文件名: {image_filename}, 子文件夹: {image_subfolder}")
                    
                    # 构建完整的输出文件路径
                    output_path = os.path.join("output", image_filename)
                    if image_subfolder:
                        output_path = os.path.join("output", image_subfolder, image_filename)
                    logger.info(f"完整输出路径: {output_path}")
                    
                    # 检查文件是否存在
                    if not os.path.exists(output_path):
                        logger.error(f"输出文件不存在: {output_path}")
                        return None
                    
                    # 复制文件到会话特定的位置
                    result_path = f"output/{session_id}_{int(time.time())}.png"
                    import shutil
                    shutil.copy2(output_path, result_path)
                    logger.info(f"图像已复制到: {result_path}")
                    
                    return result_path
>>>>>>> aea2954... feature:增强日志记录功能，添加详细的调试信息和错误处理提示，以便更好地跟踪 ComfyUI 处理过程中的状态和输出。
    except Exception as e:
        logger.error(f"处理过程中出错: {str(e)}")
        return None

# 创建ComfyUI工作流
def create_comfyui_workflow(sketch_path, style_config):
    """根据风格配置创建ComfyUI工作流"""
    # 获取对应风格的工作流JSON文件
    style_file = f"workflow/{style_config.style_name}.json"
    
    # 如果风格文件不存在，使用默认风格
    if not os.path.exists(style_file):
        style_file = "workflow/realistic.json"
    
    # 读取工作流JSON文件
    with open(style_file, 'r') as f:
        workflow = json.load(f)
    
    # 替换工作流中的图像路径占位符
    for node_id, node in workflow["prompt"].items():
        if node.get("class_type") == "LoadImage" and "inputs" in node and "image" in node["inputs"]:
            if node["inputs"]["image"] == "PLACEHOLDER_PATH":
                node["inputs"]["image"] = sketch_path
    
    return workflow

# 后台任务：处理草图
async def process_sketch_task(session_id: str):
    """处理草图并生成图像的后台任务"""
    if session_id not in active_sessions:
        logger.error(f"Session {session_id} not found")
        return
    
    session = active_sessions[session_id]
    if session.is_processing or not session.sketch_path:
        return
    
    try:
        session.is_processing = True
        
        # 通知客户端开始处理
        if session.websocket:
            await session.websocket.send_json({
                "status": "processing",
                "message": "Processing sketch..."
            })
        
        # 直接发送到ComfyUI处理，不进行预处理
        result_path = await send_to_comfyui(session.sketch_path, session.style_config, session_id)
        
        if result_path:
            session.result_path = result_path
            
            # 通知客户端处理完成
            if session.websocket:
                await session.websocket.send_json({
                    "status": "completed",
                    "result_url": f"/api/result/{session_id}"
                })
        else:
            # 通知客户端处理失败
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

# API路由
@app.get("/")
async def read_root():
    """返回前端页面"""
    return FileResponse("static/index.html")
# 上传草图
@app.post("/api/sketch")
async def upload_sketch(
    file: UploadFile = File(...),
    style_name: str = Form("realistic"),
    session_id: Optional[str] = Form(None)
):
    """上传草图并开始处理"""
    try:
        logger.info(f"Received sketch upload request: style_name={style_name}, session_id={session_id}")
        
        # 验证文件类型
        if not file.content_type.startswith('image/'):
            logger.error(f"Invalid file type: {file.content_type}")
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # 创建或获取会话ID
        if not session_id:
            session_id = str(uuid.uuid4())
            logger.info(f"Generated new session_id: {session_id}")
        
        # 创建风格配置
        style_config = StyleConfig(
            style_name=style_name
        )
        
        # 创建或更新会话
        if session_id not in active_sessions:
            active_sessions[session_id] = SessionState(session_id, style_config)
            logger.info(f"Created new session: {session_id}")
        else:
            active_sessions[session_id].style_config = style_config
            active_sessions[session_id].last_update = time.time()
            logger.info(f"Updated existing session: {session_id}")
        
        # 保存上传的草图
        sketch_path = f"uploads/{session_id}_{int(time.time())}.png"
        with open(sketch_path, "wb") as buffer:
            buffer.write(await file.read())
        logger.info(f"Saved sketch to: {sketch_path}")
        
        active_sessions[session_id].sketch_path = sketch_path
        
        # 返回会话信息
        return JSONResponse({
            "session_id": session_id,
            "status": "uploaded",
            "message": "Sketch uploaded successfully",
            "websocket_url": f"/api/ws/{session_id}"
        })
    except Exception as e:
        logger.error(f"Error uploading sketch: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# 获取生成的图像结果
@app.get("/api/styles")
async def get_styles():
    """获取可用的风格列表"""
    try:
        # 获取workflow目录下的所有JSON文件
        style_files = glob.glob("workflow/*.json")
        styles = [os.path.basename(f).replace(".json", "") for f in style_files]
        
        # 如果没有找到风格文件，返回默认风格
        if not styles:
            styles = ["realistic"]
        
        return JSONResponse({
            "styles": styles
        })
    except Exception as e:
        logger.error(f"Error getting styles: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/result/{session_id}")
async def get_result(session_id: str):
    """获取生成的图像结果"""
    if session_id not in active_sessions or not active_sessions[session_id].result_path:
        raise HTTPException(status_code=404, detail="Result not found")
    
    result_path = active_sessions[session_id].result_path
    return FileResponse(result_path)

@app.websocket("/api/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """WebSocket连接，用于实时更新"""
    try:
        await websocket.accept()
        logger.info("connection open")
        
        if session_id not in active_sessions:
            await websocket.close(code=1000, reason="Session not found")
            return
        
        session = active_sessions[session_id]
        session.websocket = websocket
        session.last_update = time.time()
        
        # 如果已有草图，开始处理
        if session.sketch_path and not session.is_processing:
            asyncio.create_task(process_sketch_task(session_id))
        
        # 等待消息
        while True:
            try:
                data = await websocket.receive_text()
                logger.info(f"Received WebSocket message for session {session_id}: {data}")
                message = json.loads(data)
                
                # 处理客户端消息
                if message.get("type") == "sketch_update" and "sketch_data" in message:
                    logger.info(f"Processing sketch update for session {session_id}")
                    # 保存更新的草图
                    sketch_data = message["sketch_data"]
                    if sketch_data.startswith("data:image/"):
                        # 从base64数据中提取图像
                        sketch_data = sketch_data.split(",")[1]
                    
                    sketch_path = f"uploads/{session_id}_{int(time.time())}.png"
                    base64_to_image(sketch_data, sketch_path)
                    logger.info(f"Saved updated sketch to: {sketch_path}")
                    
                    active_sessions[session_id].sketch_path = sketch_path
                    active_sessions[session_id].last_update = time.time()
                    
                    # 开始处理新草图
                    if not active_sessions[session_id].is_processing:
                        logger.info(f"Starting processing of updated sketch for session {session_id}")
                        asyncio.create_task(process_sketch_task(session_id))
                elif message.get("type") == "comfyui_image":
                    # 处理从 ComfyUI 接收到的图像
                    image_data = message.get("image_data")
                    if image_data:
                        # 保存图像
                        result_path = f"results/{session_id}_{int(time.time())}.png"
                        base64_to_image(image_data, result_path)
                        logger.info(f"Saved ComfyUI image to: {result_path}")
                        
                        # 更新会话状态
                        session.result_path = result_path
                        
                        # 通知客户端处理完成
                        await websocket.send_json({
                            "status": "completed",
                            "result_url": f"/api/result/{session_id}"
                        })
            except json.JSONDecodeError:
                logger.error(f"Invalid JSON message received for session {session_id}")
                await websocket.send_json({
                    "status": "error",
                    "message": "Invalid JSON message"
                })
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for session {session_id}")
    except Exception as e:
        logger.error(f"Error in WebSocket connection for session {session_id}: {str(e)}")
    finally:
        if session_id in active_sessions:
            active_sessions[session_id].websocket = None

# 定期清理过期会话
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(cleanup_sessions())

async def cleanup_sessions():
    """定期清理过期会话"""
    while True:
        try:
            current_time = time.time()
            expired_sessions = []
            
            for session_id, session in active_sessions.items():
                # 超过1小时的会话视为过期
                if current_time - session.last_update > 3600:
                    expired_sessions.append(session_id)
            
            # 删除过期会话
            for session_id in expired_sessions:
                if session_id in active_sessions:
                    del active_sessions[session_id]
                    logger.info(f"Cleaned up expired session {session_id}")
        except Exception as e:
            logger.error(f"Error in cleanup_sessions: {str(e)}")
        
        # 每10分钟检查一次
        await asyncio.sleep(600)

# 主函数
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)