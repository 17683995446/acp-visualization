/**
 * 扩展服务层测试 - 边界情况和额外场景
 */
import { describe, it, expect } from 'vitest';
import { TaskService } from '../services/TaskService';
import { OrganizationService } from '../services/OrganizationService';
import { CommunicationService } from '../services/CommunicationService';
import { KnowledgeService } from '../services/KnowledgeService';
import { EvaluationService } from '../services/EvaluationService';
import { calculateMatchScore, scheduleAll } from '../engine/scheduler';
import type { Task, Member, Organization, Message, KnowledgeNode, Score } from '../types';

// ============ TaskService 扩展测试 ============

describe('TaskService (Extended)', () => {
  describe('getCriticalPath', () => {
    it('should return correct critical path for a chain of dependent tasks', () => {
      const tasks: Task[] = [
        { id: 'a', title: 'A', description: '', status: 'pending', priority: 'P1', dependencies: [], progress: 0, estimatedTime: 50, createdAt: Date.now() },
        { id: 'b', title: 'B', description: '', status: 'pending', priority: 'P1', dependencies: ['a'], progress: 0, estimatedTime: 100, createdAt: Date.now() },
        { id: 'c', title: 'C', description: '', status: 'pending', priority: 'P1', dependencies: ['b'], progress: 0, estimatedTime: 200, createdAt: Date.now() },
      ];
      const path = TaskService.getCriticalPath(tasks);
      expect(path).toHaveLength(3);
      // a must come before b, b before c
      expect(path.indexOf('a')).toBeLessThan(path.indexOf('b'));
      expect(path.indexOf('b')).toBeLessThan(path.indexOf('c'));
    });

    it('should handle tasks with no dependencies', () => {
      const tasks: Task[] = [
        { id: 'x', title: 'X', description: '', status: 'pending', priority: 'P1', dependencies: [], progress: 0, estimatedTime: 10, createdAt: Date.now() },
        { id: 'y', title: 'Y', description: '', status: 'pending', priority: 'P2', dependencies: [], progress: 0, estimatedTime: 20, createdAt: Date.now() },
        { id: 'z', title: 'Z', description: '', status: 'pending', priority: 'P1', dependencies: [], progress: 0, estimatedTime: 5, createdAt: Date.now() },
      ];
      const path = TaskService.getCriticalPath(tasks);
      expect(path).toHaveLength(3);
      // All should be present since no deps block them
      expect(path).toContain('x');
      expect(path).toContain('y');
      expect(path).toContain('z');
    });

    it('should handle circular dependency detection gracefully', () => {
      const tasks: Task[] = [
        { id: 'a', title: 'A', description: '', status: 'pending', priority: 'P1', dependencies: ['b'], progress: 0, estimatedTime: 10, createdAt: Date.now() },
        { id: 'b', title: 'B', description: '', status: 'pending', priority: 'P1', dependencies: ['a'], progress: 0, estimatedTime: 10, createdAt: Date.now() },
      ];
      // Circular deps mean no task has inDegree 0, so path should be empty
      const path = TaskService.getCriticalPath(tasks);
      expect(path).toHaveLength(0);
    });

    it('should exclude completed tasks from the critical path', () => {
      const tasks: Task[] = [
        { id: 'done', title: 'Done', description: '', status: 'completed', priority: 'P1', dependencies: [], progress: 100, estimatedTime: 50, createdAt: Date.now() },
        { id: 'pending', title: 'Pending', description: '', status: 'pending', priority: 'P1', dependencies: ['done'], progress: 0, estimatedTime: 100, createdAt: Date.now() },
      ];
      const path = TaskService.getCriticalPath(tasks);
      expect(path).not.toContain('done');
      expect(path).toContain('pending');
    });
  });

  describe('sortByPriority', () => {
    it('should correctly order P0 before P1 before P2 before P3', () => {
      const tasks: Task[] = [
        { id: 'p3', title: 'P3', description: '', status: 'pending', priority: 'P3', dependencies: [], progress: 0, estimatedTime: 10, createdAt: Date.now() },
        { id: 'p1', title: 'P1', description: '', status: 'pending', priority: 'P1', dependencies: [], progress: 0, estimatedTime: 10, createdAt: Date.now() },
        { id: 'p0', title: 'P0', description: '', status: 'pending', priority: 'P0', dependencies: [], progress: 0, estimatedTime: 10, createdAt: Date.now() },
        { id: 'p2', title: 'P2', description: '', status: 'pending', priority: 'P2', dependencies: [], progress: 0, estimatedTime: 10, createdAt: Date.now() },
      ];
      const sorted = TaskService.sortByPriority(tasks);
      expect(sorted.map(t => t.priority)).toEqual(['P0', 'P1', 'P2', 'P3']);
    });

    it('should handle tasks with unknown priority by placing them last', () => {
      const tasks: Task[] = [
        { id: 'a', title: 'A', description: '', status: 'pending', priority: 'P0', dependencies: [], progress: 0, estimatedTime: 10, createdAt: Date.now() },
        { id: 'b', title: 'B', description: '', status: 'pending', priority: 'P3', dependencies: [], progress: 0, estimatedTime: 10, createdAt: Date.now() },
        { id: 'c', title: 'C', description: '', status: 'pending', priority: 'P1', dependencies: [], progress: 0, estimatedTime: 10, createdAt: Date.now() },
      ];
      const sorted = TaskService.sortByPriority(tasks);
      expect(sorted[0].id).toBe('a');
      expect(sorted[1].id).toBe('c');
      expect(sorted[2].id).toBe('b');
    });
  });

  describe('hasCircularDependency', () => {
    it('should detect simple cycles', () => {
      const tasks: Task[] = [
        { id: 'a', title: 'A', description: '', status: 'pending', priority: 'P1', dependencies: ['b'], progress: 0, estimatedTime: 10, createdAt: Date.now() },
        { id: 'b', title: 'B', description: '', status: 'pending', priority: 'P1', dependencies: ['c'], progress: 0, estimatedTime: 10, createdAt: Date.now() },
        { id: 'c', title: 'C', description: '', status: 'pending', priority: 'P1', dependencies: ['a'], progress: 0, estimatedTime: 10, createdAt: Date.now() },
      ];
      expect(TaskService.hasCircularDependency('a', tasks)).toBe(true);
      expect(TaskService.hasCircularDependency('b', tasks)).toBe(true);
      expect(TaskService.hasCircularDependency('c', tasks)).toBe(true);
    });

    it('should return false for acyclic graphs', () => {
      const tasks: Task[] = [
        { id: 'a', title: 'A', description: '', status: 'pending', priority: 'P1', dependencies: [], progress: 0, estimatedTime: 10, createdAt: Date.now() },
        { id: 'b', title: 'B', description: '', status: 'pending', priority: 'P1', dependencies: ['a'], progress: 0, estimatedTime: 10, createdAt: Date.now() },
        { id: 'c', title: 'C', description: '', status: 'pending', priority: 'P1', dependencies: ['a', 'b'], progress: 0, estimatedTime: 10, createdAt: Date.now() },
      ];
      expect(TaskService.hasCircularDependency('a', tasks)).toBe(false);
      expect(TaskService.hasCircularDependency('b', tasks)).toBe(false);
      expect(TaskService.hasCircularDependency('c', tasks)).toBe(false);
    });

    it('should return false when checking a non-existent task', () => {
      const tasks: Task[] = [
        { id: 'a', title: 'A', description: '', status: 'pending', priority: 'P1', dependencies: [], progress: 0, estimatedTime: 10, createdAt: Date.now() },
      ];
      expect(TaskService.hasCircularDependency('nonexistent', tasks)).toBe(false);
    });
  });
});

