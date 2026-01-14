import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Colors,
  Gradients,
  Spacing,
  BorderRadius,
  Shadows,
  Animation,
} from '../../lib/design/tokens';

interface EmojiReactionButtonProps {
  emoji: string;
  label: string;
  onPress: () => void;
  isSelected?: boolean;
  delay?: number;
}

export function EmojiReactionButton({
  emoji,
  label,
  onPress,
  isSelected = false,
  delay = 0,
}: EmojiReactionButtonProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Staggered entrance
    setTimeout(() => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        ...Animation.spring,
      }).start();
    }, delay);
  }, [delay, scaleAnim]);

  useEffect(() => {
    if (isSelected) {
      // Celebration bounce
      Animated.sequence([
        Animated.spring(bounceAnim, {
          toValue: 1.2,
          useNativeDriver: true,
          ...Animation.spring,
        }),
        Animated.spring(bounceAnim, {
          toValue: 1,
          useNativeDriver: true,
          ...Animation.spring,
        }),
      ]).start();
    }
  }, [isSelected, bounceAnim]);

  const handlePress = () => {
    // Press animation
    Animated.sequence([
      Animated.spring(bounceAnim, {
        toValue: 0.9,
        useNativeDriver: true,
        ...Animation.spring,
      }),
      Animated.spring(bounceAnim, {
        toValue: 1,
        useNativeDriver: true,
        ...Animation.spring,
      }),
    ]).start();

    onPress();
  };

  return (
    <Animated.View
      style={[
        {
          transform: [
            { scale: Animated.multiply(scaleAnim, bounceAnim) },
          ],
          opacity: scaleAnim,
        },
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={styles.container}
      >
        <LinearGradient
          colors={
            isSelected
              ? [Gradients.primary.start, Gradients.primary.end]
              : [Gradients.surface.start, Gradients.surface.end]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.button,
            isSelected && styles.buttonSelected,
          ]}
        >
          <Text style={styles.emoji}>{emoji}</Text>
          <Text
            style={[
              styles.label,
              isSelected && styles.labelSelected,
            ]}
          >
            {label}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  button: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        ...Shadows.sm,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  buttonSelected: {
    borderColor: Colors.primary,
    ...Platform.select({
      ios: {
        ...Shadows.md,
        shadowColor: Colors.primary,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  emoji: {
    fontSize: 24,
    marginRight: Spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  labelSelected: {
    color: Colors.text,
    fontWeight: '600',
  },
});
