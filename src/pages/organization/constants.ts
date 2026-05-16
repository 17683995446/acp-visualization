import React from 'react';
import { CircleDot, Moon, Zap } from 'lucide-react';
import type { Member } from '../../types';

export const statusConfig: Record<
  Member['status'],
  { label: string; color: string; dotColor: string; icon: React.ElementType }
> = {
  idle: {
    label: '空闲',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    dotColor: 'bg-green-500',
    icon: CircleDot,
  },
  busy: {
    label: '忙碌',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    dotColor: 'bg-orange-500',
    icon: Zap,
  },
  offline: {
    label: '离线',
    color: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
    dotColor: 'bg-gray-400',
    icon: Moon,
  },
};

export const orgTypeLabels: Record<string, string> = {
  corporate: '企业型',
  social: '社会型',
  hybrid: '混合模式',
};

export const orgTypeColors: Record<string, string> = {
  corporate:
    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  social:
    'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  hybrid:
    'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
};
