import type { Task, Member, Organization } from '../types';
import { MEMBER_STATUS, TASK_STATUS, TASK_PRIORITY } from '../constants';

export interface ScheduleDecision {
  taskId: string;
  memberId: string;
  score: number; // 0-100, higher is better match
  reason: string;
}

export interface SchedulerConfig {
  /** Weight for capability match (0-1) */
  capabilityWeight: number;
  /** Weight for reputation (0-1) */
  reputationWeight: number;
  /** Weight for workload balance (0-1) */
  workloadWeight: number;
  /** Weight for priority urgency (0-1) */
  priorityWeight: number;
  /** Prefer agents with fewer current tasks */
  preferIdleAgents: boolean;
}

export const DEFAULT_SCHEDULER_CONFIG: SchedulerConfig = {
  capabilityWeight: 0.35,
  reputationWeight: 0.20,
  workloadWeight: 0.25,
  priorityWeight: 0.20,
  preferIdleAgents: true,
};

/**
 * Calculate match score between a task and an agent
 * Returns 0-100 score with explanation
 */
export function calculateMatchScore(
  task: Task,
  agent: Member,
  _allMembers: Member[],
  config: SchedulerConfig = DEFAULT_SCHEDULER_CONFIG
): { score: number; reason: string } {
  // 1. Capability match (check if agent capabilities align with task)
  // Use task description keywords to match against agent capabilities
  const taskKeywords = task.title.toLowerCase() + ' ' + task.description.toLowerCase();
  const capabilityMatches = agent.capabilities.filter(cap =>
    taskKeywords.includes(cap.toLowerCase())
  ).length;
  const capabilityScore = agent.capabilities.length > 0
    ? (capabilityMatches / agent.capabilities.length) * 100
    : 50;

  // 2. Reputation score
  const reputationScore = agent.reputation;

  // 3. Workload balance (prefer idle agents)
  const agentWorkload = agent.status === MEMBER_STATUS.BUSY ? 1 : 0;
  const workloadScore = agentWorkload === 0 ? 100 : 20; // Idle agents get high score

  // 4. Priority urgency (higher priority tasks should go to higher reputation agents)
  const priorityMap: Record<string, number> = { [TASK_PRIORITY.P0]: 100, [TASK_PRIORITY.P1]: 75, [TASK_PRIORITY.P2]: 50, [TASK_PRIORITY.P3]: 25 };
  const priorityScore = (priorityMap[task.priority] || 50) * (agent.reputation / 100);

  // Weighted combination
  const totalScore =
    capabilityScore * config.capabilityWeight +
    reputationScore * config.reputationWeight +
    workloadScore * config.workloadWeight +
    priorityScore * config.priorityWeight;

  // Generate reason
  const reasons: string[] = [];
  if (capabilityMatches > 0) reasons.push(`能力匹配 ${capabilityMatches} 项`);
  if (agent.reputation >= 80) reasons.push(`高声誉 ${agent.reputation}`);
  if (agent.status === MEMBER_STATUS.IDLE) reasons.push('当前空闲');
  if (task.priority === TASK_PRIORITY.P0) reasons.push('紧急任务');

  return {
    score: Math.round(Math.min(100, Math.max(0, totalScore))),
    reason: reasons.length > 0 ? reasons.join('，') : '默认分配',
  };
}

/**
 * Find the best agent for a task
 */
export function findBestAgent(
  task: Task,
  organization: Organization,
  config: SchedulerConfig = DEFAULT_SCHEDULER_CONFIG
): ScheduleDecision | null {
  const availableAgents = organization.members.filter(m => m.status === MEMBER_STATUS.IDLE);
  if (availableAgents.length === 0) return null;

  let bestScore = -1;
  let bestDecision: ScheduleDecision | null = null;

  for (const agent of availableAgents) {
    const { score, reason } = calculateMatchScore(task, agent, organization.members, config);
    if (score > bestScore) {
      bestScore = score;
      bestDecision = {
        taskId: task.id,
        memberId: agent.id,
        score,
        reason,
      };
    }
  }

  return bestDecision;
}

/**
 * Schedule all pending tasks to available agents
 * Returns an array of scheduling decisions
 */
export function scheduleAll(
  tasks: Task[],
  organization: Organization,
  config: SchedulerConfig = DEFAULT_SCHEDULER_CONFIG
): ScheduleDecision[] {
  const decisions: ScheduleDecision[] = [];
  const assignedAgentIds = new Set<string>();

  // Sort tasks by priority (P0 first)
  const priorityOrder: Record<string, number> = { [TASK_PRIORITY.P0]: 0, [TASK_PRIORITY.P1]: 1, [TASK_PRIORITY.P2]: 2, [TASK_PRIORITY.P3]: 3 };
  const pendingTasks = tasks
    .filter(t => t.status === TASK_STATUS.PENDING)
    .filter(t => t.dependencies.every(depId =>
      tasks.find(dt => dt.id === depId)?.status === TASK_STATUS.COMPLETED
    ))
    .sort((a, b) => (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4));

  for (const task of pendingTasks) {
    const availableAgents = organization.members.filter(
      m => m.status === MEMBER_STATUS.IDLE && !assignedAgentIds.has(m.id)
    );
    if (availableAgents.length === 0) break;

    let bestScore = -1;
    let bestAgentId = '';
    let bestReason = '';

    for (const agent of availableAgents) {
      const { score, reason } = calculateMatchScore(task, agent, organization.members, config);
      if (score > bestScore) {
        bestScore = score;
        bestAgentId = agent.id;
        bestReason = reason;
      }
    }

    if (bestAgentId) {
      decisions.push({
        taskId: task.id,
        memberId: bestAgentId,
        score: bestScore,
        reason: bestReason,
      });
      assignedAgentIds.add(bestAgentId);
    }
  }

  return decisions;
}
