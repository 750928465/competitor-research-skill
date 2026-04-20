/**
 * 竞品研究引擎 - 核心工作流（LLM 增强版）
 */

import {
  EngineState,
  IntentResult,
  WorkflowContext,
  ProgressUpdate,
  SearchResult,
  StructuredData,
  AnalysisResult,
  ResearchReport,
  Citation,
  Reference,
} from './types';
import { generateWithLLM, getLLMConfig } from '../llm';
import { getCleaningPrompt, getReportPrompt, buildSearchResultsSummary, buildDataSummary } from '../prompts';

// ============================================
// 状态机配置
// ============================================

const STATE_ORDER: EngineState[] = [
  'IDLE',
  'IDENTIFYING',
  'CRAWLING',
  'CLEANING',
  'ANALYZING',
  'REPORTING',
  'COMPLETED',
];

const STATE_PROGRESS: Record<EngineState, number> = {
  IDLE: 0,
  IDENTIFYING: 10,
  CRAWLING: 30,
  CLEANING: 50,
  ANALYZING: 70,
  REPORTING: 90,
  COMPLETED: 100,
  ERROR: 0,
};

// ============================================
// 核心引擎类
// ============================================

export class ResearchEngine {
  private state: EngineState = 'IDLE';
  private context: WorkflowContext;
  private tavilyKey: string;
  private onProgress?: (update: ProgressUpdate) => void;
  private abortController: AbortController | null = null;

  constructor(tavilyKey: string, onProgress?: (update: ProgressUpdate) => void) {
    this.tavilyKey = tavilyKey;
    this.onProgress = onProgress;
    this.context = {
      query: '',
      initial_refs: [],
      active_refs: [],
      search_results: [],
    };
  }

  // 获取当前状态
  getState(): EngineState {
    return this.state;
  }

  // 获取上下文
  getContext(): WorkflowContext {
    return this.context;
  }

  // 中止执行
  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  // 更新状态并通知
  private transition(newState: EngineState, message: string): void {
    const oldState = this.state;
    this.state = newState;
    this.onProgress?.({
      state: newState,
      message,
      progress: STATE_PROGRESS[newState],
    });
    console.log(`[Engine] ${oldState} -> ${newState}: ${message}`);
  }

  // ============================================
  // 主执行流程
  // ============================================

  async execute(
    query: string,
    initialRefs: string[] = []
  ): Promise<ResearchReport> {
    this.abortController = new AbortController();
    this.context.query = query;
    this.context.initial_refs = initialRefs.map(url => ({
      url,
      source_type: 'user_provided' as const,
      priority: 10,
    }));

    try {
      // 步骤 1: 意图识别
      await this.identifyIntent();

      // 步骤 2: 检索与抓取
      await this.crawlAndFetch();

      // 步骤 3: 数据清洗
      await this.cleanData();

      // 步骤 4: 深度分析
      await this.analyze();

      // 步骤 5: 报告生成
      const report = await this.generateReport();

      this.transition('COMPLETED', '研究完成');
      return report;

    } catch (error) {
      this.state = 'ERROR';
      this.context.error = error instanceof Error ? error.message : '未知错误';
      throw error;
    }
  }

  // ============================================
  // 步骤 1: 意图识别
  // ============================================

  private async identifyIntent(): Promise<void> {
    this.transition('IDENTIFYING', '正在解析研究意图...');

    const query = this.context.query;
    const intent = this.parseIntent(query);
    this.context.intent = intent;

    this.onProgress?.({
      state: 'IDENTIFYING',
      message: `识别到: ${intent.target_product} - ${this.getIntentLabel(intent.intent)}`,
      progress: 15,
      details: { intent },
    });
  }

  private parseIntent(query: string): IntentResult {
    const lowerQuery = query.toLowerCase();

    // 识别意图类型（根据三种核心场景）
    let intent: IntentResult['intent'] = 'market_overview';
    let targetProduct = query;

    // 场景1：市场分析 - 用户明确要求分析某个市场/行业
    if (/市场|行业|调研|概览|分析报告|竞品分析|主要厂商/i.test(query)) {
      intent = 'market_analysis';
      // 提取市场关键词
      const marketMatch = query.match(/(\S+)\s*(市场|行业|调研|概览|分析)/);
      if (marketMatch) {
        targetProduct = marketMatch[1];
      }
    }
    // 场景3：产品市场竞争分析 - 用户想了解某个产品的竞争情况
    else if (/竞争|对手|竞品|vs|对比|比较|类似|同类/i.test(query)) {
      intent = 'product_competition';
      // 提取产品名
      const productMatch = query.match(/(\S+)\s*(的|与|和|同)\s*(竞争|对手|竞品|类似|同类)/);
      if (productMatch) {
        targetProduct = productMatch[1];
      } else {
        // 提取 "产品A vs 产品B" 或 "产品A 对比" 的情况
        const vsMatch = query.match(/(\S+)\s*(vs|对比|比较|和|与)/i);
        if (vsMatch) {
          targetProduct = vsMatch[1];
        }
      }
    }
    // 场景2：单一产品深度研究 - 只提到某个产品名，没有明确的对比/市场关键词
    else if (/案例|case/i.test(query)) {
      intent = 'case_study';
    } else if (/价格|定价|pricing/i.test(query)) {
      intent = 'price_analysis';
    } else if (/架构|技术|原理|实现/i.test(query)) {
      intent = 'tech_architecture';
    } else {
      // 默认判断：如果查询较短（<20字）且没有市场相关词，可能是单一产品研究
      if (query.length < 20 && !/市场|行业|厂商|竞品/i.test(query)) {
        intent = 'product_deep_research';
      }
    }

    // 提取时间范围
    const timeRangeMatch = query.match(/(\d{4})年?|最近(\d+)年?/);

    return {
      target_product: targetProduct,
      intent,
      parameters: {
        time_range: timeRangeMatch ? timeRangeMatch[1] || `最近${timeRangeMatch[2]}年` : '最近1年',
        depth: query.length > 50 ? 'deep' : 'standard',
      },
      confidence: 0.85,
    };
  }

