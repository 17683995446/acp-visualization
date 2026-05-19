import { useCallback } from 'react';
import { useThemeStore } from '../store/themeStore';

/**
 * Dark Mode hook — 委托给 themeStore，确保单一状态源
 */
export function useDarkMode() {
  const isDark = useThemeStore((s) => s.isDarkMode);
  const toggleDarkMode = useThemeStore((s) => s.toggleDarkMode);

  const toggle = useCallback(() => toggleDarkMode(), [toggleDarkMode]);

  return { isDark, toggle };
}
