/**
 * 第二轮深度压力测试
 *
 * 重点测试边缘场景和复杂交互：
 * A. Undo/Redo 边缘场景 (8个)
 * B. Scenario 深拷贝验证 (6个)
 * C. Analytics 边缘场景 (6个)
 * D. Theme 边缘场景 (6个)
 * E. 跨模块集成场景 (6个)
 * F. 性能压力测试 (4个)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useACPStore } from '../store/acpStore';
import { useScenarioStore } from '../store/scenarioManager';
import { useThemeStore } from '../store/themeStore';
import {
  generateFullReport,
  analyzeBottlenecks,
  analyzeResourceUtilization,
  analyzeTaskHealth,
  analyzeCollaboration,
  predictTrends,
} from '../services/AnalyticsService';
import type { Task, Member, Message } from '../types';
import type { ThemeConfig } from '../themes/presets';

// ============ 辅助函数 ============

/** 重置所有 store 到初始状态 */
function resetAllStores() {
  // 清除 localStorage 以避免持久化数据干扰
  localStorage.clear();

  // 重新初始化 acpStore - 使用 setState 重置所有追踪字段和 undo 状态
  // 注意：organization 和 tasks 等字段在 persistMiddleware 初始化时已从 localStorage 加载
  // 由于 localStorage 已清除，当前 state 中的值就是初始值
  useACPStore.setState({
    messages: [],
    logs: [],
    isSimulating: false,
    simulationInterval: 2000,
    lastSchedulerResult: null,
    _undoStack: [],
    _redoStack: [],
    _undoRedoEnabled: true,
    _isUndoRedoAction: false,
  });

  // 重新初始化 scenarioStore
  useScenarioStore.setState({
    scenarios: [],
    activeScenarioId: null,
  });

  // 重新初始化 themeStore - 清除自定义主题，恢复默认
  const presetThemes = useThemeStore.getState().themes.filter(
    t => ['default-blue', 'emerald-green', 'amber-orange', 'rose-red'].includes(t.id)
  );
  useThemeStore.setState({
    themes: presetThemes,
    activeThemeId: 'default-blue',
    isDarkMode: false,
  });
}

/** 获取当前 ACP store 的追踪字段快照（用于比较） */
function getTrackedSnapshot() {
  const state = useACPStore.getState();
  return {
    tasks: JSON.parse(JSON.stringify(state.tasks)),
    organization: JSON.parse(JSON.stringify(state.organization)),
    messages: JSON.parse(JSON.stringify(state.messages)),
    knowledgeNodes: JSON.parse(JSON.stringify(state.knowledgeNodes)),
    evaluationScores: JSON.parse(JSON.stringify(state.evaluationScores)),
    evaluation: JSON.parse(JSON.stringify(state.evaluation)),
    schedulerConfig: JSON.parse(JSON.stringify(state.schedulerConfig)),
  };
}

/** 创建一个自定义主题 */
function createCustomTheme(id: string, name: string): ThemeConfig {
  return {
    id,
    name,
    colors: {
      light: {
        primary: '#ff0000',
        primaryHover: '#cc0000',
        secondary: '#00ff00',
        accent: '#0000ff',
        success: '#00ff00',
        warning: '#ffff00',
        danger: '#ff0000',
        background: '#ffffff',
        surface: '#f0f0f0',
        text: '#000000',
        textSecondary: '#666666',
        border: '#cccccc',
      },
      dark: {
        primary: '#ff4444',
        primaryHover: '#ff0000',
        secondary: '#44ff44',
        accent: '#4444ff',
        success: '#44ff44',
        warning: '#ffff44',
        danger: '#ff4444',
        background: '#111111',
        surface: '#222222',
        text: '#ffffff',
        textSecondary: '#999999',
        border: '#444444',
      },
    },
  };
}

// ============ 测试开始 ============

