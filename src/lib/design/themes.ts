/**
 * Theme-aware color tokens
 * Supports light and dark modes
 */

export const LightColors = {
  // Primary colors
  primary: '#7B85FF',
  primaryLight: '#9BA3FF',
  primaryDark: '#5A64DD',
  primaryLighter: '#BCC2FF',

  // Secondary colors
  secondary: '#FF7BA8',
  secondaryLight: '#FF9BC4',
  secondaryDark: '#FF5A8D',

  // Status colors
  calm: '#E8F5E9',
  calmDark: '#C8E6C9',
  reminder: '#FFF3E0',
  reminderDark: '#FFE0B2',
  concern: '#FFE0E0',
  concernDark: '#FFCCCB',
  emergency: '#FF4757',
  emergencyDark: '#FF1744',

  // Neutral colors
  background: '#FAFAFA',
  backgroundDark: '#F5F5F5',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#6B6B6B',
  textLight: '#9B9B9B',
  textDisabled: '#CCCCCC',
  border: '#E5E5E5',
  borderLight: '#F0F0F0',
  divider: '#E0E0E0',

  // Semantic colors
  success: '#4CAF50',
  successLight: '#66BB6A',
  warning: '#FF9800',
  warningLight: '#FFB74D',
  error: '#F44336',
  errorLight: '#EF5350',
  info: '#2196F3',
  infoLight: '#42A5F5',
};

export const DarkColors = {
  // Primary colors (same, but may need adjustment)
  primary: '#7B85FF',
  primaryLight: '#9BA3FF',
  primaryDark: '#5A64DD',
  primaryLighter: '#BCC2FF',

  // Secondary colors
  secondary: '#FF7BA8',
  secondaryLight: '#FF9BC4',
  secondaryDark: '#FF5A8D',

  // Status colors (darker variants)
  calm: '#1B3A1E',
  calmDark: '#2D4F30',
  reminder: '#3D2F1A',
  reminderDark: '#4A3A20',
  concern: '#3D1F1F',
  concernDark: '#4A2A2A',
  emergency: '#FF4757',
  emergencyDark: '#FF1744',

  // Neutral colors (inverted)
  background: '#121212',
  backgroundDark: '#1E1E1E',
  surface: '#1E1E1E',
  surfaceElevated: '#2C2C2C',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textLight: '#808080',
  textDisabled: '#505050',
  border: '#333333',
  borderLight: '#2A2A2A',
  divider: '#404040',

  // Semantic colors (adjusted for dark mode)
  success: '#4CAF50',
  successLight: '#66BB6A',
  warning: '#FF9800',
  warningLight: '#FFB74D',
  error: '#F44336',
  errorLight: '#EF5350',
  info: '#2196F3',
  infoLight: '#42A5F5',
};

export function getThemeColors(theme: 'light' | 'dark') {
  return theme === 'dark' ? DarkColors : LightColors;
}
