import psutil
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any
from .config import monitoring_settings
from .logger import app_logger

class MetricsCollector:
    """性能指标收集器"""
    
    def __init__(self):
        self.metrics: Dict[str, List[Dict[str, Any]]] = {
            "cpu": [],
            "memory": [],
            "disk": [],
            "network": [],
            "requests": []
        }
        self.start_time = time.time()
    
    def collect_system_metrics(self):
        """收集系统指标"""
        try:
            # CPU指标
            cpu_percent = psutil.cpu_percent(interval=1)
            cpu_count = psutil.cpu_count()
            
            # 内存指标
            memory = psutil.virtual_memory()
            
            # 磁盘指标
            disk = psutil.disk_usage('/')
            
            # 网络指标
            net_io = psutil.net_io_counters()
            
            timestamp = datetime.now()
            
            # 存储指标
            self.metrics["cpu"].append({
                "timestamp": timestamp,
                "percent": cpu_percent,
                "count": cpu_count
            })
            
            self.metrics["memory"].append({
                "timestamp": timestamp,
                "total": memory.total,
                "available": memory.available,
                "percent": memory.percent
            })
            
            self.metrics["disk"].append({
                "timestamp": timestamp,
                "total": disk.total,
                "used": disk.used,
                "free": disk.free,
                "percent": disk.percent
            })
            
            self.metrics["network"].append({
                "timestamp": timestamp,
                "bytes_sent": net_io.bytes_sent,
                "bytes_recv": net_io.bytes_recv,
                "packets_sent": net_io.packets_sent,
                "packets_recv": net_io.packets_recv
            })
            
            # 清理旧数据
            self._cleanup_old_metrics()
            
        except Exception as e:
            app_logger.error(f"收集系统指标时出错: {str(e)}")
    
    def record_request(self, path: str, method: str, status_code: int, duration: float):
        """记录请求指标"""
        try:
            self.metrics["requests"].append({
                "timestamp": datetime.now(),
                "path": path,
                "method": method,
                "status_code": status_code,
                "duration": duration
            })
        except Exception as e:
            app_logger.error(f"记录请求指标时出错: {str(e)}")
    
    def get_metrics_summary(self) -> Dict[str, Any]:
        """获取指标摘要"""
        try:
            return {
                "uptime": time.time() - self.start_time,
                "cpu": self._get_latest_metric("cpu"),
                "memory": self._get_latest_metric("memory"),
                "disk": self._get_latest_metric("disk"),
                "network": self._get_latest_metric("network"),
                "requests": {
                    "total": len(self.metrics["requests"]),
                    "recent": self._get_recent_requests()
                }
            }
        except Exception as e:
            app_logger.error(f"获取指标摘要时出错: {str(e)}")
            return {}
    
    def _get_latest_metric(self, metric_type: str) -> Dict[str, Any]:
        """获取最新的指标数据"""
        if not self.metrics[metric_type]:
            return {}
        return self.metrics[metric_type][-1]
    
    def _get_recent_requests(self, minutes: int = 5) -> List[Dict[str, Any]]:
        """获取最近的请求记录"""
        cutoff = datetime.now() - timedelta(minutes=minutes)
        return [
            req for req in self.metrics["requests"]
            if req["timestamp"] > cutoff
        ]
    
    def _cleanup_old_metrics(self):
        """清理旧的指标数据"""
        cutoff = datetime.now() - timedelta(days=monitoring_settings.METRICS_RETENTION_DAYS)
        
        for metric_type in self.metrics:
            self.metrics[metric_type] = [
                metric for metric in self.metrics[metric_type]
                if metric["timestamp"] > cutoff
            ]

# 创建全局指标收集器实例
metrics_collector = MetricsCollector() 