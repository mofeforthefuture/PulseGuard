import { Redirect } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Colors } from '../src/lib/utils/constants';

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // If authenticated, check if email is confirmed
  if (user) {
    // Check if user needs to complete onboarding
    // For now, go to tabs (onboarding check happens in onboarding screen)
    return <Redirect href="/(tabs)" />;
  }

  // If not authenticated, start with signup
  return <Redirect href="/(auth)/signup" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
