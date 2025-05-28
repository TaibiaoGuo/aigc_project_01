# 部署文档

## 系统要求

### 1. 硬件要求

- CPU: 4核或更多
- 内存: 8GB或更多
- GPU: NVIDIA GPU（推荐）
- 存储: 20GB可用空间

### 2. 软件要求

- 操作系统: Linux/Windows/macOS
- Python 3.8+
- ComfyUI
- CUDA（如果使用GPU）

## 安装步骤

### 1. 安装Python依赖

```bash
# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/macOS
venv\Scripts\activate     # Windows

# 安装依赖
pip install -r requirements.txt
```

### 2. 配置ComfyUI

1. 安装ComfyUI
2. 确保ComfyUI服务正在运行
3. 配置工作流文件

### 3. 环境配置

创建 `.env` 文件：

```env
ENVIRONMENT=production
COMFYUI_URL=http://localhost:8188
MAX_WORKERS=4
SESSION_TIMEOUT=3600
CLEANUP_INTERVAL=600
```

## 部署方式

### 1. 直接部署

```bash
# 启动服务
python app.py
```

### 2. 使用Docker

```bash
# 构建镜像
docker build -t draw-api .

# 运行容器
docker run -d \
  -p 8000:8000 \
  -e ENVIRONMENT=production \
  -e COMFYUI_URL=http://comfyui:8188 \
  draw-api
```

### 3. 使用Docker Compose

```yaml
version: '3'
services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - ENVIRONMENT=production
      - COMFYUI_URL=http://comfyui:8188
    depends_on:
      - comfyui

  comfyui:
    image: comfyui
    ports:
      - "8188:8188"
```

## 监控和维护

### 1. 日志管理

- 配置日志轮转
- 设置日志级别
- 监控错误日志

### 2. 性能监控

- 监控CPU使用率
- 监控内存使用
- 监控GPU使用（如果适用）

### 3. 备份

- 定期备份工作流文件
- 备份配置文件
- 备份用户数据

## 安全配置

### 1. 防火墙设置

```bash
# 开放必要端口
sudo ufw allow 8000
sudo ufw allow 8188
```

### 2. SSL配置

```bash
# 使用Let's Encrypt
certbot --nginx -d your-domain.com
```

### 3. 访问控制

- 配置IP白名单
- 设置访问限制
- 实现认证机制

## 故障排除

### 1. 服务无法启动

- 检查端口占用
- 验证环境变量
- 检查日志文件

### 2. 性能问题

- 检查资源使用
- 优化配置参数
- 调整并发设置

### 3. 连接问题

- 验证网络连接
- 检查防火墙设置
- 确认服务状态

## 更新流程

1. 备份当前版本
2. 拉取最新代码
3. 更新依赖
4. 运行测试
5. 重启服务

## 回滚流程

1. 停止当前服务
2. 恢复备份
3. 重启服务

## 维护计划

### 1. 日常维护

- 检查日志
- 监控性能
- 清理临时文件

### 2. 定期维护

- 更新依赖
- 检查安全更新
- 优化配置

### 3. 应急维护

- 处理紧急问题
- 实施安全补丁
- 恢复服务 