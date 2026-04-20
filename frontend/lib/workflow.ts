/**
 * 竞品研究工作流处理器
 */

import { tavilySearch, TavilyResult, checkTavilyKey } from './tavily';

// ============================================
// 类型定义
// ============================================

export interface ThinkingStep {
  id: string;
  text: string;
  status: 'pending' | 'active' | 'done';
  detail?: {
    title: string;
    content: string;
    sources?: string[];
  };
}

export interface ProductInfo {
  name: string;
  vendor: string;
  website: string;
  verification_status: 'verified' | 'partial' | 'unclear';
  core_features: string[];
  key_highlights: string[];
  sources: { url: string; title: string }[];
}

export interface ResearchResult {
  query: string;
  products: ProductInfo[];
  excluded_products: { name: string; reason: string }[];
  report: string;
}

// ============================================
// 步骤 1: 检查 API Key
// ============================================

export function validateApiKey(): { valid: boolean; message: string } {
  return checkTavilyKey();
}

// ============================================
// 步骤 2: 查询重写
// ============================================

export function rewriteQueries(originalQuery: string): string[] {
  const queries: string[] = [
    // 官方网站搜索
    `${originalQuery} official website`,
    `${originalQuery} 官网`,
    // 厂商搜索
    `${originalQuery} main vendors companies`,
    `${originalQuery} 主要厂商`,
    // 功能对比
    `${originalQuery} features comparison review`,
    `${originalQuery} 功能对比`,
    // 最新动态
    `${originalQuery} 2024 2025`,
  ];

  return queries;
}

// ============================================
// 步骤 3: 执行搜索
// ============================================

export async function executeSearch(
  queries: string[],
  onProgress?: (step: ThinkingStep) => void
): Promise<Map<string, TavilyResult[]>> {
  const allResults = new Map<string, TavilyResult[]>();

  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];

    onProgress?.({
      id: `search-${i}`,
      text: `正在搜索: ${query.substring(0, 30)}...`,
      status: 'active',
      detail: {
        title: '搜索执行',
        content: `使用 Tavily API 执行搜索`,
        sources: [query],
      },
    });

    try {
      const response = await tavilySearch({
        query,
        search_depth: 'advanced',
        max_results: 5,
        include_raw_content: true,
      });

      allResults.set(query, response.results);

      onProgress?.({
        id: `search-${i}`,
        text: `完成搜索: 找到 ${response.results.length} 条结果`,
        status: 'done',
        detail: {
          title: '搜索完成',
          content: `查询: ${query}`,
          sources: response.results.map(r => r.url),
        },
      });
    } catch (error) {
      console.error(`搜索失败 [${query}]:`, error);
      allResults.set(query, []);
    }
  }

  return allResults;
}

// ============================================
// 步骤 4: 结果清洗与产品识别
// ============================================

export function cleanAndExtractProducts(
  searchResults: Map<string, TavilyResult[]>,
  originalQuery: string
): { products: ProductInfo[]; excluded: { name: string; reason: string }[] } {
  const products: ProductInfo[] = [];
  const excluded: { name: string; reason: string }[] = [];
  const seenProducts = new Set<string>();

  // 从搜索结果中提取产品
  for (const [query, results] of searchResults) {
    for (const result of results) {
      // 尝试从标题和内容中识别产品名称
      const productName = extractProductName(result.title, result.content, originalQuery);

      if (!productName || seenProducts.has(productName.toLowerCase())) {
        continue;
      }

      seenProducts.add(productName.toLowerCase());

      // 检查是否有官方网站
      const hasOfficialSite = isValidOfficialSite(result.url, productName);

      if (!hasOfficialSite) {
        excluded.push({
          name: productName,
          reason: '无明确官方网站',
        });
        continue;
      }

      // 提取产品信息
      const product: ProductInfo = {
        name: productName,
        vendor: extractVendor(result.title, result.content),
        website: result.url,
        verification_status: 'partial',
        core_features: extractFeatures(result.content),
        key_highlights: [],
        sources: [{ url: result.url, title: result.title }],
      };

      products.push(product);
    }
  }

  return { products, excluded };
}

// 辅助函数：提取产品名称
function extractProductName(title: string, content: string, query: string): string | null {
  // 简单的产品名称提取逻辑
  // 从标题中提取可能的产品名称
  const titleParts = title.split(/[-|·–—]/);
  let name = titleParts[0]?.trim();

  if (name && name.length > 2 && name.length < 50) {
    return name;
  }

  return null;
}

