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
import { Typography } from '../ui/Typography';

interface DrinkButtonProps {
  amount: number; // in ml
  label: string;
  icon: string;
  onPress: () => void;
  delay?: number;
}

export function DrinkButton({ amount, label, icon, onPress, delay = 0 }: DrinkButtonProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

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

  const handlePress = () => {
    // Press animation
    Animated.sequence([
      Animated.spring(pressAnim, {
        toValue: 0.9,
        useNativeDriver: true,
        ...Animation.spring,
      }),
      Animated.parallel([
        Animated.spring(pressAnim, {
          toValue: 1,
          useNativeDriver: true,
          ...Animation.spring,
        }),
        Animated.sequence([
          Animated.timing(successAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(successAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();

    onPress();
  };

  const checkmarkScale = successAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1.2, 1],
  });

  const checkmarkOpacity = successAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1, 0],
  });

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: Animated.multiply(scaleAnim, pressAnim) }],
          opacity: scaleAnim,
        },
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.9}
        style={styles.container}
      >
        <LinearGradient
          colors={[Gradients.primary.start, Gradients.primary.end]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.button}
        >
          {/* Success checkmark overlay */}
          <Animated.View
            style={[
              styles.successOverlay,
              {
                opacity: checkmarkOpacity,
                transform: [{ scale: checkmarkScale }],
              },
            ]}
          >
            <Text style={styles.checkmark}>✓</Text>
          </Animated.View>

          <Text style={styles.icon}>{icon}</Text>
          <View style={styles.content}>
            <Typography variant="h3" color="text" weight="bold" style={styles.amount}>
              +{amount}ml
            </Typography>
            <Typography variant="caption" color="textSecondary" style={styles.label}>
              {label}
            </Typography>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.sm,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    minWidth: 140,
    ...Platform.select({
      ios: {
        ...Shadows.md,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.success + '80',
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 48,
    color: Colors.text,
    fontWeight: 'bold',
  },
  icon: {
    fontSize: 32,
    marginRight: Spacing.sm,
  },
  content: {
    flex: 1,
  },
  amount: {
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
  },
});
