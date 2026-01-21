import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card } from './Card';
import { Button } from './Button';
import { Typography } from './Typography';
import { Spacing } from '../../lib/design/tokens';
import { useColors } from '../../lib/design/useColors';
import { useRouter } from 'expo-router';

interface RecentActivityCardProps {
  activities?: Array<{
    id: string;
    title: string;
    date: string;
    type?: string;
  }>;
}

export function RecentActivityCard({ activities = [] }: RecentActivityCardProps) {
  const colors = useColors();
  const router = useRouter();

  return (
    <Card>
      <View style={styles.header}>
        <Typography variant="h3" color="text" weight="semibold" style={styles.title}>
          Recent Activity
        </Typography>
      </View>

      {activities.length > 0 ? (
        <View style={styles.activityList}>
          {activities.slice(0, 3).map((activity) => (
            <View key={activity.id} style={[styles.activityItem, { borderBottomColor: colors.border }]}>
              <View style={styles.activityContent}>
                <Typography variant="body" color="text" weight="medium">
                  {activity.title}
                </Typography>
                <Typography variant="bodySmall" color="textSecondary">
                  {new Date(activity.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Typography>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Typography variant="bodySmall" color="textLight" style={styles.emptyText}>
          No recent activity
        </Typography>
      )}

      <Button
        title="View History 📊"
        onPress={() => router.push('/(tabs)/history')}
        variant="outline"
        style={styles.viewButton}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.md,
  },
  title: {
    flex: 1,
  },
  activityList: {
    marginBottom: Spacing.md,
  },
  activityItem: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  activityContent: {
    gap: Spacing.xs / 2,
  },
  emptyText: {
    marginBottom: Spacing.md,
    fontStyle: 'italic',
  },
  viewButton: {
    marginTop: Spacing.sm,
  },
});
