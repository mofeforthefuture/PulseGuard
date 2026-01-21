import React, { useState } from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Typography } from '../ui/Typography';
import { Input } from '../ui/Input';
import { Spacing } from '../../lib/design/tokens';
import { useColors } from '../../lib/design/useColors';
import { parseRecommendationToDate, formatRecommendation, getDateDescription } from '../../lib/services/recommendationParser';
import type { DoctorVisitReminderInput } from '../../types/care';

interface DoctorVisitReminderFormProps {
  onSubmit: (input: DoctorVisitReminderInput) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function DoctorVisitReminderForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
}: DoctorVisitReminderFormProps) {
  const colors = useColors();
  const [doctorName, setDoctorName] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [previewDate, setPreviewDate] = useState<Date | null>(null);

  const handleRecommendationChange = (text: string) => {
    setRecommendation(text);
    setError(null);

    // Parse and preview the date
    if (text.trim().length > 0) {
      const baseDate = visitDate ? new Date(visitDate) : new Date();
      const parsedDate = parseRecommendationToDate(text, baseDate);
      setPreviewDate(parsedDate);
      
      if (!parsedDate && text.trim().length > 5) {
        // Only show error if text is substantial and can't be parsed
        setError('Could not parse recommendation. Try formats like "Return in 2 weeks" or "Come back in 1 month"');
      } else {
        setError(null);
      }
    } else {
      setPreviewDate(null);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!doctorName.trim()) {
      setError('Please enter doctor name');
      return;
    }

    if (!recommendation.trim()) {
      setError('Please enter the doctor\'s recommendation');
      return;
    }

    const baseDate = visitDate ? new Date(visitDate) : new Date();
    const parsedDate = parseRecommendationToDate(recommendation, baseDate);

    if (!parsedDate) {
      setError('Could not parse recommendation. Try formats like "Return in 2 weeks" or "Come back in 1 month"');
      return;
    }

    setError(null);

    await onSubmit({
      doctor_name: doctorName.trim(),
      recommendation_text: recommendation.trim(),
      visit_date: visitDate || undefined,
      notes: notes.trim() || undefined,
    });

    // Reset form
    setDoctorName('');
    setRecommendation('');
    setVisitDate('');
    setNotes('');
    setPreviewDate(null);
  };

  return (
    <Card variant="calm">
      <Typography variant="h3" color="text" weight="semibold" style={styles.title}>
        Doctor Visit Reminder
      </Typography>
      <Typography variant="bodySmall" color="textSecondary" style={styles.subtitle}>
        Enter your doctor's recommendation to create a reminder
      </Typography>

      <Input
        label="Doctor Name"
        value={doctorName}
        onChangeText={setDoctorName}
        placeholder="Dr. Smith"
        containerStyle={styles.input}
      />

      <Input
        label="Doctor's Recommendation"
        value={recommendation}
        onChangeText={handleRecommendationChange}
        placeholder="Return in 2 weeks"
        containerStyle={styles.input}
        multiline
      />

      {previewDate && (
        <View style={[styles.previewCard, { backgroundColor: colors.calm + '40' }]}>
          <Typography variant="caption" color="textSecondary" style={styles.previewLabel}>
            Reminder Date
          </Typography>
          <Typography variant="body" color="text" weight="semibold">
            {previewDate.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Typography>
          <Typography variant="caption" color="textSecondary" style={styles.previewDescription}>
            {getDateDescription(previewDate)}
          </Typography>
        </View>
      )}

      <Input
        label="Visit Date (Optional)"
        value={visitDate}
        onChangeText={setVisitDate}
        placeholder="YYYY-MM-DD"
        containerStyle={styles.input}
      />

      <Input
        label="Notes (Optional)"
        value={notes}
        onChangeText={setNotes}
        placeholder="Additional notes from the visit"
        containerStyle={styles.input}
        multiline
      />

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
          title={isSubmitting ? 'Saving...' : 'Save Reminder'}
          onPress={handleSubmit}
          disabled={isSubmitting || !doctorName.trim() || !recommendation.trim() || !previewDate}
          style={[styles.button, onCancel ? styles.buttonHalf : styles.buttonFull]}
        />
      </View>
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
  input: {
    marginBottom: Spacing.sm,
  },
  previewCard: {
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.md,
  },
  previewLabel: {
    marginBottom: Spacing.xs / 2,
  },
  previewDescription: {
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
