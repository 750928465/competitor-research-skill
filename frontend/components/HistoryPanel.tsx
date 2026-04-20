'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { CachedReport, deleteReport, clearAllReports } from '@/lib/storage';
import ResultRenderer from './ResultRenderer';

interface HistoryPanelProps {
  reports: CachedReport[];
  onClose: () => void;
  onSelect: (report: CachedReport) => void;
  onRefresh: () => void;
}

export default function HistoryPanel({ reports, onClose, onSelect, onRefresh }: HistoryPanelProps) {
  const [selectedReport, setSelectedReport] = useState<CachedReport | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    deleteReport(id);
    setShowDeleteConfirm(null);
    onRefresh();
  };

  const handleClearAll = () => {
    clearAllReports();
    onRefresh();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getIntentLabel = (intent: string) => {
    const labels: Record<string, string> = {
      'market_analysis': '市场分析',
      'product_deep_research': '深度研究',
      'product_competition': '竞争分析',
      'case_study': '案例研究',
      'feature_compare': '功能对比',
      'price_analysis': '价格分析',
      'tech_architecture': '技术架构',
      'market_overview': '市场概览',
    };
    return labels[intent] || '综合分析';
  };

  if (selectedReport) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 bg-slate-50"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <button
              onClick={() => setSelectedReport(null)}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
            >
              ← 返回列表
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-medium text-slate-800">{selectedReport.title}</h1>
              <p className="text-xs text-slate-500">{formatDate(selectedReport.generated_at)}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
            >
              ✕ 关闭
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto px-4 py-6">
          <ResultRenderer content={selectedReport.content} isStreaming={false} />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-slate-50"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <span className="text-xl">📚</span>
          <h1 className="text-lg font-medium text-slate-800">历史报告</h1>
          <span className="text-sm text-slate-500">{reports.length} 条记录</span>
          <div className="flex-1" />
          {reports.length > 0 && (
            <button
              onClick={() => {
                if (confirm('确定要清空所有历史报告吗？')) {
                  handleClearAll();
                }
              }}
              className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg"
            >
              清空
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {reports.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-slate-500">暂无历史报告</p>
            <p className="text-sm text-slate-400 mt-2">生成的报告会自动保存在这里</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {reports.map((report) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  layout
                  className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => setSelectedReport(report)}
                  >
                    <div className="flex items-start gap-3">
                      {/* 意图图标 */}
                      <div className="flex-shrink-0 text-2xl">
                        {report.intent === 'market_analysis' ? '📊' :
                         report.intent === 'product_deep_research' ? '🔍' :
                         report.intent === 'product_competition' ? '⚔️' :
                         report.intent === 'case_study' ? '📋' :
                         report.intent === 'tech_architecture' ? '🔧' : '📝'}
                      </div>

                      {/* 内容 */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-slate-800 truncate">{report.title}</h3>
                        <p className="text-sm text-slate-500 mt-1 truncate">{report.query}</p>
                        <p className="text-xs text-slate-400 mt-2 line-clamp-2">{report.preview}</p>

                        {/* 元信息 */}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="inline-flex px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600">
                            {getIntentLabel(report.intent)}
                          </span>
                          <span className="text-xs text-slate-400">{formatDate(report.generated_at)}</span>
                        </div>
                      </div>

                      {/* 删除按钮 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteConfirm(report.id);
                        }}
                        className="flex-shrink-0 p-1.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* 删除确认 */}
                  <AnimatePresence>
                    {showDeleteConfirm === report.id && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="bg-red-50 border-t border-red-100 px-4 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-red-700">确定删除？</span>
                          <button
                            onClick={() => handleDelete(report.id)}
                            className="px-2 py-1 bg-red-500 text-white text-sm rounded"
                          >
                            删除
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(null)}
                            className="px-2 py-1 text-sm text-slate-600 rounded hover:bg-slate-100"
                          >
                            取消
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}