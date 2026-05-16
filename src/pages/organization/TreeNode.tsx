import React from 'react';
import { Trash2 } from 'lucide-react';
import { useACPStore } from '../../store/acpStore';
import { RoleBadge, StatusBadge } from '../../components/ui';
import { statusConfig } from './constants';
import type { Member } from '../../types';

interface TreeNodeProps {
  member: Member;
  taskTitle?: string;
  depth?: number;
  isHead?: boolean;
  onRemoveClick: (memberId: string) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  member,
  taskTitle,
  depth = 0,
  isHead = false,
  onRemoveClick,
}) => {
  const updateMemberStatus = useACPStore((s) => s.updateMemberStatus);

  const statusInfo = statusConfig[member.status];

  const handleStatusChange = (newStatus: Member['status']) => {
    updateMemberStatus(member.id, newStatus);
  };

  return (
    <div
      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
      style={{ paddingLeft: `${depth * 24 + 8}px` }}
    >
      <div className="flex items-center space-x-3 min-w-0">
        <div className="relative flex-shrink-0">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
              isHead
                ? 'bg-gradient-to-br from-blue-400 to-blue-600'
                : 'bg-gradient-to-br from-gray-300 to-gray-500'
            }`}
          >
            {member.name.charAt(0)}
          </div>
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-800 ${statusInfo.dotColor}`}
          />
        </div>
        <div className="min-w-0">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {member.name}
            </p>
            <RoleBadge role={member.role} />
            <span className="text-xs text-gray-400 dark:text-gray-500">
              L{member.level}
            </span>
          </div>
          <div className="flex items-center space-x-2 mt-0.5">
            <StatusBadge type="member" status={member.status} />
            {member.currentTask && taskTitle && (
              <span className="text-xs text-orange-600 dark:text-orange-400 truncate">
                任务: {taskTitle}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 操作按钮 (hover 显示) */}
      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        {(Object.keys(statusConfig) as Member['status'][]).map((s) => {
          const cfg = statusConfig[s];
          const SIcon = cfg.icon;
          const isActive = member.status === s;
          return (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              title={`切换为${cfg.label}`}
              className={`p-1 rounded transition-colors ${
                isActive
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                  : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <SIcon className="w-3 h-3" />
            </button>
          );
        })}
        <button
          onClick={() => onRemoveClick(member.id)}
          title="移除成员"
          className="p-1 rounded text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export { TreeNode };
export type { TreeNodeProps };
