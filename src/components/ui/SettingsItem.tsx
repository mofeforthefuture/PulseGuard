import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing } from '../../lib/design/tokens';
import { getThemeColors } from '../../lib/design/themes';
import { useTheme } from '../../context/ThemeContext';
import { Typography } from './Typography';
import { Toggle } from './Toggle';

interface SettingsItemProps {
  label: string;
  onPress?: () => void;
  rightIcon?: 'arrow' | 'toggle';
  toggleValue?: boolean;
  onToggleChange?: (value: boolean) => void;
  showArrow?: boolean;
  isLast?: boolean;
}

export function SettingsItem({
  label,
  onPress,
  rightIcon,
  toggleValue,
  onToggleChange,
  showArrow = true,
  isLast = false,
}: SettingsItemProps) {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const isToggle = rightIcon === 'toggle';
  const isAction = !isToggle && onPress;

  const content = (
    <View style={[styles.container, isLast && styles.containerLast, { borderBottomColor: colors.border + '20' }]}>
      <Typography variant="body" style={[styles.label, { color: colors.text }]}>
        {label}
      </Typography>
      {isToggle && toggleValue !== undefined && onToggleChange ? (
        <Toggle value={toggleValue} onValueChange={onToggleChange} />
      ) : showArrow && isAction ? (
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      ) : null}
    </View>
  );

  if (isAction) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={[styles.touchable, { backgroundColor: colors.surface }]}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.wrapper, { backgroundColor: colors.surface }]}>{content}</View>;
}

const styles = StyleSheet.create({
  wrapper: {},
  touchable: {},
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
  },
  containerLast: {
    borderBottomWidth: 0,
  },
  label: {
    flex: 1,
  },
});
