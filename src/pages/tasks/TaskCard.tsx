import React from 'react';
import {
  Clock,
  UserPlus,
  Edit3,
  Trash2,
  CalendarClock,
  Link2,
} from 'lucide-react';
import { StatusBadge, PriorityBadge } from '../../components/ui';
import { formatDateTime } from '../../utils/format';
import type { Task, TaskStatus } from '../../types';

interface TaskCardProps {
  task: Task;
  members: { id: string; name: string }[];
  onAssign: (taskId: string) => void;
  onEditStatus: (taskId: string, currentStatus: TaskStatus) => void;
  onDelete: (taskId: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, members, onAssign, onEditStatus, onDelete }) => {
  const assignee = members.find((m) => m.id === task.assignee);
  const isTerminal = task.status === 'completed' || task.status === 'failed';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
      {/* 顶部：优先级 + 状态 */}
      <div className="flex items-start justify-between mb-3">
        <PriorityBadge priority={task.priority} />
        <StatusBadge type="task" status={task.status} />
      </div>

      {/* 标题 + 描述 */}
      <h3 className="font-medium text-gray-900 dark:text-white mb-1 line-clamp-1">{task.title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{task.description}</p>

      {/* 进度条 */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-500">进度</span>
          <span className="font-medium text-gray-700 dark:text-gray-300">{Math.round(task.progress)}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isTerminal
                ? task.status === 'completed'
                  ? 'bg-green-500'
                  : 'bg-red-500'
                : 'bg-gradient-to-r from-primary-400 to-secondary-400'
            }`}
            style={{ width: `${task.progress}%` }}
          />
        </div>
      </div>

      {/* 底部信息 */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
        <div className="flex items-center space-x-2">
          {assignee ? (
            <>
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white text-xs font-bold">
                {assignee.name.charAt(0)}
              </div>
              <span className="text-gray-900 dark:text-white">{assignee.name}</span>
            </>
          ) : (
            <span className="text-gray-400 dark:text-gray-500">未分配</span>
          )}
        </div>
        <div className="flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>{task.estimatedTime}h</span>
        </div>
      </div>

      {/* 依赖 + 创建时间 */}
      <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mb-3">
        <div className="flex items-center space-x-1">
          <Link2 className="w-3 h-3" />
          <span>依赖 {task.dependencies.length} 个任务</span>
        </div>
        <div className="flex items-center space-x-1">
          <CalendarClock className="w-3 h-3" />
          <span>{formatDateTime(task.createdAt)}</span>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center space-x-2 pt-3 border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={() => onAssign(task.id)}
          disabled={!!task.assignee || isTerminal}
          title={task.assignee ? '已分配' : '分配给空闲 Agent'}
          className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>分配</span>
        </button>
        <button
          onClick={() => onEditStatus(task.id, task.status)}
          title="修改状态"
          className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors bg-orange-50 text-orange-600 hover:bg-orange-100"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>状态</span>
        </button>
        <button
          onClick={() => onDelete(task.id)}
          title="删除任务"
          className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors bg-red-50 text-red-600 hover:bg-red-100 ml-auto"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>删除</span>
        </button>
      </div>
    </div>
  );
};

export { TaskCard };
