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
  const [isHovered, setIsHovered] = useState(false);

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

  const showPanel = isOpen || isHovered;

  return (
    <div
      className="fixed left-0 top-0 h-full z-50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 触发条 */}
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-32 bg-brand-500 rounded-r-lg flex items-center justify-center cursor-pointer shadow-lg hover:w-8 transition-all"
        onClick={() => setIsHovered(true)}
      >
        <span className="text-white text-lg">⚙️</span>
      </div>

      {/* 侧边栏面板 */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-80 h-full bg-white shadow-2xl border-r border-slate-200 overflow-y-auto"
          >
            {/* 头部 */}
            <div className="px-4 py-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚙️</span>
                  <h2 className="text-base font-semibold">API 配置</h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-white/80 hover:text-white text-lg"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Tab 切换 */}
            <div className="flex border-b border-slate-200 sticky top-12 bg-white z-10">
              <button
                onClick={() => setActiveTab('tavily')}
                className={`flex-1 px-3 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === 'tavily'
                    ? 'text-brand-600 bg-brand-50 border-b-2 border-brand-500'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                🔍 Tavily
              </button>
              <button
                onClick={() => setActiveTab('llm')}
                className={`flex-1 px-3 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === 'llm'
                    ? 'text-brand-600 bg-brand-50 border-b-2 border-brand-500'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                🤖 LLM
              </button>
            </div>

            {/* 内容 */}
            <div className="p-4">
              {/* Tavily Tab */}
              {activeTab === 'tavily' && (
                <div>
                  <div className={`mb-3 p-2 rounded-lg text-sm ${
                    tavilyKey
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                      : 'bg-amber-50 border border-amber-200 text-amber-700'
                  }`}>
                    {tavilyKey ? '✅ 已配置' : '⚠️ 未配置（无法搜索）'}
                  </div>

                  <p className="text-slate-600 text-xs mb-3">
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  />

                  <div className="mt-3 p-2 bg-slate-50 rounded-lg text-xs text-slate-600">
                    <p className="font-medium mb-1">获取方式：</p>
                    <a href="https://tavily.com" target="_blank" className="text-brand-600 hover:underline">
                      访问 tavily.com → Dashboard 复制
                    </a>
                  </div>

                  <button
                    onClick={handleTavilySubmit}
                    className="w-full mt-4 px-3 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600"
                  >
                    {tavilyKey ? '更新' : '保存'}
                  </button>
                </div>
              )}

              {/* LLM Tab */}
              {activeTab === 'llm' && (
                <div>
                  <div className={`mb-3 p-2 rounded-lg text-sm ${
                    llmConfig?.apiKey
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                      : 'bg-slate-100 border border-slate-200 text-slate-600'
                  }`}>
                    {llmConfig?.apiKey
                      ? `✅ 已配置 (${llmConfig.model})`
                      : 'ℹ️ 未配置（使用基础模板）'}
                  </div>

                  <p className="text-slate-600 text-xs mb-3">
                    配置 LLM 以生成高质量分析报告（可选）。
                  </p>

                  {/* Provider */}
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    服务提供商
                  </label>
                  <select
                    value={selectedProvider}
                    onChange={(e) => handleProviderChange(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none mb-3"
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none mb-3"
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none mb-3"
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
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none mb-3"
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
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none mb-3"
                    />
                  )}

                  <button
                    onClick={handleLLMSubmit}
                    className="w-full px-3 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600"
                  >
                    {llmConfig?.apiKey ? '更新' : '保存'}
                  </button>

                  {llmConfig?.apiKey && (
                    <button
                      onClick={() => onSubmitLLM({ apiKey: '', baseUrl: '', model: '' })}
                      className="w-full mt-2 px-3 py-2 border border-slate-300 rounded-lg text-slate-600 text-sm hover:bg-slate-50"
                    >
                      清除配置
                    </button>
                  )}
                </div>
              )}

              {/* 错误提示 */}
              {(localError || error) && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
                  {localError || error}
                </div>
              )}

              {/* 安全提示 */}
              <p className="mt-4 text-xs text-slate-400 text-center">
                🔒 配置保存在本地浏览器
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}