from typing import List, Optional
import re
import magic
from fastapi import HTTPException
from .config import security_settings

class SecurityValidator:
    """安全验证器类"""
    
    @staticmethod
    def validate_ip(ip: str) -> bool:
        """验证IP地址是否在白名单中"""
        return ip in security_settings.IP_WHITELIST
    
    @staticmethod
    def validate_file_type(file_content: bytes) -> bool:
        """验证文件类型"""
        try:
            mime = magic.Magic(mime=True)
            file_type = mime.from_buffer(file_content)
            return file_type in security_settings.ALLOWED_FILE_TYPES
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"文件类型验证失败: {str(e)}")
    
    @staticmethod
    def validate_file_size(file_size: int) -> bool:
        """验证文件大小"""
        if file_size > security_settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"文件大小超过限制: {file_size} > {security_settings.MAX_FILE_SIZE}"
            )
        return True
    
    @staticmethod
    def validate_session_id(session_id: str) -> bool:
        """验证会话ID格式"""
        if not re.match(r"^[a-zA-Z0-9-_]{1,64}$", session_id):
            raise HTTPException(status_code=400, detail="无效的会话ID格式")
        return True
    
    @staticmethod
    def validate_style_name(style_name: str) -> bool:
        """验证样式名称"""
        if not re.match(r"^[a-zA-Z0-9-_]{1,32}$", style_name):
            raise HTTPException(status_code=400, detail="无效的样式名称格式")
        return True
    
    @staticmethod
    def validate_websocket_message(message: dict) -> bool:
        """验证WebSocket消息格式"""
        required_fields = ["type"]
        if not all(field in message for field in required_fields):
            raise HTTPException(status_code=400, detail="消息格式无效")
        
        if message["type"] == "sketch_update":
            if "sketch_data" not in message:
                raise HTTPException(status_code=400, detail="缺少sketch_data字段")
            if not isinstance(message["sketch_data"], str):
                raise HTTPException(status_code=400, detail="sketch_data必须是字符串")
        
        return True
    
    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """清理文件名"""
        # 移除路径分隔符
        filename = re.sub(r'[\\/]', '', filename)
        # 移除特殊字符
        filename = re.sub(r'[^\w\-\.]', '', filename)
        return filename
    
    @staticmethod
    def validate_origin(origin: str) -> bool:
        """验证请求来源"""
        return origin in security_settings.CORS_ORIGINS
    
    @staticmethod
    def validate_content_type(content_type: str) -> bool:
        """验证Content-Type"""
        return content_type in security_settings.ALLOWED_FILE_TYPES
    
    @staticmethod
    def validate_request_headers(headers: dict) -> bool:
        """验证请求头"""
        required_headers = ["User-Agent"]
        if not all(header in headers for header in required_headers):
            raise HTTPException(status_code=400, detail="缺少必要的请求头")
        return True

# 创建全局验证器实例
security_validator = SecurityValidator() 