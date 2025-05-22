# 基础镜像只需要 nginx
FROM nginx:1.25-alpine

# 把预先生成的 dist 拷进 nginx 默认站点
COPY ./dist /usr/share/nginx/html

# 覆盖默认站点配置，实现 /api 反向代理
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template

ENV VITE_BACKEND_URL=http://127.0.0.1:8080

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