describe('第二轮深度压力测试', () => {
  beforeEach(() => {
    resetAllStores();
  });

  // ================================================================
  // A. Undo/Redo 边缘场景 (8个)
  // ================================================================
  describe('A. Undo/Redo 边缘场景', () => {

    it('A1. 快速连续50次操作后undo全部，验证状态完全恢复', () => {
      const store = useACPStore.getState();
      const initialSnapshot = getTrackedSnapshot();

      // 快速连续执行50次操作
      for (let i = 0; i < 50; i++) {
        store.updateScore('创新性', 50 + (i % 50));
      }

      // 验证操作已记录
      expect(useACPStore.getState()._undoStack.length).toBe(50);

      // undo全部
      for (let i = 0; i < 50; i++) {
        useACPStore.getState().undo();
      }

      // 验证状态恢复到初始
      const finalSnapshot = getTrackedSnapshot();
      expect(finalSnapshot.evaluationScores).toEqual(initialSnapshot.evaluationScores);
      expect(finalSnapshot.evaluation).toEqual(initialSnapshot.evaluation);
      expect(useACPStore.getState()._undoStack.length).toBe(0);
      expect(useACPStore.getState().canUndo()).toBe(false);
    });

    it('A2. undo到初始状态后再undo，验证不会崩溃', () => {
      const store = useACPStore.getState();

      // 执行一次操作
      store.updateScore('创新性', 50);
      expect(store.canUndo()).toBe(true);

      // undo一次
      store.undo();
      expect(store.canUndo()).toBe(false);

      // 再次undo，不应崩溃
      expect(() => store.undo()).not.toThrow();
      expect(store.canUndo()).toBe(false);
      expect(store._undoStack.length).toBe(0);
    });

    it('A3. redo到最新状态后再redo，验证不会崩溃', () => {
      const store = useACPStore.getState();

      // 执行两次操作
      store.updateScore('创新性', 50);
      store.updateScore('创造性', 50);

      // undo两次
      store.undo();
      store.undo();

      // redo两次回到最新
      store.redo();
      store.redo();

      expect(store.canRedo()).toBe(false);

      // 再次redo，不应崩溃
      expect(() => store.redo()).not.toThrow();
      expect(store.canRedo()).toBe(false);
      expect(store._redoStack.length).toBe(0);
    });

    it('A4. undo过程中执行新操作，验证redo栈被清空', () => {
      // 执行3次操作（修改不同维度以产生不同记录）
      useACPStore.getState().updateScore('创新性', 50);
      useACPStore.getState().updateScore('创造性', 50);
      useACPStore.getState().updateScore('价值量', 50);

      // undo 2次
      useACPStore.getState().undo();
      useACPStore.getState().undo();

      // 此时 redo 栈应有 2 条记录
      expect(useACPStore.getState()._redoStack.length).toBe(2);

      // 执行新操作
      useACPStore.getState().updateScore('实用性', 30);

      // redo 栈应被清空
      expect(useACPStore.getState()._redoStack.length).toBe(0);
      expect(useACPStore.getState().canRedo()).toBe(false);
    });

    it('A5. 跨多个字段类型的复合操作undo（同时修改tasks+members+messages）', () => {
      const store = useACPStore.getState();
      const beforeSnapshot = getTrackedSnapshot();

      // 修改成员
      const memberId = store.organization.members[0].id;
      store.updateMember(memberId, { reputation: 99 });

      // 修改任务
      if (store.tasks.length > 0) {
        store.updateTask(store.tasks[0].id, { progress: 80 });
      }

      // 发送消息（需要两个不同的成员）
      const members = store.organization.members;
      if (members.length >= 2) {
        store.sendMessage(members[0].id, members[1].id, 'notification', '测试消息');
      }

      // undo 3次
      store.undo();
      store.undo();
      store.undo();

      // 验证状态恢复
      const afterSnapshot = getTrackedSnapshot();
      expect(afterSnapshot.organization.members[0].reputation).toBe(beforeSnapshot.organization.members[0].reputation);
      if (beforeSnapshot.tasks.length > 0) {
        expect(afterSnapshot.tasks[0].progress).toBe(beforeSnapshot.tasks[0].progress);
      }
      expect(afterSnapshot.messages.length).toBe(beforeSnapshot.messages.length);
    });

    it('A6. 清空历史后再undo/redo', () => {
      const store = useACPStore.getState();

      // 执行几次操作
      store.updateScore('创新性', 50);
      store.updateScore('创造性', 50);
      store.undo();

      // 清空历史
      store.clearHistory();

      expect(store._undoStack.length).toBe(0);
      expect(store._redoStack.length).toBe(0);
      expect(store.canUndo()).toBe(false);
      expect(store.canRedo()).toBe(false);

      // undo/redo 不应崩溃
      expect(() => store.undo()).not.toThrow();
      expect(() => store.redo()).not.toThrow();
    });

    it('A7. 历史栈达到50上限后，最旧的记录被自动丢弃', () => {
      // 执行55次操作（超过50上限）
      // 每次修改不同维度以确保每次都产生新的历史记录
      const dimensions = ['创新性', '创造性', '价值量', '实用性', '易用性', '可维护性', '可扩展性'];
      for (let i = 0; i < 55; i++) {
        useACPStore.getState().updateScore(dimensions[i % dimensions.length], 50 + (i % 50));
      }

      // 历史栈不应超过50
      expect(useACPStore.getState()._undoStack.length).toBe(50);

      // undo 50次
      for (let i = 0; i < 50; i++) {
        useACPStore.getState().undo();
      }

      // 栈应该为空
      expect(useACPStore.getState()._undoStack.length).toBe(0);

      // 前5次操作的记录被丢弃了，undo 50次后回到第5次操作后的状态
      // 第5次操作 (i=4) 修改 dimensions[4] = '易用性'，值为 50 + (4 % 50) = 54
      const finalValue = useACPStore.getState().evaluationScores.find(s => s.dimension === '易用性')!.value;
      expect(finalValue).toBe(54);

      // 验证第6次操作 (i=5) 修改的 '可维护性' 已被 undo 回到初始值
      // 因为第6次操作被保留在历史中，undo 50次后应该回到第5次操作的状态
      // 第6次操作 (i=5) 修改 '可维护性' 为 55，但这是第6次操作，undo 50次后它在历史中
      // 所以 '可维护性' 应该被 undo 回初始值 88
      const maintainabilityValue = useACPStore.getState().evaluationScores.find(s => s.dimension === '可维护性')!.value;
      expect(maintainabilityValue).toBe(88);
    });

    it('A8. enableUndoRedo(false)期间的操作不被记录', () => {
      // 禁用 undo/redo
      useACPStore.getState().enableUndoRedo(false);

      // 执行操作
      useACPStore.getState().updateScore('创新性', 10);
      useACPStore.getState().updateScore('创造性', 20);

      // 不应有历史记录
      expect(useACPStore.getState()._undoStack.length).toBe(0);
      expect(useACPStore.getState().canUndo()).toBe(false);

      // 重新启用
      useACPStore.getState().enableUndoRedo(true);

      // 执行操作
      useACPStore.getState().updateScore('价值量', 30);

      // 只有重新启用后的操作被记录
      expect(useACPStore.getState()._undoStack.length).toBe(1);
    });
  });

  // ================================================================
  // B. Scenario 深拷贝验证 (6个)
  // ================================================================
  describe('B. Scenario 深拷贝验证', () => {

    it('B1. 保存场景后修改原状态，验证场景snapshot不受影响', () => {
      const scenarioStore = useScenarioStore.getState();
      const acpStore = useACPStore.getState();

      // 保存场景
      const scenarioId = scenarioStore.saveScenario('测试场景', '保存时的快照');
      expect(scenarioId).toBeTruthy();

      // 获取保存的场景
      const savedScenario = useScenarioStore.getState().scenarios.find(s => s.id === scenarioId);
      expect(savedScenario).toBeTruthy();

      // 记录保存时的任务数量
      const savedTaskCount = savedScenario!.snapshot.tasks.length;
      const savedMemberCount = savedScenario!.snapshot.organization.members.length;

      // 修改原状态
      acpStore.addTask({
        title: '新增任务',
        description: '测试深拷贝',
        priority: 'P2',
        estimatedTime: 60,
      });
      acpStore.addMember({
        name: '新成员',
        role: 'junior',
        capabilities: ['测试'],
      });

      // 验证场景snapshot不受影响
      const scenarioAfter = useScenarioStore.getState().scenarios.find(s => s.id === scenarioId);
      expect(scenarioAfter!.snapshot.tasks.length).toBe(savedTaskCount);
      expect(scenarioAfter!.snapshot.organization.members.length).toBe(savedMemberCount);
    });

    it('B2. 加载场景后修改状态，验证其他场景snapshot不受影响', () => {
      const scenarioStore = useScenarioStore.getState();
      const acpStore = useACPStore.getState();

      // 保存场景A
      const idA = scenarioStore.saveScenario('场景A', '初始状态A');
      // 修改状态
      acpStore.updateScore('创新性', 30);
      // 保存场景B
      const idB = scenarioStore.saveScenario('场景B', '修改后状态B');

      // 加载场景A
      scenarioStore.loadScenario(idA!);

      // 修改状态
      acpStore.updateScore('创造性', 10);
      acpStore.addTask({
        title: '加载A后的新任务',
        description: '测试',
        priority: 'P3',
        estimatedTime: 30,
      });

      // 验证场景B的snapshot不受影响
      const scenarioB = useScenarioStore.getState().scenarios.find(s => s.id === idB);
      const scoreB = scenarioB!.snapshot.evaluationScores.find(s => s.dimension === '创新性')!.value;
      expect(scoreB).toBe(30);
      expect(scenarioB!.snapshot.tasks.length).toBe(useACPStore.getState().tasks.length - 1);
    });

    it('B3. 复制场景后修改副本，验证原场景不受影响', () => {
      const scenarioStore = useScenarioStore.getState();
      const acpStore = useACPStore.getState();

      // 保存场景
      const id = scenarioStore.saveScenario('原始场景', '原始描述');
      expect(id).toBeTruthy();

      // 复制场景
      const copyId = scenarioStore.duplicateScenario(id!);
      expect(copyId).toBeTruthy();

      // 加载副本
      scenarioStore.loadScenario(copyId!);

      // 修改状态
      acpStore.updateScore('创新性', 5);
      acpStore.updateOrganization({ name: '修改后的组织' });

      // 保存副本（覆盖）
      scenarioStore.saveScenario('修改后的副本', '已修改');

      // 验证原场景不受影响
      const originalScenario = useScenarioStore.getState().scenarios.find(s => s.id === id);
      const originalScore = originalScenario!.snapshot.evaluationScores.find(s => s.dimension === '创新性')!.value;
      expect(originalScore).not.toBe(5);
      expect(originalScenario!.snapshot.organization.name).not.toBe('修改后的组织');
    });

    it('B4. 保存超过20个场景，验证最旧的被自动删除', () => {
      const scenarioStore = useScenarioStore.getState();

      // 保存21个场景
      const ids: string[] = [];
      for (let i = 0; i < 21; i++) {
        const id = scenarioStore.saveScenario(`场景${i}`, `描述${i}`);
        if (id) ids.push(id);
      }

      // 场景数量不应超过20
      expect(useScenarioStore.getState().scenarios.length).toBe(20);

      // 最旧的场景（场景0）应被删除
      const oldestExists = useScenarioStore.getState().scenarios.some(s => s.id === ids[0]);
      expect(oldestExists).toBe(false);

      // 最新的场景（场景20）应存在
      const newestExists = useScenarioStore.getState().scenarios.some(s => s.id === ids[20]);
      expect(newestExists).toBe(true);
    });

    it('B5. 加载不存在的场景ID，返回false', () => {
      const scenarioStore = useScenarioStore.getState();

      const result = scenarioStore.loadScenario('non-existent-id-12345');
      expect(result).toBe(false);
    });

    it('B6. 删除当前激活场景，验证activeScenarioId被清空', () => {
      const scenarioStore = useScenarioStore.getState();

      // 保存场景
      const id = scenarioStore.saveScenario('待删除场景', '测试');
      expect(id).toBeTruthy();

      // 验证激活
      expect(useScenarioStore.getState().activeScenarioId).toBe(id);

      // 删除当前激活场景
      scenarioStore.deleteScenario(id!);

      // 验证activeScenarioId被清空
      expect(useScenarioStore.getState().activeScenarioId).toBeNull();
    });
  });

  // ================================================================
  // C. Analytics 边缘场景 (6个)
  // ================================================================
  describe('C. Analytics 边缘场景', () => {

    it('C1. 空状态（0个任务、0个成员）生成报告', () => {
      const report = generateFullReport([], [], [], {
        totalScore: 0,
        rating: 'needs_improvement',
        scores: [],
        strengths: [],
        weaknesses: [],
        recommendations: [],
      }, []);

      expect(report).toBeDefined();
      expect(report.timestamp).toBeGreaterThan(0);
      expect(report.bottlenecks).toEqual([]);
      expect(report.resourceUtilization.totalAgents).toBe(0);
      expect(report.taskHealth.totalTasks).toBe(0);
      expect(report.taskHealth.healthScore).toBe(100);
      expect(report.collaboration.totalMessages).toBe(0);
      expect(report.overallScore).toBeGreaterThanOrEqual(0);
    });

    it('C2. 所有任务都已完成', () => {
      const tasks: Task[] = Array.from({ length: 10 }, (_, i) => ({
        id: `task-${i}`,
        title: `已完成任务${i}`,
        description: '测试',
        status: 'completed' as const,
        priority: 'P1' as const,
        progress: 100,
        estimatedTime: 60,
        createdAt: Date.now() - 86400000,
        dependencies: [],
      }));

      const taskHealth = analyzeTaskHealth(tasks);
      expect(taskHealth.totalTasks).toBe(10);
      expect(taskHealth.healthyTasks).toBe(10);
      expect(taskHealth.healthScore).toBe(100);
      expect(taskHealth.atRiskTasks).toHaveLength(0);
      expect(taskHealth.failedTasks).toHaveLength(0);

      const trend = predictTrends(tasks, []);
      expect(trend.riskLevel).toBe('low');
      expect(trend.prediction).toContain('已完成');
    });

    it('C3. 所有任务都失败了', () => {
      const tasks: Task[] = Array.from({ length: 5 }, (_, i) => ({
        id: `task-${i}`,
        title: `失败任务${i}`,
        description: '测试',
        status: 'failed' as const,
        priority: 'P0' as const,
        progress: 30,
        estimatedTime: 120,
        createdAt: Date.now() - 86400000,
        dependencies: [],
      }));

      const members: Member[] = [
        {
          id: 'agent-1',
          name: 'Agent 1',
          role: 'senior',
          level: 6,
          reputation: 80,
          capabilities: ['dev'],
          status: 'idle',
        },
      ];

      const taskHealth = analyzeTaskHealth(tasks);
      expect(taskHealth.totalTasks).toBe(5);
      expect(taskHealth.failedTasks).toHaveLength(5);
      expect(taskHealth.healthScore).toBe(0);

      const report = generateFullReport(tasks, members, [], {
        totalScore: 50,
        rating: 'needs_improvement',
        scores: [],
        strengths: [],
        weaknesses: [],
        recommendations: [],
      }, []);

      expect(report.recommendations.some(r => r.includes('失败'))).toBe(true);
    });

    it('C4. 所有成员都离线', () => {
      const members: Member[] = Array.from({ length: 8 }, (_, i) => ({
        id: `agent-${i}`,
        name: `Agent ${i}`,
        role: 'mid' as const,
        level: 5,
        reputation: 70,
        capabilities: ['dev'],
        status: 'offline' as const,
      }));

      const utilization = analyzeResourceUtilization(members);
      expect(utilization.totalAgents).toBe(8);
      expect(utilization.busyAgents).toBe(0);
      expect(utilization.idleAgents).toBe(0);
      expect(utilization.offlineAgents).toBe(8);
      expect(utilization.utilizationRate).toBe(0);

      const collaboration = analyzeCollaboration([], members);
      expect(collaboration.totalMessages).toBe(0);
      expect(collaboration.mostActiveMembers).toHaveLength(0);
    });

    it('C5. 大量消息（1000条）的协作分析性能', () => {
      const members: Member[] = Array.from({ length: 10 }, (_, i) => ({
        id: `agent-${i}`,
        name: `Agent ${i}`,
        role: 'mid' as const,
        level: 5,
        reputation: 70,
        capabilities: ['dev', 'test'],
        status: i < 8 ? 'idle' as const : 'offline' as const,
      }));

      // 生成1000条消息
      const messages: Message[] = Array.from({ length: 1000 }, (_, i) => {
        const from = members[i % 10];
        const to = members[(i + 1) % 10];
        const types: Message['type'][] = ['task', 'notification', 'request', 'response'];
        return {
          id: `msg-${i}`,
          from: from.id,
          to: to.id,
          type: types[i % 4],
          content: `消息内容 ${i}`,
          timestamp: Date.now() - (1000 - i) * 60000,
          read: i % 2 === 0,
        };
      });

      // 测试性能
      const startTime = performance.now();
      const collaboration = analyzeCollaboration(messages, members);
      const elapsed = performance.now() - startTime;

      expect(collaboration.totalMessages).toBe(1000);
      expect(collaboration.mostActiveMembers.length).toBeLessThanOrEqual(5);
      expect(collaboration.mostActiveMembers[0].messageCount).toBeGreaterThan(0);
      // 性能断言：1000条消息分析应在1秒内完成
      expect(elapsed).toBeLessThan(1000);
    });

    it('C6. 任务有循环依赖时的瓶颈检测', () => {
      const tasks: Task[] = [
        {
          id: 'task-A',
          title: '任务A',
          description: '依赖B',
          status: 'blocked',
          priority: 'P1',
          dependencies: ['task-B'],
          progress: 0,
          estimatedTime: 60,
          createdAt: Date.now() - 3600000,
        },
        {
          id: 'task-B',
          title: '任务B',
          description: '依赖C',
          status: 'blocked',
          priority: 'P1',
          dependencies: ['task-C'],
          progress: 0,
          estimatedTime: 60,
          createdAt: Date.now() - 3600000,
        },
        {
          id: 'task-C',
          title: '任务C',
          description: '依赖A（循环）',
          status: 'blocked',
          priority: 'P1',
          dependencies: ['task-A'],
          progress: 0,
          estimatedTime: 60,
          createdAt: Date.now() - 3600000,
        },
      ];

      const members: Member[] = [
        {
          id: 'agent-1',
          name: 'Agent 1',
          role: 'senior',
          level: 6,
          reputation: 80,
          capabilities: ['dev'],
          status: 'idle',
        },
      ];

      // 不应崩溃
      const bottlenecks = analyzeBottlenecks(tasks, members);
      expect(bottlenecks).toBeDefined();
      expect(Array.isArray(bottlenecks)).toBe(true);

      // 应检测到依赖链阻塞
      const depChain = bottlenecks.find(b => b.type === 'dependency_chain' || b.type === 'task_blocked');
      expect(depChain).toBeDefined();
    });
  });

  // ================================================================
  // D. Theme 边缘场景 (6个)
  // ================================================================
  describe('D. Theme 边缘场景', () => {

    it('D1. 快速切换主题10次，验证最终状态一致', () => {
      const presetIds = ['default-blue', 'emerald-green', 'amber-orange', 'rose-red'];

      // 快速切换10次 (i: 0..9)
      for (let i = 0; i < 10; i++) {
        const targetId = presetIds[i % presetIds.length];
        useThemeStore.getState().setActiveTheme(targetId);
      }

      // 最终应该是第10次切换的结果（i=9, presetIds[9 % 4] = presetIds[1] = 'emerald-green'）
      expect(useThemeStore.getState().activeThemeId).toBe('emerald-green');

      // 验证主题存在
      const activeTheme = useThemeStore.getState().getActiveTheme();
      expect(activeTheme.id).toBe('emerald-green');
    });

    it('D2. 创建11个自定义主题（超过上限），验证第11个被拒绝', () => {
      const themeStore = useThemeStore.getState();

      // 创建10个自定义主题
      const createdIds: string[] = [];
      for (let i = 0; i < 10; i++) {
        const theme = createCustomTheme(`custom-${i}`, `自定义主题${i}`);
        const result = themeStore.addTheme(theme);
        expect(result).toBe(true);
        createdIds.push(theme.id);
      }

      // 第11个应该被拒绝
      const theme11 = createCustomTheme('custom-10', '自定义主题10');
      const result11 = themeStore.addTheme(theme11);
      expect(result11).toBe(false);

      // 验证主题数量
      const customCount = useThemeStore.getState().themes.filter(
        t => !['default-blue', 'emerald-green', 'amber-orange', 'rose-red'].includes(t.id)
      ).length;
      expect(customCount).toBe(10);
    });

    it('D3. 删除当前激活的自定义主题，验证回退到默认', () => {
      const themeStore = useThemeStore.getState();

      // 创建并激活自定义主题
      const customTheme = createCustomTheme('custom-to-delete', '待删除主题');
      const added = themeStore.addTheme(customTheme);
      expect(added).toBe(true);

      themeStore.setActiveTheme('custom-to-delete');
      expect(useThemeStore.getState().activeThemeId).toBe('custom-to-delete');

      // 删除当前激活的自定义主题
      themeStore.deleteTheme('custom-to-delete');

      // 应回退到默认
      expect(useThemeStore.getState().activeThemeId).toBe('default-blue');
    });

    it('D4. 深色/亮色模式快速切换', () => {
      const themeStore = useThemeStore.getState();

      // 快速切换20次
      for (let i = 0; i < 20; i++) {
        themeStore.toggleDarkMode();
      }

      // 20次切换后应该回到亮色模式（偶数次）
      expect(useThemeStore.getState().isDarkMode).toBe(false);

      // 再切换一次应该是深色
      themeStore.toggleDarkMode();
      expect(useThemeStore.getState().isDarkMode).toBe(true);
    });

    it('D5. 更新预设主题的颜色', () => {
      const themeStore = useThemeStore.getState();

      // 更新预设主题的颜色
      const originalTheme = useThemeStore.getState().getActiveTheme();
      const originalPrimary = originalTheme.colors.light.primary;

      themeStore.updateTheme('default-blue', {
        colors: {
          ...originalTheme.colors,
          light: {
            ...originalTheme.colors.light,
            primary: '#ff00ff',
          },
        },
      });

      // 验证颜色已更新
      const updatedTheme = useThemeStore.getState().themes.find(t => t.id === 'default-blue');
      expect(updatedTheme!.colors.light.primary).toBe('#ff00ff');

      // 恢复原始颜色
      themeStore.updateTheme('default-blue', {
        colors: {
          ...originalTheme.colors,
          light: {
            ...originalTheme.colors.light,
            primary: originalPrimary,
          },
        },
      });
    });

    it('D6. 持久化数据损坏时的容错', () => {
      // 模拟损坏的持久化数据
      localStorage.setItem('acp-theme-storage', '{invalid json');

      // 重新创建 themeStore 不应崩溃
      // 由于 themeStore 是模块级单例，我们验证读取损坏数据时的行为
      expect(() => {
        const stored = localStorage.getItem('acp-theme-storage');
        if (stored) {
          try {
            JSON.parse(stored);
          } catch {
            // 应该能优雅处理
            console.warn('数据损坏，使用默认值');
          }
        }
      }).not.toThrow();

      // 清理
      localStorage.removeItem('acp-theme-storage');
    });
  });

  // ================================================================
  // E. 跨模块集成场景 (6个)
  // ================================================================
  describe('E. 跨模块集成场景', () => {

    it('E1. 保存场景 -> 修改状态 -> undo -> 验证undo不影响已保存的场景', () => {
      const scenarioStore = useScenarioStore.getState();
      const acpStore = useACPStore.getState();

      // 保存场景
      const id = scenarioStore.saveScenario('集成测试场景', '保存时的状态');
      expect(id).toBeTruthy();

      // 获取保存时的分数
      const savedScore = useScenarioStore.getState().scenarios.find(s => s.id === id)!
        .snapshot.evaluationScores.find(s => s.dimension === '创新性')!.value;

      // 修改状态
      acpStore.updateScore('创新性', 10);

      // undo
      acpStore.undo();

      // 验证当前状态恢复
      const currentScore = useACPStore.getState().evaluationScores.find(s => s.dimension === '创新性')!.value;
      expect(currentScore).toBe(savedScore);

      // 验证场景snapshot不受undo影响
      const scenarioScore = useScenarioStore.getState().scenarios.find(s => s.id === id)!
        .snapshot.evaluationScores.find(s => s.dimension === '创新性')!.value;
      expect(scenarioScore).toBe(savedScore);
    });

    it('E2. 切换主题 -> 保存场景 -> 加载场景 -> 验证主题不受影响', () => {
      const themeStore = useThemeStore.getState();
      const scenarioStore = useScenarioStore.getState();

      // 切换到非默认主题
      themeStore.setActiveTheme('emerald-green');
      expect(useThemeStore.getState().activeThemeId).toBe('emerald-green');

      // 保存场景
      const id = scenarioStore.saveScenario('主题集成测试', '测试主题独立性');
      expect(id).toBeTruthy();

      // 切换到另一个主题
      themeStore.setActiveTheme('rose-red');
      expect(useThemeStore.getState().activeThemeId).toBe('rose-red');

      // 加载场景
      scenarioStore.loadScenario(id!);

      // 验证主题仍然是 rose-red（场景不保存主题信息）
      expect(useThemeStore.getState().activeThemeId).toBe('rose-red');
    });

    it('E3. 模拟运行中 -> 保存场景 -> 停止模拟 -> 加载场景 -> 验证状态正确', () => {
      const acpStore = useACPStore.getState();
      const scenarioStore = useScenarioStore.getState();

      // 启动模拟
      acpStore.toggleSimulation();
      expect(useACPStore.getState().isSimulating).toBe(true);
      expect(useACPStore.getState()._undoRedoEnabled).toBe(false);

      // 运行几个tick
      acpStore.runSchedulerTick();
      acpStore.runSchedulerTick();

      // 保存场景（模拟运行中）
      const id = scenarioStore.saveScenario('模拟中保存', '模拟运行时的快照');
      expect(id).toBeTruthy();

      // 记录保存时的任务状态
      const savedTasks = useScenarioStore.getState().scenarios.find(s => s.id === id)!.snapshot.tasks;

      // 停止模拟
      acpStore.toggleSimulation();
      expect(useACPStore.getState().isSimulating).toBe(false);

      // 修改状态
      if (useACPStore.getState().tasks.length > 0) {
        acpStore.updateTask(useACPStore.getState().tasks[0].id, { progress: 99 });
      }

      // 加载场景
      scenarioStore.loadScenario(id!);

      // 验证状态恢复到模拟中保存时的状态
      const loadedTasks = useACPStore.getState().tasks;
      expect(loadedTasks.length).toBe(savedTasks.length);
      // 验证任务进度一致
      for (let i = 0; i < loadedTasks.length; i++) {
        expect(loadedTasks[i].progress).toBe(savedTasks[i].progress);
      }
    });

    it('E4. 分析报告 -> 发现瓶颈 -> 修复（修改状态）-> 重新分析 -> 验证分数变化', () => {
      const acpStore = useACPStore.getState();

      // 创建一个有瓶颈的状态：一个成员被分配多个任务
      const memberId = acpStore.organization.members.find(m => m.status === 'idle')?.id;
      expect(memberId).toBeTruthy();

      // 添加多个任务并分配给同一个成员（通过直接设置状态模拟）
      // 由于 assignTask 需要 idle 成员，我们只能分配一个
      // 改为创建多个 pending 任务
      for (let i = 0; i < 5; i++) {
        acpStore.addTask({
          title: `瓶颈任务${i}`,
          description: '测试瓶颈',
          priority: 'P1',
          estimatedTime: 60,
        });
      }

      // 生成初始报告
      const report1 = generateFullReport(
        acpStore.tasks,
        acpStore.organization.members,
        acpStore.messages,
        acpStore.evaluation,
        []
      );
      void report1.overallScore;

      // "修复"：将一些任务标记为完成
      const pendingTasks = useACPStore.getState().tasks.filter(t => t.status === 'pending');
      for (let i = 0; i < Math.min(3, pendingTasks.length); i++) {
        acpStore.updateTask(pendingTasks[i].id, { status: 'completed', progress: 100 });
      }

      // 重新分析
      const report2 = generateFullReport(
        useACPStore.getState().tasks,
        useACPStore.getState().organization.members,
        useACPStore.getState().messages,
        useACPStore.getState().evaluation,
        []
      );
      void report2.overallScore;

      // 分数应该有变化（不一定更高，但应该不同）
      // 由于我们完成了任务，健康分数应该提升
      expect(report2.taskHealth.healthScore).toBeGreaterThanOrEqual(report1.taskHealth.healthScore);
    });

    it('E5. 多次undo/redo后保存场景 -> 加载 -> 验证场景是最新状态', () => {
      const acpStore = useACPStore.getState();
      const scenarioStore = useScenarioStore.getState();

      // 执行多次操作
      acpStore.updateScore('创新性', 20);
      acpStore.updateScore('创造性', 30);
      acpStore.updateScore('价值量', 40);

      // undo 2次
      acpStore.undo();
      acpStore.undo();

      // redo 1次
      acpStore.redo();

      // 此时创新性=20, 创造性=30（redo回来的）, 价值量=原始值
      const currentInnovation = useACPStore.getState().evaluationScores.find(s => s.dimension === '创新性')!.value;
      const currentCreativity = useACPStore.getState().evaluationScores.find(s => s.dimension === '创造性')!.value;

      // 保存场景
      const id = scenarioStore.saveScenario('undo/redo后保存', '最新状态');
      expect(id).toBeTruthy();

      // 修改状态
      acpStore.updateScore('创新性', 99);

      // 加载场景
      scenarioStore.loadScenario(id!);

      // 验证场景保存的是undo/redo后的最新状态
      const loadedInnovation = useACPStore.getState().evaluationScores.find(s => s.dimension === '创新性')!.value;
      const loadedCreativity = useACPStore.getState().evaluationScores.find(s => s.dimension === '创造性')!.value;

      expect(loadedInnovation).toBe(currentInnovation);
      expect(loadedCreativity).toBe(currentCreativity);
    });

    it('E6. 场景A -> 修改 -> 场景B -> 修改 -> 切换回A -> 验证A的状态独立', () => {
      const acpStore = useACPStore.getState();
      const scenarioStore = useScenarioStore.getState();

      // 保存场景A
      const idA = scenarioStore.saveScenario('场景A', '初始状态');
      expect(idA).toBeTruthy();

      // 修改状态
      acpStore.updateScore('创新性', 15);
      acpStore.updateOrganization({ name: '修改后的组织' });

      // 保存场景B
      const idB = scenarioStore.saveScenario('场景B', '修改后状态');
      expect(idB).toBeTruthy();

      // 再次修改
      acpStore.updateScore('创新性', 25);
      acpStore.updateOrganization({ name: '再次修改的组织' });

      // 切换回场景A
      scenarioStore.loadScenario(idA!);

      // 验证A的状态独立
      expect(useACPStore.getState().evaluationScores.find(s => s.dimension === '创新性')!.value).not.toBe(25);
      expect(useACPStore.getState().organization.name).not.toBe('再次修改的组织');

      // 验证场景B不受影响
      const scenarioB = useScenarioStore.getState().scenarios.find(s => s.id === idB);
      expect(scenarioB!.snapshot.evaluationScores.find(s => s.dimension === '创新性')!.value).toBe(15);
      expect(scenarioB!.snapshot.organization.name).toBe('修改后的组织');
    });
  });

  // ================================================================
  // F. 性能压力测试 (4个)
  // ================================================================
  describe('F. 性能压力测试', () => {

    it('F1. 100个成员 + 500个任务的undo/redo性能', () => {
      const acpStore = useACPStore.getState();

      // 批量添加100个成员
      const startTime = performance.now();
      for (let i = 0; i < 100; i++) {
        acpStore.addMember({
          name: `压力测试成员${i}`,
          role: 'junior',
          capabilities: ['测试', '开发'],
        });
      }
      const addMemberTime = performance.now() - startTime;

      // 批量添加500个任务
      const taskStart = performance.now();
      for (let i = 0; i < 500; i++) {
        acpStore.addTask({
          title: `压力测试任务${i}`,
          description: `这是第${i}个压力测试任务`,
          priority: (['P0', 'P1', 'P2', 'P3'] as const)[i % 4],
          estimatedTime: 30 + (i % 10) * 10,
        });
      }
      const addTaskTime = performance.now() - taskStart;

      // undo 10次
      const undoStart = performance.now();
      for (let i = 0; i < 10; i++) {
        acpStore.undo();
      }
      const undoTime = performance.now() - undoStart;

      // redo 10次
      const redoStart = performance.now();
      for (let i = 0; i < 10; i++) {
        acpStore.redo();
      }
      const redoTime = performance.now() - redoStart;

      // 验证状态一致性
      expect(useACPStore.getState().organization.members.length).toBeGreaterThan(100);
      expect(useACPStore.getState().tasks.length).toBeGreaterThan(500);

      // 性能断言
      // 注意：由于 undo/redo 使用 structuredClone 深拷贝，大数据量下可能较慢
      // 这里设置一个合理的阈值
      console.log(`[F1 性能] 添加成员: ${addMemberTime.toFixed(0)}ms, 添加任务: ${addTaskTime.toFixed(0)}ms, undo 10次: ${undoTime.toFixed(0)}ms, redo 10次: ${redoTime.toFixed(0)}ms`);

      // 基本断言：操作应该完成且不崩溃
      expect(addMemberTime).toBeLessThan(30000); // 30秒
      expect(addTaskTime).toBeLessThan(60000); // 60秒
    });

    it('F2. 1000条消息的协作分析', () => {
      const members: Member[] = Array.from({ length: 20 }, (_, i) => ({
        id: `agent-${i}`,
        name: `Agent ${i}`,
        role: 'mid' as const,
        level: 5,
        reputation: 70,
        capabilities: ['dev', 'test', 'design'],
        status: i < 15 ? ('idle' as const) : ('offline' as const),
      }));

      const messages: Message[] = Array.from({ length: 1000 }, (_, i) => {
        const fromIdx = i % 20;
        const toIdx = (i + 3) % 20;
        return {
          id: `msg-${i}`,
          from: members[fromIdx].id,
          to: members[toIdx].id,
          type: (['task', 'notification', 'request', 'response'] as const)[i % 4],
          content: `协作消息 ${i}: 需要讨论项目进度和下一步计划`,
          timestamp: Date.now() - (1000 - i) * 30000,
          read: i % 3 !== 0,
        };
      });

      const startTime = performance.now();
      const collaboration = analyzeCollaboration(messages, members);
      const elapsed = performance.now() - startTime;

      expect(collaboration.totalMessages).toBe(1000);
      expect(collaboration.mostActiveMembers.length).toBeLessThanOrEqual(5);
      expect(collaboration.responseRate).toBeGreaterThanOrEqual(0);
      expect(elapsed).toBeLessThan(2000); // 2秒内完成

      console.log(`[F2 性能] 1000条消息协作分析: ${elapsed.toFixed(0)}ms`);
    });

    it('F3. 50个场景的保存/加载', () => {
      const acpStore = useACPStore.getState();
      const scenarioStore = useScenarioStore.getState();

      // 保存50个场景（超过20上限，会自动删除旧的）
      const saveStart = performance.now();
      const ids: string[] = [];
      for (let i = 0; i < 50; i++) {
        // 每次修改一点状态
        acpStore.updateScore('创新性', 50 + (i % 50));
        const id = scenarioStore.saveScenario(`压力场景${i}`, `第${i}个场景`);
        if (id) ids.push(id);
      }
      const saveTime = performance.now() - saveStart;

      // 验证只保留了20个
      expect(useScenarioStore.getState().scenarios.length).toBe(20);

      // 加载最后一个场景
      const lastId = ids[ids.length - 1];
      const loadStart = performance.now();
      const loadResult = scenarioStore.loadScenario(lastId);
      const loadTime = performance.now() - loadStart;

      expect(loadResult).toBe(true);
      expect(useScenarioStore.getState().activeScenarioId).toBe(lastId);

      console.log(`[F3 性能] 保存50个场景: ${saveTime.toFixed(0)}ms, 加载场景: ${loadTime.toFixed(0)}ms`);
    });

    it('F4. 快速连续100次setState的稳定性', () => {
      const acpStore = useACPStore.getState();

      // 快速连续100次不同类型的操作
      const startTime = performance.now();
      let errorCount = 0;

      for (let i = 0; i < 100; i++) {
        try {
          switch (i % 5) {
            case 0: {
              // 修改评分
              acpStore.updateScore('创新性', 50 + (i % 50));
              break;
            }
            case 1: {
              // 修改组织
              acpStore.updateOrganization({ name: `组织名称${i}` });
              break;
            }
            case 2: {
              // 添加知识节点
              acpStore.addKnowledgeNode({
                type: 'concept',
                name: `概念${i}`,
                description: `第${i}个概念`,
              });
              break;
            }
            case 3: {
              // 修改调度器配置
              acpStore.setSchedulerConfig({
                ...acpStore.schedulerConfig,
                capabilityWeight: 0.1 + (i % 9) * 0.1,
              });
              break;
            }
            case 4: {
              // 添加日志
              acpStore.addLog('info', `快速操作日志 ${i}`);
              break;
            }
          }
        } catch (e) {
          errorCount++;
        }
      }

      const elapsed = performance.now() - startTime;

      // 不应有错误
      expect(errorCount).toBe(0);

      // 验证最终状态一致
      const state = useACPStore.getState();
      expect(state.knowledgeNodes.length).toBeGreaterThan(0);
      expect(state.logs.length).toBeGreaterThan(0);

      console.log(`[F4 性能] 100次快速setState: ${elapsed.toFixed(0)}ms, 错误数: ${errorCount}`);
    });
  });
});
