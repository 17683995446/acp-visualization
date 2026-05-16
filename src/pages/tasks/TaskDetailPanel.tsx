import React from 'react';
import {
  X,
  UserPlus,
  Edit3,
  Trash2,
} from 'lucide-react';
import { StatusBadge, PriorityBadge } from '../../components/ui';
import type { Task, TaskStatus } from '../../types';

interface TaskDetailPanelProps {
  task: Task;
  members: { id: string; name: string }[];
  tasks: Task[];
  onAssign: (taskId: string) => void;
  onEditStatus: (taskId: string, currentStatus: TaskStatus) => void;
  onDelete: (taskId: string) => void;
  onClose: () => void;
}

const TaskDetailPanel: React.FC<TaskDetailPanelProps> = ({
  task,
  members,
  tasks,
  onAssign,
  onEditStatus,
  onDelete,
  onClose,
}) => {
  const isTerminal = task.status === 'completed' || task.status === 'failed';

  return (
    <div className="w-full lg:w-80 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white">任务详情</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>
      <div className="space-y-3">
        <div>
          <span className="text-xs text-gray-500 dark:text-gray-400">标题</span>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{task.title}</p>
        </div>
        <div className="flex items-center space-x-4">
          <div>
            <span className="text-xs text-gray-500">状态</span>
            <p className="text-sm mt-0.5">
              <StatusBadge type="task" status={task.status} />
            </p>
          </div>
          <div>
            <span className="text-xs text-gray-500">优先级</span>
            <p className="text-sm mt-0.5">
              <PriorityBadge priority={task.priority} />
            </p>
          </div>
        </div>
        <div>
          <span className="text-xs text-gray-500">进度</span>
          <div className="flex items-center space-x-2 mt-1">
            <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all"
                style={{ width: `${task.progress}%` }}
              />
            </div>
            <span className="text-xs text-gray-600">{Math.round(task.progress)}%</span>
          </div>
        </div>
        <div>
          <span className="text-xs text-gray-500">描述</span>
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{task.description}</p>
        </div>
        {task.assignee && (
          <div>
            <span className="text-xs text-gray-500">负责人</span>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {members.find((m) => m.id === task.assignee)?.name || task.assignee}
            </p>
          </div>
        )}
        {task.dependencies.length > 0 && (
          <div>
            <span className="text-xs text-gray-500">依赖任务</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {task.dependencies.map((depId) => {
                const depTask = tasks.find((t) => t.id === depId);
                return (
                  <span
                    key={depId}
                    className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-xs text-gray-700"
                  >
                    {depTask?.title || depId}
                  </span>
                );
              })}
            </div>
          </div>
        )}
        <div className="flex items-center space-x-2 pt-3 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={() => onAssign(task.id)}
            disabled={!!task.assignee || isTerminal}
            className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-xs font-medium rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>分配</span>
          </button>
          <button
            onClick={() => onEditStatus(task.id, task.status)}
            className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-xs font-medium rounded-md bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>修改状态</span>
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="flex items-center justify-center space-x-1 px-3 py-2 text-xs font-medium rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export { TaskDetailPanel };
