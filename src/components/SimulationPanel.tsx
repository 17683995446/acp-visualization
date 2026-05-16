/**
 * SimulationPanel 模拟控制面板
 * 可折叠面板，允许用户控制模拟引擎的启停和参数
 */
import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Gauge, RotateCcw } from 'lucide-react';
import { useSimulation } from '../hooks/useSimulation';

const TICK_INTERVAL_OPTIONS = [
  { label: '1s', value: 1000 },
  { label: '2s', value: 2000 },
  { label: '3s', value: 3000 },
  { label: '5s', value: 5000 },
  { label: '10s', value: 10000 },
];

const SimulationPanel: React.FC = () => {
  const {
    isRunning,
    tickCount,
    config,
    toggle,
    updateConfig,
    resetConfig,
  } = useSimulation();

  const [isCollapsed, setIsCollapsed] = useState(true);

  const handleIntervalChange = (value: number) => {
    updateConfig({ tickInterval: value });
  };

  const handleProbabilityChange = (
    key: 'taskProgressChance' | 'messageChance' | 'statusChangeChance',
    value: number
  ) => {
    updateConfig({ [key]: value });
  };

  return (
    <div className="mt-4 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
      {/* Header row */}
      <div className="flex items-center">
        {/* Collapsible toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex-1 flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Gauge className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              模拟引擎控制
            </span>
            {/* Running indicator dot */}
            {isRunning && (
              <span className="flex items-center space-x-1 ml-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-green-600 dark:text-green-400">
                  运行中
                </span>
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {/* Tick counter */}
            <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
              Tick #{tickCount}
            </span>
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </button>

        {/* Start/Stop toggle button */}
        <button
          onClick={toggle}
          className={`flex items-center space-x-1.5 px-3 py-3 text-xs font-medium transition-colors border-l border-gray-200 dark:border-gray-600 ${
            isRunning
              ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
              : 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isRunning ? 'bg-red-500' : 'bg-green-500'
            }`}
          />
          <span>{isRunning ? '停止' : '启动'}</span>
        </button>

        {/* Reset button */}
        <button
          onClick={resetConfig}
          className="px-3 py-3 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-l border-gray-200 dark:border-gray-600"
          title="重置为默认配置"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Collapsible content */}
      {!isCollapsed && (
        <div className="px-4 py-4 space-y-4 bg-white dark:bg-gray-800">
          {/* Speed control */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-600 dark:text-gray-400">
                模拟速度
              </label>
              <span className="text-sm font-mono text-gray-900 dark:text-white">
                {(config.tickInterval / 1000).toFixed(0)}s
              </span>
            </div>
            <div className="flex items-center space-x-1">
              {TICK_INTERVAL_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleIntervalChange(option.value)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${
                    config.tickInterval === option.value
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Task progress probability */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-600 dark:text-gray-400">
                任务进度概率
              </label>
              <span className="text-sm font-mono text-gray-900 dark:text-white">
                {(config.taskProgressChance * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={config.taskProgressChance}
              onChange={(e) =>
                handleProbabilityChange(
                  'taskProgressChance',
                  parseFloat(e.target.value)
                )
              }
              className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
            <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Message generation probability */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-600 dark:text-gray-400">
                消息生成概率
              </label>
              <span className="text-sm font-mono text-gray-900 dark:text-white">
                {(config.messageChance * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={config.messageChance}
              onChange={(e) =>
                handleProbabilityChange(
                  'messageChance',
                  parseFloat(e.target.value)
                )
              }
              className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
            <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Status change probability */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-600 dark:text-gray-400">
                状态变更概率
              </label>
              <span className="text-sm font-mono text-gray-900 dark:text-white">
                {(config.statusChangeChance * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={config.statusChangeChance}
              onChange={(e) =>
                handleProbabilityChange(
                  'statusChangeChance',
                  parseFloat(e.target.value)
                )
              }
              className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
            <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Progress range info */}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 dark:text-gray-500">
                进度递增范围
              </span>
              <span className="text-xs font-mono text-gray-600 dark:text-gray-300">
                {config.progressRange[0]}% ~ {config.progressRange[1]}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimulationPanel;
