from fastapi import Request, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, List
import time
import jwt
from datetime import datetime, timedelta
import os
from functools import wraps

# 安全配置
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# 速率限制配置
RATE_LIMIT_WINDOW = 60  # 1分钟
RATE_LIMIT_MAX_REQUESTS = 100  # 最大请求数

# 请求计数器
request_counts = {}

class RateLimitMiddleware:
    """请求速率限制中间件"""
    
    async def __call__(self, request: Request, call_next):
        client_ip = request.client.host
        current_time = time.time()
        
        # 清理过期的请求记录
        if client_ip in request_counts:
            request_counts[client_ip] = [
                t for t in request_counts[client_ip]
                if current_time - t < RATE_LIMIT_WINDOW
            ]
        
        # 检查请求次数
        if client_ip in request_counts and len(request_counts[client_ip]) >= RATE_LIMIT_MAX_REQUESTS:
            raise HTTPException(status_code=429, detail="请求过于频繁，请稍后再试")
        
        # 记录请求
        if client_ip not in request_counts:
            request_counts[client_ip] = []
        request_counts[client_ip].append(current_time)
        
        return await call_next(request)

class SecurityMiddleware:
    """安全中间件"""
    
    def __init__(self):
        self.security = HTTPBearer()
    
    async def __call__(self, request: Request, call_next):
        # 跳过不需要认证的路径
        if request.url.path in ["/health", "/docs", "/redoc", "/openapi.json"]:
            return await call_next(request)
        
        try:
            # 验证token
            auth = await self.security(request)
            if not self.verify_token(auth.credentials):
                raise HTTPException(status_code=401, detail="无效的认证信息")
        except Exception as e:
            raise HTTPException(status_code=401, detail=str(e))
        
        return await call_next(request)
    
    def verify_token(self, token: str) -> bool:
        """验证JWT token"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return True
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token已过期")
        except jwt.JWTError:
            raise HTTPException(status_code=401, detail="无效的Token")

def create_access_token(data: dict) -> str:
    """创建访问令牌"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_file_type(file_content: bytes, allowed_types: List[str]) -> bool:
    """验证文件类型"""
    import magic
    
    mime = magic.Magic(mime=True)
    file_type = mime.from_buffer(file_content)
    return file_type in allowed_types

def verify_file_size(file_size: int, max_size: int) -> bool:
    """验证文件大小"""
    return file_size <= max_size

def require_auth(func):
    """认证装饰器"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        request = kwargs.get('request')
        if not request:
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
        
        if not request:
            raise HTTPException(status_code=500, detail="无法获取请求对象")
        
        try:
            auth = await HTTPBearer()(request)
            if not SecurityMiddleware().verify_token(auth.credentials):
                raise HTTPException(status_code=401, detail="无效的认证信息")
        except Exception as e:
            raise HTTPException(status_code=401, detail=str(e))
        
        return await func(*args, **kwargs)
    return wrapper 