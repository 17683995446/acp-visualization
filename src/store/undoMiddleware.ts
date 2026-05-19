/**
 * Undo/Redo 中间件
 *
 * 轻量级 Zustand 中间件，自动追踪状态变更并支持撤销/重做。
 *
 * 设计要点：
 * - 只追踪 TRACKED_KEYS 中的字段
 * - undoStack / redoStack 最大容量 50 条
 * - 模拟运行期间自动禁用追踪
 * - undo/redo 操作本身不被记录到历史中
 * - 通过 setUndoDescription() 在 action 中设置操作描述
 */

import type { StateCreator, StoreApi } from 'zustand';
import type { ACPState } from './acpStore';

// ============ 类型定义 ============

/** 单条操作记录 */
export interface HistoryEntry {
  timestamp: number;
  description: string;
  patch: {
    prev: Partial<ACPState>;
    next: Partial<ACPState>;
  };
}

/** Undo/Redo 相关的状态和操作 */
export interface UndoState {
  _undoStack: HistoryEntry[];
  _redoStack: HistoryEntry[];
  _undoRedoEnabled: boolean;
  _maxHistorySize: number;
  _isUndoRedoAction: boolean;

  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  getUndoDescription: () => string | null;
  getRedoDescription: () => string | null;
  clearHistory: () => void;
  enableUndoRedo: (enabled: boolean) => void;
}

// ============ 配置 ============

/** 需要追踪的状态字段（排除 logs，因为日志是辅助信息，不需要撤销） */
const TRACKED_KEYS = new Set<string>([
  'tasks',
  'organization',
  'messages',
  'knowledgeNodes',
  'evaluationScores',
  'evaluation',
  'schedulerConfig',
]);

const DEFAULT_MAX_HISTORY_SIZE = 50;

// ============ 模块级描述传递 ============

/**
 * 当前操作描述（模块级变量）
 * 在 action 调用 set 之前设置，中间件读取后自动清除。
 */
let _pendingDescription: string | null = null;

/**
 * 设置当前操作描述
 * 在 action 的 set 调用之前使用，中间件会自动读取并清除。
 */
export function setUndoDescription(description: string): void {
  _pendingDescription = description;
}

/**
 * 清除当前操作描述（用于不需要记录历史的 set 调用）
 */
export function clearUndoDescription(): void {
  _pendingDescription = null;
}

// ============ 工具函数 ============

/**
 * 从状态中提取需要追踪的字段
 */
function extractTracked(state: Record<string, unknown>): Partial<ACPState> {
  const tracked: Record<string, unknown> = {};
  for (const key of TRACKED_KEYS) {
    if (key in state) {
      tracked[key] = state[key];
    }
  }
  return tracked as Partial<ACPState>;
}

/**
 * 深拷贝追踪字段（用于历史记录）
 */
function deepCloneTracked(state: Partial<ACPState>): Partial<ACPState> {
  const cloned: Record<string, unknown> = {};
  const stateRecord = state as Record<string, unknown>;
  for (const key of TRACKED_KEYS) {
    const val = stateRecord[key];
    if (val !== undefined) {
      cloned[key] = structuredClone(val);
    }
  }
  return cloned as Partial<ACPState>;
}

// ============ 中间件实现 ============

/**
 * Undo/Redo 中间件
 *
 * 包裹在 persistMiddleware 内层，拦截 setState 调用，
 * 在状态变更前后对比差异并记录到历史栈中。
 */