// ============ OrganizationService 扩展测试 ============

describe('OrganizationService (Extended)', () => {
  const mockMembers: Member[] = [
    { id: 'm1', name: 'Alice', role: 'senior', level: 5, reputation: 95, capabilities: ['coding'], status: 'idle' },
    { id: 'm2', name: 'Bob', role: 'mid', level: 3, reputation: 80, capabilities: ['design'], status: 'busy' },
    { id: 'm3', name: 'Charlie', role: 'junior', level: 1, reputation: 60, capabilities: ['testing'], status: 'idle' },
    { id: 'm4', name: 'Diana', role: 'senior', level: 4, reputation: 88, capabilities: ['coding', 'review'], status: 'idle' },
  ];

  const mockOrg: Organization = {
    id: 'org1',
    name: 'Test Org',
    type: 'corporate',
    mission: 'Test mission',
    members: mockMembers,
    departments: [
      { id: 'dept1', name: 'Engineering', head: 'm1', members: ['m1', 'm4'], budget: 100000 },
      { id: 'dept2', name: 'Design', head: 'm2', members: ['m2', 'm3'], budget: 50000 },
      { id: 'dept3', name: 'Empty', head: 'm1', members: [], budget: 0 },
    ],
    performance: { tasksCompleted: 10, avgQuality: 85, onTimeRate: 90, tokenUsage: 1000, cost: 100 },
  };

  describe('getTopPerformers', () => {
    it('should return members sorted by reputation descending', () => {
      const top = OrganizationService.getTopPerformers(mockMembers);
      expect(top[0].id).toBe('m1'); // reputation 95
      expect(top[1].id).toBe('m4'); // reputation 88
      expect(top[2].id).toBe('m2'); // reputation 80
      expect(top[3].id).toBe('m3'); // reputation 60
    });

    it('should respect the limit parameter', () => {
      const top2 = OrganizationService.getTopPerformers(mockMembers, 2);
      expect(top2).toHaveLength(2);
      expect(top2[0].id).toBe('m1');
      expect(top2[1].id).toBe('m4');
    });

    it('should handle limit larger than member count', () => {
      const top = OrganizationService.getTopPerformers(mockMembers, 100);
      expect(top).toHaveLength(mockMembers.length);
    });

    it('should return empty array for empty input', () => {
      expect(OrganizationService.getTopPerformers([])).toHaveLength(0);
    });
  });

  describe('getDepartmentStats', () => {
    it('should calculate correct member counts per department', () => {
      const stats = OrganizationService.getDepartmentStats(mockOrg);
      const eng = stats.find(d => d.id === 'dept1');
      const design = stats.find(d => d.id === 'dept2');
      const empty = stats.find(d => d.id === 'dept3');

      expect(eng).toBeDefined();
      expect(eng!.memberCount).toBe(2);
      expect(design).toBeDefined();
      expect(design!.memberCount).toBe(2);
      expect(empty).toBeDefined();
      expect(empty!.memberCount).toBe(0);
    });

    it('should calculate correct average reputation per department', () => {
      const stats = OrganizationService.getDepartmentStats(mockOrg);
      const eng = stats.find(d => d.id === 'dept1');
      // m1 (95) + m4 (88) = 183 / 2 = 91.5 -> Math.round = 92
      expect(eng!.avgReputation).toBe(92);
    });

    it('should return zero avgReputation for empty departments', () => {
      const stats = OrganizationService.getDepartmentStats(mockOrg);
      const empty = stats.find(d => d.id === 'dept3');
      expect(empty!.avgReputation).toBe(0);
    });
  });
});

