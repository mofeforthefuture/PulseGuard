import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { Spacing, BorderRadius } from '../../lib/design/tokens';
import { useColors } from '../../lib/design/useColors';
import type { MedicationDose } from '../../types/medication';

interface DoseTimelineProps {
  doses: MedicationDose[];
}

function formatTime(timeString: string): string {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

function getStatusColor(status: MedicationDose['status']): string {
  switch (status) {
    case 'taken':
      return '#4CAF50'; // Green
    case 'missed':
      return '#F44336'; // Red
    case 'upcoming':
      return '#FF9800'; // Orange
    case 'pending':
      return '#9E9E9E'; // Gray
    default:
      return '#9E9E9E';
  }
}

function getStatusEmoji(status: MedicationDose['status']): string {
  switch (status) {
    case 'taken':
      return '✅';
    case 'missed':
      return '❌';
    case 'upcoming':
      return '⏰';
    case 'pending':
      return '⏳';
    default:
      return '⏳';
  }
}

export function DoseTimeline({ doses }: DoseTimelineProps) {
  const colors = useColors();

  if (doses.length === 0) {
    return null;
  }

  // Sort doses by scheduled time
  const sortedDoses = [...doses].sort((a, b) => {
    const timeA = a.scheduledTime || '';
    const timeB = b.scheduledTime || '';
    return timeA.localeCompare(timeB);
  });

  return (
    <Card variant="calm">
      <Typography variant="h3" color="text" weight="semibold" style={styles.title}>
        Today's Timeline
      </Typography>
      <View style={styles.timeline}>
        {sortedDoses.map((dose, index) => (
          <View key={dose.id} style={styles.timelineItem}>
            <View style={styles.timelineContent}>
              {/* Timeline dot and line */}
              <View style={styles.timelineIndicator}>
                <View
                  style={[
                    styles.timelineDot,
                    { backgroundColor: getStatusColor(dose.status) },
                  ]}
                />
                {index < sortedDoses.length - 1 && (
                  <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />
                )}
              </View>

              {/* Dose content */}
              <View style={styles.doseContent}>
                <View style={styles.doseHeader}>
                  <View style={styles.doseInfo}>
                    <Typography variant="h3" style={styles.doseEmoji}>
                      {getStatusEmoji(dose.status)}
                    </Typography>
                    <View style={styles.doseText}>
                      <Typography variant="body" color="text" weight="semibold">
                        {dose.medicationName}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {dose.dosage} • {formatTime(dose.scheduledTime)}
                      </Typography>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(dose.status) + '20' },
                    ]}
                  >
                    <Typography
                      variant="caption"
                      style={{ color: getStatusColor(dose.status) }}
                      weight="medium"
                    >
                      {dose.status.charAt(0).toUpperCase() + dose.status.slice(1)}
                    </Typography>
                  </View>
                </View>

                {dose.takenAt && (
                  <Typography variant="bodySmall" color="textSecondary" style={styles.takenAt}>
                    Taken at {new Date(dose.takenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                )}
              </View>
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
  timeline: {
    marginTop: Spacing.sm,
  },
  timelineItem: {
    marginBottom: Spacing.md,
  },
  timelineContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineIndicator: {
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    zIndex: 1,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 40,
    marginTop: Spacing.xs,
  },
  doseContent: {
    flex: 1,
    paddingBottom: Spacing.md,
  },
  doseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  doseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  doseEmoji: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  doseText: {
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.full,
  },
  takenAt: {
    marginTop: Spacing.xs,
  },
});
