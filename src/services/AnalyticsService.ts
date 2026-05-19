/**
 * AnalyticsService - ACP 高级分析引擎
 * 提供瓶颈分析、资源利用率、任务健康度、协作分析和趋势预测功能
 */

import type { Task, Member, Message, Evaluation } from '../types';

// ============ 类型定义 ============

export interface Bottleneck {
  type: 'agent_overload' | 'task_blocked' | 'dependency_chain' | 'resource_waste';
  severity: 'critical' | 'warning' | 'info';
  description: string;
  affectedIds: string[];
  suggestion: string;
}

export interface ResourceUtilization {
  totalAgents: number;
  busyAgents: number;
  idleAgents: number;
  offlineAgents: number;
  utilizationRate: number; // 0-100
  avgTasksPerAgent: number;
  overloadedAgents: Member[];
  underutilizedAgents: Member[];
}

export interface TaskHealth {
  totalTasks: number;
  healthyTasks: number;
  atRiskTasks: Task[];
  stalledTasks: Task[];
  blockedTasks: Task[];
  failedTasks: Task[];
  healthScore: number; // 0-100
}

export interface CollaborationMetrics {
  totalMessages: number;
  responseRate: number;
  avgResponseTime: number;
  mostActiveMembers: { id: string; name: string; messageCount: number }[];
  communicationGaps: { member1: string; member2: string; reason: string }[];
}

export interface TrendPrediction {
  estimatedCompletionTime: number;
  completionRate: number;
  riskLevel: 'low' | 'medium' | 'high';
  prediction: string;
}

export interface AnalysisReport {
  timestamp: number;
  bottlenecks: Bottleneck[];
  resourceUtilization: ResourceUtilization;
  taskHealth: TaskHealth;
  collaboration: CollaborationMetrics;
  trend: TrendPrediction;
  overallScore: number;
  recommendations: string[];
}

// ============ 常量 ============

const OVERLOAD_THRESHOLD = 3;
const STALL_THRESHOLD_MS = 30 * 60 * 1000; // 30 分钟
const AT_RISK_PROGRESS_RATIO = 0.5; // 进度/时间比低于 50% 视为风险

// ============ 瓶颈分析 ============

