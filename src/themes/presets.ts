/**
 * 预设主题定义
 * 每套主题包含 light 和 dark 两套颜色
 */

export interface ThemeColors {
  primary: string;
  primaryHover: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  colors: {
    light: ThemeColors;
    dark: ThemeColors;
  };
}

export const PRESET_THEMES: ThemeConfig[] = [
  {
    id: 'default-blue',
    name: '默认蓝',
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
  },
  {
    id: 'emerald-green',
    name: '翡翠绿',
    colors: {
      light: {
        primary: '#10b981',
        primaryHover: '#059669',
        secondary: '#14b8a6',
        accent: '#06b6d4',
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
        background: '#ffffff',
        surface: '#f0fdf4',
        text: '#0f172a',
        textSecondary: '#64748b',
        border: '#d1fae5',
      },
      dark: {
        primary: '#34d399',
        primaryHover: '#10b981',
        secondary: '#2dd4bf',
        accent: '#22d3ee',
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
  },
  {
    id: 'amber-orange',
    name: '琥珀橙',
    colors: {
      light: {
        primary: '#f59e0b',
        primaryHover: '#d97706',
        secondary: '#f97316',
        accent: '#ef4444',
        success: '#22c55e',
        warning: '#eab308',
        danger: '#dc2626',
        background: '#ffffff',
        surface: '#fffbeb',
        text: '#0f172a',
        textSecondary: '#64748b',
        border: '#fef3c7',
      },
      dark: {
        primary: '#fbbf24',
        primaryHover: '#f59e0b',
        secondary: '#fb923c',
        accent: '#f87171',
        success: '#4ade80',
        warning: '#facc15',
        danger: '#ef4444',
        background: '#0f172a',
        surface: '#1e293b',
        text: '#f1f5f9',
        textSecondary: '#94a3b8',
        border: '#334155',
      },
    },
  },
  {
    id: 'rose-red',
    name: '玫瑰红',
    colors: {
      light: {
        primary: '#f43f5e',
        primaryHover: '#e11d48',
        secondary: '#ec4899',
        accent: '#d946ef',
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#dc2626',
        background: '#ffffff',
        surface: '#fff1f2',
        text: '#0f172a',
        textSecondary: '#64748b',
        border: '#fecdd3',
      },
      dark: {
        primary: '#fb7185',
        primaryHover: '#f43f5e',
        secondary: '#f472b6',
        accent: '#e879f9',
        success: '#4ade80',
        warning: '#fbbf24',
        danger: '#ef4444',
        background: '#0f172a',
        surface: '#1e293b',
        text: '#f1f5f9',
        textSecondary: '#94a3b8',
        border: '#334155',
      },
    },
  },
];
