import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4">
    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
    {description && <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);
