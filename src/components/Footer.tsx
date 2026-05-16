import React from 'react';
import { Trash2 } from 'lucide-react';
import { useToast } from './Toast/useToast';
import { clearPersistedState } from '../store/persistMiddleware';

/** 页脚组件 - 包含重置数据功能 */
const Footer: React.FC = () => {
  const toast = useToast();

  const handleResetData = () => {
    if (window.confirm('确定要重置所有数据吗？此操作将清除本地存储的所有组织、任务和消息数据，且无法撤销。')) {
      clearPersistedState();
      toast.success('数据已重置，页面将刷新');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Agent Cluster Platform © {new Date().getFullYear()} | 基于 Claude Code Best 构建 | Zustand + React + TypeScript
          </p>
          <button
            onClick={handleResetData}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            aria-label="重置所有数据"
          >
            <Trash2 className="w-4 h-4" />
            <span>重置数据</span>
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
