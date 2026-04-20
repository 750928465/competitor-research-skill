#!/usr/bin/env python3
"""
工具函数模块
提供通用的辅助函数
"""

import re
import unicodedata
from datetime import datetime
from pathlib import Path


def slugify(text: str) -> str:
    """
    将文本转换为 URL 友好的 slug 格式

    Args:
        text: 输入文本

    Returns:
        slug 化的字符串
    """
    # 转换为小写
    text = text.lower()

    # 替换中文为拼音（简单处理，保留中文）
    # 这里只做基本的清理，保留中文字符

    # 替换空格和特殊字符为连字符
    text = re.sub(r'[-\s]+', '-', text)

    # 移除非单词字符（保留中文、字母、数字、连字符）
    # 中文 unicode 范围 \u4e00-\u9fff
    text = re.sub(r'[^\u4e00-\u9fff a-zA-Z0-9-]', '', text)

    # 去除首尾的连字符
    text = text.strip('-')

    return text


def get_timestamp() -> str:
    """
    获取当前时间戳字符串

    Returns:
        ISO 格式的时间戳
    """
    return datetime.now().isoformat()


def get_readable_date() -> str:
    """
    获取易读的日期格式

    Returns:
        易读的日期字符串
    """
    return datetime.now().strftime('%Y年%m月%d日')


def ensure_output_dir(output_path: str = "output") -> Path:
    """
    确保输出目录存在

    Args:
        output_path: 输出目录路径

    Returns:
        输出目录的 Path 对象
    """
    output_dir = Path(output_path)
    output_dir.mkdir(parents=True, exist_ok=True)
    return output_dir


def sanitize_filename(filename: str) -> str:
    """
    清理文件名，移除非法字符

    Args:
        filename: 原始文件名

    Returns:
        清理后的文件名
    """
    # 移除或替换非法字符
    illegal_chars = '<>:"/\\|?*'
    for char in illegal_chars:
        filename = filename.replace(char, '_')

    return filename


def truncate_text(text: str, max_length: int = 100, suffix: str = "...") -> str:
    """
    截断文本到指定长度

    Args:
        text: 输入文本
        max_length: 最大长度
        suffix: 截断后添加的后缀

    Returns:
        截断后的文本
    """
    if len(text) <= max_length:
        return text
    return text[:max_length - len(suffix)] + suffix


def extract_domain(url: str) -> str:
    """
    从 URL 中提取域名

    Args:
        url: URL 字符串

    Returns:
        域名
    """
    from urllib.parse import urlparse
    parsed = urlparse(url)
    return parsed.netloc


if __name__ == "__main__":
    # 简单测试
    print("Testing utils.py...")
    print(f"slugify('AI 邮件助手'): {slugify('AI 邮件助手')}")
    print(f"get_timestamp(): {get_timestamp()}")
    print(f"get_readable_date(): {get_readable_date()}")
