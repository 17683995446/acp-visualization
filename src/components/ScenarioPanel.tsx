import { useState, useCallback } from 'react';
import {
  Save,
  FolderOpen,
  Copy,
  Trash2,
  Play,
  X,
  ChevronDown,
  Clock,
  Users,
  ListTodo,
  AlertTriangle,
} from 'lucide-react';
import { useScenarioStore } from '../store/scenarioManager';
import { PRESET_SCENARIOS } from '../scenarios/presets';
import type { Scenario } from '../store/scenarioManager';

interface ScenarioPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;

  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getSnapshotStats(scenario: Scenario) {
  const { snapshot } = scenario;
  return {
    members: snapshot.organization.members.length,
    tasks: snapshot.tasks.length,
    completedTasks: snapshot.tasks.filter((t) => t.status === 'completed').length,
    failedTasks: snapshot.tasks.filter((t) => t.status === 'failed').length,
  };
}

function ScenarioCard({
  scenario,
  isActive,
  onLoad,
  onDuplicate,
  onDelete,
}: {
  scenario: Scenario;
  isActive: boolean;
  onLoad: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const stats = getSnapshotStats(scenario);

  return (
    <div
      className={`relative rounded-lg border p-4 transition-all ${
        isActive
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-1 ring-primary-500'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      {isActive && (
        <span className="absolute -top-2 -right-2 inline-flex items-center rounded-full bg-primary-500 px-2 py-0.5 text-[10px] font-medium text-white">
          当前
        </span>
      )}

      <div className="mb-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
          {scenario.name}
        </h3>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
          {scenario.description}
        </p>
      </div>

      <div className="mb-3 flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatTime(scenario.updatedAt)}
        </span>
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {stats.members}人
        </span>
        <span className="flex items-center gap-1">
          <ListTodo className="w-3 h-3" />
          {stats.tasks}任务
        </span>
      </div>

      {stats.failedTasks > 0 && (
        <div className="mb-3 flex items-center gap-1 text-xs text-red-500">
          <AlertTriangle className="w-3 h-3" />
          {stats.failedTasks} 个任务失败
        </div>
      )}

      <div className="flex items-center gap-1.5">
        <button
          onClick={onLoad}
          className="flex items-center gap-1 rounded-md bg-primary-500 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-primary-600 transition-colors"
          title="加载此场景"
        >
          <Play className="w-3 h-3" />
          加载
        </button>
        <button
          onClick={onDuplicate}
          className="flex items-center gap-1 rounded-md border border-gray-200 dark:border-gray-600 px-2 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="复制此场景"
        >
          <Copy className="w-3 h-3" />
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-1 rounded-md border border-gray-200 dark:border-gray-600 px-2 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title="删除此场景"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

export default function ScenarioPanel({ isOpen, onClose }: ScenarioPanelProps) {
  const scenarios = useScenarioStore((s) => s.scenarios);
  const activeScenarioId = useScenarioStore((s) => s.activeScenarioId);
  const saveScenario = useScenarioStore((s) => s.saveScenario);
  const loadScenario = useScenarioStore((s) => s.loadScenario);
  const deleteScenario = useScenarioStore((s) => s.deleteScenario);
  const duplicateScenario = useScenarioStore((s) => s.duplicateScenario);
  const loadPreset = useScenarioStore((s) => s.loadPreset);

  const [saveName, setSaveName] = useState('');
  const [saveDesc, setSaveDesc] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [showPresetMenu, setShowPresetMenu] = useState(false);

  const handleSave = useCallback(() => {
    const name = saveName.trim();
    if (!name) return;
    saveScenario(name, saveDesc.trim() || '手动保存的场景');
    setSaveName('');
    setSaveDesc('');
    setShowSaveForm(false);
  }, [saveName, saveDesc, saveScenario]);

  const handleLoadPreset = useCallback(
    (index: number) => {
      const preset = PRESET_SCENARIOS[index];
      if (preset) {
        loadPreset(preset.snapshot, preset.name, preset.description);
      }
      setShowPresetMenu(false);
    },
    [loadPreset]
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteScenario(id);
    },
    [deleteScenario]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* 遮罩层 */}
      <div
        className="absolute inset-0 bg-black/30 dark:bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 侧边栏面板 */}
      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 shadow-xl flex flex-col h-full" role="dialog" aria-modal="true" aria-label="场景管理">
        {/* 头部 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">场景管理</h2>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 操作区 */}
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
          {/* 保存当前状态 */}
          {!showSaveForm ? (
            <button
              onClick={() => setShowSaveForm(true)}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-600 transition-colors"
            >
              <Save className="w-4 h-4" />
              保存当前状态
            </button>
          ) : (
            <div className="space-y-2 p-3 rounded-lg border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20">
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="场景名称"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') setShowSaveForm(false);
                }}
              />
              <input
                type="text"
                value={saveDesc}
                onChange={(e) => setSaveDesc(e.target.value)}
                placeholder="场景描述（可选）"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') setShowSaveForm(false);
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={!saveName.trim()}
                  className="flex-1 rounded-md bg-primary-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  保存
                </button>
                <button
                  onClick={() => {
                    setShowSaveForm(false);
                    setSaveName('');
                    setSaveDesc('');
                  }}
                  className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          )}

          {/* 加载预设场景 */}
          <div className="relative">
            <button
              onClick={() => setShowPresetMenu(!showPresetMenu)}
              className="w-full flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-600 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                加载预设场景
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${showPresetMenu ? 'rotate-180' : ''}`}
              />
            </button>

            {showPresetMenu && (
              <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg z-10 overflow-hidden">
                {PRESET_SCENARIOS.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => handleLoadPreset(index)}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">
                      {preset.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {preset.description}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 场景列表 */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              已保存的场景 ({scenarios.length}/20)
            </h3>
          </div>

          {scenarios.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FolderOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm text-gray-400 dark:text-gray-500">暂无保存的场景</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                保存当前状态或加载预设场景开始
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {scenarios.map((scenario) => (
                <ScenarioCard
                  key={scenario.id}
                  scenario={scenario}
                  isActive={scenario.id === activeScenarioId}
                  onLoad={() => loadScenario(scenario.id)}
                  onDuplicate={() => duplicateScenario(scenario.id)}
                  onDelete={() => handleDelete(scenario.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
