/**
 * ACP 服务层共享类型定义
 */

// ============ 任务统计类型 ============

export interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  failed: number;
  blocked: number;
  avgProgress: number;
  totalEstimatedTime: number;
  totalActualTime: number;
}

// ============ 调度结果类型 ============

export interface SchedulerResult {
  timestamp: number;
  tasksAssigned: number;
  tasksCompleted: number;
  agentsActivated: number;
  agentsIdled: number;
  reputationChanges: number;
  messagesSent: number;
}

// ============ 日志类型 ============

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  message: string;
  data?: unknown;
}
