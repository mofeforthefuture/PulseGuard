import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { Spacing, BorderRadius } from '../../lib/design/tokens';
import { useColors } from '../../lib/design/useColors';
import type { BloodPressureReading } from '../../types/care';

interface BloodPressureReadingsListProps {
  readings: BloodPressureReading[];
  onReadingPress?: (reading: BloodPressureReading) => void;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getBPCategory(systolic: number, diastolic: number): {
  label: string;
  color: string;
} {
  if (systolic >= 180 || diastolic >= 120) {
    return { label: 'Crisis', color: '#FF4757' };
  }
  if (systolic >= 140 || diastolic >= 90) {
    return { label: 'High Stage 2', color: '#FF6B7A' };
  }
  if (systolic >= 130 || diastolic >= 80) {
    return { label: 'High Stage 1', color: '#FFA502' };
  }
  if (systolic >= 120) {
    return { label: 'Elevated', color: '#FFD32A' };
  }
  if (systolic < 90 || diastolic < 60) {
    return { label: 'Low', color: '#5F27CD' };
  }
  return { label: 'Normal', color: '#4CAF50' };
}

export function BloodPressureReadingsList({
  readings,
  onReadingPress,
}: BloodPressureReadingsListProps) {
  const colors = useColors();

  if (readings.length === 0) {
    return (
      <Card>
        <Typography variant="h3" color="text" weight="semibold" style={styles.title}>
          Recent Readings
        </Typography>
        <Typography variant="bodySmall" color="textLight" style={styles.emptyText}>
          No blood pressure readings yet
        </Typography>
      </Card>
    );
  }

  return (
    <Card>
      <Typography variant="h3" color="text" weight="semibold" style={styles.title}>
        Recent Readings
      </Typography>

      {readings.map((reading) => {
        const category = getBPCategory(reading.systolic, reading.diastolic);
        const isAbnormal = reading.is_abnormal;

        return (
          <TouchableOpacity
            key={reading.id}
            onPress={() => onReadingPress?.(reading)}
            style={[
              styles.readingItem,
              { 
                backgroundColor: colors.surface,
                borderColor: isAbnormal ? colors.concern : colors.border,
                borderLeftWidth: isAbnormal ? 4 : 1,
              },
            ]}
            activeOpacity={0.7}
          >
            <View style={styles.readingMain}>
              <View style={styles.bpValues}>
                <View style={styles.bpValue}>
                  <Typography variant="h2" color="text" weight="bold">
                    {reading.systolic}
                  </Typography>
                  <Typography variant="caption" color="textLight" style={styles.bpLabel}>
                    Systolic
                  </Typography>
                </View>

                <Typography variant="h3" color="textLight" style={styles.slash}>
                  /
                </Typography>

                <View style={styles.bpValue}>
                  <Typography variant="h2" color="text" weight="bold">
                    {reading.diastolic}
                  </Typography>
                  <Typography variant="caption" color="textLight" style={styles.bpLabel}>
                    Diastolic
                  </Typography>
                </View>

                {reading.pulse && (
                  <>
                    <Typography variant="h3" color="textLight" style={styles.slash}>
                      •
                    </Typography>
                    <View style={styles.bpValue}>
                      <Typography variant="h2" color="text" weight="bold">
                        {reading.pulse}
                      </Typography>
                      <Typography variant="caption" color="textLight" style={styles.bpLabel}>
                        Pulse
                      </Typography>
                    </View>
                  </>
                )}
              </View>

              <View style={styles.readingMeta}>
                <View
                  style={[
                    styles.categoryBadge,
                    { backgroundColor: category.color + '20' },
                  ]}
                >
                  <Typography
                    variant="caption"
                    style={[styles.categoryText, { color: category.color }]}
                    weight="semibold"
                  >
                    {category.label}
                  </Typography>
                </View>
                {isAbnormal && (
                  <View style={[styles.flagBadge, { backgroundColor: colors.concern + '20' }]}>
                    <Typography
                      variant="caption"
                      style={[styles.flagText, { color: colors.concern }]}
                      weight="semibold"
                    >
                      ⚠️ Flagged
                    </Typography>
                  </View>
                )}
                <Typography variant="caption" color="textLight" style={styles.timestamp}>
                  {formatDate(reading.recorded_at)}
                </Typography>
              </View>
            </View>
          </TouchableOpacity>
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
  readingItem: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
  },
  readingMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bpValues: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bpValue: {
    alignItems: 'center',
    marginHorizontal: Spacing.xs,
  },
  bpLabel: {
    marginTop: Spacing.xs / 2,
  },
  slash: {
    marginHorizontal: Spacing.xs,
    fontSize: 24,
  },
  readingMeta: {
    alignItems: 'flex-end',
  },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  categoryText: {
    fontSize: 10,
  },
  flagBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  flagText: {
    fontSize: 10,
  },
  timestamp: {
    fontSize: 11,
  },
});
