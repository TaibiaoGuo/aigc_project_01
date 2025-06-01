FROM python:3.9-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/requirements.txt

# 添加 pip 镜像源
ENV PIP_INDEX_URL=https://pypi.tuna.tsinghua.edu.cn/simple
# 安装Python依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制项目文件
COPY . /app/

# 创建必要的目录
RUN mkdir -p input static

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["python", "app.py"]
