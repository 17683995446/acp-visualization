/**
 * useSimulation Hook
 * 将模拟引擎包装为 React Hook，提供响应式状态管理
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  startSimulation,
  stopSimulation,
  getSimulationState,
  setSimulationConfig,
  resetSimulationConfig,
  onSimulationStateChange,
} from '../engine/simulation';
import type { SimulationConfig, SimulationState } from '../engine/simulation';

interface UseSimulationReturn {
  isRunning: boolean;
  tickCount: number;
  config: SimulationConfig;
  start: () => void;
  stop: () => void;
  toggle: () => void;
  updateConfig: (config: Partial<SimulationConfig>) => void;
  resetConfig: () => void;
}

export function useSimulation(): UseSimulationReturn {
  const initialState = getSimulationState();
  const [simState, setSimState] = useState<SimulationState>(initialState);
  const isRunningRef = useRef(simState.isRunning);
  const startedRef = useRef(false);

  // 保持 ref 与状态同步
  isRunningRef.current = simState.isRunning;

  // 订阅模拟引擎状态变更
  useEffect(() => {
    const unsubscribe = onSimulationStateChange((newState) => {
      setSimState(newState);
    });

    return unsubscribe;
  }, []);

  // 组件卸载时自动停止模拟引擎，防止 refCount 泄漏
  useEffect(() => {
    return () => {
      if (startedRef.current) {
        stopSimulation();
        startedRef.current = false;
      }
    };
  }, []);

  const start = useCallback(() => {
    startedRef.current = true;
    startSimulation();
  }, []);

  const stop = useCallback(() => {
    stopSimulation();
  }, []);

  const toggle = useCallback(() => {
    if (isRunningRef.current) {
      stopSimulation();
    } else {
      startSimulation();
    }
  }, []); // 无依赖，使用 ref 避免闭包过期

  const updateConfig = useCallback((config: Partial<SimulationConfig>) => {
    setSimulationConfig(config);
  }, []);

  const resetConfig = useCallback(() => {
    resetSimulationConfig();
  }, []);

  return {
    isRunning: simState.isRunning,
    tickCount: simState.tickCount,
    config: simState.config,
    start,
    stop,
    toggle,
    updateConfig,
    resetConfig,
  };
}

export default useSimulation;
