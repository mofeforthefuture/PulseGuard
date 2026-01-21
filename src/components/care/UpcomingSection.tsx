import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { Spacing } from '../../lib/design/tokens';
import { MedicalCheckupCard } from './MedicalCheckupCard';
import { DoctorVisitReminderCard } from './DoctorVisitReminderCard';
import { ClinicalDatesTimeline } from './ClinicalDatesTimeline';
import type { MedicalCheckup } from '../../types/care';
import type { DoctorVisitReminder } from '../../types/care';
import type { ClinicalDate } from '../../types/care';

interface UpcomingSectionProps {
  checkup: MedicalCheckup | null;
  doctorReminders: DoctorVisitReminder[];
  clinicalDates: ClinicalDate[];
  onCheckupUpdated: () => void;
  onReminderComplete?: (reminderId: string) => void;
  onReminderDelete?: (reminderId: string) => void;
  onClinicalDateComplete?: (clinicalDateId: string) => void;
  onClinicalDateEdit?: (clinicalDate: ClinicalDate) => void;
  onClinicalDateDelete?: (clinicalDateId: string) => void;
  onAddReminder?: () => void;
  onAddClinicalDate?: () => void;
}

export function UpcomingSection({
  checkup,
  doctorReminders,
  clinicalDates,
  onCheckupUpdated,
  onReminderComplete,
  onReminderDelete,
  onClinicalDateComplete,
  onClinicalDateEdit,
  onClinicalDateDelete,
  onAddReminder,
  onAddClinicalDate,
}: UpcomingSectionProps) {
  return (
    <View style={styles.section}>
      <Typography variant="h2" color="text" weight="bold" style={styles.sectionTitle}>
        Upcoming
      </Typography>
      <Typography variant="bodySmall" color="textSecondary" style={styles.sectionSubtitle}>
        Scheduled appointments, checkups, and clinical dates
      </Typography>

      {/* Medical Checkup */}
      <MedicalCheckupCard checkup={checkup} onCheckupUpdated={onCheckupUpdated} />

      {/* Doctor Visit Reminders */}
      {doctorReminders.length > 0 && (
        <DoctorVisitReminderCard
          reminders={doctorReminders}
          onComplete={onReminderComplete}
          onDelete={onReminderDelete}
        />
      )}
      {onAddReminder && doctorReminders.length === 0 && (
        <Card>
          <Button
            title="Add Doctor Visit Reminder"
            onPress={onAddReminder}
            variant="outline"
            style={styles.addButton}
          />
        </Card>
      )}

      {/* Clinical Dates */}
      {clinicalDates.length > 0 && (
        <ClinicalDatesTimeline
          clinicalDates={clinicalDates}
          onComplete={onClinicalDateComplete}
          onEdit={onClinicalDateEdit}
          onDelete={onClinicalDateDelete}
        />
      )}
      {onAddClinicalDate && clinicalDates.length === 0 && (
        <Card>
          <Button
            title="Add Clinical Date"
            onPress={onAddClinicalDate}
            variant="outline"
            style={styles.addButton}
          />
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    marginBottom: Spacing.md,
  },
  addButton: {
    marginTop: 0,
  },
});
