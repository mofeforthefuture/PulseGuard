import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from '../../src/components/ui/SafeAreaView';
import { ALARACheckInScreen } from '../../src/components/checkin';
import type { CheckInData } from '../../src/components/checkin/ALARACheckInScreen';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/lib/supabase/client';
import { Colors, Spacing } from '../../src/lib/design/tokens';

export default function CheckInScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const handleComplete = async (data: CheckInData) => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to save your check-in.');
      return;
    }

    setSaving(true);

    try {
      const today = new Date().toISOString().split('T')[0];

      // Check if check-in already exists for today
      const { data: existing } = await supabase
        .from('check_ins')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (existing) {
        // Update existing check-in
        const { error } = await supabase
          .from('check_ins')
          .update({
            mood: data.mood,
            symptoms: data.symptoms,
            medication_taken: data.medication_taken ?? false,
            notes: data.notes,
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new check-in
        const { error } = await supabase.from('check_ins').insert({
          user_id: user.id,
          date: today,
          mood: data.mood,
          symptoms: data.symptoms,
          medication_taken: data.medication_taken ?? false,
          notes: data.notes,
        });

        if (error) throw error;
      }

      // Navigate back to dashboard after a short delay
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error: any) {
      console.error('Error saving check-in:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to save your check-in. Please try again.'
      );
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (saving) {
    return (
      <SafeAreaView>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ALARACheckInScreen onComplete={handleComplete} onCancel={handleCancel} />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
});
