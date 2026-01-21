import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, Keyboard } from 'react-native';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Typography } from '../ui/Typography';
import { BottomSheet } from '../ui/BottomSheet';
import { Spacing, BorderRadius } from '../../lib/design/tokens';
import { useColors } from '../../lib/design/useColors';
import { logBloodPressure } from '../../lib/services/bloodPressureService';
import { useAuth } from '../../context/AuthContext';
import type { BloodPressureInput, BloodPressureReading } from '../../types/care';

interface BloodPressureCardProps {
  recentReadings: BloodPressureReading[];
  onReadingSaved?: () => void;
}

export function BloodPressureCard({ recentReadings, onReadingSaved }: BloodPressureCardProps) {
  const { user } = useAuth();
  const colors = useColors();
  const [showBottomSheet, setShowBottomSheet] = useState(false);
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
        setShowBottomSheet(false);
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

  const latestReading = recentReadings[0];

  return (
    <>
      <Card variant="calm">
        <View style={styles.header}>
          <Typography variant="h3" color="text" weight="semibold" style={styles.title}>
            Blood Pressure
          </Typography>
          <TouchableOpacity onPress={() => setShowBottomSheet(true)}>
            <Typography variant="bodySmall" color="primary" weight="medium">
              Add Reading
            </Typography>
          </TouchableOpacity>
        </View>

        {/* Large Number Display */}
        {latestReading ? (
          <View style={styles.largeDisplay}>
            <View style={styles.bpValueContainer}>
              <Typography variant="display" color="text" weight="bold" style={styles.largeNumber}>
                {latestReading.systolic}
              </Typography>
              <Typography variant="caption" color="textLight" style={styles.unit}>
                Systolic
              </Typography>
            </View>
            <Typography variant="display" color="textLight" style={styles.slash}>
              /
            </Typography>
            <View style={styles.bpValueContainer}>
              <Typography variant="display" color="text" weight="bold" style={styles.largeNumber}>
                {latestReading.diastolic}
              </Typography>
              <Typography variant="caption" color="textLight" style={styles.unit}>
                Diastolic
              </Typography>
            </View>
            {latestReading.pulse && (
              <>
                <Typography variant="display" color="textLight" style={styles.slash}>
                  •
                </Typography>
                <View style={styles.bpValueContainer}>
                  <Typography variant="display" color="text" weight="bold" style={styles.largeNumber}>
                    {latestReading.pulse}
                  </Typography>
                  <Typography variant="caption" color="textLight" style={styles.unit}>
                    Pulse
                  </Typography>
                </View>
              </>
            )}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Typography variant="body" color="textSecondary" style={styles.emptyText}>
              No readings yet. Tap "Add Reading" to log your first measurement.
            </Typography>
          </View>
        )}

        {/* Recent Readings List */}
        {recentReadings.length > 1 && (
          <View style={styles.recentList}>
            <Typography variant="caption" color="textSecondary" style={styles.recentTitle}>
              Recent Readings
            </Typography>
            {recentReadings.slice(1, 4).map((reading) => (
              <View key={reading.id} style={styles.recentItem}>
                <Typography variant="body" color="text" weight="medium">
                  {reading.systolic}/{reading.diastolic}
                  {reading.pulse && ` • ${reading.pulse}`}
                </Typography>
                <Typography variant="caption" color="textLight">
                  {new Date(reading.recorded_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Typography>
              </View>
            ))}
          </View>
        )}
      </Card>

      {/* Bottom Sheet for Adding Reading */}
      <BottomSheet visible={showBottomSheet} onClose={() => setShowBottomSheet(false)}>
        <Typography variant="h2" color="text" weight="bold" style={styles.sheetTitle}>
          Add Blood Pressure Reading
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
      </BottomSheet>
    </>
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
  largeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  bpValueContainer: {
    alignItems: 'center',
    marginHorizontal: Spacing.md,
  },
  largeNumber: {
    fontSize: 48,
    lineHeight: 56,
  },
  slash: {
    fontSize: 36,
    marginHorizontal: Spacing.sm,
  },
  unit: {
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  emptyState: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
  recentList: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  recentTitle: {
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  sheetTitle: {
    marginBottom: Spacing.lg,
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
    marginTop: Spacing.md,
  },
});
