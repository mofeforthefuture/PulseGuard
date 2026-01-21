import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from '../ui/Typography';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Spacing } from '../../lib/design/tokens';
import type { Medication } from '../../types/health';

interface MedicationFormProps {
  medication?: Medication | null;
  onSave: (medication: Medication) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const FREQUENCY_OPTIONS = [
  'Once daily',
  'Twice daily',
  'Three times daily',
  'Four times daily',
  'As needed',
  'Weekly',
  'Other',
];

export function MedicationForm({ medication, onSave, onCancel, onDelete }: MedicationFormProps) {
  const [name, setName] = useState(medication?.name || '');
  const [dosage, setDosage] = useState(medication?.dosage || '');
  const [frequency, setFrequency] = useState(medication?.frequency || 'Once daily');
  const [time, setTime] = useState(medication?.time || '09:00');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (medication) {
      setName(medication.name || '');
      setDosage(medication.dosage || '');
      setFrequency(medication.frequency || 'Once daily');
      setTime(medication.time || '09:00');
    }
  }, [medication]);

  const handleSave = () => {
    if (!name.trim()) {
      setError('Please enter a medication name');
      return;
    }

    if (!dosage.trim()) {
      setError('Please enter a dosage');
      return;
    }

    setError(null);

    const medicationData: Medication = {
      name: name.trim(),
      dosage: dosage.trim(),
      frequency: frequency.trim(),
      time: time.trim() || undefined,
    };

    onSave(medicationData);
  };

  return (
    <View style={styles.container}>
      <Typography variant="h2" color="text" weight="bold" style={styles.title}>
        {medication ? 'Edit Medication' : 'Add Medication'}
      </Typography>

      <Input
        label="Medication Name *"
        value={name}
        onChangeText={(text) => {
          setName(text);
          setError(null);
        }}
        placeholder="e.g., Albuterol Inhaler"
        containerStyle={styles.input}
        autoCapitalize="words"
      />

      <Input
        label="Dosage *"
        value={dosage}
        onChangeText={(text) => {
          setDosage(text);
          setError(null);
        }}
        placeholder="e.g., 2 puffs"
        containerStyle={styles.input}
      />

      <View style={styles.frequencyContainer}>
        <Typography variant="label" color="text" style={styles.frequencyLabel}>
          Frequency *
        </Typography>
        <View style={styles.frequencyButtons}>
          {FREQUENCY_OPTIONS.map((freq) => (
            <Button
              key={freq}
              title={freq}
              onPress={() => setFrequency(freq)}
              variant={frequency === freq ? 'primary' : 'outline'}
              size="sm"
              style={styles.frequencyButton}
            />
          ))}
        </View>
      </View>

      <Input
        label="Time (HH:MM)"
        value={time}
        onChangeText={(text) => {
          // Format as HH:MM
          const formatted = text.replace(/[^0-9]/g, '');
          if (formatted.length <= 2) {
            setTime(formatted);
          } else if (formatted.length <= 4) {
            setTime(`${formatted.slice(0, 2)}:${formatted.slice(2)}`);
          }
          setError(null);
        }}
        placeholder="09:00"
        keyboardType="number-pad"
        containerStyle={styles.input}
        maxLength={5}
      />

      {error && (
        <Typography variant="bodySmall" color="error" style={styles.error}>
          {error}
        </Typography>
      )}

      <View style={styles.buttons}>
        {medication && onDelete && (
          <Button
            title="Delete"
            onPress={onDelete}
            variant="outline"
            style={[styles.button, styles.deleteButton]}
          />
        )}
        <Button
          title="Cancel"
          onPress={onCancel}
          variant="outline"
          style={[styles.button, medication && onDelete ? styles.buttonThird : styles.buttonHalf]}
        />
        <Button
          title={medication ? 'Update' : 'Add'}
          onPress={handleSave}
          disabled={!name.trim() || !dosage.trim()}
          style={[styles.button, medication && onDelete ? styles.buttonThird : styles.buttonHalf]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    marginBottom: Spacing.lg,
  },
  input: {
    marginBottom: Spacing.md,
  },
  frequencyContainer: {
    marginBottom: Spacing.md,
  },
  frequencyLabel: {
    marginBottom: Spacing.sm,
  },
  frequencyButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  frequencyButton: {
    marginTop: 0,
  },
  error: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  button: {
    marginTop: 0,
  },
  buttonHalf: {
    flex: 1,
  },
  buttonThird: {
    flex: 1,
  },
  deleteButton: {
    borderColor: '#FF4757',
  },
});
