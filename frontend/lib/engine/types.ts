/**
 * 竞品研究引擎 - 状态机与类型定义
 */

// ============================================
// 状态定义
// ============================================

export type EngineState =
  | 'IDLE'           // 空闲状态
  | 'IDENTIFYING'    // 意图识别中
  | 'CRAWLING'       // 检索与抓取中
  | 'CLEANING'       // 数据清洗中
  | 'ANALYZING'      // 深度分析中
  | 'REPORTING'      // 报告生成中
  | 'COMPLETED'      // 完成
  | 'ERROR';         // 错误

// ============================================
// 意图识别结果
// ============================================

export interface IntentResult {
  target_product: string;        // 目标产品
  intent: AnalysisIntent;        // 分析意图
  parameters: {
    time_range?: string;         // 时间范围
    specific_competitors?: string[]; // 特定竞品
    industry?: string;           // 行业
    depth?: 'quick' | 'standard' | 'deep'; // 分析深度
  };
  confidence: number;            // 置信度
}

export type AnalysisIntent =
  | 'case_study'       // 案例研究
  | 'feature_compare'  // 功能对比
  | 'price_analysis'   // 价格分析
  | 'market_overview'  // 市场概览（分析某个市场）
  | 'tech_architecture' // 技术架构
  | 'market_analysis'   // 市场分析（分析某个市场/行业）
  | 'product_deep_research' // 单一产品深度研究
  | 'product_competition'   // 产品市场竞争分析
  | 'custom';          // 自定义

// ============================================
// 参考链接与检索
// ============================================

export interface Reference {
  url: string;
  title?: string;
  source_type: 'user_provided' | 'search_result' | 'official' | 'media';
  priority: number;  // 优先级，用于检索排序
}

export interface SearchResult {
  url: string;
  title: string;
  snippet: string;
  content?: string;  // 抓取后的全文
  source: string;    // 来源域名
  publish_time?: string;
  author?: string;
  relevance_score: number;
}

// ============================================
// 结构化数据
// ============================================

export interface StructuredData {
  products: ProductInfo[];
  features: FeatureInfo[];
  insights: InsightInfo[];
  tech_insights?: TechInsight[];
  use_cases?: UseCase[];
  trends?: TrendInfo[];
  metadata: {
    total_sources: number;
    valid_sources: number;
    processing_time: number;
    scene_type?: string;
  };
}

export interface TechInsight {
  category: string;
  content: string;
  source_url?: string;
  confidence?: 'high' | 'medium' | 'low';
}

export interface UseCase {
  scenario: string;
  description: string;
  source_url?: string;
}

export interface TrendInfo {
  trend: string;
  description: string;
  source_url?: string;
}

export interface ProductInfo {
  name: string;
  vendor: string;
  website?: string;
  description: string;
  features: string[];
  pricing?: string;
  target_users?: string;
  market_position?: string;
  sources: SourceReference[];
}

export interface FeatureInfo {
  name: string;
  description: string;
  products: { product: string; support_level: 'full' | 'partial' | 'none'; details?: string }[];
}

export interface InsightInfo {
  category: string;
  content: string;
  source_refs: number[]; // 引用索引
}

export interface SourceReference {
  url: string;
  title: string;
  publish_time?: string;
  author?: string;
}

// ============================================
// 分析结果
// ============================================

export interface AnalysisResult {
  executive_summary: string;
  comparison_matrix: ComparisonRow[];
  dimension_analysis: DimensionAnalysis[];
  insights: string[];
  recommendations: string[];
  source_citations: Citation[];
}

export interface ComparisonRow {
  dimension: string;
  products: { [productName: string]: string };
}

export interface DimensionAnalysis {
  dimension: string;
  analysis: string;
  key_findings: string[];
  source_refs: number[];
}

export interface Citation {
  id: number;
  url: string;
  title: string;
  publish_time?: string;
  author?: string;
  accessed_at: string;
}

// ============================================
// 报告结构
// ============================================

export interface ResearchReport {
  id: string;
  query: string;
  intent: IntentResult;
  generated_at: string;
  executive_summary: string;
  sections: ReportSection[];
  comparison_table?: string;
  citations: Citation[];
  metadata: {
    state_transitions: StateTransition[];
    total_duration: number;
    sources_used: number;
  };
}

export interface ReportSection {
  title: string;
  content: string;
  subsections?: ReportSection[];
}

export interface StateTransition {
  from: EngineState;
  to: EngineState;
  timestamp: string;
  duration_ms?: number;
}

// ============================================
// 工作流上下文
// ============================================

export interface WorkflowContext {
  query: string;
  intent?: IntentResult;
  initial_refs: Reference[];
  active_refs: Reference[];
  search_results: SearchResult[];
  structured_data?: StructuredData;
  analysis?: AnalysisResult;
  report?: ResearchReport;
  error?: string;
}

// ============================================
// 进度回调
// ============================================

export interface ProgressUpdate {
  state: EngineState;
  message: string;
  progress: number; // 0-100
  details?: {
    intent?: IntentResult;
    refs_found?: number;
    sources_crawled?: number;
    data_cleaned?: number;
    analysis_depth?: string;
    llm_error?: {
      stage: 'cleaning' | 'analyzing' | 'reporting';
      error_code?: string;
      error_message: string;
    };
    fallback_used?: boolean; // 标记是否使用了模板回退
  };
}