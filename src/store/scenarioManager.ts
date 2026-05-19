/**
 * 场景管理 Store
 * 独立的 Zustand store，用于保存/加载/管理 ACP 模拟场景
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useACPStore } from './acpStore';

// ============ 类型定义 ============

export interface ScenarioSnapshot {
  tasks: ReturnType<typeof useACPStore.getState>['tasks'];
  organization: ReturnType<typeof useACPStore.getState>['organization'];
  messages: ReturnType<typeof useACPStore.getState>['messages'];
  knowledgeNodes: ReturnType<typeof useACPStore.getState>['knowledgeNodes'];
  evaluationScores: ReturnType<typeof useACPStore.getState>['evaluationScores'];
  evaluation: ReturnType<typeof useACPStore.getState>['evaluation'];
  schedulerConfig: ReturnType<typeof useACPStore.getState>['schedulerConfig'];
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  snapshot: ScenarioSnapshot;
}

interface ScenarioState {
  scenarios: Scenario[];
  activeScenarioId: string | null;

  // Actions
  saveScenario: (name: string, description: string) => string | null;
  loadScenario: (id: string) => boolean;
  deleteScenario: (id: string) => void;
  renameScenario: (id: string, name: string) => void;
  duplicateScenario: (id: string) => string | null;
  getActiveScenario: () => Scenario | null;
  loadPreset: (snapshot: ScenarioSnapshot, name: string, description: string) => string | null;
  clearAll: () => void;
}

const MAX_SCENARIOS = 20;

// ============ Store 创建 ============

export const useScenarioStore = create<ScenarioState>()(
  persist(
    (set, get) => ({
      scenarios: [],
      activeScenarioId: null,

      saveScenario: (name: string, description: string): string | null => {
        try {
          const acpState = useACPStore.getState();
          const snapshot: ScenarioSnapshot = {
            tasks: structuredClone(acpState.tasks),
            organization: structuredClone(acpState.organization),
            messages: structuredClone(acpState.messages),
            knowledgeNodes: structuredClone(acpState.knowledgeNodes),
            evaluationScores: structuredClone(acpState.evaluationScores),
            evaluation: structuredClone(acpState.evaluation),
            schedulerConfig: structuredClone(acpState.schedulerConfig),
          };

          const now = Date.now();
          const id = `scenario-${now}-${Math.random().toString(36).slice(2, 8)}`;

          const newScenario: Scenario = {
            id,
            name,
            description,
            createdAt: now,
            updatedAt: now,
            snapshot,
          };

          set((state) => {
            const updated = [newScenario, ...state.scenarios];
            // 最多保存 MAX_SCENARIOS 个场景，超出则删除最旧的
            if (updated.length > MAX_SCENARIOS) {
              updated.length = MAX_SCENARIOS;
            }
            return {
              scenarios: updated,
              activeScenarioId: id,
            };
          });

          return id;
        } catch (error) {
          console.warn('保存场景失败:', error);
          return null;
        }
      },

      loadScenario: (id: string): boolean => {
        const scenario = get().scenarios.find((s) => s.id === id);
        if (!scenario) return false;

        const { snapshot } = scenario;
        useACPStore.setState({
          tasks: snapshot.tasks,
          organization: snapshot.organization,
          messages: snapshot.messages,
          knowledgeNodes: snapshot.knowledgeNodes,
          evaluationScores: snapshot.evaluationScores,
          evaluation: snapshot.evaluation,
          schedulerConfig: snapshot.schedulerConfig,
        });

        // 清除 undo 历史，标记为内部操作避免被记录
        useACPStore.setState({ _isUndoRedoAction: true } as any);
        useACPStore.getState().clearHistory();
        useACPStore.setState({ _isUndoRedoAction: false } as any);

        set({ activeScenarioId: id });
        return true;
      },

      deleteScenario: (id: string): void => {
        set((state) => ({
          scenarios: state.scenarios.filter((s) => s.id !== id),
          activeScenarioId: state.activeScenarioId === id ? null : state.activeScenarioId,
        }));
      },

      renameScenario: (id: string, name: string): void => {
        set((state) => ({
          scenarios: state.scenarios.map((s) =>
            s.id === id ? { ...s, name, updatedAt: Date.now() } : s
          ),
        }));
      },

      duplicateScenario: (id: string): string | null => {
        const scenario = get().scenarios.find((s) => s.id === id);
        if (!scenario) return null;

        const now = Date.now();
        const newId = `scenario-${now}-${Math.random().toString(36).slice(2, 8)}`;

        const duplicated: Scenario = {
          ...scenario,
          id: newId,
          name: `${scenario.name} (副本)`,
          createdAt: now,
          updatedAt: now,
          snapshot: structuredClone(scenario.snapshot),
        };

        set((state) => {
          const updated = [duplicated, ...state.scenarios];
          if (updated.length > MAX_SCENARIOS) {
            updated.length = MAX_SCENARIOS;
          }
          return { scenarios: updated };
        });

        return newId;
      },

      getActiveScenario: (): Scenario | null => {
        const state = get();
        if (!state.activeScenarioId) return null;
        return state.scenarios.find((s) => s.id === state.activeScenarioId) ?? null;
      },

      loadPreset: (snapshot: ScenarioSnapshot, name: string, description: string): string | null => {
        // 先将预设数据应用到 ACP store
        useACPStore.setState({
          tasks: snapshot.tasks,
          organization: snapshot.organization,
          messages: snapshot.messages,
          knowledgeNodes: snapshot.knowledgeNodes,
          evaluationScores: snapshot.evaluationScores,
          evaluation: snapshot.evaluation,
          schedulerConfig: snapshot.schedulerConfig,
        });

        // 同时保存为场景
        return get().saveScenario(name, description);
      },

      clearAll: (): void => {
        set({ scenarios: [], activeScenarioId: null });
      },
    }),
    {
      name: 'acp-scenarios',
      // 只持久化场景数据，不持久化 activeScenarioId
      partialize: (state) => ({
        scenarios: state.scenarios,
      }),
    }
  )
);

export default useScenarioStore;
