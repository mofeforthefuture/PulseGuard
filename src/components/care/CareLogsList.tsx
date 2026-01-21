import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { Spacing, BorderRadius } from '../../lib/design/tokens';
import { useColors } from '../../lib/design/useColors';
import type { CareLog } from '../../types/care';

interface CareLogsListProps {
  careLogs: CareLog[];
  onLogPress?: (log: CareLog) => void;
  maxItems?: number;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  }
  
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
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

export function CareLogsList({
  careLogs,
  onLogPress,
  maxItems,
}: CareLogsListProps) {
  const colors = useColors();

  if (careLogs.length === 0) {
    return (
      <Card>
        <Typography variant="h3" color="text" weight="semibold" style={styles.title}>
          Recent Care Logs
        </Typography>
        <Typography variant="bodySmall" color="textLight" style={styles.emptyText}>
          No care logs yet
        </Typography>
      </Card>
    );
  }

  const displayLogs = maxItems ? careLogs.slice(0, maxItems) : careLogs;

  return (
    <Card>
      <Typography variant="h3" color="text" weight="semibold" style={styles.title}>
        Recent Care Logs
      </Typography>

      {displayLogs.map((log) => (
        <TouchableOpacity
          key={log.id}
          onPress={() => onLogPress?.(log)}
          style={[
            styles.logItem,
            { 
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
          activeOpacity={0.7}
        >
          <View style={styles.logLeft}>
            <Typography variant="h2" style={styles.emoji}>
              {getLogTypeEmoji(log.log_type)}
            </Typography>
          </View>
          <View style={styles.logRight}>
            <Typography variant="body" color="text" weight="medium">
              {log.title}
            </Typography>
            <Typography variant="bodySmall" color="textSecondary" style={styles.date}>
              {formatDate(log.occurred_at)}
            </Typography>
            {log.diagnosis && (
              <Typography variant="bodySmall" color="textSecondary" style={styles.diagnosis}>
                {log.diagnosis}
              </Typography>
            )}
          </View>
        </TouchableOpacity>
      ))}
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
  logItem: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
  },
  logLeft: {
    marginRight: Spacing.md,
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 24,
  },
  logRight: {
    flex: 1,
    justifyContent: 'center',
  },
  date: {
    marginTop: Spacing.xs / 2,
  },
  diagnosis: {
    marginTop: Spacing.xs / 2,
    fontStyle: 'italic',
  },
});
