/**
 * ACP Store 单元测试
 * 测试 Zustand 全局状态管理的所有核心操作
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useACPStore } from '../store/acpStore';
import { calculateStats } from '../store/helpers';

describe('ACP Store', () => {
  beforeEach(() => {
    // 重置 store 状态
    useACPStore.setState({
      organization: useACPStore.getInitialState().organization,
      tasks: useACPStore.getInitialState().tasks,
      messages: [],
      knowledgeNodes: useACPStore.getInitialState().knowledgeNodes,
      logs: [],
      isSimulating: false,
      lastSchedulerResult: null,
    });
  });

  // ============ 组织操作 ============

  describe('Organization', () => {
    it('should have valid initial organization', () => {
      const { organization } = useACPStore.getState();
      expect(organization.id).toBeDefined();
      expect(organization.name).toBe('ACP Demo Corp');
      expect(organization.type).toBe('hybrid');
      expect(organization.members.length).toBeGreaterThan(0);
      expect(organization.departments.length).toBeGreaterThan(0);
    });

    it('should add a new member', () => {
      const { addMember } = useACPStore.getState();
      addMember({ name: 'Test Agent', role: 'mid', capabilities: ['testing'] });

      const { organization } = useACPStore.getState();
      const newMember = organization.members.find(m => m.name === 'Test Agent');
      expect(newMember).toBeDefined();
      expect(newMember?.role).toBe('mid');
      expect(newMember?.capabilities).toContain('testing');
      expect(newMember?.status).toBe('idle');
    });

    it('should remove a member', () => {
      const { addMember, removeMember } = useACPStore.getState();
      addMember({ name: 'To Remove', role: 'junior', capabilities: ['testing'] });

      const before = useACPStore.getState().organization.members;
      const memberId = before.find(m => m.name === 'To Remove')!.id;

      removeMember(memberId);

      const after = useACPStore.getState().organization.members;
      expect(after.find(m => m.id === memberId)).toBeUndefined();
    });

    it('should update member status', () => {
      const { updateMemberStatus } = useACPStore.getState();
      const member = useACPStore.getState().organization.members[0];

      updateMemberStatus(member.id, 'busy');
      expect(useACPStore.getState().organization.members.find(m => m.id === member.id)?.status).toBe('busy');

      updateMemberStatus(member.id, 'idle');
      expect(useACPStore.getState().organization.members.find(m => m.id === member.id)?.status).toBe('idle');
    });

    it('should clamp reputation between 0 and 100', () => {
      const { addMember, updateReputation } = useACPStore.getState();
      addMember({ name: 'Rep Test', role: 'mid', capabilities: ['coding'] });

      const member = useACPStore.getState().organization.members.find(m => m.name === 'Rep Test')!;

      // Try to go above 100
      updateReputation(member.id, 200);
      expect(useACPStore.getState().organization.members.find(m => m.id === member.id)?.reputation).toBeLessThanOrEqual(100);

      // Try to go below 0
      updateReputation(member.id, -200);
      expect(useACPStore.getState().organization.members.find(m => m.id === member.id)?.reputation).toBeGreaterThanOrEqual(0);
    });

    it('should add a department', () => {
      const { addDepartment } = useACPStore.getState();
      const ceoId = useACPStore.getState().organization.members.find(m => m.role === 'ceo')!.id;

      addDepartment({ name: '测试部', headId: ceoId, budget: 30000 });

      const { organization } = useACPStore.getState();
      const dept = organization.departments.find(d => d.name === '测试部');
      expect(dept).toBeDefined();
      expect(dept?.head).toBe(ceoId);
      expect(dept?.budget).toBe(30000);
    });
  });

  // ============ 任务操作 ============

  describe('Tasks', () => {
    it('should have valid initial tasks', () => {
      const { tasks } = useACPStore.getState();
      expect(tasks.length).toBeGreaterThan(0);
      tasks.forEach(task => {
        expect(task.id).toBeDefined();
        expect(task.title).toBeDefined();
        expect(task.priority).toMatch(/^P[0-3]$/);
        expect(task.progress).toBeGreaterThanOrEqual(0);
        expect(task.progress).toBeLessThanOrEqual(100);
      });
    });

    it('should create a new task', () => {
      const { addTask } = useACPStore.getState();
      addTask({
        title: '新测试任务',
        description: '测试任务描述',
        priority: 'P1',
        estimatedTime: 120,
      });

      const { tasks } = useACPStore.getState();
      const newTask = tasks.find(t => t.title === '新测试任务');
      expect(newTask).toBeDefined();
      expect(newTask?.status).toBe('pending');
      expect(newTask?.progress).toBe(0);
    });

    it('should update a task', () => {
      const { addTask, updateTask } = useACPStore.getState();
      addTask({ title: '更新测试', description: '', priority: 'P2', estimatedTime: 60 });

      const taskId = useACPStore.getState().tasks.find(t => t.title === '更新测试')!.id;
      updateTask(taskId, { progress: 50, status: 'in_progress' });

      const task = useACPStore.getState().tasks.find(t => t.id === taskId);
      expect(task?.progress).toBe(50);
      expect(task?.status).toBe('in_progress');
    });

    it('should delete a task', () => {
      const { addTask, deleteTask } = useACPStore.getState();
      addTask({ title: '删除测试', description: '', priority: 'P3', estimatedTime: 30 });

      const taskId = useACPStore.getState().tasks.find(t => t.title === '删除测试')!.id;
      deleteTask(taskId);

      expect(useACPStore.getState().tasks.find(t => t.id === taskId)).toBeUndefined();
    });

    it('should assign task to member', () => {
      const { addTask, assignTask } = useACPStore.getState();
      addTask({ title: '分配测试', description: '', priority: 'P1', estimatedTime: 60 });

      const taskId = useACPStore.getState().tasks.find(t => t.title === '分配测试')!.id;
      const idleMember = useACPStore.getState().organization.members.find(m => m.status === 'idle')!;

      assignTask(taskId, idleMember.id);

      const task = useACPStore.getState().tasks.find(t => t.id === taskId);
      const member = useACPStore.getState().organization.members.find(m => m.id === idleMember.id);

      expect(task?.assignee).toBe(idleMember.id);
      expect(task?.status).toBe('in_progress');
      expect(member?.status).toBe('busy');
    });

    it('should unassign task from member', () => {
      const { addTask, assignTask, unassignTask } = useACPStore.getState();
      addTask({ title: '取消分配测试', description: '', priority: 'P1', estimatedTime: 60 });

      const taskId = useACPStore.getState().tasks.find(t => t.title === '取消分配测试')!.id;
      const idleMember = useACPStore.getState().organization.members.find(m => m.status === 'idle')!;

      assignTask(taskId, idleMember.id);
      unassignTask(taskId);

      const task = useACPStore.getState().tasks.find(t => t.id === taskId);
      const member = useACPStore.getState().organization.members.find(m => m.id === idleMember.id);

      expect(task?.assignee).toBeUndefined();
      expect(task?.status).toBe('pending');
      expect(member?.status).toBe('idle');
    });

    it('should clean up dependencies when deleting a task', () => {
      const { addTask, deleteTask } = useACPStore.getState();
      addTask({ title: '依赖任务A', description: '', priority: 'P1', estimatedTime: 60 });
      addTask({ title: '依赖任务B', description: '', priority: 'P1', estimatedTime: 60, dependencies: [] });

      const taskA = useACPStore.getState().tasks.find(t => t.title === '依赖任务A')!;
      const taskB = useACPStore.getState().tasks.find(t => t.title === '依赖任务B')!;

      // Make B depend on A
      useACPStore.getState().updateTask(taskB.id, { dependencies: [taskA.id] });

      // Delete A
      deleteTask(taskA.id);

      // B's dependencies should be cleaned
      const updatedB = useACPStore.getState().tasks.find(t => t.id === taskB.id);
      expect(updatedB?.dependencies).not.toContain(taskA.id);
    });
  });

  // ============ 消息操作 ============

  describe('Messages', () => {
    it('should send a message', () => {
      const { sendMessage, organization } = useACPStore.getState();
      const [from, to] = [organization.members[0].id, organization.members[1].id];

      sendMessage(from, to, 'request', '请协助处理任务');

      const { messages } = useACPStore.getState();
      expect(messages.length).toBe(1);
      expect(messages[0].from).toBe(from);
      expect(messages[0].to).toBe(to);
      expect(messages[0].type).toBe('request');
      expect(messages[0].content).toBe('请协助处理任务');
    });
  });

  // ============ 知识图谱操作 ============

  describe('Knowledge', () => {
    it('should have valid initial knowledge nodes', () => {
      const { knowledgeNodes } = useACPStore.getState();
      expect(knowledgeNodes.length).toBeGreaterThan(0);
      knowledgeNodes.forEach(node => {
        expect(node.id).toBeDefined();
        expect(node.name).toBeDefined();
        expect(['file', 'function', 'class', 'concept', 'decision']).toContain(node.type);
      });
    });

    it('should add a knowledge node', () => {
      const { addKnowledgeNode } = useACPStore.getState();
      addKnowledgeNode({
        type: 'function',
        name: 'testFunction',
        description: '测试函数',
        connections: ['kn-001'],
      });

      const { knowledgeNodes } = useACPStore.getState();
      const node = knowledgeNodes.find(n => n.name === 'testFunction');
      expect(node).toBeDefined();
      expect(node?.type).toBe('function');
      expect(node?.connections).toContain('kn-001');
    });

    it('should delete a knowledge node and clean up references', () => {
      const { addKnowledgeNode, deleteKnowledgeNode } = useACPStore.getState();
      addKnowledgeNode({ type: 'concept', name: 'toDelete', description: '', connections: [] });

      const nodeId = useACPStore.getState().knowledgeNodes.find(n => n.name === 'toDelete')!.id;
      // Make another node reference this one
      useACPStore.getState().addKnowledgeNode({ type: 'concept', name: 'referrer', description: '', connections: [nodeId] });

      deleteKnowledgeNode(nodeId);

      expect(useACPStore.getState().knowledgeNodes.find(n => n.id === nodeId)).toBeUndefined();
      // Referrer should have the connection cleaned
      const referrer = useACPStore.getState().knowledgeNodes.find(n => n.name === 'referrer');
      expect(referrer?.connections).not.toContain(nodeId);
    });
  });

  // ============ 评估操作 ============

  describe('Evaluation', () => {
    it('should have valid initial evaluation', () => {
      const { evaluation, evaluationScores } = useACPStore.getState();
      expect(evaluation.totalScore).toBeGreaterThanOrEqual(0);
      expect(evaluation.totalScore).toBeLessThanOrEqual(100);
      expect(evaluationScores.length).toBeGreaterThan(0);
      expect(evaluation.strengths.length).toBeGreaterThan(0);
      expect(evaluation.weaknesses.length).toBeGreaterThan(0);
      expect(evaluation.recommendations.length).toBeGreaterThan(0);
    });

    it('should update a score and recalculate', () => {
      const { updateScore, evaluationScores } = useACPStore.getState();
      const initialTotal = useACPStore.getState().evaluation.totalScore;

      const firstDim = evaluationScores[0].dimension;
      updateScore(firstDim, 100);

      const newTotal = useACPStore.getState().evaluation.totalScore;
      expect(newTotal).toBeGreaterThanOrEqual(initialTotal);
    });

    it('should recalculate evaluation correctly', () => {
      // Set all scores to max
      const { evaluationScores } = useACPStore.getState();
      evaluationScores.forEach(s => {
        useACPStore.getState().updateScore(s.dimension, s.max);
      });
      useACPStore.getState().recalculateEvaluation();

      const { evaluation } = useACPStore.getState();
      expect(evaluation.totalScore).toBe(100);
      expect(evaluation.rating).toBe('exceptional');
    });
  });

  // ============ 日志操作 ============

  describe('Logs', () => {
    it('should add log entries', () => {
      const { addLog } = useACPStore.getState();
      addLog('info', '测试日志');
      addLog('warn', '警告日志');
      addLog('error', '错误日志');

      const { logs } = useACPStore.getState();
      expect(logs.length).toBe(3);
      expect(logs[0].level).toBe('error'); // newest first
      expect(logs[1].level).toBe('warn');
      expect(logs[2].level).toBe('info');
    });

    it('should limit logs to 200 entries', () => {
      const { addLog } = useACPStore.getState();
      for (let i = 0; i < 250; i++) {
        addLog('info', `Log ${i}`);
      }

      const { logs } = useACPStore.getState();
      expect(logs.length).toBeLessThanOrEqual(200);
    });

    it('should clear logs', () => {
      const { addLog, clearLogs } = useACPStore.getState();
      addLog('info', 'test');
      clearLogs();

      expect(useACPStore.getState().logs.length).toBe(0);
    });
  });

  // ============ 统计数据 ============

  describe('Stats', () => {
    it('should calculate correct stats', () => {
      const { organization, tasks, messages } = useACPStore.getState();
      const stats = calculateStats(organization.members, tasks, messages);

      expect(stats.activeAgents).toBe(organization.members.filter(m => m.status !== 'offline').length);
      expect(stats.busyAgents).toBe(organization.members.filter(m => m.status === 'busy').length);
      expect(stats.idleAgents).toBe(organization.members.filter(m => m.status === 'idle').length);
      expect(stats.completedTasks).toBe(tasks.filter(t => t.status === 'completed').length);
      expect(stats.pendingTasks).toBe(tasks.filter(t => t.status === 'pending').length);
      expect(stats.avgProgress).toBeGreaterThanOrEqual(0);
      expect(stats.avgProgress).toBeLessThanOrEqual(100);
    });
  });

  // ============ 模拟引擎 ============

  describe('Simulation', () => {
    it('should toggle simulation state', () => {
      const { toggleSimulation } = useACPStore.getState();
      expect(useACPStore.getState().isSimulating).toBe(false);

      toggleSimulation();
      expect(useACPStore.getState().isSimulating).toBe(true);

      toggleSimulation();
      expect(useACPStore.getState().isSimulating).toBe(false);
    });

    it('should run scheduler tick', () => {
      const { runSchedulerTick } = useACPStore.getState();
      runSchedulerTick();

      const { lastSchedulerResult } = useACPStore.getState();
      expect(lastSchedulerResult).toBeDefined();
      expect(lastSchedulerResult!.timestamp).toBeGreaterThan(0);
    });
  });
});
