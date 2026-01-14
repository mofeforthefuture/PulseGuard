import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from '../../src/components/ui/SafeAreaView';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { ALARAMascot } from '../../src/components/auth/ALARAMascot';
import { supabase } from '../../src/lib/supabase/client';
import { useAuth } from '../../src/context/AuthContext';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../src/lib/utils/constants';

export default function SignupScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0); // 0 = name, 1 = email, 2 = password
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');
  const { signUp } = useAuth();
  const router = useRouter();

  // Navigate to email confirmation after successful signup
  useEffect(() => {
    if (signupSuccess && signupEmail) {
      router.push({
        pathname: '/(auth)/email-confirmation',
        params: { email: signupEmail },
      });
    }
  }, [signupSuccess, signupEmail, router]);

  const handleNext = () => {
    if (step === 0) {
      if (!fullName || fullName.trim().length < 2) {
        setError('Please enter your full name');
        return;
      }
      setError('');
      setStep(1);
    } else if (step === 1) {
      if (!email || !email.includes('@')) {
        setError('Please enter a valid email address');
        return;
      }
      setError('');
      setStep(2);
    } else {
      handleSignup();
    }
  };

  const handleSignup = async () => {
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // First, create the user account
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: undefined,
        },
      });

      if (signUpError) throw signUpError;

      if (!signUpData.user) {
        throw new Error('Account creation failed');
      }

      // If user is immediately authenticated (email confirmation disabled), go to onboarding
      if (signUpData.session) {
        try {
          await signUp(email, password, fullName);
          router.replace('/(auth)/onboarding');
        } catch (err: any) {
          setError(err.message || 'Account created but setup failed. Please try signing in.');
          setLoading(false);
        }
        return;
      }

      // Email confirmation required
      // Supabase automatically sends a confirmation email when signup happens
      // But we can resend it to ensure it's sent with OTP format if configured
      console.log('User created, confirmation email should be sent automatically');
      console.log('Resending verification email to:', email);
      
      // Resend the signup confirmation email
      // This will use the signup email template (which can be configured for OTP)
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: undefined,
        },
      });

      if (resendError) {
        console.error('Resend error:', resendError);
        console.warn('Could not resend verification email. User can request it manually on confirmation screen.');
      } else {
        console.log('Verification email resent successfully');
      }

      // Navigate to email confirmation screen with OTP flow
      setSignupEmail(email);
      setSignupSuccess(true);
      setLoading(false);
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'Oops! Something went wrong. Let\'s try again.');
      setLoading(false);
    }
  };

  const conversations = {
    0: {
      greeting: "Let's get started! 🎉",
      message: "First, what should I call you?",
      button: "Continue",
    },
    1: {
      greeting: `Nice to meet you, ${fullName || 'there'}! 👋`,
      message: "What's your email address?",
      button: "Continue",
    },
    2: {
      greeting: "Almost there! ✨",
      message: "Create a secure password (at least 6 characters).",
      button: "Create Account",
    },
  };

  const conversation = conversations[step as keyof typeof conversations];

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
            {/* ALARA Mascot */}
            <View style={styles.alaraContainer}>
              <ALARAMascot size={140} />
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
              {step === 0 && (
                <Input
                  label=""
                  value={fullName}
                  onChangeText={(text) => {
                    setFullName(text);
                    setError('');
                  }}
                  placeholder="Enter your full name"
                  autoCapitalize="words"
                  autoComplete="name"
                  style={styles.input}
                />
              )}

              {step === 1 && (
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
              )}

              {step === 2 && (
                <Input
                  label=""
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setError('');
                  }}
                  placeholder="Create a password"
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password-new"
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
                loading={loading && step === 2}
                style={styles.button}
              />

              {step > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setStep(step - 1);
                    setError('');
                  }}
                  style={styles.backLink}
                >
                  <Text style={styles.backText}>← Go back</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              onPress={() => router.push('/(auth)/login')}
              style={styles.signInLink}
            >
              <Text style={styles.signInText}>
                Already have an account? <Text style={styles.signInLinkText}>Sign In</Text>
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
  signInLink: {
    marginTop: 'auto',
    paddingVertical: Spacing.md,
  },
  signInText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  signInLinkText: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
