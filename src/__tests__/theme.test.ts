/**
 * 主题系统测试
 * 覆盖：预设主题数量、切换、添加、删除、深色模式、CSS 变量、自定义主题上限
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useThemeStore } from '../store/themeStore';
import { PRESET_THEMES } from '../themes/presets';
import type { ThemeConfig } from '../themes/presets';

/** 创建一个自定义主题用于测试 */
function makeCustomTheme(id: string, name: string): ThemeConfig {
  return {
    id,
    name,
    colors: {
      light: {
        primary: '#000000',
        primaryHover: '#111111',
        secondary: '#222222',
        accent: '#333333',
        success: '#444444',
        warning: '#555555',
        danger: '#666666',
        background: '#ffffff',
        surface: '#f0f0f0',
        text: '#000000',
        textSecondary: '#666666',
        border: '#cccccc',
      },
      dark: {
        primary: '#aaaaaa',
        primaryHover: '#bbbbbb',
        secondary: '#cccccc',
        accent: '#dddddd',
        success: '#eeeeee',
        warning: '#ffff00',
        danger: '#ff0000',
        background: '#111111',
        surface: '#222222',
        text: '#ffffff',
        textSecondary: '#aaaaaa',
        border: '#444444',
      },
    },
  };
}

describe('主题系统', () => {
  beforeEach(() => {
    // 重置 store 到初始状态
    useThemeStore.setState({
      themes: [...PRESET_THEMES],
      activeThemeId: 'default-blue',
      isDarkMode: false,
    });
  });

  it('预设主题有 4 个', () => {
    const { themes } = useThemeStore.getState();
    // 预设主题 ID 集合
    const presetIds = new Set(PRESET_THEMES.map(t => t.id));
    const presetCount = themes.filter(t => presetIds.has(t.id)).length;
    expect(presetCount).toBe(4);
  });

  it('初始激活主题为 default-blue', () => {
    const { activeThemeId } = useThemeStore.getState();
    expect(activeThemeId).toBe('default-blue');
  });

  it('切换主题 → activeThemeId 更新', () => {
    const store = useThemeStore.getState();
    store.setActiveTheme('emerald-green');
    expect(useThemeStore.getState().activeThemeId).toBe('emerald-green');

    // 切换到不存在的主题，不应改变
    store.setActiveTheme('non-existent');
    expect(useThemeStore.getState().activeThemeId).toBe('emerald-green');
  });

  it('添加自定义主题', () => {
    const store = useThemeStore.getState();
    const custom = makeCustomTheme('custom-1', '我的主题');
    store.addTheme(custom);

    const { themes } = useThemeStore.getState();
    expect(themes).toHaveLength(5);
    expect(themes.find(t => t.id === 'custom-1')?.name).toBe('我的主题');
  });

  it('添加重复 ID 的主题不应成功', () => {
    const store = useThemeStore.getState();
    const custom = makeCustomTheme('default-blue', '重复');
    store.addTheme(custom);

    // 数量不变
    expect(useThemeStore.getState().themes).toHaveLength(4);
  });

  it('删除自定义主题', () => {
    const store = useThemeStore.getState();
    const custom = makeCustomTheme('custom-del', '待删除');
    store.addTheme(custom);
    expect(useThemeStore.getState().themes).toHaveLength(5);

    store.deleteTheme('custom-del');
    expect(useThemeStore.getState().themes).toHaveLength(4);
  });

  it('删除预设主题不应成功', () => {
    const store = useThemeStore.getState();
    const beforeCount = store.themes.length;
    store.deleteTheme('default-blue');
    expect(useThemeStore.getState().themes).toHaveLength(beforeCount);
  });

  it('删除当前激活的自定义主题应回退到默认', () => {
    const store = useThemeStore.getState();
    const custom = makeCustomTheme('custom-active', '激活主题');
    store.addTheme(custom);
    store.setActiveTheme('custom-active');
    expect(useThemeStore.getState().activeThemeId).toBe('custom-active');

    store.deleteTheme('custom-active');
    expect(useThemeStore.getState().activeThemeId).toBe('default-blue');
  });

  it('深色模式切换', () => {
    const store = useThemeStore.getState();
    expect(store.isDarkMode).toBe(false);

    store.toggleDarkMode();
    expect(useThemeStore.getState().isDarkMode).toBe(true);

    store.toggleDarkMode();
    expect(useThemeStore.getState().isDarkMode).toBe(false);
  });

  it('applyThemeToDOM 设置 CSS 变量', () => {
    const root = document.documentElement;
    // 清除之前可能设置的 CSS 变量
    root.style.removeProperty('--color-primary');
    root.style.removeProperty('--color-secondary');
    root.style.removeProperty('--color-background');

    const store = useThemeStore.getState();
    store.applyThemeToDOM();

    expect(root.style.getPropertyValue('--color-primary')).toBe('#3b82f6');
    expect(root.style.getPropertyValue('--color-secondary')).toBe('#6366f1');
    expect(root.style.getPropertyValue('--color-background')).toBe('#ffffff');
  });

  it('深色模式下 applyThemeToDOM 使用 dark 颜色', () => {
    const root = document.documentElement;
    root.style.removeProperty('--color-primary');
    root.style.removeProperty('--color-background');

    const store = useThemeStore.getState();
    store.toggleDarkMode();
    store.applyThemeToDOM();

    expect(root.style.getPropertyValue('--color-primary')).toBe('#60a5fa');
    expect(root.style.getPropertyValue('--color-background')).toBe('#0f172a');
  });

  it('最多 10 个自定义主题限制', () => {
    const store = useThemeStore.getState();

    // 添加 10 个自定义主题
    for (let i = 0; i < 10; i++) {
      store.addTheme(makeCustomTheme(`custom-limit-${i}`, `主题 ${i}`));
    }

    // 应该有 4 预设 + 10 自定义 = 14
    expect(useThemeStore.getState().themes).toHaveLength(14);

    // 第 11 个不应添加成功
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    store.addTheme(makeCustomTheme('custom-extra', '超出限制'));
    expect(useThemeStore.getState().themes).toHaveLength(14);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('10'));
    consoleSpy.mockRestore();
  });

  it('getActiveTheme 返回正确的主题', () => {
    const store = useThemeStore.getState();
    const theme = store.getActiveTheme();
    expect(theme.id).toBe('default-blue');
    expect(theme.name).toBe('默认蓝');

    store.setActiveTheme('rose-red');
    const updated = useThemeStore.getState().getActiveTheme();
    expect(updated.id).toBe('rose-red');
    expect(updated.name).toBe('玫瑰红');
  });

  it('updateTheme 更新主题属性', () => {
    const store = useThemeStore.getState();
    store.updateTheme('default-blue', { name: '修改后的蓝' });

    const theme = useThemeStore.getState().themes.find(t => t.id === 'default-blue');
    expect(theme?.name).toBe('修改后的蓝');
  });

  it('切换主题后 applyThemeToDOM 被调用', () => {
    const root = document.documentElement;
    const store = useThemeStore.getState();

    // 先应用默认蓝
    store.applyThemeToDOM();
    expect(root.style.getPropertyValue('--color-primary')).toBe('#3b82f6');

    // 切换到翡翠绿
    store.setActiveTheme('emerald-green');
    expect(root.style.getPropertyValue('--color-primary')).toBe('#10b981');
  });
});