  private getIntentLabel(intent: IntentResult['intent']): string {
    const labels: Record<IntentResult['intent'], string> = {
      case_study: '案例研究',
      feature_compare: '功能对比',
      price_analysis: '价格分析',
      market_overview: '市场概览',
      tech_architecture: '技术架构',
      market_analysis: '市场分析',
      product_deep_research: '产品深度研究',
      product_competition: '竞争分析',
      custom: '自定义分析',
    };
    return labels[intent] || '综合分析';
  }

  // ============================================
  // 步骤 2: 检索与抓取
  // ============================================

  private async crawlAndFetch(): Promise<void> {
    this.transition('CRAWLING', '正在检索相关信息...');

    const intent = this.context.intent!;
    const queries = this.generateSearchQueries(intent);

    const allResults: SearchResult[] = [];

    for (let i = 0; i < queries.length; i++) {
      if (this.abortController?.signal.aborted) {
        throw new Error('用户取消');
      }

      this.onProgress?.({
        state: 'CRAWLING',
        message: `搜索: ${queries[i].substring(0, 30)}...`,
        progress: 20 + (i / queries.length) * 10,
      });

      try {
        const results = await this.tavilySearch(queries[i]);
        allResults.push(...results);
      } catch (error) {
        console.error(`搜索失败: ${queries[i]}`, error);
      }
    }

    // 去重
    const uniqueResults = this.deduplicateResults(allResults);
    this.context.search_results = uniqueResults;

    // 抓取全文内容
    this.onProgress?.({
      state: 'CRAWLING',
      message: '正在抓取页面内容...',
      progress: 35,
      details: { sources_crawled: uniqueResults.length },
    });

    await this.fetchFullContent(uniqueResults);

    this.onProgress?.({
      state: 'CRAWLING',
      message: `检索完成，获取 ${uniqueResults.length} 条结果`,
      progress: 45,
      details: { refs_found: uniqueResults.length },
    });
  }

  private generateSearchQueries(intent: IntentResult): string[] {
    const product = intent.target_product;
    const queries: string[] = [];

    // 根据意图类型生成不同的搜索策略
    switch (intent.intent) {
      // 场景1：市场分析 - 搜索该市场的主要厂商和产品
      case 'market_analysis':
        queries.push(`${product} 市场分析 report`);
        queries.push(`${product} 主要厂商 competitors`);
        queries.push(`${product} 行业趋势 trend 2024 2025`);
        queries.push(`${product} 市场规模 market size`);
        queries.push(`${product} 产品对比 comparison`);
        queries.push(`${product} 最佳选择 best options`);
        break;

      // 场景2：单一产品深度研究 - 深挖产品各方面信息
      case 'product_deep_research':
        queries.push(`${product} 官网 official website`);
        queries.push(`${product} 产品介绍 introduction overview`);
        queries.push(`${product} 技术架构 architecture tech stack`);
        queries.push(`${product} 核心功能 core features capabilities`);
        queries.push(`${product} 商业模式 business model pricing`);
        queries.push(`${product} 用户案例 case study use cases`);
        queries.push(`${product} 使用方法 how to use tutorial`);
        queries.push(`${product} 优势特点 advantages pros cons`);
        break;

      // 场景3：产品市场竞争分析 - 先了解产品属性，再搜索竞品
      case 'product_competition':
        queries.push(`${product} 是什么 what is`);
        queries.push(`${product} 产品定位 positioning`);
        queries.push(`${product} 竞争对手 competitors alternatives`);
        queries.push(`${product} 类似产品 similar products`);
        queries.push(`${product} vs 对比 comparison`);
        queries.push(`${product} 替代方案 alternatives`);
        queries.push(`${product} 市场竞争 competition analysis`);
        break;

      // 原有场景
      case 'case_study':
        queries.push(`${product} 案例 study implementation`);
        queries.push(`${product} 最佳实践 best practices`);
        queries.push(`${product} 用户案例 user stories`);
        break;

      case 'feature_compare':
        queries.push(`${product} 功能对比 comparison`);
        queries.push(`${product} vs alternatives`);
        queries.push(`${product} 特性差异 features differences`);
        break;

      case 'price_analysis':
        queries.push(`${product} 价格 pricing`);
        queries.push(`${product} 成本 cost subscription`);
        queries.push(`${product} 定价策略 pricing strategy`);
        break;

      case 'tech_architecture':
        queries.push(`${product} 技术架构 architecture`);
        queries.push(`${product} API SDK integration`);
        queries.push(`${product} 技术原理 principle`);
        break;

      default:
        queries.push(`${product} 官网 official`);
        queries.push(`${product} 介绍 overview introduction`);
        queries.push(`${product} review 评价 2024 2025`);
    }

    // 添加用户提供的参考链接关键词
    if (this.context.initial_refs.length > 0) {
      queries.push(...this.context.initial_refs.map(r => `site:${new URL(r.url).hostname} ${product}`));
    }

    return queries;
  }

