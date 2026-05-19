/**
 * 场景管理 Store 测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useScenarioStore } from '../store/scenarioManager';
import { useACPStore } from '../store/acpStore';
import { PRESET_SCENARIOS } from '../scenarios/presets';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

// Reset stores before each test
beforeEach(() => {
  localStorageMock.clear();
  // Reset scenario store
  useScenarioStore.setState({
    scenarios: [],
    activeScenarioId: null,
  });
  // Reset ACP store to initial state
  const acpState = useACPStore.getState();
  useACPStore.setState({
    tasks: acpState.tasks,
    organization: acpState.organization,
    messages: [],
    knowledgeNodes: acpState.knowledgeNodes,
    evaluationScores: acpState.evaluationScores,
    evaluation: acpState.evaluation,
    schedulerConfig: acpState.schedulerConfig,
    logs: [],
    isSimulating: false,
    lastSchedulerResult: null,
  });
});

describe('ScenarioManager Store', () => {
  describe('saveScenario', () => {
    it('应该保存场景并出现在列表中', () => {
      const id = useScenarioStore.getState().saveScenario('测试场景', '这是一个测试场景');
      expect(id).toBeTruthy();
      expect(id).toMatch(/^scenario-/);

      const scenarios = useScenarioStore.getState().scenarios;
      expect(scenarios).toHaveLength(1);
      expect(scenarios[0].name).toBe('测试场景');
      expect(scenarios[0].description).toBe('这是一个测试场景');
      expect(scenarios[0].snapshot).toBeDefined();
      expect(scenarios[0].snapshot.tasks).toBeDefined();
      expect(scenarios[0].snapshot.organization).toBeDefined();
    });

    it('保存后 activeScenarioId 应该更新', () => {
      const id = useScenarioStore.getState().saveScenario('场景1', '描述');
      expect(useScenarioStore.getState().activeScenarioId).toBe(id);
    });

    it('应该保存 ACP store 的当前状态快照', () => {
      useScenarioStore.getState().saveScenario('快照测试', '测试');

      const scenario = useScenarioStore.getState().scenarios[0];
      const acpState = useACPStore.getState();

      expect(scenario.snapshot.tasks).toEqual(acpState.tasks);
      expect(scenario.snapshot.organization).toEqual(acpState.organization);
      expect(scenario.snapshot.schedulerConfig).toEqual(acpState.schedulerConfig);
    });
  });

  describe('loadScenario', () => {
    it('应该正确加载场景并恢复 ACP store 状态', () => {
      // 先保存一个场景
      const id = useScenarioStore.getState().saveScenario('加载测试', '测试加载');
      expect(id).not.toBeNull();

      // 修改 ACP store 状态
      useACPStore.setState({ messages: [{ id: 'msg-test', from: 'a', to: 'b', type: 'notification', content: 'test', timestamp: Date.now(), read: false }] });

      // 加载场景
      const result = useScenarioStore.getState().loadScenario(id!);
      expect(result).toBe(true);

      // 验证 activeScenarioId 更新
      expect(useScenarioStore.getState().activeScenarioId).toBe(id);
    });

    it('加载不存在的场景应该返回 false', () => {
      const result = useScenarioStore.getState().loadScenario('scenario-nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('deleteScenario', () => {
    it('应该从列表中删除场景', () => {
      const id = useScenarioStore.getState().saveScenario('待删除', '测试');
      expect(id).not.toBeNull();
      expect(useScenarioStore.getState().scenarios).toHaveLength(1);

      useScenarioStore.getState().deleteScenario(id!);
      expect(useScenarioStore.getState().scenarios).toHaveLength(0);
    });

    it('删除当前活跃场景应该清除 activeScenarioId', () => {
      const id = useScenarioStore.getState().saveScenario('活跃场景', '测试');
      expect(id).not.toBeNull();
      expect(useScenarioStore.getState().activeScenarioId).toBe(id);

      useScenarioStore.getState().deleteScenario(id!);
      expect(useScenarioStore.getState().activeScenarioId).toBeNull();
    });

    it('删除非活跃场景不应该影响 activeScenarioId', () => {
      const id1 = useScenarioStore.getState().saveScenario('场景1', '测试');
      const id2 = useScenarioStore.getState().saveScenario('场景2', '测试');
      expect(id1).not.toBeNull();
      expect(id2).not.toBeNull();
      // activeScenarioId 应该是最后保存的
      expect(useScenarioStore.getState().activeScenarioId).toBe(id2);

      useScenarioStore.getState().deleteScenario(id1!);
      expect(useScenarioStore.getState().activeScenarioId).toBe(id2);
    });
  });

  describe('duplicateScenario', () => {
    it('应该创建场景的副本', () => {
      const id = useScenarioStore.getState().saveScenario('原始场景', '原始描述');
      expect(id).not.toBeNull();
      expect(useScenarioStore.getState().scenarios).toHaveLength(1);

      const newId = useScenarioStore.getState().duplicateScenario(id!);
      expect(newId).toBeTruthy();
      expect(newId).not.toBe(id);

      const scenarios = useScenarioStore.getState().scenarios;
      expect(scenarios).toHaveLength(2);

      const original = scenarios.find((s) => s.id === id);
      const copy = scenarios.find((s) => s.id === newId);
      expect(copy).toBeDefined();
      expect(copy!.name).toBe('原始场景 (副本)');
      expect(copy!.snapshot).toEqual(original!.snapshot);
    });

    it('复制不存在的场景应该返回 null', () => {
      const result = useScenarioStore.getState().duplicateScenario('scenario-nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('renameScenario', () => {
    it('应该更新场景名称', () => {
      const id = useScenarioStore.getState().saveScenario('旧名称', '测试');
      expect(id).not.toBeNull();
      useScenarioStore.getState().renameScenario(id!, '新名称');

      const scenario = useScenarioStore.getState().scenarios.find((s) => s.id === id);
      expect(scenario).toBeDefined();
      expect(scenario!.name).toBe('新名称');
    });

    it('重命名应该更新 updatedAt', () => {
      vi.useFakeTimers();
      const id = useScenarioStore.getState().saveScenario('场景', '测试');
      expect(id).not.toBeNull();
      const originalUpdatedAt = useScenarioStore.getState().scenarios[0].updatedAt;

      // 等待一小段时间确保时间戳不同
      vi.advanceTimersByTime(1);

      useScenarioStore.getState().renameScenario(id!, '新名称');
      const scenario = useScenarioStore.getState().scenarios.find((s) => s.id === id);
      expect(scenario!.updatedAt).toBeGreaterThanOrEqual(originalUpdatedAt);
      vi.useRealTimers();
    });
  });

  describe('最多 20 个场景限制', () => {
    it('不应该超过 20 个场景', () => {
      // 创建 25 个场景
      for (let i = 0; i < 25; i++) {
        useScenarioStore.getState().saveScenario(`场景 ${i}`, `描述 ${i}`);
      }

      const scenarios = useScenarioStore.getState().scenarios;
      expect(scenarios.length).toBeLessThanOrEqual(20);
    });

    it('超出限制时应该删除最旧的场景', () => {
      for (let i = 0; i < 22; i++) {
        useScenarioStore.getState().saveScenario(`场景 ${i}`, `描述 ${i}`);
      }

      const scenarios = useScenarioStore.getState().scenarios;
      expect(scenarios).toHaveLength(20);

      // 最新的场景应该在列表中
      const names = scenarios.map((s) => s.name);
      expect(names).toContain('场景 21');
      // 最旧的可能已被删除
      expect(scenarios.length).toBe(20);
    });
  });

  describe('预设场景', () => {
    it('预设场景应该有 4 个', () => {
      expect(PRESET_SCENARIOS).toHaveLength(4);
    });

    it('每个预设场景应该包含完整的 snapshot', () => {
      for (const preset of PRESET_SCENARIOS) {
        expect(preset.name).toBeTruthy();
        expect(preset.description).toBeTruthy();
        expect(preset.snapshot).toBeDefined();
        expect(preset.snapshot.tasks).toBeDefined();
        expect(preset.snapshot.organization).toBeDefined();
        expect(preset.snapshot.messages).toBeDefined();
        expect(preset.snapshot.knowledgeNodes).toBeDefined();
        expect(preset.snapshot.evaluationScores).toBeDefined();
        expect(preset.snapshot.evaluation).toBeDefined();
        expect(preset.snapshot.schedulerConfig).toBeDefined();
      }
    });

    it('应该能通过 loadPreset 加载预设场景', () => {
      const preset = PRESET_SCENARIOS[0];
      const id = useScenarioStore.getState().loadPreset(
        preset.snapshot,
        preset.name,
        preset.description
      );

      expect(id).toBeTruthy();
      expect(useScenarioStore.getState().scenarios).toHaveLength(1);
      expect(useScenarioStore.getState().scenarios[0].name).toBe(preset.name);
    });
  });

  describe('空项目启动场景', () => {
    it('空项目场景应该有空的初始状态', () => {
      const emptyPreset = PRESET_SCENARIOS[3];
      expect(emptyPreset.name).toBe('空项目启动');
      expect(emptyPreset.snapshot.tasks).toHaveLength(0);
      expect(emptyPreset.snapshot.organization.members).toHaveLength(0);
      expect(emptyPreset.snapshot.organization.departments).toHaveLength(0);
      expect(emptyPreset.snapshot.messages).toHaveLength(0);
      expect(emptyPreset.snapshot.knowledgeNodes).toHaveLength(0);
    });

    it('加载空项目场景应该重置 ACP store', () => {
      // 先保存一个有数据的场景
      useScenarioStore.getState().saveScenario('有数据场景', '有数据');

      // 加载空项目预设
      const emptyPreset = PRESET_SCENARIOS[3];
      useScenarioStore.getState().loadPreset(
        emptyPreset.snapshot,
        emptyPreset.name,
        emptyPreset.description
      );

      // 验证 ACP store 被重置
      const acpState = useACPStore.getState();
      expect(acpState.tasks).toHaveLength(0);
      expect(acpState.organization.members).toHaveLength(0);
      expect(acpState.messages).toHaveLength(0);
    });
  });

  describe('getActiveScenario', () => {
    it('没有活跃场景时应该返回 null', () => {
      expect(useScenarioStore.getState().getActiveScenario()).toBeNull();
    });

    it('有活跃场景时应该返回对应场景', () => {
      const id = useScenarioStore.getState().saveScenario('活跃', '测试');
      expect(id).not.toBeNull();
      const active = useScenarioStore.getState().getActiveScenario();
      expect(active).toBeDefined();
      expect(active!.id).toBe(id);
    });
  });

  describe('clearAll', () => {
    it('应该清除所有场景', () => {
      useScenarioStore.getState().saveScenario('场景1', '测试1');
      useScenarioStore.getState().saveScenario('场景2', '测试2');
      expect(useScenarioStore.getState().scenarios).toHaveLength(2);

      useScenarioStore.getState().clearAll();
      expect(useScenarioStore.getState().scenarios).toHaveLength(0);
      expect(useScenarioStore.getState().activeScenarioId).toBeNull();
    });
  });
});
