import React, { useRef } from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Colors,
  Spacing,
  BorderRadius,
  Shadows,
  Gradients,
  Animation,
} from '../../lib/design/tokens';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'calm' | 'reminder' | 'concern' | 'emergency' | 'gradient';
  shadow?: 'sm' | 'md' | 'lg' | 'xl' | 'none';
  onPress?: () => void;
  padding?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Card({
  children,
  style,
  variant = 'default',
  shadow = 'md',
  onPress,
  padding = 'md',
}: CardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (onPress) {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
        ...Animation.spring,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        ...Animation.spring,
      }).start();
    }
  };

  const getPadding = () => {
    switch (padding) {
      case 'sm':
        return Spacing.sm;
      case 'lg':
        return Spacing.lg;
      case 'xl':
        return Spacing.xl;
      default:
        return Spacing.md;
    }
  };

  const getShadowStyle = () => {
    if (shadow === 'none') return {};
    if (variant === 'calm') return Shadows.calm;
    if (variant === 'reminder') return Shadows.reminder;
    if (variant === 'concern') return Shadows.concern;
    if (variant === 'emergency') return Shadows.emergency;
    return Shadows[shadow];
  };

  const getBackgroundColor = () => {
    switch (variant) {
      case 'calm':
        return Colors.calm;
      case 'reminder':
        return Colors.reminder;
      case 'concern':
        return Colors.concern;
      case 'emergency':
        return Colors.emergency;
      case 'elevated':
        return Colors.surfaceElevated;
      default:
        return Colors.surface;
    }
  };

  const getGradient = () => {
    switch (variant) {
      case 'calm':
        return [Gradients.calm.start, Gradients.calm.end];
      case 'reminder':
        return [Gradients.reminder.start, Gradients.reminder.end];
      case 'concern':
        return [Gradients.concern.start, Gradients.concern.end];
      case 'emergency':
        return [Gradients.emergency.start, Gradients.emergency.end];
      case 'gradient':
        return [Gradients.surface.start, Gradients.surface.end];
      default:
        return null;
    }
  };

  const cardContent = (
    <Animated.View
      style={[
        styles.card,
        {
          padding: getPadding(),
          backgroundColor: variant === 'gradient' ? 'transparent' : getBackgroundColor(),
          transform: [{ scale: scaleAnim }],
        },
        getShadowStyle(),
        style,
      ]}
    >
      {variant === 'gradient' || ['calm', 'reminder', 'concern', 'emergency'].includes(variant) ? (
        <LinearGradient
          colors={getGradient() || [Colors.surface, Colors.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <View style={styles.content}>{children}</View>
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={styles.touchable}
      >
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  touchable: {
    marginBottom: Spacing.md,
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
});
