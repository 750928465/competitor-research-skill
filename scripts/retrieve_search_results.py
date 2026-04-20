#!/usr/bin/env python3
"""
搜索结果检索脚本
使用 Tavily API 进行搜索并返回结果
"""

import os
import sys
import json
from pathlib import Path
from datetime import datetime
from typing import Optional

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


def load_sources_config() -> dict:
    """加载来源配置"""
    sources_file = CONFIG_DIR / "sources.yaml"
    return load_yaml_config(sources_file)


def get_tavily_key() -> str:
    """获取 Tavily API 密钥"""
    # 1. 从 runtime.local.yaml 加载
    runtime_local = CONFIG_DIR / "runtime.local.yaml"
    if runtime_local.exists():
        config = load_yaml_config(runtime_local)
        api_keys = config.get('api_keys', {})
        tavily_key = api_keys.get('tavily_api_key', '')
        if tavily_key and tavily_key != "YOUR_TAVILY_API_KEY_HERE":
            return tavily_key.strip()

    # 2. 从环境变量加载
    return os.environ.get('TAVILY_API_KEY', '').strip()


def get_search_config() -> dict:
    """获取搜索配置"""
    runtime_local = CONFIG_DIR / "runtime.local.yaml"
    if runtime_local.exists():
        config = load_yaml_config(runtime_local)
        return config.get('search', {})
    return {
        'max_results': 10,
        'search_depth': 'basic',
        'include_answer': True,
        'include_raw_content': False
    }


def tavily_search(query: str, max_results: int = 10, search_depth: str = "basic",
                  include_answer: bool = True) -> dict:
    """
    使用 Tavily API 进行搜索

    Args:
        query: 搜索查询
        max_results: 最大结果数
        search_depth: 搜索深度 (basic/advanced)
        include_answer: 是否包含答案摘要

    Returns:
        搜索结果字典
    """
    try:
        from tavily import TavilyClient

        api_key = get_tavily_key()
        if not api_key:
            raise ValueError("Tavily API 密钥未配置")

        client = TavilyClient(api_key=api_key)

        # 执行搜索
        result = client.search(
            query=query,
            max_results=max_results,
            search_depth=search_depth,
            include_answer=include_answer
        )

        return {
            'success': True,
            'query': query,
            'results': result.get('results', []),
            'answer': result.get('answer', ''),
            'timestamp': datetime.now().isoformat()
        }

    except ImportError:
        return {
            'success': False,
            'error': '需要安装 tavily-python: pip install tavily-python',
            'query': query
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'query': query
        }


def search_with_intents(product_category: str, intents: list[dict]) -> list[dict]:
    """
    根据多个搜索意图进行搜索

    Args:
        product_category: 产品类别
        intents: 搜索意图列表

    Returns:
        所有搜索结果列表
    """
    all_results = []

    for intent in intents:
        template = intent.get('template', '')
        query = template.replace('{product_category}', product_category)

        print(f"搜索: {query} (优先级: {intent.get('priority', 0)})")

        result = tavily_search(query)

        if result.get('success'):
            result['evidence_type'] = intent.get('evidence_type', 'general')
            result['priority'] = intent.get('priority', 0)
            all_results.append(result)
        else:
            print(f"  ⚠️ 搜索失败: {result.get('error', '未知错误')}")

    return all_results


def save_results(results: list[dict], output_file: str):
    """保存搜索结果到文件"""
    output_path = PROJECT_ROOT / "output" / output_file
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"结果已保存到: {output_path}")


def main():
    """主函数"""
    import argparse

    parser = argparse.ArgumentParser(description='使用 Tavily 进行搜索')
    parser.add_argument('--query', '-q', help='搜索查询')
    parser.add_argument('--product-category', '-p', help='产品类别（使用预设意图）')
    parser.add_argument('--max-results', '-m', type=int, default=10, help='最大结果数')
    parser.add_argument('--depth', '-d', choices=['basic', 'advanced'], default='basic', help='搜索深度')
    parser.add_argument('--output', '-o', help='输出文件名')
    parser.add_argument('--check-key', '-c', action='store_true', help='检查 API 密钥')

    args = parser.parse_args()

    # 检查密钥模式
    if args.check_key:
        from check_tavily_key import check_tavily_key, print_setup_instructions
        available, source = check_tavily_key()
        if available:
            print(f"✅ Tavily API 密钥已配置 (来源: {source})")
            return 0
        else:
            print_setup_instructions()
            return 1

    # 检查密钥
    api_key = get_tavily_key()
    if not api_key:
        print("❌ Tavily API 密钥未配置")
        print("请运行: python scripts/check_tavily_key.py -c")
        return 1

    # 产品类别搜索（使用预设意图）
    if args.product_category:
        sources_config = load_sources_config()
        intents = sources_config.get('default_search_intents', {}).get('product_search', [])
        results = search_with_intents(args.product_category, intents)

        if args.output:
            save_results(results, args.output)
        else:
            print(json.dumps(results, ensure_ascii=False, indent=2))
        return 0

    # 单次搜索
    if args.query:
        result = tavily_search(
            query=args.query,
            max_results=args.max_results,
            search_depth=args.depth
        )

        if args.output:
            save_results([result], args.output)
        else:
            print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0

    # 无参数时显示帮助
    parser.print_help()
    return 0


if __name__ == "__main__":
    sys.exit(main())