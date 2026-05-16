import React from 'react';

export interface ViewOption {
  key: string;
  label: string;
  icon: React.ElementType;
}

export interface ViewToggleProps {
  options: ViewOption[];
  activeKey: string;
  onChange: (key: string) => void;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({
  options,
  activeKey,
  onChange,
}) => {
  return (
    <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
      {options.map((option) => {
        const isActive = option.key === activeKey;
        const Icon = option.icon;
        return (
          <button
            key={option.key}
            onClick={() => onChange(option.key)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              isActive
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            aria-label={option.label}
          >
            <Icon className="w-4 h-4" />
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
};
