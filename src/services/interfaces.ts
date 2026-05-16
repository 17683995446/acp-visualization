/**
 * ACP 服务层接口定义
 * 参考 Claude Code Best 的服务架构（src/services/）
 * 
 * 设计原则：
 * - ISP（接口隔离）：每个服务专注单一职责
 * - DIP（依赖倒置）：高层模块依赖抽象接口
 * - SRP（单一职责）：每个方法只做一件事
 */

import type {
  Organization,
  Member,
  Department,
  Task,
  TaskStatus,
  TaskPriority,
  Message,
  KnowledgeNode,
  PerformanceMetrics,
  Score,
  Evaluation,
} from '../types';

// ============ 任务服务接口 ============

export interface ITaskService {
  /** 获取所有任务 */
  getAllTasks(): Task[];
  /** 根据 ID 获取任务 */
  getTaskById(id: string): Task | undefined;
  /** 根据状态筛选任务 */
  getTasksByStatus(status: TaskStatus): Task[];
  /** 根据优先级筛选任务 */
  getTasksByPriority(priority: TaskPriority): Task[];
  /** 创建任务 */
  createTask(input: CreateTaskInput): Task;
  /** 更新任务 */
  updateTask(id: string, updates: Partial<Task>): Task | undefined;
  /** 删除任务 */
  deleteTask(id: string): boolean;
  /** 分配任务给 Agent */
  assignTask(taskId: string, memberId: string): Task | undefined;
  /** 取消任务分配 */
  unassignTask(taskId: string): Task | undefined;
  /** 更新任务进度 */
  updateProgress(taskId: string, progress: number): Task | undefined;
  /** 获取可分配的任务（pending 状态且无依赖阻塞） */
  getAssignableTasks(): Task[];
  /** 获取任务统计 */
  getTaskStats(): TaskStats;
}

export interface CreateTaskInput {
  title: string;
  description: string;
  priority: TaskPriority;
  estimatedTime: number;
  dependencies?: string[];
  assignee?: string;
  deadline?: number;
}

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

// ============ 组织服务接口 ============

export interface IOrganizationService {
  /** 获取组织信息 */
  getOrganization(): Organization;
  /** 更新组织信息 */
  updateOrganization(updates: Partial<Organization>): Organization;
  /** 获取所有成员 */
  getAllMembers(): Member[];
  /** 根据 ID 获取成员 */
  getMemberById(id: string): Member | undefined;
  /** 添加成员 */
  addMember(input: CreateMemberInput): Member;
  /** 移除成员 */
  removeMember(id: string): boolean;
  /** 更新成员信息 */
  updateMember(id: string, updates: Partial<Member>): Member | undefined;
  /** 获取空闲成员 */
  getIdleMembers(): Member[];
  /** 获取忙碌成员 */
  getBusyMembers(): Member[];
  /** 更新成员声誉 */
  updateReputation(memberId: string, delta: number): Member | undefined;
  /** 更新成员状态 */
  updateMemberStatus(memberId: string, status: Member['status']): Member | undefined;
  /** 获取部门列表 */
  getDepartments(): Department[];
  /** 创建部门 */
  createDepartment(input: CreateDepartmentInput): Department;
  /** 获取绩效指标 */
  getPerformance(): PerformanceMetrics;
  /** 获取 Top Performer */
  getTopPerformers(limit?: number): Member[];
}

export interface CreateMemberInput {
  name: string;
  role: Member['role'];
  capabilities: string[];
  departmentId?: string;
}

export interface CreateDepartmentInput {
  name: string;
  headId: string;
  budget?: number;
}

// ============ 通信服务接口 ============

export interface ICommunicationService {
  /** 发送消息 */
  sendMessage(input: SendMessageInput): Message;
  /** 获取消息历史 */
  getMessageHistory(filters?: MessageFilters): Message[];
  /** 获取指定成员的消息 */
  getMessagesForMember(memberId: string): Message[];
  /** 获取两个成员之间的对话 */
  getConversation(member1Id: string, member2Id: string): Message[];
  /** 获取未读消息数 */
  getUnreadCount(memberId: string): number;
  /** 标记消息已读 */
  markAsRead(messageId: string): void;
}

export interface SendMessageInput {
  from: string;
  to: string;
  type: Message['type'];
  content: string;
}

export interface MessageFilters {
  from?: string;
  to?: string;
  type?: Message['type'];
  since?: number;
  limit?: number;
}

// ============ 知识服务接口 ============

export interface IKnowledgeService {
  /** 获取所有知识节点 */
  getAllNodes(): KnowledgeNode[];
  /** 根据 ID 获取节点 */
  getNodeById(id: string): KnowledgeNode | undefined;
  /** 根据类型筛选 */
  getNodesByType(type: KnowledgeNode['type']): KnowledgeNode[];
  /** 添加知识节点 */
  addNode(input: CreateKnowledgeNodeInput): KnowledgeNode;
  /** 删除知识节点 */
  deleteNode(id: string): boolean;
  /** 获取节点的关联节点 */
  getConnections(nodeId: string): KnowledgeNode[];
  /** 搜索知识 */
  searchKnowledge(query: string): KnowledgeNode[];
}

export interface CreateKnowledgeNodeInput {
  type: KnowledgeNode['type'];
  name: string;
  description: string;
  connections?: string[];
}

// ============ 评估服务接口 ============

export interface IEvaluationService {
  /** 获取当前评估 */
  getEvaluation(): Evaluation;
  /** 获取评分详情 */
  getScores(): Score[];
  /** 更新评分 */
  updateScore(dimension: string, value: number): Score | undefined;
  /** 重新计算总分 */
  recalculate(): Evaluation;
  /** 获取优势列表 */
  getStrengths(): string[];
  /** 获取待改进列表 */
  getWeaknesses(): string[];
  /** 获取建议列表 */
  getRecommendations(): string[];
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
