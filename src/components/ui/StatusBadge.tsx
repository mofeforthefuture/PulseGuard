import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography } from './Typography';
import {
  Spacing,
  BorderRadius,
  Gradients,
  Shadows,
} from '../../lib/design/tokens';
import { useColors } from '../../lib/design/useColors';

interface StatusBadgeProps {
  label: string;
  status: 'calm' | 'reminder' | 'concern' | 'emergency';
  variant?: 'solid' | 'gradient' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export function StatusBadge({
  label,
  status,
  variant = 'gradient',
  size = 'md',
  style,
}: StatusBadgeProps) {
  const colors = useColors();
  
  const getGradient = () => {
    switch (status) {
      case 'calm':
        return [Gradients.calm.start, Gradients.calm.end];
      case 'reminder':
        return [Gradients.reminder.start, Gradients.reminder.end];
      case 'concern':
        return [Gradients.concern.start, Gradients.concern.end];
      case 'emergency':
        return [Gradients.emergency.start, Gradients.emergency.end];
    }
  };

  const getBackgroundColor = () => {
    switch (status) {
      case 'calm':
        return colors.calm;
      case 'reminder':
        return colors.reminder;
      case 'concern':
        return colors.concern;
      case 'emergency':
        return colors.emergency;
    }
  };

  const getBorderColor = () => {
    switch (status) {
      case 'calm':
        return colors.calmDark;
      case 'reminder':
        return colors.reminderDark;
      case 'concern':
        return colors.concernDark;
      case 'emergency':
        return colors.emergencyDark;
    }
  };

  const getShadow = () => {
    if (variant === 'outline') return {};
    return Shadows[status];
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          paddingVertical: Spacing.xs,
          paddingHorizontal: Spacing.sm,
        };
      case 'lg':
        return {
          paddingVertical: Spacing.sm,
          paddingHorizontal: Spacing.md,
        };
      default:
        return {
          paddingVertical: Spacing.xs,
          paddingHorizontal: Spacing.sm,
        };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return 'caption' as const;
      case 'lg':
        return 'bodySmall' as const;
      default:
        return 'caption' as const;
    }
  };

  return (
    <View
      style={[
        styles.badge,
        getSizeStyles(),
        variant === 'outline' && {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: getBorderColor(),
        },
        variant === 'solid' && {
          backgroundColor: getBackgroundColor(),
        },
        getShadow(),
        style,
      ]}
    >
      {variant === 'gradient' ? (
        <LinearGradient
          colors={getGradient()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <Typography
        variant={getFontSize()}
        weight="medium"
        color={status === 'emergency' ? 'text' : 'text'}
        style={styles.text}
      >
        {label}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  text: {
    position: 'relative',
    zIndex: 1,
  },
});
