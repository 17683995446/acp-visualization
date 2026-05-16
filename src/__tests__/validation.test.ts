/**
 * ACP Store 数据验证单元测试
 * 测试所有 store action 的输入验证逻辑
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useACPStore } from '../store/acpStore';

describe('ACP Store 数据验证', () => {
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
      schedulerConfig: useACPStore.getInitialState().schedulerConfig,
    });
  });

  // ============ addMember 验证 ============

  describe('addMember 验证', () => {
    it('应拒绝空名称的成员', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const before = useACPStore.getState().organization.members.length;

      useACPStore.getState().addMember({ name: '', role: 'mid', capabilities: ['coding'] });
      useACPStore.getState().addMember({ name: '   ', role: 'mid', capabilities: ['coding'] });

      const after = useACPStore.getState().organization.members.length;
      expect(after).toBe(before);
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('应拒绝空能力列表的成员', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const before = useACPStore.getState().organization.members.length;

      useACPStore.getState().addMember({ name: 'TestAgent', role: 'mid', capabilities: [] });

      const after = useACPStore.getState().organization.members.length;
      expect(after).toBe(before);
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('应接受有效数据的成员', () => {
      const before = useACPStore.getState().organization.members.length;

      useACPStore.getState().addMember({ name: 'ValidAgent', role: 'senior', capabilities: ['coding', 'testing'] });

      const after = useACPStore.getState().organization.members.length;
      expect(after).toBe(before + 1);
      const newMember = useACPStore.getState().organization.members.find(m => m.name === 'ValidAgent');
      expect(newMember).toBeDefined();
      expect(newMember?.role).toBe('senior');
    });
  });

  // ============ addTask 验证 ============

  describe('addTask 验证', () => {
    it('应拒绝空标题的任务', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const before = useACPStore.getState().tasks.length;

      useACPStore.getState().addTask({ title: '', description: 'desc', priority: 'P1', estimatedTime: 60 });
      useACPStore.getState().addTask({ title: '   ', description: 'desc', priority: 'P1', estimatedTime: 60 });

      const after = useACPStore.getState().tasks.length;
      expect(after).toBe(before);
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('应拒绝无效优先级的任务', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const before = useACPStore.getState().tasks.length;

      // @ts-expect-error - 故意传入无效优先级进行测试
      useACPStore.getState().addTask({ title: 'Bad Priority', description: 'desc', priority: 'P5', estimatedTime: 60 });

      const after = useACPStore.getState().tasks.length;
      expect(after).toBe(before);
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('应拒绝预估时间为零的任务', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const before = useACPStore.getState().tasks.length;

      useACPStore.getState().addTask({ title: 'Zero Time', description: 'desc', priority: 'P1', estimatedTime: 0 });
      useACPStore.getState().addTask({ title: 'Negative Time', description: 'desc', priority: 'P1', estimatedTime: -5 });

      const after = useACPStore.getState().tasks.length;
      expect(after).toBe(before);
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('应接受有效数据的任务', () => {
      const before = useACPStore.getState().tasks.length;

      useACPStore.getState().addTask({ title: 'Valid Task', description: 'desc', priority: 'P0', estimatedTime: 120 });

      const after = useACPStore.getState().tasks.length;
      expect(after).toBe(before + 1);
      const newTask = useACPStore.getState().tasks.find(t => t.title === 'Valid Task');
      expect(newTask).toBeDefined();
      expect(newTask?.priority).toBe('P0');
      expect(newTask?.estimatedTime).toBe(120);
    });
  });

  // ============ addDepartment 验证 ============

  describe('addDepartment 验证', () => {
    it('应拒绝不存在的 headId', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const before = useACPStore.getState().organization.departments.length;

      useACPStore.getState().addDepartment({ name: 'Test Dept', headId: 'non-existent-id' });

      const after = useACPStore.getState().organization.departments.length;
      expect(after).toBe(before);
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('应接受有效数据的部门', () => {
      const before = useACPStore.getState().organization.departments.length;
      const ceoId = useACPStore.getState().organization.members.find(m => m.role === 'ceo')!.id;

      useACPStore.getState().addDepartment({ name: 'Valid Dept', headId: ceoId, budget: 50000 });

      const after = useACPStore.getState().organization.departments.length;
      expect(after).toBe(before + 1);
      const newDept = useACPStore.getState().organization.departments.find(d => d.name === 'Valid Dept');
      expect(newDept).toBeDefined();
      expect(newDept?.head).toBe(ceoId);
    });
  });

  // ============ sendMessage 验证 ============

  describe('sendMessage 验证', () => {
    it('应拒绝 from === to 的消息', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const before = useACPStore.getState().messages.length;
      const memberId = useACPStore.getState().organization.members[0].id;

      useACPStore.getState().sendMessage(memberId, memberId, 'request', 'hello');

      const after = useACPStore.getState().messages.length;
      expect(after).toBe(before);
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('应拒绝空内容的消息', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const before = useACPStore.getState().messages.length;
      const [from, to] = [
        useACPStore.getState().organization.members[0].id,
        useACPStore.getState().organization.members[1].id,
      ];

      useACPStore.getState().sendMessage(from, to, 'request', '');
      useACPStore.getState().sendMessage(from, to, 'request', '   ');

      const after = useACPStore.getState().messages.length;
      expect(after).toBe(before);
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('应接受有效数据的消息', () => {
      const before = useACPStore.getState().messages.length;
      const [from, to] = [
        useACPStore.getState().organization.members[0].id,
        useACPStore.getState().organization.members[1].id,
      ];

      useACPStore.getState().sendMessage(from, to, 'request', '请协助处理任务');

      const after = useACPStore.getState().messages.length;
      expect(after).toBe(before + 1);
      const newMsg = useACPStore.getState().messages[0];
      expect(newMsg.from).toBe(from);
      expect(newMsg.to).toBe(to);
      expect(newMsg.content).toBe('请协助处理任务');
    });
  });
});
