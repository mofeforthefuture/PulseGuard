import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChatBubble } from './ChatBubble';
import { EmojiReactionButton } from './EmojiReactionButton';
import { useALARA } from '../../context/ALARAContext';
import {
  Colors,
  Gradients,
  Spacing,
  BorderRadius,
  Shadows,
  Animation,
} from '../../lib/design/tokens';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { MoodType, Symptom } from '../../types/health';

interface CheckInStep {
  id: string;
  type: 'question' | 'emoji' | 'text' | 'completion';
  question: string;
  emoji?: string;
  options?: Array<{ emoji: string; label: string; value: any }>;
  field?: keyof CheckInData;
}

export interface CheckInData {
  mood?: MoodType;
  symptoms?: Symptom[];
  medication_taken?: boolean;
  notes?: string;
}

interface ALARACheckInScreenProps {
  onComplete: (data: CheckInData) => void;
  onCancel?: () => void;
}

const CHECK_IN_STEPS: CheckInStep[] = [
  {
    id: 'greeting',
    type: 'question',
    question: "Hi! 👋 How are you feeling today?",
    emoji: '😊',
  },
  {
    id: 'mood',
    type: 'emoji',
    question: "Let's start with your mood. How would you describe how you're feeling?",
    emoji: '💭',
    options: [
      { emoji: '😄', label: 'Great', value: 'great' },
      { emoji: '🙂', label: 'Good', value: 'good' },
      { emoji: '😐', label: 'Okay', value: 'okay' },
      { emoji: '😔', label: 'Poor', value: 'poor' },
      { emoji: '😰', label: 'Crisis', value: 'crisis' },
    ],
    field: 'mood',
  },
  {
    id: 'medication',
    type: 'question',
    question: "Have you taken your medications today? 💊",
    emoji: '💊',
    options: [
      { emoji: '✅', label: 'Yes', value: true },
      { emoji: '❌', label: 'No', value: false },
    ],
    field: 'medication_taken',
  },
  {
    id: 'symptoms',
    type: 'question',
    question: "Any symptoms you'd like to note? You can skip this if you're feeling fine! 😊",
    emoji: '🤔',
    options: [
      { emoji: '✅', label: 'Skip', value: null },
    ],
  },
  {
    id: 'notes',
    type: 'text',
    question: "Anything else you'd like to share? (Optional)",
    emoji: '📝',
    field: 'notes',
  },
  {
    id: 'completion',
    type: 'completion',
    question: "All done! 🎉 Thanks for checking in!",
    emoji: '✨',
  },
];

