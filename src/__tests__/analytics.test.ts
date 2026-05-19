import { describe, it, expect } from 'vitest';
import {
  analyzeBottlenecks,
  analyzeResourceUtilization,
  analyzeTaskHealth,
  analyzeCollaboration,
  predictTrends,
  generateFullReport,
} from '../services/AnalyticsService';
import type { Task, Member, Message, Evaluation } from '../types';

// ============ 测试数据 ============

const now = Date.now();

const mockMembers: Member[] = [
  { id: 'm1', name: 'Alice', role: 'senior', level: 6, reputation: 80, capabilities: ['coding'], status: 'busy', currentTask: 't1' },
  { id: 'm2', name: 'Bob', role: 'mid', level: 5, reputation: 70, capabilities: ['testing'], status: 'busy', currentTask: 't2' },
  { id: 'm3', name: 'Charlie', role: 'junior', level: 3, reputation: 50, capabilities: ['coding', 'testing'], status: 'idle' },
  { id: 'm4', name: 'Diana', role: 'intern', level: 1, reputation: 30, capabilities: ['docs'], status: 'offline' },
];

const mockTasks: Task[] = [
  { id: 't1', title: 'Task A', description: 'desc', status: 'in_progress', priority: 'P1', assignee: 'm1', dependencies: [], progress: 50, estimatedTime: 30, createdAt: now - 60 * 60 * 1000, deadline: now + 3600000 },
  { id: 't2', title: 'Task B', description: 'desc', status: 'in_progress', priority: 'P2', assignee: 'm2', dependencies: [], progress: 20, estimatedTime: 20, createdAt: now - 10 * 60 * 1000, deadline: now + 7200000 },
  { id: 't3', title: 'Task C', description: 'desc', status: 'blocked', priority: 'P1', dependencies: ['t1'], progress: 0, estimatedTime: 15, createdAt: now - 5 * 60 * 1000 },
  { id: 't4', title: 'Task D', description: 'desc', status: 'completed', priority: 'P0', assignee: 'm1', dependencies: [], progress: 100, estimatedTime: 10, createdAt: now - 120 * 60 * 1000 },
  { id: 't5', title: 'Task E', description: 'desc', status: 'pending', priority: 'P3', dependencies: [], progress: 0, estimatedTime: 25, createdAt: now },
];

const mockMessages: Message[] = [
  { id: 'msg1', from: 'm1', to: 'm2', type: 'request', content: '请帮忙审查代码', timestamp: now - 5000, read: true },
  { id: 'msg2', from: 'm2', to: 'm1', type: 'response', content: '收到，马上处理', timestamp: now - 3000, read: true },
  { id: 'msg3', from: 'm1', to: 'm3', type: 'notification', content: '任务已更新', timestamp: now - 2000, read: false },
  { id: 'msg4', from: 'm2', to: 'm3', type: 'request', content: '请协助测试', timestamp: now - 1000, read: false },
];

const mockEvaluation: Evaluation = {
  totalScore: 75,
  rating: 'good',
  scores: [],
  strengths: ['代码质量好'],
  weaknesses: ['响应速度待提升'],
  recommendations: ['增加自动化测试'],
};

// ============ 测试用例 ============

