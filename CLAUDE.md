# 竞品分析技能项目

这是一个 Claude Code 独立技能项目，用于进行产品竞品研究。

## 项目结构

```
.
├── CLAUDE.md                          # 项目配置文件
├── .claude/
│   └── skills/
│       └── competitor-analysis/      # 竞品分析技能
│           └── SKILL.md
├── prompts/                           # 提示词模板
│   ├── query_rewrite.md
│   ├── result_cleaning.md
│   └── competitor_report.md
├── schemas/                           # 数据结构定义
│   ├── search_result_schema.json
│   └── competitor_report_schema.json
├── examples/                          # 示例文件
│   └── competitor_query_example.json
├── scripts/                           # 辅助脚本
│   ├── save_report.py
│   └── utils.py
└── output/                            # 输出目录
```

## 使用方法

1. 确保已加载 competitor-analysis 技能
2. 提供产品/主题查询，例如："AI 邮件助手"
3. 技能将自动执行检索、清洗、分析并生成报告

## 技能工作流程

1. **查询重写** - 将用户查询转换为多个检索意图
2. **信息检索** - 使用 WebSearch/WebFetch 收集相关信息
3. **结果清洗** - 结构化清洗搜索结果
4. **竞品识别** - 识别主要厂商和产品
5. **报告生成** - 生成 Markdown 格式的竞品分析报告
6. **报告保存** - 将报告保存到 output/ 目录

## 注意事项

- 本技能专注于产品竞品研究（第一阶段）
- 不包含公司深度研究
- 使用 Claude Code 内置的 WebSearch/WebFetch 进行检索
