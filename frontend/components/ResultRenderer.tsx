'use client';

import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ResultRendererProps {
  content: string;
  isStreaming: boolean;
}

// 自定义表格组件
const Table = ({ children }: { children?: React.ReactNode }) => (
  <div className="overflow-x-auto my-6 -mx-2">
    <table className="min-w-full border border-slate-200 rounded-lg overflow-hidden text-sm">{children}</table>
  </div>
);

const Thead = ({ children }: { children?: React.ReactNode }) => (
  <thead className="bg-gradient-to-r from-slate-100 to-slate-50">{children}</thead>
);

const Tbody = ({ children }: { children?: React.ReactNode }) => (
  <tbody className="divide-y divide-slate-100 bg-white">{children}</tbody>
);

const Tr = ({ children }: { children?: React.ReactNode }) => (
  <tr className="hover:bg-slate-50 transition-colors">{children}</tr>
);

const Th = ({ children }: { children?: React.ReactNode }) => (
  <th className="px-4 py-3 text-left font-semibold text-slate-700 border-b-2 border-slate-200">
    {children}
  </th>
);

const Td = ({ children }: { children?: React.ReactNode }) => (
  <td className="px-4 py-3 text-slate-600 border-b border-slate-100">
    {children}
  </td>
);

// 自定义标题组件
const H1 = ({ children }: { children?: React.ReactNode }) => (
  <h1 className="text-2xl font-bold text-slate-800 mb-4 pb-3 border-b-2 border-brand-500">
    {children}
  </h1>
);

const H2 = ({ children }: { children?: React.ReactNode }) => (
  <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4 flex items-center gap-2">
    <span className="w-1 h-6 bg-brand-500 rounded-full"></span>
    {children}
  </h2>
);

const H3 = ({ children }: { children?: React.ReactNode }) => (
  <h3 className="text-lg font-medium text-slate-700 mt-5 mb-3 pl-3 border-l-2 border-slate-300">
    {children}
  </h3>
);

// 引用块组件
const Blockquote = ({ children }: { children?: React.ReactNode }) => (
  <blockquote className="border-l-4 border-brand-400 bg-brand-50/50 pl-4 py-2 my-4 text-slate-600 italic rounded-r">
    {children}
  </blockquote>
);

// 列表组件
const Ul = ({ children }: { children?: React.ReactNode }) => (
  <ul className="my-3 space-y-1.5 list-disc list-inside text-slate-700">{children}</ul>
);

const Ol = ({ children }: { children?: React.ReactNode }) => (
  <ol className="my-3 space-y-1.5 list-decimal list-inside text-slate-700">{children}</ol>
);

const Li = ({ children }: { children?: React.ReactNode }) => (
  <li className="text-slate-700 leading-relaxed pl-1">{children}</li>
);

// 分隔线
const Hr = () => (
  <hr className="my-8 border-t-2 border-slate-200" />
);

// 段落
const P = ({ children }: { children?: React.ReactNode }) => (
  <p className="text-slate-700 leading-relaxed mb-4">{children}</p>
);

// 链接
const A = ({ href, children }: { href?: string; children?: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-700 underline underline-offset-2">
    {children}
  </a>
);

export default function ResultRenderer({ content, isStreaming }: ResultRendererProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-3xl mx-auto mt-8"
    >
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <h2 className="text-sm font-medium text-slate-600">竞品分析报告</h2>
            {isStreaming && (
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-xs text-brand-500 ml-2"
              >
                生成中...
              </motion.span>
            )}
          </div>
        </div>

        <div className="px-6 py-6 prose prose-slate max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: H1,
              h2: H2,
              h3: H3,
              p: P,
              blockquote: Blockquote,
              ul: Ul,
              ol: Ol,
              li: Li,
              hr: Hr,
              a: A,
              table: Table,
              thead: Thead,
              tbody: Tbody,
              tr: Tr,
              th: Th,
              td: Td,
            }}
          >
            {content}
          </ReactMarkdown>

          {isStreaming && (
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="inline-block w-2 h-5 bg-brand-500 rounded-sm ml-0.5 align-middle"
            />
          )}
        </div>
      </div>

      {!isStreaming && content && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center gap-3 mt-6"
        >
          <button
            onClick={() => navigator.clipboard.writeText(content)}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            📋 复制报告
          </button>
          <button
            onClick={() => {
              const blob = new Blob([content], { type: 'text/markdown' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = '竞品分析报告.md';
              a.click();
            }}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            📥 导出 Markdown
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}