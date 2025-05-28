import pytest
import time
import asyncio
from fastapi.testclient import TestClient
from app import app
import os

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

def test_upload_performance(client, test_image):
    """测试上传性能"""
    start_time = time.time()
    
    # 执行多次上传
    for _ in range(10):
        with open(test_image, "rb") as f:
            response = client.post(
                "/upload-sketch",
                files={"file": ("test.png", f, "image/png")},
                data={"session_id": f"test-session-{_}"}
            )
        assert response.status_code == 200
    
    end_time = time.time()
    total_time = end_time - start_time
    
    # 验证平均响应时间
    assert total_time / 10 < 1.0  # 平均响应时间应小于1秒

def test_concurrent_uploads(client, test_image):
    """测试并发上传"""
    async def upload():
        with open(test_image, "rb") as f:
            response = client.post(
                "/upload-sketch",
                files={"file": ("test.png", f, "image/png")},
                data={"session_id": f"test-session-{time.time()}"}
            )
        assert response.status_code == 200
    
    # 创建多个并发任务
    tasks = [upload() for _ in range(5)]
    
    # 执行并发测试
    start_time = time.time()
    asyncio.run(asyncio.gather(*tasks))
    end_time = time.time()
    
    # 验证并发性能
    assert end_time - start_time < 3.0  # 5个并发请求应在3秒内完成

def test_memory_usage(client, test_image):
    """测试内存使用"""
    import psutil
    import os
    
    process = psutil.Process(os.getpid())
    initial_memory = process.memory_info().rss
    
    # 执行多次请求
    for _ in range(10):
        with open(test_image, "rb") as f:
            response = client.post(
                "/upload-sketch",
                files={"file": ("test.png", f, "image/png")},
                data={"session_id": f"test-session-{_}"}
            )
        assert response.status_code == 200
    
    final_memory = process.memory_info().rss
    memory_increase = final_memory - initial_memory
    
    # 验证内存增长
    assert memory_increase < 50 * 1024 * 1024  # 内存增长应小于50MB 