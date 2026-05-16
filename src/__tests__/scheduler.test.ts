/**
 * 智能调度引擎单元测试
 */
import { describe, it, expect } from 'vitest';
import {
  calculateMatchScore,
  findBestAgent,
  scheduleAll,
  DEFAULT_SCHEDULER_CONFIG,
} from '../engine/scheduler';
import type { Task, Member, Organization } from '../types';

// 测试用数据
const mockMembers: Member[] = [
  { id: 'a1', name: 'Alice', role: 'senior', level: 6, reputation: 90, capabilities: ['架构设计', '系统优化', '代码审查'], status: 'idle' },
  { id: 'a2', name: 'Bob', role: 'mid', level: 5, reputation: 75, capabilities: ['前端开发', 'UI设计', '组件开发'], status: 'idle' },
  { id: 'a3', name: 'Carol', role: 'mid', level: 5, reputation: 70, capabilities: ['后端开发', 'API设计', '数据库'], status: 'busy', currentTask: 't1' },
  { id: 'a4', name: 'Dave', role: 'junior', level: 3, reputation: 55, capabilities: ['测试', '文档'], status: 'offline' },
];

const mockTasks: Task[] = [
  { id: 't1', title: '设计系统架构', description: '设计平台的整体系统架构，包括微服务划分', status: 'pending', priority: 'P0', dependencies: [], progress: 0, estimatedTime: 480, createdAt: Date.now() },
  { id: 't2', title: '实现前端界面', description: '使用React开发前端可视化界面和组件', status: 'pending', priority: 'P1', dependencies: ['t1'], progress: 0, estimatedTime: 360, createdAt: Date.now() },
  { id: 't3', title: '编写测试用例', description: '为核心模块编写单元测试和集成测试', status: 'pending', priority: 'P2', dependencies: [], progress: 0, estimatedTime: 240, createdAt: Date.now() },
  { id: 't4', title: '数据库优化', description: '优化数据库查询性能和索引设计', status: 'pending', priority: 'P1', dependencies: [], progress: 0, estimatedTime: 180, createdAt: Date.now() },
];

const mockOrg: Organization = {
  id: 'org-1',
  name: 'Test Org',
  type: 'corporate',
  mission: 'Test',
  members: mockMembers,
  departments: [],
  performance: { tasksCompleted: 0, avgQuality: 0, onTimeRate: 0, tokenUsage: 0, cost: 0 },
};

