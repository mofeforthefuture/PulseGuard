/**
 * Theme-aware color hook
 * Use this hook in components to get theme-aware colors
 */

import { useTheme } from '../../context/ThemeContext';
import { getThemeColors } from './themes';

/**
 * Hook to get theme-aware colors
 * Usage: const colors = useColors();
 */
export function useColors() {
  const { theme } = useTheme();
  return getThemeColors(theme);
}
