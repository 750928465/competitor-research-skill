/**
 * 分析 Prompt 配置系统
 * 支持根据不同行业动态切换分析维度
 */

import { IntentResult } from '../engine/types';

// ============================================
// Prompt 配置接口
// ============================================

export interface PromptConfig {
  id: string;
  name: string;
  industry: string;
  dimensions: AnalysisDimension[];
  comparison_criteria: string[];
  insight_templates: string[];
  report_structure: ReportSection[];
}

export interface AnalysisDimension {
  name: string;
  description: string;
  sub_dimensions: string[];
  evaluation_criteria: string[];
}

export interface ReportSection {
  title: string;
  required: boolean;
  content_template: string;
}

// ============================================
// 默认配置：通用竞品分析
// ============================================

export const defaultConfig: PromptConfig = {
  id: 'default',
  name: '通用竞品分析',
  industry: 'general',
  dimensions: [
    {
      name: '技术架构',
      description: '产品的技术实现方式',
      sub_dimensions: ['API 设计', '部署方式', '扩展能力', '安全性'],
      evaluation_criteria: ['是否支持 API', '云原生程度', '数据安全认证'],
    },
    {
      name: '商业模式',
      description: '产品的盈利和运营方式',
      sub_dimensions: ['定价策略', '付费模式', '目标客户'],
      evaluation_criteria: ['价格竞争力', '付费灵活性', '免费试用'],
    },
    {
      name: '用户体验',
      description: '产品的易用性和体验设计',
      sub_dimensions: ['界面设计', '学习曲线', '功能完整性'],
      evaluation_criteria: ['UI/UX 质量', '文档完善度', '社区支持'],
    },
    {
      name: '市场定位',
      description: '产品在市场中的位置',
      sub_dimensions: ['目标市场', '竞争优势', '差异化特点'],
      evaluation_criteria: ['市场份额', '品牌认知', '独特价值'],
    },
  ],
  comparison_criteria: [
    '核心功能覆盖度',
    '价格竞争力',
    '技术成熟度',
    '服务质量',
    '生态完善度',
  ],
  insight_templates: [
    '【市场格局】{market_summary}',
    '【技术趋势】{tech_trends}',
    '【用户选择】{user_guidance}',
    '【风险提示】{risk_warnings}',
  ],
  report_structure: [
    { title: '执行摘要', required: true, content_template: '总结研究发现' },
    { title: '研究目标', required: true, content_template: '明确分析范围' },
    { title: '市场格局', required: true, content_template: '描述主要玩家' },
    { title: '对比分析', required: true, content_template: '功能对比矩阵' },
    { title: '深度洞察', required: true, content_template: '关键发现' },
    { title: '建议与总结', required: true, content_template: '行动建议' },
    { title: '参考资料', required: true, content_template: '来源列表' },
  ],
};

// ============================================
// 云手机 × OpenClaw 行业配置
// ============================================

