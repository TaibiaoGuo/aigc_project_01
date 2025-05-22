#!/bin/sh

# 如果运行时提供了VITE_BACKEND_URL环境变量，则替换dist中的配置
if [ ! -z "$VITE_BACKEND_URL" ]; then
  echo "Using runtime VITE_BACKEND_URL: $VITE_BACKEND_URL"
  # 查找所有JS文件并替换VITE_BACKEND_URL的值
  find /app/dist -type f -name "*.js" -exec sed -i "s|VITE_BACKEND_URL:\"[^\"]*\"|VITE_BACKEND_URL:\"$VITE_BACKEND_URL\"|g" {} \;
fi

# 执行传入的命令
exec "$@"