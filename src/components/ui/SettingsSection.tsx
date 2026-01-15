import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, BorderRadius } from '../../lib/design/tokens';
import { getThemeColors } from '../../lib/design/themes';
import { useTheme } from '../../context/ThemeContext';
import { Typography } from './Typography';

interface SettingsSectionProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
}

export function SettingsSection({ title, icon, children }: SettingsSectionProps) {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name={icon} size={18} color={colors.primary} style={styles.icon} />
        <Typography variant="caption" weight="semibold" style={[styles.title, { color: colors.primary }]}>
          {title.toUpperCase()}
        </Typography>
      </View>
      <View style={[styles.content, { backgroundColor: colors.surface }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  icon: {
    marginRight: Spacing.xs,
  },
  title: {
    letterSpacing: 0.5,
  },
  content: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
});
