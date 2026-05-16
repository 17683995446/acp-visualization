import React from 'react';

export interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  src?: string;
  status?: 'idle' | 'busy' | 'offline';
  className?: string;
}

const sizeClasses: Record<string, string> = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
};

const statusDotColors: Record<string, string> = {
  idle: 'bg-green-500',
  busy: 'bg-red-500',
  offline: 'bg-gray-400',
};

export const Avatar: React.FC<AvatarProps> = ({
  name,
  size = 'md',
  src,
  status,
  className = '',
}) => {
  return (
    <div className={`relative inline-flex ${className}`}>
      {src ? (
        <img
          src={src}
          alt={`${name}'s avatar`}
          className={`${sizeClasses[size]} rounded-full object-cover`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white font-bold`}
        >
          {name.charAt(0)}
        </div>
      )}
      {status && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${statusDotColors[status]}`}
        />
      )}
    </div>
  );
};