// 辅助函数：检查是否为有效官网
function isValidOfficialSite(url: string, productName: string): boolean {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase();

    // 排除一些明显不是官网的域名
    const excludePatterns = [
      /google\.com\/search/,
      /bing\.com\/search/,
      /youtube\.com/,
      /twitter\.com/,
      /facebook\.com/,
      /linkedin\.com\/company/,
      /g2\.com/,
      /capterra\.com/,
      /reddit\.com/,
    ];

    for (const pattern of excludePatterns) {
      if (pattern.test(url)) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

// 辅助函数：提取厂商名称
function extractVendor(title: string, content: string): string {
  // 从标题或内容中提取厂商
  const vendorPatterns = [
    /by\s+([A-Z][a-zA-Z\s]+)/,
    /from\s+([A-Z][a-zA-Z\s]+)/,
  ];

  for (const pattern of vendorPatterns) {
    const match = title.match(pattern) || content.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return 'Unknown';
}

// 辅助函数：提取功能列表
function extractFeatures(content: string): string[] {
  const features: string[] = [];
  const lowerContent = content.toLowerCase();

  // 查找常见的功能关键词
  const featurePatterns = [
    /AI[\s-]?powered/gi,
    /automated/gi,
    /smart/gi,
    /intelligent/gi,
    /machine learning/gi,
    /natural language/gi,
  ];

  for (const pattern of featurePatterns) {
    const matches = content.match(pattern);
    if (matches) {
      features.push(...matches.slice(0, 3));
    }
  }

  return [...new Set(features)].slice(0, 5);
}

// ============================================
// 步骤 5: 生成报告
// ============================================

export function generateReport(
  query: string,
  products: ProductInfo[],
  excluded: { name: string; reason: string }[]
): string {
  const verifiedProducts = products.filter(p => p.verification_status !== 'unclear');

  let report = `# ${query} 竞品分析报告

**生成日期**: ${new Date().toLocaleDateString('zh-CN')}

---

## 1. 研究目标

本报告基于 Tavily Search API 检索结果，分析 **${query}** 领域的主要竞品。

---

## 2. 主要厂商

| 厂商名称 | 产品名称 | 官网 | 验证状态 |
|---------|---------|------|---------|
`;

  if (verifiedProducts.length === 0) {
    report += `| 暂无已验证产品 | - | - | - |\n`;
  } else {
    for (const product of verifiedProducts.slice(0, 10)) {
      const statusEmoji = product.verification_status === 'verified' ? '✅' : '⚠️';
      report += `| ${product.vendor} | ${product.name} | [官网](${product.website}) | ${statusEmoji} |\n`;
    }
  }

  report += `
---

## 3. 核心能力对比

| 产品 | 核心功能 |
|-----|---------|
`;

  for (const product of verifiedProducts.slice(0, 5)) {
    const features = product.core_features.slice(0, 3).join(', ') || '信息有限';
    report += `| ${product.name} | ${features} |\n`;
  }

  report += `
---

## 4. 待核实信息与缺失项

### 4.1 未纳入分析的产品

| 产品名称 | 排除原因 |
|---------|---------|
`;

  for (const item of excluded.slice(0, 5)) {
    report += `| ${item.name} | ${item.reason} |\n`;
  }

  report += `
### 4.2 本报告的局限性

- 信息截止时间: ${new Date().toLocaleDateString('zh-CN')}
- 基于 Tavily Search API 检索结果
- 建议进一步验证各产品官方网站信息

---

## 5. 参考资料

`;

  const allSources = new Set<string>();
  for (const product of verifiedProducts) {
    for (const source of product.sources) {
      allSources.add(source.url);
    }
  }

  let i = 1;
  for (const url of allSources) {
    report += `${i}. ${url}\n`;
    i++;
  }

  report += `
---

*本报告基于 Tavily Search API 自动生成，仅供参考。*
`;

  return report;
}

// ============================================
// 完整工作流
// ============================================

export async function runResearchWorkflow(
  query: string,
  onProgress?: (step: ThinkingStep) => void
): Promise<ResearchResult> {
  // 步骤 1: 检查 API Key
  const keyCheck = validateApiKey();
  if (!keyCheck.valid) {
    throw new Error(keyCheck.message);
  }

  // 步骤 2: 查询重写
  onProgress?.({
    id: 'rewrite',
    text: '正在生成检索策略...',
    status: 'active',
    detail: { title: '查询重写', content: '将原始查询转换为多个搜索意图' },
  });

  const queries = rewriteQueries(query);

  onProgress?.({
    id: 'rewrite',
    text: `已生成 ${queries.length} 个检索查询`,
    status: 'done',
    detail: { title: '查询重写完成', content: '搜索查询已生成', sources: queries },
  });

  // 步骤 3: 执行搜索
  onProgress?.({
    id: 'search-start',
    text: '正在执行检索...',
    status: 'active',
    detail: { title: 'Tavily 搜索', content: '使用 Tavily API 执行多个搜索查询' },
  });

  const searchResults = await executeSearch(queries, onProgress);

  const totalResults = Array.from(searchResults.values()).reduce((sum, r) => sum + r.length, 0);
  onProgress?.({
    id: 'search-done',
    text: `检索完成，共获取 ${totalResults} 条结果`,
    status: 'done',
    detail: { title: '搜索完成', content: `执行了 ${queries.length} 个查询` },
  });

  // 步骤 4: 清洗结果
  onProgress?.({
    id: 'clean',
    text: '正在清洗数据、识别竞品...',
    status: 'active',
    detail: { title: '数据清洗', content: '从搜索结果中提取产品信息' },
  });

  const { products, excluded } = cleanAndExtractProducts(searchResults, query);

  onProgress?.({
    id: 'clean',
    text: `识别到 ${products.length} 个潜在竞品`,
    status: 'done',
    detail: { title: '数据清洗完成', content: `已验证: ${products.length}, 已排除: ${excluded.length}` },
  });

  // 步骤 5: 生成报告
  onProgress?.({
    id: 'report',
    text: '正在生成分析报告...',
    status: 'active',
    detail: { title: '报告生成', content: '整理竞品信息，生成 Markdown 报告' },
  });

  const report = generateReport(query, products, excluded);

  onProgress?.({
    id: 'report',
    text: '报告生成完成',
    status: 'done',
    detail: { title: '报告生成完成', content: 'Markdown 格式竞品分析报告' },
  });

  return {
    query,
    products,
    excluded_products: excluded,
    report,
  };
}