export function analyzeBottlenecks(tasks: Task[], members: Member[]): Bottleneck[] {
  const bottlenecks: Bottleneck[] = [];
  const now = Date.now();

  // 1. 检测超负荷 Agent（分配了 >3 个任务的成员）
  const taskCountByMember = new Map<string, number>();
  tasks.forEach(task => {
    if (task.assignee && task.status !== 'completed' && task.status !== 'failed') {
      taskCountByMember.set(task.assignee, (taskCountByMember.get(task.assignee) ?? 0) + 1);
    }
  });

  taskCountByMember.forEach((count, memberId) => {
    if (count > OVERLOAD_THRESHOLD) {
      const member = members.find(m => m.id === memberId);
      bottlenecks.push({
        type: 'agent_overload',
        severity: count > OVERLOAD_THRESHOLD * 2 ? 'critical' : 'warning',
        description: `${member?.name ?? memberId} 负载过高，当前承担 ${count} 个任务`,
        affectedIds: [memberId],
        suggestion: `建议将 ${member?.name ?? memberId} 的部分任务重新分配给空闲成员，以降低工作负载`,
      });
    }
  });

  // 2. 检测被阻塞的任务链
  const blockedTasks = tasks.filter(t => t.status === 'blocked');
  if (blockedTasks.length > 0) {
    // 检查是否存在依赖链阻塞（A -> B -> C，A 未完成导致 B 和 C 都被阻塞）
    const chainBlocked: string[] = [];

    blockedTasks.forEach(task => {
      const hasBlockingDependency = task.dependencies.some(depId => {
        const depTask = tasks.find(t => t.id === depId);
        return depTask && depTask.status !== 'completed';
      });
      if (hasBlockingDependency) {
        chainBlocked.push(task.id);
      }
    });

    if (chainBlocked.length >= 2) {
      bottlenecks.push({
        type: 'dependency_chain',
        severity: chainBlocked.length >= 4 ? 'critical' : 'warning',
        description: `存在 ${chainBlocked.length} 个任务因依赖链被阻塞`,
        affectedIds: chainBlocked,
        suggestion: '建议优先处理依赖链顶端的阻塞任务，以释放下游任务',
      });
    } else if (chainBlocked.length === 1) {
      bottlenecks.push({
        type: 'task_blocked',
        severity: 'info',
        description: `任务 "${blockedTasks.find(t => t.id === chainBlocked[0])?.title}" 被依赖阻塞`,
        affectedIds: chainBlocked,
        suggestion: '检查该任务的依赖项完成状态',
      });
    }
  }

  // 3. 检测长时间未完成的任务（停滞任务）
  const activeTasks = tasks.filter(t =>
    t.status === 'in_progress' && t.createdAt > 0
  );
  activeTasks.forEach(task => {
    const elapsed = now - task.createdAt;
    const estimatedMs = task.estimatedTime * 60 * 1000; // estimatedTime 单位为分钟
    if (estimatedMs <= 0) return; // 跳过没有预估时间的任务
    if (elapsed > estimatedMs * 2 && task.progress < 80) {
      bottlenecks.push({
        type: 'task_blocked',
        severity: 'warning',
        description: `任务 "${task.title}" 已超时但进度仅为 ${Math.round(task.progress)}%`,
        affectedIds: [task.id],
        suggestion: `建议检查任务 "${task.title}" 是否遇到困难，考虑增加资源或调整方案`,
      });
    }
  });

  // 4. 检测资源浪费（空闲率过高）
  const activeMembers = members.filter(m => m.status !== 'offline');
  if (activeMembers.length > 0) {
    const idleMembers = activeMembers.filter(m => m.status === 'idle');
    const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'scheduled');
    if (idleMembers.length > activeMembers.length * 0.6 && pendingTasks.length > 0) {
      bottlenecks.push({
        type: 'resource_waste',
        severity: 'info',
        description: `${idleMembers.length} 个 Agent 空闲，但有 ${pendingTasks.length} 个待处理任务`,
        affectedIds: idleMembers.map(m => m.id),
        suggestion: '存在资源浪费，建议优化任务调度策略以充分利用空闲 Agent',
      });
    }
  }

  // 按严重程度排序
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  bottlenecks.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return bottlenecks;
}

// ============ 资源利用率分析 ============

export function analyzeResourceUtilization(members: Member[]): ResourceUtilization {
  const totalAgents = members.length;
  const busyAgents = members.filter(m => m.status === 'busy').length;
  const idleAgents = members.filter(m => m.status === 'idle').length;
  const offlineAgents = members.filter(m => m.status === 'offline').length;

  const activeAgents = totalAgents - offlineAgents;
  const utilizationRate = activeAgents > 0 ? Math.round((busyAgents / activeAgents) * 100) : 0;

  // 计算每个成员的任务数（通过 currentTask 间接判断）
  // 这里我们使用状态来判断：busy = 有任务，idle = 无任务
  const avgTasksPerAgent = activeAgents > 0
    ? Math.round((busyAgents * 1) / activeAgents * 10) / 10
    : 0;

  // 超负荷成员：busy 状态的成员（简化判断）
  const overloadedAgents = members.filter(m => m.status === 'busy');

  // 利用率低的成员：idle 状态的成员
  const underutilizedAgents = members.filter(m => m.status === 'idle');

  return {
    totalAgents,
    busyAgents,
    idleAgents,
    offlineAgents,
    utilizationRate,
    avgTasksPerAgent,
    overloadedAgents,
    underutilizedAgents,
  };
}

// ============ 任务健康度分析 ============

