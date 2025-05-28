import pytest
import os
import shutil
from pathlib import Path

@pytest.fixture(scope="session")
def test_upload_dir(tmp_path_factory):
    """创建测试上传目录"""
    upload_dir = tmp_path_factory.mktemp("uploads")
    os.environ["UPLOAD_DIR"] = str(upload_dir)
    yield upload_dir
    shutil.rmtree(upload_dir)
    del os.environ["UPLOAD_DIR"]

@pytest.fixture(scope="session")
def test_output_dir(tmp_path_factory):
    """创建测试输出目录"""
    output_dir = tmp_path_factory.mktemp("outputs")
    os.environ["OUTPUT_DIR"] = str(output_dir)
    yield output_dir
    shutil.rmtree(output_dir)
    del os.environ["OUTPUT_DIR"]

@pytest.fixture(scope="session")
def test_workflow_dir(tmp_path_factory):
    """创建测试工作流目录"""
    workflow_dir = tmp_path_factory.mktemp("workflows")
    os.environ["WORKFLOW_DIR"] = str(workflow_dir)
    
    # 创建测试工作流文件
    test_workflow = {
        "test_workflow": {
            "nodes": [
                {
                    "id": 1,
                    "type": "test_node",
                    "inputs": {},
                    "outputs": {}
                }
            ]
        }
    }
    
    workflow_file = workflow_dir / "test_workflow.json"
    with open(workflow_file, "w") as f:
        import json
        json.dump(test_workflow, f)
    
    yield workflow_dir
    shutil.rmtree(workflow_dir)
    del os.environ["WORKFLOW_DIR"]

@pytest.fixture(scope="session")
def test_comfyui_url():
    """设置测试ComfyUI URL"""
    os.environ["COMFYUI_URL"] = "http://localhost:8188"
    yield os.environ["COMFYUI_URL"]
    del os.environ["COMFYUI_URL"]

@pytest.fixture(scope="session")
def test_environment():
    """设置测试环境"""
    os.environ["ENVIRONMENT"] = "test"
    yield os.environ["ENVIRONMENT"]
    del os.environ["ENVIRONMENT"] 