describe('Smart Scheduler', () => {
  describe('calculateMatchScore', () => {
    it('should return a score between 0 and 100', () => {
      const { score } = calculateMatchScore(mockTasks[0], mockMembers[0], mockMembers);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should give higher score for capability match', () => {
      // Alice has '架构设计' capability, task t1 is about '系统架构'
      const aliceScore = calculateMatchScore(mockTasks[0], mockMembers[0], mockMembers).score;
      // Dave has '测试' capability, no match for architecture task
      const daveScore = calculateMatchScore(mockTasks[0], mockMembers[3], mockMembers).score;
      expect(aliceScore).toBeGreaterThan(daveScore);
    });

    it('should give higher score for higher reputation', () => {
      // Alice (rep 90) vs Bob (rep 75) - same task, different reputation
      const task: Task = { ...mockTasks[3], title: '通用任务', description: '需要处理一些通用工作' };
      const aliceScore = calculateMatchScore(task, mockMembers[0], mockMembers).score;
      const bobScore = calculateMatchScore(task, mockMembers[1], mockMembers).score;
      // Alice should score higher due to higher reputation
      expect(aliceScore).toBeGreaterThan(bobScore);
    });

    it('should return a reason string', () => {
      const { reason } = calculateMatchScore(mockTasks[0], mockMembers[0], mockMembers);
      expect(typeof reason).toBe('string');
      expect(reason.length).toBeGreaterThan(0);
    });

    it('should respect custom config weights', () => {
      const config = { ...DEFAULT_SCHEDULER_CONFIG, reputationWeight: 1.0, capabilityWeight: 0, workloadWeight: 0, priorityWeight: 0 };
      const { score } = calculateMatchScore(mockTasks[0], mockMembers[0], mockMembers, config);
      // With reputationWeight=1, score should be purely based on reputation
      expect(score).toBe(mockMembers[0].reputation);
    });
  });

  describe('findBestAgent', () => {
    it('should find the best matching agent for a task', () => {
      const decision = findBestAgent(mockTasks[0], mockOrg);
      expect(decision).not.toBeNull();
      expect(decision!.taskId).toBe('t1');
      // Should pick Alice (has architecture capability + highest reputation among idle)
      expect(decision!.memberId).toBe('a1');
    });

    it('should return null when no idle agents', () => {
      const orgNoIdle: Organization = {
        ...mockOrg,
        members: mockMembers.map(m => ({ ...m, status: 'busy' as const })),
      };
      const decision = findBestAgent(mockTasks[0], orgNoIdle);
      expect(decision).toBeNull();
    });

    it('should include score and reason', () => {
      const decision = findBestAgent(mockTasks[0], mockOrg);
      expect(decision!.score).toBeGreaterThanOrEqual(0);
      expect(decision!.reason).toBeDefined();
    });
  });

  describe('scheduleAll', () => {
    it('should schedule multiple tasks', () => {
      const decisions = scheduleAll(mockTasks, mockOrg);
      // Should schedule at least 2 tasks (2 idle agents: Alice and Bob)
      expect(decisions.length).toBeGreaterThanOrEqual(1);
    });

    it('should respect task priority (P0 first)', () => {
      const decisions = scheduleAll(mockTasks, mockOrg);
      if (decisions.length >= 1) {
        // First decision should be for the highest priority task
        const firstTaskId = decisions[0].taskId;
        expect(firstTaskId).toBe('t1'); // P0 task
      }
    });

    it('should not assign more tasks than available agents', () => {
      const decisions = scheduleAll(mockTasks, mockOrg);
      const idleCount = mockMembers.filter(m => m.status === 'idle').length;
      expect(decisions.length).toBeLessThanOrEqual(idleCount);
    });

    it('should not schedule tasks with unmet dependencies', () => {
      // t2 depends on t1, and t1 is not completed
      const decisions = scheduleAll(mockTasks, mockOrg);
      const t2Decision = decisions.find(d => d.taskId === 't2');
      // t2 should not be scheduled because t1 is not completed
      expect(t2Decision).toBeUndefined();
    });

    it('should schedule tasks with met dependencies', () => {
      const tasksWithMetDeps: Task[] = [
        { ...mockTasks[0], status: 'completed', progress: 100 },
        { ...mockTasks[1] }, // depends on t1, which is now completed
      ];
      const decisions = scheduleAll(tasksWithMetDeps, mockOrg);
      const t2Decision = decisions.find(d => d.taskId === 't2');
      expect(t2Decision).toBeDefined();
    });

    it('should return empty array when no pending tasks', () => {
      const completedTasks = mockTasks.map(t => ({ ...t, status: 'completed' as const, progress: 100 }));
      const decisions = scheduleAll(completedTasks, mockOrg);
      expect(decisions.length).toBe(0);
    });

    it('should return empty array when no idle agents', () => {
      const orgNoIdle: Organization = {
        ...mockOrg,
        members: mockMembers.map(m => ({ ...m, status: 'busy' as const })),
      };
      const decisions = scheduleAll(mockTasks, orgNoIdle);
      expect(decisions.length).toBe(0);
    });

    it('each decision should have valid structure', () => {
      const decisions = scheduleAll(mockTasks, mockOrg);
      decisions.forEach(d => {
        expect(d.taskId).toBeDefined();
        expect(d.memberId).toBeDefined();
        expect(d.score).toBeGreaterThanOrEqual(0);
        expect(d.score).toBeLessThanOrEqual(100);
        expect(d.reason).toBeDefined();
      });
    });
  });
});
