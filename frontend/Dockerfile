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

# 确保目录结构正确，重命名中文资源文件
RUN mkdir -p /app/src/assets/images/icon \
    && ls -la /app/src/assets/images/ || echo "Images dir check failed" \
    && ls -la /app/src/assets/fonts/ || echo "Fonts dir check failed" \
    && ls -la /app/src/assets/images/icon/ || echo "Icons dir check failed" \
    # 确保英文名称字体文件存在，如果不存在则复制
    && if [ -f "/app/src/assets/fonts/A10时尚中黑简体.ttf" ] && [ ! -f "/app/src/assets/fonts/A10-FashionBlack.ttf" ]; then \
         cp /app/src/assets/fonts/A10时尚中黑简体.ttf /app/src/assets/fonts/A10-FashionBlack.ttf; \
       fi \
    && if [ -f "/app/src/assets/fonts/A77雁翎体简.ttf" ] && [ ! -f "/app/src/assets/fonts/A77-YanLingTiJian.ttf" ]; then \
         cp /app/src/assets/fonts/A77雁翎体简.ttf /app/src/assets/fonts/A77-YanLingTiJian.ttf; \
       fi \
    # 确保英文名称图标文件存在，如果不存在则复制
    && if [ -f "/app/src/assets/images/icon/橡皮擦.svg" ] && [ ! -f "/app/src/assets/images/icon/eraser.svg" ]; then \
         cp /app/src/assets/images/icon/橡皮擦.svg /app/src/assets/images/icon/eraser.svg; \
       fi \
    && if [ -f "/app/src/assets/images/icon/画笔.svg" ] && [ ! -f "/app/src/assets/images/icon/brush.svg" ]; then \
         cp /app/src/assets/images/icon/画笔.svg /app/src/assets/images/icon/brush.svg; \
       fi \
    && if [ -f "/app/src/assets/images/icon/确定.svg" ] && [ ! -f "/app/src/assets/images/icon/confirm.svg" ]; then \
         cp /app/src/assets/images/icon/确定.svg /app/src/assets/images/icon/confirm.svg; \
       fi \
    && if [ -f "/app/src/assets/images/icon/撤回.svg" ] && [ ! -f "/app/src/assets/images/icon/undo.svg" ]; then \
         cp /app/src/assets/images/icon/撤回.svg /app/src/assets/images/icon/undo.svg; \
       fi \
    && if [ -f "/app/src/assets/images/icon/开始.svg" ] && [ ! -f "/app/src/assets/images/icon/start.svg" ]; then \
         cp /app/src/assets/images/icon/开始.svg /app/src/assets/images/icon/start.svg; \
       fi \
    && if [ -f "/app/src/assets/images/icon/管理员模式.svg" ] && [ ! -f "/app/src/assets/images/icon/admin-mode.svg" ]; then \
         cp /app/src/assets/images/icon/管理员模式.svg /app/src/assets/images/icon/admin-mode.svg; \
       fi \
    && if [ -f "/app/src/assets/images/icon/快速登录.svg" ] && [ ! -f "/app/src/assets/images/icon/quick-login.svg" ]; then \
         cp /app/src/assets/images/icon/快速登录.svg /app/src/assets/images/icon/quick-login.svg; \
       fi \
    # 背景图片复制
    && if [ -f "/app/src/assets/images/创意中心骨架UI.png" ] && [ ! -f "/app/src/assets/images/ui-skeleton.png" ]; then \
         cp /app/src/assets/images/创意中心骨架UI.png /app/src/assets/images/ui-skeleton.png; \
       fi \
    && if [ -f "/app/src/assets/images/独特渐变.jpg" ] && [ ! -f "/app/src/assets/images/gradient.jpg" ]; then \
         cp /app/src/assets/images/独特渐变.jpg /app/src/assets/images/gradient.jpg; \
       fi

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
