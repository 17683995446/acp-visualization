/**
 * ACP 全局状态管理 Store
 * 基于 Zustand，替代原有的组件级 useState
 *
 * 设计参考：Claude Code Best 的 state/ 模块
 */

import { create } from 'zustand';
import { persistMiddleware } from './persistMiddleware';
import type {
  Organization,
  Member,
  Department,
  Task,
  TaskStatus,
  TaskPriority,
  Message,
  KnowledgeNode,
  Score,
  Evaluation,
  Role,
} from '../types';
import { eventBus } from '../services/eventBus';
import type { LogEntry, LogLevel, SchedulerResult } from '../services/interfaces';
import { scheduleAll } from '../engine/scheduler';
import type { SchedulerConfig } from '../engine/scheduler';
import { DEFAULT_SCHEDULER_CONFIG } from '../engine/scheduler';
import {
  initialOrganization,
  initialTasks,
  initialKnowledgeNodes,
  initialEvaluationScores,
  initialEvaluation,
} from './initialData';
import { generateId, calculateStats } from './helpers';
import type { Stats } from './helpers';

// ============ 数据验证辅助函数 ============

const VALID_ROLES: Role[] = [
  'ceo', 'cto', 'coo', 'cqo',
  'manager', 'senior', 'mid', 'junior', 'intern',
  'maintainer', 'collaborator', 'contributor',
];

const VALID_PRIORITIES: TaskPriority[] = ['P0', 'P1', 'P2', 'P3'];

function validate(condition: boolean, message: string): boolean {
  if (!condition) {
    console.warn(`[ACP Store Validation] ${message}`);
    return false;
  }
  return true;
}

// ============ Store 状态接口 ============

export interface ACPState {
  // 组织
  organization: Organization;
  updateOrganization: (updates: Partial<Organization>) => void;

  // 成员管理
  addMember: (input: { name: string; role: Member['role']; capabilities: string[]; departmentId?: string }) => void;
  removeMember: (id: string) => void;
  updateMember: (id: string, updates: Partial<Member>) => void;
  updateMemberStatus: (id: string, status: Member['status']) => void;
  updateReputation: (memberId: string, delta: number) => void;

  // 部门管理
  addDepartment: (input: { name: string; headId: string; budget?: number }) => void;

  // 任务管理
  tasks: Task[];
  addTask: (input: {
    title: string;
    description: string;
    priority: TaskPriority;
    estimatedTime: number;
    dependencies?: string[];
    assignee?: string;
  }) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  assignTask: (taskId: string, memberId: string) => void;
  unassignTask: (taskId: string) => void;

  // 消息系统
  messages: Message[];
  sendMessage: (from: string, to: string, type: Message['type'], content: string) => void;
  markMessageAsRead: (messageId: string) => void;

  // 知识图谱
  knowledgeNodes: KnowledgeNode[];
  addKnowledgeNode: (input: { type: KnowledgeNode['type']; name: string; description: string; connections?: string[] }) => void;
  deleteKnowledgeNode: (id: string) => void;

  // 评估
  evaluation: Evaluation;
  evaluationScores: Score[];
  updateScore: (dimension: string, value: number) => void;
  recalculateEvaluation: () => void;

  // 调度器配置
  schedulerConfig: SchedulerConfig;
  setSchedulerConfig: (config: SchedulerConfig) => void;

  // 日志
  logs: LogEntry[];
  addLog: (level: LogLevel, message: string, data?: unknown) => void;
  clearLogs: () => void;

  // 模拟引擎
  isSimulating: boolean;
  simulationInterval: number;
  lastSchedulerResult: SchedulerResult | null;
  toggleSimulation: () => void;
  setSimulationInterval: (ms: number) => void;
  runSchedulerTick: () => void;
}

// ============ Store 创建 ============