export function analyzeTaskHealth(tasks: Task[]): TaskHealth {
  const now = Date.now();
  const totalTasks = tasks.length;

  if (totalTasks === 0) {
    return {
      totalTasks: 0,
      healthyTasks: 0,
      atRiskTasks: [],
      stalledTasks: [],
      blockedTasks: [],
      failedTasks: [],
      healthScore: 100,
    };
  }

  const completedTasks = tasks.filter(t => t.status === 'completed');
  const healthyTasks = completedTasks.length;

  const atRiskTasks: Task[] = [];
  const stalledTasks: Task[] = [];
  const blockedTasks: Task[] = [];
  const failedTasks: Task[] = [];

  tasks.forEach(task => {
    if (task.status === 'failed') {
      failedTasks.push(task);
      return;
    }

    if (task.status === 'blocked') {
      blockedTasks.push(task);
      return;
    }

    if (task.status === 'in_progress') {
      const elapsed = now - task.createdAt;
      const estimatedMs = task.estimatedTime * 60 * 1000;

      // 判断是否停滞
      if (elapsed > STALL_THRESHOLD_MS && task.progress < 10) {
        stalledTasks.push(task);
        return;
      }

      // 判断是否有风险（进度与时间不匹配）
      if (estimatedMs > 0) {
        const timeProgress = Math.min(elapsed / estimatedMs, 1);
        const progressRatio = task.progress / 100;
        if (timeProgress > AT_RISK_PROGRESS_RATIO && progressRatio < timeProgress * 0.6) {
          atRiskTasks.push(task);
          return;
        }
      }
    }

    if (task.status === 'pending' || task.status === 'scheduled') {
      // 未分配且已超期的任务
      if (task.deadline && now > task.deadline) {
        atRiskTasks.push(task);
        return;
      }
    }
  });

  // 计算健康分数
  const unhealthyCount = atRiskTasks.length + stalledTasks.length + blockedTasks.length + failedTasks.length;
  const healthScore = totalTasks > 0
    ? Math.round(((totalTasks - unhealthyCount) / totalTasks) * 100)
    : 100;

  return {
    totalTasks,
    healthyTasks,
    atRiskTasks,
    stalledTasks,
    blockedTasks,
    failedTasks,
    healthScore,
  };
}

// ============ 团队协作分析 ============

export function analyzeCollaboration(messages: Message[], members: Member[]): CollaborationMetrics {
  const totalMessages = messages.length;

  if (totalMessages === 0 || members.length === 0) {
    return {
      totalMessages: 0,
      responseRate: 0,
      avgResponseTime: 0,
      mostActiveMembers: [],
      communicationGaps: [],
    };
  }

  // 统计每个成员的消息数
  const messageCountByMember = new Map<string, number>();
  messages.forEach(msg => {
    messageCountByMember.set(msg.from, (messageCountByMember.get(msg.from) ?? 0) + 1);
  });

  // 最活跃成员（按消息数排序）
  const mostActiveMembers = Array.from(messageCountByMember.entries())
    .map(([id, messageCount]) => {
      const member = members.find(m => m.id === id);
      return {
        id,
        name: member?.name ?? id,
        messageCount,
      };
    })
    .sort((a, b) => b.messageCount - a.messageCount)
    .slice(0, 5);

  // 计算回复率和平均响应时间
  const requestMessages = messages.filter(m => m.type === 'request');
  let responseCount = 0;
  const responseTimes: number[] = [];

  requestMessages.forEach(request => {
    // 查找对该请求的回复（从接收方发回给发送方）
    const reply = messages.find(m =>
      m.type === 'response' &&
      m.from === request.to &&
      m.to === request.from &&
      m.timestamp > request.timestamp
    );
    if (reply) {
      responseCount++;
      responseTimes.push(reply.timestamp - request.timestamp);
    }
  });

  const responseRate = requestMessages.length > 0
    ? Math.round((responseCount / requestMessages.length) * 100)
    : 0;

  const avgResponseTime = responseTimes.length > 0
    ? Math.round(responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length)
    : 0;

  // 检测沟通空白（从未互相通信的活跃成员对）
  const activeMemberIds = members
    .filter(m => m.status !== 'offline')
    .map(m => m.id);

  const communicationPairs = new Set<string>();
  messages.forEach(msg => {
    const pair = [msg.from, msg.to].sort().join('-');
    communicationPairs.add(pair);
  });

  const communicationGaps: { member1: string; member2: string; reason: string }[] = [];
  for (let i = 0; i < activeMemberIds.length; i++) {
    for (let j = i + 1; j < activeMemberIds.length; j++) {
      const pair = [activeMemberIds[i], activeMemberIds[j]].sort().join('-');
      if (!communicationPairs.has(pair)) {
        const m1 = members.find(m => m.id === activeMemberIds[i]);
        const m2 = members.find(m => m.id === activeMemberIds[j]);
        communicationGaps.push({
          member1: m1?.name ?? activeMemberIds[i],
          member2: m2?.name ?? activeMemberIds[j],
          reason: '从未互相通信，可能存在协作盲区',
        });
      }
    }
  }

  return {
    totalMessages,
    responseRate,
    avgResponseTime,
    mostActiveMembers,
    communicationGaps,
  };
}

