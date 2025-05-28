from pydantic import BaseSettings
import os
from typing import Dict, Any

class MonitoringSettings(BaseSettings):
    """监控配置类"""
    
    # 日志配置
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    LOG_FILE: str = "logs/app.log"
    LOG_MAX_SIZE: int = 10 * 1024 * 1024  # 10MB
    LOG_BACKUP_COUNT: int = 5
    
    # 性能监控配置
    ENABLE_PERFORMANCE_MONITORING: bool = True
    METRICS_INTERVAL: int = 60  # 60秒
    METRICS_RETENTION_DAYS: int = 7
    
    # 错误跟踪配置
    ENABLE_ERROR_TRACKING: bool = True
    ERROR_NOTIFICATION_EMAIL: str = os.getenv("ERROR_NOTIFICATION_EMAIL", "")
    
    # 资源监控配置
    ENABLE_RESOURCE_MONITORING: bool = True
    RESOURCE_CHECK_INTERVAL: int = 300  # 5分钟
    RESOURCE_THRESHOLD: Dict[str, float] = {
        "cpu_percent": 80.0,
        "memory_percent": 80.0,
        "disk_percent": 80.0
    }
    
    # 请求监控配置
    ENABLE_REQUEST_MONITORING: bool = True
    REQUEST_TIMEOUT: int = 30  # 30秒
    SLOW_REQUEST_THRESHOLD: int = 5  # 5秒
    
    # 监控端点配置
    METRICS_ENDPOINT: str = "/metrics"
    HEALTH_ENDPOINT: str = "/health"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# 创建全局配置实例
monitoring_settings = MonitoringSettings() 