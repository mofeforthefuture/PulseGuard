import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Typography } from '../ui/Typography';
import { Input } from '../ui/Input';
import { Toggle } from '../ui/Toggle';
import { Spacing } from '../../lib/design/tokens';
import { useColors } from '../../lib/design/useColors';
import type { HospitalInput, Hospital } from '../../types/care';

interface HospitalFormProps {
  hospital?: Hospital | null;
  onSubmit: (input: HospitalInput) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function HospitalForm({
  hospital,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: HospitalFormProps) {
  const colors = useColors();
  const [hospitalName, setHospitalName] = useState(hospital?.hospital_name || '');
  const [phoneNumber, setPhoneNumber] = useState(hospital?.phone_number || '');
  const [patientCardId, setPatientCardId] = useState(hospital?.patient_card_id || '');
  const [isPrimary, setIsPrimary] = useState(hospital?.is_primary || false);
  const [address, setAddress] = useState(hospital?.address || '');
  const [notes, setNotes] = useState(hospital?.notes || '');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!hospitalName.trim()) {
      setError('Please enter hospital name');
      return;
    }

    if (!phoneNumber.trim()) {
      setError('Please enter phone number');
      return;
    }

    // Basic phone validation
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(phoneNumber)) {
      setError('Please enter a valid phone number');
      return;
    }

    setError(null);

    await onSubmit({
      hospital_name: hospitalName.trim(),
      phone_number: phoneNumber.trim(),
      patient_card_id: patientCardId.trim() || undefined,
      is_primary: isPrimary,
      address: address.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    // Reset form if creating new
    if (!hospital) {
      setHospitalName('');
      setPhoneNumber('');
      setPatientCardId('');
      setIsPrimary(false);
      setAddress('');
      setNotes('');
    }
  };

  return (
    <Card variant="calm">
      <Typography variant="h3" color="text" weight="semibold" style={styles.title}>
        {hospital ? 'Edit Hospital' : 'Add Hospital'}
      </Typography>
      <Typography variant="bodySmall" color="textSecondary" style={styles.subtitle}>
        Store hospital information for emergency use
      </Typography>

      <Input
        label="Hospital Name *"
        value={hospitalName}
        onChangeText={(text) => {
          setHospitalName(text);
          setError(null);
        }}
        placeholder="General Hospital"
        containerStyle={styles.input}
      />

      <Input
        label="Phone Number *"
        value={phoneNumber}
        onChangeText={(text) => {
          setPhoneNumber(text);
          setError(null);
        }}
        placeholder="+1234567890"
        keyboardType="phone-pad"
        containerStyle={styles.input}
      />

      <Input
        label="Patient Card / ID Number (Optional)"
        value={patientCardId}
        onChangeText={setPatientCardId}
        placeholder="Your hospital card number"
        containerStyle={styles.input}
      />

      <Input
        label="Address (Optional)"
        value={address}
        onChangeText={setAddress}
        placeholder="Hospital address"
        containerStyle={styles.input}
        multiline
      />

      <Input
        label="Notes (Optional)"
        value={notes}
        onChangeText={setNotes}
        placeholder="Additional notes"
        containerStyle={styles.input}
        multiline
      />

      <View style={styles.toggleContainer}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleLabel}>
            <Typography variant="body" color="text" weight="medium">
              Set as Primary Hospital
            </Typography>
            <Typography variant="caption" color="textSecondary" style={styles.toggleHelp}>
              Primary hospital info will be included in emergency messages
            </Typography>
          </View>
          <Toggle value={isPrimary} onValueChange={setIsPrimary} />
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
          title={isSubmitting ? 'Saving...' : hospital ? 'Update' : 'Save Hospital'}
          onPress={handleSubmit}
          disabled={isSubmitting || !hospitalName.trim() || !phoneNumber.trim()}
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
