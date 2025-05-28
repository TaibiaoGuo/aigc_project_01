from pydantic import BaseSettings
from typing import List
import os

class SecuritySettings(BaseSettings):
    """安全配置类"""
    
    # JWT配置
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # 速率限制配置
    RATE_LIMIT_WINDOW: int = 60  # 1分钟
    RATE_LIMIT_MAX_REQUESTS: int = 100  # 最大请求数
    
    # 文件上传配置
    MAX_FILE_SIZE: int = 5 * 1024 * 1024  # 5MB
    ALLOWED_FILE_TYPES: List[str] = [
        "image/jpeg",
        "image/png",
        "image/gif"
    ]
    
    # CORS配置
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000"
    ]
    CORS_METHODS: List[str] = ["*"]
    CORS_HEADERS: List[str] = ["*"]
    
    # 会话配置
    SESSION_TIMEOUT: int = 3600  # 1小时
    SESSION_CLEANUP_INTERVAL: int = 600  # 10分钟
    
    # IP白名单
    IP_WHITELIST: List[str] = [
        "127.0.0.1",
        "::1"
    ]
    
    # 安全头部配置
    SECURITY_HEADERS: dict = {
        "X-Frame-Options": "DENY",
        "X-Content-Type-Options": "nosniff",
        "X-XSS-Protection": "1; mode=block",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "Content-Security-Policy": "default-src 'self'"
    }
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# 创建全局配置实例
security_settings = SecuritySettings() 