/**
 * 提示词模板服务
 */

import * as fs from 'fs';
import * as path from 'path';

// 提示词缓存
const promptCache: Map<string, string> = new Map();

/**
 * 加载提示词模板
 */
function loadPrompt(name: string): string {
  if (promptCache.has(name)) {
    return promptCache.get(name)!;
  }

  const promptPath = path.join(process.cwd(), 'prompts', `${name}.md`);

  try {
    const content = fs.readFileSync(promptPath, 'utf-8');
    promptCache.set(name, content);
    return content;
  } catch {
    console.warn(`提示词文件不存在: ${promptPath}`);
    return '';
  }
}

/**
 * 获取数据清洗提示词
 */
export function getCleaningPrompt(searchResults: string): string {
  const template = loadPrompt('result_cleaning');

  return `${template}

## 待清洗的搜索结果

${searchResults}

请按照上述格式输出清洗后的结构化数据。`;
}

/**
 * 获取竞品报告生成提示词
 */
export function getReportPrompt(
  query: string,
  intent: string,
  cleanedData: string
): string {
  const template = loadPrompt('competitor_report');

  return `${template}

## 输入信息

**研究查询**: ${query}

**分析意图**: ${intent}

**清洗后的数据**:
\`\`\`json
${cleanedData}
\`\`\`

请基于以上数据，按照提示词要求的格式生成竞品分析报告。注意：
1. 所有声明必须有证据支持
2. 不确定的信息明确标注
3. 保持 Markdown 格式
4. 禁止使用主观评分符号（如 ✓✓✓）`;
}

/**
 * 获取查询重写提示词
 */
export function getQueryRewritePrompt(query: string): string {
  const template = loadPrompt('query_rewrite');

  return `${template}

## 用户查询

${query}

请输出重写后的搜索意图列表。`;
}

/**
 * 构建用于 LLM 的搜索结果摘要
 */
export function buildSearchResultsSummary(results: any[]): string {
  const summaries = results.map((r, i) => {
    return `### 结果 ${i + 1}
**标题**: ${r.title || '无标题'}
**URL**: ${r.url}
**来源**: ${r.source || new URL(r.url).hostname}
**摘要**: ${r.snippet || r.content?.substring(0, 500) || '无内容'}
${r.content ? `\n**详细内容**:\n${r.content.substring(0, 2000)}` : ''}
`;
  });

  return summaries.join('\n---\n');
}

/**
 * 构建 JSON 数据摘要
 */
export function buildDataSummary(data: any): string {
  return JSON.stringify(data, null, 2);
}