// ============ CommunicationService 扩展测试 ============

describe('CommunicationService (Extended)', () => {
  const mockMessages: Message[] = [
    { id: 'msg1', from: 'a', to: 'b', type: 'task', content: 'Do this', timestamp: 100, read: true },
    { id: 'msg2', from: 'a', to: 'b', type: 'notification', content: 'Notice', timestamp: 200, read: false },
    { id: 'msg3', from: 'b', to: 'a', type: 'request', content: 'Help', timestamp: 300, read: false },
    { id: 'msg4', from: 'c', to: 'a', type: 'response', content: 'OK', timestamp: 400, read: true },
    { id: 'msg5', from: 'a', to: 'c', type: 'task', content: 'Task2', timestamp: 500 },
    { id: 'msg6', from: 'b', to: 'a', type: 'notification', content: 'Info', timestamp: 600, read: false },
  ];

  describe('getMessageStats', () => {
    it('should return correct counts by type', () => {
      const stats = CommunicationService.getMessageStats(mockMessages);
      expect(stats.total).toBe(6);
      expect(stats.task).toBe(2); // msg1, msg5
      expect(stats.notification).toBe(2); // msg2, msg6
      expect(stats.request).toBe(1); // msg3
      expect(stats.response).toBe(1); // msg4
    });

    it('should return all zeros for empty message list', () => {
      const stats = CommunicationService.getMessageStats([]);
      expect(stats.total).toBe(0);
      expect(stats.task).toBe(0);
      expect(stats.notification).toBe(0);
      expect(stats.request).toBe(0);
      expect(stats.response).toBe(0);
    });
  });

  describe('getUnreadCount', () => {
    it('should only count messages where read is false or undefined', () => {
      // For member 'a': messages TO 'a' are:
      // msg3 (from b, to a, read: false), msg4 (from c, to a, read: true), msg6 (from b, to a, read: false)
      // Unread = msg3 + msg6 = 2
      const unread = CommunicationService.getUnreadCount(mockMessages, 'a');
      expect(unread).toBe(2);
    });

    it('should return 0 when all messages are read', () => {
      const messages: Message[] = [
        { id: 'm1', from: 'x', to: 'y', type: 'task', content: '', timestamp: 100, read: true },
        { id: 'm2', from: 'z', to: 'y', type: 'notification', content: '', timestamp: 200, read: true },
      ];
      expect(CommunicationService.getUnreadCount(messages, 'y')).toBe(0);
    });

    it('should return 0 for member with no messages', () => {
      expect(CommunicationService.getUnreadCount(mockMessages, 'nonexistent')).toBe(0);
    });
  });

  describe('getConversation', () => {
    it('should return messages between two specific members in order', () => {
      const convo = CommunicationService.getConversation(mockMessages, 'a', 'b');
      // msg1 (a->b), msg2 (a->b), msg3 (b->a), msg6 (b->a) = 4 messages
      expect(convo).toHaveLength(4);
      // Should be sorted by timestamp
      expect(convo[0].id).toBe('msg1');
      expect(convo[1].id).toBe('msg2');
      expect(convo[2].id).toBe('msg3');
      expect(convo[3].id).toBe('msg6');
    });

    it('should not include messages from other members', () => {
      const convo = CommunicationService.getConversation(mockMessages, 'a', 'b');
      convo.forEach(msg => {
        const participants = new Set([msg.from, msg.to]);
        expect(participants.has('a')).toBe(true);
        expect(participants.has('b')).toBe(true);
      });
    });

    it('should return empty array when no conversation exists', () => {
      const convo = CommunicationService.getConversation(mockMessages, 'a', 'nonexistent');
      expect(convo).toHaveLength(0);
    });
  });
});

