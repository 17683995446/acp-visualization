/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * ACP 压力和边界场景测试
 * 测试大量数据操作、边界条件和极端场景
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useACPStore } from '../store/acpStore';
import { TaskService } from '../services/TaskService';
import { CommunicationService } from '../services/CommunicationService';
import { OrganizationService } from '../services/OrganizationService';

// ============ 辅助函数 ============

/** 获取两个不同的成员 ID */
function getTwoMembers(): [string, string] | undefined {
  const members = useACPStore.getState().organization.members;
  if (members.length < 2) return undefined;
  return [members[0].id, members[1].id];
}

// ============ 测试套件 ============

describe('压力和边界场景测试', () => {
  beforeEach(() => {
    useACPStore.setState(useACPStore.getInitialState());
  });

  // ============ 1. 大量任务创建性能 ============
  describe('1. 大量任务创建性能', () => {
    it('循环创建 100 个任务，验证所有任务都被创建，执行时间应 < 1 秒', () => {
      const initialTaskCount = useACPStore.getState().tasks.length;
      const startTime = performance.now();

      // 循环创建 100 个任务
      for (let i = 0; i < 100; i++) {
        useACPStore.getState().addTask({
          title: `性能测试任务 ${i}`,
          description: `这是第 ${i} 个任务的描述`,
          priority: (['P0', 'P1', 'P2', 'P3'] as const)[i % 4],
          estimatedTime: 30 + i,
        });
      }

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // 验证所有任务都被创建
      const finalTaskCount = useACPStore.getState().tasks.length;
      expect(finalTaskCount).toBe(initialTaskCount + 100);

      // 验证执行时间 < 1 秒
      expect(executionTime).toBeLessThan(1000);

      // 验证所有任务都有有效的 ID 和属性
      const tasks = useACPStore.getState().tasks;
      const newTasks = tasks.filter(t => t.title.startsWith('性能测试任务'));
      expect(newTasks.length).toBe(100);

      // 验证没有重复 ID
      const idSet = new Set(newTasks.map(t => t.id));
      expect(idSet.size).toBe(100);
    });
  });

  // ============ 2. 大量成员操作性能 ============
  describe('2. 大量成员操作性能', () => {
    it('循环添加 50 个成员，验证所有成员都被添加', () => {
      const initialMemberCount = useACPStore.getState().organization.members.length;

      // 循环添加 50 个成员
      for (let i = 0; i < 50; i++) {
        useACPStore.getState().addMember({
          name: `测试成员 ${i}`,
          role: (['junior', 'mid', 'senior'] as const)[i % 3],
          capabilities: [`能力-${i}`, '测试'],
        });
      }

      const finalMemberCount = useACPStore.getState().organization.members.length;
      expect(finalMemberCount).toBe(initialMemberCount + 50);
    });

    it('循环删除 25 个成员，验证剩余成员数量正确', () => {
      // 先添加 50 个成员
      const addedMemberIds: string[] = [];
      for (let i = 0; i < 50; i++) {
        useACPStore.getState().addMember({
          name: `待删除成员 ${i}`,
          role: 'junior',
          capabilities: ['测试'],
        });
        const members = useACPStore.getState().organization.members;
        const newMember = members[members.length - 1];
        addedMemberIds.push(newMember.id);
      }

      const countAfterAdd = useACPStore.getState().organization.members.length;

      // 删除前 25 个新添加的成员
      for (let i = 0; i < 25; i++) {
        useACPStore.getState().removeMember(addedMemberIds[i]);
      }

      const finalMemberCount = useACPStore.getState().organization.members.length;
      expect(finalMemberCount).toBe(countAfterAdd - 25);

      // 验证被删除的成员确实不存在
      const remainingMembers = useACPStore.getState().organization.members;
      for (let i = 0; i < 25; i++) {
        expect(remainingMembers.find(m => m.id === addedMemberIds[i])).toBeUndefined();
      }

      // 验证未删除的成员仍然存在
      for (let i = 25; i < 50; i++) {
        expect(remainingMembers.find(m => m.id === addedMemberIds[i])).toBeDefined();
      }
    });
  });

  // ============ 3. 大量消息发送性能 ============
  describe('3. 大量消息发送性能', () => {
    it('循环发送 100 条消息，验证所有消息都被创建', () => {
      const twoMembers = getTwoMembers();
      expect(twoMembers).toBeDefined();
      const [fromId, toId] = twoMembers!;

      const initialMessageCount = useACPStore.getState().messages.length;

      // 循环发送 100 条消息
      for (let i = 0; i < 100; i++) {
        useACPStore.getState().sendMessage(
          i % 2 === 0 ? fromId : toId,
          i % 2 === 0 ? toId : fromId,
          (['notification', 'request', 'response'] as const)[i % 3],
          `测试消息内容 ${i}`
        );
      }

      const finalMessageCount = useACPStore.getState().messages.length;
      expect(finalMessageCount).toBe(initialMessageCount + 100);
    });

    it('验证消息的 from/to/type/content 都正确', () => {
      const twoMembers = getTwoMembers();
      expect(twoMembers).toBeDefined();
      const [fromId, toId] = twoMembers!;

      // 清空现有消息
      useACPStore.setState({ messages: [] });

      // 发送几条特定消息进行验证
      useACPStore.getState().sendMessage(fromId, toId, 'notification', '通知消息');
      useACPStore.getState().sendMessage(toId, fromId, 'request', '请求消息');
      useACPStore.getState().sendMessage(fromId, toId, 'response', '响应消息');

      const messages = useACPStore.getState().messages;
      expect(messages.length).toBe(3);

      // 验证第一条消息
      expect(messages[0].from).toBe(fromId);
      expect(messages[0].to).toBe(toId);
      expect(messages[0].type).toBe('notification');
      expect(messages[0].content).toBe('通知消息');

      // 验证第二条消息
      expect(messages[1].from).toBe(toId);
      expect(messages[1].to).toBe(fromId);
      expect(messages[1].type).toBe('request');
      expect(messages[1].content).toBe('请求消息');

      // 验证第三条消息
      expect(messages[2].from).toBe(fromId);
      expect(messages[2].to).toBe(toId);
      expect(messages[2].type).toBe('response');
      expect(messages[2].content).toBe('响应消息');
    });
  });

  // ============ 4. 大量知识节点创建 ============
  describe('4. 大量知识节点创建', () => {
    it('循环创建 50 个知识节点，每个节点连接到前一个节点（形成链）', () => {
      const initialNodeCount = useACPStore.getState().knowledgeNodes.length;
      const nodeIds: string[] = [];

      // 创建第一个节点（无连接）
      useACPStore.getState().addKnowledgeNode({
        type: 'concept',
        name: '知识节点 0',
        description: '链式结构的起始节点',
        connections: [],
      });
      const nodes = useACPStore.getState().knowledgeNodes;
      nodeIds.push(nodes[nodes.length - 1].id);

      // 创建后续节点，每个连接到前一个
      for (let i = 1; i < 50; i++) {
        useACPStore.getState().addKnowledgeNode({
          type: (['concept', 'function', 'class', 'file', 'decision'] as const)[i % 5],
          name: `知识节点 ${i}`,
          description: `第 ${i} 个知识节点`,
          connections: [nodeIds[i - 1]], // 连接到前一个节点
        });
        const currentNodes = useACPStore.getState().knowledgeNodes;
        nodeIds.push(currentNodes[currentNodes.length - 1].id);
      }

      // 验证所有节点都被创建
      const finalNodeCount = useACPStore.getState().knowledgeNodes.length;
      expect(finalNodeCount).toBe(initialNodeCount + 50);

      // 验证连接关系正确
      const allNodes = useACPStore.getState().knowledgeNodes;
      for (let i = 1; i < 50; i++) {
        const node = allNodes.find(n => n.id === nodeIds[i]);
        expect(node).toBeDefined();
        expect(node!.connections).toContain(nodeIds[i - 1]);
      }

      // 验证第一个节点没有连接
      const firstNode = allNodes.find(n => n.id === nodeIds[0]);
      expect(firstNode?.connections).toEqual([]);
    });
  });

  // ============ 5. 日志上限测试 ============
  describe('5. 日志上限测试', () => {
    it('循环添加 300 条日志，验证 logs.length 应 <= 200', () => {
      // 清空现有日志
      useACPStore.getState().clearLogs();

      // 循环添加 300 条日志
      for (let i = 0; i < 300; i++) {
        useACPStore.getState().addLog(
          (['info', 'warn', 'error', 'success'] as const)[i % 4],
          `日志消息 ${i}`
        );
      }

      // 验证日志数量不超过 200
      const logs = useACPStore.getState().logs;
      expect(logs.length).toBeLessThanOrEqual(200);

      // 验证最新的日志存在（日志是倒序存储的）
      expect(logs[0].message).toBe('日志消息 299');
    });
  });

  // ============ 6. 声誉值边界 ============
  describe('6. 声誉值边界', () => {
    it('将成员声誉设为 0，调用 updateReputation(memberId, -10)，声誉应保持 0（不能为负）', () => {
      const member = useACPStore.getState().organization.members[0];
      const memberId = member.id;

      // 先将声誉设为 0
      useACPStore.getState().updateMember(memberId, { reputation: 0 });

      // 验证声誉已设为 0
      const memberAfterUpdate = useACPStore.getState().organization.members.find(m => m.id === memberId);
      expect(memberAfterUpdate?.reputation).toBe(0);

      // 尝试减少声誉
      useACPStore.getState().updateReputation(memberId, -10);

      // 验证声誉保持 0
      const memberAfterDecrease = useACPStore.getState().organization.members.find(m => m.id === memberId);
      expect(memberAfterDecrease?.reputation).toBe(0);
    });

    it('将成员声誉设为 100，调用 updateReputation(memberId, 50)，声誉应保持 100（不能超过 100）', () => {
      const member = useACPStore.getState().organization.members[0];
      const memberId = member.id;

      // 先将声誉设为 100
      useACPStore.getState().updateMember(memberId, { reputation: 100 });

      // 验证声誉已设为 100
      const memberAfterUpdate = useACPStore.getState().organization.members.find(m => m.id === memberId);
      expect(memberAfterUpdate?.reputation).toBe(100);

      // 尝试增加声誉
      useACPStore.getState().updateReputation(memberId, 50);

      // 验证声誉保持 100
      const memberAfterIncrease = useACPStore.getState().organization.members.find(m => m.id === memberId);
      expect(memberAfterIncrease?.reputation).toBe(100);
    });
  });

  // ============ 7. 任务依赖深度 ============
  describe('7. 任务依赖深度', () => {
    it('创建任务链 A -> B -> C -> D -> E，验证所有依赖关系正确设置', () => {
      // 创建任务 A（无依赖）
      useACPStore.getState().addTask({
        title: '任务 A',
        description: '起始任务',
        priority: 'P0',
        estimatedTime: 60,
      });
      const tasks = useACPStore.getState().tasks;
      const taskA = tasks[tasks.length - 1];
      const taskAId = taskA.id;

      // 创建任务 B（依赖 A）
      useACPStore.getState().addTask({
        title: '任务 B',
        description: '依赖 A',
        priority: 'P1',
        estimatedTime: 60,
        dependencies: [taskAId],
      });
      const tasksAfterB = useACPStore.getState().tasks;
      const taskB = tasksAfterB[tasksAfterB.length - 1];
      const taskBId = taskB.id;

      // 创建任务 C（依赖 B）
      useACPStore.getState().addTask({
        title: '任务 C',
        description: '依赖 B',
        priority: 'P2',
        estimatedTime: 60,
        dependencies: [taskBId],
      });
      const tasksAfterC = useACPStore.getState().tasks;
      const taskC = tasksAfterC[tasksAfterC.length - 1];
      const taskCId = taskC.id;

      // 创建任务 D（依赖 C）
      useACPStore.getState().addTask({
        title: '任务 D',
        description: '依赖 C',
        priority: 'P2',
        estimatedTime: 60,
        dependencies: [taskCId],
      });
      const tasksAfterD = useACPStore.getState().tasks;
      const taskD = tasksAfterD[tasksAfterD.length - 1];
      const taskDId = taskD.id;

      // 创建任务 E（依赖 D）
      useACPStore.getState().addTask({
        title: '任务 E',
        description: '依赖 D',
        priority: 'P3',
        estimatedTime: 60,
        dependencies: [taskDId],
      });
      const tasksAfterE = useACPStore.getState().tasks;
      const taskE = tasksAfterE[tasksAfterE.length - 1];
      const taskEId = taskE.id;

      // 验证所有依赖关系正确设置
      const allTasks = useACPStore.getState().tasks;

      const taskAFinal = allTasks.find(t => t.id === taskAId);
      expect(taskAFinal?.dependencies).toEqual([]);

      const taskBFinal = allTasks.find(t => t.id === taskBId);
      expect(taskBFinal?.dependencies).toEqual([taskAId]);

      const taskCFinal = allTasks.find(t => t.id === taskCId);
      expect(taskCFinal?.dependencies).toEqual([taskBId]);

      const taskDFinal = allTasks.find(t => t.id === taskDId);
      expect(taskDFinal?.dependencies).toEqual([taskCId]);

      const taskEFinal = allTasks.find(t => t.id === taskEId);
      expect(taskEFinal?.dependencies).toEqual([taskDId]);

      // 调用 hasCircularDependency 验证无环
      const hasCycle = TaskService.hasCircularDependency(taskEId, allTasks);
      expect(hasCycle).toBe(false);
    });
  });

  // ============ 8. 空数组操作安全性 ============
  describe('8. 空数组操作安全性', () => {
    it('在空任务列表上调用 getStats，返回合理的默认值', () => {
      const stats = TaskService.getStats([]);
      expect(stats.total).toBe(0);
      expect(stats.pending).toBe(0);
      expect(stats.inProgress).toBe(0);
      expect(stats.completed).toBe(0);
      expect(stats.failed).toBe(0);
      expect(stats.blocked).toBe(0);
      expect(stats.avgProgress).toBe(0);
      expect(stats.totalEstimatedTime).toBe(0);
      expect(stats.totalActualTime).toBe(0);
    });

    it('在空成员列表上调用 getTopPerformers，返回空数组', () => {
      const topPerformers = OrganizationService.getTopPerformers([], 5);
      expect(topPerformers).toEqual([]);
      expect(topPerformers.length).toBe(0);
    });

    it('在空消息列表上调用 getMessageStats，返回合理的默认值', () => {
      const stats = CommunicationService.getMessageStats([]);
      expect(stats.total).toBe(0);
      expect(stats.task).toBe(0);
      expect(stats.notification).toBe(0);
      expect(stats.request).toBe(0);
      expect(stats.response).toBe(0);
    });
  });

  // ============ 9. 并发状态更新 ============
  describe('9. 并发状态更新', () => {
    it('快速连续调用多个 store 方法，验证所有操作都成功，状态一致', () => {
      const initialMemberCount = useACPStore.getState().organization.members.length;
      const initialTaskCount = useACPStore.getState().tasks.length;
      const initialMessageCount = useACPStore.getState().messages.length;

      // 快速连续调用多个 store 方法
      // 添加成员
      useACPStore.getState().addMember({
        name: '并发测试成员 1',
        role: 'mid',
        capabilities: ['测试'],
      });
      useACPStore.getState().addMember({
        name: '并发测试成员 2',
        role: 'senior',
        capabilities: ['开发', '测试'],
      });

      // 创建任务
      useACPStore.getState().addTask({
        title: '并发测试任务 1',
        description: '测试任务 1',
        priority: 'P0',
        estimatedTime: 60,
      });
      useACPStore.getState().addTask({
        title: '并发测试任务 2',
        description: '测试任务 2',
        priority: 'P1',
        estimatedTime: 120,
      });

      // 发送消息
      const twoMembers = getTwoMembers();
      if (twoMembers) {
        const [fromId, toId] = twoMembers;
        useACPStore.getState().sendMessage(fromId, toId, 'notification', '并发测试消息 1');
        useACPStore.getState().sendMessage(toId, fromId, 'request', '并发测试消息 2');
      }

      // 验证所有操作都成功
      const finalState = useACPStore.getState();

      // 验证成员数量
      expect(finalState.organization.members.length).toBe(initialMemberCount + 2);

      // 验证任务数量
      expect(finalState.tasks.length).toBe(initialTaskCount + 2);

      // 验证消息数量
      expect(finalState.messages.length).toBe(initialMessageCount + 2);

      // 验证新添加的成员存在
      const member1 = finalState.organization.members.find(m => m.name === '并发测试成员 1');
      const member2 = finalState.organization.members.find(m => m.name === '并发测试成员 2');
      expect(member1).toBeDefined();
      expect(member2).toBeDefined();

      // 验证新创建的任务存在
      const task1 = finalState.tasks.find(t => t.title === '并发测试任务 1');
      const task2 = finalState.tasks.find(t => t.title === '并发测试任务 2');
      expect(task1).toBeDefined();
      expect(task2).toBeDefined();

      // 验证新发送的消息存在
      const msg1 = finalState.messages.find(m => m.content === '并发测试消息 1');
      const msg2 = finalState.messages.find(m => m.content === '并发测试消息 2');
      expect(msg1).toBeDefined();
      expect(msg2).toBeDefined();

      // 验证状态一致性：没有重复 ID
      const memberIds = new Set(finalState.organization.members.map(m => m.id));
      expect(memberIds.size).toBe(finalState.organization.members.length);

      const taskIds = new Set(finalState.tasks.map(t => t.id));
      expect(taskIds.size).toBe(finalState.tasks.length);

      const messageIds = new Set(finalState.messages.map(m => m.id));
      expect(messageIds.size).toBe(finalState.messages.length);
    });
  });

  // ============ 10. 数据重置完整性 ============
  describe('10. 数据重置完整性', () => {
    it('添加大量数据后调用 store 重置，验证所有数据回到初始状态', () => {
      // 获取初始状态
      const initialState = useACPStore.getInitialState();

      // 添加大量数据
      // 添加成员
      for (let i = 0; i < 20; i++) {
        useACPStore.getState().addMember({
          name: `重置测试成员 ${i}`,
          role: 'junior',
          capabilities: ['测试'],
        });
      }

      // 创建任务
      for (let i = 0; i < 30; i++) {
        useACPStore.getState().addTask({
          title: `重置测试任务 ${i}`,
          description: `任务描述 ${i}`,
          priority: 'P2',
          estimatedTime: 60,
        });
      }

      // 发送消息
      const twoMembers = getTwoMembers();
      if (twoMembers) {
        const [fromId, toId] = twoMembers;
        for (let i = 0; i < 15; i++) {
          useACPStore.getState().sendMessage(
            i % 2 === 0 ? fromId : toId,
            i % 2 === 0 ? toId : fromId,
            'notification',
            `重置测试消息 ${i}`
          );
        }
      }

      // 添加知识节点
      for (let i = 0; i < 10; i++) {
        useACPStore.getState().addKnowledgeNode({
          type: 'concept',
          name: `重置测试节点 ${i}`,
          description: `节点描述 ${i}`,
        });
      }

      // 验证数据已添加
      const stateBeforeReset = useACPStore.getState();
      expect(stateBeforeReset.organization.members.length).toBeGreaterThan(initialState.organization.members.length);
      expect(stateBeforeReset.tasks.length).toBeGreaterThan(initialState.tasks.length);
      expect(stateBeforeReset.messages.length).toBeGreaterThan(0);
      expect(stateBeforeReset.knowledgeNodes.length).toBeGreaterThan(initialState.knowledgeNodes.length);

      // 调用 store 重置
      useACPStore.setState(initialState);

      // 验证所有数据回到初始状态
      const stateAfterReset = useACPStore.getState();

      // 验证成员数量
      expect(stateAfterReset.organization.members.length).toBe(initialState.organization.members.length);

      // 验证任务数量
      expect(stateAfterReset.tasks.length).toBe(initialState.tasks.length);

      // 验证消息数量
      expect(stateAfterReset.messages.length).toBe(initialState.messages.length);

      // 验证知识节点数量
      expect(stateAfterReset.knowledgeNodes.length).toBe(initialState.knowledgeNodes.length);

      // 验证评估分数数量
      expect(stateAfterReset.evaluationScores.length).toBe(initialState.evaluationScores.length);

      // 验证日志
      expect(stateAfterReset.logs.length).toBe(initialState.logs.length);

      // 验证模拟状态
      expect(stateAfterReset.isSimulating).toBe(initialState.isSimulating);

      // 验证调度器配置
      expect(stateAfterReset.schedulerConfig).toEqual(initialState.schedulerConfig);

      // 验证没有残留的测试数据
      expect(stateAfterReset.organization.members.find(m => m.name.startsWith('重置测试成员'))).toBeUndefined();
      expect(stateAfterReset.tasks.find(t => t.title.startsWith('重置测试任务'))).toBeUndefined();
      expect(stateAfterReset.messages.find(m => m.content.startsWith('重置测试消息'))).toBeUndefined();
      expect(stateAfterReset.knowledgeNodes.find(n => n.name.startsWith('重置测试节点'))).toBeUndefined();
    });
  });
});
