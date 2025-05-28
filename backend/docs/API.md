# API 文档

## 概述

实时绘画API提供了一系列HTTP和WebSocket接口，用于处理实时绘画请求和状态更新。

## 基础信息

- 基础URL: `http://localhost:8000`
- 所有响应格式: JSON
- 认证方式: 无（开发版本）

## HTTP API

### 1. 健康检查

检查服务是否正常运行。

- **URL**: `/health`
- **方法**: `GET`
- **响应**:
  ```json
  {
    "status": "ok"
  }
  ```

### 2. 上传草图

上传用户绘制的草图。

- **URL**: `/upload-sketch`
- **方法**: `POST`
- **参数**:
  - `file`: 草图图像文件（必需）
  - `session_id`: 会话ID（可选）
- **响应**:
  ```json
  {
    "session_id": "unique-session-id",
    "sketch_path": "/path/to/sketch.png"
  }
  ```

### 3. 获取样式配置

获取当前可用的样式配置。

- **URL**: `/style-config`
- **方法**: `GET`
- **响应**:
  ```json
  {
    "style_name": "current-style",
    "style_config": {
      "param1": "value1",
      "param2": "value2"
    }
  }
  ```

### 4. 更新样式配置

更新当前使用的样式配置。

- **URL**: `/style-config`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "style_name": "new-style",
    "style_config": {
      "param1": "value1",
      "param2": "value2"
    }
  }
  ```
- **响应**:
  ```json
  {
    "style_name": "new-style",
    "style_config": {
      "param1": "value1",
      "param2": "value2"
    }
  }
  ```

### 5. 获取会话状态

获取指定会话的处理状态。

- **URL**: `/session/{session_id}/status`
- **方法**: `GET`
- **响应**:
  ```json
  {
    "status": "processing",
    "progress": 0.5,
    "result": null
  }
  ```

## WebSocket API

### 1. 实时状态更新

- **URL**: `ws://localhost:8000/ws/{session_id}`
- **功能**: 接收实时处理状态更新
- **消息格式**:
  ```json
  {
    "status": "processing",
    "progress": 0.5
  }
  ```

### 2. 发送草图更新

- **URL**: `ws://localhost:8000/ws/{session_id}`
- **功能**: 发送草图更新以触发新的图像生成
- **消息格式**:
  ```json
  {
    "type": "sketch_update",
    "sketch_data": "base64-encoded-image-data",
    "style": "style-name"
  }
  ```

## 错误处理

所有API在发生错误时都会返回以下格式的响应：

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述"
  }
}
```

常见错误代码：
- `INVALID_REQUEST`: 请求参数无效
- `SESSION_NOT_FOUND`: 会话不存在
- `PROCESSING_ERROR`: 处理过程中发生错误
- `STYLE_NOT_FOUND`: 请求的样式不存在

## 状态码

- 200: 成功
- 400: 请求参数错误
- 404: 资源不存在
- 500: 服务器内部错误 