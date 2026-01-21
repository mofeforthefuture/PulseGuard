import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { Spacing } from '../../lib/design/tokens';
import { useColors } from '../../lib/design/useColors';
import { useRouter } from 'expo-router';
import { getDaysUntilAppointment, formatMonthYear } from '../../lib/services/careService';
import { getDaysUntilNextCheckup } from '../../lib/services/checkupService';
import { getDaysUntilReminder } from '../../lib/services/doctorVisitReminderService';
import type { Appointment } from '../../types/care';
import type { MedicalCheckup } from '../../types/care';
import type { DoctorVisitReminder } from '../../types/care';

interface CareSummaryCardProps {
  nextAppointment?: Appointment | null;
  checkup?: MedicalCheckup | null;
  nextDoctorReminder?: DoctorVisitReminder | null;
}

export function CareSummaryCard({
  nextAppointment,
  checkup,
  nextDoctorReminder,
}: CareSummaryCardProps) {
  const colors = useColors();
  const router = useRouter();

  // Always show the card, even if empty (for consistent layout)

  return (
    <Card variant="calm">
      <View style={styles.header}>
        <Typography variant="h3" color="text" weight="semibold" style={styles.title}>
          Care Summary
        </Typography>
        <TouchableOpacity onPress={() => router.push('/(tabs)/care')}>
          <Typography variant="bodySmall" color="primary" weight="medium">
            View All
          </Typography>
        </TouchableOpacity>
      </View>

      {nextDoctorReminder || (checkup && checkup.next_checkup_date) || nextAppointment ? (
        <View style={styles.summaryItems}>
          {/* Next Doctor Visit */}
          {nextDoctorReminder && (
            <View style={styles.summaryItem}>
              <Typography variant="body" color="text" weight="medium">
                Next doctor visit
              </Typography>
              <Typography variant="body" color="text" weight="semibold">
                in {getDaysUntilReminder(nextDoctorReminder.reminder_date)} days
              </Typography>
            </View>
          )}

          {/* Medical Checkup */}
          {checkup && checkup.next_checkup_date && (
            <View style={styles.summaryItem}>
              <Typography variant="body" color="text" weight="medium">
                Medical checkup due
              </Typography>
              <Typography variant="body" color="text" weight="semibold">
                {formatMonthYear(checkup.next_checkup_date)}
              </Typography>
            </View>
          )}

          {/* Next Appointment */}
          {nextAppointment && (
            <View style={styles.summaryItem}>
              <Typography variant="body" color="text" weight="medium">
                Next appointment
              </Typography>
              <Typography variant="body" color="text" weight="semibold">
                in {getDaysUntilAppointment(nextAppointment.scheduled_at)} days
              </Typography>
            </View>
          )}
        </View>
      ) : (
        <Typography variant="bodySmall" color="textLight" style={styles.emptyText}>
          No upcoming care items
        </Typography>
      )}
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
  summaryItems: {
    gap: Spacing.sm,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  emptyText: {
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: Spacing.sm,
  },
});
