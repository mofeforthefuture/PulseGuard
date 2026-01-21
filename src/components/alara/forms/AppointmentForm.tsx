/**
 * Appointment Form
 * Prefilled form for appointment data confirmation
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Input } from '../../ui/Input';
import { Typography } from '../../ui/Typography';
import { Spacing } from '../../../lib/design/tokens';
import type { AppointmentData } from '../ALARADataConfirmationSheet';

interface AppointmentFormProps {
  initialData: AppointmentData;
  onChange: (data: AppointmentData) => void;
}

export function AppointmentForm({ initialData, onChange }: AppointmentFormProps) {
  const [title, setTitle] = useState(initialData.title || '');
  const [scheduledAt, setScheduledAt] = useState(initialData.scheduledAt || '');
  const [notes, setNotes] = useState(initialData.notes || '');

  useEffect(() => {
    // Update parent when form changes
    const updated: AppointmentData = {
      ...initialData,
      title: title.trim() || undefined,
      scheduledAt: scheduledAt.trim() || undefined,
      notes: notes.trim() || undefined,
    };
    onChange(updated);
  }, [title, scheduledAt, notes]);

  // Format date for display
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <View style={styles.container}>
      <Typography variant="bodySmall" color="textSecondary" style={styles.sectionTitle}>
        Appointment Details
      </Typography>

      <Input
        label="Title"
        value={title}
        onChangeText={setTitle}
        placeholder="e.g., Annual checkup, Follow-up"
        containerStyle={styles.input}
        autoFocus={!title}
      />

      <Input
        label="Date (YYYY-MM-DD)"
        value={scheduledAt}
        onChangeText={setScheduledAt}
        placeholder="2024-01-20"
        containerStyle={styles.input}
        keyboardType="default"
      />

      {scheduledAt && (
        <View style={styles.helperText}>
          <Typography variant="caption" color="textSecondary">
            {formatDate(scheduledAt)}
          </Typography>
        </View>
      )}

      <Input
        label="Notes (optional)"
        value={notes}
        onChangeText={setNotes}
        placeholder="Additional details about the appointment"
        multiline
        numberOfLines={3}
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
    paddingLeft: Spacing.xs,
  },
});
