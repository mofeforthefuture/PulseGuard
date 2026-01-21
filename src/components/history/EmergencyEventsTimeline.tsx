import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { Spacing, BorderRadius } from '../../lib/design/tokens';
import { useColors } from '../../lib/design/useColors';
import type { EmergencyEvent } from '../../lib/services/historyService';

interface EmergencyEventsTimelineProps {
  events: EmergencyEvent[];
}

function formatEventDate(dateString: string): string {
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

function formatEventTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getEventTypeLabel(eventType: string): string {
  switch (eventType) {
    case 'panic_button':
      return 'Panic Button';
    case 'detected_pattern':
      return 'Pattern Detected';
    case 'manual':
      return 'Manual Event';
    default:
      return 'Emergency Event';
  }
}

function getEventTypeEmoji(eventType: string): string {
  switch (eventType) {
    case 'panic_button':
      return '🚨';
    case 'detected_pattern':
      return '⚠️';
    case 'manual':
      return '📝';
    default:
      return '🚨';
  }
}

export function EmergencyEventsTimeline({ events }: EmergencyEventsTimelineProps) {
  const colors = useColors();

  if (events.length === 0) {
    return (
      <Card variant="calm">
        <Typography variant="h3" color="text" weight="semibold" style={styles.title}>
          Emergency Events Timeline
        </Typography>
        <View style={styles.emptyState}>
          <Typography variant="h2" style={styles.emptyEmoji}>
            🛡️
          </Typography>
          <Typography variant="body" color="textSecondary" style={styles.emptyText}>
            No emergency events recorded
          </Typography>
          <Typography variant="bodySmall" color="textLight" style={styles.emptySubtext}>
            Emergency events will appear here when they occur
          </Typography>
        </View>
      </Card>
    );
  }

  return (
    <Card variant="calm">
      <Typography variant="h3" color="text" weight="semibold" style={styles.title}>
        Emergency Events Timeline
      </Typography>
      <View style={styles.timeline}>
        {events.map((event, index) => (
          <View key={event.id} style={styles.timelineItem}>
            <View style={styles.timelineContent}>
              {/* Timeline dot and line */}
              <View style={styles.timelineIndicator}>
                <View style={[styles.timelineDot, { backgroundColor: colors.primary }]} />
                {index < events.length - 1 && (
                  <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />
                )}
              </View>

              {/* Event content */}
              <View style={styles.eventContent}>
                <View style={styles.eventHeader}>
                  <View style={styles.eventTypeContainer}>
                    <Typography variant="h3" style={styles.eventEmoji}>
                      {getEventTypeEmoji(event.event_type)}
                    </Typography>
                    <View style={styles.eventTypeText}>
                      <Typography variant="body" color="text" weight="semibold">
                        {getEventTypeLabel(event.event_type)}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {formatEventDate(event.created_at)} at {formatEventTime(event.created_at)}
                      </Typography>
                    </View>
                  </View>
                  {event.resolved_at && (
                    <View style={[styles.resolvedBadge, { backgroundColor: colors.success + '20' }]}>
                      <Typography variant="caption" style={{ color: colors.success }} weight="medium">
                        Resolved
                      </Typography>
                    </View>
                  )}
                </View>

                {event.location?.address && (
                  <Typography variant="bodySmall" color="textSecondary" style={styles.eventDetail}>
                    📍 {event.location.address}
                  </Typography>
                )}

                {event.sms_sent_to && event.sms_sent_to.length > 0 && (
                  <Typography variant="bodySmall" color="textSecondary" style={styles.eventDetail}>
                    📱 Alert sent to {event.sms_sent_to.length} contact{event.sms_sent_to.length > 1 ? 's' : ''}
                  </Typography>
                )}

                {event.ai_analysis && (
                  <View style={[styles.aiAnalysisContainer, { backgroundColor: colors.surface }]}>
                    <Typography variant="bodySmall" color="textSecondary" style={styles.aiAnalysisLabel}>
                      ALARA Analysis:
                    </Typography>
                    <Typography variant="bodySmall" color="text">
                      {typeof event.ai_analysis === 'object' && event.ai_analysis.summary
                        ? event.ai_analysis.summary
                        : 'Analysis available'}
                    </Typography>
                  </View>
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
  eventContent: {
    flex: 1,
    paddingBottom: Spacing.md,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  eventTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  eventEmoji: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  eventTypeText: {
    flex: 1,
  },
  resolvedBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.full,
  },
  eventDetail: {
    marginTop: Spacing.xs,
  },
  aiAnalysisContainer: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  aiAnalysisLabel: {
    marginBottom: Spacing.xs / 2,
    fontWeight: '600',
  },
});
