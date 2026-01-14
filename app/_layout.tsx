import { Stack } from 'expo-router';
import { AuthProvider } from '../src/context/AuthContext';
import { ALARAProvider } from '../src/context/ALARAContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FloatingALARA } from '../src/components/alara';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ALARAProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
          </Stack>
          <FloatingALARA />
        </ALARAProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}



