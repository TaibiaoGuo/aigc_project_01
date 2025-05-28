from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import time
from .config import monitoring_settings
from .logger import app_logger
from .metrics import metrics_collector

class MonitoringMiddleware(BaseHTTPMiddleware):
    """监控中间件"""
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        try:
            # 处理请求
            response = await call_next(request)
            
            # 计算请求处理时间
            duration = time.time() - start_time
            
            # 记录请求指标
            if monitoring_settings.ENABLE_REQUEST_MONITORING:
                metrics_collector.record_request(
                    path=request.url.path,
                    method=request.method,
                    status_code=response.status_code,
                    duration=duration
                )
            
            # 记录慢请求
            if duration > monitoring_settings.SLOW_REQUEST_THRESHOLD:
                app_logger.warning(
                    f"慢请求: {request.method} {request.url.path}",
                    duration=duration,
                    status_code=response.status_code
                )
            
            return response
            
        except Exception as e:
            # 记录错误
            app_logger.error(
                f"请求处理错误: {request.method} {request.url.path}",
                exc_info=True,
                error=str(e)
            )
            raise

class ResourceMonitoringMiddleware(BaseHTTPMiddleware):
    """资源监控中间件"""
    
    async def dispatch(self, request: Request, call_next):
        if monitoring_settings.ENABLE_RESOURCE_MONITORING:
            try:
                # 收集系统指标
                metrics_collector.collect_system_metrics()
                
                # 检查资源使用情况
                metrics = metrics_collector.get_metrics_summary()
                
                # 检查是否超过阈值
                if metrics.get("cpu", {}).get("percent", 0) > monitoring_settings.RESOURCE_THRESHOLD["cpu_percent"]:
                    app_logger.warning("CPU使用率超过阈值")
                
                if metrics.get("memory", {}).get("percent", 0) > monitoring_settings.RESOURCE_THRESHOLD["memory_percent"]:
                    app_logger.warning("内存使用率超过阈值")
                
                if metrics.get("disk", {}).get("percent", 0) > monitoring_settings.RESOURCE_THRESHOLD["disk_percent"]:
                    app_logger.warning("磁盘使用率超过阈值")
                
            except Exception as e:
                app_logger.error(f"资源监控错误: {str(e)}")
        
        return await call_next(request) 