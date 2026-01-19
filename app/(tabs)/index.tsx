import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from '../../src/components/ui/SafeAreaView';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Typography } from '../../src/components/ui/Typography';
import { ActivityCard } from '../../src/components/activity/ActivityCard';
import { useRouter } from 'expo-router';
import { Spacing } from '../../src/lib/design/tokens';
import { useColors } from '../../src/lib/design/useColors';

export default function DashboardScreen() {
  const router = useRouter();
  const colors = useColors();

  return (
    <SafeAreaView>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Typography variant="h1" color="text" weight="bold" style={styles.title}>
          Dashboard
        </Typography>

        <Card variant="calm">
          <Typography variant="h3" color="text" weight="semibold" style={styles.cardTitle}>
            Daily Check-In
          </Typography>
          <Typography variant="body" color="textSecondary" style={styles.cardSubtitle}>
            How are you feeling today?
          </Typography>
          <Button
            title="Check In with ALARA 💬"
            onPress={() => router.push('/(tabs)/check-in')}
            style={styles.cardButton}
          />
        </Card>

        <Card>
          <Typography variant="h3" color="text" weight="semibold" style={styles.cardTitle}>
            Quick Actions
          </Typography>
          <Button
            title="Emergency"
            onPress={() => router.push('/(tabs)/emergency')}
            variant="emergency"
            style={styles.quickActionButton}
          />
          <Button
            title="Medications 💊"
            onPress={() => router.push('/(tabs)/medications')}
            variant="primary"
            style={styles.quickActionButton}
          />
          <Button
            title="Hydration 💧"
            onPress={() => router.push('/(tabs)/hydration')}
            variant="primary"
            style={styles.quickActionButton}
          />
        </Card>

        {/* Activity Tracking Card */}
        <ActivityCard />

        <Card>
          <Typography variant="h3" color="text" weight="semibold" style={styles.cardTitle}>
            History & Activity
          </Typography>
          <Button
            title="View History 📊"
            onPress={() => router.push('/(tabs)/history')}
            variant="outline"
            style={styles.quickActionButton}
          />
          <Typography variant="bodySmall" color="textLight" style={styles.emptyText}>
            No recent activity
          </Typography>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    marginBottom: Spacing.md,
  },
  cardButton: {
    marginTop: Spacing.sm,
  },
  quickActionButton: {
    marginTop: Spacing.sm,
  },
  emptyText: {
    marginTop: Spacing.sm,
    fontStyle: 'italic',
  },
});