  private async tavilySearch(query: string): Promise<SearchResult[]> {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: this.tavilyKey,
        query,
        search_depth: 'advanced',
        include_raw_content: true,
        max_results: 8,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily API 错误: ${response.status}`);
    }

    const data = await response.json();

    return (data.results || []).map((r: any) => ({
      url: r.url,
      title: r.title,
      snippet: r.content || '',
      content: r.raw_content,
      source: new URL(r.url).hostname,
      publish_time: r.published_date,
      relevance_score: r.score || 0.5,
    }));
  }

  private deduplicateResults(results: SearchResult[]): SearchResult[] {
    const seen = new Map<string, SearchResult>();

    for (const result of results) {
      const key = result.url;
      if (!seen.has(key) || (result.content && !seen.get(key)?.content)) {
        seen.set(key, result);
      }
    }

    return Array.from(seen.values()).sort((a, b) => b.relevance_score - a.relevance_score);
  }

  private async fetchFullContent(results: SearchResult[]): Promise<void> {
    // Tavily 已返回 raw_content，这里做补充处理
    for (const result of results) {
      if (!result.content && result.snippet) {
        result.content = result.snippet;
      }
    }
  }

  // ============================================
  // 步骤 3: 数据清洗
  // ============================================

  private async cleanData(): Promise<void> {
    this.transition('CLEANING', '正在清洗和结构化数据...');

    const results = this.context.search_results;

    // 检查是否有 LLM 配置
    const llmConfig = getLLMConfig();

    if (llmConfig) {
      // 使用 LLM 进行智能清洗
      try {
        const searchResultsSummary = buildSearchResultsSummary(results);
        const prompt = getCleaningPrompt(searchResultsSummary);

        this.onProgress?.({
          state: 'CLEANING',
          message: '使用 LLM 分析搜索结果...',
          progress: 52,
        });

        const llmResponse = await generateWithLLM(prompt, {
          maxTokens: 4096,
          temperature: 0.3,
          systemPrompt: '你是一个专业的数据分析师，擅长从搜索结果中提取结构化信息。请严格按照 JSON 格式输出。',
        });

        // 解析 LLM 返回的 JSON
        const jsonMatch = llmResponse.match(/```json\s*([\s\S]*?)\s*```/) ||
                         llmResponse.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          const jsonStr = jsonMatch[1] || jsonMatch[0];
          const parsedData = JSON.parse(jsonStr);

          this.context.structured_data = {
            products: parsedData.products || [],
            features: parsedData.features || [],
            insights: parsedData.insights || [],
            tech_insights: parsedData.tech_insights || [],
            use_cases: parsedData.use_cases || [],
            trends: parsedData.trends || [],
            metadata: {
              total_sources: results.length,
              valid_sources: results.filter(r => r.content).length,
              processing_time: Date.now(),
              scene_type: parsedData.scene_type || 'competitor',
            },
          };

          const productCount = this.context.structured_data.products.length;
          const techCount = this.context.structured_data.tech_insights?.length || 0;
          const useCaseCount = this.context.structured_data.use_cases?.length || 0;

          let summaryMessage = '';
          if (productCount > 0) {
            summaryMessage = `识别到 ${productCount} 个产品`;
          } else if (techCount > 0 || useCaseCount > 0) {
            summaryMessage = `识别到 ${techCount} 条技术洞察，${useCaseCount} 个应用场景`;
          } else {
            summaryMessage = '已提取搜索结果信息';
          }

          this.onProgress?.({
            state: 'CLEANING',
            message: summaryMessage,
            progress: 60,
            details: { data_cleaned: productCount + techCount + useCaseCount },
          });
          return;
        }
      } catch (error) {
        console.error('LLM 清洗失败，回退到基础清洗:', error);
        // 发送 LLM 错误提示
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        const errorCodeMatch = errorMessage.match(/(\d{3})/);
        this.onProgress?.({
          state: 'CLEANING',
          message: 'LLM 调用失败，使用模板生成',
          progress: 50,
          details: {
            llm_error: {
              stage: 'cleaning',
              error_code: errorCodeMatch ? errorCodeMatch[1] : 'UNKNOWN',
              error_message: errorMessage.substring(0, 100),
            },
            fallback_used: true,
          },
        });
      }
    }

    // 回退到基础清洗（原有逻辑）
    const products = this.extractProducts(results);
    const features = this.extractFeatures(results, products);
    const insights = this.extractInsights(results);

    // 基础提取技术洞察和应用场景
    const techInsights = this.extractTechInsights(results);
    const useCases = this.extractUseCases(results);

    this.context.structured_data = {
      products,
      features,
      insights,
      tech_insights: techInsights,
      use_cases: useCases,
      trends: [],
      metadata: {
        total_sources: results.length,
        valid_sources: results.filter(r => r.content).length,
        processing_time: Date.now(),
        scene_type: products.length > 0 ? 'competitor' : 'new_technology',
      },
    };

    if (products.length === 0) {
      this.onProgress?.({
        state: 'CLEANING',
        message: '警告: 未识别到明确的产品信息',
        progress: 50,
        details: { data_cleaned: 0 },
      });
    } else {
      this.onProgress?.({
        state: 'CLEANING',
        message: `识别到 ${products.length} 个产品，${features.length} 个功能维度`,
        progress: 55,
        details: { data_cleaned: products.length },
      });
    }
  }

  private extractProducts(results: SearchResult[]): any[] {
    const products: any[] = [];
    const seen = new Set<string>();

    for (const result of results) {
      // 从标题提取产品名
      const titleMatch = result.title?.match(/^([^|–—-]+)/);
      if (titleMatch) {
        const name = titleMatch[1].trim();
        if (name.length > 2 && name.length < 50 && !seen.has(name.toLowerCase())) {
          seen.add(name.toLowerCase());
          products.push({
            name,
            vendor: this.extractVendor(result),
            website: result.url,
            description: result.snippet?.substring(0, 200) || '',
            features: [],
            sources: [{
              url: result.url,
              title: result.title,
            }],
          });
        }
      }
    }

    return products.slice(0, 10);
  }

  private extractVendor(result: SearchResult): string {
    const domain = new URL(result.url).hostname;
    const parts = domain.replace('www.', '').split('.');
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  }

  private extractFeatures(results: SearchResult[], products: any[]): any[] {
    const features: any[] = [];
    const featureKeywords = [
      'API', 'SDK', '集成', 'integration',
      '安全', 'security', '加密',
      '性能', 'performance', '速度',
      '价格', 'pricing', '免费',
      '支持', 'support', '客服',
    ];

    for (const keyword of featureKeywords) {
      features.push({
        name: keyword,
        description: `${keyword} 相关功能`,
        products: products.map(p => ({
          product: p.name,
          support_level: 'partial' as const,
        })),
      });
    }

    return features;
  }

  private extractInsights(results: SearchResult[]): any[] {
    const insights: any[] = [];

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.snippet && result.snippet.length > 50) {
        insights.push({
          category: '市场洞察',
          content: result.snippet.substring(0, 300),
          source_refs: [i + 1],
        });
      }
    }

    return insights.slice(0, 10);
  }

  private extractTechInsights(results: SearchResult[]): any[] {
    const techInsights: any[] = [];
    const techKeywords = ['架构', 'architecture', '技术', '技术栈', 'stack', 'API', 'SDK', '原理', '机制', '实现'];

    for (const result of results) {
      const content = result.content || result.snippet || '';
      if (content.length > 100) {
        // 检查是否包含技术关键词
        for (const keyword of techKeywords) {
          if (content.toLowerCase().includes(keyword.toLowerCase())) {
            techInsights.push({
              category: '技术洞察',
              content: content.substring(0, 500),
              source_url: result.url,
              confidence: 'medium',
            });
            break;
          }
        }
      }
    }

    return techInsights.slice(0, 5);
  }

  private extractUseCases(results: SearchResult[]): any[] {
    const useCases: any[] = [];
    const caseKeywords = ['案例', '应用', '场景', '用法', '实践', 'example', 'case', 'scenario', 'usage'];

    for (const result of results) {
      const content = result.content || result.snippet || '';
      if (content.length > 100) {
        for (const keyword of caseKeywords) {
          if (content.toLowerCase().includes(keyword.toLowerCase())) {
            useCases.push({
              scenario: result.title?.substring(0, 50) || '应用场景',
              description: content.substring(0, 300),
              source_url: result.url,
            });
            break;
          }
        }
      }
    }

    return useCases.slice(0, 5);
  }

  // ============================================
  // 步骤 4: 深度分析
  // ============================================

  private async analyze(): Promise<void> {
    this.transition('ANALYZING', '正在进行多维度分析...');

    const data = this.context.structured_data!;
    const intent = this.context.intent!;
    const sceneType = data.metadata.scene_type || 'competitor';

    // 检查是否有 LLM 配置
    const llmConfig = getLLMConfig();

    // 判断是否有足够的数据进行分析
    const hasProducts = data.products.length > 0;
    const hasTechInsights = (data.tech_insights?.length || 0) > 0;
    const hasUseCases = (data.use_cases?.length || 0) > 0;
    const hasData = hasProducts || hasTechInsights || hasUseCases;

    if (llmConfig && hasData) {
      try {
        // 使用 LLM 生成深度分析
        this.onProgress?.({
          state: 'ANALYZING',
          message: 'LLM 正在生成深度分析...',
          progress: 72,
        });

        // 根据场景类型选择不同的分析提示词
        let analysisPrompt: string;

        if (hasProducts && sceneType === 'competitor') {
          // 竞品分析场景
          analysisPrompt = `你是一个专业的竞品分析师。请基于以下数据生成深度分析。

## 产品数据
${buildDataSummary(data.products.slice(0, 5))}

## 功能数据
${buildDataSummary(data.features)}

## 分析意图
${intent.intent} - ${intent.target_product}

请生成以下分析内容（JSON 格式）：
1. 对比矩阵（comparison_matrix）：对比各产品在核心功能维度的表现
2. 维度分析（dimension_analysis）：技术架构、商业模式、市场定位分析
3. 洞察（insights）：关键发现和市场洞察
4. 建议（recommendations）：基于证据的建议

输出格式：
\`\`\`json
{
  "comparison_matrix": [
    {"dimension": "功能维度", "products": {"产品名": "支持情况"}}
  ],
  "dimension_analysis": [
    {"dimension": "技术架构", "analysis": "分析内容", "key_findings": ["发现"]}
  ],
  "insights": ["洞察"],
  "recommendations": ["建议"]
}
\`\`\``;
        } else {
          // 新技术/无竞品场景
          analysisPrompt = `你是一个专业的技术分析师。请基于以下数据生成深度分析。

## 研究主题
${intent.target_product}

## 技术洞察
${buildDataSummary(data.tech_insights || [])}

## 应用场景
${buildDataSummary(data.use_cases || [])}

## 市场洞察
${buildDataSummary(data.insights || [])}

请生成以下分析内容（JSON 格式）：
1. 技术架构分析（tech_analysis）：核心架构、技术原理、实现方式
2. 应用场景分析（scenario_analysis）：典型场景、适用行业、最佳实践
3. 发展趋势（trends）：技术演进方向、市场趋势、机会挑战
4. 实施建议（recommendations）：落地建议、注意事项、关键要点

输出格式：
\`\`\`json
{
  "tech_analysis": [
    {"dimension": "架构", "analysis": "分析内容", "key_findings": ["发现"]}
  ],
  "scenario_analysis": [
    {"scenario": "场景名", "description": "描述", "suitability": "适用性"}
  ],
  "trends": ["趋势描述"],
  "insights": ["洞察"],
  "recommendations": ["建议"]
}
\`\`\``;
        }

