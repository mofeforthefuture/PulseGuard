import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { Spacing, BorderRadius } from '../../lib/design/tokens';
import { useColors } from '../../lib/design/useColors';
import { getDateDescription, formatRecommendation } from '../../lib/services/recommendationParser';
import { getDaysUntilReminder } from '../../lib/services/doctorVisitReminderService';
import type { DoctorVisitReminder } from '../../types/care';

interface DoctorVisitReminderCardProps {
  reminders: DoctorVisitReminder[];
  onComplete?: (reminderId: string) => void;
  onDelete?: (reminderId: string) => void;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

function getStatusColor(daysUntil: number, colors: any): string {
  if (daysUntil < 0) {
    return colors.emergency; // Overdue
  } else if (daysUntil <= 7) {
    return colors.concern; // Due soon
  } else {
    return colors.calm; // Upcoming
  }
}

export function DoctorVisitReminderCard({
  reminders,
  onComplete,
  onDelete,
}: DoctorVisitReminderCardProps) {
  const colors = useColors();

  if (reminders.length === 0) {
    return null;
  }

  // Sort by reminder date (upcoming first)
  const sortedReminders = [...reminders].sort((a, b) => {
    const dateA = new Date(a.reminder_date).getTime();
    const dateB = new Date(b.reminder_date).getTime();
    return dateA - dateB;
  });

  return (
    <Card>
      <Typography variant="h3" color="text" weight="semibold" style={styles.title}>
        Doctor Visit Reminders
      </Typography>

      {sortedReminders.map((reminder) => {
        const daysUntil = getDaysUntilReminder(reminder.reminder_date);
        const statusColor = getStatusColor(daysUntil, colors);
        const isOverdue = daysUntil < 0;
        const isDueSoon = daysUntil <= 7 && daysUntil >= 0;

        return (
          <View
            key={reminder.id}
            style={[
              styles.reminderItem,
              {
                backgroundColor: colors.surface,
                borderColor: isOverdue ? colors.emergency : isDueSoon ? colors.concern : colors.border,
                borderLeftWidth: isOverdue ? 4 : isDueSoon ? 3 : 1,
              },
            ]}
          >
            <View style={styles.reminderHeader}>
              <View style={styles.reminderMain}>
                <Typography variant="body" color="text" weight="semibold">
                  {reminder.doctor_name}
                </Typography>
                <Typography variant="bodySmall" color="textSecondary" style={styles.recommendation}>
                  {formatRecommendation(reminder.recommendation_text)}
                </Typography>
              </View>

              <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                <Typography
                  variant="caption"
                  style={[styles.statusText, { color: statusColor }]}
                  weight="semibold"
                >
                  {getDateDescription(new Date(reminder.reminder_date))}
                </Typography>
              </View>
            </View>

            <View style={styles.reminderDetails}>
              <Typography variant="caption" color="textSecondary">
                Reminder: {formatDate(reminder.reminder_date)}
              </Typography>
              {reminder.visit_date && (
                <Typography variant="caption" color="textSecondary">
                  Visit: {formatDate(reminder.visit_date)}
                </Typography>
              )}
            </View>

            {reminder.notes && (
              <Typography variant="bodySmall" color="textSecondary" style={styles.notes}>
                {reminder.notes}
              </Typography>
            )}

            <View style={styles.actions}>
              {onComplete && (
                <Button
                  title="Mark Complete"
                  onPress={() => onComplete(reminder.id)}
                  variant={isOverdue ? 'emergency' : 'primary'}
                  style={styles.actionButton}
                />
              )}
              {onDelete && (
                <TouchableOpacity
                  onPress={() => onDelete(reminder.id)}
                  style={styles.deleteButton}
                >
                  <Typography variant="bodySmall" color="error">
                    Delete
                  </Typography>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: Spacing.md,
  },
  reminderItem: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  reminderMain: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  recommendation: {
    marginTop: Spacing.xs / 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: 10,
  },
  reminderDetails: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xs,
  },
  notes: {
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    marginTop: 0,
  },
  deleteButton: {
    padding: Spacing.sm,
  },
});
