'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface LLMConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

interface ApiKeySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitTavily: (key: string) => void;
  onSubmitLLM: (config: LLMConfig) => void;
  tavilyKey?: string;
  llmConfig?: LLMConfig;
  error?: string;
}

const LLM_PROVIDERS = [
  { name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'] },
  { name: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', models: ['deepseek-chat', 'deepseek-reasoner'] },
  { name: 'Claude', baseUrl: 'https://api.anthropic.com/v1', models: ['claude-3-5-sonnet', 'claude-3-opus'] },
  { name: '自定义', baseUrl: '', models: [] },
];

export default function ApiKeySidebar({ isOpen, onClose, onSubmitTavily, onSubmitLLM, tavilyKey, llmConfig, error }: ApiKeySidebarProps) {
  const [activeTab, setActiveTab] = useState<'tavily' | 'llm'>('tavily');
  const [tavilyInput, setTavilyInput] = useState('');
  const [llmApiKey, setLlmApiKey] = useState('');
  const [llmBaseUrl, setLlmBaseUrl] = useState('https://api.openai.com/v1');
  const [llmModel, setLlmModel] = useState('gpt-4o-mini');
  const [selectedProvider, setSelectedProvider] = useState(0);
  const [localError, setLocalError] = useState('');
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // 初始化已保存的值
  useEffect(() => {
    if (tavilyKey) setTavilyInput(tavilyKey);
    if (llmConfig) {
      setLlmApiKey(llmConfig.apiKey);
      setLlmBaseUrl(llmConfig.baseUrl);
      setLlmModel(llmConfig.model);
      const providerIdx = LLM_PROVIDERS.findIndex(p => p.baseUrl === llmConfig.baseUrl);
      if (providerIdx >= 0) setSelectedProvider(providerIdx);
    }
  }, [tavilyKey, llmConfig, isOpen]);

  // 同步外部 isOpen 状态
  useEffect(() => {
    if (isOpen) setIsPanelOpen(true);
  }, [isOpen]);

  const handleProviderChange = (idx: number) => {
    setSelectedProvider(idx);
    const provider = LLM_PROVIDERS[idx];
    if (provider.baseUrl) {
      setLlmBaseUrl(provider.baseUrl);
      if (provider.models.length > 0) {
        setLlmModel(provider.models[0]);
      }
    }
  };

  const handleTavilySubmit = () => {
    if (!tavilyInput.trim()) {
      setLocalError('请输入 Tavily API Key');
      return;
    }
    if (!tavilyInput.startsWith('tvly-')) {
      setLocalError('Tavily API Key 格式不正确，应以 tvly- 开头');
      return;
    }
    onSubmitTavily(tavilyInput.trim());
    setLocalError('');
  };

  const handleLLMSubmit = () => {
    if (!llmApiKey.trim()) {
      setLocalError('请输入 LLM API Key');
      return;
    }
    if (!llmBaseUrl.trim()) {
      setLocalError('请输入 API Base URL');
      return;
    }
    onSubmitLLM({
      apiKey: llmApiKey.trim(),
      baseUrl: llmBaseUrl.trim(),
      model: llmModel.trim() || 'gpt-4o-mini',
    });
    setLocalError('');
  };

  const handleClose = () => {
    setIsPanelOpen(false);
    onClose();
  };

  const showPanel = isOpen || isPanelOpen;

  return (
    <>
      {/* 左上角配置入口 - 面板打开时隐藏 */}
      <AnimatePresence>
        {!showPanel && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed top-4 left-4 z-40"
          >
            <button
              onClick={() => setIsPanelOpen(true)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all duration-200 shadow-sm hover:shadow-md ${
                tavilyKey
                  ? 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                  : 'bg-amber-50 text-amber-700 border border-amber-200 hover:border-amber-300'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-xs font-medium">
                {tavilyKey
                  ? llmConfig?.apiKey ? '已就绪' : 'API 配置'
                  : '配置 API Key'
                }
              </span>
              {/* 未配置时的小红点 */}
              {!tavilyKey && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </span>
              )}
              {tavilyKey && !llmConfig?.apiKey && (
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
              )}
              {tavilyKey && llmConfig?.apiKey && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 半透明遮罩 */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={handleClose}
          />
        )}
      </AnimatePresence>

      {/* 侧边栏面板 */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed left-0 top-0 h-full w-80 z-50 bg-white shadow-2xl overflow-y-auto"
          >
            {/* 头部 */}
            <div className="px-5 py-4 bg-gradient-to-r from-brand-500 to-brand-600 text-white sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <h2 className="text-base font-semibold">API 配置</h2>
                </div>
                <button
                  onClick={handleClose}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Tab 切换 */}
            <div className="flex border-b border-slate-200 sticky top-[60px] bg-white z-10">
              <button
                onClick={() => setActiveTab('tavily')}
                className={`flex-1 px-3 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === 'tavily'
                    ? 'text-brand-600 bg-brand-50 border-b-2 border-brand-500'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Tavily Search
              </button>
              <button
                onClick={() => setActiveTab('llm')}
                className={`flex-1 px-3 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === 'llm'
                    ? 'text-brand-600 bg-brand-50 border-b-2 border-brand-500'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                LLM 增强
              </button>
            </div>

            {/* 内容 */}
            <div className="p-5">
              {/* Tavily Tab */}
              {activeTab === 'tavily' && (
                <div>
                  <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${
                    tavilyKey
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                      : 'bg-amber-50 border border-amber-200 text-amber-700'
                  }`}>
                    <span className="text-base">{tavilyKey ? '✓' : '!'}</span>
                    {tavilyKey ? '已配置，可正常搜索' : '未配置，无法执行搜索'}
                  </div>

                  <p className="text-slate-500 text-xs mb-4 leading-relaxed">
                    Tavily 是专为 AI 设计的搜索 API，用于检索竞品信息。
                  </p>

                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={tavilyInput}
                    onChange={(e) => { setTavilyInput(e.target.value); setLocalError(''); }}
                    placeholder="tvly-xxxxxxxxxxxxx"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-shadow"
                  />

                  <div className="mt-3 p-3 bg-slate-50 rounded-lg text-xs text-slate-500">
                    <p className="font-medium mb-1">获取方式</p>
                    <a href="https://tavily.com" target="_blank" className="text-brand-600 hover:underline">
                      tavily.com → Dashboard → 复制 API Key
                    </a>
                  </div>

                  <button
                    onClick={handleTavilySubmit}
                    className="w-full mt-4 px-3 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
                  >
                    {tavilyKey ? '更新 Key' : '保存 Key'}
                  </button>
                </div>
              )}

              {/* LLM Tab */}
              {activeTab === 'llm' && (
                <div>
                  <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${
                    llmConfig?.apiKey
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                      : 'bg-slate-50 border border-slate-200 text-slate-500'
                  }`}>
                    <span className="text-base">{llmConfig?.apiKey ? '✓' : 'i'}</span>
                    {llmConfig?.apiKey
                      ? `已配置 (${llmConfig.model})`
                      : '未配置，将使用基础模板生成'}
                  </div>

                  <p className="text-slate-500 text-xs mb-4 leading-relaxed">
                    配置 LLM 以生成更高质量的分析报告（可选）。
                  </p>

                  {/* Provider */}
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    服务提供商
                  </label>
                  <select
                    value={selectedProvider}
                    onChange={(e) => handleProviderChange(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none mb-3 transition-shadow"
                  >
                    {LLM_PROVIDERS.map((p, i) => (
                      <option key={i} value={i}>{p.name}</option>
                    ))}
                  </select>

                  {/* API Key */}
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={llmApiKey}
                    onChange={(e) => { setLlmApiKey(e.target.value); setLocalError(''); }}
                    placeholder="sk-xxxxxxxxxxxxx"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none mb-3 transition-shadow"
                  />

                  {/* Base URL */}
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    API Base URL
                  </label>
                  <input
                    type="text"
                    value={llmBaseUrl}
                    onChange={(e) => setLlmBaseUrl(e.target.value)}
                    placeholder="https://api.openai.com/v1"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none mb-3 transition-shadow"
                    disabled={selectedProvider !== LLM_PROVIDERS.length - 1}
                  />

                  {/* Model */}
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    模型
                  </label>
                  {LLM_PROVIDERS[selectedProvider].models.length > 0 ? (
                    <select
                      value={llmModel}
                      onChange={(e) => setLlmModel(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none mb-3 transition-shadow"
                    >
                      {LLM_PROVIDERS[selectedProvider].models.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={llmModel}
                      onChange={(e) => setLlmModel(e.target.value)}
                      placeholder="gpt-4o-mini"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none mb-3 transition-shadow"
                    />
                  )}

                  <button
                    onClick={handleLLMSubmit}
                    className="w-full px-3 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
                  >
                    {llmConfig?.apiKey ? '更新配置' : '保存配置'}
                  </button>

                  {llmConfig?.apiKey && (
                    <button
                      onClick={() => onSubmitLLM({ apiKey: '', baseUrl: '', model: '' })}
                      className="w-full mt-2 px-3 py-2 border border-slate-200 rounded-lg text-slate-500 text-sm hover:bg-slate-50 transition-colors"
                    >
                      清除配置
                    </button>
                  )}
                </div>
              )}

              {/* 错误提示 */}
              {(localError || error) && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
                  {localError || error}
                </div>
              )}

              {/* 安全提示 */}
              <p className="mt-5 text-xs text-slate-400 text-center">
                配置仅保存在本地浏览器中
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
