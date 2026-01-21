import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { Spacing, BorderRadius } from '../../lib/design/tokens';
import { useColors } from '../../lib/design/useColors';
import type { CareLog } from '../../types/care';

interface HistoryTimelineProps {
  careLogs: CareLog[];
  onLogPress?: (log: CareLog) => void;
}

type LogTypeFilter = 'all' | CareLog['log_type'];

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getLogTypeEmoji(type: string): string {
  const emojis: Record<string, string> = {
    visit: '👨‍⚕️',
    procedure: '⚕️',
    test: '🧪',
    diagnosis: '📋',
    treatment: '💊',
    hospital_stay: '🏥',
    emergency_visit: '🚨',
    therapy_session: '💬',
    other: '📝',
  };
  return emojis[type] || '📝';
}

function getLogTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    visit: 'Visit',
    procedure: 'Procedure',
    test: 'Test',
    diagnosis: 'Diagnosis',
    treatment: 'Treatment',
    hospital_stay: 'Hospital Stay',
    emergency_visit: 'Emergency Visit',
    therapy_session: 'Therapy Session',
    other: 'Other',
  };
  return labels[type] || 'Other';
}

export function HistoryTimeline({ careLogs, onLogPress }: HistoryTimelineProps) {
  const colors = useColors();
  const [filter, setFilter] = useState<LogTypeFilter>('all');

  const filteredLogs = filter === 'all' 
    ? careLogs 
    : careLogs.filter(log => log.log_type === filter);

  // Group logs by date
  const groupedLogs = filteredLogs.reduce((acc, log) => {
    const date = new Date(log.occurred_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(log);
    return acc;
  }, {} as Record<string, CareLog[]>);

  const logTypes: Array<{ value: LogTypeFilter; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'visit', label: 'Visits' },
    { value: 'procedure', label: 'Procedures' },
    { value: 'test', label: 'Tests' },
    { value: 'diagnosis', label: 'Diagnosis' },
    { value: 'treatment', label: 'Treatment' },
    { value: 'hospital_stay', label: 'Hospital' },
    { value: 'emergency_visit', label: 'Emergency' },
    { value: 'therapy_session', label: 'Therapy' },
    { value: 'other', label: 'Other' },
  ];

  if (careLogs.length === 0) {
    return (
      <Card>
        <Typography variant="h3" color="text" weight="semibold" style={styles.title}>
          Medical History
        </Typography>
        <Typography variant="bodySmall" color="textLight" style={styles.emptyText}>
          No medical history recorded yet
        </Typography>
      </Card>
    );
  }

  return (
    <View>
      {/* Filter Buttons */}
      <Card>
        <Typography variant="h3" color="text" weight="semibold" style={styles.title}>
          Medical History
        </Typography>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {logTypes.map((type) => (
            <TouchableOpacity
              key={type.value}
              onPress={() => setFilter(type.value)}
              style={[
                styles.filterButton,
                {
                  backgroundColor: filter === type.value ? colors.primary : colors.surface,
                  borderColor: filter === type.value ? colors.primary : colors.border,
                },
              ]}
            >
              <Typography
                variant="bodySmall"
                color={filter === type.value ? 'text' : 'textSecondary'}
                weight={filter === type.value ? 'semibold' : 'regular'}
                style={{ color: filter === type.value ? '#FFFFFF' : colors.textSecondary }}
              >
                {type.label}
              </Typography>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Card>

      {/* Timeline */}
      {Object.keys(groupedLogs).length === 0 ? (
        <Card>
          <Typography variant="bodySmall" color="textLight" style={styles.emptyText}>
            No logs found for selected filter
          </Typography>
        </Card>
      ) : (
        Object.entries(groupedLogs).map(([date, logs]) => (
          <Card key={date} style={styles.dateGroup}>
            <Typography variant="h4" color="text" weight="semibold" style={styles.dateHeader}>
              {date}
            </Typography>

            {logs.map((log, index) => (
              <TouchableOpacity
                key={log.id}
                onPress={() => onLogPress?.(log)}
                style={[
                  styles.timelineItem,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderLeftColor: colors.primary,
                    borderLeftWidth: 3,
                  },
                  index < logs.length - 1 && styles.timelineItemNotLast,
                ]}
                activeOpacity={0.7}
              >
                <View style={styles.timelineContent}>
                  <View style={styles.timelineHeader}>
                    <View style={styles.timelineLeft}>
                      <Typography variant="h2" style={styles.emoji}>
                        {getLogTypeEmoji(log.log_type)}
                      </Typography>
                    </View>
                    <View style={styles.timelineRight}>
                      <View style={styles.timelineTitleRow}>
                        <Typography variant="body" color="text" weight="semibold">
                          {log.title}
                        </Typography>
                        <View
                          style={[
                            styles.typeBadge,
                            { backgroundColor: colors.primary + '15' },
                          ]}
                        >
                          <Typography
                            variant="caption"
                            style={{ color: colors.primary }}
                            weight="medium"
                          >
                            {getLogTypeLabel(log.log_type)}
                          </Typography>
                        </View>
                      </View>
                      <Typography variant="bodySmall" color="textSecondary" style={styles.time}>
                        {formatTime(log.occurred_at)}
                      </Typography>
                    </View>
                  </View>

                  {log.diagnosis && (
                    <Typography variant="bodySmall" color="text" style={styles.diagnosis}>
                      <Typography variant="bodySmall" color="textSecondary" weight="semibold">
                        Diagnosis:{' '}
                      </Typography>
                      {log.diagnosis}
                    </Typography>
                  )}

                  {log.treatment && (
                    <Typography variant="bodySmall" color="text" style={styles.treatment}>
                      <Typography variant="bodySmall" color="textSecondary" weight="semibold">
                        Treatment:{' '}
                      </Typography>
                      {log.treatment}
                    </Typography>
                  )}

                  {log.location_name && (
                    <Typography variant="bodySmall" color="textSecondary" style={styles.location}>
                      📍 {log.location_name}
                    </Typography>
                  )}

                  {log.notes && (
                    <Typography variant="bodySmall" color="textSecondary" style={styles.notes}>
                      {log.notes}
                    </Typography>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </Card>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: Spacing.md,
  },
  filterContainer: {
    marginTop: Spacing.sm,
  },
  filterContent: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  emptyText: {
    marginTop: Spacing.sm,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  dateGroup: {
    marginBottom: Spacing.md,
  },
  dateHeader: {
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  timelineItem: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
  },
  timelineItemNotLast: {
    marginBottom: Spacing.sm,
  },
  timelineContent: {
    marginLeft: Spacing.sm,
  },
  timelineHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  timelineLeft: {
    marginRight: Spacing.md,
  },
  emoji: {
    fontSize: 24,
  },
  timelineRight: {
    flex: 1,
  },
  timelineTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs / 2,
  },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.sm,
  },
  time: {
    marginTop: Spacing.xs / 2,
  },
  diagnosis: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  treatment: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  location: {
    marginTop: Spacing.xs,
  },
  notes: {
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
});
