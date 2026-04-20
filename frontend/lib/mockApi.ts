import { ThinkingStep } from './types';

// 带详情的思考步骤
const mockThinkingSteps: (Omit<ThinkingStep, 'id' | 'status'> & { detail?: ThinkingStep['detail'] })[] = [
  {
    text: '正在解析研究需求...',
    detail: {
      title: '需求解析',
      content: '识别产品类别、地理范围、关注维度等关键信息',
      sources: ['用户输入: AI 邮件助手'],
    },
  },
  {
    text: '正在检索官方网站信息...',
    detail: {
      title: '官方来源检索',
      content: '搜索 Gmail AI、Microsoft Copilot、GrammarlyGO 等产品的官方网站',
      sources: [
        'https://workspace.google.com/products/gmail/',
        'https://www.microsoft.com/microsoft-365/copilot',
        'https://www.grammarly.com/grammarlygo',
      ],
    },
  },
  {
    text: '正在收集竞品数据...',
    detail: {
      title: '数据收集',
      content: '提取产品功能、定价、目标用户等核心信息',
      sources: ['已验证来源: 3 个', '待验证来源: 2 个'],
    },
  },
  {
    text: '正在分析市场定位...',
    detail: {
      title: '市场分析',
      content: '对比核心能力、差异化特点、适用场景',
      sources: ['已收集产品: 4 个', '已验证产品: 3 个'],
    },
  },
  {
    text: '正在生成竞品分析报告...',
    detail: {
      title: '报告生成',
      content: '按照证据优先原则，生成结构化的竞品分析报告',
      sources: ['报告章节: 6 个'],
    },
  },
];

// 模拟的竞品分析结果
const mockResult = `# AI 邮件助手竞品分析报告

**生成日期**: 2026年03月30日

---

## 1. 研究目标

本报告旨在深入分析 AI 邮件助手产品领域的竞争格局，为用户提供全面的产品选型参考。

---

## 2. 主要厂商

| 厂商名称 | 产品名称 | 验证状态 | 市场定位 |
|---------|---------|---------|---------|
| Google | Gmail AI Assist | ✅ 已验证 | 大众市场 |
| Microsoft | Copilot for Outlook | ✅ 已验证 | 企业级办公 |
| Grammarly | GrammarlyGO | ✅ 已验证 | 专业写作 |
| Jasper | Jasper Email | ⚠️ 部分验证 | 营销导向 |

---

## 3. 核心能力对比

| 功能维度 | Gmail AI | Copilot | GrammarlyGO |
|---------|----------|---------|-------------|
| 智能撰写 | 支持（据官网） | 支持（据官网） | 支持（据官网） |
| 回复建议 | 支持（据官网） | 支持（据官网） | 不明确 |
| 语气调整 | 支持（据文档） | 支持（据文档） | 支持（据官网） |
| 多语言 | 支持 | 支持 | 支持 |

---

## 4. 差异化分析

### Gmail AI Assist
- **核心竞争力**: 与 Gmail 无缝深度集成
- **独特优势**: 智能"帮我回复"功能
- **市场定位**: 大众市场全覆盖

### Copilot for Outlook
- **核心竞争力**: 最强企业级功能
- **独特优势**: Microsoft 365 生态深度整合
- **市场定位**: 企业用户

### GrammarlyGO
- **核心竞争力**: 写作质量优化最佳
- **独特优势**: 语气和文体把控精细
- **市场定位**: 专业人士

---

## 5. 适用场景

- **日常商务沟通**: Gmail AI Assist, Copilot for Outlook
- **专业形象要求高**: GrammarlyGO
- **企业级办公**: Copilot for Outlook

---

## 6. 总结

AI 邮件助手市场呈现多强竞争格局。Google 和 Microsoft 凭借邮箱入口优势快速普及，Grammarly 等垂直专家在细分领域建立优势。

*本报告基于公开信息编制，仅供参考。*
`;

// 模拟流式返回思考步骤
export async function* mockThinkingStepsStream(): AsyncGenerator<ThinkingStep> {
  for (let i = 0; i < mockThinkingSteps.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 800));
    yield {
      id: `step-${i}`,
      text: mockThinkingSteps[i].text,
      status: 'active',
      detail: mockThinkingSteps[i].detail,
      expanded: false,
    };
  }
}

// 模拟流式返回结果
export async function* mockResultStream(): AsyncGenerator<string> {
  const words = mockResult.split('');
  const chunkSize = 3;

  for (let i = 0; i < words.length; i += chunkSize) {
    await new Promise(resolve => setTimeout(resolve, 15));
    yield words.slice(i, i + chunkSize).join('');
  }
}

// ============================================
// 真实 API 调用函数（需要后端支持）
// ============================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * 调用真实后端 API 进行竞品研究
 * 当前返回 Mock 数据，需要连接后端后替换实现
 */
export async function fetchCompetitorResearchReal(query: string): Promise<Response> {
  // TODO: 连接真实后端 API
  // const response = await fetch(`${API_BASE_URL}/api/research`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ query }),
  // });
  // return response;

  // 当前返回 Mock 响应
  console.log('⚠️ 当前使用 Mock 数据，未连接真实 API');
  return new Response(JSON.stringify({
    success: true,
    message: 'Mock response - 请连接真实后端 API',
    query,
  }));
}

/**
 * 流式调用竞品研究 API
 * 当前使用 Mock 实现
 */
export async function* streamCompetitorResearch(query: string): AsyncGenerator<{
  type: 'thinking' | 'result';
  data: ThinkingStep | string;
}> {
  // 1. 先返回思考步骤
  for await (const step of mockThinkingStepsStream()) {
    yield { type: 'thinking', data: step };
  }

  // 2. 返回结果
  for await (const chunk of mockResultStream()) {
    yield { type: 'result', data: chunk };
  }
}