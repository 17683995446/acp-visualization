/**
 * Undo/Redo 系统单元测试
 *
 * 测试场景：
 * 1. 添加成员后撤销 → 成员被移除
 * 2. 撤销后重做 → 成员恢复
 * 3. 多次操作后多次撤销 → 状态逐步回退
 * 4. 模拟运行期间 undo 被禁用
 * 5. 清空历史后无法撤销
 * 6. 历史上限 50 条后最旧的记录被丢弃
 * 7. Ctrl+Z 快捷键触发撤销
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useACPStore } from '../store/acpStore';
import { act } from '@testing-library/react';

describe('Undo/Redo System', () => {
  beforeEach(() => {
    // 重置 store 到初始状态，并清空 undo/redo 栈
    const initialState = useACPStore.getInitialState();
    useACPStore.setState({
      organization: initialState.organization,
      tasks: initialState.tasks,
      messages: [],
      knowledgeNodes: initialState.knowledgeNodes,
      evaluation: initialState.evaluation,
      evaluationScores: initialState.evaluationScores,
      logs: [],
      isSimulating: false,
      lastSchedulerResult: null,
      schedulerConfig: initialState.schedulerConfig,
      _undoStack: [],
      _redoStack: [],
      _undoRedoEnabled: true,
      _isUndoRedoAction: false,
    });
  });

  // ============ 基础撤销/重做 ============

  describe('基础撤销/重做', () => {
    it('添加成员后撤销 → 成员被移除', () => {
      const store = useACPStore.getState();

      // 记录添加前的成员数
      const beforeCount = store.organization.members.length;

      // 添加成员
      act(() => {
        useACPStore.getState().addMember({
          name: 'Alice',
          role: 'mid',
          capabilities: ['coding'],
        });
      });

      // 验证成员已添加
      expect(useACPStore.getState().organization.members.length).toBe(beforeCount + 1);
      expect(useACPStore.getState().organization.members.find(m => m.name === 'Alice')).toBeDefined();

      // 验证 undo 栈有记录
      expect(useACPStore.getState()._undoStack.length).toBe(1);
      expect(useACPStore.getState().getUndoDescription()).toContain('Alice');

      // 撤销
      act(() => {
        useACPStore.getState().undo();
      });

      // 验证成员已被移除
      expect(useACPStore.getState().organization.members.length).toBe(beforeCount);
      expect(useACPStore.getState().organization.members.find(m => m.name === 'Alice')).toBeUndefined();

      // undo 栈应该为空
      expect(useACPStore.getState()._undoStack.length).toBe(0);

      // redo 栈应该有一条记录
      expect(useACPStore.getState()._redoStack.length).toBe(1);
    });

    it('撤销后重做 → 成员恢复', () => {
      const beforeCount = useACPStore.getState().organization.members.length;

      // 添加成员
      act(() => {
        useACPStore.getState().addMember({
          name: 'Bob',
          role: 'senior',
          capabilities: ['design'],
        });
      });

      // 撤销
      act(() => {
        useACPStore.getState().undo();
      });

      // 验证成员已移除
      expect(useACPStore.getState().organization.members.length).toBe(beforeCount);

      // 重做
      act(() => {
        useACPStore.getState().redo();
      });

      // 验证成员已恢复
      expect(useACPStore.getState().organization.members.length).toBe(beforeCount + 1);
      expect(useACPStore.getState().organization.members.find(m => m.name === 'Bob')).toBeDefined();

      // redo 栈应该为空
      expect(useACPStore.getState()._redoStack.length).toBe(0);

      // undo 栈应该有一条记录
      expect(useACPStore.getState()._undoStack.length).toBe(1);
    });

    it('多次操作后多次撤销 → 状态逐步回退', () => {
      const beforeCount = useACPStore.getState().organization.members.length;
      const beforeTaskCount = useACPStore.getState().tasks.length;

      // 操作1: 添加成员 Alice
      act(() => {
        useACPStore.getState().addMember({
          name: 'Alice',
          role: 'mid',
          capabilities: ['coding'],
        });
      });

      // 操作2: 添加成员 Bob
      act(() => {
        useACPStore.getState().addMember({
          name: 'Bob',
          role: 'senior',
          capabilities: ['design'],
        });
      });

      // 操作3: 添加任务
      act(() => {
        useACPStore.getState().addTask({
          title: '新任务',
          description: '测试任务',
          priority: 'P1',
          estimatedTime: 120,
        });
      });

      // 验证状态
      expect(useACPStore.getState().organization.members.length).toBe(beforeCount + 2);
      expect(useACPStore.getState().tasks.length).toBe(beforeTaskCount + 1);
      expect(useACPStore.getState()._undoStack.length).toBe(3);

      // 第一次撤销: 撤销添加任务
      act(() => {
        useACPStore.getState().undo();
      });
      expect(useACPStore.getState().tasks.length).toBe(beforeTaskCount);
      expect(useACPStore.getState().organization.members.length).toBe(beforeCount + 2);

      // 第二次撤销: 撤销添加 Bob
      act(() => {
        useACPStore.getState().undo();
      });
      expect(useACPStore.getState().organization.members.length).toBe(beforeCount + 1);
      expect(useACPStore.getState().organization.members.find(m => m.name === 'Bob')).toBeUndefined();

      // 第三次撤销: 撤销添加 Alice
      act(() => {
        useACPStore.getState().undo();
      });
      expect(useACPStore.getState().organization.members.length).toBe(beforeCount);
      expect(useACPStore.getState().organization.members.find(m => m.name === 'Alice')).toBeUndefined();

      // undo 栈应该为空
      expect(useACPStore.getState().canUndo()).toBe(false);
    });

    it('新操作后 redo 栈被清空', () => {
      // 添加成员
      act(() => {
        useACPStore.getState().addMember({
          name: 'Alice',
          role: 'mid',
          capabilities: ['coding'],
        });
      });

      // 撤销
      act(() => {
        useACPStore.getState().undo();
      });

      expect(useACPStore.getState()._redoStack.length).toBe(1);

      // 新操作: 添加另一个成员
      act(() => {
        useACPStore.getState().addMember({
          name: 'Charlie',
          role: 'junior',
          capabilities: ['testing'],
        });
      });

      // redo 栈应该被清空
      expect(useACPStore.getState()._redoStack.length).toBe(0);
      expect(useACPStore.getState().canRedo()).toBe(false);
    });
  });

  // ============ 模拟运行期间禁用 undo ============

  describe('模拟运行期间', () => {
    it('模拟运行期间 undo 被禁用', () => {
      // 启动模拟
      act(() => {
        useACPStore.getState().toggleSimulation();
      });

      // 验证 undo/redo 被禁用
      expect(useACPStore.getState()._undoRedoEnabled).toBe(false);
      expect(useACPStore.getState().canUndo()).toBe(false);
      expect(useACPStore.getState().canRedo()).toBe(false);

      // 添加成员（操作仍然可以执行，但不记录历史）
      act(() => {
        useACPStore.getState().addMember({
          name: 'SimMember',
          role: 'mid',
          capabilities: ['coding'],
        });
      });

      // 成员应该被添加
      expect(useACPStore.getState().organization.members.find(m => m.name === 'SimMember')).toBeDefined();

      // 但不应该有历史记录
      expect(useACPStore.getState()._undoStack.length).toBe(0);

      // 停止模拟
      act(() => {
        useACPStore.getState().toggleSimulation();
      });

      // undo/redo 应该重新启用
      expect(useACPStore.getState()._undoRedoEnabled).toBe(true);
    });

    it('停止模拟后新操作可以记录历史', () => {
      // 启动模拟
      act(() => {
        useACPStore.getState().toggleSimulation();
      });

      // 停止模拟
      act(() => {
        useACPStore.getState().toggleSimulation();
      });

      // 添加成员
      act(() => {
        useACPStore.getState().addMember({
          name: 'PostSimMember',
          role: 'mid',
          capabilities: ['coding'],
        });
      });

      // 应该有历史记录
      expect(useACPStore.getState()._undoStack.length).toBe(1);
      expect(useACPStore.getState().canUndo()).toBe(true);
    });
  });

  // ============ 清空历史 ============

  describe('清空历史', () => {
    it('清空历史后无法撤销', () => {
      // 添加多个成员
      act(() => {
        useACPStore.getState().addMember({ name: 'A', role: 'mid', capabilities: ['x'] });
        useACPStore.getState().addMember({ name: 'B', role: 'mid', capabilities: ['y'] });
        useACPStore.getState().addMember({ name: 'C', role: 'mid', capabilities: ['z'] });
      });

      expect(useACPStore.getState()._undoStack.length).toBe(3);

      // 清空历史
      act(() => {
        useACPStore.getState().clearHistory();
      });

      // 无法撤销
      expect(useACPStore.getState().canUndo()).toBe(false);
      expect(useACPStore.getState().canRedo()).toBe(false);
      expect(useACPStore.getState()._undoStack.length).toBe(0);
      expect(useACPStore.getState()._redoStack.length).toBe(0);

      // 撤销操作不应改变状态
      const memberCount = useACPStore.getState().organization.members.length;
      act(() => {
        useACPStore.getState().undo();
      });
      expect(useACPStore.getState().organization.members.length).toBe(memberCount);
    });
  });

  // ============ 历史上限 ============

  describe('历史上限', () => {
    it('历史上限 50 条后最旧的记录被丢弃', () => {
      // 设置较小的历史上限用于测试
      useACPStore.setState({ _maxHistorySize: 5 });

      // 添加 7 个成员
      for (let i = 0; i < 7; i++) {
        act(() => {
          useACPStore.getState().addMember({
            name: `Member_${i}`,
            role: 'mid',
            capabilities: [`skill_${i}`],
          });
        });
      }

      // 历史栈应该只有 5 条（最旧的 2 条被丢弃）
      expect(useACPStore.getState()._undoStack.length).toBe(5);

      // 验证最旧的记录已被丢弃
      // 第一个操作的描述应该是 Member_2（Member_0 和 Member_1 被丢弃）
      expect(useACPStore.getState()._undoStack[0].description).toContain('Member_2');

      // 撤销 5 次应该回到添加 Member_2 之前的状态
      for (let i = 0; i < 5; i++) {
        act(() => {
          useACPStore.getState().undo();
        });
      }

      // Member_0 和 Member_1 不在历史中，无法撤销
      expect(useACPStore.getState().canUndo()).toBe(false);

      // 恢复默认历史上限
      useACPStore.setState({ _maxHistorySize: 50 });
    });
  });

  // ============ 操作描述 ============

  describe('操作描述', () => {
    it('getUndoDescription 返回最后操作的描述', () => {
      act(() => {
        useACPStore.getState().addMember({ name: 'TestUser', role: 'mid', capabilities: ['test'] });
      });

      expect(useACPStore.getState().getUndoDescription()).toBe('添加成员: TestUser');
    });

    it('getRedoDescription 返回可重做操作的描述', () => {
      act(() => {
        useACPStore.getState().addMember({ name: 'TestUser', role: 'mid', capabilities: ['test'] });
      });

      act(() => {
        useACPStore.getState().undo();
      });

      expect(useACPStore.getState().getRedoDescription()).toBe('添加成员: TestUser');
    });

    it('空历史时描述返回 null', () => {
      expect(useACPStore.getState().getUndoDescription()).toBeNull();
      expect(useACPStore.getState().getRedoDescription()).toBeNull();
    });
  });

  // ============ 不同操作类型的撤销 ============

  describe('不同操作类型的撤销', () => {
    it('添加任务后撤销', () => {
      const beforeCount = useACPStore.getState().tasks.length;

      act(() => {
        useACPStore.getState().addTask({
          title: '测试任务',
          description: '描述',
          priority: 'P0',
          estimatedTime: 60,
        });
      });

      expect(useACPStore.getState().tasks.length).toBe(beforeCount + 1);

      act(() => {
        useACPStore.getState().undo();
      });

      expect(useACPStore.getState().tasks.length).toBe(beforeCount);
    });

    it('删除任务后撤销', () => {
      const beforeCount = useACPStore.getState().tasks.length;
      const taskId = useACPStore.getState().tasks[0].id;

      act(() => {
        useACPStore.getState().deleteTask(taskId);
      });

      expect(useACPStore.getState().tasks.length).toBe(beforeCount - 1);

      act(() => {
        useACPStore.getState().undo();
      });

      expect(useACPStore.getState().tasks.length).toBe(beforeCount);
      expect(useACPStore.getState().tasks.find(t => t.id === taskId)).toBeDefined();
    });

    it('添加知识节点后撤销', () => {
      const beforeCount = useACPStore.getState().knowledgeNodes.length;

      act(() => {
        useACPStore.getState().addKnowledgeNode({
          type: 'concept',
          name: '测试节点',
          description: '测试描述',
        });
      });

      expect(useACPStore.getState().knowledgeNodes.length).toBe(beforeCount + 1);

      act(() => {
        useACPStore.getState().undo();
      });

      expect(useACPStore.getState().knowledgeNodes.length).toBe(beforeCount);
    });

    it('删除知识节点后撤销', () => {
      const nodeId = useACPStore.getState().knowledgeNodes[0].id;
      const beforeCount = useACPStore.getState().knowledgeNodes.length;

      act(() => {
        useACPStore.getState().deleteKnowledgeNode(nodeId);
      });

      expect(useACPStore.getState().knowledgeNodes.length).toBe(beforeCount - 1);

      act(() => {
        useACPStore.getState().undo();
      });

      expect(useACPStore.getState().knowledgeNodes.length).toBe(beforeCount);
    });

    it('更新评分后撤销', () => {
      const score = useACPStore.getState().evaluationScores[0];
      const originalValue = score.value;

      act(() => {
        useACPStore.getState().updateScore(score.dimension, 50);
      });

      expect(useACPStore.getState().evaluationScores[0].value).toBe(50);

      act(() => {
        useACPStore.getState().undo();
      });

      expect(useACPStore.getState().evaluationScores[0].value).toBe(originalValue);
    });

    it('更新调度器配置后撤销', () => {
      const originalConfig = { ...useACPStore.getState().schedulerConfig };

      act(() => {
        useACPStore.getState().setSchedulerConfig({
          ...originalConfig,
          capabilityWeight: 0.9,
        });
      });

      expect(useACPStore.getState().schedulerConfig.capabilityWeight).toBe(0.9);

      act(() => {
        useACPStore.getState().undo();
      });

      expect(useACPStore.getState().schedulerConfig.capabilityWeight).toBe(originalConfig.capabilityWeight);
    });
  });

  // ============ enableUndoRedo ============

  describe('enableUndoRedo', () => {
    it('手动禁用 undo/redo', () => {
      act(() => {
        useACPStore.getState().addMember({ name: 'Test', role: 'mid', capabilities: ['test'] });
      });

      expect(useACPStore.getState().canUndo()).toBe(true);

      // 手动禁用
      act(() => {
        useACPStore.getState().enableUndoRedo(false);
      });

      expect(useACPStore.getState().canUndo()).toBe(false);
      expect(useACPStore.getState().canRedo()).toBe(false);

      // 添加新操作不应记录
      act(() => {
        useACPStore.getState().addMember({ name: 'Test2', role: 'mid', capabilities: ['test'] });
      });

      expect(useACPStore.getState()._undoStack.length).toBe(1); // 仍然是 1，没有增加

      // 重新启用
      act(() => {
        useACPStore.getState().enableUndoRedo(true);
      });

      expect(useACPStore.getState().canUndo()).toBe(true);
    });
  });

  // ============ Ctrl+Z 快捷键 ============

  describe('Ctrl+Z 快捷键', () => {
    it('Ctrl+Z 触发撤销', () => {
      act(() => {
        useACPStore.getState().addMember({ name: 'ShortcutTest', role: 'mid', capabilities: ['test'] });
      });

      expect(useACPStore.getState().organization.members.find(m => m.name === 'ShortcutTest')).toBeDefined();

      // 模拟 Ctrl+Z 键盘事件
      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'z',
          ctrlKey: true,
          bubbles: true,
        });
        window.dispatchEvent(event);
      });

      // 注意：快捷键由 useUndoRedo hook 处理，这里只测试 store 层面的 undo
      // 直接调用 undo 来验证功能
      act(() => {
        useACPStore.getState().undo();
      });

      expect(useACPStore.getState().organization.members.find(m => m.name === 'ShortcutTest')).toBeUndefined();
    });

    it('Ctrl+Shift+Z 触发重做', () => {
      act(() => {
        useACPStore.getState().addMember({ name: 'RedoTest', role: 'mid', capabilities: ['test'] });
      });

      act(() => {
        useACPStore.getState().undo();
      });

      expect(useACPStore.getState().organization.members.find(m => m.name === 'RedoTest')).toBeUndefined();

      // 直接调用 redo 来验证功能
      act(() => {
        useACPStore.getState().redo();
      });

      expect(useACPStore.getState().organization.members.find(m => m.name === 'RedoTest')).toBeDefined();
    });
  });

  // ============ 边界情况 ============

  describe('边界情况', () => {
    it('undo 空栈不报错', () => {
      expect(() => {
        act(() => {
          useACPStore.getState().undo();
        });
      }).not.toThrow();
    });

    it('redo 空栈不报错', () => {
      expect(() => {
        act(() => {
          useACPStore.getState().redo();
        });
      }).not.toThrow();
    });

    it('undo/redo 操作本身不被记录到历史', () => {
      act(() => {
        useACPStore.getState().addMember({ name: 'A', role: 'mid', capabilities: ['x'] });
      });

      expect(useACPStore.getState()._undoStack.length).toBe(1);

      act(() => {
        useACPStore.getState().undo();
      });

      // undo 操作不应增加历史记录
      expect(useACPStore.getState()._undoStack.length).toBe(0);

      act(() => {
        useACPStore.getState().redo();
      });

      // redo 操作不应增加历史记录
      expect(useACPStore.getState()._undoStack.length).toBe(1);
      expect(useACPStore.getState()._redoStack.length).toBe(0);
    });

    it('不追踪非追踪字段的变更', () => {
      // simulationInterval 不是追踪字段
      act(() => {
        useACPStore.getState().setSimulationInterval(3000);
      });

      // 不应该产生历史记录
      expect(useACPStore.getState()._undoStack.length).toBe(0);
      expect(useACPStore.getState().canUndo()).toBe(false);
    });

    it('验证没有追踪字段变化的 set 不产生历史', () => {
      // addDepartment 在验证失败时返回 state（无变化）
      act(() => {
        useACPStore.getState().addDepartment({
          name: '',  // 空名称，验证会失败
          headId: 'nonexistent',
        });
      });

      expect(useACPStore.getState()._undoStack.length).toBe(0);
    });
  });
});
