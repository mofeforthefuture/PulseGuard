import React, { useState, useEffect, useRef } from 'react';
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
import { ChatBubble } from './ChatBubble';
import { EmojiReactionButton } from './EmojiReactionButton';
import { useALARA } from '../../context/ALARAContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase/client';
import {
  Gradients,
  Spacing,
  BorderRadius,
  Shadows,
  Animation as AnimationTokens,
} from '../../lib/design/tokens';
import { useColors } from '../../lib/design/useColors';
import { Typography } from '../ui/Typography';
import type { MoodType, Symptom } from '../../types/health';

interface ChatMessage {
  id: string;
  text: string;
  isALARA: boolean;
  emoji?: string;
  timestamp: Date;
}

interface CheckInState {
  mood?: MoodType;
  symptoms?: Symptom[];
  medication_taken?: boolean;
  notes?: string;
}

const MOOD_OPTIONS = [
  { emoji: '😄', label: 'Great', value: 'great' as MoodType },
  { emoji: '🙂', label: 'Good', value: 'good' as MoodType },
  { emoji: '😐', label: 'Okay', value: 'okay' as MoodType },
  { emoji: '😔', label: 'Poor', value: 'poor' as MoodType },
  { emoji: '😰', label: 'Crisis', value: 'crisis' as MoodType },
];

const SYMPTOM_OPTIONS = [
  { emoji: '🤒', label: 'Fever', value: 'fever' },
  { emoji: '😷', label: 'Cough', value: 'cough' },
  { emoji: '🤧', label: 'Sneezing', value: 'sneezing' },
  { emoji: '😵', label: 'Dizziness', value: 'dizziness' },
  { emoji: '😴', label: 'Fatigue', value: 'fatigue' },
  { emoji: '🤕', label: 'Headache', value: 'headache' },
  { emoji: '🤢', label: 'Nausea', value: 'nausea' },
  { emoji: '💪', label: 'None', value: 'none' },
];

interface ConversationalCheckInScreenProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export function ConversationalCheckInScreen({
  onComplete,
  onCancel,
}: ConversationalCheckInScreenProps) {
  const { user } = useAuth();
  const { setState } = useALARA();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [checkInState, setCheckInState] = useState<CheckInState>({});
  const [currentQuestion, setCurrentQuestion] = useState<'mood' | 'medication' | 'symptoms' | 'notes' | 'complete' | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showMoodOptions, setShowMoodOptions] = useState(false);
  const [showSymptomOptions, setShowSymptomOptions] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  // Set ALARA to calm state
  useEffect(() => {
    setState('calm');
  }, [setState]);

  // Initialize conversation
  useEffect(() => {
    const greeting: ChatMessage = {
      id: 'greeting',
      text: "Hey! 👋 How are you feeling today?",
      isALARA: true,
      emoji: '👋',
      timestamp: new Date(),
    };
    setMessages([greeting]);
    
    // Show mood question after a short delay
    setTimeout(() => {
      askMoodQuestion();
    }, 1500);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages.length]);

  // Auto-save when data changes
  useEffect(() => {
    if (checkInState.mood || checkInState.medication_taken !== undefined || checkInState.symptoms || checkInState.notes) {
      autoSaveCheckIn();
    }
  }, [checkInState]);

  const addMessage = (text: string, isALARA: boolean, emoji?: string) => {
    const message: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      text,
      isALARA,
      emoji,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, message]);
  };

  const askMoodQuestion = () => {
    setCurrentQuestion('mood');
    addMessage("Let's start with your mood. How would you describe how you're feeling? 💭", true, '💭');
    setTimeout(() => {
      setShowMoodOptions(true);
    }, 500);
  };

  const handleMoodSelect = (mood: MoodType) => {
    setCheckInState((prev) => ({ ...prev, mood }));
    const selectedOption = MOOD_OPTIONS.find((opt) => opt.value === mood);
    if (selectedOption) {
      addMessage(selectedOption.label, false, selectedOption.emoji);
    }
    setShowMoodOptions(false);
    
    // Move to medication question
    setTimeout(() => {
      askMedicationQuestion();
    }, 800);
  };

  const askMedicationQuestion = () => {
    setCurrentQuestion('medication');
    addMessage("Have you taken your medications today? 💊", true, '💊');
  };

  const handleMedicationResponse = (taken: boolean) => {
    setCheckInState((prev) => ({ ...prev, medication_taken: taken }));
    addMessage(taken ? 'Yes ✅' : 'No ❌', false, taken ? '✅' : '❌');
    
    // Move to symptoms question
    setTimeout(() => {
      askSymptomsQuestion();
    }, 800);
  };

  const askSymptomsQuestion = () => {
    setCurrentQuestion('symptoms');
    addMessage("Any symptoms you'd like to note? You can select multiple or skip if you're feeling fine! 😊", true, '🤔');
    setTimeout(() => {
      setShowSymptomOptions(true);
    }, 500);
  };

  const handleSymptomToggle = (symptomValue: string) => {
    if (symptomValue === 'none') {
      setSelectedSymptoms([]);
      setCheckInState((prev) => ({ ...prev, symptoms: [] }));
      addMessage('None - feeling good! 💪', false, '💪');
      setShowSymptomOptions(false);
      setTimeout(() => {
        askNotesQuestion();
      }, 800);
    } else {
      const newSymptoms = selectedSymptoms.includes(symptomValue)
        ? selectedSymptoms.filter((s) => s !== symptomValue)
        : [...selectedSymptoms, symptomValue];
      
      setSelectedSymptoms(newSymptoms);
      
      if (newSymptoms.length > 0) {
        const symptoms: Symptom[] = newSymptoms.map((s) => ({
          name: s,
          severity: 'mild' as const,
        }));
        setCheckInState((prev) => ({ ...prev, symptoms }));
      }
    }
  };

  const handleSymptomsDone = () => {
    if (selectedSymptoms.length > 0) {
      const symptomNames = selectedSymptoms.join(', ');
      addMessage(`Selected: ${symptomNames}`, false);
    }
    setShowSymptomOptions(false);
    setTimeout(() => {
      askNotesQuestion();
    }, 800);
  };

  const askNotesQuestion = () => {
    setCurrentQuestion('notes');
    addMessage("Anything else you'd like to share? (Optional) 📝", true, '📝');
    inputRef.current?.focus();
  };

  const handleNotesSubmit = () => {
    if (inputText.trim()) {
      setCheckInState((prev) => ({ ...prev, notes: inputText.trim() }));
      addMessage(inputText.trim(), false);
      setInputText('');
    }
    
    // Complete check-in
    setTimeout(() => {
      completeCheckIn();
    }, 500);
  };

  const completeCheckIn = () => {
    setCurrentQuestion('complete');
    addMessage("All done! 🎉 Thanks for checking in! Your data has been saved.", true, '✨');
    
    // Final save
    autoSaveCheckIn().then(() => {
      setTimeout(() => {
        onComplete?.();
      }, 2000);
    });
  };

  const autoSaveCheckIn = async () => {
    if (!user?.id || isSaving) return;

    setIsSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // Check if check-in already exists for today
      const { data: existing } = await supabase
        .from('check_ins')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      const checkInData: any = {
        user_id: user.id,
        date: today,
      };

      if (checkInState.mood) checkInData.mood = checkInState.mood;
      if (checkInState.symptoms && checkInState.symptoms.length > 0) {
        checkInData.symptoms = checkInState.symptoms;
      }
      if (checkInState.medication_taken !== undefined) {
        checkInData.medication_taken = checkInState.medication_taken;
      }
      if (checkInState.notes) checkInData.notes = checkInState.notes;

      if (existing) {
        // Update existing check-in
        const { error } = await supabase
          .from('check_ins')
          .update(checkInData)
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new check-in
        const { error } = await supabase.from('check_ins').insert(checkInData);
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error auto-saving check-in:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSend = () => {
    if (!inputText.trim() || currentQuestion !== 'notes') return;
    handleNotesSubmit();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={[Gradients.background.start, Gradients.background.end]}
        style={StyleSheet.absoluteFill}
      />

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
            delay={index * 50}
          />
        ))}

        {/* Mood Options */}
        {showMoodOptions && (
          <View style={styles.optionsContainer}>
            {MOOD_OPTIONS.map((option, index) => (
              <EmojiReactionButton
                key={option.value}
                emoji={option.emoji}
                label={option.label}
                onPress={() => handleMoodSelect(option.value)}
                isSelected={checkInState.mood === option.value}
                delay={index * 100}
              />
            ))}
          </View>
        )}

        {/* Medication Options */}
        {currentQuestion === 'medication' && !showMoodOptions && !showSymptomOptions && (
          <View style={styles.optionsContainer}>
            <EmojiReactionButton
              emoji="✅"
              label="Yes"
              onPress={() => handleMedicationResponse(true)}
              isSelected={checkInState.medication_taken === true}
              delay={0}
            />
            <EmojiReactionButton
              emoji="❌"
              label="No"
              onPress={() => handleMedicationResponse(false)}
              isSelected={checkInState.medication_taken === false}
              delay={100}
            />
          </View>
        )}

        {/* Symptom Options */}
        {showSymptomOptions && (
          <View style={styles.optionsContainer}>
            {SYMPTOM_OPTIONS.map((option, index) => (
              <EmojiReactionButton
                key={option.value}
                emoji={option.emoji}
                label={option.label}
                onPress={() => handleSymptomToggle(option.value)}
                isSelected={selectedSymptoms.includes(option.value)}
                delay={index * 50}
              />
            ))}
            {selectedSymptoms.length > 0 && (
              <View style={styles.doneButtonContainer}>
                <TouchableOpacity
                  onPress={handleSymptomsDone}
                  style={[styles.doneButton, { backgroundColor: colors.primary }]}
                >
                  <Typography variant="body" color="text" weight="semibold" style={{ color: '#FFFFFF' }}>
                    Done
                  </Typography>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Saving Indicator */}
        {isSaving && (
          <View style={styles.savingIndicator}>
            <Typography variant="caption" color="textSecondary">
              Saving...
            </Typography>
          </View>
        )}
      </ScrollView>

      {/* Input Area */}
      {currentQuestion === 'notes' && !showMoodOptions && !showSymptomOptions && (
        <View
          style={[
            styles.inputContainer,
            {
              borderTopColor: colors.border + '20',
              paddingBottom: insets.bottom + Spacing.md,
            },
          ]}
        >
          <View style={[styles.inputWrapper, { backgroundColor: colors.surface }]}>
            <TextInput
              ref={inputRef}
              style={[styles.input, { color: colors.text }]}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type your notes here..."
              placeholderTextColor={colors.textSecondary}
              multiline
              maxLength={500}
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={!inputText.trim()}
              style={[
                styles.sendButton,
                !inputText.trim() && styles.sendButtonDisabled,
              ]}
            >
              <Typography
                variant="h3"
                color={!inputText.trim() ? 'textSecondary' : 'text'}
                style={!inputText.trim() ? { opacity: 0.3 } : undefined}
              >
                ➤
              </Typography>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Cancel Button */}
      {onCancel && currentQuestion !== 'complete' && (
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <Typography variant="bodySmall" color="textSecondary">
            Cancel
          </Typography>
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  doneButtonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  doneButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    ...Platform.select({
      ios: {
        ...Shadows.md,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  inputContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    backgroundColor: 'transparent',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
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
  cancelButton: {
    padding: Spacing.md,
    alignItems: 'center',
  },
  savingIndicator: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
});
