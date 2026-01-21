import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Keyboard } from 'react-native';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Typography } from '../ui/Typography';
import { Spacing, BorderRadius } from '../../lib/design/tokens';
import { useColors } from '../../lib/design/useColors';
import { logBloodPressure } from '../../lib/services/bloodPressureService';
import { useAuth } from '../../context/AuthContext';
import type { BloodPressureInput } from '../../types/care';

interface BloodPressureInputCardProps {
  onReadingSaved?: () => void;
}

export function BloodPressureInputCard({ onReadingSaved }: BloodPressureInputCardProps) {
  const { user } = useAuth();
  const colors = useColors();
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [pulse, setPulse] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!user?.id) {
      setError('Please log in to save readings');
      return;
    }

    const systolicNum = parseInt(systolic, 10);
    const diastolicNum = parseInt(diastolic, 10);
    const pulseNum = pulse ? parseInt(pulse, 10) : undefined;

    // Validation
    if (!systolic || isNaN(systolicNum) || systolicNum <= 0 || systolicNum > 300) {
      setError('Please enter a valid systolic value (1-300)');
      return;
    }

    if (!diastolic || isNaN(diastolicNum) || diastolicNum <= 0 || diastolicNum > 200) {
      setError('Please enter a valid diastolic value (1-200)');
      return;
    }

    if (pulse && (isNaN(pulseNum!) || pulseNum! <= 0 || pulseNum! > 250)) {
      setError('Please enter a valid pulse value (1-250)');
      return;
    }

    if (diastolicNum >= systolicNum) {
      setError('Diastolic must be less than systolic');
      return;
    }

    setError(null);
    setIsSaving(true);
    Keyboard.dismiss();

    try {
      const input: BloodPressureInput = {
        systolic: systolicNum,
        diastolic: diastolicNum,
        pulse: pulseNum,
        notes: notes.trim() || undefined,
      };

      const result = await logBloodPressure(user.id, input);

      if (result) {
        // Reset form
        setSystolic('');
        setDiastolic('');
        setPulse('');
        setNotes('');
        onReadingSaved?.();
      } else {
        setError('Failed to save reading. Please try again.');
      }
    } catch (err) {
      console.error('Error saving blood pressure:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card variant="calm">
      <Typography variant="h3" color="text" weight="semibold" style={styles.title}>
        Log Blood Pressure
      </Typography>
      <Typography variant="bodySmall" color="textSecondary" style={styles.subtitle}>
        Enter your blood pressure reading
      </Typography>

      <View style={styles.inputRow}>
        <View style={styles.inputGroup}>
          <Typography variant="caption" color="textSecondary" style={styles.label}>
            Systolic
          </Typography>
          <TextInput
            style={[
              styles.largeInput,
              { 
                backgroundColor: colors.surface, 
                color: colors.text,
                borderColor: error ? colors.error : colors.border,
              },
            ]}
            value={systolic}
            onChangeText={(text) => {
              setSystolic(text.replace(/[^0-9]/g, ''));
              setError(null);
            }}
            placeholder="120"
            placeholderTextColor={colors.textLight}
            keyboardType="number-pad"
            maxLength={3}
            selectTextOnFocus
          />
          <Typography variant="caption" color="textLight" style={styles.unit}>
            mmHg
          </Typography>
        </View>

        <View style={styles.divider} />

        <View style={styles.inputGroup}>
          <Typography variant="caption" color="textSecondary" style={styles.label}>
            Diastolic
          </Typography>
          <TextInput
            style={[
              styles.largeInput,
              { 
                backgroundColor: colors.surface, 
                color: colors.text,
                borderColor: error ? colors.error : colors.border,
              },
            ]}
            value={diastolic}
            onChangeText={(text) => {
              setDiastolic(text.replace(/[^0-9]/g, ''));
              setError(null);
            }}
            placeholder="80"
            placeholderTextColor={colors.textLight}
            keyboardType="number-pad"
            maxLength={3}
            selectTextOnFocus
          />
          <Typography variant="caption" color="textLight" style={styles.unit}>
            mmHg
          </Typography>
        </View>
      </View>

      <View style={styles.pulseRow}>
        <View style={styles.pulseInputGroup}>
          <Typography variant="caption" color="textSecondary" style={styles.label}>
            Pulse (Optional)
          </Typography>
          <TextInput
            style={[
              styles.pulseInput,
              { 
                backgroundColor: colors.surface, 
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={pulse}
            onChangeText={(text) => setPulse(text.replace(/[^0-9]/g, ''))}
            placeholder="72"
            placeholderTextColor={colors.textLight}
            keyboardType="number-pad"
            maxLength={3}
          />
          <Typography variant="caption" color="textLight" style={styles.unit}>
            bpm
          </Typography>
        </View>
      </View>

      {error && (
        <Typography variant="bodySmall" color="error" style={styles.error}>
          {error}
        </Typography>
      )}

      <Button
        title={isSaving ? 'Saving...' : 'Save Reading'}
        onPress={handleSave}
        disabled={isSaving || !systolic || !diastolic}
        style={styles.saveButton}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: Spacing.xs,
  },
  subtitle: {
    marginBottom: Spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
  },
  inputGroup: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  largeInput: {
    width: '100%',
    height: 80,
    fontSize: 36,
    fontWeight: '600',
    textAlign: 'center',
    borderWidth: 2,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
  },
  pulseInput: {
    width: 100,
    height: 50,
    fontSize: 20,
    fontWeight: '500',
    textAlign: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
  },
  pulseInputGroup: {
    alignItems: 'center',
  },
  pulseRow: {
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  unit: {
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  divider: {
    width: 1,
    height: 60,
    marginHorizontal: Spacing.md,
    backgroundColor: '#E5E5E5',
  },
  error: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  saveButton: {
    marginTop: Spacing.sm,
  },
});
