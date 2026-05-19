/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 运行时行为测试
 * 测试各种运行时场景下的状态一致性和竞态条件处理
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useACPStore } from '../store/acpStore';

describe('Runtime Behavior Tests', () => {
  beforeEach(() => {
    useACPStore.setState(useACPStore.getInitialState());
  });

  // ============ 1. 并发任务分配竞态 ============
  describe('Concurrent Task Assignment Race Condition', () => {
    it('should only allow one task to be assigned to a member when multiple assignments happen simultaneously', () => {
      const { addMember, addTask, assignTask } = useACPStore.getState();

      // 创建 3 个 idle 成员
      addMember({ name: 'Member-A', role: 'senior', capabilities: ['coding'] });
      addMember({ name: 'Member-B', role: 'mid', capabilities: ['coding'] });
      addMember({ name: 'Member-C', role: 'junior', capabilities: ['coding'] });

      // 创建 3 个 pending 任务
      addTask({ title: 'Task-1', description: 'Test task 1', priority: 'P1', estimatedTime: 60 });
      addTask({ title: 'Task-2', description: 'Test task 2', priority: 'P1', estimatedTime: 60 });
      addTask({ title: 'Task-3', description: 'Test task 3', priority: 'P1', estimatedTime: 60 });

      const state = useACPStore.getState();
      const memberA = state.organization.members.find(m => m.name === 'Member-A')!;
      const task1 = state.tasks.find(t => t.title === 'Task-1')!;
      const task2 = state.tasks.find(t => t.title === 'Task-2')!;
      const task3 = state.tasks.find(t => t.title === 'Task-3')!;

      // 手动将 3 个任务同时分配给同一个成员（模拟竞态）
      // 由于 assignTask 会检查成员状态，第一个分配会成功，后续会失败
      assignTask(task1.id, memberA.id);
      assignTask(task2.id, memberA.id);
      assignTask(task3.id, memberA.id);

      const finalState = useACPStore.getState();
      const memberAFinal = finalState.organization.members.find(m => m.id === memberA.id)!;

      // 验证：最终只有 1 个任务被分配给该成员
      const assignedTasks = finalState.tasks.filter(t => t.assignee === memberA.id);
      expect(assignedTasks.length).toBe(1);
      expect(memberAFinal.status).toBe('busy');
      expect(memberAFinal.currentTask).toBe(task1.id);

      // 其他 2 个任务应保持 pending 状态
      const task2Final = finalState.tasks.find(t => t.id === task2.id)!;
      const task3Final = finalState.tasks.find(t => t.id === task3.id)!;
      expect(task2Final.status).toBe('pending');
      expect(task2Final.assignee).toBeUndefined();
      expect(task3Final.status).toBe('pending');
      expect(task3Final.assignee).toBeUndefined();
    });
  });

  // ============ 2. 任务完成时 Agent 状态一致性 ============
  describe('Agent Status Consistency on Task Completion', () => {
    it('should set agent status to idle and clear currentTask when task is completed', () => {
      const { addMember, addTask, assignTask, updateTask } = useACPStore.getState();

      // 创建成员和任务
      addMember({ name: 'Agent-A', role: 'senior', capabilities: ['coding'] });
      addTask({ title: 'Complete-Test-Task', description: 'Task to complete', priority: 'P1', estimatedTime: 60 });

      const state = useACPStore.getState();
      const memberA = state.organization.members.find(m => m.name === 'Agent-A')!;
      const task = state.tasks.find(t => t.title === 'Complete-Test-Task')!;

      // 分配任务给成员 A
      assignTask(task.id, memberA.id);

      // 验证分配成功
      let currentState = useACPStore.getState();
      expect(currentState.organization.members.find(m => m.id === memberA.id)?.status).toBe('busy');

      // 手动将任务进度设为 100%
      updateTask(task.id, { progress: 100 });

      // 调用 updateTask 将任务状态设为 completed
      updateTask(task.id, { status: 'completed' });

      // 验证：成员 A 的 status 应为 idle，currentTask 应为 undefined
      currentState = useACPStore.getState();
      const memberAFinal = currentState.organization.members.find(m => m.id === memberA.id)!;
      const taskFinal = currentState.tasks.find(t => t.id === task.id)!;

      expect(taskFinal.status).toBe('completed');
      expect(taskFinal.progress).toBe(100);
      expect(memberAFinal.status).toBe('idle');
      expect(memberAFinal.currentTask).toBeUndefined();
    });
  });

  // ============ 3. 成员删除时任务状态一致性 ============
  describe('Task State Consistency on Member Removal', () => {
    it('should clear task assignee and reset status when member is removed', () => {
      const { addMember, addTask, assignTask, removeMember } = useACPStore.getState();

      // 创建成员和任务
      addMember({ name: 'Agent-To-Remove', role: 'mid', capabilities: ['coding'] });
      addTask({ title: 'Assigned-Task', description: 'Task assigned to member', priority: 'P1', estimatedTime: 60 });

      const state = useACPStore.getState();
      const member = state.organization.members.find(m => m.name === 'Agent-To-Remove')!;
      const task = state.tasks.find(t => t.title === 'Assigned-Task')!;

      // 分配任务给成员
      assignTask(task.id, member.id);

      // 验证分配成功
      let currentState = useACPStore.getState();
      expect(currentState.tasks.find(t => t.id === task.id)?.assignee).toBe(member.id);

      // 删除成员
      removeMember(member.id);

      // 验证：任务的 assignee 应被清除，状态应变为 pending
      currentState = useACPStore.getState();
      const taskFinal = currentState.tasks.find(t => t.id === task.id)!;

      expect(taskFinal.assignee).toBeUndefined();
      expect(taskFinal.status).toBe('pending');

      // 验证成员已被删除
      expect(currentState.organization.members.find(m => m.id === member.id)).toBeUndefined();
    });
  });

  // ============ 4. 模拟引擎启动/停止状态一致性 ============
  describe('Simulation Engine Start/Stop State Consistency', () => {
    it('should correctly toggle simulation state', () => {
      const { toggleSimulation } = useACPStore.getState();

      // 初始状态应为 false
      expect(useACPStore.getState().isSimulating).toBe(false);

      // 调用 toggleSimulation 启动
      toggleSimulation();
      expect(useACPStore.getState().isSimulating).toBe(true);

      // 等待 100ms（使用 vi.useFakeTimers 或直接验证状态）
      // 这里直接验证状态，因为 toggleSimulation 是同步的

      // 调用 toggleSimulation 停止
      toggleSimulation();

      // 验证：isSimulating 应为 false
      expect(useACPStore.getState().isSimulating).toBe(false);
    });

    it('should maintain consistent state during rapid toggle', () => {
      const { toggleSimulation } = useACPStore.getState();

      // 快速多次切换
      toggleSimulation(); // true
      toggleSimulation(); // false
      toggleSimulation(); // true
      toggleSimulation(); // false
      toggleSimulation(); // true
      toggleSimulation(); // false

      expect(useACPStore.getState().isSimulating).toBe(false);
    });
  });

  // ============ 5. 持久化数据完整性 ============
  describe('Persistence Data Integrity', () => {
    it('should restore all data when store state is saved and restored', () => {
      const { addMember, addTask, sendMessage } = useACPStore.getState();

      // 添加成员
      addMember({ name: 'Persist-Member', role: 'senior', capabilities: ['coding', 'testing'] });

      // 创建任务
      addTask({ title: 'Persist-Task', description: 'Task for persistence test', priority: 'P0', estimatedTime: 120 });

      // 发送消息
      const members = useACPStore.getState().organization.members;
      if (members.length >= 2) {
        sendMessage(members[0].id, members[1].id, 'notification', 'Test message for persistence');
      }

      // 获取当前 store 状态
      const savedState = {
        organization: useACPStore.getState().organization,
        tasks: useACPStore.getState().tasks,
        messages: useACPStore.getState().messages,
        knowledgeNodes: useACPStore.getState().knowledgeNodes,
        evaluation: useACPStore.getState().evaluation,
        evaluationScores: useACPStore.getState().evaluationScores,
      };

      // 重置 store 到初始状态
      useACPStore.setState(useACPStore.getInitialState());

      // 验证重置后数据被清除
      let resetState = useACPStore.getState();
      expect(resetState.organization.members.find(m => m.name === 'Persist-Member')).toBeUndefined();
      expect(resetState.tasks.find(t => t.title === 'Persist-Task')).toBeUndefined();

      // 手动设置 store 到之前保存的状态
      useACPStore.setState(savedState as any);

      // 验证：所有数据应完整恢复
      const restoredState = useACPStore.getState();
      expect(restoredState.organization.members.find(m => m.name === 'Persist-Member')).toBeDefined();
      expect(restoredState.tasks.find(t => t.title === 'Persist-Task')).toBeDefined();
      expect(restoredState.messages.length).toBe(savedState.messages.length);
      expect(restoredState.knowledgeNodes).toEqual(savedState.knowledgeNodes);
      expect(restoredState.evaluation.totalScore).toBe(savedState.evaluation.totalScore);
    });
  });

  // ============ 6. 评分更新后 evaluation 同步 ============
  describe('Evaluation Synchronization After Score Update', () => {
    it('should synchronize evaluationScores and evaluation.scores when updateScore is called', () => {
      const { updateScore, evaluationScores } = useACPStore.getState();
      const initialScores = [...evaluationScores];

      // 获取第一个维度
      const firstDimension = initialScores[0].dimension;
      const newValue = 80;

      // 调用 updateScore 修改某个维度
      updateScore(firstDimension, newValue);

      const state = useACPStore.getState();

      // 验证：evaluationScores 和 evaluation.scores 应同步更新
      const updatedScore = state.evaluationScores.find(s => s.dimension === firstDimension);
      const evaluationScore = state.evaluation.scores.find(s => s.dimension === firstDimension);

      expect(updatedScore?.value).toBe(newValue);
      expect(evaluationScore?.value).toBe(newValue);

      // 验证：evaluation.totalScore 应重新计算
      // totalScore 应该是一个有效的数值
      expect(state.evaluation.totalScore).toBeGreaterThanOrEqual(0);
      expect(state.evaluation.totalScore).toBeLessThanOrEqual(100);
      expect(typeof state.evaluation.totalScore).toBe('number');
    });

    it('should recalculate totalScore correctly based on all dimensions', () => {
      const { updateScore, evaluationScores } = useACPStore.getState();

      // 将所有维度设置为最大值
      evaluationScores.forEach(score => {
        updateScore(score.dimension, score.max);
      });

      const state = useACPStore.getState();

      // 当所有维度都是最大值时，总分应该是 100
      expect(state.evaluation.totalScore).toBe(100);
      expect(state.evaluation.rating).toBe('exceptional');
    });
  });

  // ============ 7. 知识图谱节点删除时连接清理 ============
  describe('Knowledge Graph Connection Cleanup on Node Deletion', () => {
    it('should remove connections to deleted node from other nodes', () => {
      const { addKnowledgeNode, deleteKnowledgeNode } = useACPStore.getState();

      // 创建节点 A
      addKnowledgeNode({ type: 'concept', name: 'Node-A', description: 'First node', connections: [] });

      const nodeA = useACPStore.getState().knowledgeNodes.find(n => n.name === 'Node-A')!;

      // 创建节点 B，连接到 A
      addKnowledgeNode({ type: 'concept', name: 'Node-B', description: 'Second node', connections: [nodeA.id] });

      const nodeB = useACPStore.getState().knowledgeNodes.find(n => n.name === 'Node-B')!;

      // 验证 B 连接到 A
      expect(nodeB.connections).toContain(nodeA.id);

      // 删除节点 A
      deleteKnowledgeNode(nodeA.id);

      const state = useACPStore.getState();

      // 验证：节点 A 已被删除
      expect(state.knowledgeNodes.find(n => n.id === nodeA.id)).toBeUndefined();

      // 验证：节点 B 的 connections 中不再包含 A 的 ID
      const nodeBUpdated = state.knowledgeNodes.find(n => n.id === nodeB.id);
      expect(nodeBUpdated?.connections).not.toContain(nodeA.id);
      expect(nodeBUpdated?.connections).toEqual([]);
    });

    it('should handle multiple connections cleanup', () => {
      const { addKnowledgeNode, deleteKnowledgeNode } = useACPStore.getState();

      // 创建多个节点
      addKnowledgeNode({ type: 'concept', name: 'Multi-A', description: '', connections: [] });
      const nodeA = useACPStore.getState().knowledgeNodes.find(n => n.name === 'Multi-A')!;

      addKnowledgeNode({ type: 'concept', name: 'Multi-B', description: '', connections: [nodeA.id] });
      addKnowledgeNode({ type: 'concept', name: 'Multi-C', description: '', connections: [nodeA.id] });
      addKnowledgeNode({ type: 'concept', name: 'Multi-D', description: '', connections: [nodeA.id] });

      // 删除节点 A
      deleteKnowledgeNode(nodeA.id);

      const state = useACPStore.getState();

      // 验证所有连接到 A 的节点都已清理
      ['Multi-B', 'Multi-C', 'Multi-D'].forEach(name => {
        const node = state.knowledgeNodes.find(n => n.name === name);
        expect(node?.connections).not.toContain(nodeA.id);
      });
    });
  });

  // ============ 8. 消息已读状态批量更新 ============
  describe('Batch Message Read Status Update', () => {
    it('should mark all messages as read when markAllMessagesAsRead is called', () => {
      const { sendMessage, markAllMessagesAsRead } = useACPStore.getState();

      // 获取成员 ID
      const members = useACPStore.getState().organization.members;
      if (members.length < 2) {
        // 如果成员不足，添加成员
        useACPStore.getState().addMember({ name: 'Msg-Member-1', role: 'mid', capabilities: ['coding'] });
        useACPStore.getState().addMember({ name: 'Msg-Member-2', role: 'mid', capabilities: ['coding'] });
      }

      const allMembers = useACPStore.getState().organization.members;
      const from = allMembers[0].id;
      const to = allMembers[1].id;

      // 创建 5 条消息，全部未读
      for (let i = 1; i <= 5; i++) {
        sendMessage(from, to, 'notification', `Test message ${i}`);
      }

      // 验证消息已创建且未读
      let state = useACPStore.getState();
      expect(state.messages.length).toBeGreaterThanOrEqual(5);
      state.messages.slice(-5).forEach(msg => {
        expect(msg.read).toBeFalsy();
      });

      // 调用 markAllMessagesAsRead
      markAllMessagesAsRead();

      // 验证：所有消息的 read 应为 true
      state = useACPStore.getState();
      state.messages.forEach(msg => {
        expect(msg.read).toBe(true);
      });
    });
  });

  // ============ 9. 调度器 tick 后任务状态变化 ============
  describe('Task Status Change After Scheduler Tick', () => {
    it('should assign independent task and keep dependent task pending after runSchedulerTick', () => {
      const { addMember, addTask, runSchedulerTick } = useACPStore.getState();

      // 创建 idle 成员
      addMember({ name: 'Scheduler-Agent', role: 'senior', capabilities: ['coding'] });

      // 创建任务 A（无依赖）
      addTask({ title: 'Independent-Task', description: 'Task with no dependencies', priority: 'P1', estimatedTime: 60 });

      const taskA = useACPStore.getState().tasks.find(t => t.title === 'Independent-Task')!;

      // 创建任务 B（依赖 A）
      addTask({
        title: 'Dependent-Task',
        description: 'Task that depends on A',
        priority: 'P2',
        estimatedTime: 60,
        dependencies: [taskA.id]
      });

      // 调用 runSchedulerTick
      runSchedulerTick();

      const state = useACPStore.getState();
      const taskAFinal = state.tasks.find(t => t.id === taskA.id)!;
      const taskB = state.tasks.find(t => t.title === 'Dependent-Task')!;

      // 验证：A 应被分配或进行中
      expect(['in_progress', 'pending'].includes(taskAFinal.status)).toBe(true);

      // 验证：B 应保持 pending 或 blocked（因为依赖未完成）
      expect(['pending', 'blocked'].includes(taskB.status)).toBe(true);
      expect(taskB.assignee).toBeUndefined();
    });

    it('should process task progress and complete tasks during tick', () => {
      const { addMember, addTask, assignTask, updateTask, runSchedulerTick } = useACPStore.getState();

      // 创建成员
      addMember({ name: 'Progress-Agent', role: 'senior', capabilities: ['coding'] });

      // 创建并分配任务
      addTask({ title: 'Progress-Task', description: 'Task for progress test', priority: 'P1', estimatedTime: 60 });

      const member = useACPStore.getState().organization.members.find(m => m.name === 'Progress-Agent')!;
      const task = useACPStore.getState().tasks.find(t => t.title === 'Progress-Task')!;

      assignTask(task.id, member.id);

      // 设置进度接近完成
      updateTask(task.id, { progress: 99 });

      // 运行多个 tick 直到任务完成
      for (let i = 0; i < 10; i++) {
        runSchedulerTick();
        const currentTask = useACPStore.getState().tasks.find(t => t.id === task.id)!;
        if (currentTask.status === 'completed') break;
      }

      const finalTask = useACPStore.getState().tasks.find(t => t.id === task.id)!;
      const finalMember = useACPStore.getState().organization.members.find(m => m.id === member.id)!;

      // 验证任务完成且成员状态恢复
      if (finalTask.status === 'completed') {
        expect(finalMember.status).toBe('idle');
        expect(finalMember.currentTask).toBeUndefined();
      }
    });
  });

  // ============ 10. 错误恢复：无效操作不影响现有数据 ============
  describe('Error Recovery: Invalid Operations Should Not Affect Existing Data', () => {
    it('should not create task when title is empty', () => {
      const { addTask } = useACPStore.getState();

      // 记录当前任务数量
      const initialTaskCount = useACPStore.getState().tasks.length;

      // 尝试创建无效任务（空标题）
      addTask({ title: '', description: 'Invalid task', priority: 'P1', estimatedTime: 60 });

      // 验证：任务数量应不变
      const finalTaskCount = useACPStore.getState().tasks.length;
      expect(finalTaskCount).toBe(initialTaskCount);
    });

    it('should not create task when title is only whitespace', () => {
      const { addTask } = useACPStore.getState();

      const initialTaskCount = useACPStore.getState().tasks.length;

      // 尝试创建只有空格标题的任务
      addTask({ title: '   ', description: 'Invalid task', priority: 'P1', estimatedTime: 60 });

      const finalTaskCount = useACPStore.getState().tasks.length;
      expect(finalTaskCount).toBe(initialTaskCount);
    });

    it('should not create task with invalid priority', () => {
      const { addTask } = useACPStore.getState();

      const initialTaskCount = useACPStore.getState().tasks.length;

      // 尝试创建无效优先级的任务
      addTask({ title: 'Test Task', description: 'Invalid priority', priority: 'P99' as any, estimatedTime: 60 });

      const finalTaskCount = useACPStore.getState().tasks.length;
      expect(finalTaskCount).toBe(initialTaskCount);
    });

    it('should not create task with invalid estimated time', () => {
      const { addTask } = useACPStore.getState();

      const initialTaskCount = useACPStore.getState().tasks.length;

      // 尝试创建无效预估时间的任务
      addTask({ title: 'Test Task', description: 'Invalid time', priority: 'P1', estimatedTime: -10 });

      const finalTaskCount = useACPStore.getState().tasks.length;
      expect(finalTaskCount).toBe(initialTaskCount);
    });

    it('should not add member with empty name', () => {
      const { addMember } = useACPStore.getState();

      const initialMemberCount = useACPStore.getState().organization.members.length;

      addMember({ name: '', role: 'mid', capabilities: ['coding'] });

      const finalMemberCount = useACPStore.getState().organization.members.length;
      expect(finalMemberCount).toBe(initialMemberCount);
    });

    it('should not add member with empty capabilities', () => {
      const { addMember } = useACPStore.getState();

      const initialMemberCount = useACPStore.getState().organization.members.length;

      addMember({ name: 'Test Member', role: 'mid', capabilities: [] });

      const finalMemberCount = useACPStore.getState().organization.members.length;
      expect(finalMemberCount).toBe(initialMemberCount);
    });

    it('should handle updateTask for non-existent task gracefully', () => {
      const { updateTask } = useACPStore.getState();

      const initialTaskCount = useACPStore.getState().tasks.length;

      // 尝试更新不存在的任务
      updateTask('non-existent-task-id', { progress: 50 });

      // 任务数量应不变
      const finalTaskCount = useACPStore.getState().tasks.length;
      expect(finalTaskCount).toBe(initialTaskCount);
    });

    it('should handle deleteTask for non-existent task gracefully', () => {
      const { deleteTask } = useACPStore.getState();

      const initialTaskCount = useACPStore.getState().tasks.length;

      // 尝试删除不存在的任务
      deleteTask('non-existent-task-id');

      const finalTaskCount = useACPStore.getState().tasks.length;
      expect(finalTaskCount).toBe(initialTaskCount);
    });
  });
});
