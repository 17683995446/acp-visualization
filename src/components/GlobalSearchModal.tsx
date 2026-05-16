import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ListTodo,
  Users,
  Network,
  Search,
} from 'lucide-react';
import { useACPStore } from '../store/acpStore';

/** 全局搜索结果项 */
interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'task' | 'member' | 'knowledge';
  route: string;
}

/** 全局搜索模态框 */
const GlobalSearchModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const highlightedIndexRef = useRef(-1);

  const { tasks, organization, knowledgeNodes } = useACPStore();

  // 自动聚焦
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setHighlightedIndex(-1);
      highlightedIndexRef.current = -1;
      // 延迟聚焦以确保 DOM 已渲染
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // 搜索结果
  const results = useMemo<SearchResultItem[]>(() => {
    if (!query.trim()) return [];

    const q = query.toLowerCase().trim();
    const items: SearchResultItem[] = [];

    // 搜索任务
    tasks.forEach((task) => {
      if (
        task.title.toLowerCase().includes(q) ||
        task.description.toLowerCase().includes(q) ||
        task.status.toLowerCase().includes(q) ||
        task.priority.toLowerCase().includes(q)
      ) {
        items.push({
          id: task.id,
          title: task.title,
          subtitle: `${task.priority} · ${task.status === 'in_progress' ? '进行中' : task.status === 'completed' ? '已完成' : task.status === 'pending' ? '待处理' : task.status} · 进度 ${Math.round(task.progress)}%`,
          category: 'task',
          route: '/tasks',
        });
      }
    });

    // 搜索成员
    organization.members.forEach((member) => {
      if (
        member.name.toLowerCase().includes(q) ||
        member.role.toLowerCase().includes(q) ||
        member.capabilities.some((cap) => cap.toLowerCase().includes(q))
      ) {
        items.push({
          id: member.id,
          title: member.name,
          subtitle: `${member.role} · 声誉 ${member.reputation} · ${member.status === 'busy' ? '忙碌' : member.status === 'idle' ? '空闲' : '离线'}`,
          category: 'member',
          route: '/organization',
        });
      }
    });

    // 搜索知识节点
    knowledgeNodes.forEach((node) => {
      if (
        node.name.toLowerCase().includes(q) ||
        node.description.toLowerCase().includes(q) ||
        node.type.toLowerCase().includes(q)
      ) {
        items.push({
          id: node.id,
          title: node.name,
          subtitle: `${node.type} · ${node.connections.length} 个连接`,
          category: 'knowledge',
          route: '/knowledge',
        });
      }
    });

    return items;
  }, [query, tasks, organization.members, knowledgeNodes]);

  // 搜索结果变化时重置高亮
  useEffect(() => {
    setHighlightedIndex(-1);
    highlightedIndexRef.current = -1;
  }, [results]);

  // Escape 关闭 + 键盘导航
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }

      if (results.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = highlightedIndexRef.current < results.length - 1
          ? highlightedIndexRef.current + 1
          : 0;
        highlightedIndexRef.current = next;
        setHighlightedIndex(next);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const next = highlightedIndexRef.current > 0
          ? highlightedIndexRef.current - 1
          : results.length - 1;
        highlightedIndexRef.current = next;
        setHighlightedIndex(next);
      } else if (e.key === 'Enter') {
        if (highlightedIndexRef.current >= 0 && highlightedIndexRef.current < results.length) {
          e.preventDefault();
          const item = results[highlightedIndexRef.current];
          navigate(item.route);
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose, results, navigate]);

  // 点击结果项
  const handleResultClick = useCallback(
    (item: SearchResultItem) => {
      navigate(item.route);
      onClose();
    },
    [navigate, onClose]
  );

  // 点击遮罩关闭
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  if (!isOpen) return null;

  // 按类别分组
  const taskResults = results.filter((r) => r.category === 'task');
  const memberResults = results.filter((r) => r.category === 'member');
  const knowledgeResults = results.filter((r) => r.category === 'knowledge');

  // 计算每个类别在 results 中的起始索引
  const taskStartIdx = 0;
  const memberStartIdx = taskResults.length;
  const knowledgeStartIdx = taskResults.length + memberResults.length;

  const categoryConfig = {
    task: { label: '任务', icon: ListTodo, color: 'text-orange-500' },
    member: { label: '成员', icon: Users, color: 'text-blue-500' },
    knowledge: { label: '知识节点', icon: Network, color: 'text-purple-500' },
  };

  const renderGroup = (label: string, items: SearchResultItem[], category: 'task' | 'member' | 'knowledge', startIdx: number) => {
    if (items.length === 0) return null;
    const cfg = categoryConfig[category];
    const Icon = cfg.icon;

    return (
      <div key={category}>
        <div className="flex items-center space-x-2 px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
          <span>{label}</span>
          <span className="text-gray-400 dark:text-gray-500">({items.length})</span>
        </div>
        {items.map((item, localIdx) => {
          const globalIdx = startIdx + localIdx;
          const isHighlighted = globalIdx === highlightedIndex;
          return (
            <button
              key={item.id}
              onClick={() => handleResultClick(item)}
              className={`w-full text-left px-4 py-3 transition-colors flex items-center space-x-3 group ${
                isHighlighted
                  ? 'bg-blue-50 dark:bg-blue-900/30'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
              }`}
            >
            <Icon className={`w-4 h-4 ${cfg.color} flex-shrink-0`} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {item.title}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.subtitle}</p>
            </div>
          </button>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={handleBackdropClick}
    >
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* 搜索面板 */}
      <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* 搜索输入 */}
        <div className="flex items-center space-x-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索任务、成员、知识节点..."
            className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none text-sm"
          />
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
            ESC
          </kbd>
        </div>

        {/* 结果列表 */}
        <div className="max-h-[50vh] overflow-y-auto">
          {query.trim() && results.length === 0 && (
            <div className="px-4 py-12 text-center">
              <Search className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">没有找到匹配的结果</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">尝试其他关键词</p>
            </div>
          )}

          {!query.trim() && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-gray-400 dark:text-gray-500">输入关键词开始搜索</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                支持搜索任务、成员和知识节点
              </p>
            </div>
          )}

          {results.length > 0 && (
            <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {renderGroup('任务', taskResults, 'task', taskStartIdx)}
              {renderGroup('成员', memberResults, 'member', memberStartIdx)}
              {renderGroup('知识节点', knowledgeResults, 'knowledge', knowledgeStartIdx)}
            </div>
          )}
        </div>

        {/* 底部提示 */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center space-x-3 text-xs text-gray-400 dark:text-gray-500">
            <span className="flex items-center space-x-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 text-[10px]">
                <span className="text-gray-500 dark:text-gray-400">&uarr;</span>
                <span className="text-gray-500 dark:text-gray-400">&darr;</span>
              </kbd>
              <span>导航</span>
            </span>
            <span className="flex items-center space-x-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 text-[10px]">
                <span className="text-gray-500 dark:text-gray-400">Enter</span>
              </kbd>
              <span>打开</span>
            </span>
            <span className="flex items-center space-x-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 text-[10px]">
                <span className="text-gray-500 dark:text-gray-400">Esc</span>
              </kbd>
              <span>关闭</span>
            </span>
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {results.length} 个结果
          </span>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchModal;
