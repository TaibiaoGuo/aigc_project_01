# 构建阶段
FROM node:18-alpine as builder

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm@8.6.2

# 设置环境变量确保非交互模式
ENV CI=true
ENV NODE_OPTIONS=--max_old_space_size=4096

# 复制 package.json 和 pnpm-lock.yaml（如果存在）
COPY package.json pnpm-lock.yaml* ./

# 安装依赖
RUN pnpm install

# 复制源代码
COPY . .

# 确保资源目录存在
RUN mkdir -p /app/src/assets/images

# 设置构建时的环境变量
ARG VITE_BACKEND_URL
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL:-http://backend:8000}

# 构建项目
RUN pnpm build

# 运行阶段
FROM nginx:1.25-alpine

# 从构建阶段复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 覆盖默认站点配置，实现 /api 反向代理
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template

# 设置运行时的环境变量
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL:-http://backend:8000}

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
