import { Stack, usePathname } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Colors } from '../../src/lib/utils/constants';

export default function AuthLayout() {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Allow onboarding to be accessible even when authenticated
  // Only redirect to tabs if user is authenticated and not on onboarding or signup
  // (signup screen needs to be able to navigate to onboarding)
  if (user && pathname && !pathname.includes('onboarding') && !pathname.includes('signup')) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="login" />
      <Stack.Screen name="email-confirmation" />
      <Stack.Screen name="onboarding" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});

