import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useALARA } from '../../context/ALARAContext';
import { ChatBubble } from '../checkin/ChatBubble';
import {
  Colors,
  Gradients,
  Spacing,
  BorderRadius,
  Shadows,
  Animation as AnimationTokens,
} from '../../lib/design/tokens';
import { Typography } from '../ui/Typography';
import { createFadeIn } from '../../lib/animations/utils';

export interface ChatMessage {
  id: string;
  text: string;
  isALARA: boolean;
  timestamp: Date;
  emoji?: string;
}

// Re-export for use in context
export type { ChatMessage };

interface ALARAChatScreenProps {
  onClose?: () => void;
}

export function ALARAChatScreen({ onClose }: ALARAChatScreenProps) {
  const { state, setState, chatHistory, sendMessage, isTyping } = useALARA();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const [inputText, setInputText] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    createFadeIn(fadeAnim).start();
  }, [fadeAnim]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatHistory.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [chatHistory.length, isTyping]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isALARA: false,
      timestamp: new Date(),
    };

    setInputText('');
    await sendMessage(userMessage.text);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={insets.top}
    >
      <LinearGradient
        colors={[Gradients.background.start, Gradients.background.end]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            paddingTop: insets.top + Spacing.md,
            paddingBottom: insets.bottom + Spacing.md,
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.alaraHeader}>
              <View style={styles.alaraAvatar}>
                <Typography variant="h2">🤖</Typography>
              </View>
              <View style={styles.headerText}>
                <Typography variant="h2" color="text" weight="bold">
                  ALARA
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {state === 'thinking' ? 'Typing...' : 'Online'}
                </Typography>
              </View>
            </View>
            {onClose && (
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Typography variant="h3" color="textSecondary">
                  ✕
                </Typography>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Chat Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {chatHistory.length === 0 && (
            <View style={styles.emptyState}>
              <Typography variant="h3" color="text" weight="semibold" style={styles.emptyTitle}>
                👋 Hi! I'm ALARA
              </Typography>
              <Typography variant="body" color="textSecondary" style={styles.emptyDescription}>
                Your health companion. Ask me anything about your health, medications, or how you're feeling!
              </Typography>
            </View>
          )}

          {chatHistory.map((message, index) => (
            <ChatBubble
              key={message.id}
              message={message.text}
              isALARA={message.isALARA}
              emoji={message.emoji}
              delay={index * 50}
            />
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <View style={styles.typingContainer}>
              <TypingIndicator />
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor={Colors.textSecondary}
              multiline
              maxLength={500}
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={!inputText.trim() || isTyping}
              style={[
                styles.sendButton,
                (!inputText.trim() || isTyping) && styles.sendButtonDisabled,
              ]}
            >
              <Typography
                variant="h3"
                color={!inputText.trim() || isTyping ? 'textDisabled' : 'text'}
              >
                ➤
              </Typography>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

// Typing Indicator Component
function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animate = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const anim1 = animate(dot1, 0);
    const anim2 = animate(dot2, 200);
    const anim3 = animate(dot3, 400);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.typingBubble}>
      <Animated.View style={[styles.typingDot, { opacity: dot1 }]} />
      <Animated.View style={[styles.typingDot, { opacity: dot2 }]} />
      <Animated.View style={[styles.typingDot, { opacity: dot3 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '40',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alaraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  alaraAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  headerText: {
    flex: 1,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    textAlign: 'center',
    lineHeight: 22,
  },
  typingContainer: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    alignSelf: 'flex-start',
    ...Platform.select({
      ios: {
        ...Shadows.sm,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textSecondary,
    marginHorizontal: 3,
  },
  inputContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border + '40',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Platform.select({
      ios: {
        ...Shadows.sm,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    maxHeight: 100,
    paddingVertical: Spacing.xs,
  },
  sendButton: {
    padding: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  sendButtonDisabled: {
    opacity: 0.3,
  },
});
