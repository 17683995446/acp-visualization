import React from 'react';
import { X } from 'lucide-react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  dot?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
}

const variantStyles: Record<string, string> = {
  default: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  primary: 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300',
  success: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  warning: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  danger: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
};

const dotColors: Record<string, string> = {
  default: 'bg-gray-500',
  primary: 'bg-primary-500',
  success: 'bg-green-500',
  warning: 'bg-orange-500',
  danger: 'bg-red-500',
  info: 'bg-blue-500',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  dot = false,
  removable = false,
  onRemove,
  className = '',
}) => {
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${variantStyles[variant]} ${sizeClass} ${className}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotColors[variant]}`} />
      )}
      {children}
      {removable && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          className="ml-1.5 inline-flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          aria-label="移除"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </span>
  );
};
