/**
 * 主题设置面板
 * 功能：主题预览、切换、深色模式开关、自定义主题编辑、重置
 */

import { useState, useCallback } from 'react';
import { Palette, Sun, Moon, RotateCcw, Plus, Trash2, Check } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { PRESET_THEMES } from '../themes/presets';
import type { ThemeConfig, ThemeColors } from '../themes/presets';

const PRESET_IDS = new Set(PRESET_THEMES.map(t => t.id));

interface ThemePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

/** 颜色字段中文标签 */
const COLOR_LABELS: Record<keyof ThemeColors, string> = {
  primary: '主色调',
  primaryHover: '主色调悬停',
  secondary: '辅助色',
  accent: '强调色',
  success: '成功色',
  warning: '警告色',
  danger: '危险色',
  background: '背景色',
  surface: '卡片表面色',
  text: '主文字色',
  textSecondary: '次要文字色',
  border: '边框色',
};

/** 创建空的自定义主题 */
function createEmptyTheme(): ThemeConfig {
  return {
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: '自定义主题',
    colors: {
      light: {
        primary: '#3b82f6',
        primaryHover: '#2563eb',
        secondary: '#6366f1',
        accent: '#8b5cf6',
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#0f172a',
        textSecondary: '#64748b',
        border: '#e2e8f0',
      },
      dark: {
        primary: '#60a5fa',
        primaryHover: '#3b82f6',
        secondary: '#818cf8',
        accent: '#a78bfa',
        success: '#4ade80',
        warning: '#fbbf24',
        danger: '#f87171',
        background: '#0f172a',
        surface: '#1e293b',
        text: '#f1f5f9',
        textSecondary: '#94a3b8',
        border: '#334155',
      },
    },
  };
}

