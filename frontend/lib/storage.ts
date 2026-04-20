/**
 * 本地报告存储服务
 * 使用 localStorage 缓存历史报告
 */

export interface CachedReport {
  id: string;
  query: string;
  title: string; // 模型生成的标题
  intent: string;
  generated_at: string;
  content: string; // 完整 Markdown 内容
  preview: string; // 摘要预览（前200字）
}

const STORAGE_KEY = 'cached_reports';
const MAX_REPORTS = 50; // 最大缓存数量

/**
 * 获取所有缓存报告
 */
export function getCachedReports(): CachedReport[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

/**
 * 保存报告到缓存
 */
export function saveReport(report: CachedReport): void {
  try {
    const reports = getCachedReports();

    // 添加新报告到头部
    reports.unshift(report);

    // 限制最大数量
    if (reports.length > MAX_REPORTS) {
      reports.splice(MAX_REPORTS);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  } catch (error) {
    console.error('保存报告失败:', error);
  }
}

/**
 * 获取单个报告
 */
export function getReportById(id: string): CachedReport | null {
  const reports = getCachedReports();
  return reports.find(r => r.id === id) || null;
}

/**
 * 删除单个报告
 */
export function deleteReport(id: string): void {
  try {
    const reports = getCachedReports();
    const filtered = reports.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('删除报告失败:', error);
  }
}

/**
 * 清空所有报告
 */
export function clearAllReports(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('清空报告失败:', error);
  }
}

/**
 * 生成报告ID
 */
export function generateReportId(): string {
  return `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 创建摘要预览
 */
export function createPreview(content: string): string {
  // 提取第一个有意义的段落作为预览
  const lines = content.split('\n');
  let preview = '';

  for (const line of lines) {
    const trimmed = line.trim();
    // 跳过标题、分隔线、空行
    if (trimmed.startsWith('#') || trimmed.startsWith('---') || trimmed === '' || trimmed.startsWith('>')) {
      continue;
    }
    // 找到第一个有内容的段落
    if (trimmed.length > 20) {
      preview = trimmed.substring(0, 150);
      break;
    }
  }

  return preview || '点击查看完整报告';
}