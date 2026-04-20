'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ThinkingProcess from '@/components/ThinkingProcess';
import ResultRenderer from '@/components/ResultRenderer';
import ApiKeySidebar from '@/components/ApiKeyModal';
import HistoryPanel from '@/components/HistoryPanel';
import { AppStatus, ThinkingStep } from '@/lib/types';
import { EngineState, ProgressUpdate } from '@/lib/engine';
import { getCachedReports, saveReport, generateReportId, createPreview, CachedReport } from '@/lib/storage';

const TAVILY_STORAGE_KEY = 'tavily_api_key';
const LLM_STORAGE_KEY = 'llm_config';

interface LLMConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

// 状态到进度的映射
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

const STATE_LABELS: Record<EngineState, string> = {
  IDLE: '空闲',
  IDENTIFYING: '意图识别',
  CRAWLING: '信息检索',
  CLEANING: '数据清洗',
  ANALYZING: '深度分析',
  REPORTING: '报告生成',
  COMPLETED: '已完成',
  ERROR: '错误',
};

export default function Home() {
  // 状态管理
  const [status, setStatus] = useState<AppStatus>('idle');
  const [query, setQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
  const [result, setResult] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [engineState, setEngineState] = useState<EngineState>('IDLE');
  const [progress, setProgress] = useState(0);
  const [llmErrorInfo, setLlmErrorInfo] = useState<{
    stage: string;
    error_code?: string;
    error_message: string;
  } | null>(null);

  // API Key 相关状态
  const [tavilyKey, setTavilyKey] = useState<string>('');
  const [llmConfig, setLlmConfig] = useState<LLMConfig>({ apiKey: '', baseUrl: '', model: '' });
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [keyError, setKeyError] = useState('');

  // 历史报告状态
  const [showHistory, setShowHistory] = useState(false);
  const [cachedReports, setCachedReports] = useState<CachedReport[]>([]);

  // Refs
  const resultContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 从 localStorage 加载配置
  useEffect(() => {
    const savedTavilyKey = localStorage.getItem(TAVILY_STORAGE_KEY);
    if (savedTavilyKey) {
      setTavilyKey(savedTavilyKey);
    }

    const savedLLMConfig = localStorage.getItem(LLM_STORAGE_KEY);
    if (savedLLMConfig) {
      try {
        const parsed = JSON.parse(savedLLMConfig);
        setLlmConfig(parsed);
      } catch {}
    }

    // 加载历史报告
    setCachedReports(getCachedReports());
  }, []);

  // 清理状态
  const resetState = useCallback(() => {
    setThinkingSteps([]);
    setResult('');
    setError(null);
    setProgress(0);
    setEngineState('IDLE');
    setLlmErrorInfo(null);
  }, []);

  // 保存 Tavily API Key
  const handleSaveTavilyKey = useCallback((key: string) => {
    localStorage.setItem(TAVILY_STORAGE_KEY, key);
    setTavilyKey(key);
    setKeyError('');
  }, []);

  // 保存 LLM 配置
  const handleSaveLLMConfig = useCallback((config: LLMConfig) => {
    if (config.apiKey) {
      localStorage.setItem(LLM_STORAGE_KEY, JSON.stringify(config));
    } else {
      localStorage.removeItem(LLM_STORAGE_KEY);
    }
    setLlmConfig(config);
    setKeyError('');
  }, []);

  // 格式化报告
  const formatReport = (report: any): string => {
    let markdown = `# ${report.query} 竞品分析报告\n\n`;
    markdown += `> 生成时间：${new Date(report.generated_at).toLocaleString('zh-CN')}\n`;
    markdown += `> 分析类型：${report.intent?.intent || '市场概览'}\n\n`;
    markdown += `---\n\n`;

    for (const section of report.sections || []) {
      markdown += `## ${section.title}\n\n`;
      // 确保内容前后有空行
      const content = section.content?.trim() || '';
      markdown += `${content}\n\n`;
    }

    // LLM 生成的报告已包含参考资料，不再重复添加

    return markdown;
  };

  // 从报告内容提取标题
  const extractTitle = (content: string, query: string): string => {
    // 从第一个 ## 标题提取
    const match = content.match(/^## (.+)/m);
    if (match) {
      return match[1].trim();
    }
    // 从 # 标题提取（去掉"竞品分析报告"后缀）
    const h1Match = content.match(/^# (.+)/m);
    if (h1Match) {
      let title = h1Match[1].trim();
      // 去掉通用后缀
      title = title.replace(/\s*竞品分析报告\s*$/, '').trim();
      if (title) return title;
    }
    // 默认使用查询内容
    return query;
  };

  // 提交查询
  const handleSubmit = useCallback(async (inputQuery?: string) => {
    // 优先使用传入参数，其次使用 inputValue（初始状态），最后使用 query（过渡后状态）
    const queryToSubmit = inputQuery || inputValue.trim() || query.trim();
    if (!queryToSubmit) return;

    // 检查是否有 Tavily API Key
    if (!tavilyKey) {
      setShowConfigModal(true);
      return;
    }

    resetState();
    setQuery(queryToSubmit);
    setInputValue('');
    setStatus('transitioning');

    await new Promise(resolve => setTimeout(resolve, 500));
    setStatus('thinking');

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Tavily-Key': tavilyKey,
      };

      // 添加 LLM 配置到 header
      if (llmConfig.apiKey) {
        headers['X-LLM-Key'] = llmConfig.apiKey;
        headers['X-LLM-Base-Url'] = llmConfig.baseUrl;
        headers['X-LLM-Model'] = llmConfig.model;
      }

      const response = await fetch('/api/research', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: queryToSubmit,
          initial_refs: [],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          localStorage.removeItem(TAVILY_STORAGE_KEY);
          setTavilyKey('');
          setShowConfigModal(true);
          setKeyError('API Key 无效，请重新配置');
          setStatus('idle');
          return;
        }
        throw new Error(errorData.error || '请求失败');
      }

      // 处理流式响应
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('无法读取响应流');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.substring(6);
              const event = JSON.parse(jsonStr);

              if (event.type === 'progress') {
                const update: ProgressUpdate = event.data;
                setEngineState(update.state);
                setProgress(update.progress);

                // 处理 LLM 错误信息
                if (update.details?.llm_error) {
                  setLlmErrorInfo(update.details.llm_error);
                }

                // 添加思考步骤
                setThinkingSteps(prev => {
                  const stepId = `step-${update.state}-${Date.now()}`;
                  const existingIndex = prev.findIndex(s => s.text === update.message);

                  if (existingIndex >= 0) {
                    const newSteps = [...prev];
                    newSteps[existingIndex] = {
                      ...newSteps[existingIndex],
                      status: update.progress >= 100 ? 'done' : 'active',
                      state: update.state,
                    };
                    return newSteps;
                  }

                  // 构建 detail 内容
                  let detailContent = '';
                  let detailSources: string[] | undefined;
                  if (update.details) {
                    if (update.details.refs_found) {
                      detailContent = `找到 ${update.details.refs_found} 条相关结果`;
                    }
                    if (update.details.data_cleaned) {
                      detailContent = `识别到 ${update.details.data_cleaned} 个产品`;
                    }
                    if (update.details.llm_error) {
                      detailContent = `错误: ${update.details.llm_error.error_message}`;
                    }
                    if (update.details.fallback_used) {
                      detailSources = ['模板生成'];
                    }
                  }

                  return [...prev, {
                    id: stepId,
                    text: update.message,
                    status: update.progress >= 100 ? 'done' : 'active',
                    state: update.state,
                    detail: detailContent || detailSources ? {
                      title: STATE_LABELS[update.state],
                      content: detailContent,
                      sources: detailSources,
                    } : undefined,
                  }];
                });
              } else if (event.type === 'complete') {
                const report = event.data;

                setThinkingSteps(prev =>
                  prev.map(s => ({ ...s, status: 'done' as const }))
                );
                setStatus('generating');

                // 流式输出报告
                const reportMarkdown = formatReport(report);
                for (let i = 0; i < reportMarkdown.length; i += 3) {
                  await new Promise(resolve => setTimeout(resolve, 5));
                  setResult(prev => prev + reportMarkdown.slice(i, i + 3));
                }

                // 保存报告到本地缓存
                const title = extractTitle(reportMarkdown, report.query);
                const cachedReport: CachedReport = {
                  id: generateReportId(),
                  query: report.query,
                  title: title,
                  intent: report.intent?.intent || 'market_overview',
                  generated_at: report.generated_at,
                  content: reportMarkdown,
                  preview: createPreview(reportMarkdown),
                };
                saveReport(cachedReport);
                setCachedReports(getCachedReports());

                setStatus('done');
                setEngineState('COMPLETED');
                setQuery(''); // 清空输入框，准备下一次搜索
              } else if (event.type === 'error') {
                throw new Error(event.data);
              }
            } catch (e) {
              console.error('解析事件失败:', e);
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生未知错误');
      setStatus('idle');
      setEngineState('ERROR');
    }
  }, [tavilyKey, llmConfig, inputValue, resetState]);

  useEffect(() => {
    if (status === 'generating' && resultContainerRef.current) {
      resultContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [status]);

  const isTransitioned = status !== 'idle';

  return (
    <main className="min-h-screen flex flex-col bg-slate-50" suppressHydrationWarning>
      {/* 初始状态：居中的搜索框 */}
      <AnimatePresence mode="wait" initial={false}>
        {!isTransitioned && (
          <motion.div
            key="initial"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex items-center justify-center px-4"
          >
            <div className="w-full max-w-2xl">
              {/* 标题 */}
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-slate-800 mb-4">
                  竞品研究助手
                </h1>
                <p className="text-slate-500 text-lg">
                  输入产品领域，生成竞品分析报告
                </p>
              </div>

              {/* 历史报告按钮 */}
              {cachedReports.length > 0 && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="flex justify-center mb-4"
                >
                  <button
                    onClick={() => setShowHistory(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                  >
                    <span>📚</span>
                    <span>历史报告 ({cachedReports.length})</span>
                  </button>
                </motion.div>
              )}

              {/* 搜索框 */}
              <motion.div
                className="bg-white rounded-2xl shadow-lg border border-slate-200/80 mb-6"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                <div className="flex items-end p-4">
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                    placeholder="输入产品领域，例如：云手机 OpenClaw 案例分析"
                    className="flex-1 resize-none bg-transparent outline-none text-slate-800 placeholder:text-slate-400 leading-relaxed text-base min-h-[24px] max-h-[120px]"
                    rows={1}
                  />
                  <button
                    onClick={() => handleSubmit()}
                    disabled={!inputValue.trim()}
                    className={`ml-3 p-2.5 rounded-xl transition-all ${
                      inputValue.trim()
                        ? 'bg-brand-500 hover:bg-brand-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <line x1={22} y1={2} x2={11} y2={13} />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
                <div className="px-4 pb-3">
                  <p className="text-xs text-slate-400 text-center">
                    按 Enter 发送
                  </p>
                </div>
              </motion.div>

              {/* 配置状态提示（简洁版） */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {!tavilyKey && (
                  <div className="flex items-center justify-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200 mb-4">
                    <span>⚠️</span>
                    <span className="text-sm text-amber-700">请配置 Tavily API Key（鼠标悬停左侧边栏）</span>
                  </div>
                )}
              </motion.div>

              {/* 示例按钮 */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <p className="text-sm text-slate-500 mb-3">试试这些：</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    '云手机 OpenClaw 案例分析',
                    'AI 邮件助手 功能对比',
                    '项目管理软件 价格分析',
                  ].map((example) => (
                    <button
                      key={example}
                      onClick={() => handleSubmit(example)}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 过渡后状态 */}
      <AnimatePresence>
        {isTransitioned && (
          <motion.div
            key="transitioned"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col"
          >
            {/* Header */}
            <header className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm border-b border-slate-200">
              <div className="max-w-3xl mx-auto px-4 py-3">
                <div className="flex items-center gap-4 mb-2">
                  <h1 className="text-lg font-semibold text-slate-800">竞品研究助手</h1>
                  {cachedReports.length > 0 && (
                    <button
                      onClick={() => setShowHistory(true)}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-all"
                    >
                      <span>📚</span>
                      <span>{cachedReports.length}</span>
                    </button>
                  )}
                  <div className="flex-1">
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-brand-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm text-slate-500">{STATE_LABELS[engineState]}</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSubmit(query);
                      }
                    }}
                    placeholder="输入新的搜索..."
                    className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                  <button
                    onClick={() => handleSubmit(query)}
                    className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600"
                  >
                    搜索
                  </button>
                </div>
              </div>
            </header>

            {/* 主内容区域 */}
            <div className="flex-1 px-4 py-6" ref={resultContainerRef}>
              <div className="max-w-3xl mx-auto">
                {/* 思考过程 */}
                {(status === 'thinking' || (status === 'generating' && thinkingSteps.length > 0)) && (
                  <ThinkingProcess steps={thinkingSteps} isActive={status === 'thinking'} />
                )}

                {/* LLM 错误提示 */}
                {llmErrorInfo && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">⚠️</span>
                      <div>
                        <p className="font-medium text-amber-800">LLM 调用失败，已切换为模板生成模式</p>
                        <div className="text-sm text-amber-700 mt-2 space-y-1">
                          <p><span className="font-medium">阶段：</span>{llmErrorInfo.stage === 'cleaning' ? '数据清洗' : llmErrorInfo.stage === 'analyzing' ? '深度分析' : '报告生成'}</p>
                          {llmErrorInfo.error_code && <p><span className="font-medium">错误码：</span>{llmErrorInfo.error_code}</p>}
                          <p><span className="font-medium">错误信息：</span>{llmErrorInfo.error_message}</p>
                        </div>
                        <p className="text-xs text-amber-600 mt-2">
                          请检查 LLM API Key 是否有效，或前往左侧边栏重新配置
                        </p>
                      </div>
                      <button
                        onClick={() => setLlmErrorInfo(null)}
                        className="text-amber-400 hover:text-amber-600 ml-auto"
                      >
                        ✕
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* 结果展示 */}
                {(status === 'generating' || status === 'done') && result && (
                  <ResultRenderer content={result} isStreaming={status === 'generating'} />
                )}

                {/* 错误状态 */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
                    <p className="font-medium">出错了</p>
                    <p className="text-sm mt-1">{error}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="py-4 text-center text-sm text-slate-400 border-t border-slate-100">
        <p>竞品研究助手 · 基于 Tavily Search API · 任务驱动引擎</p>
      </footer>

      {/* 配置模态框 */}
      <ApiKeySidebar
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onSubmitTavily={handleSaveTavilyKey}
        onSubmitLLM={handleSaveLLMConfig}
        tavilyKey={tavilyKey}
        llmConfig={llmConfig}
        error={keyError}
      />

      {/* 历史报告面板 */}
      <AnimatePresence>
        {showHistory && (
          <HistoryPanel
            reports={cachedReports}
            onClose={() => setShowHistory(false)}
            onSelect={(report) => {
              setShowHistory(false);
              setStatus('done');
              setResult(report.content);
              setQuery(report.query);
            }}
            onRefresh={() => setCachedReports(getCachedReports())}
          />
        )}
      </AnimatePresence>
    </main>
  );
}