export const cloudPhoneConfig: PromptConfig = {
  id: 'cloud-phone',
  name: '云手机行业分析',
  industry: 'cloud_phone',
  dimensions: [
    {
      name: '技术架构',
      description: '云手机的技术实现',
      sub_dimensions: ['ARM 仿真', 'GPU 虚拟化', '网络架构', '存储方案'],
      evaluation_criteria: [
        '支持 ARM 架构版本',
        'GPU 性能表现',
        '延迟控制',
        '并发能力',
      ],
    },
    {
      name: '业务场景',
      description: '适用的业务场景',
      sub_dimensions: ['游戏托管', 'APP 托管', '营销矩阵', '自动化测试'],
      evaluation_criteria: [
        '游戏兼容性',
        'APP 稳定性',
        '群控能力',
        '脚本支持',
      ],
    },
    {
      name: '成本结构',
      description: '使用成本分析',
      sub_dimensions: ['计费方式', '实例规格', '流量成本', '附加费用'],
      evaluation_criteria: [
        '小时计费 vs 包月',
        '配置弹性',
        '隐藏成本',
      ],
    },
    {
      name: '集成能力',
      description: '与 OpenClaw 等工具的集成',
      sub_dimensions: ['API 接口', 'SDK 支持', 'Webhook', '第三方集成'],
      evaluation_criteria: [
        'API 完整度',
        'SDK 语言支持',
        '文档质量',
      ],
    },
    {
      name: '服务保障',
      description: '服务商提供的支持',
      sub_dimensions: ['SLA 保证', '技术支持', '故障恢复', '数据安全'],
      evaluation_criteria: [
        '可用性承诺',
        '响应时间',
        '备份机制',
      ],
    },
  ],
  comparison_criteria: [
    '实例性能',
    '网络延迟',
    'API 能力',
    '价格优势',
    '服务可靠性',
    '场景适配度',
  ],
  insight_templates: [
    '【市场格局】云手机市场呈现 {market_structure}，主要玩家包括 {key_players}',
    '【技术趋势】ARM 云、GPU 虚拟化、边缘节点是主要技术方向',
    '【OpenClaw 集成】建议关注 API 兼容性和自动化能力',
    '【成本优化】根据业务峰值选择弹性计费可节省 {cost_saving}',
    '【风险提示】数据合规、网络稳定性是主要风险点',
  ],
  report_structure: [
    { title: '执行摘要', required: true, content_template: '研究核心发现' },
    { title: '研究目标', required: true, content_template: '云手机 × OpenClaw 案例分析' },
    { title: '技术架构分析', required: true, content_template: 'ARM 云架构对比' },
    { title: '业务场景适配', required: true, content_template: '场景-产品匹配矩阵' },
    { title: 'OpenClaw 集成分析', required: true, content_template: 'API 和 SDK 能力对比' },
    { title: '成本效益分析', required: true, content_template: 'TCO 对比' },
    { title: '案例参考', required: false, content_template: '成功落地案例' },
    { title: '建议与总结', required: true, content_template: '落地路径建议' },
    { title: '参考资料', required: true, content_template: '来源追溯' },
  ],
};

// ============================================
// 配置管理器
// ============================================

class PromptConfigManager {
  private configs: Map<string, PromptConfig> = new Map();

  constructor() {
    this.register(defaultConfig);
    this.register(cloudPhoneConfig);
  }

  register(config: PromptConfig): void {
    this.configs.set(config.id, config);
  }

  get(id: string): PromptConfig {
    return this.configs.get(id) || defaultConfig;
  }

  getByIndustry(industry: string): PromptConfig {
    for (const config of this.configs.values()) {
      if (config.industry === industry) {
        return config;
      }
    }
    return defaultConfig;
  }

  detectIndustry(query: string): string {
    const lowerQuery = query.toLowerCase();

    if (/云手机|cloud\s*phone|arm\s*云|红手指|雷电云/i.test(query)) {
      return 'cloud_phone';
    }

    return 'general';
  }

  getConfigForQuery(query: string): PromptConfig {
    const industry = this.detectIndustry(query);
    return this.getByIndustry(industry);
  }
}

export const promptConfigManager = new PromptConfigManager();

// ============================================
// Prompt 生成器
// ============================================

export function generateAnalysisPrompt(
  intent: IntentResult,
  industry: string = 'general'
): string {
  const config = promptConfigManager.getByIndustry(industry);

  let prompt = `# 分析任务\n\n`;
  prompt += `## 目标产品\n${intent.target_product}\n\n`;
  prompt += `## 分析意图\n${intent.intent}\n\n`;

  prompt += `## 分析维度\n\n`;
  for (const dim of config.dimensions) {
    prompt += `### ${dim.name}\n`;
    prompt += `${dim.description}\n\n`;
    prompt += `子维度: ${dim.sub_dimensions.join(', ')}\n\n`;
  }

  prompt += `## 对比标准\n\n`;
  prompt += config.comparison_criteria.map((c, i) => `${i + 1}. ${c}`).join('\n');
  prompt += '\n\n';

  prompt += `## 输出要求\n\n`;
  prompt += `- 客观中立，基于证据\n`;
  prompt += `- 所有结论需标注来源引用 [^n]\n`;
  prompt += `- 表格格式清晰\n`;

  return prompt;
}