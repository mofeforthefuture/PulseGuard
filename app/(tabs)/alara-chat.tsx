import React from 'react';
import { SafeAreaView } from '../../src/components/ui/SafeAreaView';
import { ALARAChatScreen } from '../../src/components/alara/ALARAChatScreen';
import { useRouter } from 'expo-router';

export default function ALARAChatScreenRoute() {
  const router = useRouter();

  return (
    <SafeAreaView>
      <ALARAChatScreen onClose={() => router.back()} />
    </SafeAreaView>
  );
}