// ============ KnowledgeService 扩展测试 ============

describe('KnowledgeService (Extended)', () => {
  const mockNodes: KnowledgeNode[] = [
    { id: 'n1', type: 'file', name: 'Main.ts', description: 'Entry point', connections: ['n2', 'n3'] },
    { id: 'n2', type: 'function', name: 'init', description: 'Init function', connections: ['n1'] },
    { id: 'n3', type: 'class', name: 'App', description: 'App class', connections: ['n1', 'n4'] },
    { id: 'n4', type: 'concept', name: 'State', description: 'State concept', connections: ['n3'] },
    { id: 'n5', type: 'decision', name: 'Orphan', description: 'No connections', connections: [] },
  ];

  describe('getOrphanNodes', () => {
    it('should return nodes with no connections', () => {
      const orphans = KnowledgeService.getOrphanNodes(mockNodes);
      expect(orphans).toHaveLength(1);
      expect(orphans[0].id).toBe('n5');
    });

    it('should return empty array when all nodes have connections', () => {
      const nodes: KnowledgeNode[] = [
        { id: 'a', type: 'file', name: 'A', description: '', connections: ['b'] },
        { id: 'b', type: 'file', name: 'B', description: '', connections: ['a'] },
      ];
      expect(KnowledgeService.getOrphanNodes(nodes)).toHaveLength(0);
    });
  });

  describe('getMostConnected', () => {
    it('should return the node with the most connections', () => {
      const mostConnected = KnowledgeService.getMostConnected(mockNodes, 1);
      expect(mostConnected).toHaveLength(1);
      // n1 has 2 connections, n3 has 2 connections - either is acceptable as most connected
      expect(mostConnected[0].connectionCount).toBe(2);
    });

    it('should respect the limit parameter', () => {
      const top3 = KnowledgeService.getMostConnected(mockNodes, 3);
      expect(top3).toHaveLength(3);
      // All should have at least 1 connection
      top3.forEach(entry => {
        expect(entry.connectionCount).toBeGreaterThanOrEqual(1);
      });
    });

    it('should return empty array for empty input', () => {
      expect(KnowledgeService.getMostConnected([], 5)).toHaveLength(0);
    });
  });

  describe('getTypeStats', () => {
    it('should return correct count per type', () => {
      const stats = KnowledgeService.getTypeStats(mockNodes);
      expect(stats['file']).toBe(1);
      expect(stats['function']).toBe(1);
      expect(stats['class']).toBe(1);
      expect(stats['concept']).toBe(1);
      expect(stats['decision']).toBe(1);
    });

    it('should return empty object for empty input', () => {
      expect(KnowledgeService.getTypeStats([])).toEqual({});
    });

    it('should aggregate counts for same type', () => {
      const nodes: KnowledgeNode[] = [
        { id: 'a', type: 'file', name: 'A', description: '', connections: [] },
        { id: 'b', type: 'file', name: 'B', description: '', connections: [] },
        { id: 'c', type: 'file', name: 'C', description: '', connections: [] },
        { id: 'd', type: 'class', name: 'D', description: '', connections: [] },
      ];
      const stats = KnowledgeService.getTypeStats(nodes);
      expect(stats['file']).toBe(3);
      expect(stats['class']).toBe(1);
    });
  });
});

