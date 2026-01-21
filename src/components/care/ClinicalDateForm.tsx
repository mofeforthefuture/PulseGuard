import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Typography } from '../ui/Typography';
import { Input } from '../ui/Input';
import { Toggle } from '../ui/Toggle';
import { Spacing } from '../../lib/design/tokens';
import { useColors } from '../../lib/design/useColors';
import type { ClinicalDateInput, ClinicalDate, ClinicalType } from '../../types/care';

interface ClinicalDateFormProps {
  clinicalDate?: ClinicalDate | null;
  onSubmit: (input: ClinicalDateInput) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

const CLINICAL_TYPES: { value: ClinicalType; label: string }[] = [
  { value: 'lab_test', label: 'Lab Test' },
  { value: 'scan', label: 'Scan' },
  { value: 'procedure', label: 'Procedure' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'screening', label: 'Screening' },
  { value: 'other', label: 'Other' },
];

export function ClinicalDateForm({
  clinicalDate,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ClinicalDateFormProps) {
  const colors = useColors();
  const [description, setDescription] = useState(clinicalDate?.description || '');
  const [clinicalDateValue, setClinicalDateValue] = useState(
    clinicalDate?.clinical_date || ''
  );
  const [clinicalType, setClinicalType] = useState<ClinicalType | undefined>(
    clinicalDate?.clinical_type || undefined
  );
  const [location, setLocation] = useState(clinicalDate?.location || '');
  const [providerName, setProviderName] = useState(clinicalDate?.provider_name || '');
  const [preparationNotes, setPreparationNotes] = useState(
    clinicalDate?.preparation_notes || ''
  );
  const [notes, setNotes] = useState(clinicalDate?.notes || '');
  const [reminderEnabled, setReminderEnabled] = useState(
    clinicalDate?.reminder_enabled !== false
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!description.trim()) {
      setError('Please enter a description');
      return;
    }

    if (!clinicalDateValue.trim()) {
      setError('Please select a date');
      return;
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(clinicalDateValue)) {
      setError('Please enter a valid date (YYYY-MM-DD)');
      return;
    }

    setError(null);

    await onSubmit({
      clinical_date: clinicalDateValue,
      description: description.trim(),
      clinical_type: clinicalType,
      location: location.trim() || undefined,
      provider_name: providerName.trim() || undefined,
      preparation_notes: preparationNotes.trim() || undefined,
      notes: notes.trim() || undefined,
      reminder_enabled: reminderEnabled,
    });

    // Reset form if creating new
    if (!clinicalDate) {
      setDescription('');
      setClinicalDateValue('');
      setClinicalType(undefined);
      setLocation('');
      setProviderName('');
      setPreparationNotes('');
      setNotes('');
      setReminderEnabled(true);
    }
  };

  return (
    <View>
      <Typography variant="h2" color="text" weight="bold" style={styles.title}>
        {clinicalDate ? 'Edit Clinical Date' : 'Add Clinical Date'}
      </Typography>
      <Typography variant="bodySmall" color="textSecondary" style={styles.subtitle}>
        Track lab tests, scans, procedures, and follow-ups
      </Typography>

      <Input
        label="Description *"
        value={description}
        onChangeText={(text) => {
          setDescription(text);
          setError(null);
        }}
        placeholder="e.g., Blood work, MRI scan, Follow-up appointment"
        containerStyle={styles.input}
      />

      <Input
        label="Date *"
        value={clinicalDateValue}
        onChangeText={(text) => {
          setClinicalDateValue(text);
          setError(null);
        }}
        placeholder="YYYY-MM-DD"
        containerStyle={styles.input}
      />

      <View style={styles.typeContainer}>
        <Typography variant="label" color="text" style={styles.typeLabel}>
          Type (Optional)
        </Typography>
        <View style={styles.typeButtons}>
          {CLINICAL_TYPES.map((type) => (
            <Button
              key={type.value}
              title={type.label}
              onPress={() => setClinicalType(type.value)}
              variant={clinicalType === type.value ? 'primary' : 'outline'}
              style={styles.typeButton}
            />
          ))}
        </View>
      </View>

      <Input
        label="Location (Optional)"
        value={location}
        onChangeText={setLocation}
        placeholder="Hospital, clinic, or facility name"
        containerStyle={styles.input}
      />

      <Input
        label="Provider Name (Optional)"
        value={providerName}
        onChangeText={setProviderName}
        placeholder="Doctor or provider name"
        containerStyle={styles.input}
      />

      <Input
        label="Preparation Notes (Optional)"
        value={preparationNotes}
        onChangeText={setPreparationNotes}
        placeholder="e.g., Fasting required, bring insurance card"
        containerStyle={styles.input}
        multiline
      />

      <Input
        label="Additional Notes (Optional)"
        value={notes}
        onChangeText={setNotes}
        placeholder="Any additional information"
        containerStyle={styles.input}
        multiline
      />

      <View style={styles.toggleContainer}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleLabel}>
            <Typography variant="body" color="text" weight="medium">
              Enable Reminders
            </Typography>
            <Typography variant="caption" color="textSecondary" style={styles.toggleHelp}>
              Get notified 1 week and 1 day before
            </Typography>
          </View>
          <Toggle value={reminderEnabled} onValueChange={setReminderEnabled} />
        </View>
      </View>

      {error && (
        <Typography variant="bodySmall" color="error" style={styles.error}>
          {error}
        </Typography>
      )}

      <View style={styles.buttons}>
        {onCancel && (
          <Button
            title="Cancel"
            onPress={onCancel}
            variant="outline"
            style={[styles.button, styles.buttonHalf]}
          />
        )}
        <Button
          title={isSubmitting ? 'Saving...' : clinicalDate ? 'Update' : 'Save'}
          onPress={handleSubmit}
          disabled={isSubmitting || !description.trim() || !clinicalDateValue.trim()}
          style={[styles.button, onCancel ? styles.buttonHalf : styles.buttonFull]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: Spacing.xs,
  },
  subtitle: {
    marginBottom: Spacing.md,
  },
  input: {
    marginBottom: Spacing.sm,
  },
  typeContainer: {
    marginBottom: Spacing.md,
  },
  typeLabel: {
    marginBottom: Spacing.sm,
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  typeButton: {
    marginTop: 0,
    minWidth: 80,
  },
  toggleContainer: {
    marginBottom: Spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabel: {
    flex: 1,
    marginRight: Spacing.md,
  },
  toggleHelp: {
    marginTop: Spacing.xs / 2,
  },
  error: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  button: {
    marginTop: 0,
  },
  buttonHalf: {
    flex: 1,
  },
  buttonFull: {
    flex: 1,
  },
});
