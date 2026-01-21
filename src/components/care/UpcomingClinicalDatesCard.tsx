import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { Spacing, BorderRadius } from '../../lib/design/tokens';
import { useColors } from '../../lib/design/useColors';
import { getClinicalDateStatus } from '../../lib/services/clinicalDateService';
import { useRouter } from 'expo-router';
import type { ClinicalDate } from '../../types/care';

interface UpcomingClinicalDatesCardProps {
  clinicalDates: ClinicalDate[];
  maxItems?: number;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays <= 7) return `In ${diffDays} days`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getTypeEmoji(type?: string): string {
  if (!type) return '📋';
  const emojis: Record<string, string> = {
    lab_test: '🧪',
    scan: '📷',
    procedure: '⚕️',
    follow_up: '🔄',
    screening: '🔍',
    other: '📋',
  };
  return emojis[type] || '📋';
}

export function UpcomingClinicalDatesCard({
  clinicalDates,
  maxItems = 3,
}: UpcomingClinicalDatesCardProps) {
  const colors = useColors();
  const router = useRouter();

  if (clinicalDates.length === 0) {
    return null;
  }

  // Sort by date and take up to maxItems
  const sortedDates = [...clinicalDates]
    .sort((a, b) => {
      const dateA = new Date(a.clinical_date).getTime();
      const dateB = new Date(b.clinical_date).getTime();
      return dateA - dateB;
    })
    .slice(0, maxItems);

  return (
    <Card variant="calm">
      <View style={styles.header}>
        <Typography variant="h3" color="text" weight="semibold" style={styles.title}>
          Upcoming Clinical Dates
        </Typography>
        <TouchableOpacity onPress={() => router.push('/(tabs)/care')}>
          <Typography variant="bodySmall" color="primary" weight="medium">
            View All
          </Typography>
        </TouchableOpacity>
      </View>

      {sortedDates.map((clinicalDate) => {
        const status = getClinicalDateStatus(clinicalDate);
        const isToday = status.status === 'today';

        return (
          <View
            key={clinicalDate.id}
            style={[
              styles.item,
              {
                backgroundColor: isToday ? colors.reminder + '15' : colors.surface,
                borderColor: isToday ? colors.reminder : colors.border,
              },
            ]}
          >
            <View style={styles.itemLeft}>
              <Typography variant="h2" style={styles.emoji}>
                {getTypeEmoji(clinicalDate.clinical_type)}
              </Typography>
            </View>
            <View style={styles.itemRight}>
              <Typography variant="body" color="text" weight="medium">
                {clinicalDate.description}
              </Typography>
              <Typography variant="bodySmall" color="textSecondary" style={styles.date}>
                {formatDate(clinicalDate.clinical_date)}
              </Typography>
            </View>
          </View>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
  },
  itemLeft: {
    marginRight: Spacing.md,
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 24,
  },
  itemRight: {
    flex: 1,
    justifyContent: 'center',
  },
  date: {
    marginTop: Spacing.xs / 2,
  },
});
