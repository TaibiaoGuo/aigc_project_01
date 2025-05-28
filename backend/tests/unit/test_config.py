import os
import pytest
from app import Config, Environment

def test_config_default_values():
    """测试配置默认值"""
    config = Config()
    assert config.ENV == Environment.DEVELOPMENT
    assert config.COMFYUI_SERVER == "http://127.0.0.1:8188"
    assert config.MAX_WORKERS == 4
    assert config.SESSION_TIMEOUT == 3600
    assert config.CLEANUP_INTERVAL == 600

def test_config_environment_variables():
    """测试环境变量配置"""
    os.environ["ENVIRONMENT"] = "production"
    os.environ["COMFYUI_SERVER"] = "http://test-server:8188"
    os.environ["MAX_WORKERS"] = "8"
    os.environ["SESSION_TIMEOUT"] = "7200"
    os.environ["CLEANUP_INTERVAL"] = "300"
    
    config = Config()
    assert config.ENV == Environment.PRODUCTION
    assert config.COMFYUI_SERVER == "http://test-server:8188"
    assert config.MAX_WORKERS == 8
    assert config.SESSION_TIMEOUT == 7200
    assert config.CLEANUP_INTERVAL == 300
    
    # 清理环境变量
    del os.environ["ENVIRONMENT"]
    del os.environ["COMFYUI_SERVER"]
    del os.environ["MAX_WORKERS"]
    del os.environ["SESSION_TIMEOUT"]
    del os.environ["CLEANUP_INTERVAL"] 