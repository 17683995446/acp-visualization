import React from 'react';
import { PRIORITY_COLORS } from '../../constants';

interface PriorityBadgeProps {
  priority: string;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'sm' }) => {
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  const colorMap = PRIORITY_COLORS as Record<string, string>;
  return (
    <span className={`inline-flex items-center rounded font-bold ${colorMap[priority] || 'bg-gray-100 text-gray-600'} ${sizeClass}`}>
      {priority}
    </span>
  );
};
