import type { StateCreator } from 'zustand';
import type { ACPState } from './acpStore';
import { eventBus } from '../services/eventBus';

const STORAGE_KEY = 'acp-store-v1';
const DATA_VERSION = 2;

/**
 * 版本迁移函数
 * 将旧版本的持久化数据迁移到最新版本
 */
function migrate(data: any, fromVersion: number): any {
  let migrated = { ...data };

  if (fromVersion < 2) {
    // v1 → v2: Add schedulerConfig if missing
    if (!migrated.schedulerConfig) {
      migrated.schedulerConfig = {
        capabilityWeight: 0.3,
        reputationWeight: 0.25,
        workloadWeight: 0.25,
        priorityWeight: 0.2,
        preferIdleAgents: true,
      };
    }
    // v1 → v2: Add evaluationScores if missing
    if (!migrated.evaluationScores) {
      migrated.evaluationScores = [];
    }
  }

  migrated._version = DATA_VERSION;
  return migrated;
}

/**
 * Zustand 持久化中间件
 *
 * 功能：
 * 1. 应用初始化时从 localStorage 加载状态（在 config 之后，确保初始状态完整）
 * 2. 状态变更时自动保存到 localStorage（带防抖）
 * 3. 排除不可序列化的字段（如函数、DOM 引用等）
 * 4. 处理 schema 变更时的向后兼容（版本迁移）
 * 5. 持久化失败时通过事件总线通知
 */
export const persistMiddleware =
  <T extends ACPState>(config: StateCreator<T>): StateCreator<T> =>
  (set, get, api) => {
    // 先调用 config 创建原始 store，确保初始状态完整定义
    const result = config(set, get, api);

    // 同步加载持久化数据，避免 UI 闪烁（setTimeout 会导致初始渲染后再覆盖状态）
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const version = parsed._version || 1;
        const migrated = version < DATA_VERSION ? migrate(parsed, version) : parsed;
        const currentState = api.getState();
        const { _version, ...persistedState } = migrated;
        api.setState({ ...currentState, ...persistedState });
      }
    } catch (e) {
      console.error('Failed to load persisted state:', e);
    }

    // 防抖持久化：避免每次状态变更都写入 localStorage
    let persistTimer: ReturnType<typeof setTimeout> | null = null;

    // 订阅状态变更并保存
    api.subscribe((state) => {
      // 排除不可序列化的字段
      const persistState = {
        _version: DATA_VERSION,
        organization: state.organization,
        tasks: state.tasks,
        messages: state.messages,
        knowledgeNodes: state.knowledgeNodes,
        evaluation: state.evaluation,
        evaluationScores: state.evaluationScores,
        schedulerConfig: state.schedulerConfig,
      };

      if (persistTimer) clearTimeout(persistTimer);
      persistTimer = setTimeout(() => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(persistState));
        } catch (e) {
          console.error('Failed to persist state to localStorage:', e);
          eventBus.emit('system:error', { message: '数据持久化失败，本地存储可能已满' });
        }
      }, 500);
    });

    return result;
  };

/**
 * 清除持久化数据
 * 用于用户手动重置或登出时
 */
export const clearPersistedState = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear persisted state:', e);
  }
};

/**
 * 获取持久化数据的元信息
 */
export const getPersistedStateInfo = (): { exists: boolean; size: number; timestamp?: number } => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { exists: false, size: 0 };
    }

    const parsed = JSON.parse(stored);
    const size = new Blob([stored]).size;

    // 尝试从任务或消息中获取时间戳
    const timestamp = parsed.tasks?.[0]?.createdAt || parsed.messages?.[0]?.timestamp;

    return {
      exists: true,
      size,
      timestamp,
    };
  } catch {
    return { exists: false, size: 0 };
  }
};

export default persistMiddleware;
