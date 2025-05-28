import pytest
import time
from app import Session, AppState, StyleConfig

@pytest.fixture
def app_state():
    """创建应用状态实例"""
    return AppState()

@pytest.fixture
def session():
    """创建会话实例"""
    return Session(session_id="test-session")

def test_create_session(app_state):
    """测试创建会话"""
    session = app_state.create_session("test-session")
    assert session.session_id == "test-session"
    assert session in app_state.active_sessions.values()

def test_get_session(app_state):
    """测试获取会话"""
    session = app_state.create_session("test-session")
    retrieved_session = app_state.get_session("test-session")
    assert retrieved_session == session

def test_remove_session(app_state):
    """测试移除会话"""
    app_state.create_session("test-session")
    app_state.remove_session("test-session")
    assert "test-session" not in app_state.active_sessions

def test_cleanup_expired_sessions(app_state):
    """测试清理过期会话"""
    # 创建两个会话
    session1 = app_state.create_session("session1")
    session2 = app_state.create_session("session2")
    
    # 设置 session1 为过期
    session1.last_update = time.time() - 3601  # 超过1小时
    
    # 执行清理
    app_state.cleanup_expired_sessions()
    
    # 验证结果
    assert "session1" not in app_state.active_sessions
    assert "session2" in app_state.active_sessions

def test_session_update(app_state):
    """测试会话更新"""
    session = app_state.create_session("test-session")
    old_update_time = session.last_update
    
    # 更新会话
    session.style_config = StyleConfig(style_name="test-style")
    session.sketch_path = "test/path"
    
    # 验证更新
    assert session.style_config.style_name == "test-style"
    assert session.sketch_path == "test/path"
    assert session.last_update > old_update_time 