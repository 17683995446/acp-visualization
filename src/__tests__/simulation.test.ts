/**
 * 模拟引擎单元测试
 * 测试 simulation.ts 的公共 API：状态管理、启停控制、配置更新
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getSimulationState,
  startSimulation,
  stopSimulation,
  setSimulationConfig,
  resetSimulationConfig,
  onSimulationStateChange,
  DEFAULT_SIMULATION_CONFIG,
} from '../engine/simulation';
import { useACPStore } from '../store/acpStore';
import { eventBus } from '../services/eventBus';

describe('Simulation Engine', () => {
  beforeEach(() => {
    // 确保模拟引擎在每次测试前处于停止状态
    stopSimulation();
    resetSimulationConfig();

    // 重置 store 状态
    useACPStore.setState({
      organization: useACPStore.getInitialState().organization,
      tasks: useACPStore.getInitialState().tasks,
      messages: [],
      knowledgeNodes: useACPStore.getInitialState().knowledgeNodes,
      logs: [],
      isSimulating: false,
      lastSchedulerResult: null,
    });
  });

  afterEach(() => {
    // 确保测试结束后清理
    stopSimulation();
    vi.useRealTimers();
  });

  describe('getSimulationState', () => {
    it('returns correct initial state', () => {
      const state = getSimulationState();
      expect(state.isRunning).toBe(false);
      expect(state.tickCount).toBe(0);
      expect(state.lastTickAt).toBeNull();
      expect(state.config).toEqual(DEFAULT_SIMULATION_CONFIG);
    });

    it('returns a snapshot (not a reference)', () => {
      const state1 = getSimulationState();
      const state2 = getSimulationState();
      expect(state1).toEqual(state2);
      expect(state1).not.toBe(state2);
      expect(state1.config).not.toBe(state2.config);
    });
  });

  describe('startSimulation', () => {
    it('sets isRunning to true', () => {
      startSimulation();
      expect(getSimulationState().isRunning).toBe(true);
    });

    it('emits system:simulationStarted event', () => {
      const listener = vi.fn();
      eventBus.on('system:simulationStarted', listener);
      startSimulation();
      expect(listener).toHaveBeenCalledTimes(1);
      eventBus.off('system:simulationStarted', listener);
    });

    it('does not start if already running', () => {
      startSimulation();
      const listener = vi.fn();
      eventBus.on('system:simulationStarted', listener);
      startSimulation(); // second call should be a no-op
      expect(listener).not.toHaveBeenCalled();
      eventBus.off('system:simulationStarted', listener);
    });
  });

  describe('stopSimulation', () => {
    it('sets isRunning to false', () => {
      startSimulation();
      expect(getSimulationState().isRunning).toBe(true);

      stopSimulation();
      expect(getSimulationState().isRunning).toBe(false);
    });

    it('emits system:simulationStopped event', () => {
      startSimulation();
      const listener = vi.fn();
      eventBus.on('system:simulationStopped', listener);
      stopSimulation();
      expect(listener).toHaveBeenCalledTimes(1);
      eventBus.off('system:simulationStopped', listener);
    });

    it('does not stop if not running', () => {
      const listener = vi.fn();
      eventBus.on('system:simulationStopped', listener);
      stopSimulation(); // should be a no-op
      expect(listener).not.toHaveBeenCalled();
      eventBus.off('system:simulationStopped', listener);
    });
  });

  describe('setSimulationConfig', () => {
    it('updates config with partial values', () => {
      setSimulationConfig({ tickInterval: 5000 });
      const state = getSimulationState();
      expect(state.config.tickInterval).toBe(5000);
      // Other values should remain at defaults
      expect(state.config.taskProgressChance).toBe(DEFAULT_SIMULATION_CONFIG.taskProgressChance);
    });

    it('updates multiple config values at once', () => {
      setSimulationConfig({
        tickInterval: 1000,
        taskProgressChance: 0.5,
        messageChance: 0.8,
      });
      const state = getSimulationState();
      expect(state.config.tickInterval).toBe(1000);
      expect(state.config.taskProgressChance).toBe(0.5);
      expect(state.config.messageChance).toBe(0.8);
      expect(state.config.statusChangeChance).toBe(DEFAULT_SIMULATION_CONFIG.statusChangeChance);
    });

    it('notifies state change listeners', () => {
      const listener = vi.fn();
      const unsubscribe = onSimulationStateChange(listener);
      setSimulationConfig({ tickInterval: 999 });
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({ tickInterval: 999 }),
        })
      );
      unsubscribe();
    });
  });

  describe('resetSimulationConfig', () => {
    it('resets config to defaults', () => {
      setSimulationConfig({
        tickInterval: 1000,
        taskProgressChance: 0.9,
        messageChance: 0.9,
        statusChangeChance: 0.9,
        progressRange: [1, 2],
      });

      resetSimulationConfig();

      const state = getSimulationState();
      expect(state.config).toEqual(DEFAULT_SIMULATION_CONFIG);
    });

    it('resets to defaults after partial update', () => {
      setSimulationConfig({ tickInterval: 7777 });
      expect(getSimulationState().config.tickInterval).toBe(7777);

      resetSimulationConfig();
      expect(getSimulationState().config.tickInterval).toBe(DEFAULT_SIMULATION_CONFIG.tickInterval);
    });
  });

  describe('Multiple start/stop cycles', () => {
    it('handles multiple start/stop cycles correctly', () => {
      // Cycle 1
      startSimulation();
      expect(getSimulationState().isRunning).toBe(true);
      stopSimulation();
      expect(getSimulationState().isRunning).toBe(false);

      // Cycle 2
      startSimulation();
      expect(getSimulationState().isRunning).toBe(true);
      stopSimulation();
      expect(getSimulationState().isRunning).toBe(false);

      // Cycle 3
      startSimulation();
      expect(getSimulationState().isRunning).toBe(true);
      stopSimulation();
      expect(getSimulationState().isRunning).toBe(false);
    });

    it('does not accumulate tick counts across restarts', () => {
      vi.useFakeTimers();

      startSimulation();
      // Let a tick happen
      vi.advanceTimersByTime(DEFAULT_SIMULATION_CONFIG.tickInterval + 100);
      const countAfterFirst = getSimulationState().tickCount;

      stopSimulation();

      startSimulation();
      // tickCount should not reset (it's a cumulative counter)
      const countAfterRestart = getSimulationState().tickCount;
      expect(countAfterRestart).toBe(countAfterFirst);
    });
  });

  describe('onSimulationStateChange', () => {
    it('returns unsubscribe function', () => {
      const listener = vi.fn();
      const unsubscribe = onSimulationStateChange(listener);

      startSimulation();
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      stopSimulation();
      // Listener should not be called after unsubscribe
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('supports multiple listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      const unsub1 = onSimulationStateChange(listener1);
      const unsub2 = onSimulationStateChange(listener2);

      startSimulation();
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);

      unsub1();
      stopSimulation();
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(2);

      unsub2();
    });
  });
});
