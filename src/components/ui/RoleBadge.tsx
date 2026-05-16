import React from 'react';
import { ROLE_LABELS, ROLE_COLORS } from '../../constants';

interface RoleBadgeProps {
  role: string;
  size?: 'sm' | 'md';
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, size = 'sm' }) => {
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  const colorMap = ROLE_COLORS as Record<string, string>;
  const labelMap = ROLE_LABELS as Record<string, string>;
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${colorMap[role] || 'bg-gray-100 text-gray-600'} ${sizeClass}`}>
      {labelMap[role] || role}
    </span>
  );
};
