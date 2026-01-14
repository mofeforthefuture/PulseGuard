import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { Colors, Spacing, Animation as AnimationTokens } from '../../lib/design/tokens';
import { Typography } from './Typography';
import { createFadeIn, createLoadingPulse } from '../../lib/animations/utils';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
}

export function LoadingState({ message, size = 'large' }: LoadingStateProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    createFadeIn(fadeAnim).start();
    createLoadingPulse(pulseAnim).start();
  }, [fadeAnim, pulseAnim]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.indicatorContainer,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <ActivityIndicator size={size} color={Colors.primary} />
      </Animated.View>
      {message && (
        <Typography
          variant="body"
          color="textSecondary"
          style={styles.message}
        >
          {message}
        </Typography>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  indicatorContainer: {
    marginBottom: Spacing.md,
  },
  message: {
    marginTop: Spacing.md,
    textAlign: 'center',
  },
});