        const llmResponse = await generateWithLLM(analysisPrompt, {
          maxTokens: 4096,
          temperature: 0.5,
          systemPrompt: '你是一个专业的研究分析师，擅长基于证据进行分析。输出必须是有效的 JSON 格式。',
        });

        // 解析 LLM 返回的分析结果
        const jsonMatch = llmResponse.match(/```json\s*([\s\S]*?)\s*```/) ||
                         llmResponse.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          const jsonStr = jsonMatch[1] || jsonMatch[0];
          const parsedAnalysis = JSON.parse(jsonStr);

          // 根据场景类型构建不同的分析结果
          if (hasProducts && sceneType === 'competitor') {
            this.context.analysis = {
              executive_summary: this.generateSummary(data),
              comparison_matrix: parsedAnalysis.comparison_matrix || this.generateComparisonMatrix(data),
              dimension_analysis: parsedAnalysis.dimension_analysis || this.analyzeDimensions(data),
              insights: parsedAnalysis.insights || this.generateInsights(data, intent),
              recommendations: parsedAnalysis.recommendations || this.generateRecommendations(data),
              source_citations: this.generateCitations(),
            };
          } else {
            // 新技术/无竞品场景的分析结果
            this.context.analysis = {
              executive_summary: `本研究分析了 ${intent.target_product} 的技术架构、应用场景和发展趋势，基于 ${data.metadata.valid_sources} 个有效来源。`,
              comparison_matrix: [],
              dimension_analysis: parsedAnalysis.tech_analysis || [],
              insights: parsedAnalysis.trends || parsedAnalysis.insights || [],
              recommendations: parsedAnalysis.recommendations || [],
              source_citations: this.generateCitations(),
            };
          }

