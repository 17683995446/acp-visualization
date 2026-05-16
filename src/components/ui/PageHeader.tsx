import React from 'react';
import { Badge } from './Badge';

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  badges?: Array<{
    label: string;
    variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  }>;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  badges,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {title}
        </h1>
        {(description || badges) && (
          <div className="flex items-center space-x-2 mt-1">
            {description && (
              <span className="text-gray-500 dark:text-gray-400">
                {description}
              </span>
            )}
            {badges?.map((badge, index) => (
              <Badge key={index} variant={badge.variant}>
                {badge.label}
              </Badge>
            ))}
          </div>
        )}
      </div>
      {actions && <div className="flex items-center space-x-2 flex-wrap">{actions}</div>}
    </div>
  );
};
