import React, { useRef } from 'react';
import { TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography } from './Typography';
import { Spacing, BorderRadius, Shadows, Gradients } from '../../lib/design/tokens';
import { useColors } from '../../lib/design/useColors';

interface FloatingActionButtonProps {
  onPress: () => void;
  icon?: string;
  label?: string;
  variant?: 'primary' | 'secondary' | 'emergency';
}

export function FloatingActionButton({
  onPress,
  icon = '+',
  label,
  variant = 'primary',
}: FloatingActionButtonProps) {
  const colors = useColors();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const getGradient = () => {
    switch (variant) {
      case 'secondary':
        return [Gradients.secondary.start, Gradients.secondary.end];
      case 'emergency':
        return [Gradients.emergency.start, Gradients.emergency.end];
      default:
        return [Gradients.primary.start, Gradients.primary.end];
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        style={styles.button}
      >
        <LinearGradient
          colors={getGradient()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <Typography variant="h2" color="text" weight="bold" style={styles.icon}>
            {icon}
          </Typography>
          {label && (
            <Typography variant="bodySmall" color="text" weight="semibold" style={styles.label}>
              {label}
            </Typography>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.lg,
    ...Platform.select({
      ios: {
        ...Shadows.lg,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
  },
  gradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    color: '#FFFFFF',
  },
  label: {
    marginTop: Spacing.xs / 2,
    color: '#FFFFFF',
    fontSize: 10,
  },
});
