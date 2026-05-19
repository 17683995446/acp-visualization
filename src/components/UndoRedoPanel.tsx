/**
 * UndoRedoPanel 组件
 *
 * 浮动面板，显示撤销/重做按钮及历史记录信息。
 * 使用 lucide-react 的 Undo2, Redo2 图标。
 */

import React from 'react';
import { Undo2, Redo2, Trash2 } from 'lucide-react';
import { useUndoRedo } from '../hooks/useUndoRedo';

const UndoRedoPanel: React.FC = () => {
  const {
    undo,
    redo,
    canUndo: canUndoNow,
    canRedo: canRedoNow,
    undoDescription,
    redoDescription,
    clearHistory,
    undoCount,
    redoCount,
  } = useUndoRedo();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 px-2 py-1.5">
        {/* 撤销按钮 */}
        <button
          onClick={undo}
          disabled={!canUndoNow}
          title={
            undoDescription
              ? `撤销: ${undoDescription} (Ctrl+Z)`
              : '撤销 (Ctrl+Z)'
          }
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
            transition-colors
            ${
              canUndoNow
                ? 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer'
                : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
            }
          `}
          aria-label="撤销"
        >
          <Undo2 className="w-4 h-4" />
          <span className="hidden sm:inline">撤销</span>
        </button>

        {/* 分隔线 */}
        <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-0.5" />

        {/* 重做按钮 */}
        <button
          onClick={redo}
          disabled={!canRedoNow}
          title={
            redoDescription
              ? `重做: ${redoDescription} (Ctrl+Shift+Z)`
              : '重做 (Ctrl+Shift+Z)'
          }
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
            transition-colors
            ${
              canRedoNow
                ? 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer'
                : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
            }
          `}
          aria-label="重做"
        >
          <Redo2 className="w-4 h-4" />
          <span className="hidden sm:inline">重做</span>
        </button>

        {/* 分隔线 */}
        <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-0.5" />

        {/* 历史计数 */}
        <span
          className="px-2 py-1 text-xs text-gray-400 dark:text-gray-500 select-none"
          title={`${undoCount} 步可撤销, ${redoCount} 步可重做`}
        >
          {undoCount + redoCount > 0
            ? `${undoCount}/${undoCount + redoCount}`
            : '--'}
        </span>

        {/* 清空历史按钮 */}
        {undoCount + redoCount > 0 && (
          <>
            <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-0.5" />
            <button
              onClick={clearHistory}
              title="清空历史记录"
              className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              aria-label="清空历史"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default React.memo(UndoRedoPanel);
