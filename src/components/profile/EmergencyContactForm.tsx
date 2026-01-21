import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Spacing, BorderRadius } from '../../lib/design/tokens';
import { useColors } from '../../lib/design/useColors';
import { supabase } from '../../lib/supabase/client';
import { useAuth } from '../../context/AuthContext';

interface EmergencyContactFormProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  contact?: {
    name: string;
    phone: string;
  } | null;
}

export function EmergencyContactForm({
  visible,
  onClose,
  onSave,
  contact,
}: EmergencyContactFormProps) {
  const { user } = useAuth();
  const colors = useColors();
  const [name, setName] = useState(contact?.name || '');
  const [phone, setPhone] = useState(contact?.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setName(contact?.name || '');
      setPhone(contact?.phone || '');
      setError(null);
    }
  }, [visible, contact]);

  const validatePhone = (phoneNumber: string): boolean => {
    // Basic phone validation - allows various formats
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phoneNumber) && phoneNumber.replace(/\D/g, '').length >= 10;
  };

  const handleSave = async () => {
    if (!user?.id) {
      setError('Please log in to save contacts');
      return;
    }

    if (!name.trim()) {
      setError('Please enter a contact name');
      return;
    }

    if (!phone.trim()) {
      setError('Please enter a phone number');
      return;
    }

    if (!validatePhone(phone)) {
      setError('Please enter a valid phone number');
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          emergency_contact_name: name.trim(),
          emergency_contact_phone: phone.trim(),
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      onSave();
      onClose();
    } catch (err: any) {
      console.error('Error saving emergency contact:', err);
      setError(err.message || 'Failed to save contact. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!user?.id) return;

    Alert.alert(
      'Delete Emergency Contact?',
      'Are you sure you want to remove this emergency contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('profiles')
                .update({
                  emergency_contact_name: null,
                  emergency_contact_phone: null,
                })
                .eq('id', user.id);

              if (error) throw error;

              onSave();
              onClose();
            } catch (err: any) {
              console.error('Error deleting contact:', err);
              Alert.alert('Error', 'Failed to delete contact. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Typography variant="h2" color="text" weight="bold" style={styles.title}>
        {contact ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
      </Typography>
      <Typography variant="bodySmall" color="textSecondary" style={styles.subtitle}>
        This contact will be notified in emergency situations
      </Typography>

      <Input
        label="Contact Name *"
        value={name}
        onChangeText={(text) => {
          setName(text);
          setError(null);
        }}
        placeholder="e.g., John Doe"
        containerStyle={styles.input}
        autoCapitalize="words"
      />

      <Input
        label="Phone Number *"
        value={phone}
        onChangeText={(text) => {
          setPhone(text);
          setError(null);
        }}
        placeholder="e.g., +1 (555) 123-4567"
        keyboardType="phone-pad"
        containerStyle={styles.input}
      />

      {error && (
        <Typography variant="bodySmall" color="error" style={styles.error}>
          {error}
        </Typography>
      )}

      <View style={styles.buttons}>
        {contact && (
          <Button
            title="Delete"
            onPress={handleDelete}
            variant="outline"
            style={[styles.button, styles.deleteButton]}
          />
        )}
        <Button
          title="Cancel"
          onPress={onClose}
          variant="outline"
          style={[styles.button, contact ? styles.buttonHalf : styles.buttonFull]}
        />
        <Button
          title={isSaving ? 'Saving...' : 'Save'}
          onPress={handleSave}
          disabled={isSaving || !name.trim() || !phone.trim()}
          style={[styles.button, contact ? styles.buttonHalf : styles.buttonFull]}
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
    marginBottom: Spacing.xs,
  },
  subtitle: {
    marginBottom: Spacing.lg,
  },
  input: {
    marginBottom: Spacing.md,
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
  buttonFull: {
    flex: 1,
  },
  deleteButton: {
    borderColor: '#FF4757',
  },
});
