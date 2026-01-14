import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { SafeAreaView } from '../../src/components/ui/SafeAreaView';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { ALARAMascot } from '../../src/components/auth/ALARAMascot';
import { supabase } from '../../src/lib/supabase/client';
import { useAuth } from '../../src/context/AuthContext';
import { saveOnboardingData } from '../../src/lib/services/medicalProfile';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../src/lib/utils/constants';
import type { ConditionType } from '../../src/types/health';

const CONDITIONS: { value: ConditionType; label: string; emoji?: string }[] = [
  { value: 'asthma', label: 'Asthma', emoji: '🌬️' },
  { value: 'sickle_cell_disease', label: 'Sickle Cell Disease', emoji: '🩸' },
  { value: 'epilepsy', label: 'Epilepsy', emoji: '⚡' },
  { value: 'diabetes', label: 'Diabetes', emoji: '💉' },
  { value: 'heart_condition', label: 'Heart Condition', emoji: '❤️' },
  { value: 'allergies', label: 'Allergies', emoji: '🤧' },
  { value: 'other', label: 'Other', emoji: '🏥' },
];

const TOTAL_STEPS = 4;

const CONVERSATIONS = {
  0: {
    greeting: "Hi! I'm ALARA 👋",
    message: "I'm here to help you manage your health with calm, reassuring support. Let's get to know each other!",
    button: "Let's start!",
  },
  1: {
    greeting: "Great to meet you!",
    message: "To personalize your experience, which health conditions are you managing? You can select multiple.",
    button: "Continue",
  },
  2: {
    greeting: "Perfect! 🎯",
    message: "Now, who should we contact in case of an emergency? This helps us keep you safe.",
    button: "Save & Continue",
  },
  3: {
    greeting: "Almost done! ✨",
    message: "Just one more thing - what's their phone number?",
    button: "Complete Setup",
  },
};

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [conditions, setConditions] = useState<ConditionType[]>([]);
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  // Check if user is authenticated and email is confirmed
  useEffect(() => {
    const checkAuth = async () => {
      if (!user) {
        setCheckingAuth(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Check if email is confirmed
          if (session.user.email_confirmed_at) {
            setEmailConfirmed(true);
          } else {
            // Email not confirmed, redirect to confirmation screen
            router.replace('/(auth)/email-confirmation');
            return;
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, [user, router]);

  // Show loading while checking auth
  if (checkingAuth) {
    return (
      <SafeAreaView>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // Redirect to signup if not authenticated
  if (!user) {
    return <Redirect href="/(auth)/signup" />;
  }

  // Redirect to email confirmation if email not confirmed
  if (!emailConfirmed) {
    return <Redirect href="/(auth)/email-confirmation" />;
  }

  const toggleCondition = (conditionType: ConditionType) => {
    setConditions((prev) => {
      if (prev.includes(conditionType)) {
        return prev.filter((c) => c !== conditionType);
      } else {
        return [...prev, conditionType];
      }
    });
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    } else {
      handleCompleteSetup();
    }
  };

  const handleCompleteSetup = async () => {
    if (conditions.length === 0 || !emergencyContactName || !emergencyContactPhone) {
      Alert.alert('Almost there!', 'Please fill in all the information so we can keep you safe.');
      return;
    }

    if (!user) {
      Alert.alert(
        'Sign Up Required',
        'Please create an account to continue.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign Up',
            onPress: () => router.push('/(auth)/signup'),
          },
        ]
      );
      return;
    }

    setLoading(true);

    try {
      const { error } = await saveOnboardingData({
        userId: user.id,
        conditionTypes: conditions,
        emergencyContactName,
        emergencyContactPhone,
      });

      if (error) {
        throw error;
      }

      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Oops!', err.message || 'Something went wrong. Let\'s try again.');
    } finally {
      setLoading(false);
    }
  };

  const progress = ((step + 1) / TOTAL_STEPS) * 100;
  const conversation = CONVERSATIONS[step as keyof typeof CONVERSATIONS];

  return (
    <SafeAreaView>
      <View style={styles.container}>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{step + 1} of {TOTAL_STEPS}</Text>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* ALARA Mascot */}
            <View style={styles.alaraContainer}>
              <ALARAMascot size={step === 0 ? 200 : 140} />
            </View>

            {/* Conversation Bubble */}
            <View style={styles.bubbleContainer}>
              <View style={styles.bubble}>
                <Text style={styles.greeting}>{conversation.greeting}</Text>
                <Text style={styles.message}>{conversation.message}</Text>
              </View>
            </View>

            {/* Step Content */}
            {step === 1 && (
              <View style={styles.stepContent}>
                {conditions.length > 0 && (
                  <View style={styles.selectedBadge}>
                    <Text style={styles.selectedBadgeText}>
                      {conditions.length} {conditions.length === 1 ? 'selected' : 'selected'} ✓
                    </Text>
                  </View>
                )}

                <View style={styles.optionsGrid}>
                  {CONDITIONS.map((item) => {
                    const isSelected = conditions.includes(item.value);
                    return (
                      <TouchableOpacity
                        key={item.value}
                        onPress={() => toggleCondition(item.value)}
                        activeOpacity={0.7}
                        style={[
                          styles.optionCard,
                          isSelected && styles.optionCardSelected,
                        ]}
                      >
                        <Text style={styles.optionEmoji}>{item.emoji}</Text>
                        <Text
                          style={[
                            styles.optionText,
                            isSelected && styles.optionTextSelected,
                          ]}
                        >
                          {item.label}
                        </Text>
                        {isSelected && (
                          <View style={styles.checkmarkBadge}>
                            <Text style={styles.checkmarkText}>✓</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {step === 2 && (
              <View style={styles.stepContent}>
                <Input
                  label=""
                  value={emergencyContactName}
                  onChangeText={setEmergencyContactName}
                  placeholder="Enter their name"
                  autoCapitalize="words"
                  style={styles.input}
                />
              </View>
            )}

            {step === 3 && (
              <View style={styles.stepContent}>
                <Input
                  label=""
                  value={emergencyContactPhone}
                  onChangeText={setEmergencyContactPhone}
                  placeholder="Enter their phone number"
                  keyboardType="phone-pad"
                  style={styles.input}
                />
              </View>
            )}

            {/* Button */}
            <Button
              title={conversation.button}
              onPress={handleNext}
              disabled={
                step === 1
                  ? conditions.length === 0
                  : step === 2
                  ? !emergencyContactName
                  : step === 3
                  ? !emergencyContactPhone
                  : false
              }
              loading={loading}
              style={styles.button}
            />

            {step === 0 && (
              <TouchableOpacity
                onPress={() => router.push('/(auth)/login')}
                style={styles.signInLink}
              >
                <Text style={styles.signInText}>Already have an account? Sign In</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  progressContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  progressBar: {
    height: 4,
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
    fontSize: FontSizes.xs,
    color: Colors.textLight,
    textAlign: 'center',
    fontWeight: '500',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  alaraContainer: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleContainer: {
    width: '100%',
    marginBottom: Spacing.xl,
  },
  bubble: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  greeting: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  stepContent: {
    width: '100%',
    marginBottom: Spacing.xl,
  },
  selectedBadge: {
    alignSelf: 'center',
    backgroundColor: Colors.calm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.lg,
  },
  selectedBadgeText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  optionCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    borderWidth: 2,
    borderColor: Colors.border,
    position: 'relative',
    marginBottom: Spacing.md,
  },
  optionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.calm,
    borderWidth: 3,
  },
  optionEmoji: {
    fontSize: 32,
    marginBottom: Spacing.xs,
  },
  optionText: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    fontWeight: '500',
    textAlign: 'center',
  },
  optionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  checkmarkBadge: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: Colors.surface,
    fontSize: FontSizes.sm,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: Colors.surface,
  },
  button: {
    marginTop: 'auto',
    width: '100%',
    marginBottom: Spacing.md,
  },
  signInLink: {
    marginTop: Spacing.md,
  },
  signInText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
