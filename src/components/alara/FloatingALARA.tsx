import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Animated,
  Text,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useALARA, ALARAState } from '../../context/ALARAContext';
import { useAuth } from '../../context/AuthContext';
import { Gradients, Spacing, BorderRadius, Shadows, Animation } from '../../lib/design/tokens';
import { useColors } from '../../lib/design/useColors';
import { Typography } from '../ui/Typography';

const ALARA_ASSETS = {
  transparent_image: 'https://assets.masco.dev/2a733c/alara-8022/wave-101c7c62.png',
};

const MASCOT_SIZE = 64;
const EXPANDED_SIZE = 80;
const CHAT_BUBBLE_MAX_WIDTH = 280;
const TAB_BAR_HEIGHT = 60; // Base height of the tab bar (without safe area insets)

interface FloatingALARAProps {
  position?: 'bottom-right' | 'bottom-left';
}

export function FloatingALARA({ position = 'bottom-right' }: FloatingALARAProps) {
  const { state, message, hideMessage, isVisible } = useALARA();
  const { user } = useAuth();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();
  const [imageError, setImageError] = useState(false);

  // Hide on emergency screen, when not logged in, or in auth/onboarding phase
  const isInAuthFlow = pathname?.includes('/(auth)') || pathname?.includes('/onboarding');
  const isEmergencyScreen = pathname?.includes('/emergency');
  const isChatScreen = pathname?.includes('/alara-chat');
  const shouldHide = isEmergencyScreen || !isVisible || !user || isInAuthFlow || isChatScreen;

  // Animation refs
  const breatheAnim = useRef(new Animated.Value(1)).current;
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bubbleScaleAnim = useRef(new Animated.Value(0)).current;
  const bubbleOpacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;
  const colorAnim = useRef(new Animated.Value(0)).current;

  // Breathing animation (subtle, continuous)
  useEffect(() => {
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    breathe.start();
    return () => breathe.stop();
  }, [breatheAnim]);

  // Blinking animation (random intervals)
  useEffect(() => {
    const blink = () => {
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0.1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Random delay between 2-5 seconds
        const delay = 2000 + Math.random() * 3000;
        setTimeout(blink, delay);
      });
    };
    blink();
  }, [blinkAnim]);

  // Chat bubble expand/collapse
  useEffect(() => {
    if (message) {
      // Expand bubble
      Animated.parallel([
        Animated.spring(bubbleScaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          ...Animation.spring,
        }),
        Animated.timing(bubbleOpacityAnim, {
          toValue: 1,
          duration: Animation.normal,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1.25, // Mascot grows slightly when bubble is open
          useNativeDriver: true,
          ...Animation.spring,
        }),
      ]).start();
    } else {
      // Collapse bubble
      Animated.parallel([
        Animated.spring(bubbleScaleAnim, {
          toValue: 0,
          useNativeDriver: true,
          ...Animation.spring,
        }),
        Animated.timing(bubbleOpacityAnim, {
          toValue: 0,
          duration: Animation.fast,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          ...Animation.spring,
        }),
      ]).start();
    }
  }, [message, bubbleScaleAnim, bubbleOpacityAnim, scaleAnim]);

  // State-based color animation (for smooth transitions)
  useEffect(() => {
    Animated.spring(colorAnim, {
      toValue: 1, // Always animate to 1, color is determined by state directly
      useNativeDriver: false, // Color animations can't use native driver
      ...Animation.spring,
    }).start();
  }, [state, colorAnim]);

  // Gentle floating animation
  useEffect(() => {
    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(translateYAnim, {
          toValue: -4,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );
    float.start();
    return () => float.stop();
  }, [translateYAnim]);

  const getStateColor = (): string => {
    switch (state) {
      case 'calm':
        return '#4CAF50'; // Green
      case 'reminder':
        return '#FF9800'; // Amber
      case 'concern':
        return '#FF6B6B'; // Coral
      case 'emergency':
        return '#FF4757'; // Red
      case 'thinking':
        return colors.primary;
      default:
        return colors.primary;
    }
  };

  const getStateGradient = (): [string, string] => {
    switch (state) {
      case 'calm':
        return ['#4CAF50', '#66BB6A']; // Green gradient
      case 'reminder':
        return ['#FF9800', '#FFB74D']; // Amber gradient
      case 'concern':
        return ['#FF6B6B', '#FF8E8E']; // Coral gradient
      case 'emergency':
        return ['#FF4757', '#FF6B7A']; // Red gradient
      case 'thinking':
        return [Gradients.primary.start, Gradients.primary.end];
      default:
        return [Gradients.primary.start, Gradients.primary.end];
    }
  };

  const getStateExpression = (): string => {
    switch (state) {
      case 'calm':
        return '😊';
      case 'reminder':
        return '⏰';
      case 'concern':
        return '🤔';
      case 'emergency':
        return '🚨';
      case 'thinking':
        return '💭';
      default:
        return '👋';
    }
  };

  if (shouldHide) {
    return null;
  }

  const isRight = position === 'bottom-right';
  const screenWidth = Dimensions.get('window').width;

  return (
    <View
      style={[
        styles.container,
        {
          bottom: insets.bottom + TAB_BAR_HEIGHT + Spacing.md,
          [isRight ? 'right' : 'left']: Spacing.md,
        },
      ]}
      pointerEvents="box-none"
    >
      {/* Chat Bubble */}
      {message && (
        <Animated.View
          style={[
            styles.bubbleContainer,
            {
              [isRight ? 'right' : 'left']: isRight ? MASCOT_SIZE / 2 + Spacing.sm : undefined,
              [isRight ? 'left' : 'right']: isRight ? undefined : MASCOT_SIZE / 2 + Spacing.sm,
              opacity: bubbleOpacityAnim,
              transform: [
                {
                  scale: bubbleScaleAnim,
                },
              ],
            },
          ]}
          pointerEvents="box-none"
        >
          <View style={styles.bubbleWrapper}>
            <LinearGradient
              colors={getStateGradient()}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bubble}
            >
              <TouchableOpacity
                onPress={hideMessage}
                activeOpacity={0.8}
                style={styles.bubbleContent}
              >
                <Typography
                  variant="bodySmall"
                  color="text"
                  weight="medium"
                  style={styles.bubbleText}
                >
                  {message.text}
                </Typography>
              </TouchableOpacity>
            </LinearGradient>
            <View
              style={[
                styles.bubbleTail,
                {
                  borderTopColor: getStateGradient()[1], // Use end color of gradient
                },
              ]}
            />
          </View>
        </Animated.View>
      )}

      {/* Mascot */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          // Open chat if no message, or hide message if showing
          if (!message) {
            // Navigate to chat screen
            router.push('/(tabs)/alara-chat');
          } else {
            hideMessage();
          }
        }}
        style={styles.mascotContainer}
      >
        <Animated.View
          style={[
            styles.mascotWrapper,
            {
              transform: [
                { scale: Animated.multiply(scaleAnim, breatheAnim) },
                { translateY: translateYAnim },
              ],
              opacity: blinkAnim,
            },
          ]}
        >
          {/* State indicator ring */}
          <Animated.View
            style={[
              styles.stateRing,
              {
                borderColor: getStateColor(),
                opacity: 0.6,
              },
            ]}
          />
          
          {/* State indicator glow */}
          <Animated.View
            style={[
              styles.stateGlow,
              {
                backgroundColor: getStateColor(),
                opacity: colorAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.2, 0.5],
                }),
              },
            ]}
          />
          
          {/* Colored background circle */}
          <Animated.View
            style={[
              styles.mascotBackground,
              {
                backgroundColor: getStateColor(),
                opacity: 0.15,
              },
            ]}
          />

          {/* Mascot image or fallback */}
          {imageError ? (
            <View style={[styles.fallbackContainer, { width: MASCOT_SIZE, height: MASCOT_SIZE, backgroundColor: colors.surface }]}>
              <Text style={[styles.fallbackEmoji, { fontSize: MASCOT_SIZE * 0.5, color: colors.primary }]}>
                {getStateExpression()}
              </Text>
            </View>
          ) : (
            <Image
              source={{ uri: ALARA_ASSETS.transparent_image }}
              style={[styles.mascotImage, { width: MASCOT_SIZE, height: MASCOT_SIZE }]}
              resizeMode="contain"
              accessibilityLabel="ALARA mascot"
              onError={() => {
                console.log('Failed to load ALARA image, using fallback');
                setImageError(true);
              }}
            />
          )}
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotContainer: {
    width: MASCOT_SIZE,
    height: MASCOT_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotWrapper: {
    width: MASCOT_SIZE,
    height: MASCOT_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateRing: {
    position: 'absolute',
    width: MASCOT_SIZE + 8,
    height: MASCOT_SIZE + 8,
    borderRadius: (MASCOT_SIZE + 8) / 2,
    borderWidth: 2,
    zIndex: 1,
  },
  stateGlow: {
    position: 'absolute',
    width: MASCOT_SIZE + 16,
    height: MASCOT_SIZE + 16,
    borderRadius: (MASCOT_SIZE + 16) / 2,
    zIndex: 0,
  },
  mascotBackground: {
    position: 'absolute',
    width: MASCOT_SIZE,
    height: MASCOT_SIZE,
    borderRadius: MASCOT_SIZE / 2,
    zIndex: 0,
  },
  mascotImage: {
    ...Platform.select({
      ios: {
        ...Shadows.md,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  fallbackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: MASCOT_SIZE / 2,
    ...Platform.select({
      ios: {
        ...Shadows.md,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  fallbackEmoji: {
    textAlign: 'center',
  },
  bubbleContainer: {
    position: 'absolute',
    bottom: MASCOT_SIZE + Spacing.sm,
    maxWidth: CHAT_BUBBLE_MAX_WIDTH,
    minWidth: 200,
  },
  bubbleWrapper: {
    position: 'relative',
  },
  bubble: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    ...Platform.select({
      ios: {
        ...Shadows.lg,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  bubbleContent: {
    position: 'relative',
  },
  bubbleText: {
    // Color set via Typography component
  },
  bubbleTail: {
    position: 'absolute',
    bottom: -6,
    alignSelf: 'center',
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});
