import pytest
from fastapi.testclient import TestClient
from app import app
import os
import json

@pytest.fixture
def client():
    """创建测试客户端"""
    return TestClient(app)

@pytest.fixture
def test_image(tmp_path):
    """创建测试图片"""
    image_path = tmp_path / "test.png"
    with open(image_path, "wb") as f:
        f.write(b"fake image data")
    return image_path

def test_health_check(client):
    """测试健康检查接口"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_upload_sketch(client, test_image):
    """测试上传草图接口"""
    with open(test_image, "rb") as f:
        response = client.post(
            "/upload-sketch",
            files={"file": ("test.png", f, "image/png")},
            data={"session_id": "test-session"}
        )
    
    assert response.status_code == 200
    data = response.json()
    assert "session_id" in data
    assert "sketch_path" in data

def test_get_style_config(client):
    """测试获取样式配置接口"""
    response = client.get("/style-config")
    assert response.status_code == 200
    data = response.json()
    assert "style_name" in data
    assert "style_config" in data

def test_update_style_config(client):
    """测试更新样式配置接口"""
    config = {
        "style_name": "test-style",
        "style_config": {
            "param1": "value1",
            "param2": "value2"
        }
    }
    
    response = client.post(
        "/style-config",
        json=config
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["style_name"] == config["style_name"]
    assert data["style_config"] == config["style_config"]

def test_get_session_status(client):
    """测试获取会话状态接口"""
    # 先创建会话
    with open("test.png", "rb") as f:
        client.post(
            "/upload-sketch",
            files={"file": ("test.png", f, "image/png")},
            data={"session_id": "test-session"}
        )
    
    # 获取状态
    response = client.get("/session/test-session/status")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "progress" in data
    assert "result" in data 