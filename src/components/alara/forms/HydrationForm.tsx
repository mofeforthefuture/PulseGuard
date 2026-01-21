/**
 * Hydration Form
 * Prefilled form for hydration data confirmation
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Input } from '../../ui/Input';
import { Typography } from '../../ui/Typography';
import { Spacing } from '../../../lib/design/tokens';
import type { HydrationData } from '../ALARADataConfirmationSheet';

interface HydrationFormProps {
  initialData: HydrationData;
  onChange: (data: HydrationData) => void;
}

export function HydrationForm({ initialData, onChange }: HydrationFormProps) {
  const [amount, setAmount] = useState(initialData.amount?.toString() || '');
  const [notes, setNotes] = useState(initialData.notes || '');

  useEffect(() => {
    // Update parent when form changes
    const updated: HydrationData = {
      ...initialData,
      amount: amount ? parseInt(amount, 10) : undefined,
      notes: notes.trim() || undefined,
    };
    onChange(updated);
  }, [amount, notes]);

  return (
    <View style={styles.container}>
      <Typography variant="bodySmall" color="textSecondary" style={styles.sectionTitle}>
        Hydration Intake
      </Typography>

      <Input
        label="Amount (ml)"
        value={amount}
        onChangeText={(text) => setAmount(text.replace(/[^0-9]/g, ''))}
        keyboardType="number-pad"
        placeholder="500"
        containerStyle={styles.input}
        autoFocus={!amount}
      />

      <View style={styles.helperText}>
        <Typography variant="caption" color="textSecondary">
          Common amounts: 250ml (glass), 500ml (bottle), 1000ml (liter)
        </Typography>
      </View>

      <Input
        label="Notes (optional)"
        value={notes}
        onChangeText={setNotes}
        placeholder="e.g., after workout, with breakfast"
        multiline
        numberOfLines={2}
        containerStyle={styles.input}
      />
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
  input: {
    marginBottom: Spacing.sm,
  },
  helperText: {
    marginTop: -Spacing.xs,
    marginBottom: Spacing.md,
  },
});
