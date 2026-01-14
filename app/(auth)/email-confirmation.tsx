import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from '../../src/components/ui/SafeAreaView';
import { Button } from '../../src/components/ui/Button';
import { ALARAMascot } from '../../src/components/auth/ALARAMascot';
import { supabase } from '../../src/lib/supabase/client';
import { useAuth } from '../../src/context/AuthContext';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../src/lib/utils/constants';

export default function EmailConfirmationScreen() {
  const [email, setEmail] = useState('');
  const [checking, setChecking] = useState(false);
  const { user, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Get email from user
    if (user?.email) {
      setEmail(user.email);
    }

    // Listen for auth state changes (e.g., when user confirms email)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
        // Email confirmed, go to onboarding
        router.replace('/(auth)/onboarding');
      }
    });

    return () => subscription.unsubscribe();
  }, [user, router]);

  const handleCheckConfirmation = async () => {
    setChecking(true);
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      if (session?.user && session.user.email_confirmed_at) {
        // Email is confirmed, go to onboarding
        router.replace('/(auth)/onboarding');
      } else {
        // Still not confirmed
        Alert.alert(
          'Not Confirmed Yet',
          'Please check your email and click the confirmation link. Then come back and tap "I've Confirmed" again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      Alert.alert('Error', 'Email address not found. Please sign up again.');
      return;
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) throw error;

      Alert.alert(
        'Email Sent! 📧',
        'We\'ve sent a new confirmation email. Please check your inbox.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to resend email. Please try again.');
    }
  };

  return (
    <SafeAreaView>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* ALARA Mascot */}
          <View style={styles.alaraContainer}>
            <ALARAMascot size={180} />
          </View>

          {/* Conversation Bubble */}
          <View style={styles.bubbleContainer}>
            <View style={styles.bubble}>
              <Text style={styles.greeting}>Check Your Email! 📧</Text>
              <Text style={styles.message}>
                We've sent a confirmation email to{'\n'}
                <Text style={styles.emailText}>{email || 'your email'}</Text>
              </Text>
              <Text style={styles.instructions}>
                Please click the confirmation link in the email to verify your account. 
                Once confirmed, you can continue setting up your profile.
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              title="I've Confirmed My Email"
              onPress={handleCheckConfirmation}
              loading={checking}
              style={styles.button}
            />

            <TouchableOpacity
              onPress={handleResendEmail}
              style={styles.resendLink}
            >
              <Text style={styles.resendText}>
                Didn't receive the email? <Text style={styles.resendLinkText}>Resend</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={async () => {
                await signOut();
                router.replace('/(auth)/signup');
              }}
              style={styles.signOutLink}
            >
              <Text style={styles.signOutText}>Sign up with a different email</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: Spacing.md,
  },
  emailText: {
    fontWeight: '600',
    color: Colors.primary,
  },
  instructions: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: Spacing.md,
  },
  actions: {
    width: '100%',
    marginTop: 'auto',
  },
  button: {
    marginBottom: Spacing.md,
  },
  resendLink: {
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  resendText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  resendLinkText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  signOutLink: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: FontSizes.sm,
    color: Colors.textLight,
  },
});
