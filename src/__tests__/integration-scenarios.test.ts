/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, beforeEach, expect } from 'vitest';
import { useACPStore } from '../store/acpStore';

describe('Integration Scenarios', () => {
  beforeEach(() => {
    useACPStore.setState(useACPStore.getInitialState());
  });

  // ========== 场景1: 完整任务生命周期 ==========
  it('场景1: 完整任务生命周期 — 添加成员→创建任务→分配→推进进度→完成→验证Agent释放', () => {
    const store = useACPStore.getState();

    // 1. 添加成员
    store.addMember({
      name: 'TestAgent1',
      role: 'mid',
      capabilities: ['开发', '测试'],
    });
    let state = useACPStore.getState();
    const memberId = state.organization.members.find(m => m.name === 'TestAgent1')!.id;
    expect(memberId).toBeTruthy();

    // 2. 创建任务
    store.addTask({
      title: '集成测试任务',
      description: '测试完整生命周期',
      priority: 'P1',
      estimatedTime: 120,
    });
    state = useACPStore.getState();
    const task = state.tasks.find(t => t.title === '集成测试任务')!;
    expect(task).toBeTruthy();
    expect(task.status).toBe('pending');

    // 3. 分配任务
    store.assignTask(task.id, memberId);
    state = useACPStore.getState();
    const assignedTask = state.tasks.find(t => t.id === task.id)!;
    const assignedMember = state.organization.members.find(m => m.id === memberId)!;
    expect(assignedTask.status).toBe('in_progress');
    expect(assignedTask.assignee).toBe(memberId);
    expect(assignedMember.status).toBe('busy');
    expect(assignedMember.currentTask).toBe(task.id);

    // 4. 模拟进度推进
    store.updateTask(task.id, { progress: 50 });
    state = useACPStore.getState();
    expect(state.tasks.find(t => t.id === task.id)!.progress).toBe(50);

    // 5. 完成任务
    store.updateTask(task.id, { progress: 100, status: 'completed' });
    state = useACPStore.getState();
    const completedTask = state.tasks.find(t => t.id === task.id)!;
    expect(completedTask.status).toBe('completed');
    expect(completedTask.progress).toBe(100);

    // 6. 验证 Agent 释放
    const freedMember = state.organization.members.find(m => m.id === memberId)!;
    expect(freedMember.status).toBe('idle');
    expect(freedMember.currentTask).toBeUndefined();
  });

  // ========== 场景2: 删除进行中的任务（僵尸 Agent 检测） ==========
  it('场景2: 删除进行中的任务 — 创建→分配→删除→检查成员状态', () => {
    const store = useACPStore.getState();

    // 添加成员
    store.addMember({
      name: 'ZombieAgent',
      role: 'junior',
      capabilities: ['测试'],
    });
    let state = useACPStore.getState();
    const memberId = state.organization.members.find(m => m.name === 'ZombieAgent')!.id;

    // 创建任务
    store.addTask({
      title: '将被删除的任务',
      description: '测试僵尸Agent',
      priority: 'P2',
      estimatedTime: 60,
    });
    state = useACPStore.getState();
    const taskId = state.tasks.find(t => t.title === '将被删除的任务')!.id;

    // 分配任务
    store.assignTask(taskId, memberId);
    state = useACPStore.getState();
    expect(state.organization.members.find(m => m.id === memberId)!.status).toBe('busy');

    // 删除进行中的任务
    store.deleteTask(taskId);
    state = useACPStore.getState();

    // 验证任务已删除
    expect(state.tasks.find(t => t.id === taskId)).toBeUndefined();

    // 验证成员被释放为 idle（FIX #29: 删除进行中任务时释放Agent）
    const freedMember = state.organization.members.find(m => m.id === memberId)!;
    expect(freedMember.status).toBe('idle');
    expect(freedMember.currentTask).toBeUndefined();
  });

  // ========== 场景3: 成员删除的级联清理 ==========
  it('场景3: 成员删除的级联清理 — 添加成员→创建任务并分配→发送消息→删除成员', () => {
    const store = useACPStore.getState();

    // 添加两个成员
    store.addMember({
      name: 'CascadeMember1',
      role: 'mid',
      capabilities: ['开发'],
    });
    store.addMember({
      name: 'CascadeMember2',
      role: 'mid',
      capabilities: ['测试'],
    });
    let state = useACPStore.getState();
    const member1 = state.organization.members.find(m => m.name === 'CascadeMember1')!;
    const member2 = state.organization.members.find(m => m.name === 'CascadeMember2')!;

    // 创建任务并分配给 member1
    store.addTask({
      title: '级联测试任务',
      description: '测试级联清理',
      priority: 'P1',
      estimatedTime: 100,
    });
    state = useACPStore.getState();
    const taskId = state.tasks.find(t => t.title === '级联测试任务')!.id;
    store.assignTask(taskId, member1.id);

    // 发送消息 member2 -> member1
    store.sendMessage(member2.id, member1.id, 'request', '请协助完成任务');
    state = useACPStore.getState();
    expect(state.messages.length).toBe(1);

    // 删除 member1
    store.removeMember(member1.id);
    state = useACPStore.getState();

    // 验证：任务 assignee 被清除，状态变为 pending
    const updatedTask = state.tasks.find(t => t.id === taskId)!;
    expect(updatedTask.assignee).toBeUndefined();
    expect(updatedTask.status).toBe('pending');

    // 验证：消息被删除
    const relatedMessages = state.messages.filter(
      m => m.from === member1.id || m.to === member1.id
    );
    expect(relatedMessages.length).toBe(0);

    // 验证：成员已移除
    expect(state.organization.members.find(m => m.id === member1.id)).toBeUndefined();
  });

  // ========== 场景4: 部门负责人删除 ==========
  it('场景4: 部门负责人删除 — 添加部门并指定负责人→删除该负责人', () => {
    const store = useACPStore.getState();

    // 添加一个新成员作为部门负责人
    store.addMember({
      name: 'DeptHead',
      role: 'manager',
      capabilities: ['管理', '协调'],
    });
    let state = useACPStore.getState();
    const headId = state.organization.members.find(m => m.name === 'DeptHead')!.id;

    // 添加新部门，指定该成员为负责人
    store.addDepartment({
      name: '测试部门',
      headId: headId,
      budget: 50000,
    });
    state = useACPStore.getState();
    const dept = state.organization.departments.find(d => d.name === '测试部门')!;
    expect(dept).toBeTruthy();
    expect(dept.head).toBe(headId);

    // 删除负责人
    store.removeMember(headId);
    state = useACPStore.getState();

    // 验证：部门 head 应被清空
    const updatedDept = state.organization.departments.find(d => d.name === '测试部门')!;
    expect(updatedDept.head).toBe('');
  });

  // ========== 场景5: 快速连续 toggle 模拟（竞态检测） ==========
  it('场景5: 快速连续 toggleSimulation 5次 — 检查最终状态一致性', () => {
    // 初始状态应为 false
    expect(useACPStore.getState().isSimulating).toBe(false);

    // 连续 toggle 5 次（奇数次，最终应为 false）
    for (let i = 0; i < 5; i++) {
      useACPStore.getState().toggleSimulation();
    }

    // 验证：最终 isSimulating 应为 true（从 false 开始 toggle 5 次：false→true→false→true→false→true）
    expect(useACPStore.getState().isSimulating).toBe(true);
  });

  // ========== 场景6: 评分公式一致性 ==========
  it('场景6: 评分公式一致性 — updateScore 与 recalculateEvaluation 结果一致', () => {
    const store = useACPStore.getState();

    // 记录当前 totalScore
    const beforeScore = useACPStore.getState().evaluation.totalScore;

    // 修改某个维度的值
    store.updateScore('创新性', 95);

    // 获取 updateScore 后的 totalScore
    const scoreAfterUpdate = useACPStore.getState().evaluation.totalScore;

    // 调用 recalculateEvaluation
    useACPStore.getState().recalculateEvaluation();

    // 获取 recalculateEvaluation 后的 totalScore
    const scoreAfterRecalc = useACPStore.getState().evaluation.totalScore;

    // 验证：两者应该一致（因为公式已统一为归一化版本，FIX #40）
    expect(scoreAfterUpdate).toBe(scoreAfterRecalc);

    // 额外验证：修改后的分数应与修改前不同
    expect(scoreAfterUpdate).not.toBe(beforeScore);
  });

  // ========== 场景7: 阻塞任务解除 ==========
  it('场景7: 阻塞任务解除 — A完成→runSchedulerTick→B从blocked变为pending', () => {
    const store = useACPStore.getState();

    // 添加一个成员
    store.addMember({
      name: 'BlockAgent',
      role: 'mid',
      capabilities: ['开发'],
    });
    let state = useACPStore.getState();
    const memberId = state.organization.members.find(m => m.name === 'BlockAgent')!.id;

    // 创建任务 A
    store.addTask({
      title: '任务A（前置）',
      description: '前置任务',
      priority: 'P1',
      estimatedTime: 60,
    });
    state = useACPStore.getState();
    const taskA = state.tasks.find(t => t.title === '任务A（前置）')!;

    // 创建任务 B，依赖 A
    store.addTask({
      title: '任务B（依赖A）',
      description: '依赖任务A',
      priority: 'P1',
      estimatedTime: 60,
      dependencies: [taskA.id],
    });
    state = useACPStore.getState();
    const taskB = state.tasks.find(t => t.title === '任务B（依赖A）')!;

    // 手动将 B 设为 blocked（因为 A 尚未完成）
    store.updateTask(taskB.id, { status: 'blocked' });
    state = useACPStore.getState();
    expect(state.tasks.find(t => t.id === taskB.id)!.status).toBe('blocked');

    // 完成 A
    store.assignTask(taskA.id, memberId);
    store.updateTask(taskA.id, { progress: 100, status: 'completed' });
    state = useACPStore.getState();
    expect(state.tasks.find(t => t.id === taskA.id)!.status).toBe('completed');

    // 运行调度器 tick — 应解除 B 的阻塞（FIX #56）
    useACPStore.getState().runSchedulerTick();
    state = useACPStore.getState();

    // 验证：B.status 应为 pending
    const updatedB = state.tasks.find(t => t.id === taskB.id)!;
    expect(updatedB.status).toBe('pending');
  });

  // ========== 场景8: 知识图谱连接验证 ==========
  it('场景8: 知识图谱连接验证 — 添加连接到不存在节点的知识节点应被拒绝', () => {
    const store = useACPStore.getState();

    const beforeCount = useACPStore.getState().knowledgeNodes.length;

    // 尝试添加一个包含无效连接的节点
    store.addKnowledgeNode({
      type: 'concept',
      name: '测试节点',
      description: '包含无效连接',
      connections: ['non-existent-node-id'],
    });

    const afterCount = useACPStore.getState().knowledgeNodes.length;

    // 验证：节点应被拒绝创建（因为包含无效连接 ID）
    expect(afterCount).toBe(beforeCount);

    // 额外验证：knowledgeNodes 中不包含该节点
    const testNode = useACPStore.getState().knowledgeNodes.find(n => n.name === '测试节点');
    expect(testNode).toBeUndefined();
  });

  // ========== 场景9: 消息发送验证 ==========
  it('场景9: 消息发送验证 — 发送消息给不存在的成员应被拒绝', () => {
    const store = useACPStore.getState();

    const beforeCount = useACPStore.getState().messages.length;

    // 获取一个存在的成员作为发送方
    const existingMember = useACPStore.getState().organization.members[0];

    // 尝试发送消息给不存在的成员
    store.sendMessage(existingMember.id, 'non-existent-member-id', 'request', '你好');

    const afterCount = useACPStore.getState().messages.length;

    // 验证：messages 数组不应增长
    expect(afterCount).toBe(beforeCount);
  });

  // ========== 场景10: 调度器配置验证 ==========
  it('场景10: 调度器配置验证 — 无效权重（负数、大于1）应被拒绝', () => {
    const store = useACPStore.getState();

    const configBefore = { ...useACPStore.getState().schedulerConfig };

    // 尝试设置负数权重
    store.setSchedulerConfig({
      ...configBefore,
      capabilityWeight: -0.5,
    });
    expect(useACPStore.getState().schedulerConfig.capabilityWeight).toBe(configBefore.capabilityWeight);

    // 尝试设置大于 1 的权重
    store.setSchedulerConfig({
      ...configBefore,
      reputationWeight: 1.5,
    });
    expect(useACPStore.getState().schedulerConfig.reputationWeight).toBe(configBefore.reputationWeight);

    // 尝试设置 NaN
    store.setSchedulerConfig({
      ...configBefore,
      workloadWeight: NaN,
    });
    expect(useACPStore.getState().schedulerConfig.workloadWeight).toBe(configBefore.workloadWeight);

    // 验证：schedulerConfig 整体不应改变
    const configAfter = useACPStore.getState().schedulerConfig;
    expect(configAfter.capabilityWeight).toBe(configBefore.capabilityWeight);
    expect(configAfter.reputationWeight).toBe(configBefore.reputationWeight);
    expect(configAfter.workloadWeight).toBe(configBefore.workloadWeight);
    expect(configAfter.priorityWeight).toBe(configBefore.priorityWeight);
  });

  // ========== 场景11: addTask 带 assignee 的状态同步 ==========
  it('场景11: addTask 带 assignee 的状态同步 — 成员应自动变为 busy', () => {
    const store = useACPStore.getState();

    // 添加一个 idle 成员
    store.addMember({
      name: 'DirectAssignAgent',
      role: 'senior',
      capabilities: ['架构', '开发'],
    });
    let state = useACPStore.getState();
    const memberId = state.organization.members.find(m => m.name === 'DirectAssignAgent')!.id;
    expect(state.organization.members.find(m => m.id === memberId)!.status).toBe('idle');

    // 创建任务并直接指定该成员为 assignee（FIX #23）
    store.addTask({
      title: '直接分配任务',
      description: '创建时直接指定assignee',
      priority: 'P0',
      estimatedTime: 200,
      assignee: memberId,
    });
    state = useACPStore.getState();

    // 验证：成员 status 应为 busy，currentTask 应为新任务 ID
    const updatedMember = state.organization.members.find(m => m.id === memberId)!;
    expect(updatedMember.status).toBe('busy');
    expect(updatedMember.currentTask).toBeTruthy();

    // 验证：任务状态应为 in_progress
    const newTask = state.tasks.find(t => t.title === '直接分配任务')!;
    expect(newTask.status).toBe('in_progress');
    expect(newTask.assignee).toBe(memberId);
    expect(updatedMember.currentTask).toBe(newTask.id);
  });

  // ========== 场景12: updateTask 状态回退释放 Agent ==========
  it('场景12: updateTask 状态回退释放 Agent — in_progress→pending 应释放 Agent', () => {
    const store = useACPStore.getState();

    // 添加成员
    store.addMember({
      name: 'RollbackAgent',
      role: 'mid',
      capabilities: ['开发'],
    });
    let state = useACPStore.getState();
    const memberId = state.organization.members.find(m => m.name === 'RollbackAgent')!.id;

    // 创建并分配任务
    store.addTask({
      title: '回退测试任务',
      description: '测试状态回退',
      priority: 'P1',
      estimatedTime: 100,
    });
    state = useACPStore.getState();
    const taskId = state.tasks.find(t => t.title === '回退测试任务')!.id;

    store.assignTask(taskId, memberId);
    state = useACPStore.getState();
    expect(state.organization.members.find(m => m.id === memberId)!.status).toBe('busy');

    // 将任务状态改为 pending（模拟回退）
    store.updateTask(taskId, { status: 'pending' });
    state = useACPStore.getState();

    // 验证：Agent 应被释放为 idle（FIX #27）
    const freedMember = state.organization.members.find(m => m.id === memberId)!;
    expect(freedMember.status).toBe('idle');
    expect(freedMember.currentTask).toBeUndefined();

    // 验证：任务状态确实变为 pending
    expect(state.tasks.find(t => t.id === taskId)!.status).toBe('pending');
  });
});
