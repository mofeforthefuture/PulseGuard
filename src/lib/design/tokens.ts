/**
 * ALARA Design System - Rich, Warm, Modern Design Tokens
 * 
 * This design system emphasizes:
 * - Gradient-based color tokens
 * - Depth and soft shadows
 * - Status-based color variants
 * - Friendly, rounded, medical-safe typography
 * - Warm, modern, and alive feeling
 */

// ============================================================================
// GRADIENT COLOR TOKENS
// ============================================================================

export const Gradients = {
  // Primary gradients - warm purple-blue tones
  primary: {
    start: '#7B85FF', // Soft purple-blue
    end: '#9BA3FF',   // Lighter purple-blue
  },
  primaryDark: {
    start: '#5A64DD',
    end: '#7B85FF',
  },
  primaryLight: {
    start: '#9BA3FF',
    end: '#BCC2FF',
  },

  // Secondary gradients - warm pink tones
  secondary: {
    start: '#FF7BA8', // Soft pink
    end: '#FF9BC4',   // Lighter pink
  },
  secondaryDark: {
    start: '#FF5A8D',
    end: '#FF7BA8',
  },

  // Status-based gradients
  calm: {
    start: '#E8F5E9', // Soft green
    end: '#F1F8F2',   // Very light green
  },
  reminder: {
    start: '#FFF3E0', // Warm amber
    end: '#FFE8CC',   // Light amber
  },
  concern: {
    start: '#FFE0E0', // Soft coral
    end: '#FFF0F0',   // Very light coral
  },
  emergency: {
    start: '#FF4757', // Vibrant red
    end: '#FF6B7A',   // Lighter red
  },

  // Background gradients
  background: {
    start: '#FAFAFA',
    end: '#F5F5F5',
  },
  surface: {
    start: '#FFFFFF',
    end: '#FAFAFA',
  },

  // Accent gradients
  success: {
    start: '#4CAF50',
    end: '#66BB6A',
  },
  warning: {
    start: '#FF9800',
    end: '#FFB74D',
  },
  info: {
    start: '#2196F3',
    end: '#42A5F5',
  },
};

// ============================================================================
// SOLID COLOR TOKENS (for fallbacks and specific use cases)
// ============================================================================

// Legacy Colors export (light mode only, for backward compatibility)
// New code should use useColors() hook for theme-aware colors
export const Colors = {
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

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const Typography = {
  // Font families (friendly, rounded, medical-safe)
  // Note: These should be loaded via expo-font or react-native-vector-icons
  fontFamily: {
    regular: 'System', // Will be replaced with custom rounded font
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },

  // Font sizes with friendly hierarchy
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 40,
    hero: 48,
  },

  // Line heights (generous for readability)
  lineHeight: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
    xxl: 36,
    xxxl: 44,
    display: 48,
    hero: 56,
  },

  // Font weights
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // Letter spacing (slightly increased for medical readability)
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
  },
};

// ============================================================================
// SPACING
// ============================================================================

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// ============================================================================
// BORDER RADIUS (rounded, friendly)
// ============================================================================

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

// ============================================================================
// SHADOWS (soft, depth-creating)
// ============================================================================

export const Shadows = {
  // Soft shadows for cards
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.20,
    shadowRadius: 24,
    elevation: 12,
  },
  // Colored shadows for status-based components
  calm: {
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  reminder: {
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  concern: {
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  emergency: {
    shadowColor: '#FF4757',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
};

// ============================================================================
// TOUCH TARGETS (Accessibility)
// ============================================================================

export const TouchTarget = {
  min: 44, // Minimum touch target size
  comfortable: 48,
  large: 56,
};

// ============================================================================
// ANIMATION TIMINGS
// ============================================================================

export const Animation = {
  fast: 150,
  normal: 250,
  slow: 350,
  spring: {
    damping: 15,
    stiffness: 150,
  },
};

// ============================================================================
// Z-INDEX LAYERS
// ============================================================================

export const ZIndex = {
  base: 0,
  elevated: 10,
  dropdown: 100,
  modal: 200,
  toast: 300,
  emergency: 400,
};
