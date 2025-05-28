import pytest
import os
from app import create_required_directories, get_workflow_path

def test_create_required_directories(tmp_path):
    """测试创建必要目录"""
    # 设置临时目录
    os.environ["UPLOAD_DIR"] = str(tmp_path / "uploads")
    os.environ["OUTPUT_DIR"] = str(tmp_path / "outputs")
    
    # 创建目录
    create_required_directories()
    
    # 验证目录是否创建
    assert os.path.exists(tmp_path / "uploads")
    assert os.path.exists(tmp_path / "outputs")
    
    # 清理环境变量
    del os.environ["UPLOAD_DIR"]
    del os.environ["OUTPUT_DIR"]

def test_get_workflow_path():
    """测试获取工作流路径"""
    # 测试默认工作流
    default_path = get_workflow_path()
    assert os.path.exists(default_path)
    
    # 测试自定义工作流
    custom_path = get_workflow_path("test_workflow")
    assert custom_path.endswith("test_workflow.json")
    
    # 测试不存在的样式
    with pytest.raises(ValueError):
        get_workflow_path("non_existent_style") 