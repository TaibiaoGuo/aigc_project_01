import subprocess
import sys
from pathlib import Path
from typing import List, Dict, Any, Optional
from .config import quality_settings
from ..monitoring.logger import app_logger

class CodeQualityChecker:
    """代码质量检查器"""
    
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
    
    def run_black(self) -> bool:
        """运行Black代码格式化"""
        try:
            cmd = [
                "black",
                "--line-length", str(quality_settings.BLACK_LINE_LENGTH),
                "--target-version", ",".join(quality_settings.BLACK_TARGET_VERSION),
                "--include", quality_settings.BLACK_INCLUDE,
                "--exclude", quality_settings.BLACK_EXCLUDE,
                str(self.project_root)
            ]
            subprocess.run(cmd, check=True)
            return True
        except subprocess.CalledProcessError as e:
            app_logger.error(f"Black格式化失败: {str(e)}")
            return False
    
    def run_flake8(self) -> bool:
        """运行Flake8代码检查"""
        try:
            cmd = [
                "flake8",
                "--max-line-length", str(quality_settings.FLAKE8_MAX_LINE_LENGTH),
                "--ignore", ",".join(quality_settings.FLAKE8_IGNORE),
                "--exclude", ",".join(quality_settings.FLAKE8_EXCLUDE),
                str(self.project_root)
            ]
            subprocess.run(cmd, check=True)
            return True
        except subprocess.CalledProcessError as e:
            app_logger.error(f"Flake8检查失败: {str(e)}")
            return False
    
    def run_mypy(self) -> bool:
        """运行MyPy类型检查"""
        try:
            cmd = [
                "mypy",
                "--strict" if quality_settings.MYPY_STRICT else "",
                "--disallow-untyped-defs" if quality_settings.MYPY_DISALLOW_UNTYPED_DEFS else "",
                "--disallow-incomplete-defs" if quality_settings.MYPY_DISALLOW_INCOMPLETE_DEFS else "",
                "--check-unused-configs" if quality_settings.MYPY_CHECK_UNUSED_CONFIGS else "",
                "--warn-return-any" if quality_settings.MYPY_WARN_RETURN_ANY else "",
                "--warn-unused-configs" if quality_settings.MYPY_WARN_UNUSED_CONFIGS else "",
                "--warn-unused-ignores" if quality_settings.MYPY_WARN_UNUSED_IGNORES else "",
                "--warn-no-return" if quality_settings.MYPY_WARN_NO_RETURN else "",
                "--warn-unreachable" if quality_settings.MYPY_WARN_UNREACHABLE else "",
                str(self.project_root)
            ]
            cmd = [c for c in cmd if c]  # 移除空字符串
            subprocess.run(cmd, check=True)
            return True
        except subprocess.CalledProcessError as e:
            app_logger.error(f"MyPy检查失败: {str(e)}")
            return False
    
    def run_pylint(self) -> bool:
        """运行Pylint代码检查"""
        try:
            cmd = [
                "pylint",
                "--disable", ",".join(quality_settings.PYLINT_DISABLE),
                "--max-line-length", str(quality_settings.PYLINT_MAX_LINE_LENGTH),
                "--good-names", ",".join(quality_settings.PYLINT_GOOD_NAMES),
                str(self.project_root)
            ]
            subprocess.run(cmd, check=True)
            return True
        except subprocess.CalledProcessError as e:
            app_logger.error(f"Pylint检查失败: {str(e)}")
            return False
    
    def run_complexity_check(self) -> bool:
        """运行代码复杂度检查"""
        try:
            cmd = [
                "radon",
                "cc",
                "--min", "A",
                "--max", "C",
                "--average",
                str(self.project_root)
            ]
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            # 解析复杂度结果
            for line in result.stdout.splitlines():
                if ":" in line:
                    file_path, complexity = line.split(":")
                    complexity = float(complexity.strip())
                    if complexity > quality_settings.MAX_COMPLEXITY:
                        app_logger.warning(f"文件 {file_path} 的复杂度 {complexity} 超过阈值 {quality_settings.MAX_COMPLEXITY}")
                        return False
            return True
        except subprocess.CalledProcessError as e:
            app_logger.error(f"复杂度检查失败: {str(e)}")
            return False
    
    def run_coverage_check(self) -> bool:
        """运行测试覆盖率检查"""
        try:
            cmd = [
                "coverage",
                "run",
                "-m",
                "pytest",
                "--cov",
                str(self.project_root),
                "--cov-report", "term-missing",
                "--cov-fail-under", str(quality_settings.MIN_COVERAGE)
            ]
            subprocess.run(cmd, check=True)
            return True
        except subprocess.CalledProcessError as e:
            app_logger.error(f"覆盖率检查失败: {str(e)}")
            return False
    
    def run_all_checks(self) -> Dict[str, bool]:
        """运行所有代码质量检查"""
        results = {
            "black": self.run_black(),
            "flake8": self.run_flake8(),
            "mypy": self.run_mypy(),
            "pylint": self.run_pylint(),
            "complexity": self.run_complexity_check(),
            "coverage": self.run_coverage_check()
        }
        
        # 记录检查结果
        for tool, success in results.items():
            if success:
                app_logger.info(f"{tool} 检查通过")
            else:
                app_logger.error(f"{tool} 检查失败")
        
        return results

# 创建全局检查器实例
code_quality_checker = CodeQualityChecker(Path(__file__).parent.parent) 