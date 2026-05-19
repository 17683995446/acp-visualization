/**
 * ACP 实时数据模拟引擎
 * 模拟 Agent 活动、任务进度、消息生成，使平台具有动态感
 *
 * 模拟引擎是一个轻量级的定时器包装器，所有实际状态变更都委托给
 * acpStore.runSchedulerTick，避免双重逻辑冲突。
 */

import { useACPStore } from '../store/acpStore';
import { eventBus } from '../services/eventBus';

// HMR 清理
if (import.meta.hot) {
  import.meta.hot.dispose(() => destroy());
}

// ============ 类型定义 ============

export interface SimulationConfig {
  /** 模拟 tick 间隔（毫秒），默认 3000 */
  tickInterval: number;
  /** 每个 tick 任务进度递增概率 (0-1)，默认 0.3 */
  taskProgressChance: number;
  /** 每个 tick 生成新消息概率 (0-1)，默认 0.2 */
  messageChance: number;
  /** 每个 tick Agent 状态变更概率 (0-1)，默认 0.1 */
  statusChangeChance: number;
  /** 进度递增范围 [min, max]，默认 [5, 15] */
  progressRange: [number, number];
}

export interface SimulationState {
  isRunning: boolean;
  tickCount: number;
  lastTickAt: number | null;
  config: SimulationConfig;
}

// ============ 默认配置 ============

export const DEFAULT_SIMULATION_CONFIG: SimulationConfig = {
  tickInterval: 3000,
  taskProgressChance: 0.3,
  messageChance: 0.2,
  statusChangeChance: 0.1,
  progressRange: [5, 15],
};

// ============ 模拟引擎内部状态 ============

let intervalId: ReturnType<typeof setInterval> | null = null;
let refCount = 0;
let state: SimulationState = {
  isRunning: false,
  tickCount: 0,
  lastTickAt: null,
  config: { ...DEFAULT_SIMULATION_CONFIG },
};

// ============ 状态变更监听器 ============

type StateListener = (newState: SimulationState) => void;
const listeners = new Set<StateListener>();

function notifyListeners(): void {
  const snapshot = { ...state, config: { ...state.config } };
  listeners.forEach(listener => listener(snapshot));
}

// ============ 核心 Tick 逻辑 ============

function simulationTick(): void {
  try {
    const store = useACPStore.getState();
    state.tickCount++;
    state.lastTickAt = Date.now();
    store.runSchedulerTick();
    eventBus.emit('simulation:tick', { tickCount: state.tickCount, timestamp: state.lastTickAt });
    notifyListeners();
  } catch (error) {
    console.error('[Simulation] Tick failed:', error);
    eventBus.emit('system:error', { message: '模拟引擎 tick 失败', error });
  }
}

// ============ 公共 API ============

/**
 * 启动模拟引擎
 * 使用引用计数机制，多个组件调用 start 不会重复启动
 */
export function startSimulation(): void {
  refCount++;
  if (state.isRunning) return; // 已经在运行

  state.isRunning = true;
  notifyListeners();

  eventBus.emit('system:simulationStarted');
  useACPStore.getState().addLog('success', '模拟引擎已启动');

  intervalId = setInterval(simulationTick, Math.max(100, state.config.tickInterval || 3000));
}

/**
 * 停止模拟引擎
 * 使用引用计数机制，只有当所有组件都调用 stop 后才真正停止
 */
export function stopSimulation(): void {
  refCount = Math.max(0, refCount - 1);
  if (refCount > 0) return; // 其他组件仍在使用
  if (!state.isRunning) return;

  state.isRunning = false;

  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }

  notifyListeners();

  eventBus.emit('system:simulationStopped');
  useACPStore.getState().addLog('info', '模拟引擎已停止');
}

/**
 * 获取当前模拟状态
 */
export function getSimulationState(): SimulationState {
  return { ...state, config: { ...state.config } };
}

/**
 * 更新模拟配置
 * 如果模拟正在运行，会重启定时器以应用新的 tickInterval
 */
export function setSimulationConfig(config: Partial<SimulationConfig>): void {
  const oldInterval = state.config.tickInterval;
  state.config = { ...state.config, ...config };

  // 如果 tickInterval 变化且模拟正在运行，重启定时器
  if (
    state.isRunning &&
    config.tickInterval !== undefined &&
    config.tickInterval !== oldInterval
  ) {
    if (intervalId !== null) {
      clearInterval(intervalId);
    }
    intervalId = setInterval(simulationTick, state.config.tickInterval);
  }

  notifyListeners();
}

/**
 * 重置模拟配置为默认值
 */
export function resetSimulationConfig(): void {
  setSimulationConfig({ ...DEFAULT_SIMULATION_CONFIG });
}

/**
 * 订阅模拟状态变更
 * @returns 取消订阅函数
 */
export function onSimulationStateChange(
  listener: StateListener
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * 销毁模拟引擎，清理所有状态
 * 用于 HMR 热更新或测试场景下重置模块级状态
 */
export function destroy(): void {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
  refCount = 0;
  state = {
    isRunning: false,
    tickCount: 0,
    lastTickAt: null,
    config: { ...DEFAULT_SIMULATION_CONFIG },
  };
  listeners.clear();
}
