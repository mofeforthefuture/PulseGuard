import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing, FontSizes } from '../src/lib/utils/constants';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops! Not Found' }} />
      <View style={styles.container}>
        <Text style={styles.title}>This screen doesn't exist.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  link: {
    marginTop: Spacing.md,
  },
  linkText: {
    fontSize: FontSizes.md,
    color: Colors.primary,
  },
});



