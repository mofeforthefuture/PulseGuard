import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { Spacing, BorderRadius } from '../../lib/design/tokens';
import { useColors } from '../../lib/design/useColors';
import type { CheckIn } from '../../types/health';
import type { Symptom } from '../../types/health';

interface CheckInHistoryListProps {
  checkIns: CheckIn[];
}

function formatCheckInDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}

function getMoodEmoji(mood?: string): string {
  switch (mood) {
    case 'great':
      return '😄';
    case 'good':
      return '🙂';
    case 'okay':
      return '😐';
    case 'poor':
      return '😔';
    case 'crisis':
      return '😰';
    default:
      return '😊';
  }
}

function getMoodLabel(mood?: string): string {
  switch (mood) {
    case 'great':
      return 'Great';
    case 'good':
      return 'Good';
    case 'okay':
      return 'Okay';
    case 'poor':
      return 'Poor';
    case 'crisis':
      return 'Crisis';
    default:
      return 'Not specified';
  }
}

function formatSymptoms(symptoms?: Symptom[]): string {
  if (!symptoms || symptoms.length === 0) {
    return 'No symptoms';
  }

  if (symptoms.length === 1) {
    return symptoms[0].name;
  }

  if (symptoms.length <= 3) {
    return symptoms.map((s) => s.name).join(', ');
  }

  return `${symptoms.slice(0, 3).map((s) => s.name).join(', ')} +${symptoms.length - 3} more`;
}

export function CheckInHistoryList({ checkIns }: CheckInHistoryListProps) {
  const colors = useColors();

  if (checkIns.length === 0) {
    return (
      <Card variant="calm">
        <Typography variant="h3" color="text" weight="semibold" style={styles.title}>
          Check-In History
        </Typography>
        <View style={styles.emptyState}>
          <Typography variant="h2" style={styles.emptyEmoji}>
            📝
          </Typography>
          <Typography variant="body" color="textSecondary" style={styles.emptyText}>
            No check-ins yet
          </Typography>
          <Typography variant="bodySmall" color="textLight" style={styles.emptySubtext}>
            Start your daily check-ins to track your mood and symptoms over time
          </Typography>
        </View>
      </Card>
    );
  }

  return (
    <Card variant="calm">
      <Typography variant="h3" color="text" weight="semibold" style={styles.title}>
        Check-In History
      </Typography>
      <View style={styles.list}>
        {checkIns.map((checkIn, index) => (
          <View
            key={checkIn.id}
            style={[
              styles.checkInItem,
              index < checkIns.length - 1 && { borderBottomColor: colors.border + '20' },
            ]}
          >
            <View style={styles.checkInHeader}>
              <View style={styles.dateContainer}>
                <Typography variant="body" color="text" weight="semibold">
                  {formatCheckInDate(checkIn.date)}
                </Typography>
              </View>
              {checkIn.mood && (
                <View style={styles.moodContainer}>
                  <Typography variant="h3" style={styles.moodEmoji}>
                    {getMoodEmoji(checkIn.mood)}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {getMoodLabel(checkIn.mood)}
                  </Typography>
                </View>
              )}
            </View>

            <View style={styles.checkInDetails}>
              {checkIn.symptoms && Array.isArray(checkIn.symptoms) && checkIn.symptoms.length > 0 && (
                <View style={styles.detailRow}>
                  <Typography variant="bodySmall" color="textSecondary">
                    Symptoms: {formatSymptoms(checkIn.symptoms as Symptom[])}
                  </Typography>
                </View>
              )}

              {checkIn.medication_taken !== undefined && (
                <View style={styles.detailRow}>
                  <Typography variant="bodySmall" color="textSecondary">
                    Medication: {checkIn.medication_taken ? '✅ Taken' : '❌ Not taken'}
                  </Typography>
                </View>
              )}

              {checkIn.notes && (
                <View style={[styles.notesContainer, { backgroundColor: colors.surface }]}>
                  <Typography variant="bodySmall" color="text">
                    {checkIn.notes}
                  </Typography>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: Spacing.md,
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
  list: {
    marginTop: Spacing.sm,
  },
  checkInItem: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  checkInHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  dateContainer: {
    flex: 1,
  },
  moodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  moodEmoji: {
    fontSize: 20,
  },
  checkInDetails: {
    marginTop: Spacing.xs,
  },
  detailRow: {
    marginTop: Spacing.xs / 2,
  },
  notesContainer: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
});
