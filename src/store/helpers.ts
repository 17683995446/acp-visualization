/**
 * ACP 辅助函数
 * 从 acpStore.ts 提取，集中管理通用工具函数
 */

import { v4 as uuidv4 } from 'uuid';
import type { Member, Task, Message } from '../types';

export interface Stats {
  activeAgents: number;
  busyAgents: number;
  idleAgents: number;
  offlineAgents: number;
  activeTasks: number;
  completedTasks: number;
  pendingTasks: number;
  failedTasks: number;
  avgProgress: number;
  totalMessages: number;
}

export function generateId(prefix: string): string {
  return `${prefix}-${uuidv4().slice(0, 8)}`;
}

export function calculateStats(
  members: Member[],
  tasks: Task[],
  messages: Message[]
): Stats {
  return {
    activeAgents: members.filter(m => m.status !== 'offline').length,
    busyAgents: members.filter(m => m.status === 'busy').length,
    idleAgents: members.filter(m => m.status === 'idle').length,
    offlineAgents: members.filter(m => m.status === 'offline').length,
    activeTasks: tasks.filter(t => t.status === 'in_progress').length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    pendingTasks: tasks.filter(t => t.status === 'pending').length,
    failedTasks: tasks.filter(t => t.status === 'failed').length,
    avgProgress: tasks.length > 0
      ? tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length
      : 0,
    totalMessages: messages.length,
  };
}
