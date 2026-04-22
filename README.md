# Competitor Research Skill

> An AI-powered competitive analysis tool that automatically generates professional competitor research reports using Tavily Search API and LLM.
> <img width="1024" height="559" alt="image" src="https://github.com/user-attachments/assets/ad7d61ab-2731-455d-b171-1b6c376f9d05" />


[English](#english) | [中文](#中文)

---

## English

### Features

- 🔍 **Intelligent Search** - High-quality web retrieval using Tavily Search API
- 🤖 **LLM Enhanced** - Supports OpenAI-compatible APIs for generating structured content
- 🎯 **Intent Recognition** - Automatically identifies three analysis scenarios: market analysis, product deep dive, and competitive comparison
- 💾 **Local Cache** - Historical reports automatically saved to localStorage for easy review
- 📊 **Visual Workflow** - Real-time display of thinking process with grouped progress stages
- ✨ **Smooth Animations** - Modern interactive experience powered by Framer Motion
- 📱 **Responsive Design** - Optimized for desktop and mobile devices

### Quick Start

#### Prerequisites

- Node.js 18+
- npm or yarn
- Tavily API Key ([Get one here](https://tavily.com))
- (Optional) OpenAI-compatible LLM API Key

#### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/competitor-research-skill.git
cd competitor-research-skill

# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
```

#### Configuration

Edit `.env.local` file:

```env
# Tavily API Key (Required)
TAVILY_API_KEY=your_tavily_api_key_here

# LLM API Configuration (Optional, for high-quality content generation)
LLM_API_KEY=your_llm_api_key_here
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini
```

**API Key Sources:**
- **Tavily API**: Register at [https://tavily.com](https://tavily.com)
- **LLM API**: Supports OpenAI-compatible interfaces (OpenAI, Azure, local deployments, etc.)

#### Running the Application

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### How It Works

```
User Input → Intent Recognition → Information Retrieval → Data Cleaning → Deep Analysis → Report Generation
```

#### Three Analysis Scenarios

| Scenario | Keyword Examples | Analysis Focus |
|----------|------------------|----------------|
| Market Analysis | "XX market", "XX industry" | Market size, major players, trends |
| Product Deep Dive | Single product name | Features, architecture, user reviews |
| Competitive Comparison | "vs", "compare", "competitors" | Multi-product feature/price comparison |

### Project Structure

```
competitor-research-skill/
├── frontend/                 # Next.js frontend application
│   ├── app/
│   │   ├── api/              # API endpoints (SSE streaming)
│   │   ├── page.tsx          # Main page
│   │   └── layout.tsx        # Root layout
│   ├── components/
│   │   ├── ThinkingProcess   # Thinking process display
│   │   ├── ResultRenderer    # Markdown renderer
│   │   ├── HistoryPanel      # History panel
│   │   └── ApiKeyModal       # API configuration modal
│   ├── lib/
│   │   ├── engine/           # Workflow engine
│   │   ├── storage.ts        # Local cache service
│   │   ├── tavily.ts         # Tavily API client
│   │   └── llm.ts            # LLM API client
│   └── prompts/              # Prompt templates
├── prompts/                  # Backend prompt templates
├── schemas/                  # JSON Schema definitions
├── scripts/                  # Utility scripts
└── config/                   # Runtime configuration
```

### Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS, Framer Motion
- **Rendering**: react-markdown, remark-gfm
- **APIs**: Tavily Search, OpenAI-compatible LLM
- **Communication**: Server-Sent Events (SSE) streaming

### Usage Examples

1. **Market Analysis**
   - Input: "AI email assistant market"
   - Output: Market overview, major players, trends, opportunities

2. **Product Deep Dive**
   - Input: "Superhuman email client"
   - Output: Product features, pricing, user reviews, technical architecture

3. **Competitive Comparison**
   - Input: "Superhuman vs Front vs Missive"
   - Output: Feature comparison table, pricing analysis, pros/cons

### Development

```bash
# Install dependencies
cd frontend
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint
```

### Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Important Notes

- `.env.local` contains sensitive information and is excluded in `.gitignore`
- Never commit API keys to version control
- Tavily free tier has request limits - use responsibly
- LLM API failures automatically fallback to template generation mode

### License

MIT License - see [LICENSE](LICENSE) file for details

### Support

If you encounter any issues or have questions:
- Open an issue on GitHub
- Check existing issues for solutions
- Refer to the documentation

---

## 中文

### 功能特性

- 🔍 **智能搜索** - 使用 Tavily Search API 进行高质量网页检索
- 🤖 **LLM 增强** - 支持 OpenAI 兼容 API，生成高质量结构化内容
- 🎯 **意图识别** - 自动识别三种分析场景：市场分析、产品深度研究、产品竞争分析
- 💾 **本地缓存** - 历史报告自动保存到 localStorage，随时查看回顾
- 📊 **可视化流程** - 实时展示思考过程，分组呈现各阶段进展
- ✨ **流畅动画** - 基于 Framer Motion 的现代化交互体验
- 📱 **响应式设计** - 适配桌面和移动设备

### 快速开始

#### 环境要求

- Node.js 18+
- npm 或 yarn
- Tavily API Key（[点击获取](https://tavily.com)）
- （可选）OpenAI 兼容的 LLM API Key

#### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/yourusername/competitor-research-skill.git
cd competitor-research-skill

# 进入前端目录
cd frontend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
```

#### 配置说明

编辑 `.env.local` 文件：

```env
# Tavily API Key（必需）
TAVILY_API_KEY=your_tavily_api_key_here

# LLM API 配置（可选，用于生成高质量内容）
LLM_API_KEY=your_llm_api_key_here
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini
```

**API Key 获取：**
- **Tavily API**: 访问 [https://tavily.com](https://tavily.com) 注册获取
- **LLM API**: 支持 OpenAI 兼容接口（OpenAI、Azure、本地部署等）

#### 运行应用

```bash
# 开发模式
npm run dev

# 生产构建
npm run build
npm start
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000)。

### 工作流程

```
用户输入 → 意图识别 → 信息检索 → 数据清洗 → 深度分析 → 报告生成
```

#### 三种分析场景

| 场景 | 关键词示例 | 分析重点 |
|------|----------|---------|
| 市场分析 | "XX市场"、"XX行业" | 市场规模、主要厂商、发展趋势 |
| 产品深度研究 | 单一产品名称 | 产品功能、技术架构、用户评价 |
| 产品竞争分析 | "vs"、"对比"、"竞品" | 多产品功能/价格对比 |

### 项目结构

```
competitor-research-skill/
├── frontend/                 # Next.js 前端应用
│   ├── app/
│   │   ├── api/              # API 端点（SSE 流式）
│   │   ├── page.tsx          # 主页面
│   │   └── layout.tsx        # 根布局
│   ├── components/
│   │   ├── ThinkingProcess   # 思考过程展示
│   │   ├── ResultRenderer    # Markdown 渲染
│   │   ├── HistoryPanel      # 历史报告面板
│   │   └── ApiKeyModal       # API 配置弹窗
│   ├── lib/
│   │   ├── engine/           # 工作流引擎
│   │   ├── storage.ts        # 本地缓存服务
│   │   ├── tavily.ts         # Tavily API 客户端
│   │   └── llm.ts            # LLM API 客户端
│   └── prompts/              # 提示词模板
├── prompts/                  # 后端提示词模板
├── schemas/                  # JSON Schema 定义
├── scripts/                  # 工具脚本
└── config/                   # 运行时配置
```

### 技术栈

- **前端**: Next.js 14、React 18、Tailwind CSS、Framer Motion
- **渲染**: react-markdown、remark-gfm
- **API**: Tavily Search、OpenAI 兼容 LLM
- **通信**: Server-Sent Events (SSE) 流式传输

### 使用示例

1. **市场分析**
   - 输入："AI 邮件助手市场"
   - 输出：市场概况、主要玩家、发展趋势、机会分析

2. **产品深度研究**
   - 输入："Superhuman 邮件客户端"
   - 输出：产品功能、定价、用户评价、技术架构

3. **产品竞争分析**
   - 输入："Superhuman vs Front vs Missive"
   - 输出：功能对比表、定价分析、优缺点对比

### 开发指南

```bash
# 安装依赖
cd frontend
npm install

# 运行开发服务器
npm run dev

# 生产构建
npm run build

# 代码检查
npm run lint
```

### 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 注意事项

- `.env.local` 包含敏感信息，已在 `.gitignore` 中排除
- 请勿将 API Key 提交到版本控制
- Tavily 免费套餐有请求限制，请合理使用
- LLM API 失败时会自动降级到模板生成模式

### 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

### 支持

如果遇到问题或有疑问：
- 在 GitHub 上提交 Issue
- 查看已有 Issue 寻找解决方案
- 参考项目文档

---

## Changelog

### v0.1.0 (2026-04)
- Initial release
- Basic competitor research functionality
- Three analysis scenarios support
- SSE streaming interface
- Local history storage

---

**Made with ❤️ by the community**