          this.onProgress?.({
            state: 'ANALYZING',
            message: 'LLM 分析完成',
            progress: 85,
            details: { analysis_depth: intent.parameters.depth },
          });
          return;
        }
      } catch (error) {
        console.error('LLM 分析失败，回退到基础分析:', error);
        // 发送 LLM 错误提示
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        const errorCodeMatch = errorMessage.match(/(\d{3})/);
        this.onProgress?.({
          state: 'ANALYZING',
          message: 'LLM 调用失败，使用模板生成',
          progress: 70,
          details: {
            llm_error: {
              stage: 'analyzing',
              error_code: errorCodeMatch ? errorCodeMatch[1] : 'UNKNOWN',
              error_message: errorMessage.substring(0, 100),
            },
            fallback_used: true,
          },
        });
      }
    }

    // 回退到基础分析
    const comparisonMatrix = this.generateComparisonMatrix(data);
    const dimensionAnalysis = this.analyzeDimensions(data);
    const insights = this.generateInsights(data, intent);

    this.context.analysis = {
      executive_summary: this.generateSummary(data),
      comparison_matrix: comparisonMatrix,
      dimension_analysis: dimensionAnalysis,
      insights,
      recommendations: this.generateRecommendations(data),
      source_citations: this.generateCitations(),
    };

    this.onProgress?.({
      state: 'ANALYZING',
      message: '分析完成',
      progress: 85,
      details: { analysis_depth: intent.parameters.depth },
    });
  }

  private generateSummary(data: StructuredData): string {
    const productCount = data.products.length;
    const techCount = data.tech_insights?.length || 0;
    const useCaseCount = data.use_cases?.length || 0;
    const sourceCount = data.metadata.valid_sources;

    // 根据实际内容生成有意义的摘要
    if (productCount > 0) {
      return `本研究分析了 ${productCount} 个主要产品，基于 ${sourceCount} 个有效来源。`;
    } else if (techCount > 0 || useCaseCount > 0) {
      return `本研究基于 ${sourceCount} 个有效来源，提取了 ${techCount} 条技术洞察和 ${useCaseCount} 个应用场景。`;
    } else if (sourceCount > 0) {
      return `本研究基于 ${sourceCount} 个搜索来源进行了综合分析。`;
    } else {
      return `正在整理分析结果...`;
    }
  }

  private generateComparisonMatrix(data: StructuredData): any[] {
    // 如果没有产品，返回空矩阵
    if (data.products.length === 0) {
      return [];
    }

    const matrix: any[] = [];
    const dimensions = ['核心功能', '易用性', '价格', '技术支持', '扩展性'];

    for (const dim of dimensions) {
      const row: any = { dimension: dim, products: {} };
      for (const product of data.products.slice(0, 5)) {
        row.products[product.name] = '信息待补充';
      }
      matrix.push(row);
    }

    return matrix;
  }

  private analyzeDimensions(data: StructuredData): any[] {
    // 如果有技术洞察，直接使用
    if (data.tech_insights && data.tech_insights.length > 0) {
      return data.tech_insights.map(insight => ({
        dimension: insight.category,
        analysis: insight.content,
        key_findings: [],
        source_refs: [],
      }));
    }

    // 如果没有足够数据，返回空数组
    if (data.products.length === 0) {
      return [];
    }

    return [
      {
        dimension: '技术架构',
        analysis: '基于搜索结果，建议进一步查阅官方文档获取详细架构信息。',
        key_findings: [],
        source_refs: [1],
      },
    ];
  }

  private generateInsights(data: StructuredData, intent: IntentResult): string[] {
    const insights: string[] = [];

    insights.push(`【市场格局】${data.products.length} 个主要玩家竞争，头部效应明显`);
    insights.push(`【技术趋势】API 化、云原生、AI 增强是主要方向`);
    insights.push(`【用户选择】建议根据业务规模和预算选择合适产品`);

    if (intent.intent === 'case_study') {
      insights.push(`【案例启发】成功案例普遍采用渐进式落地策略`);
    }

    return insights;
  }

  private generateRecommendations(data: StructuredData): string[] {
    return [
      '建议先进行小规模试点验证',
      '关注产品的 API 能力和集成成本',
      '评估供应商的服务质量和响应速度',
    ];
  }

  private generateCitations(): Citation[] {
    return this.context.search_results.slice(0, 10).map((r, i) => ({
      id: i + 1,
      url: r.url,
      title: r.title,
      publish_time: r.publish_time,
      accessed_at: new Date().toISOString(),
    }));
  }

  // ============================================
  // 步骤 5: 报告生成
  // ============================================

  private async generateReport(): Promise<ResearchReport> {
    this.transition('REPORTING', '正在生成研究报告...');

    const llmConfig = getLLMConfig();
    const data = this.context.structured_data;
    const hasProducts = (data?.products?.length ?? 0) > 0;
    const hasTechInsights = (data?.tech_insights?.length ?? 0) > 0;
    const hasUseCases = (data?.use_cases?.length ?? 0) > 0;
    const hasSearchResults = this.context.search_results.length > 0;
    const hasAnyContent = hasProducts || hasTechInsights || hasUseCases || hasSearchResults;

    // 只要有任何数据就使用 LLM 生成报告
    if (llmConfig && hasAnyContent) {
      try {
        this.onProgress?.({
          state: 'REPORTING',
          message: 'LLM 正在生成报告...',
          progress: 92,
        });

        // 使用 LLM 生成完整报告
        const reportContent = await this.generateReportWithLLM();

        // 构建 sections
        const sections = this.parseReportToSections(reportContent);

        const report: ResearchReport = {
          id: `report-${Date.now()}`,
          query: this.context.query,
          intent: this.context.intent!,
          generated_at: new Date().toISOString(),
          executive_summary: this.context.analysis?.executive_summary || '',
          sections,
          comparison_table: this.buildComparisonTable(this.context.analysis?.comparison_matrix || []),
          citations: this.context.analysis?.source_citations || [],
          metadata: {
            state_transitions: [],
            total_duration: 0,
            sources_used: this.context.search_results.length,
          },
        };

        this.onProgress?.({
          state: 'REPORTING',
          message: '报告生成完成',
          progress: 95,
        });

        return report;
      } catch (error) {
        console.error('LLM 报告生成失败，回退到基础报告:', error);
        // 发送 LLM 错误提示
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        const errorCodeMatch = errorMessage.match(/(\d{3})/);
        this.onProgress?.({
          state: 'REPORTING',
          message: 'LLM 调用失败，使用模板生成',
          progress: 90,
          details: {
            llm_error: {
              stage: 'reporting',
              error_code: errorCodeMatch ? errorCodeMatch[1] : 'UNKNOWN',
              error_message: errorMessage.substring(0, 100),
            },
            fallback_used: true,
          },
        });
      }
    }

    // 回退到基础报告生成
    const report = this.buildReport();

    this.onProgress?.({
      state: 'REPORTING',
      message: '报告生成完成',
      progress: 95,
    });

    return report;
  }

  /**
   * 使用 LLM 生成高质量报告
   */
  private async generateReportWithLLM(): Promise<string> {
    const data = this.context.structured_data!;
    const intent = this.context.intent!;
    const searchResults = this.context.search_results;

    // 构建搜索结果摘要
    const searchResultsContent = searchResults.slice(0, 10).map((r, i) =>
      `[${i + 1}] **${r.title}**\n来源: ${r.source}\n摘要: ${r.snippet?.substring(0, 500) || ''}\n${r.content ? `内容片段: ${r.content.substring(0, 800)}...` : ''}`
    ).join('\n\n');

    // 根据意图类型生成不同的提示词
    let sceneGuidance = '';

    switch (intent.intent) {
      // 场景1：市场分析
      case 'market_analysis':
        sceneGuidance = `
### 当前场景：市场分析
用户要求分析某个市场/行业的整体情况。

**必须包含的内容**：
1. **市场概览**：市场规模、发展趋势、主要玩家
2. **主要厂商/产品**：用表格列出该市场的核心产品（从搜索结果提取）
3. **产品形态对比**：各产品的功能特点、商业模式对比
4. **市场格局分析**：头部、腰部、尾部产品分布
5. **用户选择建议**：不同场景推荐的产品

**即使搜索结果没有明确列出产品对比，也要**：
- 从搜索结果的标题和内容中识别产品名
- 总结各产品的核心特点
- 构建对比框架`;
        break;

      // 场景2：单一产品深度研究
      case 'product_deep_research':
        sceneGuidance = `
### 当前场景：单一产品深度研究
用户想深入了解某个具体产品的各方面信息。

**必须包含的内容**：
1. **产品定位**：是什么、解决什么问题、目标用户
2. **技术架构**：核心技术栈、实现原理、架构特点
3. **核心功能**：主要功能模块、能力边界
4. **商业模式**：定价策略、盈利模式、目标市场
5. **应用场景**：典型使用场景、最佳实践
6. **发展现状**：市场表现、用户评价、未来规划

**从搜索结果中深度挖掘**：
- 技术细节、API文档片段
- 用户案例和评价
- 与同类产品的差异`;
        break;

      // 场景3：产品市场竞争分析
      case 'product_competition':
        sceneGuidance = `
### 当前场景：产品市场竞争分析
用户想了解某个产品面临的竞争情况。

**必须包含的内容**：
1. **产品分析**：该产品的定位、核心功能、目标用户
2. **竞品识别**：搜索出的类似/替代产品列表
3. **横向对比**：该产品与竞品的功能对比表格
4. **差异化分析**：各产品的独特优势、定位差异
5. **竞争格局**：市场排名、份额分布
6. **选型建议**：不同场景下的产品选择

**重点关注**：
- 从搜索结果中提取所有提到的竞品
- 对比该产品与竞品的核心差异`;
        break;

      default:
        sceneGuidance = `
### 当前场景：综合分析
根据搜索结果灵活组织报告内容。

**原则**：
- 充分利用搜索结果中的信息
- 避免输出空洞的内容
- 如果某些信息缺失，标注"暂未找到相关信息"`;
    }

    const prompt = `你是一个专业的研究分析师。请基于搜索结果生成一份有价值的研究报告。

## 用户查询
${this.context.query}

## 分析意图
类型: ${intent.intent}
目标: ${intent.target_product}

## 搜索结果（原始数据）
${searchResultsContent}

${sceneGuidance}

---

## 报告格式规范

### 标题格式
- 一级标题 \`#\`：仅用于报告总标题
- 二级标题 \`##\`：各章节标题，前后空一行

### 表格格式
表格前后空一行，左对齐：
| 项目 | 说明 | 来源 |
|:-----|:-----|:-----|

### 段落格式
- 段落之间空一行
- 重要内容用 **加粗** 突出

### 参考资料格式
报告末尾列出：
## 参考资料
[1] 标题 - URL

---

## 严格规则

1. **禁止输出空洞内容**：如果某个板块没有信息，直接跳过或写"暂未找到相关信息"
2. **充分利用搜索结果**：从标题、摘要、内容中提取有价值的信息
3. **证据标注**：重要信息标注来源（据[X]搜索结果）
4. **禁止编造**：不虚构不存在的信息
5. **保持内容充实**：即使信息有限，也要输出有价值的分析框架`;

    const response = await generateWithLLM(prompt, {
      maxTokens: 8192,
      temperature: 0.6,
      systemPrompt: '你是一个专业的研究分析师。不要输出空洞的内容，充分利用搜索结果生成有价值的报告。',
    });

    return response;
  }

  /**
   * 将 LLM 生成的报告解析为 sections
   */
  private parseReportToSections(content: string): any[] {
    const sections: any[] = [];
    const lines = content.split('\n');

    let currentSection: any = null;
    let currentContent: string[] = [];

    for (const line of lines) {
      // 检测二级标题（章节）
      const match = line.match(/^##\s+(.+)$/);
      if (match) {
        // 保存上一个章节
        if (currentSection) {
          currentSection.content = currentContent.join('\n').trim();
          sections.push(currentSection);
        }
        // 开始新章节
        currentSection = { title: match[1].trim(), content: '' };
        currentContent = [];
      } else if (currentSection) {
        currentContent.push(line);
      }
    }

    // 保存最后一个章节
    if (currentSection) {
      currentSection.content = currentContent.join('\n').trim();
      sections.push(currentSection);
    }

    // 如果解析失败，返回原始内容作为单个章节
    if (sections.length === 0) {
      sections.push({ title: '分析报告', content });
    }

    return sections;
  }

  private buildReport(): ResearchReport {
    const analysis = this.context.analysis!;
    const intent = this.context.intent!;

    const sections = [
      {
        title: '执行摘要',
        content: analysis.executive_summary,
      },
      {
        title: '研究目标',
        content: `本次研究聚焦于 **${intent.target_product}** 领域，分析意图为 **${this.getIntentLabel(intent.intent)}**。` +
          `研究范围：${intent.parameters.time_range || '近期'}。`,
      },
      {
        title: '市场格局',
        content: this.buildMarketSection(),
      },
      {
        title: '对比分析',
        content: this.buildComparisonSection(analysis.comparison_matrix),
      },
      {
        title: '深度洞察',
        content: analysis.insights.map((i, idx) => `${idx + 1}. ${i}`).join('\n\n'),
      },
      {
        title: '建议与总结',
        content: analysis.recommendations.map((r, idx) => `${idx + 1}. ${r}`).join('\n'),
      },
    ];

    return {
      id: `report-${Date.now()}`,
      query: this.context.query,
      intent,
      generated_at: new Date().toISOString(),
      executive_summary: analysis.executive_summary,
      sections,
      comparison_table: this.buildComparisonTable(analysis.comparison_matrix),
      citations: analysis.source_citations,
      metadata: {
        state_transitions: [],
        total_duration: 0,
        sources_used: this.context.search_results.length,
      },
    };
  }

  private buildMarketSection(): string {
    const products = this.context.structured_data?.products || [];
    if (products.length === 0) {
      return '暂未识别到明确的市场玩家，建议提供更多参考链接。';
    }

    let content = '### 主要玩家\n\n';
    content += '| 序号 | 产品名称 | 厂商 | 简介 |\n';
    content += '|:----:|:--------|:-----|:-----|\n';

    products.slice(0, 8).forEach((p, i) => {
      const name = this.escapeMarkdown(p.name || '未知');
      const vendor = this.escapeMarkdown(p.vendor || '-');
      const desc = p.description ? this.escapeMarkdown(p.description.substring(0, 50)) : '-';
      content += `| ${i + 1} | ${name} | ${vendor} | ${desc}${p.description && p.description.length > 50 ? '...' : ''} |\n`;
    });

    return content;
  }

  private buildComparisonSection(matrix: any[]): string {
    if (!matrix || matrix.length === 0) {
      return '数据不足，无法生成对比矩阵。';
    }

    // 获取所有产品名
    const productNames: string[] = [];
    for (const row of matrix) {
      if (row.products) {
        for (const name of Object.keys(row.products)) {
          if (!productNames.includes(name)) {
            productNames.push(name);
          }
        }
      }
    }

    if (productNames.length === 0) {
      return '暂无产品对比数据。';
    }

    // 构建表头
    let content = '### 功能对比矩阵\n\n';
    content += '| 维度 |';
    productNames.slice(0, 5).forEach(name => {
      content += ` ${this.escapeMarkdown(name)} |`;
    });
    content += '\n';

    // 表头分隔符
    content += '|:-----|';
    productNames.slice(0, 5).forEach(() => {
      content += ':------:|';
    });
    content += '\n';

    // 表格内容
    for (const row of matrix) {
      content += `| ${row.dimension || '-'} |`;
      productNames.slice(0, 5).forEach(name => {
        const value = row.products?.[name] || '-';
        content += ` ${value} |`;
      });
      content += '\n';
    }

    return content;
  }

  private buildComparisonTable(matrix: any[]): string {
    return this.buildComparisonSection(matrix);
  }

  // 转义 Markdown 特殊字符
  private escapeMarkdown(text: string): string {
    if (!text) return '-';
    return text
      .replace(/\|/g, '\\|')
      .replace(/\n/g, ' ')
      .trim();
  }
}

// ============================================
// 导出工厂函数
// ============================================

export function createResearchEngine(
  tavilyKey: string,
  onProgress?: (update: ProgressUpdate) => void
): ResearchEngine {
  return new ResearchEngine(tavilyKey, onProgress);
}