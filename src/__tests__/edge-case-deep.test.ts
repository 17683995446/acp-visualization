/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach } from 'vitest';
import { useACPStore } from '../store/acpStore';
import { formatTime, formatDuration } from '../utils/format';
import { TaskService } from '../services/TaskService';

describe('边界条件和极端情况测试', () => {
  beforeEach(() => {
    useACPStore.setState(useACPStore.getInitialState());
  });

  // ============ 1. 空状态操作 ============

  describe('空状态操作', () => {
    it('removeMember("nonexistent") 不崩溃', () => {
      const stateBefore = useACPStore.getState();
      expect(() => useACPStore.getState().removeMember('nonexistent')).not.toThrow();
      const stateAfter = useACPStore.getState();
      // 成员列表应保持不变
      expect(stateAfter.organization.members.length).toBe(stateBefore.organization.members.length);
    });

    it('deleteTask("nonexistent") 不崩溃', () => {
      const stateBefore = useACPStore.getState();
      expect(() => useACPStore.getState().deleteTask('nonexistent')).not.toThrow();
      const stateAfter = useACPStore.getState();
      // 任务列表应保持不变
      expect(stateAfter.tasks.length).toBe(stateBefore.tasks.length);
    });

    it('markMessageAsRead("nonexistent") 不崩溃', () => {
      expect(() => useACPStore.getState().markMessageAsRead('nonexistent')).not.toThrow();
      const stateAfter = useACPStore.getState();
      // 消息列表应保持不变（初始为空）
      expect(stateAfter.messages.length).toBe(0);
    });

    it('deleteKnowledgeNode("nonexistent") 不崩溃', () => {
      const stateBefore = useACPStore.getState();
      expect(() => useACPStore.getState().deleteKnowledgeNode('nonexistent')).not.toThrow();
      const stateAfter = useACPStore.getState();
      // 知识图谱应保持不变
      expect(stateAfter.knowledgeNodes.length).toBe(stateBefore.knowledgeNodes.length);
    });
  });

  // ============ 2. 重复操作 ============

  describe('重复操作', () => {
    it('连续添加同名部门两次 → 第二次应被拒绝', () => {
      const store = useACPStore.getState();
      const deptCountBefore = store.organization.departments.length;

      // 第一次添加应成功
      store.addDepartment({ name: '测试部门', headId: 'agent-001' });
      expect(useACPStore.getState().organization.departments.length).toBe(deptCountBefore + 1);

      // 第二次添加同名部门应被拒绝
      useACPStore.getState().addDepartment({ name: '测试部门', headId: 'agent-001' });
      expect(useACPStore.getState().organization.departments.length).toBe(deptCountBefore + 1);
    });

    it('updateReputation 100次(delta=1) → reputation clamp 在 100', () => {
      const memberId = 'agent-001'; // Alex, 初始 reputation=95

      for (let i = 0; i < 100; i++) {
        useACPStore.getState().updateReputation(memberId, 1);
      }

      const member = useACPStore.getState().organization.members.find(m => m.id === memberId);
      expect(member?.reputation).toBe(100);
    });

    it('updateReputation 100次(delta=-1) → reputation clamp 在 0', () => {
      const memberId = 'agent-008'; // Henry (Intern), 初始 reputation=50

      for (let i = 0; i < 100; i++) {
        useACPStore.getState().updateReputation(memberId, -1);
      }

      const member = useACPStore.getState().organization.members.find(m => m.id === memberId);
      expect(member?.reputation).toBe(0);
    });
  });

  // ============ 3. 极端输入 ============

  describe('极端输入', () => {
    it('addTask estimatedTime=Infinity → 被拒绝', () => {
      const taskCountBefore = useACPStore.getState().tasks.length;
      useACPStore.getState().addTask({
        title: '极端时间测试',
        description: '测试Infinity',
        priority: 'P2',
        estimatedTime: Infinity,
      });
      expect(useACPStore.getState().tasks.length).toBe(taskCountBefore);
    });

    it('addTask estimatedTime=NaN → 被拒绝', () => {
      const taskCountBefore = useACPStore.getState().tasks.length;
      useACPStore.getState().addTask({
        title: 'NaN时间测试',
        description: '测试NaN',
        priority: 'P2',
        estimatedTime: NaN,
      });
      expect(useACPStore.getState().tasks.length).toBe(taskCountBefore);
    });

    it('updateMember reputation=999 → clamp 到 100', () => {
      useACPStore.getState().updateMember('agent-001', { reputation: 999 });
      const member = useACPStore.getState().organization.members.find(m => m.id === 'agent-001');
      expect(member?.reputation).toBe(100);
    });

    it('updateMember reputation=-50 → clamp 到 0', () => {
      useACPStore.getState().updateMember('agent-001', { reputation: -50 });
      const member = useACPStore.getState().organization.members.find(m => m.id === 'agent-001');
      expect(member?.reputation).toBe(0);
    });

    it('setSimulationInterval(0) → 被拒绝', () => {
      const intervalBefore = useACPStore.getState().simulationInterval;
      useACPStore.getState().setSimulationInterval(0);
      expect(useACPStore.getState().simulationInterval).toBe(intervalBefore);
    });

    it('setSimulationInterval(-100) → 被拒绝', () => {
      const intervalBefore = useACPStore.getState().simulationInterval;
      useACPStore.getState().setSimulationInterval(-100);
      expect(useACPStore.getState().simulationInterval).toBe(intervalBefore);
    });

    it('setSimulationInterval(50) → 被拒绝', () => {
      const intervalBefore = useACPStore.getState().simulationInterval;
      useACPStore.getState().setSimulationInterval(50);
      expect(useACPStore.getState().simulationInterval).toBe(intervalBefore);
    });

    it('setSchedulerConfig capabilityWeight=-1 → 被拒绝', () => {
      const configBefore = useACPStore.getState().schedulerConfig;
      useACPStore.getState().setSchedulerConfig({
        ...configBefore,
        capabilityWeight: -1,
      });
      expect(useACPStore.getState().schedulerConfig).toEqual(configBefore);
    });
  });

  // ============ 4. 消息系统边界 ============

  describe('消息系统边界', () => {
    it('from===to → 被拒绝', () => {
      const msgCountBefore = useACPStore.getState().messages.length;
      useACPStore.getState().sendMessage('agent-001', 'agent-001', 'notification', '自言自语');
      expect(useACPStore.getState().messages.length).toBe(msgCountBefore);
    });

    it("content='' → 被拒绝", () => {
      const msgCountBefore = useACPStore.getState().messages.length;
      useACPStore.getState().sendMessage('agent-001', 'agent-002', 'notification', '');
      expect(useACPStore.getState().messages.length).toBe(msgCountBefore);
    });

    it("content='   ' → 被拒绝", () => {
      const msgCountBefore = useACPStore.getState().messages.length;
      useACPStore.getState().sendMessage('agent-001', 'agent-002', 'notification', '   ');
      expect(useACPStore.getState().messages.length).toBe(msgCountBefore);
    });
  });

  // ============ 5. 依赖关系边界 ============

  describe('依赖关系边界', () => {
    it('addTask dependencies 包含不存在的ID → 被拒绝', () => {
      const taskCountBefore = useACPStore.getState().tasks.length;
      useACPStore.getState().addTask({
        title: '无效依赖测试',
        description: '依赖不存在的任务',
        priority: 'P2',
        estimatedTime: 120,
        dependencies: ['nonexistent-task-id'],
      });
      expect(useACPStore.getState().tasks.length).toBe(taskCountBefore);
    });

    it('循环依赖 A→B→A → hasCircularDependency 返回 true', () => {
      // 创建任务 A（无依赖）
      useACPStore.getState().addTask({
        title: '任务A',
        description: '循环依赖测试A',
        priority: 'P2',
        estimatedTime: 120,
      });
      const taskA = useACPStore.getState().tasks.find(t => t.title === '任务A');
      expect(taskA).toBeDefined();

      // 创建任务 B，依赖 A
      useACPStore.getState().addTask({
        title: '任务B',
        description: '循环依赖测试B',
        priority: 'P2',
        estimatedTime: 120,
        dependencies: [taskA!.id],
      });
      const taskB = useACPStore.getState().tasks.find(t => t.title === '任务B');
      expect(taskB).toBeDefined();

      // 使用 updateTask 给 A 添加对 B 的依赖，形成循环 A→B→A
      useACPStore.getState().updateTask(taskA!.id, { dependencies: [taskB!.id] });

      // 验证循环依赖检测
      const tasks = useACPStore.getState().tasks;
      expect(TaskService.hasCircularDependency(taskA!.id, tasks)).toBe(true);
      expect(TaskService.hasCircularDependency(taskB!.id, tasks)).toBe(true);
    });
  });

  // ============ 6. 评估系统边界 ============

  describe('评估系统边界', () => {
    it('updateScore value=-50 → clamp 到 0', () => {
      const dimension = '创新性'; // max=100
      useACPStore.getState().updateScore(dimension, -50);
      const score = useACPStore.getState().evaluationScores.find(s => s.dimension === dimension);
      expect(score?.value).toBe(0);
    });

    it('updateScore value 超过 max → clamp 到 max', () => {
      const dimension = '创新性'; // max=100
      useACPStore.getState().updateScore(dimension, 999);
      const score = useACPStore.getState().evaluationScores.find(s => s.dimension === dimension);
      expect(score?.value).toBe(score?.max);
    });

    it('所有 scores max=0 → totalScore=0', () => {
      // 将所有评分的 max 设为 0
      const scores = useACPStore.getState().evaluationScores;
      for (const s of scores) {
        useACPStore.getState().updateScore(s.dimension, 0);
      }
      // 手动将所有 max 设为 0（通过直接修改 store）
      useACPStore.setState({
        evaluationScores: scores.map(s => ({ ...s, max: 0 })),
      });
      // 重新计算评估
      useACPStore.getState().recalculateEvaluation();
      expect(useACPStore.getState().evaluation.totalScore).toBe(0);
    });
  });

  // ============ 7. 格式化函数边界 ============

  describe('格式化函数边界', () => {
    it('formatTime(NaN) → "刚刚"', () => {
      expect(formatTime(NaN)).toBe('刚刚');
    });

    it('formatTime(undefined as any) → "刚刚"', () => {
      expect(formatTime(undefined as any)).toBe('刚刚');
    });

    it('formatTime(-1000) → "刚刚"', () => {
      expect(formatTime(-1000)).toBe('刚刚');
    });

    it('formatDuration(NaN) → "<1m"', () => {
      expect(formatDuration(NaN)).toBe('<1m');
    });

    it('formatDuration(-10) → "<1m"', () => {
      expect(formatDuration(-10)).toBe('<1m');
    });

    it('formatDuration(0) → "<1m"', () => {
      expect(formatDuration(0)).toBe('<1m');
    });
  });
});
