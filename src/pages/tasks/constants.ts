import React from 'react';
import {
  Pause,
  CalendarClock,
  Play,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import type { TaskStatus, TaskPriority } from '../../types';

// ============ 状态配置映射 ============

export const statusConfig: Record<
  TaskStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  pending: { label: '待处理', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300', icon: Pause },
  scheduled: { label: '已调度', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', icon: CalendarClock },
  in_progress: { label: '进行中', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300', icon: Play },
  blocked: { label: '阻塞', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', icon: AlertCircle },
  completed: { label: '已完成', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300', icon: CheckCircle },
  failed: { label: '失败', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', icon: AlertCircle },
};

// ============ 筛选选项 ============

export const filterOptions: { value: TaskStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待处理' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'failed', label: '失败' },
];

// ============ 状态编辑选项 ============

export const statusEditOptions: { value: TaskStatus; label: string }[] = [
  { value: 'pending', label: '待处理' },
  { value: 'scheduled', label: '已调度' },
  { value: 'in_progress', label: '进行中' },
  { value: 'blocked', label: '阻塞' },
  { value: 'completed', label: '已完成' },
  { value: 'failed', label: '失败' },
];

// ============ 新建任务表单类型 ============

export interface NewTaskForm {
  title: string;
  description: string;
  priority: TaskPriority;
  estimatedTime: number;
}
