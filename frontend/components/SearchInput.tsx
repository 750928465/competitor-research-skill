'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';

interface SearchInputProps {
  isTransitioned: boolean;
  onSubmit: (query: string) => void;
  disabled: boolean;
}

export default function SearchInput({ isTransitioned, onSubmit, disabled }: SearchInputProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 自动聚焦（仅在初始状态）
  useEffect(() => {
    if (!isTransitioned && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isTransitioned]);

  // 自动调整高度
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [query]);

  const handleSubmit = () => {
    if (query.trim() && !disabled) {
      onSubmit(query.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <motion.div
      className="w-full max-w-3xl mx-auto"
      initial={{ y: 0 }}
      animate={{
        y: isTransitioned ? 0 : '20vh',
      }}
      transition={{
        type: 'spring',
        stiffness: 280,
        damping: 28,
        mass: 1,
      }}
    >
      <motion.div
        className={`
          relative w-full rounded-2xl transition-all duration-300
          ${isFocused ? 'shadow-lg ring-2 ring-brand-400/30' : 'shadow-md'}
          bg-white border border-slate-200/80
        `}
      >
        <div className="flex items-end p-4">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              disabled={disabled}
              placeholder="输入产品领域进行竞品分析，例如：AI 邮件助手"
              className="
                w-full resize-none bg-transparent outline-none
                text-slate-800 placeholder:text-slate-400
                leading-relaxed text-base min-h-[24px] max-h-[120px]
                disabled:opacity-60 disabled:cursor-not-allowed
              "
              rows={1}
            />
            <AnimatePresence>
              {isFocused && !query && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute left-0 top-0 w-0.5 h-6 bg-brand-500 cursor-blink"
                />
              )}
            </AnimatePresence>
          </div>

          <motion.button
            onClick={handleSubmit}
            disabled={!query.trim() || disabled}
            className={`
              ml-3 p-2.5 rounded-xl transition-all duration-200
              ${query.trim() && !disabled
                ? 'bg-brand-500 hover:bg-brand-600 text-white shadow-sm hover:shadow'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }
            `}
            whileHover={{ scale: query.trim() && !disabled ? 1.05 : 1 }}
            whileTap={{ scale: query.trim() && !disabled ? 0.95 : 1 }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1={22} y1={2} x2={11} y2={13} />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </motion.button>
        </div>

        <AnimatePresence>
          {!isTransitioned && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 pb-3"
            >
              <p className="text-xs text-slate-400 text-center">
                按 Enter 发送 · Shift + Enter 换行
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {isTransitioned && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-3 text-center"
          >
            <h1 className="text-lg font-medium text-slate-700">
              竞品研究助手
            </h1>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}