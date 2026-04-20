#!/usr/bin/env python3
"""
报告保存脚本
用于将竞品分析报告保存到文件系统
"""

import sys
from pathlib import Path
from datetime import datetime

# 添加脚本所在目录到 Python 路径
SCRIPT_DIR = Path(__file__).parent
sys.path.insert(0, str(SCRIPT_DIR))

from utils import (
    slugify,
    get_timestamp,
    get_readable_date,
    ensure_output_dir,
    sanitize_filename
)


def save_markdown_report(
    content: str,
    query: str,
    output_dir: str = "output",
    add_timestamp: bool = True
) -> Path:
    """
    保存 Markdown 格式的竞品分析报告

    Args:
        content: 报告内容（Markdown 格式）
        query: 用户查询（用于生成文件名）
        output_dir: 输出目录
        add_timestamp: 是否在文件名中添加时间戳

    Returns:
        保存的文件路径
    """
    # 确保输出目录存在
    output_path = ensure_output_dir(output_dir)

    # 生成文件名
    base_filename = slugify(query)

    if add_timestamp:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{base_filename}_{timestamp}_report.md"
    else:
        filename = f"{base_filename}_report.md"

    filename = sanitize_filename(filename)
    file_path = output_path / filename

    # 写入文件
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"报告已保存到: {file_path}")
    return file_path


def save_json_data(
    data: dict,
    query: str,
    output_dir: str = "output",
    data_type: str = "data"
) -> Path:
    """
    保存 JSON 格式的数据

    Args:
        data: 要保存的数据
        query: 用户查询（用于生成文件名）
        output_dir: 输出目录
        data_type: 数据类型（用于文件名）

    Returns:
        保存的文件路径
    """
    import json

    output_path = ensure_output_dir(output_dir)
    base_filename = slugify(query)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = sanitize_filename(f"{base_filename}_{timestamp}_{data_type}.json")
    file_path = output_path / filename

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"JSON 数据已保存到: {file_path}")
    return file_path


def main():
    """
    主函数 - 从命令行参数读取并保存报告
    """
    import argparse

    parser = argparse.ArgumentParser(description='保存竞品分析报告')
    parser.add_argument('--query', required=True, help='用户查询')
    parser.add_argument('--content', help='报告内容（如果不指定则从 stdin 读取）')
    parser.add_argument('--output-dir', default='output', help='输出目录')
    parser.add_argument('--no-timestamp', action='store_true', help='不在文件名中添加时间戳')
    parser.add_argument('--json', action='store_true', help='保存为 JSON 格式')

    args = parser.parse_args()

    # 读取内容
    if args.content:
        content = args.content
    else:
        # 从标准输入读取
        content = sys.stdin.read()

    if args.json:
        # 保存为 JSON
        import json
        try:
            data = json.loads(content)
            save_json_data(data, args.query, args.output_dir)
        except json.JSONDecodeError:
            print("错误: JSON 格式解析失败")
            sys.exit(1)
    else:
        # 保存为 Markdown
        save_markdown_report(
            content=content,
            query=args.query,
            output_dir=args.output_dir,
            add_timestamp=not args.no_timestamp
        )


if __name__ == "__main__":
    main()
