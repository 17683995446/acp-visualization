import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { AnimatedCounter } from '../animation';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  gradient: string;
  subtitle?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, gradient, subtitle }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
          {typeof value === 'number' ? <AnimatedCounter value={value} /> : value}
        </p>
        {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);
