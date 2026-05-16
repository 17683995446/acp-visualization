/**
 * SchedulerConfig 调度器配置面板
 * 可折叠面板，允许用户调整智能调度器的权重配置
 */
import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Settings2 } from 'lucide-react';
import type { SchedulerConfig } from '../engine/scheduler';
import { DEFAULT_SCHEDULER_CONFIG } from '../engine/scheduler';
import { useACPStore } from '../store/acpStore';

const SchedulerConfigPanel: React.FC = () => {
  const { schedulerConfig, setSchedulerConfig } = useACPStore();
  const [isCollapsed, setIsCollapsed] = useState(true);

  const handleWeightChange = (key: keyof Omit<SchedulerConfig, 'preferIdleAgents'>, value: number) => {
    setSchedulerConfig({ ...schedulerConfig, [key]: value });
  };

  const handleToggle = () => {
    setSchedulerConfig({ ...schedulerConfig, preferIdleAgents: !schedulerConfig.preferIdleAgents });
  };

  const handleReset = () => {
    setSchedulerConfig({ ...DEFAULT_SCHEDULER_CONFIG });
  };

  const weightSliders: Array<{
    key: keyof Omit<SchedulerConfig, 'preferIdleAgents'>;
    label: string;
  }> = [
    { key: 'capabilityWeight', label: '能力匹配权重' },
    { key: 'reputationWeight', label: '声誉权重' },
    { key: 'workloadWeight', label: '负载均衡权重' },
    { key: 'priorityWeight', label: '优先级权重' },
  ];

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
            <Settings2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              调度器权重配置
            </span>
          </div>
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>
        {/* Reset button — sibling, not nested */}
        <button
          onClick={handleReset}
          className="px-3 py-3 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-l border-gray-200 dark:border-gray-600"
          title="重置为默认权重"
        >
          重置默认
        </button>
      </div>

      {/* Collapsible content */}
      {!isCollapsed && (
        <div className="px-4 py-4 space-y-4 bg-white dark:bg-gray-800">
          {/* Weight sliders */}
          {weightSliders.map(({ key, label }) => (
            <div key={key} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-600 dark:text-gray-400">
                  {label}
                </label>
                <span className="text-sm font-mono text-gray-900 dark:text-white">
                  {schedulerConfig[key].toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={schedulerConfig[key]}
                onChange={(e) => handleWeightChange(key, parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
              <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
                <span>0</span>
                <span>1</span>
              </div>
            </div>
          ))}

          {/* Prefer idle agents toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              优先空闲Agent
            </span>
            <button
              onClick={handleToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                schedulerConfig.preferIdleAgents
                  ? 'bg-primary-500'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  schedulerConfig.preferIdleAgents ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Total weight indicator */}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 dark:text-gray-500">权重总和</span>
              <span className={`text-xs font-mono ${
                Math.abs(
                  schedulerConfig.capabilityWeight +
                  schedulerConfig.reputationWeight +
                  schedulerConfig.workloadWeight +
                  schedulerConfig.priorityWeight - 1
                ) < 0.01
                  ? 'text-green-500'
                  : 'text-yellow-500'
              }`}>
                {(schedulerConfig.capabilityWeight + schedulerConfig.reputationWeight + schedulerConfig.workloadWeight + schedulerConfig.priorityWeight).toFixed(2)}
                {Math.abs(
                  schedulerConfig.capabilityWeight +
                  schedulerConfig.reputationWeight +
                  schedulerConfig.workloadWeight +
                  schedulerConfig.priorityWeight - 1
                ) >= 0.01 && ' (建议总和为 1.00)'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulerConfigPanel;
