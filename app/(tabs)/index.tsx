import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from '../../src/components/ui/SafeAreaView';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSizes } from '../../src/lib/utils/constants';

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <SafeAreaView>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Dashboard</Text>

        <Card style={styles.checkInCard}>
          <Text style={styles.cardTitle}>Daily Check-In</Text>
          <Text style={styles.cardSubtitle}>How are you feeling today?</Text>
          <Button
            title="Check In"
            onPress={() => {
              // TODO: Navigate to check-in flow
            }}
            style={styles.cardButton}
          />
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <Button
            title="Emergency"
            onPress={() => router.push('/(tabs)/emergency')}
            variant="emergency"
            style={styles.emergencyButton}
          />
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Recent Activity</Text>
          <Text style={styles.emptyText}>No recent activity</Text>
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
    fontSize: FontSizes.xxxl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  checkInCard: {
    backgroundColor: Colors.calm,
  },
  cardTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  cardButton: {
    marginTop: Spacing.sm,
  },
  emergencyButton: {
    marginTop: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSizes.sm,
    color: Colors.textLight,
    fontStyle: 'italic',
  },
});



