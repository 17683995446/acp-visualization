import React from 'react';
import { Target, Trash2 } from 'lucide-react';
import { useACPStore } from '../../store/acpStore';
import { RoleBadge, StatusBadge } from '../../components/ui';
import { statusConfig } from './constants';
import type { Member } from '../../types';

interface MemberCardProps {
  member: Member;
  taskTitle?: string;
  onRemoveClick: (memberId: string) => void;
}

const MemberCard: React.FC<MemberCardProps> = ({
  member,
  taskTitle,
  onRemoveClick,
}) => {
  const updateMemberStatus = useACPStore((s) => s.updateMemberStatus);

  const statusInfo = statusConfig[member.status];

  const handleStatusChange = (newStatus: Member['status']) => {
    updateMemberStatus(member.id, newStatus);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow relative group">
      {/* 顶部：头像 + 基本信息 + 状态 */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white font-bold">
              {member.name.charAt(0)}
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${statusInfo.dotColor}`}
              title={statusInfo.label}
            />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">
              {member.name}
            </h3>
            <div className="flex items-center space-x-2 mt-0.5">
              <RoleBadge role={member.role} />
              <span className="text-xs text-gray-400 dark:text-gray-500">
                L{member.level}
              </span>
            </div>
          </div>
        </div>

        {/* 状态标签 */}
        <StatusBadge type="member" status={member.status} />
      </div>

      {/* 声誉进度条 */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-sm mb-1.5">
          <span className="text-gray-500 dark:text-gray-400">声誉</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {member.reputation}
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-400 to-secondary-400 rounded-full transition-all duration-500"
            style={{ width: `${member.reputation}%` }}
          />
        </div>
      </div>

      {/* 能力标签 */}
      <div className="mt-3 flex flex-wrap gap-1">
        {member.capabilities.map((cap, i) => (
          <span
            key={i}
            className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {cap}
          </span>
        ))}
      </div>

      {/* 当前任务 */}
      {member.currentTask && taskTitle && (
        <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-900/20 rounded text-xs text-orange-700 dark:text-orange-300 flex items-center space-x-1">
          <Target className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">当前任务: {taskTitle}</span>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
        {/* 状态切换按钮组 */}
        <div className="flex items-center space-x-1">
          {(Object.keys(statusConfig) as Member['status'][]).map((s) => {
            const cfg = statusConfig[s];
            const SIcon = cfg.icon;
            const isActive = member.status === s;
            return (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                title={`切换为${cfg.label}`}
                className={`p-1.5 rounded-md transition-colors ${
                  isActive
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                    : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                <SIcon className="w-3.5 h-3.5" />
              </button>
            );
          })}
        </div>

        {/* 删除按钮 */}
        <button
          onClick={() => onRemoveClick(member.id)}
          title="移除成员"
          className="p-1.5 rounded-md text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export { MemberCard };
export type { MemberCardProps };
