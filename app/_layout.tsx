import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/context/AuthContext';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { ALARAProvider } from '../src/context/ALARAContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FloatingALARA } from '../src/components/alara';

function ThemedApp() {
  const { theme } = useTheme();
  
  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <FloatingALARA />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <ALARAProvider>
            <ThemedApp />
          </ALARAProvider>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}



