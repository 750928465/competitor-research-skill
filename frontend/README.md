# 竞品研究助手 - 前端界面

一个现代化的 AI 搜索交互界面，使用 Next.js + Tailwind CSS + Framer Motion 构建，后端集成 Tavily Search API。

## 功能特性

- 🔍 **Tavily Search API 集成** - 高质量的网页搜索能力
- 🎨 **极简设计** - 大量留白，柔和阴影，微弱边框
- ✨ **流畅动画** - 弹簧物理动画，无缝状态过渡
- 🔄 **流式输出** - Server-Sent Events 实时推送思考步骤
- 💭 **可展开的思考过程** - 点击查看每个步骤的详情
- 📱 **响应式设计** - 适配各种屏幕尺寸

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 Tavily API Key

1. 访问 [https://tavily.com](https://tavily.com) 注册账号并获取 API Key
2. 创建 `.env.local` 文件：

```bash
cp .env.example .env.local
```

3. 编辑 `.env.local`，填入您的 API Key：

```
TAVILY_API_KEY=tvly-xxxxxxxxxxxxx
```

### 3. 启动开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看效果。

## 项目结构

```
frontend/
├── app/
│   ├── api/
│   │   ├── check-key/route.ts   # API Key 检查端点
│   │   └── research/route.ts    # 竞品研究 API (SSE 流式)
│   ├── globals.css              # 全局样式
│   ├── layout.tsx               # 根布局
│   └── page.tsx                 # 主页面
├── components/
│   ├── SearchInput.tsx          # 搜索输入组件
│   ├── ThinkingProcess.tsx      # 思考过程展示
│   └── ResultRenderer.tsx       # Markdown 结果渲染
├── lib/
│   ├── mockApi.ts               # Mock API（备用）
│   ├── tavily.ts                # Tavily API 客户端
│   ├── types.ts                 # TypeScript 类型定义
│   └── workflow.ts              # 竞品研究工作流
└── package.json
```

## 工作流程

```
1. 检查 API Key → 2. 查询重写 → 3. Tavily 检索 → 4. 数据清洗 → 5. 报告生成
```

### 步骤说明

1. **检查 API Key** - 验证 Tavily API Key 是否已配置
2. **查询重写** - 将用户查询转换为多个搜索意图
3. **Tavily 检索** - 使用 Tavily API 执行搜索
4. **数据清洗** - 从搜索结果中提取产品信息
5. **报告生成** - 生成 Markdown 格式的竞品分析报告

## API 端点

### GET /api/check-key

检查 Tavily API Key 是否已配置。

**响应**:
```json
{
  "valid": true,
  "message": "Tavily API Key 已配置"
}
```

### POST /api/research

执行竞品研究（Server-Sent Events 流式响应）。

**请求**:
```json
{
  "query": "AI 邮件助手"
}
```

**响应流**:
```
data: {"type":"thinking","data":{...}}
data: {"type":"done","data":{"report":"...","products":[...]}}
```

## 技术栈

- **Next.js 14** - React 框架（App Router）
- **Tailwind CSS** - 原子化 CSS
- **Framer Motion** - 动画库
- **react-markdown** - Markdown 渲染
- **Tavily API** - 搜索引擎 API
- **TypeScript** - 类型安全

## 注意事项

- `.env.local` 文件包含敏感信息，已添加到 `.gitignore`
- 请勿将 API Key 提交到版本控制
- Tavily 免费套餐有请求限制，请合理使用