export const useACPStore = create<ACPState>(persistMiddleware((set, get) => ({
  // 初始状态
  organization: initialOrganization,
  tasks: initialTasks,
  messages: [],
  knowledgeNodes: initialKnowledgeNodes,
  evaluation: initialEvaluation,
  evaluationScores: initialEvaluationScores,
  logs: [],
  isSimulating: false,
  simulationInterval: 2000,
  lastSchedulerResult: null,
  schedulerConfig: { ...DEFAULT_SCHEDULER_CONFIG },

  // ============ 组织操作 ============

  updateOrganization: (updates) => {
    set((state) => ({
      organization: { ...state.organization, ...updates },
    }));
  },

  // ============ 成员操作 ============

  addMember: (input) => {
    // 数据验证
    if (!validate(input.name.trim().length > 0, 'addMember: 成员名称不能为空')) return;
    if (!validate(VALID_ROLES.includes(input.role), `addMember: 无效的角色 "${input.role}"`)) return;
    if (!validate(input.capabilities.length > 0, 'addMember: 能力列表不能为空')) return;

    const newMember: Member = {
      id: generateId('agent'),
      name: input.name,
      role: input.role,
      level: input.role === 'intern' ? 1 : input.role === 'junior' ? 3 : input.role === 'mid' ? 5 : input.role === 'senior' ? 6 : input.role === 'manager' ? 7 : 8,
      reputation: 50,
      capabilities: input.capabilities,
      status: 'idle',
    };

    set((state) => {
      const updatedOrg = {
        ...state.organization,
        members: [...state.organization.members, newMember],
      };

      // 如果指定了部门，添加到部门
      if (input.departmentId) {
        updatedOrg.departments = updatedOrg.departments.map(dept =>
          dept.id === input.departmentId
            ? { ...dept, members: [...dept.members, newMember.id] }
            : dept
        );
      }

      return {
        organization: updatedOrg,
      };
    });

    eventBus.emit('org:memberAdded', newMember);
    get().addLog('info', `新成员加入: ${newMember.name} (${newMember.role})`);
  },

  removeMember: (id) => {
    set((state) => {
      const updatedMembers = state.organization.members.filter(m => m.id !== id);
      const updatedOrg = {
        ...state.organization,
        members: updatedMembers,
        departments: state.organization.departments.map(dept => ({
          ...dept,
          members: dept.members.filter(mId => mId !== id),
          head: dept.head === id ? '' : dept.head,
        })),
      };

      return {
        organization: updatedOrg,
        tasks: state.tasks.map(t =>
          t.assignee === id ? { ...t, assignee: undefined, status: 'pending' as TaskStatus } : t
        ),
        messages: state.messages.filter(m => m.from !== id && m.to !== id),
      };
    });

    eventBus.emit('org:memberRemoved', { id });
    get().addLog('info', `成员已移除: ${id}`);
  },

  updateMember: (id, updates) => {
    set((state) => {
      const updatedMembers = state.organization.members.map(m =>
        m.id === id ? { ...m, ...updates } : m
      );
      const updatedOrg = { ...state.organization, members: updatedMembers };
      return {
        organization: updatedOrg,
      };
    });
  },

  updateMemberStatus: (id, status) => {
    set((state) => {
      const updatedMembers = state.organization.members.map(m =>
        m.id === id ? { ...m, status, currentTask: status === 'idle' ? undefined : m.currentTask } : m
      );
      const updatedOrg = { ...state.organization, members: updatedMembers };
      return {
        organization: updatedOrg,
      };
    });

    eventBus.emit('agent:statusChanged', { id, status });
  },

  updateReputation: (memberId, delta) => {
    set((state) => {
      const updatedMembers = state.organization.members.map(m =>
        m.id === memberId
          ? { ...m, reputation: Math.max(0, Math.min(100, m.reputation + delta)) }
          : m
      );
      return { organization: { ...state.organization, members: updatedMembers } };
    });

    eventBus.emit('agent:reputationChanged', { memberId, delta });
  },

  // ============ 部门操作 ============

  addDepartment: (input) => {
    // 数据验证
    if (!validate(input.name.trim().length > 0, 'addDepartment: 部门名称不能为空')) return;
    const state = get();
    const headExists = state.organization.members.some(m => m.id === input.headId);
    if (!validate(headExists, `addDepartment: 负责人 ID "${input.headId}" 不存在`)) return;

    const newDept: Department = {
      id: generateId('dept'),
      name: input.name,
      head: input.headId,
      members: [input.headId],
      budget: input.budget ?? 10000,
    };

    set((state) => ({
      organization: {
        ...state.organization,
        departments: [...state.organization.departments, newDept],
      },
    }));

    eventBus.emit('org:departmentCreated', newDept);
    get().addLog('info', `新部门创建: ${newDept.name}`);
  },

  // ============ 任务操作 ============

  addTask: (input) => {
    // 数据验证
    if (!validate(input.title.trim().length > 0, 'addTask: 任务标题不能为空')) return;
    if (!validate(VALID_PRIORITIES.includes(input.priority), `addTask: 无效的优先级 "${input.priority}"`)) return;
    if (!validate(input.estimatedTime > 0, `addTask: 预估时间必须大于 0 (当前值: ${input.estimatedTime})`)) return;

    if (input.dependencies && input.dependencies.length > 0) {
      const existingIds = new Set(get().tasks.map(t => t.id));
      const invalidDeps = input.dependencies.filter(d => !existingIds.has(d));
      if (!validate(invalidDeps.length === 0, `addTask: 无效的依赖 ID: ${invalidDeps.join(', ')}`)) return;
    }

    const newTask: Task = {
      id: generateId('task'),
      title: input.title,
      description: input.description,
      status: input.assignee ? 'in_progress' : 'pending',
      priority: input.priority,
      assignee: input.assignee,
      dependencies: input.dependencies ?? [],
      progress: 0,
      estimatedTime: input.estimatedTime,
      createdAt: Date.now(),
    };

    set((state) => ({
      tasks: [...state.tasks, newTask],
    }));

    eventBus.emit('task:created', newTask);
    get().addLog('info', `新任务创建: ${newTask.title} [${newTask.priority}]`);
  },

  updateTask: (id, updates) => {
    set((state) => {
      const updatedTasks = state.tasks.map(t =>
        t.id === id ? { ...t, ...updates } : t
      );

      // 如果任务完成，释放 Agent
      let updatedMembers = state.organization.members;
      if (updates.status === 'completed' || updates.status === 'failed') {
        const task = state.tasks.find(t => t.id === id);
        if (task?.assignee) {
          updatedMembers = updatedMembers.map(m =>
            m.id === task.assignee ? { ...m, status: 'idle' as const, currentTask: undefined } : m
          );
        }
      }

      return {
        tasks: updatedTasks,
        organization: { ...state.organization, members: updatedMembers },
      };
    });

    eventBus.emit('task:updated', { id, updates });
  },

  deleteTask: (id) => {
    set((state) => {
      const updatedTasks = state.tasks.filter(t => t.id !== id);
      // 清理其他任务中对被删除任务的依赖引用
      const cleanedTasks = updatedTasks.map(t => ({
        ...t,
        dependencies: t.dependencies.filter(dep => dep !== id),
      }));
      return {
        tasks: cleanedTasks,
      };
    });

    eventBus.emit('task:deleted', { id });
    get().addLog('warn', `任务已删除: ${id}`);
  },

  assignTask: (taskId, memberId) => {
    // Validate member exists and is idle
    const currentState = get();
    const member = currentState.organization.members.find(m => m.id === memberId);
    if (!member) { get().addLog('warn', `assignTask: 成员 "${memberId}" 不存在`); return; }
    if (member.status !== 'idle') { get().addLog('warn', `assignTask: 成员 "${member.name}" 不是空闲状态`); return; }
    const task = currentState.tasks.find(t => t.id === taskId);
    if (!task) { get().addLog('warn', `assignTask: 任务 "${taskId}" 不存在`); return; }

    // If task already assigned, release old assignee first
    let updatedMembers = currentState.organization.members;
    if (task.assignee && task.assignee !== memberId) {
      updatedMembers = updatedMembers.map(m =>
        m.id === task.assignee ? { ...m, status: 'idle' as const, currentTask: undefined } : m
      );
    }

    set((state) => {
      const updatedTasks = state.tasks.map(t =>
        t.id === taskId ? { ...t, assignee: memberId, status: 'in_progress' as TaskStatus } : t
      );
      const finalMembers = updatedMembers.map(m =>
        m.id === memberId ? { ...m, status: 'busy' as const, currentTask: taskId } : m
      );
      return {
        tasks: updatedTasks,
        organization: { ...state.organization, members: finalMembers },
      };
    });

    eventBus.emit('task:assigned', { taskId, memberId });
    const memberAfter = get().organization.members.find(m => m.id === memberId);
    const taskAfter = get().tasks.find(t => t.id === taskId);
    get().addLog('info', `任务分配: ${taskAfter?.title} → ${memberAfter?.name}`);
  },

  unassignTask: (taskId) => {
    set((state) => {
      const task = state.tasks.find(t => t.id === taskId);
      let updatedMembers = state.organization.members;
      if (task?.assignee) {
        updatedMembers = updatedMembers.map(m =>
          m.id === task.assignee ? { ...m, status: 'idle' as const, currentTask: undefined } : m
        );
      }
      const updatedTasks = state.tasks.map(t =>
        t.id === taskId ? { ...t, assignee: undefined, status: 'pending' as TaskStatus } : t
      );

      return {
        tasks: updatedTasks,
        organization: { ...state.organization, members: updatedMembers },
      };
    });

    eventBus.emit('task:unassigned', { taskId });
    get().addLog('info', `任务取消分配: ${taskId}`);
  },

  // ============ 消息操作 ============

  sendMessage: (from, to, type, content) => {
    // 数据验证
    if (!validate(from !== to, `sendMessage: 发送方和接收方不能相同 ("${from}")`)) return;
    if (!validate(content.trim().length > 0, 'sendMessage: 消息内容不能为空')) return;

    const newMessage: Message = {
      id: generateId('msg'),
      from,
      to,
      type,
      content,
      timestamp: Date.now(),
      read: false,
    };

    set((state) => ({
      messages: [...state.messages, newMessage],
    }));

    eventBus.emit('message:sent', newMessage);
  },

  markMessageAsRead: (messageId) => {
    set((state) => ({
      messages: state.messages.map(m =>
        m.id === messageId ? { ...m, read: true } : m
      ),
    }));
  },

  // ============ 知识图谱操作 ============

  addKnowledgeNode: (input) => {
    const newNode: KnowledgeNode = {
      id: generateId('kn'),
      type: input.type,
      name: input.name,
      description: input.description,
      connections: input.connections ?? [],
    };

    set((state) => ({
      knowledgeNodes: [...state.knowledgeNodes, newNode],
    }));
  },

  deleteKnowledgeNode: (id) => {
    set((state) => ({
      knowledgeNodes: state.knowledgeNodes
        .filter(n => n.id !== id)
        .map(n => ({
          ...n,
          connections: n.connections.filter(c => c !== id),
        })),
    }));
  },

  // ============ 评估操作 ============

  updateScore: (dimension, value) => {
    set((state) => {
      const updatedScores = state.evaluationScores.map(s =>
        s.dimension === dimension ? { ...s, value } : s
      );
      return { evaluationScores: updatedScores };
    });
    get().recalculateEvaluation();
  },

  recalculateEvaluation: () => {
    const { evaluationScores } = get();
    const totalScore = Math.round(
      evaluationScores.reduce((sum, s) => {
        if (s.max <= 0) return sum;
        return sum + (s.value / s.max) * s.weight * 100;
      }, 0)
    );

    let rating: Evaluation['rating'];
    if (totalScore >= 95) rating = 'exceptional';
    else if (totalScore >= 85) rating = 'excellent';
    else if (totalScore >= 70) rating = 'good';
    else if (totalScore >= 60) rating = 'acceptable';
    else rating = 'needs_improvement';

    set((state) => ({
      evaluation: { ...state.evaluation, totalScore, rating, scores: evaluationScores },
    }));
  },

  // ============ 调度器配置 ============

  setSchedulerConfig: (config) => {
    set({ schedulerConfig: config });
  },

  // ============ 日志操作 ============

  addLog: (level, message, data) => {
    const entry: LogEntry = {
      id: generateId('log'),
      timestamp: Date.now(),
      level,
      message,
      data,
    };

    set((state) => ({
      logs: [entry, ...state.logs].slice(0, 200),
    }));
  },

  clearLogs: () => {
    set({ logs: [] });
  },

  // ============ 模拟引擎 ============

  toggleSimulation: () => {
    const { isSimulating } = get();
    const newValue = !isSimulating;

    set({ isSimulating: newValue });

    if (newValue) {
      eventBus.emit('system:simulationStarted');
      get().addLog('success', '🚀 模拟引擎已启动');
    } else {
      eventBus.emit('system:simulationStopped');
      get().addLog('info', '⏹️ 模拟引擎已停止');
    }
  },

  setSimulationInterval: (ms) => {
    set({ simulationInterval: ms });
  },

  runSchedulerTick: () => {
    const state = get();
    const result: SchedulerResult = {
      timestamp: Date.now(),
      tasksAssigned: 0,
      tasksCompleted: 0,
      agentsActivated: 0,
      agentsIdled: 0,
      reputationChanges: 0,
      messagesSent: 0,
    };

    // 收集所有变更，最后一次性 set()
    const taskUpdates: Array<{ id: string; updates: Partial<Task> }> = [];
    const taskAssignments: Array<{ taskId: string; memberId: string }> = [];
    const reputationChanges: Array<{ memberId: string; delta: number }> = [];
    const newMessages: Array<{ from: string; to: string; type: Message['type']; content: string }> = [];
    const logEntries: Array<{ level: LogLevel; message: string }> = [];

    // 1. 更新进行中任务的进度
    state.tasks.forEach(task => {
      if (task.status === 'in_progress' && task.progress < 100) {
        const increment = Math.random() * 8 + 2; // 2-10%
        const newProgress = Math.min(task.progress + increment, 100);

        if (newProgress >= 100) {
          taskUpdates.push({ id: task.id, updates: { progress: 100, status: 'completed' as TaskStatus } });
          result.tasksCompleted++;
          result.agentsIdled++;
          logEntries.push({ level: 'success', message: `✅ 任务完成: ${task.title}` });
          if (task.assignee) {
            reputationChanges.push({ memberId: task.assignee, delta: 3 });
            result.reputationChanges++;
          }
        } else {
          taskUpdates.push({ id: task.id, updates: { progress: newProgress } });
        }
      }
    });

    // 2. 智能调度：使用调度引擎分配待处理任务
    const decisions = scheduleAll(state.tasks, state.organization, state.schedulerConfig);
    decisions.forEach(decision => {
      taskAssignments.push({ taskId: decision.taskId, memberId: decision.memberId });
      result.tasksAssigned++;
      result.agentsActivated++;
      logEntries.push({ 
        level: 'info', 
        message: `🎯 智能分配: ${state.tasks.find(t => t.id === decision.taskId)?.title} → ${state.organization.members.find(m => m.id === decision.memberId)?.name} (匹配度 ${decision.score}分: ${decision.reason})` 
      });
    });

    // 3. 随机声誉波动
    if (Math.random() > 0.7) {
      const members = state.organization.members.filter(m => m.status !== 'offline');
      if (members.length === 0) return;
      const randomMember = members[Math.floor(Math.random() * members.length)];
      const delta = Math.random() > 0.5 ? 1 : -1;
      reputationChanges.push({ memberId: randomMember.id, delta });
      result.reputationChanges++;
    }

    // 4. 随机生成消息
    if (Math.random() > 0.6) {
      const activeMembers = state.organization.members.filter(m => m.status !== 'offline');
      if (activeMembers.length >= 2) {
        const from = activeMembers[Math.floor(Math.random() * activeMembers.length)];
        const to = activeMembers[Math.floor(Math.random() * activeMembers.length)];
        if (from.id !== to.id) {
          const messageTypes: Message['type'][] = ['notification', 'request', 'response'];
          const msgType = messageTypes[Math.floor(Math.random() * messageTypes.length)];
          const contents = [
            '任务进展顺利，预计按时完成',
            '需要协助处理一个技术问题',
            '已收到，正在处理中',
            '代码审查已完成，请查看反馈',
            '新需求已分析完毕，建议安排讨论',
          ];
          newMessages.push({ from: from.id, to: to.id, type: msgType, content: contents[Math.floor(Math.random() * contents.length)] });
          result.messagesSent++;
        }
      }
    }

    // 一次性应用所有变更
    set((prevState) => {
      let updatedTasks = [...prevState.tasks];
      let updatedMembers = [...prevState.organization.members];
      const updatedMessages = [...prevState.messages];

      // 应用任务进度更新
      taskUpdates.forEach(({ id, updates }) => {
        updatedTasks = updatedTasks.map(t => {
          if (t.id !== id) return t;
          const updated = { ...t, ...updates };
          // 如果任务完成，释放 Agent
          if (updates.status === 'completed' || updates.status === 'failed') {
            if (t.assignee) {
              updatedMembers = updatedMembers.map(m =>
                m.id === t.assignee ? { ...m, status: 'idle' as const, currentTask: undefined } : m
              );
            }
          }
          return updated;
        });
      });

      // 应用任务分配
      taskAssignments.forEach(({ taskId, memberId }) => {
        updatedTasks = updatedTasks.map(t =>
          t.id === taskId ? { ...t, assignee: memberId, status: 'in_progress' as TaskStatus } : t
        );
        updatedMembers = updatedMembers.map(m =>
          m.id === memberId ? { ...m, status: 'busy' as const, currentTask: taskId } : m
        );
      });

      // 应用声誉变更
      reputationChanges.forEach(({ memberId, delta }) => {
        updatedMembers = updatedMembers.map(m =>
          m.id === memberId
            ? { ...m, reputation: Math.max(0, Math.min(100, m.reputation + delta)) }
            : m
        );
      });

      // 应用新消息
      newMessages.forEach(({ from, to, type, content }) => {
        updatedMessages.push({
          id: generateId('msg'),
          from,
          to,
          type,
          content,
          timestamp: Date.now(),
        });
      });

      return {
        tasks: updatedTasks,
        organization: { ...prevState.organization, members: updatedMembers },
        messages: updatedMessages,
        lastSchedulerResult: result,
      };
    });

    // 发送日志和事件
    logEntries.forEach(({ level, message }) => {
      get().addLog(level, message);
    });

    // 发送事件通知
    taskAssignments.forEach(({ taskId, memberId }) => {
      eventBus.emit('task:assigned', { taskId, memberId });
      const member = get().organization.members.find(m => m.id === memberId);
      const task = get().tasks.find(t => t.id === taskId);
      get().addLog('info', `任务分配: ${task?.title} → ${member?.name}`);
    });

    reputationChanges.forEach(({ memberId, delta }) => {
      eventBus.emit('agent:reputationChanged', { memberId, delta });
    });

    newMessages.forEach(({ from, to, type, content }) => {
      eventBus.emit('message:sent', { from, to, type, content });
    });

    eventBus.emit('system:tick', result);
  },
})));

// ============ 派生状态选择器 ============

export const useACPStats = (): Stats => useACPStore((state) => {
  const { organization, tasks, messages } = state;
  return calculateStats(organization.members, tasks, messages);
});

export default useACPStore;
