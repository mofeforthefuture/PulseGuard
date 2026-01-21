import React from 'react';
import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ConversationalCheckInScreen } from '../../src/components/checkin/ConversationalCheckInScreen';
import { Spacing } from '../../src/lib/design/tokens';

export default function CheckInScreen() {
  const router = useRouter();

  const handleComplete = () => {
    // Navigate back to dashboard after completion
    setTimeout(() => {
      router.back();
    }, 500);
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <ConversationalCheckInScreen onComplete={handleComplete} onCancel={handleCancel} />
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
