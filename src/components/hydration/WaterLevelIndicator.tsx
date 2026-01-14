import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Platform,
  Dimensions,
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

interface WaterLevelIndicatorProps {
  currentAmount: number; // in ml
  goalAmount: number; // in ml
  showGlow?: boolean; // for reminder glow
  size?: 'sm' | 'md' | 'lg';
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const INDICATOR_SIZES = {
  sm: { width: 120, height: 200 },
  md: { width: 160, height: 280 },
  lg: { width: 200, height: 360 },
};

export function WaterLevelIndicator({
  currentAmount,
  goalAmount,
  showGlow = false,
  size = 'md',
}: WaterLevelIndicatorProps) {
  const fillAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;

  const dimensions = INDICATOR_SIZES[size];
  const percentage = Math.min((currentAmount / goalAmount) * 100, 100);

  // Animate fill level
  useEffect(() => {
    Animated.spring(fillAnim, {
      toValue: percentage,
      useNativeDriver: false, // Can't use native driver for height
      ...Animation.spring,
    }).start();
  }, [percentage, fillAnim]);

  // Glow animation for reminders
  useEffect(() => {
    if (showGlow) {
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      glow.start();
      return () => glow.stop();
    } else {
      glowAnim.setValue(0);
    }
  }, [showGlow, glowAnim]);

  // Ripple effect when drinking
  useEffect(() => {
    if (currentAmount > 0) {
      Animated.sequence([
        Animated.timing(rippleAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(rippleAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [currentAmount, rippleAnim]);

  const fillHeight = fillAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [0, dimensions.height - 40], // Leave space for top/bottom
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const rippleScale = rippleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.3],
  });

  const rippleOpacity = rippleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 0],
  });

  // Get water color based on progress
  const getWaterGradient = (): [string, string] => {
    if (percentage >= 100) {
      return ['#4FC3F7', '#29B6F6']; // Bright blue when complete
    }
    if (percentage >= 75) {
      return ['#5CBBF6', '#42A5F5']; // Medium blue
    }
    if (percentage >= 50) {
      return ['#64B5F6', '#42A5F5']; // Standard blue
    }
    return ['#90CAF9', '#64B5F6']; // Light blue when low
  };

  return (
    <View style={[styles.container, { width: dimensions.width }]}>
      {/* Glow overlay */}
      {showGlow && (
        <Animated.View
          style={[
            styles.glowOverlay,
            {
              width: dimensions.width + 20,
              height: dimensions.height + 20,
              opacity: glowOpacity,
            },
          ]}
        />
      )}

      {/* Water bottle container */}
      <View style={[styles.bottle, { height: dimensions.height, width: dimensions.width }]}>
        {/* Bottle outline */}
        <View style={[styles.bottleOutline, { height: dimensions.height, width: dimensions.width }]}>
          {/* Water fill */}
          <Animated.View
            style={[
              styles.waterFill,
              {
                height: fillHeight,
                width: dimensions.width - 20,
                bottom: 20,
              },
            ]}
          >
            <LinearGradient
              colors={getWaterGradient()}
              start={{ x: 0, y: 1 }}
              end={{ x: 0, y: 0 }}
              style={StyleSheet.absoluteFill}
            >
              {/* Water surface animation */}
              <View style={styles.waterSurface}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Ripple effect */}
          {rippleAnim._value > 0 && (
            <Animated.View
              style={[
                styles.ripple,
                {
                  width: dimensions.width,
                  height: dimensions.width,
                  borderRadius: dimensions.width / 2,
                  transform: [{ scale: rippleScale }],
                  opacity: rippleOpacity,
                },
              ]}
            />
          )}

          {/* Bottle cap */}
          <View style={[styles.cap, { width: dimensions.width * 0.4 }]} />
        </View>

        {/* Goal marker */}
        {percentage < 100 && (
          <View
            style={[
              styles.goalMarker,
              {
                bottom: 20 + ((goalAmount - currentAmount) / goalAmount) * (dimensions.height - 40),
              },
            ]}
          >
            <View style={styles.goalLine} />
            <View style={styles.goalDot} />
          </View>
        )}
      </View>

      {/* Progress text */}
      <View style={styles.progressText}>
        <Animated.Text
          style={[
            styles.amountText,
            {
              opacity: fillAnim.interpolate({
                inputRange: [0, 100],
                outputRange: [0.5, 1],
              }),
            },
          ]}
        >
          {Math.round(currentAmount)}ml
        </Animated.Text>
        <Animated.Text
          style={[
            styles.goalText,
            {
              opacity: fillAnim.interpolate({
                inputRange: [0, 100],
                outputRange: [0.3, 0.6],
              }),
            },
          ]}
        >
          / {goalAmount}ml
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowOverlay: {
    position: 'absolute',
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 20,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  bottle: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bottleOutline: {
    borderRadius: BorderRadius.xl,
    borderWidth: 4,
    borderColor: Colors.border,
    backgroundColor: Colors.surface + '40',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        ...Shadows.lg,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  waterFill: {
    position: 'absolute',
    left: 10,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  waterSurface: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 10,
  },
  ripple: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: Colors.primary + '40',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  cap: {
    position: 'absolute',
    top: -15,
    alignSelf: 'center',
    height: 20,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.primaryDark,
  },
  goalMarker: {
    position: 'absolute',
    left: -10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalLine: {
    width: 8,
    height: 2,
    backgroundColor: Colors.warning,
  },
  goalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.warning,
    marginLeft: 2,
  },
  progressText: {
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  amountText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  goalText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
