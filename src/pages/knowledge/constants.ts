import type { KnowledgeNode } from '../../types';

// ============ 类型配置 ============

export const TYPE_CONFIG: Record<
  KnowledgeNode['type'],
  { label: string; color: string; gradient: string; stroke: string; bg: string; text: string }
> = {
  file: {
    label: '文件',
    color: '#3b82f6',
    gradient: 'url(#grad-file)',
    stroke: '#2563eb',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
  },
  function: {
    label: '函数',
    color: '#22c55e',
    gradient: 'url(#grad-function)',
    stroke: '#16a34a',
    bg: 'bg-green-50',
    text: 'text-green-700',
  },
  class: {
    label: '类',
    color: '#a855f7',
    gradient: 'url(#grad-class)',
    stroke: '#9333ea',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
  },
  concept: {
    label: '概念',
    color: '#f97316',
    gradient: 'url(#grad-concept)',
    stroke: '#ea580c',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
  },
  decision: {
    label: '决策',
    color: '#ef4444',
    gradient: 'url(#grad-decision)',
    stroke: '#dc2626',
    bg: 'bg-red-50',
    text: 'text-red-700',
  },
};

export const ALL_TYPES: KnowledgeNode['type'][] = ['file', 'function', 'class', 'concept', 'decision'];
