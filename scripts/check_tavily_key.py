#!/usr/bin/env python3
"""
Tavily API 密钥检查脚本
用于验证 Tavily API 密钥是否正确配置
"""

import os
import sys
from pathlib import Path

# 项目根目录
PROJECT_ROOT = Path(__file__).parent.parent
CONFIG_DIR = PROJECT_ROOT / "config"


def load_yaml_config(filepath: Path) -> dict:
    """加载 YAML 配置文件"""
    try:
        import yaml
        with open(filepath, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f) or {}
    except ImportError:
        print("⚠️ 需要安装 PyYAML: pip install pyyaml")
        sys.exit(1)
    except FileNotFoundError:
        return {}


def check_tavily_key() -> tuple[bool, str]:
    """
    检查 Tavily API 密钥是否可用

    Returns:
        (是否可用, 密钥来源)
    """
    # 1. 首先尝试从 runtime.local.yaml 加载
    runtime_local = CONFIG_DIR / "runtime.local.yaml"
    if runtime_local.exists():
        config = load_yaml_config(runtime_local)
        api_keys = config.get('api_keys', {})
        tavily_key = api_keys.get('tavily_api_key', '')

        if tavily_key and tavily_key != "YOUR_TAVILY_API_KEY_HERE" and tavily_key.strip():
            return True, "runtime.local.yaml"

    # 2. 尝试从环境变量加载
    env_key = os.environ.get('TAVILY_API_KEY', '')
    if env_key and env_key.strip():
        return True, "环境变量 TAVILY_API_KEY"

    # 3. 密钥不可用
    return False, ""


def get_tavily_key() -> str:
    """获取 Tavily API 密钥"""
    available, source = check_tavily_key()

    if not available:
        return ""

    # 从 runtime.local.yaml 获取
    runtime_local = CONFIG_DIR / "runtime.local.yaml"
    if runtime_local.exists():
        config = load_yaml_config(runtime_local)
        api_keys = config.get('api_keys', {})
        tavily_key = api_keys.get('tavily_api_key', '')
        if tavily_key and tavily_key != "YOUR_TAVILY_API_KEY_HERE":
            return tavily_key.strip()

    # 从环境变量获取
    return os.environ.get('TAVILY_API_KEY', '').strip()


def print_setup_instructions():
    """打印配置说明"""
    print("\n" + "="*60)
    print("❌ Tavily API 密钥未配置")
    print("="*60)
    print("\n配置方法 1: 使用 runtime.local.yaml")
    print("-" * 40)
    print("1. 复制模板文件:")
    print(f"   cp config/runtime.example.yaml config/runtime.local.yaml")
    print("\n2. 编辑 runtime.local.yaml，填入您的 Tavily API 密钥:")
    print(f"   tavily_api_key: 'tvly-xxxxxxxxxxxxx'")
    print("\n配置方法 2: 使用环境变量")
    print("-" * 40)
    print("设置环境变量:")
    print("   export TAVILY_API_KEY='tvly-xxxxxxxxxxxxx'")
    print("\n获取 Tavily API 密钥:")
    print("-" * 40)
    print("访问: https://tavily.com/")
    print("注册账号后可在 Dashboard 获取 API 密钥")
    print("\n" + "="*60 + "\n")


def main():
    """主函数"""
    print("检查 Tavily API 密钥配置...")

    available, source = check_tavily_key()

    if available:
        print(f"✅ Tavily API 密钥已配置 (来源: {source})")
        # 测试密钥有效性（可选）
        try:
            from tavily import TavilyClient
            client = TavilyClient(api_key=get_tavily_key())
            # 简单测试
            result = client.search("test", max_results=1)
            print("✅ 密钥验证成功，API 可用")
            return 0
        except ImportError:
            print("⚠️ 需要安装 tavily-python: pip install tavily-python")
            return 1
        except Exception as e:
            print(f"⚠️ API 测试失败: {e}")
            print("密钥可能无效或网络问题")
            return 1
    else:
        print_setup_instructions()
        return 1


if __name__ == "__main__":
    sys.exit(main())