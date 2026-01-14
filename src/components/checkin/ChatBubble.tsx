import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
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

interface ChatBubbleProps {
  message: string;
  isALARA?: boolean;
  emoji?: string;
  delay?: number;
}

export function ChatBubble({ message, isALARA = false, emoji, delay = 0 }: ChatBubbleProps) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Delayed entrance animation
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 1,
          useNativeDriver: true,
          ...Animation.spring,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: Animation.normal,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          ...Animation.spring,
        }),
      ]).start();
    }, delay);
  }, [delay, slideAnim, fadeAnim, scaleAnim]);

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: isALARA ? [-20, 0] : [20, 0],
  });

  const getGradient = (): [string, string] => {
    if (isALARA) {
      return [Gradients.primary.start, Gradients.primary.end];
    }
    return [Gradients.surface.start, Gradients.surface.end];
  };

  return (
    <Animated.View
      style={[
        styles.container,
        isALARA ? styles.alaraContainer : styles.userContainer,
        {
          opacity: fadeAnim,
          transform: [
            { translateX },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      {isALARA && emoji && (
        <View style={styles.emojiContainer}>
          <Text style={styles.emoji}>{emoji}</Text>
        </View>
      )}
      
      <LinearGradient
        colors={getGradient()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.bubble,
          isALARA ? styles.alaraBubble : styles.userBubble,
        ]}
      >
        <Typography
          variant="body"
          color="text"
          weight={isALARA ? 'medium' : 'regular'}
          style={styles.message}
        >
          {message}
        </Typography>
      </LinearGradient>

      {!isALARA && emoji && (
        <View style={styles.emojiContainer}>
          <Text style={styles.emoji}>{emoji}</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
    maxWidth: '80%',
  },
  alaraContainer: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  userContainer: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
    alignItems: 'flex-end',
  },
  emojiContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.xs,
    ...Platform.select({
      ios: {
        ...Shadows.sm,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  emoji: {
    fontSize: 20,
  },
  bubble: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    ...Platform.select({
      ios: {
        ...Shadows.md,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  alaraBubble: {
    borderTopLeftRadius: BorderRadius.sm,
  },
  userBubble: {
    borderTopRightRadius: BorderRadius.sm,
  },
  message: {
    lineHeight: 22,
  },
});
