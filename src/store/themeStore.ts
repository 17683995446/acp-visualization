/**
 * 主题管理 Store
 * 基于 Zustand + persist 中间件
 * 使用 CSS 变量实现主题切换，深色模式通过 dark class 实现
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PRESET_THEMES } from '../themes/presets';
import type { ThemeConfig, ThemeColors } from '../themes/presets';

const MAX_CUSTOM_THEMES = 10;

const PRESET_IDS = new Set(PRESET_THEMES.map(t => t.id));

/** CSS 变量名与 ThemeColors key 的映射 */
const CSS_VAR_MAP: Record<keyof ThemeColors, string> = {
  primary: '--color-primary',
  primaryHover: '--color-primary-hover',
  secondary: '--color-secondary',
  accent: '--color-accent',
  success: '--color-success',
  warning: '--color-warning',
  danger: '--color-danger',
  background: '--color-background',
  surface: '--color-surface',
  text: '--color-text',
  textSecondary: '--color-text-secondary',
  border: '--color-border',
};

interface ThemeState {
  themes: ThemeConfig[];
  activeThemeId: string;
  isDarkMode: boolean;

  // Actions
  setActiveTheme: (id: string) => void;
  addTheme: (theme: ThemeConfig) => boolean;
  deleteTheme: (id: string) => void;
  updateTheme: (id: string, updates: Partial<ThemeConfig>) => void;
  toggleDarkMode: () => void;
  getActiveTheme: () => ThemeConfig;
  applyThemeToDOM: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      themes: [...PRESET_THEMES],
      activeThemeId: 'default-blue',
      isDarkMode: false,

      setActiveTheme: (id: string) => {
        const { themes } = get();
        const exists = themes.some(t => t.id === id);
        if (exists) {
          set({ activeThemeId: id });
          get().applyThemeToDOM();
        }
      },

      addTheme: (theme: ThemeConfig): boolean => {
    const { themes } = get();
    const customCount = themes.filter(t => !PRESET_IDS.has(t.id)).length;
    if (customCount >= MAX_CUSTOM_THEMES) {
      console.warn(`最多只能保存 ${MAX_CUSTOM_THEMES} 个自定义主题`);
      return false;
    }
    // 防止 id 重复
    if (themes.some(t => t.id === theme.id)) {
      console.warn('主题 ID 已存在');
      return false;
    }
    set({ themes: [...themes, theme] });
    return true;
  },

      deleteTheme: (id: string) => {
        const { themes, activeThemeId } = get();
        // 不允许删除预设主题
        if (PRESET_IDS.has(id)) {
          console.warn('不能删除预设主题');
          return;
        }
        const newThemes = themes.filter(t => t.id !== id);
        // 如果删除的是当前激活主题，回退到默认
        const newActiveId = activeThemeId === id ? 'default-blue' : activeThemeId;
        set({ themes: newThemes, activeThemeId: newActiveId });
        get().applyThemeToDOM();
      },

      updateTheme: (id: string, updates: Partial<ThemeConfig>) => {
        const { themes } = get();
        set({
          themes: themes.map(t => (t.id === id ? { ...t, ...updates } : t)),
        });
        if (id === get().activeThemeId) {
          get().applyThemeToDOM();
        }
      },

      toggleDarkMode: () => {
        const newDark = !get().isDarkMode;
        set({ isDarkMode: newDark });
        const root = document.documentElement;
        if (newDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
        get().applyThemeToDOM();
      },

      getActiveTheme: () => {
        const { themes, activeThemeId } = get();
        const theme = themes.find(t => t.id === activeThemeId);
        return theme ?? PRESET_THEMES[0];
      },

      applyThemeToDOM: () => {
        const theme = get().getActiveTheme();
        const isDark = get().isDarkMode;
        const colors = isDark ? theme.colors.dark : theme.colors.light;
        const root = document.documentElement;

        for (const [key, cssVar] of Object.entries(CSS_VAR_MAP)) {
          root.style.setProperty(cssVar, colors[key as keyof ThemeColors]);
        }
      },
    }),
    {
      name: 'acp-theme-storage',
      version: 1,
      migrate: (persisted: any, version: number) => {
        // version 0 -> 1: 确保所有预设主题存在
        if (version === 0) {
          const themes = persisted?.themes || [];
          const presetIds = new Set(PRESET_THEMES.map(t => t.id));
          // 添加缺失的预设主题
          for (const preset of PRESET_THEMES) {
            if (!presetIds.has(preset.id)) {
              themes.push(preset);
            }
          }
          return { ...persisted, themes };
        }
        return persisted;
      },
      partialize: (state) => ({
        themes: state.themes,
        activeThemeId: state.activeThemeId,
        isDarkMode: state.isDarkMode,
      }),
    }
  )
);

// 防止 FOUC：在模块加载时立即应用主题
// 从 localStorage 读取持久化的主题设置
try {
  const stored = JSON.parse(localStorage.getItem('acp-theme-storage') || '{}');
  const state = stored?.state;
  if (state) {
    // 应用深色模式 class
    if (state.isDarkMode) {
      document.documentElement.classList.add('dark');
    }
    // 找到激活的主题并应用 CSS 变量
    const themes = state.themes || [...PRESET_THEMES];
    const activeId = state.activeThemeId || 'default-blue';
    const theme = themes.find((t: ThemeConfig) => t.id === activeId) || PRESET_THEMES[0];
    const colors = state.isDarkMode ? theme.colors.dark : theme.colors.light;
    const root = document.documentElement;
    for (const [key, cssVar] of Object.entries(CSS_VAR_MAP)) {
      root.style.setProperty(cssVar, colors[key as keyof ThemeColors]);
    }
  }
} catch {
  // localStorage 不可用时忽略
}