export const undoMiddleware =
  <T extends ACPState & UndoState>(
    config: StateCreator<T>
  ): StateCreator<T> =>
  (set, get, api) => {
    // 保存原始的 set
    const originalSet = set;

    // 替换 set 函数，拦截所有状态变更
    const wrappedSet: typeof set = (partial, replace) => {
      const currentState = (api as StoreApi<T>).getState();

      // 检查是否是 undo/redo 操作（通过 partial 中的标记判断）
      const partialRecord = typeof partial === 'function' ? null : partial as Record<string, unknown>;
      const isUndoRedo = partialRecord?._isUndoRedoAction === true;

      if (isUndoRedo) {
        // undo/redo 操作：执行后自动清除标记
        originalSet(partial, replace as false);
        originalSet({ _isUndoRedoAction: false } as unknown as Partial<T>, false);
        return;
      }

      // 如果是 undo/redo 触发的操作（标记仍为 true），直接执行不记录
      if (currentState._isUndoRedoAction) {
        return originalSet(partial, replace as false);
      }

      // 如果 undo/redo 被禁用（如模拟运行期间），直接执行不记录
      if (!currentState._undoRedoEnabled) {
        return originalSet(partial, replace as false);
      }

      // 读取并清除待处理的操作描述
      const description = _pendingDescription ?? '未知操作';
      _pendingDescription = null;

      // 获取变更前的追踪快照
      const beforeSnapshot = extractTracked(currentState as unknown as Record<string, unknown>);

      // 执行原始 set
      originalSet(partial, replace as false);

      // 获取变更后的追踪快照
      const afterState = (api as StoreApi<T>).getState();
      const afterSnapshot = extractTracked(afterState as unknown as Record<string, unknown>);

      // 比较前后快照是否有变化
      let hasChanges = false;
      for (const key of TRACKED_KEYS) {
        const beforeRecord = beforeSnapshot as Record<string, unknown>;
        const afterRecord = afterSnapshot as Record<string, unknown>;
        if (beforeRecord[key] !== afterRecord[key]) {
          hasChanges = true;
          break;
        }
      }
      if (!hasChanges) return;

      // 清理 redoStack（新操作后不能再 redo）
      const currentUndoStack = [...currentState._undoStack];
      const currentRedoStack: HistoryEntry[] = [];

      // 保存完整快照而非差异
      const entry: HistoryEntry = {
        timestamp: Date.now(),
        description,
        patch: {
          prev: deepCloneTracked(beforeSnapshot),
          next: deepCloneTracked(afterSnapshot),
        },
      };

      currentUndoStack.push(entry);

      // 限制历史大小
      if (currentUndoStack.length > (currentState._maxHistorySize ?? DEFAULT_MAX_HISTORY_SIZE)) {
        currentUndoStack.shift();
      }

      // 更新历史栈（不触发历史记录，因为 _isUndoRedoAction 未设置）
      originalSet(
        {
          _undoStack: currentUndoStack,
          _redoStack: currentRedoStack,
        } as unknown as Partial<T>,
        false
      );
    };

    // 使用 wrappedSet 创建 store
    const result = config(wrappedSet, get, api);

    return result;
  };

// ============ Undo/Redo Actions ============

/**
 * 创建 undo/redo 相关的 actions
 * 这些 actions 需要在 store config 中使用
 */
export function createUndoActions(
  set: (partial: Partial<ACPState & UndoState> | ((state: ACPState & UndoState) => Partial<ACPState & UndoState>)) => void,
  get: () => ACPState & UndoState
) {
  return {
    _undoStack: [] as HistoryEntry[],
    _redoStack: [] as HistoryEntry[],
    _undoRedoEnabled: true,
    _maxHistorySize: DEFAULT_MAX_HISTORY_SIZE,
    _isUndoRedoAction: false,

    undo: () => {
      const state = get();
      if (state._undoStack.length === 0 || !state._undoRedoEnabled) return;

      const entry = state._undoStack[state._undoStack.length - 1];
      set({
        _isUndoRedoAction: true,
        ...entry.patch.prev,
        _undoStack: state._undoStack.slice(0, -1),
        _redoStack: [...state._redoStack, entry],
      } as Partial<ACPState & UndoState>);
    },

    redo: () => {
      const state = get();
      if (state._redoStack.length === 0 || !state._undoRedoEnabled) return;

      const entry = state._redoStack[state._redoStack.length - 1];
      set({
        _isUndoRedoAction: true,
        ...entry.patch.next,
        _undoStack: [...state._undoStack, entry],
        _redoStack: state._redoStack.slice(0, -1),
      } as Partial<ACPState & UndoState>);
    },

    canUndo: () => {
      return get()._undoStack.length > 0 && get()._undoRedoEnabled;
    },

    canRedo: () => {
      return get()._redoStack.length > 0 && get()._undoRedoEnabled;
    },

    getUndoDescription: () => {
      const stack = get()._undoStack;
      if (stack.length === 0) return null;
      return stack[stack.length - 1].description;
    },

    getRedoDescription: () => {
      const stack = get()._redoStack;
      if (stack.length === 0) return null;
      return stack[stack.length - 1].description;
    },

    clearHistory: () => {
      set({
        _undoStack: [],
        _redoStack: [],
      } as Partial<ACPState & UndoState>);
    },

    enableUndoRedo: (enabled: boolean) => {
      set({
        _undoRedoEnabled: enabled,
      } as Partial<ACPState & UndoState>);
    },
  };
}