// ============ 趋势预测 ============

export function predictTrends(tasks: Task[], tickHistory: number[]): TrendPrediction {
  const incompleteTasks = tasks.filter(t =>
    t.status !== 'completed' && t.status !== 'failed'
  );

  // 计算历史完成率（每个 tick 完成的任务数）
  let completionRate = 0;
  if (tickHistory.length > 0) {
    const totalCompleted = tickHistory.reduce((sum, count) => sum + count, 0);
    completionRate = totalCompleted / tickHistory.length;
  } else {
    // 如果没有历史数据，使用当前任务数估算
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    if (totalTasks > 0 && completedTasks > 0) {
      completionRate = completedTasks / totalTasks;
    }
  }

  // 预估剩余时间
  const remainingTasks = incompleteTasks.length;
  let estimatedTicksRemaining = 0;
  if (completionRate > 0) {
    estimatedTicksRemaining = Math.ceil(remainingTasks / completionRate);
  } else {
    estimatedTicksRemaining = remainingTasks > 0 ? Infinity : 0;
  }

  // 假设每个 tick 间隔 2 秒（与默认模拟间隔一致）
  const tickIntervalMs = 2000;
  const estimatedCompletionTime = estimatedTicksRemaining === Infinity
    ? 0  // 标记为无法预估
    : Date.now() + estimatedTicksRemaining * tickIntervalMs;

  // 评估风险等级
  let riskLevel: 'low' | 'medium' | 'high';
  const blockedCount = tasks.filter(t => t.status === 'blocked').length;
  const failedCount = tasks.filter(t => t.status === 'failed').length;

  if (remainingTasks === 0) {
    riskLevel = 'low';
  } else if (failedCount > 0 || blockedCount > remainingTasks * 0.3) {
    riskLevel = 'high';
  } else if (blockedCount > 0 || completionRate < 0.3) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'low';
  }

  // 生成自然语言预测
  let prediction: string;
  if (remainingTasks === 0) {
    prediction = '所有任务已完成，系统运行良好';
  } else if (completionRate <= 0) {
    prediction = `还有 ${remainingTasks} 个任务未完成，但尚无完成记录，无法预测完成时间`;
  } else {
    const minutesLeft = Math.round(estimatedTicksRemaining * tickIntervalMs / 60000);
    if (minutesLeft < 1) {
      prediction = `预计在 ${estimatedTicksRemaining} 个周期内完成全部 ${remainingTasks} 个任务`;
    } else {
      prediction = `预计在 ${minutesLeft} 分钟内完成全部 ${remainingTasks} 个任务（每周期完成 ${completionRate.toFixed(1)} 个任务）`;
    }
  }

  return {
    estimatedCompletionTime,
    completionRate: Math.round(completionRate * 100) / 100,
    riskLevel,
    prediction,
  };
}

// ============ 综合分析报告 ============

