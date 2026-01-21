/**
 * ALARA Data Confirmation Bottom Sheet
 * Handles chat-to-bottom-sheet handoff for structured data
 * Prefills fields and requires user confirmation before save
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Keyboard } from 'react-native';
import { BottomSheet } from '../ui/BottomSheet';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Spacing } from '../../lib/design/tokens';
import { useColors } from '../../lib/design/useColors';
import { BloodPressureForm } from './forms/BloodPressureForm';
import { HydrationForm } from './forms/HydrationForm';
import { AppointmentForm } from './forms/AppointmentForm';

export type DataType = 'blood_pressure' | 'hydration' | 'appointment';

export interface BaseDataConfirmation {
  type: DataType;
  source?: string; // Original user message or extraction source
}

export interface BloodPressureData extends BaseDataConfirmation {
  type: 'blood_pressure';
  systolic?: number;
  diastolic?: number;
  pulse?: number;
  position?: 'sitting' | 'standing' | 'lying' | 'other';
  notes?: string;
  isUnusual?: boolean;
  abnormalReason?: string;
}

export interface HydrationData extends BaseDataConfirmation {
  type: 'hydration';
  amount?: number; // ml
  notes?: string;
}

export interface AppointmentData extends BaseDataConfirmation {
  type: 'appointment';
  title?: string;
  scheduledAt?: string; // ISO date string
  notes?: string;
  reminderType?: 'medication' | 'check_in' | 'appointment' | 'general';
}

export type DataConfirmation = BloodPressureData | HydrationData | AppointmentData;

interface ALARADataConfirmationSheetProps {
  visible: boolean;
  data: DataConfirmation | null;
  onConfirm: (confirmedData: DataConfirmation) => Promise<void>;
  onCancel: () => void;
}

export function ALARADataConfirmationSheet({
  visible,
  data,
  onConfirm,
  onCancel,
}: ALARADataConfirmationSheetProps) {
  const colors = useColors();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<DataConfirmation | null>(null);

  // Initialize form data when sheet opens
  useEffect(() => {
    if (visible && data) {
      setFormData(data);
      // Dismiss keyboard when sheet opens
      Keyboard.dismiss();
    }
  }, [visible, data]);

  const handleConfirm = async () => {
    if (!formData) return;

    setIsSubmitting(true);
    Keyboard.dismiss();

    try {
      await onConfirm(formData);
    } catch (error) {
      console.error('[ALARA] Error confirming data:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    Keyboard.dismiss();
    onCancel();
  };

  if (!data) return null;

  const renderForm = () => {
    switch (data.type) {
      case 'blood_pressure':
        return (
          <BloodPressureForm
            initialData={data as BloodPressureData}
            onChange={(updated) => setFormData(updated)}
          />
        );
      case 'hydration':
        return (
          <HydrationForm
            initialData={data as HydrationData}
            onChange={(updated) => setFormData(updated)}
          />
        );
      case 'appointment':
        return (
          <AppointmentForm
            initialData={data as AppointmentData}
            onChange={(updated) => setFormData(updated)}
          />
        );
      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (data.type) {
      case 'blood_pressure':
        return 'Confirm Blood Pressure';
      case 'hydration':
        return 'Confirm Hydration';
      case 'appointment':
        return 'Confirm Appointment';
      default:
        return 'Confirm Information';
    }
  };

  const getSubtitle = () => {
    if (data.source) {
      return `ALARA extracted this from: "${data.source.substring(0, 50)}${data.source.length > 50 ? '...' : ''}"`;
    }
    return 'Please review and confirm the information';
  };

  return (
    <BottomSheet visible={visible} onClose={handleCancel} height="85%">
      <View style={styles.container}>
        <View style={styles.header}>
          <Typography variant="h2" color="text" weight="bold" style={styles.title}>
            {getTitle()}
          </Typography>
          <Typography variant="bodySmall" color="textSecondary" style={styles.subtitle}>
            {getSubtitle()}
          </Typography>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {renderForm()}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="Cancel"
            onPress={handleCancel}
            variant="outline"
            style={[styles.button, styles.cancelButton]}
            disabled={isSubmitting}
          />
          <Button
            title="Confirm & Save"
            onPress={handleConfirm}
            style={[styles.button, styles.confirmButton]}
            loading={isSubmitting}
            disabled={isSubmitting}
          />
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  subtitle: {
    marginBottom: Spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  button: {
    flex: 1,
  },
  cancelButton: {
    // Additional styles if needed
  },
  confirmButton: {
    // Additional styles if needed
  },
});
