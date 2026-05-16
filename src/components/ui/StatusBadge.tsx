import React from 'react';
import { TASK_STATUS_LABELS, STATUS_LABELS } from '../../constants';

interface StatusBadgeProps {
  status: string;
  type?: 'task' | 'member';
  size?: 'sm' | 'md';
}

const taskStatusStyles: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  blocked: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  scheduled: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
};

const memberStatusStyles: Record<string, string> = {
  idle: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  busy: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  offline: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'task', size = 'sm' }) => {
  const labels = type === 'task' ? TASK_STATUS_LABELS : STATUS_LABELS;
  const styles = type === 'task' ? taskStatusStyles : memberStatusStyles;
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  const labelsMap = labels as Record<string, string>;
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${styles[status] || 'bg-gray-100 text-gray-600'} ${sizeClass}`}>
      {labelsMap[status] || status}
    </span>
  );
};