export function generateFullReport(
  tasks: Task[],
  members: Member[],
  messages: Message[],
  evaluation: Evaluation,
  tickHistory: number[],
): AnalysisReport {
  const bottlenecks = analyzeBottlenecks(tasks, members);
  const resourceUtilization = analyzeResourceUtilization(members);
  const taskHealth = analyzeTaskHealth(tasks);
  const collaboration = analyzeCollaboration(messages, members);
  const trend = predictTrends(tasks, tickHistory);

  // 计算综合健康度评分
  const weights = {
    resource: 0.2,
    taskHealth: 0.3,
    collaboration: 0.15,
    evaluation: 0.2,
    bottleneck: 0.15,
  };

  // 资源分数（利用率在 60-85% 之间最佳）
  const resourceScore = resourceUtilization.totalAgents === 0
    ? 50
    : resourceUtilization.utilizationRate >= 60 && resourceUtilization.utilizationRate <= 85
      ? 100
      : resourceUtilization.utilizationRate > 85
        ? Math.max(0, 100 - (resourceUtilization.utilizationRate - 85) * 4)
        : Math.max(0, resourceUtilization.utilizationRate * 1.5);

  // 瓶颈分数
  const bottleneckPenalty = bottlenecks.reduce((sum, b) => {
    return sum + (b.severity === 'critical' ? 20 : b.severity === 'warning' ? 10 : 3);
  }, 0);
  const bottleneckScore = Math.max(0, 100 - bottleneckPenalty);

  // 协作分数
  const collaborationScore = collaboration.totalMessages === 0
    ? 50
    : Math.min(100, collaboration.responseRate * 0.5 + (collaboration.communicationGaps.length === 0 ? 50 : 20));

  // 评估分数
  const evaluationScore = evaluation.totalScore;

  const overallScore = Math.round(
    resourceScore * weights.resource +
    taskHealth.healthScore * weights.taskHealth +
    collaborationScore * weights.collaboration +
    evaluationScore * weights.evaluation +
    bottleneckScore * weights.bottleneck
  );

  // 生成智能建议
  const recommendations: string[] = [];

  // 基于瓶颈的建议
  bottlenecks.forEach(b => {
    recommendations.push(b.suggestion);
  });

  // 基于资源利用率的建议
  if (resourceUtilization.utilizationRate < 40 && resourceUtilization.totalAgents > 0) {
    recommendations.push('资源利用率较低，建议增加任务量或优化调度策略');
  }
  if (resourceUtilization.utilizationRate > 90) {
    recommendations.push('资源利用率过高，团队可能面临过劳风险，建议适当增加成员');
  }

  // 基于任务健康度的建议
  if (taskHealth.failedTasks.length > 0) {
    recommendations.push(`有 ${taskHealth.failedTasks.length} 个任务已失败，建议分析失败原因并重新规划`);
  }
  if (taskHealth.stalledTasks.length > 0) {
    recommendations.push(`有 ${taskHealth.stalledTasks.length} 个任务停滞不前，建议检查是否需要外部协助`);
  }

  // 基于协作的建议
  if (collaboration.communicationGaps.length > 3) {
    recommendations.push('团队成员间存在较多沟通空白，建议组织跨团队交流活动');
  }
  if (collaboration.responseRate < 50 && collaboration.totalMessages > 0) {
    recommendations.push('消息回复率偏低，建议建立消息响应机制');
  }

  // 基于趋势的建议
  if (trend.riskLevel === 'high') {
    recommendations.push('项目风险较高，建议立即进行风险评审并制定应急预案');
  } else if (trend.riskLevel === 'medium') {
    recommendations.push('项目存在中等风险，建议密切关注关键路径上的任务进展');
  }

  // 去重
  const uniqueRecommendations = [...new Set(recommendations)];

  return {
    timestamp: Date.now(),
    bottlenecks,
    resourceUtilization,
    taskHealth,
    collaboration,
    trend,
    overallScore,
    recommendations: uniqueRecommendations,
  };
}
