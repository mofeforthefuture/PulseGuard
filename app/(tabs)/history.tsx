import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from '../../src/components/ui/SafeAreaView';
import { Card } from '../../src/components/ui/Card';
import { Typography } from '../../src/components/ui/Typography';
import { EmergencyEventsTimeline } from '../../src/components/history/EmergencyEventsTimeline';
import { CheckInHistoryList } from '../../src/components/history/CheckInHistoryList';
import { Spacing } from '../../src/lib/design/tokens';
import { useAuth } from '../../src/context/AuthContext';
import { useColors } from '../../src/lib/design/useColors';
import { getEmergencyEvents, getCheckInHistory } from '../../src/lib/services/historyService';
import type { EmergencyEvent } from '../../src/lib/services/historyService';
import type { CheckIn } from '../../src/types/health';

export default function HistoryScreen() {
  const { user } = useAuth();
  const colors = useColors();
  const [emergencyEvents, setEmergencyEvents] = useState<EmergencyEvent[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistoryData();
  }, [user?.id]);

  const loadHistoryData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const [events, checkInData] = await Promise.all([
        getEmergencyEvents(user.id),
        getCheckInHistory(user.id),
      ]);

      setEmergencyEvents(events);
      setCheckIns(checkInData);
    } catch (error) {
      console.error('Error loading history data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Typography variant="body" color="textSecondary" style={styles.loadingText}>
            Loading history...
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Typography variant="h1" color="text" weight="bold" style={styles.title}>
          History
        </Typography>

        {/* Emergency Events Timeline */}
        <EmergencyEventsTimeline events={emergencyEvents} />

        {/* Check-In History */}
        <CheckInHistoryList checkIns={checkIns} />

        {/* Health Trends Placeholder */}
        <Card variant="calm">
          <Typography variant="h3" color="text" weight="semibold" style={styles.cardTitle}>
            Health Trends
          </Typography>
          <View style={styles.emptyState}>
            <Typography variant="h2" style={styles.emptyEmoji}>
              📊
            </Typography>
            <Typography variant="body" color="textSecondary" style={styles.emptyText}>
              Health trends coming soon
            </Typography>
            <Typography variant="bodySmall" color="textLight" style={styles.emptySubtext}>
              Visualizations and insights will be available here in a future update
            </Typography>
          </View>
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
    paddingBottom: Spacing.xxxl,
  },
  title: {
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    marginBottom: Spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyText: {
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  emptySubtext: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
