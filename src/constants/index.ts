import type { Role, Member, TaskStatus, TaskPriority, Message } from '../types';

// ============ 成员状态值常量 ============

export const MEMBER_STATUS = {
  IDLE: 'idle',
  BUSY: 'busy',
  OFFLINE: 'offline',
} as const;

// ============ 任务状态值常量 ============

export const TASK_STATUS = {
  PENDING: 'pending',
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  BLOCKED: 'blocked',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

// ============ 任务优先级值常量 ============

export const TASK_PRIORITY = {
  P0: 'P0', // 紧急
  P1: 'P1', // 高
  P2: 'P2', // 中
  P3: 'P3', // 低
} as const;

// ============ 角色标签 ============

export const ROLE_LABELS: Record<Role, string> = {
  ceo: '首席执行官',
  cto: '首席技术官',
  coo: '首席运营官',
  cqo: '首席质量官',
  manager: '经理',
  senior: '高级工程师',
  mid: '中级工程师',
  junior: '初级工程师',
  intern: '实习生',
  maintainer: '维护者',
  collaborator: '协作者',
  contributor: '贡献者',
};

// ============ 角色颜色 ============

export const ROLE_COLORS: Record<Role, string> = {
  ceo: 'bg-purple-100 text-purple-800 border-purple-200',
  cto: 'bg-blue-100 text-blue-800 border-blue-200',
  coo: 'bg-green-100 text-green-800 border-green-200',
  cqo: 'bg-orange-100 text-orange-800 border-orange-200',
  manager: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  senior: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  mid: 'bg-teal-100 text-teal-800 border-teal-200',
  junior: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  intern: 'bg-pink-100 text-pink-800 border-pink-200',
  maintainer: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  collaborator: 'bg-violet-100 text-violet-800 border-violet-200',
  contributor: 'bg-sky-100 text-sky-800 border-sky-200',
};

// ============ 成员状态标签 ============

export const STATUS_LABELS: Record<Member['status'], string> = {
  idle: '空闲',
  busy: '忙碌',
  offline: '离线',
};

// ============ 任务状态标签 ============

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: '待处理',
  scheduled: '已排期',
  in_progress: '进行中',
  blocked: '已阻塞',
  completed: '已完成',
  failed: '已失败',
};

// ============ 优先级颜色 ============

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  P0: 'bg-red-100 text-red-800 border-red-300',
  P1: 'bg-orange-100 text-orange-800 border-orange-300',
  P2: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  P3: 'bg-gray-100 text-gray-600 border-gray-300',
};

// ============ 消息类型配置 ============

export const MESSAGE_TYPE_CONFIG: Record<Message['type'], { label: string; color: string }> = {
  task: {
    label: '任务',
    color: 'bg-blue-100 text-blue-800',
  },
  notification: {
    label: '通知',
    color: 'bg-green-100 text-green-800',
  },
  request: {
    label: '请求',
    color: 'bg-yellow-100 text-yellow-800',
  },
  response: {
    label: '回复',
    color: 'bg-purple-100 text-purple-800',
  },
};