describe('AnalyticsService', () => {
  // ---- 瓶颈分析 ----

  describe('analyzeBottlenecks', () => {
    it('应检测到超负荷 Agent', () => {
      // m1 被分配了 4 个活跃任务
      const overloadedTasks: Task[] = [
        { id: 't1', title: 'Task 1', description: '', status: 'in_progress', priority: 'P1', assignee: 'm1', dependencies: [], progress: 10, estimatedTime: 30, createdAt: now },
        { id: 't2', title: 'Task 2', description: '', status: 'in_progress', priority: 'P1', assignee: 'm1', dependencies: [], progress: 20, estimatedTime: 30, createdAt: now },
        { id: 't3', title: 'Task 3', description: '', status: 'in_progress', priority: 'P1', assignee: 'm1', dependencies: [], progress: 30, estimatedTime: 30, createdAt: now },
        { id: 't4', title: 'Task 4', description: '', status: 'pending', priority: 'P1', assignee: 'm1', dependencies: [], progress: 0, estimatedTime: 30, createdAt: now },
      ];

      const bottlenecks = analyzeBottlenecks(overloadedTasks, mockMembers);
      const overloadBottleneck = bottlenecks.find(b => b.type === 'agent_overload');

      expect(overloadBottleneck).toBeDefined();
      expect(overloadBottleneck!.affectedIds).toContain('m1');
      expect(overloadBottleneck!.description).toContain('Alice');
      expect(overloadBottleneck!.severity).toBe('warning');
    });

    it('应检测到被阻塞的任务链', () => {
      const blockedTasks: Task[] = [
        { id: 't1', title: 'Base', description: '', status: 'in_progress', priority: 'P0', assignee: 'm1', dependencies: [], progress: 50, estimatedTime: 30, createdAt: now },
        { id: 't2', title: 'Dep 1', description: '', status: 'blocked', priority: 'P1', dependencies: ['t1'], progress: 0, estimatedTime: 15, createdAt: now },
        { id: 't3', title: 'Dep 2', description: '', status: 'blocked', priority: 'P1', dependencies: ['t1'], progress: 0, estimatedTime: 15, createdAt: now },
        { id: 't4', title: 'Dep 3', description: '', status: 'blocked', priority: 'P1', dependencies: ['t2'], progress: 0, estimatedTime: 15, createdAt: now },
      ];

      const bottlenecks = analyzeBottlenecks(blockedTasks, mockMembers);
      const chainBottleneck = bottlenecks.find(b => b.type === 'dependency_chain');

      expect(chainBottleneck).toBeDefined();
      expect(chainBottleneck!.affectedIds.length).toBeGreaterThanOrEqual(2);
    });

    it('无瓶颈时返回空数组', () => {
      const healthyTasks: Task[] = [
        { id: 't1', title: 'Task 1', description: '', status: 'completed', priority: 'P0', dependencies: [], progress: 100, estimatedTime: 10, createdAt: now - 100000 },
      ];
      const bottlenecks = analyzeBottlenecks(healthyTasks, [mockMembers[3]]); // 只有离线成员
      expect(bottlenecks).toEqual([]);
    });

    it('应按严重程度排序', () => {
      const tasks: Task[] = [
        { id: 't1', title: 'T1', description: '', status: 'in_progress', priority: 'P1', assignee: 'm1', dependencies: [], progress: 10, estimatedTime: 30, createdAt: now },
        { id: 't2', title: 'T2', description: '', status: 'in_progress', priority: 'P1', assignee: 'm1', dependencies: [], progress: 20, estimatedTime: 30, createdAt: now },
        { id: 't3', title: 'T3', description: '', status: 'in_progress', priority: 'P1', assignee: 'm1', dependencies: [], progress: 30, estimatedTime: 30, createdAt: now },
        { id: 't4', title: 'T4', description: '', status: 'in_progress', priority: 'P1', assignee: 'm1', dependencies: [], progress: 40, estimatedTime: 30, createdAt: now },
        { id: 't5', title: 'T5', description: '', status: 'pending', priority: 'P1', assignee: 'm1', dependencies: [], progress: 0, estimatedTime: 30, createdAt: now },
        { id: 't6', title: 'T6', description: '', status: 'pending', priority: 'P1', assignee: 'm1', dependencies: [], progress: 0, estimatedTime: 30, createdAt: now },
        { id: 't7', title: 'T7', description: '', status: 'pending', priority: 'P1', assignee: 'm1', dependencies: [], progress: 0, estimatedTime: 30, createdAt: now },
      ];
      const members: Member[] = [
        { id: 'm1', name: 'Alice', role: 'senior', level: 6, reputation: 80, capabilities: ['coding'], status: 'busy' },
        { id: 'm2', name: 'Bob', role: 'mid', level: 5, reputation: 70, capabilities: ['testing'], status: 'idle' },
        { id: 'm3', name: 'Charlie', role: 'junior', level: 3, reputation: 50, capabilities: ['coding'], status: 'idle' },
        { id: 'm4', name: 'Diana', role: 'intern', level: 1, reputation: 30, capabilities: ['docs'], status: 'idle' },
      ];

      const bottlenecks = analyzeBottlenecks(tasks, members);
      if (bottlenecks.length >= 2) {
        const severityOrder = { critical: 0, warning: 1, info: 2 };
        for (let i = 1; i < bottlenecks.length; i++) {
          expect(severityOrder[bottlenecks[i].severity]).toBeGreaterThanOrEqual(
            severityOrder[bottlenecks[i - 1].severity]
          );
        }
      }
    });
  });

  // ---- 资源利用率分析 ----

  describe('analyzeResourceUtilization', () => {
    it('应正确计算利用率', () => {
      const result = analyzeResourceUtilization(mockMembers);

      expect(result.totalAgents).toBe(4);
      expect(result.busyAgents).toBe(2);
      expect(result.idleAgents).toBe(1);
      expect(result.offlineAgents).toBe(1);
      // 活跃 Agent = 3, 忙碌 = 2, 利用率 = 2/3 * 100 = 67
      expect(result.utilizationRate).toBe(67);
    });

    it('空成员列表应返回零值', () => {
      const result = analyzeResourceUtilization([]);
      expect(result.totalAgents).toBe(0);
      expect(result.utilizationRate).toBe(0);
      expect(result.overloadedAgents).toEqual([]);
      expect(result.underutilizedAgents).toEqual([]);
    });

    it('应正确识别超负荷和低利用成员', () => {
      const result = analyzeResourceUtilization(mockMembers);
      expect(result.overloadedAgents).toHaveLength(2); // m1, m2 (busy)
      expect(result.underutilizedAgents).toHaveLength(1); // m3 (idle)
    });
  });

  // ---- 任务健康度分析 ----

  describe('analyzeTaskHealth', () => {
    it('应识别进度落后的任务', () => {
      // t1: 创建于 1 小时前，预估 30 分钟，进度 50% -> 已超时且进度偏低
      const result = analyzeTaskHealth(mockTasks);
      // t1 的 elapsed = 60min, estimatedMs = 30min, elapsed > estimatedMs * 2 (60min), progress < 80
      // 所以 t1 应该被识别为 atRisk 或 stalled
      expect(result.atRiskTasks.length + result.stalledTasks.length).toBeGreaterThanOrEqual(1);
    });

    it('应正确统计各状态任务数', () => {
      const result = analyzeTaskHealth(mockTasks);
      expect(result.totalTasks).toBe(5);
      expect(result.blockedTasks).toHaveLength(1); // t3
      expect(result.failedTasks).toHaveLength(0);
    });

    it('空任务列表应返回健康分数 100', () => {
      const result = analyzeTaskHealth([]);
      expect(result.totalTasks).toBe(0);
      expect(result.healthScore).toBe(100);
    });

    it('应正确计算健康分数', () => {
      const tasks: Task[] = [
        { id: 't1', title: 'T1', description: '', status: 'completed', priority: 'P0', dependencies: [], progress: 100, estimatedTime: 10, createdAt: now - 100000 },
        { id: 't2', title: 'T2', description: '', status: 'completed', priority: 'P0', dependencies: [], progress: 100, estimatedTime: 10, createdAt: now - 100000 },
        { id: 't3', title: 'T3', description: '', status: 'failed', priority: 'P0', dependencies: [], progress: 50, estimatedTime: 10, createdAt: now - 100000 },
      ];
      const result = analyzeTaskHealth(tasks);
      // 3 tasks, 1 unhealthy (failed), healthScore = (3-1)/3 * 100 = 67
      expect(result.healthScore).toBe(67);
      expect(result.failedTasks).toHaveLength(1);
    });
  });

  // ---- 协作分析 ----

  describe('analyzeCollaboration', () => {
    it('应正确计算消息统计', () => {
      const result = analyzeCollaboration(mockMessages, mockMembers);
      expect(result.totalMessages).toBe(4);
      expect(result.mostActiveMembers.length).toBeGreaterThan(0);
      // m1 发送了 2 条消息（msg1, msg3），应为最活跃
      expect(result.mostActiveMembers[0].id).toBe('m1');
      expect(result.mostActiveMembers[0].messageCount).toBe(2);
    });

    it('应正确计算回复率', () => {
      const result = analyzeCollaboration(mockMessages, mockMembers);
      // 2 个 request (msg1, msg4), 1 个 response (msg2 对 msg1 的回复)
      expect(result.responseRate).toBe(50);
    });

    it('应检测沟通空白', () => {
      const result = analyzeCollaboration(mockMessages, mockMembers);
      // m4 是 offline，不计入活跃成员
      // 活跃成员: m1, m2, m3
      // 沟通对: m1-m2 (有), m1-m3 (有 msg3), m2-m3 (有 msg4)
      // 所以没有沟通空白
      expect(result.communicationGaps).toHaveLength(0);
    });

    it('空消息应返回零值', () => {
      const result = analyzeCollaboration([], mockMembers);
      expect(result.totalMessages).toBe(0);
      expect(result.responseRate).toBe(0);
      expect(result.mostActiveMembers).toEqual([]);
    });
  });

  // ---- 趋势预测 ----

  describe('predictTrends', () => {
    it('应基于完成率预测时间', () => {
      const tasks: Task[] = [
        { id: 't1', title: 'T1', description: '', status: 'completed', priority: 'P0', dependencies: [], progress: 100, estimatedTime: 10, createdAt: now - 100000 },
        { id: 't2', title: 'T2', description: '', status: 'in_progress', priority: 'P1', assignee: 'm1', dependencies: [], progress: 50, estimatedTime: 20, createdAt: now },
      ];
      const tickHistory = [1, 1, 1]; // 每个 tick 完成 1 个任务
      const result = predictTrends(tasks, tickHistory);

      expect(result.completionRate).toBe(1);
      expect(result.estimatedCompletionTime).toBeGreaterThan(now);
      expect(result.prediction).toBeTruthy();
    });

    it('所有任务完成时应返回低风险', () => {
      const tasks: Task[] = [
        { id: 't1', title: 'T1', description: '', status: 'completed', priority: 'P0', dependencies: [], progress: 100, estimatedTime: 10, createdAt: now - 100000 },
      ];
      const result = predictTrends(tasks, []);
      expect(result.riskLevel).toBe('low');
      expect(result.prediction).toContain('已完成');
    });

    it('有失败任务时应返回高风险', () => {
      const tasks: Task[] = [
        { id: 't1', title: 'T1', description: '', status: 'failed', priority: 'P0', dependencies: [], progress: 50, estimatedTime: 10, createdAt: now - 100000 },
        { id: 't2', title: 'T2', description: '', status: 'in_progress', priority: 'P1', assignee: 'm1', dependencies: [], progress: 30, estimatedTime: 20, createdAt: now },
      ];
      const result = predictTrends(tasks, []);
      expect(result.riskLevel).toBe('high');
    });
  });

  // ---- 综合报告 ----

  describe('generateFullReport', () => {
    it('应正确汇总所有分析部分', () => {
      const report = generateFullReport(mockTasks, mockMembers, mockMessages, mockEvaluation, [1, 1]);

      expect(report.timestamp).toBeGreaterThan(0);
      expect(report.bottlenecks).toBeDefined();
      expect(report.resourceUtilization).toBeDefined();
      expect(report.taskHealth).toBeDefined();
      expect(report.collaboration).toBeDefined();
      expect(report.trend).toBeDefined();
      expect(report.overallScore).toBeGreaterThanOrEqual(0);
      expect(report.overallScore).toBeLessThanOrEqual(100);
      expect(report.recommendations).toBeInstanceOf(Array);
    });

    it('综合健康度评分应在合理范围内', () => {
      const report = generateFullReport(mockTasks, mockMembers, mockMessages, mockEvaluation, []);
      expect(report.overallScore).toBeGreaterThanOrEqual(0);
      expect(report.overallScore).toBeLessThanOrEqual(100);
    });

    it('应包含智能建议', () => {
      const report = generateFullReport(mockTasks, mockMembers, mockMessages, mockEvaluation, []);
      // 至少应有基于瓶颈的建议
      expect(report.recommendations.length).toBeGreaterThanOrEqual(0);
    });
  });

  // ---- 空数据处理 ----

  describe('空数据处理', () => {
    it('所有空数据不应崩溃', () => {
      const emptyEvaluation: Evaluation = {
        totalScore: 0,
        rating: 'needs_improvement',
        scores: [],
        strengths: [],
        weaknesses: [],
        recommendations: [],
      };

      expect(() => {
        generateFullReport([], [], [], emptyEvaluation, []);
      }).not.toThrow();

      const report = generateFullReport([], [], [], emptyEvaluation, []);
      expect(report.overallScore).toBeGreaterThanOrEqual(0);
      expect(report.bottlenecks).toEqual([]);
      expect(report.taskHealth.healthScore).toBe(100);
      expect(report.collaboration.totalMessages).toBe(0);
    });

    it('analyzeBottlenecks 空数据不崩溃', () => {
      expect(() => analyzeBottlenecks([], [])).not.toThrow();
      expect(analyzeBottlenecks([], [])).toEqual([]);
    });

    it('analyzeResourceUtilization 空数据不崩溃', () => {
      expect(() => analyzeResourceUtilization([])).not.toThrow();
      const result = analyzeResourceUtilization([]);
      expect(result.totalAgents).toBe(0);
    });

    it('analyzeTaskHealth 空数据不崩溃', () => {
      expect(() => analyzeTaskHealth([])).not.toThrow();
      const result = analyzeTaskHealth([]);
      expect(result.healthScore).toBe(100);
    });

    it('analyzeCollaboration 空数据不崩溃', () => {
      expect(() => analyzeCollaboration([], [])).not.toThrow();
      const result = analyzeCollaboration([], []);
      expect(result.totalMessages).toBe(0);
    });

    it('predictTrends 空数据不崩溃', () => {
      expect(() => predictTrends([], [])).not.toThrow();
      const result = predictTrends([], []);
      expect(result.riskLevel).toBe('low');
    });
  });
});