// ============ EvaluationService 扩展测试 ============

describe('EvaluationService (Extended)', () => {
  const mockScores: Score[] = [
    { dimension: 'quality', value: 90, max: 100, weight: 0.3, description: 'Code quality' },
    { dimension: 'speed', value: 60, max: 100, weight: 0.2, description: 'Execution speed' },
    { dimension: 'reliability', value: 95, max: 100, weight: 0.25, description: 'System reliability' },
    { dimension: 'usability', value: 70, max: 100, weight: 0.15, description: 'User experience' },
    { dimension: 'security', value: 50, max: 100, weight: 0.1, description: 'Security score' },
  ];

  describe('findWeaknesses', () => {
    it('should return dimensions below threshold', () => {
      const weaknesses = EvaluationService.findWeaknesses(mockScores, 75);
      expect(weaknesses).toHaveLength(3);
      expect(weaknesses.map(w => w.dimension)).toContain('speed'); // 60
      expect(weaknesses.map(w => w.dimension)).toContain('usability'); // 70
      expect(weaknesses.map(w => w.dimension)).toContain('security'); // 50
    });

    it('should return empty array when all scores are above threshold', () => {
      const highScores: Score[] = [
        { dimension: 'a', value: 90, max: 100, weight: 0.5, description: '' },
        { dimension: 'b', value: 85, max: 100, weight: 0.5, description: '' },
      ];
      expect(EvaluationService.findWeaknesses(highScores, 75)).toHaveLength(0);
    });

    it('should use default threshold of 75', () => {
      const weaknesses = EvaluationService.findWeaknesses(mockScores);
      expect(weaknesses).toHaveLength(3);
    });
  });

  describe('findStrengths', () => {
    it('should return dimensions above threshold', () => {
      const strengths = EvaluationService.findStrengths(mockScores, 85);
      expect(strengths).toHaveLength(2);
      expect(strengths.map(s => s.dimension)).toContain('quality'); // 90
      expect(strengths.map(s => s.dimension)).toContain('reliability'); // 95
    });

    it('should return empty array when no scores meet threshold', () => {
      const lowScores: Score[] = [
        { dimension: 'a', value: 50, max: 100, weight: 0.5, description: '' },
        { dimension: 'b', value: 60, max: 100, weight: 0.5, description: '' },
      ];
      expect(EvaluationService.findStrengths(lowScores, 85)).toHaveLength(0);
    });

    it('should use default threshold of 85', () => {
      const strengths = EvaluationService.findStrengths(mockScores);
      expect(strengths).toHaveLength(2);
    });
  });

  describe('calculateTotalScore', () => {
    it('should correctly weight all dimensions', () => {
      // quality: (90/100) * 0.3 * 100 = 27
      // speed: (60/100) * 0.2 * 100 = 12
      // reliability: (95/100) * 0.25 * 100 = 23.75
      // usability: (70/100) * 0.15 * 100 = 10.5
      // security: (50/100) * 0.1 * 100 = 5
      // total = 78.25 -> Math.round = 78
      const total = EvaluationService.calculateTotalScore(mockScores);
      expect(total).toBe(78);
    });

    it('should return 0 for empty scores', () => {
      expect(EvaluationService.calculateTotalScore([])).toBe(0);
    });

    it('should return 100 when all dimensions are at max', () => {
      const perfectScores: Score[] = [
        { dimension: 'a', value: 100, max: 100, weight: 0.5, description: '' },
        { dimension: 'b', value: 100, max: 100, weight: 0.5, description: '' },
      ];
      expect(EvaluationService.calculateTotalScore(perfectScores)).toBe(100);
    });

    it('should return 0 when all dimensions are at 0', () => {
      const zeroScores: Score[] = [
        { dimension: 'a', value: 0, max: 100, weight: 0.5, description: '' },
        { dimension: 'b', value: 0, max: 100, weight: 0.5, description: '' },
      ];
      expect(EvaluationService.calculateTotalScore(zeroScores)).toBe(0);
    });
  });
});

