/**
 * Blood Pressure Form
 * Prefilled form for blood pressure data confirmation
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Input } from '../../ui/Input';
import { Typography } from '../../ui/Typography';
import { Spacing } from '../../../lib/design/tokens';
import type { BloodPressureData } from '../ALARADataConfirmationSheet';

interface BloodPressureFormProps {
  initialData: BloodPressureData;
  onChange: (data: BloodPressureData) => void;
}

export function BloodPressureForm({ initialData, onChange }: BloodPressureFormProps) {
  const [systolic, setSystolic] = useState(initialData.systolic?.toString() || '');
  const [diastolic, setDiastolic] = useState(initialData.diastolic?.toString() || '');
  const [pulse, setPulse] = useState(initialData.pulse?.toString() || '');
  const [notes, setNotes] = useState(initialData.notes || '');
  const [position, setPosition] = useState(initialData.position || 'sitting');

  useEffect(() => {
    // Update parent when form changes
    const updated: BloodPressureData = {
      ...initialData,
      systolic: systolic ? parseInt(systolic, 10) : undefined,
      diastolic: diastolic ? parseInt(diastolic, 10) : undefined,
      pulse: pulse ? parseInt(pulse, 10) : undefined,
      notes: notes.trim() || undefined,
      position: position as any,
    };
    onChange(updated);
  }, [systolic, diastolic, pulse, notes, position]);

  return (
    <View style={styles.container}>
      <Typography variant="bodySmall" color="textSecondary" style={styles.sectionTitle}>
        Blood Pressure Reading
      </Typography>

      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <Input
            label="Systolic (top)"
            value={systolic}
            onChangeText={(text) => setSystolic(text.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            placeholder="120"
            containerStyle={styles.input}
            autoFocus={!systolic}
          />
        </View>
        <View style={styles.halfWidth}>
          <Input
            label="Diastolic (bottom)"
            value={diastolic}
            onChangeText={(text) => setDiastolic(text.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            placeholder="80"
            containerStyle={styles.input}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <Input
            label="Pulse (optional)"
            value={pulse}
            onChangeText={(text) => setPulse(text.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            placeholder="72"
            containerStyle={styles.input}
          />
        </View>
        <View style={styles.halfWidth}>
          <Input
            label="Position"
            value={position}
            onChangeText={setPosition}
            placeholder="sitting"
            containerStyle={styles.input}
          />
        </View>
      </View>

      <Input
        label="Notes (optional)"
        value={notes}
        onChangeText={setNotes}
        placeholder="e.g., morning reading, after exercise"
        multiline
        numberOfLines={3}
        containerStyle={styles.input}
      />

      {initialData.isUnusual && initialData.abnormalReason && (
        <View style={styles.warningBox}>
          <Typography variant="bodySmall" color="warning" weight="semibold">
            ⚠️ This reading appears unusual ({initialData.abnormalReason})
          </Typography>
          <Typography variant="caption" color="textSecondary" style={styles.warningText}>
            Please verify the values are correct before saving.
          </Typography>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  halfWidth: {
    flex: 1,
  },
  input: {
    marginBottom: Spacing.sm,
  },
  warningBox: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FFC107',
  },
  warningText: {
    marginTop: Spacing.xs,
  },
});