export default function ThemePanel({ isOpen, onClose }: ThemePanelProps) {
  const {
    themes,
    activeThemeId,
    isDarkMode,
    setActiveTheme,
    addTheme,
    deleteTheme,
    updateTheme,
    toggleDarkMode,
  } = useThemeStore();

  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColors, setEditColors] = useState<{ light: ThemeColors; dark: ThemeColors } | null>(null);
  const [editingMode, setEditingMode] = useState<'light' | 'dark'>('light');

  const activeTheme = themes.find(t => t.id === activeThemeId);

  /** 进入编辑模式 */
  const startEditing = useCallback((theme: ThemeConfig) => {
    setEditingThemeId(theme.id);
    setEditName(theme.name);
    setEditColors({
      light: { ...theme.colors.light },
      dark: { ...theme.colors.dark },
    });
  }, []);

  /** 保存编辑 */
  const saveEditing = useCallback(() => {
    if (!editingThemeId || !editColors) return;
    updateTheme(editingThemeId, {
      name: editName,
      colors: editColors,
    });
    setEditingThemeId(null);
    setEditColors(null);
  }, [editingThemeId, editName, editColors, updateTheme]);

  /** 取消编辑 */
  const cancelEditing = useCallback(() => {
    setEditingThemeId(null);
    setEditColors(null);
  }, []);

  /** 新建自定义主题 */
  const handleAddTheme = useCallback(() => {
    const newTheme = createEmptyTheme();
    const success = addTheme(newTheme);
    if (success) {
      setActiveTheme(newTheme.id);
      startEditing(newTheme);
    }
    // 如果失败，addTheme 已经 console.warn 了
  }, [addTheme, setActiveTheme, startEditing]);

  /** 重置为默认 */
  const handleReset = useCallback(() => {
    setActiveTheme('default-blue');
    if (isDarkMode) {
      toggleDarkMode();
    }
  }, [setActiveTheme, isDarkMode, toggleDarkMode]);

  /** 更新编辑中的颜色 */
  const handleColorChange = useCallback((key: keyof ThemeColors, value: string) => {
    setEditColors(prev => prev ? {
      ...prev,
      [editingMode]: { ...prev[editingMode], [key]: value },
    } : prev);
  }, [editingMode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* 遮罩 */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 面板 */}
      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 shadow-xl h-full overflow-y-auto" role="dialog" aria-modal="true" aria-label="主题设置">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Palette className="w-5 h-5 text-gray-700 dark:text-gray-200" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">主题设置</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none"
            aria-label="关闭"
          >
            &times;
          </button>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* 深色模式开关 */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">深色模式</span>
            <button
              onClick={toggleDarkMode}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm transition-colors bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
              aria-label={isDarkMode ? '切换到亮色模式' : '切换到深色模式'}
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-4 h-4 text-yellow-500" />
                  <span className="text-gray-700 dark:text-gray-200">亮色</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-500" />
                  <span className="text-gray-700 dark:text-gray-200">深色</span>
                </>
              )}
            </button>
          </div>

          {/* 主题列表 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">预设主题</h3>
              <button
                onClick={handleReset}
                className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                title="重置为默认"
              >
                <RotateCcw className="w-3 h-3" />
                <span>重置</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {themes.filter(t => PRESET_IDS.has(t.id)).map(theme => {
                const colors = isDarkMode ? theme.colors.dark : theme.colors.light;
                const isActive = theme.id === activeThemeId;
                return (
                  <button
                    key={theme.id}
                    onClick={() => setActiveTheme(theme.id)}
                    className={`relative p-3 rounded-lg border-2 transition-all ${
                      isActive
                        ? 'border-blue-500 shadow-md'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute top-1 right-1">
                        <Check className="w-4 h-4 text-blue-500" />
                      </div>
                    )}
                    {/* 色块预览 */}
                    <div className="flex space-x-1 mb-2">
                      {[colors.primary, colors.secondary, colors.accent, colors.success, colors.warning, colors.danger].map((color, i) => (
                        <div
                          key={i}
                          className="w-5 h-5 rounded-full border border-white/50"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-200">{theme.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 自定义主题 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">自定义主题</h3>
              <button
                onClick={handleAddTheme}
                className="flex items-center space-x-1 text-xs text-blue-500 hover:text-blue-600"
              >
                <Plus className="w-3 h-3" />
                <span>新建</span>
              </button>
            </div>

            {themes.filter(t => !PRESET_IDS.has(t.id)).length === 0 && (
              <p className="text-xs text-gray-400 dark:text-gray-500 py-2">暂无自定义主题</p>
            )}

            <div className="space-y-2">
              {themes.filter(t => !PRESET_IDS.has(t.id)).map(theme => {
                const colors = isDarkMode ? theme.colors.dark : theme.colors.light;
                const isActive = theme.id === activeThemeId;
                const isEditing = editingThemeId === theme.id;

                if (isEditing && editColors) {
                  return (
                    <div key={theme.id} className="p-3 rounded-lg border border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20 space-y-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder="主题名称"
                      />
                      <div className="flex space-x-1 mb-2">
                        <button onClick={() => setEditingMode('light')} className={`px-2 py-0.5 text-xs rounded ${editingMode === 'light' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'}`}>亮色</button>
                        <button onClick={() => setEditingMode('dark')} className={`px-2 py-0.5 text-xs rounded ${editingMode === 'dark' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'}`}>暗色</button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {(Object.keys(COLOR_LABELS) as (keyof ThemeColors)[]).map(key => (
                          <div key={key} className="flex items-center space-x-1">
                            <input
                              type="color"
                              value={editColors[editingMode][key]}
                              onChange={e => handleColorChange(key, e.target.value)}
                              className="w-6 h-6 rounded cursor-pointer border-0"
                            />
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{COLOR_LABELS[key]}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex space-x-2 pt-1">
                        <button
                          onClick={saveEditing}
                          className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          <Check className="w-3 h-3" />
                          <span>保存</span>
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={theme.id}
                    className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                      isActive
                        ? 'border-blue-500 shadow-sm'
                        : 'border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <button
                      onClick={() => setActiveTheme(theme.id)}
                      className="flex items-center space-x-2 flex-1 text-left"
                    >
                      <div className="flex space-x-1">
                        {[colors.primary, colors.secondary, colors.accent].map((color, i) => (
                          <div
                            key={i}
                            className="w-4 h-4 rounded-full border border-white/50"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-200">{theme.name}</span>
                    </button>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => startEditing(theme)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        title="编辑"
                      >
                        <Palette className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => deleteTheme(theme.id)}
                        className="p-1 text-gray-400 hover:text-red-500"
                        title="删除"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 当前主题详情 */}
          {activeTheme && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">当前主题详情</h3>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(COLOR_LABELS) as (keyof ThemeColors)[]).map(key => {
                  const currentColors = isDarkMode ? activeTheme.colors.dark : activeTheme.colors.light;
                  return (
                    <div key={key} className="flex items-center space-x-2">
                      <div
                        className="w-4 h-4 rounded border border-gray-300 dark:border-gray-500"
                        style={{ backgroundColor: currentColors[key] }}
                      />
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">{COLOR_LABELS[key]}</span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">{currentColors[key]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
