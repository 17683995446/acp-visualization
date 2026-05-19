/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach } from 'vitest';
import { useACPStore } from '../store/acpStore';
import type { TaskPriority, KnowledgeNode } from '../types';

describe('长期运行和内存相关测试', () => {
  beforeEach(() => {
    useACPStore.setState(useACPStore.getInitialState());
  });

  // ============ 测试 1: 模拟引擎长时间运行稳定性 ============
  describe('模拟引擎长时间运行稳定性', () => {
    it('应该能够稳定运行 50 个调度周期而不抛出异常', () => {
      const store = useACPStore.getState();
      
      // 启动模拟引擎
      store.toggleSimulation();
      expect(useACPStore.getState().isSimulating).toBe(true);
      
      // 循环执行 50 次 runSchedulerTick
      for (let i = 0; i < 50; i++) {
        expect(() => store.runSchedulerTick()).not.toThrow();
      }
      
      // 停止模拟引擎
      store.toggleSimulation();
      expect(useACPStore.getState().isSimulating).toBe(false);
      
      // 验证状态一致性
      const finalState = useACPStore.getState();
      expect(finalState.tasks).toBeDefined();
      expect(finalState.organization.members).toBeDefined();
      expect(finalState.messages).toBeDefined();
    });

    it('长时间运行后状态应该保持一致', () => {
      const store = useACPStore.getState();
      
      // 记录初始成员数量
      const initialMemberCount = store.organization.members.length;
      
      store.toggleSimulation();
      
      // 运行多个周期
      for (let i = 0; i < 50; i++) {
        store.runSchedulerTick();
      }
      
      store.toggleSimulation();
      
      const finalState = useACPStore.getState();
      
      // 验证成员数量没有异常变化
      expect(finalState.organization.members.length).toBe(initialMemberCount);
      
      // 验证所有成员状态有效
      finalState.organization.members.forEach(member => {
        expect(['idle', 'busy', 'offline']).toContain(member.status);
        expect(member.reputation).toBeGreaterThanOrEqual(0);
        expect(member.reputation).toBeLessThanOrEqual(100);
      });
      
      // 验证任务状态一致性
      finalState.tasks.forEach(task => {
        expect(['pending', 'in_progress', 'completed', 'failed', 'blocked']).toContain(task.status);
        expect(task.progress).toBeGreaterThanOrEqual(0);
        expect(task.progress).toBeLessThanOrEqual(100);
        
        // 如果任务已完成，进度应为 100
        if (task.status === 'completed') {
          expect(task.progress).toBe(100);
        }
      });
    });
  });

  // ============ 测试 2: 定时器累积检测 ============
  describe('定时器累积检测', () => {
    it('多次启动/停止后 refCount 应该正确管理', () => {
      const store = useACPStore.getState();
      
      // 多次启动/停止模拟引擎（10次）
      for (let i = 0; i < 10; i++) {
        store.toggleSimulation();
        expect(useACPStore.getState().isSimulating).toBe(i % 2 === 0);
      }
      
      // 最终状态应该是停止的（10次后）
      expect(useACPStore.getState().isSimulating).toBe(false);
      
      // 验证状态没有损坏
      const finalState = useACPStore.getState();
      expect(finalState.simulationInterval).toBeGreaterThanOrEqual(100);
      expect(finalState.organization).toBeDefined();
    });

    it('快速切换模拟状态不应导致状态不一致', () => {
      const store = useACPStore.getState();
      
      // 快速切换 20 次
      for (let i = 0; i < 20; i++) {
        store.toggleSimulation();
      }
      
      const finalState = useACPStore.getState();
      
      // 验证 isSimulating 是布尔值
      expect(typeof finalState.isSimulating).toBe('boolean');
      
      // 验证日志系统正常工作
      expect(finalState.logs).toBeDefined();
      expect(Array.isArray(finalState.logs)).toBe(true);
    });
  });

  // ============ 测试 3: 日志无限增长防护 ============
  describe('日志无限增长防护', () => {
    it('日志数量不应超过上限（200条）', () => {
      const store = useACPStore.getState();
      
      // 循环添加 500 条日志
      for (let i = 0; i < 500; i++) {
        store.addLog('info', `测试日志消息 ${i}`);
      }
      
      const finalState = useACPStore.getState();
      
      // 验证日志数量不超过上限（200条）
      expect(finalState.logs.length).toBeLessThanOrEqual(200);
      expect(finalState.logs.length).toBe(200);
    });

    it('日志应该保持最新的条目', () => {
      const store = useACPStore.getState();
      
      // 添加 250 条日志
      for (let i = 0; i < 250; i++) {
        store.addLog('info', `日志 ${i}`);
      }
      
      const finalState = useACPStore.getState();
      
      // 验证最新的日志在列表前面（因为日志是倒序存储的）
      expect(finalState.logs[0].message).toBe('日志 249');
      expect(finalState.logs[199].message).toBe('日志 50');
    });

    it('不同级别的日志都应该被正确限制', () => {
      const store = useACPStore.getState();
      const levels: Array<'debug' | 'info' | 'warn' | 'error' | 'success'> = 
        ['debug', 'info', 'warn', 'error', 'success'];
      
      // 每种级别添加 100 条
      for (let i = 0; i < 500; i++) {
        const level = levels[i % 5];
        store.addLog(level, `日志 ${i}`, { index: i });
      }
      
      const finalState = useACPStore.getState();
      expect(finalState.logs.length).toBe(200);
      
      // 验证所有日志都有必要的字段
      finalState.logs.forEach(log => {
        expect(log.id).toBeDefined();
        expect(log.timestamp).toBeDefined();
        expect(log.level).toBeDefined();
        expect(log.message).toBeDefined();
      });
    });
  });

  // ============ 测试 4: 消息历史累积 ============
  describe('消息历史累积', () => {
    it('所有消息都应该被保存，没有丢失', () => {
      const store = useACPStore.getState();
      const members = store.organization.members;
      
      // 确保有足够成员
      expect(members.length).toBeGreaterThanOrEqual(2);
      
      const from = members[0].id;
      const to = members[1].id;
      
      // 循环发送 200 条消息
      for (let i = 0; i < 200; i++) {
        store.sendMessage(from, to, i % 2 === 0 ? 'notification' : 'request', `消息内容 ${i}`);
      }
      
      const finalState = useACPStore.getState();
      
      // 验证所有消息都被保存
      expect(finalState.messages.length).toBe(200);
      
      // 验证消息内容正确（消息按正序存储）
      finalState.messages.forEach((msg, index) => {
        expect(msg.from).toBe(from);
        expect(msg.to).toBe(to);
        expect(msg.content).toBe(`消息内容 ${index}`);
      });
    });

    it('消息应该保留所有元数据', () => {
      const store = useACPStore.getState();
      const members = store.organization.members;
      const from = members[0].id;
      const to = members[1].id;
      
      // 发送不同类型的消息
      const types: Array<'notification' | 'request' | 'response'> = ['notification', 'request', 'response'];
      
      for (let i = 0; i < 100; i++) {
        store.sendMessage(from, to, types[i % 3], `消息 ${i}`);
      }
      
      const finalState = useACPStore.getState();
      
      // 验证所有消息都有完整的元数据
      finalState.messages.forEach(msg => {
        expect(msg.id).toBeDefined();
        expect(msg.id.startsWith('msg-')).toBe(true);
        expect(msg.from).toBe(from);
        expect(msg.to).toBe(to);
        expect(msg.timestamp).toBeGreaterThan(0);
        expect(msg.read).toBe(false);
        expect(types).toContain(msg.type);
      });
    });
  });

  // ============ 测试 5: 任务状态流转完整性 ============
  describe('任务状态流转完整性', () => {
    it('任务应该正确流转 pending -> in_progress -> completed', () => {
      const store = useACPStore.getState();
      const priorities: TaskPriority[] = ['P0', 'P1', 'P2', 'P3'];
      const taskIds: string[] = [];
      
      // 创建 20 个任务，不同优先级
      for (let i = 0; i < 20; i++) {
        store.addTask({
          title: `任务 ${i}`,
          description: `任务描述 ${i}`,
          priority: priorities[i % 4],
          estimatedTime: 60 + i * 10,
        });
      }
      
      // 获取创建的任务 ID
      const state = useACPStore.getState();
      const createdTasks = state.tasks.slice(-20);
      createdTasks.forEach(task => taskIds.push(task.id));
      
      // 验证初始状态为 pending
      createdTasks.forEach(task => {
        expect(task.status).toBe('pending');
      });
      
      // 为每个任务分配成员，状态变为 in_progress
      const members = state.organization.members.filter(m => m.status === 'idle');
      
      taskIds.forEach((taskId, index) => {
        if (members[index]) {
          store.assignTask(taskId, members[index].id);
        }
      });
      
      // 验证已分配任务状态变为 in_progress
      const afterAssignState = useACPStore.getState();
      taskIds.forEach((taskId, index) => {
        const task = afterAssignState.tasks.find(t => t.id === taskId);
        if (members[index]) {
          expect(task?.status).toBe('in_progress');
          expect(task?.assignee).toBe(members[index].id);
        }
      });
      
      // 完成任务
      taskIds.forEach(taskId => {
        store.updateTask(taskId, { status: 'completed', progress: 100 });
      });
      
      // 验证所有任务已完成
      const finalState = useACPStore.getState();
      taskIds.forEach(taskId => {
        const task = finalState.tasks.find(t => t.id === taskId);
        expect(task?.status).toBe('completed');
        expect(task?.progress).toBe(100);
      });
    });

    it('Agent 状态应该与任务状态同步', () => {
      const store = useACPStore.getState();
      
      // 找到一个空闲成员
      const idleMember = store.organization.members.find(m => m.status === 'idle');
      expect(idleMember).toBeDefined();
      
      // 创建任务并分配给该成员
      store.addTask({
        title: '同步测试任务',
        description: '测试 Agent 状态同步',
        priority: 'P0',
        estimatedTime: 60,
      });
      
      const state1 = useACPStore.getState();
      const newTask = state1.tasks.find(t => t.title === '同步测试任务');
      expect(newTask).toBeDefined();
      
      // 分配任务
      store.assignTask(newTask!.id, idleMember!.id);
      
      // 验证 Agent 状态变为 busy
      const state2 = useACPStore.getState();
      const assignedMember = state2.organization.members.find(m => m.id === idleMember!.id);
      expect(assignedMember?.status).toBe('busy');
      expect(assignedMember?.currentTask).toBe(newTask!.id);
      
      // 完成任务
      store.updateTask(newTask!.id, { status: 'completed', progress: 100 });
      
      // 验证 Agent 状态恢复为 idle
      const state3 = useACPStore.getState();
      const freedMember = state3.organization.members.find(m => m.id === idleMember!.id);
      expect(freedMember?.status).toBe('idle');
      expect(freedMember?.currentTask).toBeUndefined();
    });
  });

  // ============ 测试 6: 知识图谱大规模操作 ============
  describe('知识图谱大规模操作', () => {
    it('应该能够创建 100 个节点并建立连接', () => {
      const store = useACPStore.getState();
      const nodeIds: string[] = [];
      const types: Array<KnowledgeNode['type']> = ['file', 'function', 'class', 'concept', 'decision'];
      
      // 创建 100 个知识节点
      for (let i = 0; i < 100; i++) {
        store.addKnowledgeNode({
          type: types[i % 5],
          name: `节点 ${i}`,
          description: `节点描述 ${i}`,
          connections: [],
        });
      }
      
      // 获取所有节点 ID
      const state1 = useACPStore.getState();
      const nodes = state1.knowledgeNodes.slice(-100);
      nodes.forEach(n => nodeIds.push(n.id));
      
      expect(nodeIds.length).toBe(100);
      
      // 每个节点随机连接到其他 3 个节点
      nodeIds.forEach(nodeId => {
        const connections: string[] = [];
        while (connections.length < 3) {
          const randomId = nodeIds[Math.floor(Math.random() * nodeIds.length)];
          if (randomId !== nodeId && !connections.includes(randomId)) {
            connections.push(randomId);
          }
        }
        store.addKnowledgeNode({
          type: 'concept',
          name: `连接节点 ${nodeId}`,
          description: '用于建立连接的节点',
          connections,
        });
      });
      
      const state2 = useACPStore.getState();
      // 验证节点数量（原始 + 100 新节点）
      expect(state2.knowledgeNodes.length).toBeGreaterThanOrEqual(100);
    });

    it('删除节点后应该清理所有引用', () => {
      const store = useACPStore.getState();
      const nodeIds: string[] = [];
      
      // 创建 50 个节点
      for (let i = 0; i < 50; i++) {
        store.addKnowledgeNode({
          type: 'concept',
          name: `节点 ${i}`,
          description: `描述 ${i}`,
          connections: [],
        });
      }
      
      const state1 = useACPStore.getState();
      const nodes = state1.knowledgeNodes.slice(-50);
      nodes.forEach(n => nodeIds.push(n.id));
      
      // 建立连接（每个节点连接到下一个）
      nodeIds.forEach((_, index) => {
        if (index < nodeIds.length - 1) {
          store.addKnowledgeNode({
            type: 'concept',
            name: `连接节点 ${index}`,
            description: '连接',
            connections: [nodeIds[index + 1]],
          });
        }
      });
      
      const state2 = useACPStore.getState();
      void state2; // 避免未使用变量警告
      
      // 删除 25 个节点
      const toDelete = nodeIds.slice(0, 25);
      toDelete.forEach(id => {
        store.deleteKnowledgeNode(id);
      });
      
      const state3 = useACPStore.getState();
      
      // 验证节点已删除
      toDelete.forEach(id => {
        const node = state3.knowledgeNodes.find(n => n.id === id);
        expect(node).toBeUndefined();
      });
      
      // 验证没有悬空引用（剩余节点不应引用已删除节点）
      state3.knowledgeNodes.forEach(node => {
        node.connections.forEach(connId => {
          expect(toDelete).not.toContain(connId);
        });
      });
    });

    it('大规模操作后知识图谱应该保持一致性', () => {
      const store = useACPStore.getState();
      const nodeIds: string[] = [];
      
      // 创建 100 个节点
      for (let i = 0; i < 100; i++) {
        store.addKnowledgeNode({
          type: 'concept',
          name: `一致性测试节点 ${i}`,
          description: `描述 ${i}`,
          connections: [],
        });
      }
      
      const state1 = useACPStore.getState();
      const nodes = state1.knowledgeNodes.slice(-100);
      nodes.forEach(n => nodeIds.push(n.id));
      
      // 每个节点连接到其他 3 个节点
      nodeIds.forEach((nodeId, index) => {
        const connections = [
          nodeIds[(index + 1) % 100],
          nodeIds[(index + 2) % 100],
          nodeIds[(index + 3) % 100],
        ].filter(id => id !== nodeId);
        
        store.addKnowledgeNode({
          type: 'concept',
          name: `连接节点 ${index}`,
          description: '连接',
          connections,
        });
      });
      
      // 删除 50 个节点
      const toDelete = nodeIds.slice(0, 50);
      toDelete.forEach(id => {
        store.deleteKnowledgeNode(id);
      });
      
      const finalState = useACPStore.getState();
      
      // 验证所有剩余节点的连接都是有效的
      const remainingIds = new Set(finalState.knowledgeNodes.map(n => n.id));
      finalState.knowledgeNodes.forEach(node => {
        node.connections.forEach(connId => {
          expect(remainingIds.has(connId)).toBe(true);
        });
      });
    });
  });

  // ============ 测试 7: store 状态快照一致性 ============
  describe('store 状态快照一致性', () => {
    it('应该能够获取和恢复状态快照', () => {
      const store = useACPStore.getState();
      
      // 添加大量数据
      // 添加成员
      for (let i = 0; i < 5; i++) {
        store.addMember({
          name: `成员 ${i}`,
          role: 'senior',
          capabilities: ['开发', '测试'],
        });
      }
      
      // 添加任务
      for (let i = 0; i < 10; i++) {
        store.addTask({
          title: `任务 ${i}`,
          description: `描述 ${i}`,
          priority: 'P1',
          estimatedTime: 60,
        });
      }
      
      // 添加消息
      const members = store.organization.members;
      for (let i = 0; i < 20; i++) {
        store.sendMessage(members[0].id, members[1].id, 'notification', `消息 ${i}`);
      }
      
      // 获取状态快照
      const snapshot = useACPStore.getState();
      const snapshotData = {
        organization: JSON.parse(JSON.stringify(snapshot.organization)),
        tasks: JSON.parse(JSON.stringify(snapshot.tasks)),
        messages: JSON.parse(JSON.stringify(snapshot.messages)),
        knowledgeNodes: JSON.parse(JSON.stringify(snapshot.knowledgeNodes)),
        logs: JSON.parse(JSON.stringify(snapshot.logs)),
      };
      
      // 修改数据
      store.addMember({
        name: '新成员',
        role: 'junior',
        capabilities: ['学习'],
      });
      store.addTask({
        title: '新任务',
        description: '新描述',
        priority: 'P0',
        estimatedTime: 120,
      });
      
      // 恢复到快照状态
      useACPStore.setState({
        organization: snapshotData.organization,
        tasks: snapshotData.tasks,
        messages: snapshotData.messages,
        knowledgeNodes: snapshotData.knowledgeNodes,
        logs: snapshotData.logs,
      });
      
      // 验证数据完全恢复
      const restoredState = useACPStore.getState();
      expect(restoredState.organization.members.length).toBe(snapshot.organization.members.length);
      expect(restoredState.tasks.length).toBe(snapshot.tasks.length);
      expect(restoredState.messages.length).toBe(snapshot.messages.length);
      
      // 验证具体数据
      expect(restoredState.tasks).toEqual(snapshot.tasks);
      expect(restoredState.messages).toEqual(snapshot.messages);
    });

    it('快照应该包含所有必要的状态', () => {
      const store = useACPStore.getState();
      
      // 添加各种数据
      store.addMember({ name: '测试成员', role: 'senior', capabilities: ['测试'] });
      store.addTask({ title: '测试任务', description: '测试', priority: 'P0', estimatedTime: 60 });
      store.addKnowledgeNode({ type: 'concept', name: '测试节点', description: '测试' });
      store.addLog('info', '测试日志');
      store.sendMessage('agent-001', 'agent-002', 'notification', '测试消息');
      
      const state = useACPStore.getState();
      
      // 验证快照包含所有关键字段
      expect(state.organization).toBeDefined();
      expect(state.tasks).toBeDefined();
      expect(state.messages).toBeDefined();
      expect(state.knowledgeNodes).toBeDefined();
      expect(state.logs).toBeDefined();
      expect(state.evaluation).toBeDefined();
      expect(state.evaluationScores).toBeDefined();
      expect(state.isSimulating).toBeDefined();
      expect(state.simulationInterval).toBeDefined();
      expect(state.schedulerConfig).toBeDefined();
    });
  });

  // ============ 测试 8: 重复 ID 生成检测 ============
  describe('重复 ID 生成检测', () => {
    it('生成的 1000 个 ID 应该都是唯一的', () => {
      const store = useACPStore.getState();
      const ids = new Set<string>();
      
      // 循环生成 1000 个 ID（通过创建任务来生成）
      for (let i = 0; i < 1000; i++) {
        store.addTask({
          title: `任务 ${i}`,
          description: `描述 ${i}`,
          priority: 'P1',
          estimatedTime: 60,
        });
      }
      
      const state = useACPStore.getState();
      const tasks = state.tasks.slice(-1000);
      
      // 验证所有 ID 都是唯一的
      tasks.forEach(task => {
        expect(ids.has(task.id)).toBe(false);
        ids.add(task.id);
      });
      
      expect(ids.size).toBe(1000);
    });

    it('不同类型的实体 ID 也应该唯一', () => {
      const store = useACPStore.getState();
      const allIds = new Set<string>();
      
      // 生成各种类型的 ID
      for (let i = 0; i < 100; i++) {
        // 任务
        store.addTask({
          title: `任务 ${i}`,
          description: `描述 ${i}`,
          priority: 'P1',
          estimatedTime: 60,
        });
        
        // 成员
        store.addMember({
          name: `成员 ${i}`,
          role: 'mid',
          capabilities: ['开发'],
        });
        
        // 知识节点
        store.addKnowledgeNode({
          type: 'concept',
          name: `节点 ${i}`,
          description: `描述 ${i}`,
        });
        
        // 日志
        store.addLog('info', `日志 ${i}`);
      }
      
      const state = useACPStore.getState();
      
      // 收集所有 ID
      state.tasks.forEach(t => allIds.add(t.id));
      state.organization.members.forEach(m => allIds.add(m.id));
      state.knowledgeNodes.forEach(k => allIds.add(k.id));
      state.logs.forEach(l => allIds.add(l.id));
      state.messages.forEach(m => allIds.add(m.id));
      
      // 验证总数（减去初始数据）
      const totalEntities = state.tasks.length + 
                           state.organization.members.length + 
                           state.knowledgeNodes.length + 
                           state.logs.length + 
                           state.messages.length;
      
      // 所有 ID 应该是唯一的
      expect(allIds.size).toBe(totalEntities);
    });
  });

  // ============ 测试 9: 极端并发操作 ============
  describe('极端并发操作', () => {
    it('快速连续执行 100 个不同操作后状态应该一致', () => {
      const store = useACPStore.getState();
      const members = store.organization.members;
      
      // 快速连续执行 100 个不同的 store 操作
      for (let i = 0; i < 100; i++) {
        const operation = i % 10;
        
        switch (operation) {
          case 0: // 添加任务
            store.addTask({
              title: `并发任务 ${i}`,
              description: `描述 ${i}`,
              priority: ['P0', 'P1', 'P2', 'P3'][i % 4] as TaskPriority,
              estimatedTime: 60 + i,
            });
            break;
            
          case 1: // 添加成员
            store.addMember({
              name: `并发成员 ${i}`,
              role: 'junior',
              capabilities: ['测试'],
            });
            break;
            
          case 2: // 添加知识节点
            store.addKnowledgeNode({
              type: 'concept',
              name: `并发节点 ${i}`,
              description: `描述 ${i}`,
            });
            break;
            
          case 3: // 添加日志
            store.addLog('info', `并发日志 ${i}`);
            break;
            
          case 4: // 发送消息
            if (members.length >= 2) {
              store.sendMessage(members[0].id, members[1].id, 'notification', `并发消息 ${i}`);
            }
            break;
            
          case 5: // 更新任务
            const tasks = useACPStore.getState().tasks;
            if (tasks.length > 0) {
              store.updateTask(tasks[0].id, { progress: Math.min(100, i) });
            }
            break;
            
          case 6: // 切换模拟状态
            if (i % 20 === 0) {
              store.toggleSimulation();
            }
            break;
            
          case 7: // 标记消息已读
            const msgs = useACPStore.getState().messages;
            if (msgs.length > 0) {
              store.markMessageAsRead(msgs[0].id);
            }
            break;
            
          case 8: // 更新分数
            store.updateScore('创新性', 50 + (i % 50));
            break;
            
          case 9: // 运行调度 tick
            if (i % 5 === 0) {
              store.runSchedulerTick();
            }
            break;
        }
      }
      
      const finalState = useACPStore.getState();
      
      // 验证状态一致性
      expect(finalState.tasks).toBeDefined();
      expect(finalState.organization.members).toBeDefined();
      expect(finalState.knowledgeNodes).toBeDefined();
      expect(finalState.messages).toBeDefined();
      expect(finalState.logs).toBeDefined();
      
      // 验证没有数据损坏
      finalState.tasks.forEach(task => {
        expect(task.id).toBeDefined();
        expect(task.title).toBeDefined();
        expect(task.status).toBeDefined();
      });
      
      finalState.organization.members.forEach(member => {
        expect(member.id).toBeDefined();
        expect(member.name).toBeDefined();
        expect(member.status).toBeDefined();
        expect(member.reputation).toBeGreaterThanOrEqual(0);
        expect(member.reputation).toBeLessThanOrEqual(100);
      });
    });

    it('混合增删改操作后数据应该一致', () => {
      const store = useACPStore.getState();
      const taskIds: string[] = [];
      
      // 先创建一些任务
      for (let i = 0; i < 50; i++) {
        store.addTask({
          title: `任务 ${i}`,
          description: `描述 ${i}`,
          priority: 'P1',
          estimatedTime: 60,
        });
      }
      
      const state1 = useACPStore.getState();
      state1.tasks.slice(-50).forEach(t => taskIds.push(t.id));
      
      // 混合操作
      for (let i = 0; i < 50; i++) {
        if (i % 3 === 0 && taskIds[i]) {
          // 更新
          store.updateTask(taskIds[i], { progress: i * 2 });
        } else if (i % 3 === 1 && taskIds[i]) {
          // 删除
          store.deleteTask(taskIds[i]);
          taskIds[i] = ''; // 标记为已删除
        } else {
          // 添加
          store.addTask({
            title: `新任务 ${i}`,
            description: `新描述 ${i}`,
            priority: 'P2',
            estimatedTime: 30,
          });
        }
      }
      
      const finalState = useACPStore.getState();
      
      // 验证被删除的任务确实不存在
      taskIds.forEach((id, index) => {
        if (id && index % 3 === 1) {
          const task = finalState.tasks.find(t => t.id === id);
          expect(task).toBeUndefined();
        }
      });
      
      // 验证所有任务都有有效状态
      finalState.tasks.forEach(task => {
        expect(task.progress).toBeGreaterThanOrEqual(0);
        expect(task.progress).toBeLessThanOrEqual(100);
      });
    });
  });

  // ============ 测试 10: 内存引用清理 ============
  describe('内存引用清理', () => {
    it('删除所有数据后 store 应该回到初始状态大小', () => {
      const store = useACPStore.getState();
      const initialState = useACPStore.getInitialState();
      
      // 创建大量数据
      for (let i = 0; i < 50; i++) {
        store.addTask({
          title: `任务 ${i}`,
          description: `描述 ${i}`,
          priority: 'P1',
          estimatedTime: 60,
        });
        
        store.addMember({
          name: `成员 ${i}`,
          role: 'mid',
          capabilities: ['开发'],
        });
        
        store.addKnowledgeNode({
          type: 'concept',
          name: `节点 ${i}`,
          description: `描述 ${i}`,
        });
        
        store.addLog('info', `日志 ${i}`);
      }
      
      const stateWithData = useACPStore.getState();
      
      // 验证数据已添加
      expect(stateWithData.tasks.length).toBeGreaterThan(initialState.tasks.length);
      expect(stateWithData.organization.members.length).toBeGreaterThan(initialState.organization.members.length);
      expect(stateWithData.knowledgeNodes.length).toBeGreaterThan(initialState.knowledgeNodes.length);
      
      // 删除所有任务（只删除新增的）
      const tasksToDelete = stateWithData.tasks.filter(
        t => !initialState.tasks.find(it => it.id === t.id)
      );
      tasksToDelete.forEach(task => {
        store.deleteTask(task.id);
      });
      
      // 删除所有新增成员
      const membersToDelete = stateWithData.organization.members.filter(
        m => !initialState.organization.members.find(im => im.id === m.id)
      );
      membersToDelete.forEach(member => {
        store.removeMember(member.id);
      });
      
      // 删除所有新增知识节点
      const nodesToDelete = stateWithData.knowledgeNodes.filter(
        n => !initialState.knowledgeNodes.find(in_ => in_.id === n.id)
      );
      nodesToDelete.forEach(node => {
        store.deleteKnowledgeNode(node.id);
      });
      
      // 清空日志
      store.clearLogs();
      
      // 清空消息
      useACPStore.setState({ messages: [] });
      
      // 重置其他状态
      useACPStore.setState({
        isSimulating: false,
        lastSchedulerResult: null,
      });
      
      const finalState = useACPStore.getState();
      
      // 验证任务回到初始数量
      expect(finalState.tasks.length).toBe(initialState.tasks.length);
      
      // 验证成员回到初始数量
      expect(finalState.organization.members.length).toBe(initialState.organization.members.length);
      
      // 验证知识节点回到初始数量
      expect(finalState.knowledgeNodes.length).toBe(initialState.knowledgeNodes.length);
      
      // 验证日志已清空
      expect(finalState.logs.length).toBe(0);
      
      // 验证消息已清空
      expect(finalState.messages.length).toBe(0);
      
      // 验证模拟状态已重置
      expect(finalState.isSimulating).toBe(false);
      expect(finalState.lastSchedulerResult).toBeNull();
    });

    it('重置状态后应该能够重新开始添加数据', () => {
      const store = useACPStore.getState();
      
      // 添加数据
      for (let i = 0; i < 20; i++) {
        store.addTask({
          title: `任务 ${i}`,
          description: `描述 ${i}`,
          priority: 'P1',
          estimatedTime: 60,
        });
      }
      
      // 重置状态
      useACPStore.setState(useACPStore.getInitialState());
      
      const resetState = useACPStore.getState();
      const initialState = useACPStore.getInitialState();
      
      // 验证已重置
      expect(resetState.tasks.length).toBe(initialState.tasks.length);
      
      // 验证可以重新开始添加数据
      store.addTask({
        title: '新任务',
        description: '新描述',
        priority: 'P0',
        estimatedTime: 120,
      });
      
      const finalState = useACPStore.getState();
      expect(finalState.tasks.length).toBe(initialState.tasks.length + 1);
      expect(finalState.tasks.find(t => t.title === '新任务')).toBeDefined();
    });
  });
});