export function ALARACheckInScreen({ onComplete, onCancel }: ALARACheckInScreenProps) {
  const { setState, showMessage } = useALARA();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [checkInData, setCheckInData] = useState<CheckInData>({});
  const [messages, setMessages] = useState<Array<{ id: string; text: string; isALARA: boolean; emoji?: string }>>([]);
  const [notes, setNotes] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Set ALARA to calm/thinking state
  useEffect(() => {
    setState('calm');
  }, [setState]);

  // Initialize with greeting
  useEffect(() => {
    const greeting = CHECK_IN_STEPS[0];
    setMessages([{ id: 'greeting', text: greeting.question, isALARA: true, emoji: greeting.emoji }]);
    
    // Auto-advance to mood question after delay
    setTimeout(() => {
      setCurrentStepIndex(1);
    }, 1500);
  }, []);

  // Add new ALARA message when step changes
  useEffect(() => {
    if (currentStepIndex > 0 && currentStepIndex < CHECK_IN_STEPS.length) {
      const step = CHECK_IN_STEPS[currentStepIndex];
      if (step.type === 'question' || step.type === 'emoji' || step.type === 'text') {
        const newMessage = {
          id: `step-${currentStepIndex}`,
          text: step.question,
          isALARA: true,
          emoji: step.emoji,
        };
        
        setTimeout(() => {
          setMessages((prev) => [...prev, newMessage]);
          // Scroll to bottom
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }, 500);
      }
    }
  }, [currentStepIndex]);

  const handleEmojiSelect = (value: any, step: CheckInStep) => {
    // Add user response message
    const selectedOption = step.options?.find((opt) => opt.value === value);
    if (selectedOption) {
      setMessages((prev) => [
        ...prev,
        {
          id: `response-${Date.now()}`,
          text: selectedOption.label,
          isALARA: false,
          emoji: selectedOption.emoji,
        },
      ]);
    }

    // Update data (skip if value is null)
    if (step.field && value !== null) {
      setCheckInData((prev) => ({
        ...prev,
        [step.field!]: value,
      }));
    }

    // Advance to next step
    setTimeout(() => {
      if (currentStepIndex < CHECK_IN_STEPS.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
        scrollViewRef.current?.scrollToEnd({ animated: true });
      } else {
        handleComplete();
      }
    }, 800);
  };

  const handleNotesSubmit = () => {
    if (notes.trim()) {
      setCheckInData((prev) => ({ ...prev, notes: notes.trim() }));
      setMessages((prev) => [
        ...prev,
        {
          id: `notes-${Date.now()}`,
          text: notes.trim(),
          isALARA: false,
        },
      ]);
    }

    setTimeout(() => {
      setCurrentStepIndex(currentStepIndex + 1);
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 500);
  };

  const handleComplete = () => {
    setIsComplete(true);
    setShowCelebration(true);
    
    // Show completion message
    const completionStep = CHECK_IN_STEPS[CHECK_IN_STEPS.length - 1];
    setMessages((prev) => [
      ...prev,
      {
        id: 'completion',
        text: completionStep.question,
        isALARA: true,
        emoji: completionStep.emoji,
      },
    ]);

    // Save check-in after celebration
    setTimeout(() => {
      onComplete(checkInData);
    }, 2000);
  };

  const currentStep = CHECK_IN_STEPS[currentStepIndex];
  const progress = ((currentStepIndex + 1) / CHECK_IN_STEPS.length) * 100;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={[Gradients.background.start, Gradients.background.end]}
        style={StyleSheet.absoluteFill}
      />

      {/* Progress Bar */}
      <View style={[styles.progressContainer, { paddingTop: insets.top + Spacing.md }]}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Typography variant="caption" color="textSecondary" style={styles.progressText}>
          {currentStepIndex + 1} of {CHECK_IN_STEPS.length}
        </Typography>
      </View>

      {/* Chat Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message, index) => (
          <ChatBubble
            key={message.id}
            message={message.text}
            isALARA={message.isALARA}
            emoji={message.emoji}
            delay={index * 100}
          />
        ))}

        {/* Celebration Animation */}
        {showCelebration && (
          <CelebrationAnimation />
        )}
      </ScrollView>

      {/* Input Area */}
      {!isComplete && (
        <View style={[styles.inputArea, { paddingBottom: insets.bottom + Spacing.md }]}>
          {currentStep.type === 'emoji' && currentStep.options && (
            <View style={styles.emojiContainer}>
              {currentStep.options.map((option, index) => (
                <EmojiReactionButton
                  key={option.value}
                  emoji={option.emoji}
                  label={option.label}
                  onPress={() => handleEmojiSelect(option.value, currentStep)}
                  isSelected={checkInData[currentStep.field as keyof CheckInData] === option.value}
                  delay={index * 100}
                />
              ))}
            </View>
          )}

          {currentStep.type === 'question' && currentStep.options && (
            <View style={styles.optionsContainer}>
              {currentStep.options.map((option, index) => (
                <EmojiReactionButton
                  key={option.value}
                  emoji={option.emoji}
                  label={option.label}
                  onPress={() => handleEmojiSelect(option.value, currentStep)}
                  isSelected={checkInData[currentStep.field as keyof CheckInData] === option.value}
                  delay={index * 100}
                />
              ))}
            </View>
          )}

          {currentStep.type === 'text' && (
            <View style={styles.textInputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Type your notes here..."
                placeholderTextColor={Colors.textLight}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
              <Button
                title="Continue →"
                onPress={handleNotesSubmit}
                variant="primary"
                disabled={!notes.trim()}
                style={styles.submitButton}
              />
            </View>
          )}
        </View>
      )}

      {/* Cancel Button */}
      {onCancel && !isComplete && (
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <Typography variant="bodySmall" color="textSecondary">
            Cancel
          </Typography>
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
  );
}

// Celebration Animation Component
function CelebrationAnimation() {
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        ...Animation.spring,
      }),
      Animated.timing(confettiAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, confettiAnim]);

  const emojis = ['🎉', '✨', '🌟', '💫', '🎊'];

  return (
    <Animated.View
      style={[
        styles.celebrationContainer,
        {
          opacity: confettiAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {emojis.map((emoji, index) => {
        const rotate = confettiAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${360 * (index + 1)}deg`],
        });
        const translateY = confettiAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -80 - index * 15],
        });
        const translateX = confettiAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, (index % 2 === 0 ? 1 : -1) * (30 + index * 10)],
        });

        return (
          <Animated.Text
            key={index}
            style={[
              styles.confetti,
              {
                transform: [
                  { rotate },
                  { translateY },
                  { translateX },
                ],
              },
            ]}
          >
            {emoji}
          </Animated.Text>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface + '80',
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  progressText: {
    textAlign: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  inputArea: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface + 'CC',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  emojiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  textInputContainer: {
    gap: Spacing.md,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    fontSize: 16,
    color: Colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  submitButton: {
    marginTop: Spacing.sm,
  },
  cancelButton: {
    padding: Spacing.md,
    alignItems: 'center',
  },
  celebrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    marginTop: Spacing.lg,
  },
  confetti: {
    fontSize: 32,
    position: 'absolute',
  },
});
