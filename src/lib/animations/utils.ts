import { Animated, Easing } from 'react-native';
import { Animation } from '../design/tokens';

/**
 * Animation utilities for consistent, meaningful animations across the app
 */

export interface TapFeedbackConfig {
  scale?: number;
  opacity?: number;
  duration?: number;
}

/**
 * Creates tap feedback animation (press down)
 */
export function createTapFeedback(
  anim: Animated.Value,
  config: TapFeedbackConfig = {}
): Animated.CompositeAnimation {
  const { scale = 0.96, opacity = 0.8, duration = Animation.fast } = config;
  
  return Animated.parallel([
    Animated.spring(anim, {
      toValue: scale,
      useNativeDriver: true,
      ...Animation.spring,
    }),
  ]);
}

/**
 * Creates tap release animation (press up)
 */
export function createTapRelease(
  anim: Animated.Value,
  config: TapFeedbackConfig = {}
): Animated.CompositeAnimation {
  const { scale = 1, opacity = 1, duration = Animation.fast } = config;
  
  return Animated.parallel([
    Animated.spring(anim, {
      toValue: scale,
      useNativeDriver: true,
      ...Animation.spring,
    }),
  ]);
}

/**
 * Creates a success checkmark animation
 */
export function createSuccessAnimation(
  scaleAnim: Animated.Value,
  opacityAnim: Animated.Value
): Animated.CompositeAnimation {
  return Animated.sequence([
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1.2,
        useNativeDriver: true,
        ...Animation.spring,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]),
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        ...Animation.spring,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        delay: 500,
        useNativeDriver: true,
      }),
    ]),
  ]);
}

/**
 * Creates a fade in animation
 */
export function createFadeIn(
  anim: Animated.Value,
  duration: number = Animation.normal
): Animated.CompositeAnimation {
  return Animated.timing(anim, {
    toValue: 1,
    duration,
    useNativeDriver: true,
    easing: Easing.out(Easing.ease),
  });
}

/**
 * Creates a fade out animation
 */
export function createFadeOut(
  anim: Animated.Value,
  duration: number = Animation.fast
): Animated.CompositeAnimation {
  return Animated.timing(anim, {
    toValue: 0,
    duration,
    useNativeDriver: true,
    easing: Easing.in(Easing.ease),
  });
}

/**
 * Creates a slide in animation (from bottom)
 */
export function createSlideIn(
  anim: Animated.Value,
  fromValue: number = 100,
  duration: number = Animation.normal
): Animated.CompositeAnimation {
  return Animated.spring(anim, {
    toValue: 0,
    fromValue,
    useNativeDriver: true,
    ...Animation.spring,
  });
}

/**
 * Creates a slide out animation (to bottom)
 */
export function createSlideOut(
  anim: Animated.Value,
  toValue: number = 100,
  duration: number = Animation.fast
): Animated.CompositeAnimation {
  return Animated.timing(anim, {
    toValue,
    duration,
    useNativeDriver: true,
    easing: Easing.in(Easing.ease),
  });
}

/**
 * Creates a staggered entrance animation for list items
 */
export function createStaggeredEntrance(
  anims: Animated.Value[],
  delay: number = 50
): Animated.CompositeAnimation[] {
  return anims.map((anim, index) => {
    return Animated.sequence([
      Animated.delay(index * delay),
      Animated.parallel([
        Animated.spring(anim, {
          toValue: 1,
          useNativeDriver: true,
          ...Animation.spring,
        }),
      ]),
    ]);
  });
}

/**
 * Creates an immediate transition (no delay) for emergency states
 */
export function createImmediateTransition(
  anim: Animated.Value,
  toValue: number = 1
): Animated.CompositeAnimation {
  return Animated.timing(anim, {
    toValue,
    duration: 0, // Immediate
    useNativeDriver: true,
  });
}

/**
 * Creates a loading pulse animation
 */
export function createLoadingPulse(
  anim: Animated.Value
): Animated.CompositeAnimation {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(anim, {
        toValue: 0.5,
        duration: 1000,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.ease),
      }),
      Animated.timing(anim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.ease),
      }),
    ])
  );
}

/**
 * Creates a scale bounce animation for success states
 */
export function createSuccessBounce(
  anim: Animated.Value
): Animated.CompositeAnimation {
  return Animated.sequence([
    Animated.spring(anim, {
      toValue: 1.15,
      useNativeDriver: true,
      ...Animation.spring,
    }),
    Animated.spring(anim, {
      toValue: 1,
      useNativeDriver: true,
      ...Animation.spring,
    }),
  ]);
}
