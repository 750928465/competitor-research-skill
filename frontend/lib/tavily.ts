/**
 * Tavily API 客户端
 */

// Tavily 搜索结果类型
export interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
  raw_content?: string;
}

// Tavily 搜索响应类型
export interface TavilySearchResponse {
  results: TavilyResult[];
  answer?: string;
  query: string;
  images?: string[];
  follow_up_questions?: string[];
}

// Tavily 搜索选项
export interface TavilySearchOptions {
  query: string;
  search_depth?: 'basic' | 'advanced';
  include_answer?: boolean;
  include_raw_content?: boolean;
  max_results?: number;
  include_domains?: string[];
  exclude_domains?: string[];
}

/**
 * 检查 Tavily API Key 是否配置
 */
export function checkTavilyKey(): { valid: boolean; message: string } {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    return {
      valid: false,
      message: '未检测到 Tavily API Key，请先配置您的密钥以启用竞品检索能力。',
    };
  }

  return {
    valid: true,
    message: 'Tavily API Key 已配置',
  };
}

/**
 * 调用 Tavily Search API
 */
export async function tavilySearch(
  options: TavilySearchOptions
): Promise<TavilySearchResponse> {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    throw new Error('TAVILY_API_KEY 未配置');
  }

  const payload = {
    api_key: apiKey,
    query: options.query,
    search_depth: options.search_depth || 'advanced',
    include_answer: options.include_answer ?? false,
    include_raw_content: options.include_raw_content ?? true,
    max_results: options.max_results || 10,
    include_domains: options.include_domains || [],
    exclude_domains: options.exclude_domains || [],
  };

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Tavily API 错误: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * 批量执行多个搜索查询
 */
export async function batchTavilySearch(
  queries: string[],
  options: Partial<TavilySearchOptions> = {}
): Promise<Map<string, TavilySearchResponse>> {
  const results = new Map<string, TavilySearchResponse>();

  // 并行执行所有搜索
  const searchPromises = queries.map(async (query) => {
    try {
      const result = await tavilySearch({ query, ...options });
      results.set(query, result);
    } catch (error) {
      console.error(`搜索失败 [${query}]:`, error);
      results.set(query, {
        results: [],
        query,
      });
    }
  });

  await Promise.all(searchPromises);
  return results;
}