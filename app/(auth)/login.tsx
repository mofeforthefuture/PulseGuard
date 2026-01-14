import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from '../../src/components/ui/SafeAreaView';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { ALARAMascot } from '../../src/components/auth/ALARAMascot';
import { useAuth } from '../../src/context/AuthContext';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../src/lib/utils/constants';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0); // 0 = email, 1 = password
  const { signIn } = useAuth();
  const router = useRouter();

  // Animation values for ALARA flying away
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const translateXAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Animate ALARA flying away when typing password
  const flyAway = useCallback(() => {
    Animated.parallel([
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(translateXAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [rotateAnim, translateXAnim, translateYAnim, opacityAnim]);

  // Animate ALARA coming back when typing stops
  const comeBack = useCallback(() => {
    Animated.parallel([
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(translateXAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [rotateAnim, translateXAnim, translateYAnim, opacityAnim]);

  // Handle password input changes
  useEffect(() => {
    if (step === 1 && password.length > 0) {
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Fly away immediately when typing starts
      if (password.length === 1) {
        flyAway();
      }

      // Come back when user stops typing (after 1 second of no input)
      typingTimeoutRef.current = setTimeout(() => {
        comeBack();
      }, 1000);
    } else if (step === 1 && password.length === 0) {
      // Come back if password is cleared
      comeBack();
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [password, step, flyAway, comeBack]);

  // Reset animation when step changes
  useEffect(() => {
    if (step === 0) {
      // Reset to original position when on email step
      rotateAnim.setValue(0);
      translateXAnim.setValue(0);
      translateYAnim.setValue(0);
      opacityAnim.setValue(1);
    }
  }, [step]);

  const handleNext = () => {
    if (step === 0) {
      if (!email || !email.includes('@')) {
        setError('Please enter a valid email address');
        return;
      }
      setError('');
      setStep(1);
    } else {
      handleLogin();
    }
  };

  const handleLogin = async () => {
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Oops! That didn\'t work. Let\'s try again.');
      setLoading(false);
    }
  };

  const conversation = step === 0
    ? {
        greeting: "Welcome back! 👋",
        message: "What's your email address?",
        button: "Continue",
      }
    : {
        greeting: "Great! ✨",
        message: "Now enter your password to continue.",
        button: "Sign In",
      };

  return (
    <SafeAreaView>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* ALARA Mascot with animation */}
            <View style={styles.alaraContainer}>
              <Animated.View
                style={{
                  transform: [
                    {
                      rotate: rotateAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '90deg'],
                      }),
                    },
                    {
                      translateX: translateXAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 300], // Fly to the right
                      }),
                    },
                    {
                      translateY: translateYAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -200], // Fly upward
                      }),
                    },
                  ],
                  opacity: opacityAnim,
                }}
              >
                <ALARAMascot size={140} />
              </Animated.View>
            </View>

            {/* Conversation Bubble */}
            <View style={styles.bubbleContainer}>
              <View style={styles.bubble}>
                <Text style={styles.greeting}>{conversation.greeting}</Text>
                <Text style={styles.message}>{conversation.message}</Text>
              </View>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {step === 0 ? (
                <Input
                  label=""
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setError('');
                  }}
                  placeholder="your@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  style={styles.input}
                />
              ) : (
                <Input
                  label=""
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setError('');
                  }}
                  placeholder="Enter your password"
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password"
                  style={styles.input}
                />
              )}

              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.error}>{error}</Text>
                </View>
              ) : null}

              <Button
                title={conversation.button}
                onPress={handleNext}
                loading={loading && step === 1}
                style={styles.button}
              />

              {step === 1 && (
                <TouchableOpacity
                  onPress={() => setStep(0)}
                  style={styles.backLink}
                >
                  <Text style={styles.backText}>← Back to email</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              onPress={() => router.push('/(auth)/signup')}
              style={styles.signUpLink}
            >
              <Text style={styles.signUpText}>
                Don't have an account? <Text style={styles.signUpLinkText}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  form: {
    width: '100%',
    marginBottom: Spacing.lg,
  },
  input: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  errorContainer: {
    marginBottom: Spacing.sm,
  },
  error: {
    color: Colors.error,
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },
  button: {
    marginTop: Spacing.sm,
  },
  backLink: {
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  backText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  signUpLink: {
    marginTop: 'auto',
    paddingVertical: Spacing.md,
  },
  signUpText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  signUpLinkText: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
