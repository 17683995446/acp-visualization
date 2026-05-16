import React from 'react';

export interface TabItem {
  key: string;
  label: string;
  icon?: React.ElementType;
  count?: number;
}

export interface TabsProps {
  items: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  variant?: 'underline' | 'pill';
  size?: 'sm' | 'md';
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  activeKey,
  onChange,
  variant = 'underline',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
  };

  const underlineActive = 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400';
  const underlineInactive =
    'border-b-2 border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600';

  const pillActive =
    'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300';
  const pillInactive =
    'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700';

  return (
    <div className="flex space-x-1">
      {items.map((item) => {
        const isActive = item.key === activeKey;
        const Icon = item.icon;
        return (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            className={`inline-flex items-center space-x-1.5 font-medium rounded-md transition-colors ${sizeClasses[size]} ${
              variant === 'underline'
                ? isActive
                  ? underlineActive
                  : underlineInactive
                : isActive
                  ? pillActive
                  : pillInactive
            }`}
            aria-label={item.label}
          >
            {Icon && <Icon className="w-4 h-4" />}
            <span>{item.label}</span>
            {item.count !== undefined && (
              <span
                className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${
                  isActive
                    ? 'bg-primary-200 text-primary-800 dark:bg-primary-800 dark:text-primary-200'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
