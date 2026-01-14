import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';
import { Colors, Spacing, BorderRadius } from '../../lib/design/tokens';
import { createSuccessAnimation, createSuccessBounce } from '../../lib/animations/utils';

interface SuccessIndicatorProps {
  visible: boolean;
  message?: string;
  size?: number;
  onComplete?: () => void;
}

export function SuccessIndicator({
  visible,
  message,
  size = 48,
  onComplete,
}: SuccessIndicatorProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const checkmarkScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Bounce in
      Animated.parallel([
        createSuccessBounce(scaleAnim),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Checkmark animation
        createSuccessAnimation(checkmarkScale, opacityAnim).start(() => {
          if (onComplete) {
            setTimeout(onComplete, 300);
          }
        });
      });
    } else {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      checkmarkScale.setValue(0);
    }
  }, [visible, scaleAnim, opacityAnim, checkmarkScale, onComplete]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <Animated.Text
          style={[
            styles.checkmark,
            {
              fontSize: size * 0.6,
              transform: [{ scale: checkmarkScale }],
            },
          ]}
        >
          ✓
        </Animated.Text>
      </View>
      {message && (
        <Animated.Text
          style={[
            styles.message,
            {
              opacity: opacityAnim,
            },
          ]}
        >
          {message}
        </Animated.Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  circle: {
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.success + '40',
  },
  checkmark: {
    color: Colors.text,
    fontWeight: 'bold',
  },
  message: {
    marginTop: Spacing.sm,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
});
