from pydantic import BaseSettings
import os
from typing import List

class QualitySettings(BaseSettings):
    """代码质量配置类"""
    
    # Black配置
    BLACK_LINE_LENGTH: int = 88
    BLACK_TARGET_VERSION: List[str] = ["py38"]
    BLACK_INCLUDE: str = r"\.pyi?$"
    BLACK_EXCLUDE: str = r"/(\.git|\.hg|\.mypy_cache|\.tox|\.venv|_build|buck-out|build|dist)/"
    
    # Flake8配置
    FLAKE8_MAX_LINE_LENGTH: int = 88
    FLAKE8_IGNORE: List[str] = [
        "E203",  # whitespace before ':'
        "W503",  # line break before binary operator
        "E501",  # line too long
    ]
    FLAKE8_EXCLUDE: List[str] = [
        ".git",
        "__pycache__",
        "build",
        "dist",
        ".venv",
        "venv",
    ]
    
    # MyPy配置
    MYPY_STRICT: bool = True
    MYPY_DISALLOW_UNTYPED_DEFS: bool = True
    MYPY_DISALLOW_INCOMPLETE_DEFS: bool = True
    MYPY_CHECK_UNUSED_CONFIGS: bool = True
    MYPY_WARN_RETURN_ANY: bool = True
    MYPY_WARN_UNUSED_CONFIGS: bool = True
    MYPY_WARN_UNUSED_IGNORES: bool = True
    MYPY_WARN_NO_RETURN: bool = True
    MYPY_WARN_UNREACHABLE: bool = True
    
    # Pylint配置
    PYLINT_DISABLE: List[str] = [
        "C0111",  # missing-docstring
        "C0103",  # invalid-name
        "C0330",  # bad-continuation
        "C0326",  # bad-whitespace
    ]
    PYLINT_MAX_LINE_LENGTH: int = 88
    PYLINT_GOOD_NAMES: List[str] = ["i", "j", "k", "ex", "Run"]
    
    # 代码复杂度配置
    MAX_COMPLEXITY: int = 10
    MAX_LINES_PER_FUNCTION: int = 50
    MAX_LINES_PER_MODULE: int = 500
    MAX_ARGUMENTS: int = 5
    MAX_LOCAL_VARIABLES: int = 15
    
    # 测试覆盖率配置
    MIN_COVERAGE: float = 80.0
    COVERAGE_EXCLUDE: List[str] = [
        "tests/*",
        "*/tests/*",
        "*/__init__.py",
    ]
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# 创建全局配置实例
quality_settings = QualitySettings() 