import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Gradients,
  Spacing,
  BorderRadius,
  Shadows,
  Animation,
} from '../../lib/design/tokens';
import { useColors } from '../../lib/design/useColors';
import { Typography } from '../ui/Typography';

interface ChatBubbleProps {
  message: string;
  isALARA?: boolean;
  emoji?: string;
  delay?: number;
}

export function ChatBubble({ message, isALARA = false, emoji, delay = 0 }: ChatBubbleProps) {
  const colors = useColors();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const tokenRegex =
    /(https?:\/\/[^\s]+|www\.[^\s]+|\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b|\+?\d[\d\s\-]{6,}\d|#[\w-]+)/gi;

  const getTokenType = (value: string) => {
    if (value.startsWith('#')) return 'hashtag';
    if (value.startsWith('http') || value.startsWith('www.')) return 'url';
    if (value.includes('@') && value.includes('.')) return 'email';
    return 'phone';
  };

  const handleTokenPress = (value: string) => {
    const type = getTokenType(value);
    try {
      if (type === 'url') {
        const url = value.startsWith('http') ? value : `https://${value}`;
        Linking.openURL(url);
        return;
      }

      if (type === 'email') {
        Linking.openURL(`mailto:${value}`);
        return;
      }

      if (type === 'phone') {
        const digits = value.replace(/[^\d+]/g, '');
        if (digits.length >= 7) {
          Linking.openURL(`tel:${digits}`);
        }
        return;
      }

      if (type === 'hashtag') {
        Linking.openURL(`https://www.google.com/search?q=${encodeURIComponent(value)}`);
      }
    } catch (error) {
      console.warn('[ChatBubble] Failed to handle token press', error);
    }
  };

  const renderMessageContent = (text: string) => {
    const parts: { type: 'text' | 'token'; value: string }[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = tokenRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
      }
      parts.push({ type: 'token', value: match[0] });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push({ type: 'text', value: text.slice(lastIndex) });
    }

    return parts.map((part, index) => {
      if (part.type === 'text') {
        return (
          <Text key={`txt-${index}`} selectable>
            {part.value}
          </Text>
        );
      }

      return (
        <Text
          key={`tok-${index}`}
          style={[styles.interactiveText, { color: colors.primary }]}
          onPress={() => handleTokenPress(part.value)}
          selectable
          suppressHighlighting
        >
          {part.value}
        </Text>
      );
    });
  };

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
      // ALARA messages use primary gradient (same in both themes)
      return [Gradients.primary.start, Gradients.primary.end];
    }
    // User messages use theme-aware surface colors
    // In dark mode, use a slightly lighter surface for contrast
    const userBubbleStart = colors.surface;
    const userBubbleEnd = colors.surfaceElevated || colors.surface;
    return [userBubbleStart, userBubbleEnd];
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
        <View style={[styles.emojiContainer, { backgroundColor: colors.surface }]}>
          <Text style={styles.emoji}>{emoji}</Text>
        </View>
      )}
      
      {isALARA ? (
        <LinearGradient
          colors={getGradient()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.bubble, styles.alaraBubble]}
        >
          <Typography
            variant="body"
            color="text"
            weight="medium"
            style={styles.message}
            selectable
          >
            {renderMessageContent(message)}
          </Typography>
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.bubble,
            styles.userBubble,
            { backgroundColor: colors.surfaceElevated || colors.surface },
          ]}
        >
          <Typography
            variant="body"
            color="text"
            weight="regular"
            style={styles.message}
            selectable
          >
            {renderMessageContent(message)}
          </Typography>
        </View>
      )}

      {!isALARA && emoji && (
        <View style={[styles.emojiContainer, { backgroundColor: colors.surface }]}>
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
  interactiveText: {
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
});
