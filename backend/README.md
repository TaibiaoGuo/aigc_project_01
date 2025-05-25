# 实时绘画 API

基于ComfyUI的实时绘画API服务，支持用户在Web前端实时绘制线稿并生成图像预览。

## 功能特点

- 提供两个主要HTTP API端点：上传草图和获取结果
- 使用WebSocket实现实时预览和状态更新
- 支持多用户同时请求
- 利用GPU后端进行图像生成
- 支持选择不同的绘画风格（通过预定义的ComfyUI工作流）

## 系统架构

```
用户 Web 前端 <---> 实时绘画 API <---> ComfyUI 后端
```

- **用户 Web 前端**：用户在此绘制线稿，并实时接收生成的图像
- **实时绘画 API**：处理用户请求，管理会话，与ComfyUI通信
- **ComfyUI 后端**：执行实际的图像生成任务

## 安装要求

- Python 3.8+
- ComfyUI 已安装并运行
- GPU 支持（推荐 NVIDIA GPU 以获得更好性能）

## 安装步骤

1. 克隆本仓库：

```bash
git clone https://github.com/yourusername/draw-api.git
cd draw-api
```

2. 安装依赖：

```bash
pip install -r requirements.txt
```

3. 确保ComfyUI已经安装并运行在默认端口（8188）。如果ComfyUI运行在不同的地址，请通过环境变量设置：

```bash
export COMFYUI_SERVER="http://your-comfyui-address:port"
```

4. 创建风格工作流目录并添加至少一个风格工作流文件：

```bash
mkdir -p workflow
```

## 启动服务

```bash
python app.py
```

服务将在 `http://localhost:8000` 上运行。

## API 文档

### 1. 上传草图 API

**端点**：`POST /api/sketch`

**参数**：
- `file`：草图图像文件（必需）
- `style`：选择的风格名称，对应 workflow 目录下的 JSON 文件名（可选，默认为 "realistic"）
- `session_id`：会话ID（可选，如不提供则自动生成）

**响应**：
```json
{
  "session_id": "unique-session-id",
  "status": "uploaded",
  "message": "Sketch uploaded successfully",
  "websocket_url": "/api/ws/unique-session-id"
}
```

### 2. 获取可用风格 API

**端点**：`GET /api/styles`

**响应**：
```json
{
  "styles": ["realistic", "anime", "watercolor", "sketch"]
}
```

### 3. 获取结果 API

**端点**：`GET /api/result/{session_id}`

**参数**：
- `session_id`：会话ID（URL路径参数）

**响应**：生成的图像文件

### 4. WebSocket 实时更新

**端点**：`WebSocket /api/ws/{session_id}`

**功能**：
- 接收实时处理状态更新
- 发送草图更新以触发新的图像生成

**客户端发送消息格式**：
```json
{
  "type": "sketch_update",
  "sketch_data": "base64编码的图像数据",
  "style": "realistic"  // 可选，指定风格
}
```

**服务器发送消息格式**：
```json
// 处理中状态
{
  "status": "processing",
  "progress": 0.5  // 处理进度，0-1之间的值
}

// 完成状态
{
  "status": "completed",
  "result_url": "/api/result/session-id"
}

// 错误状态
{
  "status": "error",
  "message": "错误信息"
}
```

## 前端集成示例

```javascript
// 创建WebSocket连接
const ws = new WebSocket(`ws://localhost:8000/api/ws/${sessionId}`);

// 监听WebSocket消息
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.status === 'processing') {
    // 更新进度条
    updateProgressBar(data.progress);
  } else if (data.status === 'completed') {
    // 显示生成的图像
    displayImage(data.result_url);
  } else if (data.status === 'error') {
    // 显示错误信息
    showError(data.message);
  }
};

// 发送草图更新
function sendSketchUpdate(sketchDataUrl, style) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'sketch_update',
      sketch_data: sketchDataUrl,
      style: style
    }));
  }
}

// 监听画布更新并发送
canvas.addEventListener('mouseup', () => {
  const sketchDataUrl = canvas.toDataURL('image/png');
  const selectedStyle = document.getElementById('style-selector').value;
  sendSketchUpdate(sketchDataUrl, selectedStyle);
});
```

## 自定义风格

您可以通过在 `workflow` 目录中添加自定义的 ComfyUI 工作流 JSON 文件来创建新的风格：

1. 在 ComfyUI 中创建并保存您的工作流
2. 将生成的 JSON 文件保存到 `workflow` 目录，文件名将作为风格名称（例如 `watercolor.json`）
3. 确保工作流中包含必要的节点，如 `LoadImage`、`VAEEncode`、`KSampler` 等
4. 重启服务以加载新的风格

## 配置选项

服务配置可以通过环境变量进行设置：

- `COMFYUI_SERVER`：ComfyUI服务器地址，默认为 "http://127.0.0.1:8188"

## 性能优化

- 调整 `ThreadPoolExecutor` 的 `max_workers` 参数以匹配您的GPU能力
- 对于高负载场景，考虑使用多个GPU或分布式部署

## 故障排除

1. **无法连接到ComfyUI**：确保ComfyUI服务正在运行，并检查COMFYUI_SERVER环境变量设置是否正确

2. **图像生成失败**：检查ComfyUI日志以获取详细错误信息

3. **WebSocket连接断开**：检查网络连接，并确保客户端和服务器之间没有防火墙阻止WebSocket通信

4. **风格文件加载失败**：确保 `workflow` 目录中的 JSON 文件格式正确，并且包含所有必要的节点

## 版权声明

长沙云边智算科技有限责任公司（以下简称"公司"）拥有本项目的版权。
本项目受中国版权法保护，任何未经授权的复制、分发、修改或使用都将受到法律追究。
请在使用本项目前仔细阅读并遵守相关法律和政策。

联系邮箱：info@k8ace.com