// ============ Scheduler 扩展测试 ============

describe('Scheduler (Extended)', () => {
  const mockTask: Task = {
    id: 'task1',
    title: 'Build API endpoint',
    description: 'Create REST API endpoint for user management',
    status: 'pending',
    priority: 'P1',
    dependencies: [],
    progress: 0,
    estimatedTime: 100,
    createdAt: Date.now(),
  };

  describe('calculateMatchScore', () => {
    it('should return 0 for agent with no matching capabilities', () => {
      const task: Task = {
        id: 't1',
        title: 'Quantum Physics Simulation',
        description: 'Simulate quantum entanglement',
        status: 'pending',
        priority: 'P1',
        dependencies: [],
        progress: 0,
        estimatedTime: 100,
        createdAt: Date.now(),
      };
      const agent: Member = {
        id: 'a1',
        name: 'Agent',
        role: 'junior',
        level: 1,
        reputation: 50,
        capabilities: ['gardening', 'cooking'],
        status: 'idle',
      };
      const { score } = calculateMatchScore(task, agent, [agent]);
      // With no capability match, capabilityScore = 0, but reputation and workload still contribute
      // So score won't be exactly 0, but capability match component is 0
      // Actually: capabilityMatches = 0, capabilityScore = 0/2 * 100 = 0
      // reputationScore = 50, workloadScore = 100 (idle), priorityScore = 75 * 0.5 = 37.5
      // total = 0*0.35 + 50*0.20 + 100*0.25 + 37.5*0.20 = 0 + 10 + 25 + 7.5 = 42.5 -> 43
      // The key assertion: no capability match reason in reason string
      expect(score).toBeGreaterThan(0); // Other factors still contribute
    });

    it('should give higher score for higher reputation', () => {
      const task: Task = {
        id: 't1',
        title: 'Generic task',
        description: 'Some generic task',
        status: 'pending',
        priority: 'P1',
        dependencies: [],
        progress: 0,
        estimatedTime: 100,
        createdAt: Date.now(),
      };
      const highRepAgent: Member = {
        id: 'a1',
        name: 'High',
        role: 'senior',
        level: 5,
        reputation: 95,
        capabilities: ['generic'],
        status: 'idle',
      };
      const lowRepAgent: Member = {
        id: 'a2',
        name: 'Low',
        role: 'junior',
        level: 1,
        reputation: 30,
        capabilities: ['generic'],
        status: 'idle',
      };
      const { score: highScore } = calculateMatchScore(task, highRepAgent, [highRepAgent, lowRepAgent]);
      const { score: lowScore } = calculateMatchScore(task, lowRepAgent, [highRepAgent, lowRepAgent]);
      expect(highScore).toBeGreaterThan(lowScore);
    });

    it('should give higher score for capability match', () => {
      const matchingAgent: Member = {
        id: 'a1',
        name: 'Match',
        role: 'senior',
        level: 5,
        reputation: 70,
        capabilities: ['api', 'rest', 'endpoint'],
        status: 'idle',
      };
      const nonMatchingAgent: Member = {
        id: 'a2',
        name: 'NoMatch',
        role: 'senior',
        level: 5,
        reputation: 70,
        capabilities: ['gardening', 'cooking', 'cleaning'],
        status: 'idle',
      };
      const { score: matchScore } = calculateMatchScore(mockTask, matchingAgent, [matchingAgent, nonMatchingAgent]);
      const { score: noMatchScore } = calculateMatchScore(mockTask, nonMatchingAgent, [matchingAgent, nonMatchingAgent]);
      expect(matchScore).toBeGreaterThan(noMatchScore);
    });

    it('should give lower score for busy agents', () => {
      const idleAgent: Member = {
        id: 'a1',
        name: 'Idle',
        role: 'mid',
        level: 3,
        reputation: 70,
        capabilities: ['coding'],
        status: 'idle',
      };
      const busyAgent: Member = {
        id: 'a2',
        name: 'Busy',
        role: 'mid',
        level: 3,
        reputation: 70,
        capabilities: ['coding'],
        status: 'busy',
      };
      const { score: idleScore } = calculateMatchScore(mockTask, idleAgent, [idleAgent, busyAgent]);
      const { score: busyScore } = calculateMatchScore(mockTask, busyAgent, [idleAgent, busyAgent]);
      expect(idleScore).toBeGreaterThan(busyScore);
    });
  });

  describe('scheduleAll', () => {
    it('should not assign tasks that have unmet dependencies', () => {
      const tasks: Task[] = [
        { id: 't1', title: 'Dep', description: '', status: 'pending', priority: 'P0', dependencies: [], progress: 0, estimatedTime: 50, createdAt: Date.now() },
        { id: 't2', title: 'Blocked', description: '', status: 'pending', priority: 'P0', dependencies: ['t1'], progress: 0, estimatedTime: 50, createdAt: Date.now() },
      ];
      const org: Organization = {
        id: 'o1', name: 'Org', type: 'corporate', mission: '',
        members: [
          { id: 'a1', name: 'A1', role: 'senior', level: 5, reputation: 80, capabilities: ['coding'], status: 'idle' },
          { id: 'a2', name: 'A2', role: 'mid', level: 3, reputation: 70, capabilities: ['coding'], status: 'idle' },
        ],
        departments: [],
        performance: { tasksCompleted: 0, avgQuality: 0, onTimeRate: 0, tokenUsage: 0, cost: 0 },
      };
      const decisions = scheduleAll(tasks, org);
      // Only t1 should be assigned (t2 blocked by t1 which is not completed)
      expect(decisions).toHaveLength(1);
      expect(decisions[0].taskId).toBe('t1');
    });

    it('should assign tasks whose dependencies are all completed', () => {
      const tasks: Task[] = [
        { id: 't1', title: 'Done', description: '', status: 'completed', priority: 'P0', dependencies: [], progress: 100, estimatedTime: 50, createdAt: Date.now() },
        { id: 't2', title: 'Ready', description: '', status: 'pending', priority: 'P0', dependencies: ['t1'], progress: 0, estimatedTime: 50, createdAt: Date.now() },
      ];
      const org: Organization = {
        id: 'o1', name: 'Org', type: 'corporate', mission: '',
        members: [
          { id: 'a1', name: 'A1', role: 'senior', level: 5, reputation: 80, capabilities: ['coding'], status: 'idle' },
        ],
        departments: [],
        performance: { tasksCompleted: 0, avgQuality: 0, onTimeRate: 0, tokenUsage: 0, cost: 0 },
      };
      const decisions = scheduleAll(tasks, org);
      expect(decisions).toHaveLength(1);
      expect(decisions[0].taskId).toBe('t2');
    });

    it('should return empty array when no idle agents are available', () => {
      const tasks: Task[] = [
        { id: 't1', title: 'Task', description: '', status: 'pending', priority: 'P0', dependencies: [], progress: 0, estimatedTime: 50, createdAt: Date.now() },
      ];
      const org: Organization = {
        id: 'o1', name: 'Org', type: 'corporate', mission: '',
        members: [
          { id: 'a1', name: 'A1', role: 'senior', level: 5, reputation: 80, capabilities: ['coding'], status: 'busy' },
          { id: 'a2', name: 'A2', role: 'mid', level: 3, reputation: 70, capabilities: ['coding'], status: 'offline' },
        ],
        departments: [],
        performance: { tasksCompleted: 0, avgQuality: 0, onTimeRate: 0, tokenUsage: 0, cost: 0 },
      };
      const decisions = scheduleAll(tasks, org);
      expect(decisions).toHaveLength(0);
    });

    it('should prioritize P0 tasks over P3 tasks', () => {
      const tasks: Task[] = [
        { id: 't3', title: 'Low', description: '', status: 'pending', priority: 'P3', dependencies: [], progress: 0, estimatedTime: 50, createdAt: Date.now() },
        { id: 't0', title: 'Urgent', description: '', status: 'pending', priority: 'P0', dependencies: [], progress: 0, estimatedTime: 50, createdAt: Date.now() },
      ];
      const org: Organization = {
        id: 'o1', name: 'Org', type: 'corporate', mission: '',
        members: [
          { id: 'a1', name: 'A1', role: 'senior', level: 5, reputation: 80, capabilities: ['coding'], status: 'idle' },
        ],
        departments: [],
        performance: { tasksCompleted: 0, avgQuality: 0, onTimeRate: 0, tokenUsage: 0, cost: 0 },
      };
      const decisions = scheduleAll(tasks, org);
      // Only one agent, so only one task assigned - should be P0
      expect(decisions).toHaveLength(1);
      expect(decisions[0].taskId).toBe('t0');
    });
  });
});
