'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ThinkingStep, ThinkingStepGroup } from '@/lib/types';
import { useState, useMemo } from 'react';

interface ThinkingProcessProps {
  steps: ThinkingStep[];
  isActive: boolean;
}

// 分组配置
const GROUP_CONFIG: Record<string, { title: string; icon: string; color: string; bgColor: string }> = {
  'IDENTIFYING': { title: '意图识别', icon: '🎯', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  'CRAWLING': { title: '信息检索', icon: '🔍', color: 'text-amber-600', bgColor: 'bg-amber-50' },
  'CLEANING': { title: '数据清洗', icon: '🧹', color: 'text-purple-600', bgColor: 'bg-purple-50' },
  'ANALYZING': { title: '深度分析', icon: '📊', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  'REPORTING': { title: '报告生成', icon: '📝', color: 'text-green-600', bgColor: 'bg-green-50' },
};

// 合并分组配置（将 IDENTIFYING 和 CLEANING 合并到分析组）
const MERGED_GROUPS = [
  { id: 'IDENTIFYING', states: ['IDENTIFYING'], title: '意图识别', icon: '🎯', color: 'blue' },
  { id: 'CRAWLING', states: ['CRAWLING'], title: '信息检索', icon: '🔍', color: 'amber' },
  { id: 'ANALYZING', states: ['CLEANING', 'ANALYZING'], title: '数据分析', icon: '📊', color: 'purple' },
  { id: 'REPORTING', states: ['REPORTING'], title: '报告生成', icon: '📝', color: 'green' },
];

export default function ThinkingProcess({ steps, isActive }: ThinkingProcessProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['CRAWLING', 'ANALYZING'])); // 默认展开搜索和分析

  // 将步骤分组
  const groupedSteps = useMemo(() => {
    const groups: ThinkingStepGroup[] = [];

    for (const groupConfig of MERGED_GROUPS) {
      const groupSteps = steps.filter(step =>
        groupConfig.states.includes(step.state || '')
      );

      if (groupSteps.length > 0) {
        // 计算分组状态
        const hasActive = groupSteps.some(s => s.status === 'active');
        const allDone = groupSteps.every(s => s.status === 'done');
        const status = hasActive ? 'active' : allDone ? 'done' : 'pending';

        groups.push({
          id: groupConfig.id,
          title: groupConfig.title,
          icon: groupConfig.icon,
          color: groupConfig.color,
          steps: groupSteps,
          status,
        });
      }
    }

    return groups;
  }, [steps]);

  const toggleExpandStep = (stepId: string) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  const toggleExpandGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  // 颜色映射
  const colorMap: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    'blue': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
    'amber': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
    'purple': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
    'indigo': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500' },
    'green': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-500' },
  };

  return (
    <div className="w-full max-w-3xl mx-auto mt-6 space-y-3">
      {/* 整体进度指示 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3"
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={isActive ? { rotate: 360 } : {}}
            transition={{ duration: 2, repeat: isActive ? Infinity : 0, ease: 'linear' }}
            className="w-5 h-5 rounded-full border-2 border-brand-500 border-t-transparent"
          />
          <span className="text-sm font-medium text-slate-700">
            {isActive ? '正在分析...' : '分析完成'}
          </span>
          <div className="flex-1" />
          <div className="flex gap-1.5">
            {groupedSteps.map(group => {
              const colors = colorMap[group.color] || colorMap['blue'];
              return (
                <div
                  key={group.id}
                  className={`w-2.5 h-2.5 rounded-full ${
                    group.status === 'done' ? colors.dot :
                    group.status === 'active' ? 'bg-brand-500 animate-pulse' :
                    'bg-slate-200'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* 分组卡片 */}
      <AnimatePresence mode="popLayout">
        {groupedSteps.map((group) => {
          const isExpanded = expandedGroups.has(group.id);
          const colors = colorMap[group.color] || colorMap['blue'];

          return (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
                group.status === 'active' ? 'border-brand-300 ring-2 ring-brand-100' : 'border-slate-200'
              }`}
            >
              {/* 分组标题 */}
              <div
                className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors ${colors.bg} hover:opacity-80`}
                onClick={() => toggleExpandGroup(group.id)}
              >
                {/* 状态图标 */}
                <div className="flex-shrink-0 text-lg">
                  {group.status === 'done' ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={`w-6 h-6 rounded-full ${colors.dot} flex items-center justify-center`}
                    >
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  ) : group.status === 'active' ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                      className={`w-6 h-6 rounded-full border-2 ${colors.dot} border-t-transparent`}
                    />
                  ) : (
                    <div className={`w-6 h-6 rounded-full border-2 ${colors.border}`} />
                  )}
                </div>

                {/* 分组信息 */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{group.icon}</span>
                    <span className={`font-medium ${colors.text}`}>{group.title}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {group.steps.filter(s => s.status === 'done').length} / {group.steps.length} 完成
                  </div>
                </div>

                {/* 展开/收起图标 */}
                <motion.svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`w-5 h-5 ${colors.text}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </motion.svg>

                {/* 活跃状态的加载点 */}
                {group.status === 'active' && (
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.12 }}
                        className={`w-2 h-2 rounded-full ${colors.dot}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* 步骤列表（展开时显示） */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="divide-y divide-slate-100">
                      {group.steps.map((step) => {
                        const isStepExpanded = expandedSteps.has(step.id);
                        const hasDetail = step.detail && (step.detail.content || step.detail.sources?.length);

                        return (
                          <div key={step.id} className="group">
                            {/* 步骤主行 */}
                            <div
                              className={`flex items-center gap-3 px-4 py-2.5 pl-7 transition-colors
                                ${hasDetail ? 'hover:bg-slate-50 cursor-pointer' : ''}`}
                              onClick={() => hasDetail && toggleExpandStep(step.id)}
                            >
                              {/* 状态图标（小） */}
                              <div className="flex-shrink-0">
                                {step.status === 'done' ? (
                                  <div className={`w-4 h-4 rounded-full ${colors.dot} flex items-center justify-center`}>
                                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                ) : step.status === 'active' ? (
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    className={`w-4 h-4 rounded-full border-2 ${colors.dot} border-t-transparent`}
                                  />
                                ) : (
                                  <div className="w-4 h-4 rounded-full border-2 border-slate-200" />
                                )}
                              </div>

                              {/* 步骤文本 */}
                              <span className={`flex-1 text-sm ${
                                step.status === 'active' ? 'text-brand-600 font-medium' :
                                step.status === 'done' ? 'text-slate-600' : 'text-slate-400'
                              }`}>
                                {step.text}
                              </span>

                              {/* 详情展开图标 */}
                              {hasDetail && (
                                <motion.svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="w-3.5 h-3.5 text-slate-400"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  animate={{ rotate: isStepExpanded ? 180 : 0 }}
                                  transition={{ duration: 0.15 }}
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </motion.svg>
                              )}
                            </div>

                            {/* 步骤详情 */}
                            <AnimatePresence>
                              {isStepExpanded && step.detail && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.15 }}
                                  className="overflow-hidden bg-slate-50/50"
                                >
                                  <div className="px-4 pb-2.5 pl-14">
                                    {step.detail.content && (
                                      <p className="text-xs text-slate-500 mb-1.5 leading-relaxed">
                                        {step.detail.content}
                                      </p>
                                    )}
                                    {step.detail.sources && step.detail.sources.length > 0 && (
                                      <div className="flex flex-wrap gap-1">
                                        {step.detail.sources.map((source, i) => (
                                          <span
                                            key={i}
                                            className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-slate-100 text-slate-500"
                                          >
                                            {source}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* 正在思考的动态指示器 */}
      <AnimatePresence>
        {isActive && groupedSteps.some(g => g.status === 'active') && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 text-slate-500 justify-center py-2"
          >
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                  className="w-2 h-2 rounded-full bg-brand-400"
                />
              ))}
            </div>
            <span className="text-sm">正在处理...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}