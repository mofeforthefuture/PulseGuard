import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { Spacing, BorderRadius } from '../../lib/design/tokens';
import { useColors } from '../../lib/design/useColors';
import { getClinicalDateStatus, getDaysUntilClinicalDate } from '../../lib/services/clinicalDateService';
import type { ClinicalDate } from '../../types/care';

interface ClinicalDatesTimelineProps {
  clinicalDates: ClinicalDate[];
  onComplete?: (clinicalDateId: string) => void;
  onEdit?: (clinicalDate: ClinicalDate) => void;
  onDelete?: (clinicalDateId: string) => void;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

function getTypeLabel(type?: string): string {
  if (!type) return '';
  const labels: Record<string, string> = {
    lab_test: '🧪 Lab Test',
    scan: '📷 Scan',
    procedure: '⚕️ Procedure',
    follow_up: '🔄 Follow-up',
    screening: '🔍 Screening',
    other: '📋 Other',
  };
  return labels[type] || '';
}

function getStatusColor(status: string, colors: any): string {
  switch (status) {
    case 'today':
      return colors.reminder;
    case 'overdue':
      return colors.concern;
    case 'upcoming':
      return colors.calm;
    default:
      return colors.textLight;
  }
}

export function ClinicalDatesTimeline({
  clinicalDates,
  onComplete,
  onEdit,
  onDelete,
}: ClinicalDatesTimelineProps) {
  const colors = useColors();

  if (clinicalDates.length === 0) {
    return (
      <Card variant="calm">
        <Typography variant="h3" color="text" weight="semibold" style={styles.title}>
          Clinical Dates
        </Typography>
        <Typography variant="bodySmall" color="textLight" style={styles.emptyText}>
          No upcoming clinical dates
        </Typography>
      </Card>
    );
  }

  // Sort by date (upcoming first)
  const sortedDates = [...clinicalDates].sort((a, b) => {
    const dateA = new Date(a.clinical_date).getTime();
    const dateB = new Date(b.clinical_date).getTime();
    return dateA - dateB;
  });

  return (
    <Card variant="calm">
      <Typography variant="h3" color="text" weight="semibold" style={styles.title}>
        Upcoming Clinical Dates
      </Typography>

      {sortedDates.map((clinicalDate, index) => {
        const status = getClinicalDateStatus(clinicalDate);
        const statusColor = getStatusColor(status.status, colors);
        const daysUntil = getDaysUntilClinicalDate(clinicalDate.clinical_date);

        return (
          <View
            key={clinicalDate.id}
            style={[
              styles.timelineItem,
              {
                backgroundColor: colors.surface,
                borderColor: status.status === 'today' ? colors.reminder : status.status === 'overdue' ? colors.concern : colors.border,
                borderLeftWidth: status.status === 'today' ? 4 : status.status === 'overdue' ? 3 : 1,
              },
            ]}
          >
            {/* Timeline connector */}
            {index < sortedDates.length - 1 && (
              <View style={[styles.timelineConnector, { backgroundColor: colors.border }]} />
            )}

            <View style={styles.itemContent}>
              <View style={styles.itemHeader}>
                <View style={styles.itemMain}>
                  <View style={styles.itemTitleRow}>
                    <Typography variant="body" color="text" weight="semibold">
                      {clinicalDate.description}
                    </Typography>
                    {clinicalDate.clinical_type && (
                      <Typography variant="caption" color="textSecondary" style={styles.typeLabel}>
                        {getTypeLabel(clinicalDate.clinical_type)}
                      </Typography>
                    )}
                  </View>
                  <Typography variant="bodySmall" color="textSecondary" style={styles.date}>
                    📅 {formatDate(clinicalDate.clinical_date)}
                  </Typography>
                  {clinicalDate.location && (
                    <Typography variant="bodySmall" color="textSecondary" style={styles.location}>
                      📍 {clinicalDate.location}
                    </Typography>
                  )}
                  {clinicalDate.provider_name && (
                    <Typography variant="bodySmall" color="textSecondary" style={styles.provider}>
                      👤 {clinicalDate.provider_name}
                    </Typography>
                  )}
                </View>

                <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                  <Typography
                    variant="caption"
                    style={[styles.statusText, { color: statusColor }]}
                    weight="semibold"
                  >
                    {status.message}
                  </Typography>
                </View>
              </View>

              {clinicalDate.preparation_notes && (
                <View style={[styles.prepNotes, { backgroundColor: colors.reminder + '15' }]}>
                  <Typography variant="caption" color="textSecondary" style={styles.prepLabel}>
                    Preparation:
                  </Typography>
                  <Typography variant="bodySmall" color="text" style={styles.prepText}>
                    {clinicalDate.preparation_notes}
                  </Typography>
                </View>
              )}

              {clinicalDate.notes && (
                <Typography variant="bodySmall" color="textSecondary" style={styles.notes}>
                  {clinicalDate.notes}
                </Typography>
              )}

              <View style={styles.actions}>
                {onComplete && status.status !== 'completed' && (
                  <Button
                    title="Mark Complete"
                    onPress={() => onComplete(clinicalDate.id)}
                    variant={status.status === 'today' ? 'primary' : 'outline'}
                    style={styles.actionButton}
                  />
                )}
                <View style={styles.actionButtons}>
                  {onEdit && (
                    <TouchableOpacity
                      onPress={() => onEdit(clinicalDate)}
                      style={styles.editButton}
                    >
                      <Typography variant="bodySmall" color="primary" weight="medium">
                        Edit
                      </Typography>
                    </TouchableOpacity>
                  )}
                  {onDelete && (
                    <TouchableOpacity
                      onPress={() => onDelete(clinicalDate.id)}
                      style={styles.deleteButton}
                    >
                      <Typography variant="bodySmall" color="error" weight="medium">
                        Delete
                      </Typography>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
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
  emptyText: {
    marginTop: Spacing.sm,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  timelineItem: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    position: 'relative',
  },
  timelineConnector: {
    position: 'absolute',
    left: Spacing.md + 2,
    top: Spacing.md + 20,
    bottom: -Spacing.sm,
    width: 2,
  },
  itemContent: {
    marginLeft: 0,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  itemMain: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs / 2,
    gap: Spacing.sm,
  },
  typeLabel: {
    fontSize: 11,
  },
  date: {
    marginTop: Spacing.xs / 2,
  },
  location: {
    marginTop: Spacing.xs / 2,
  },
  provider: {
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
  prepNotes: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  prepLabel: {
    marginBottom: Spacing.xs / 2,
    fontWeight: '600',
  },
  prepText: {
    lineHeight: 18,
  },
  notes: {
    marginTop: Spacing.xs,
    fontStyle: 'italic',
    marginBottom: Spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  actionButton: {
    flex: 1,
    marginTop: 0,
  },
  editButton: {
    padding: Spacing.sm,
  },
  deleteButton: {
    padding: Spacing.sm,
  },
});
