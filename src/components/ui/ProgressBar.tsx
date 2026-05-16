import React from 'react';

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  colorFn?: (percentage: number) => string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value, max = 100, label, showPercentage = true, size = 'md',
  colorFn = (p) => p >= 80 ? 'bg-green-500' : p >= 50 ? 'bg-blue-500' : p >= 25 ? 'bg-yellow-500' : 'bg-orange-500',
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const heightClass = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-4' : 'h-2.5';

  return (
    <div>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-1">
          {label && <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>}
          {showPercentage && <span className="text-sm font-medium text-gray-900 dark:text-white">{Math.round(percentage)}%</span>}
        </div>
      )}
      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`${heightClass} ${colorFn(percentage)} rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} />
      </div>
    </div>
  );
};
