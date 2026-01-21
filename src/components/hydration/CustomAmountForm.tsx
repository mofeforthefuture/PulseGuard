import React, { useState } from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Spacing } from '../../lib/design/tokens';
import { useColors } from '../../lib/design/useColors';

interface CustomAmountFormProps {
  onSave: (amount: number) => void;
  onCancel: () => void;
}

export function CustomAmountForm({ onSave, onCancel }: CustomAmountFormProps) {
  const colors = useColors();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    const numAmount = parseInt(amount, 10);
    
    if (!amount.trim()) {
      setError('Please enter an amount');
      return;
    }

    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (numAmount > 5000) {
      setError('Amount cannot exceed 5000ml');
      return;
    }

    setError(null);
    onSave(numAmount);
  };

  return (
    <View style={styles.container}>
      <Typography variant="h2" color="text" weight="bold" style={styles.title}>
        Custom Amount
      </Typography>
      <Typography variant="bodySmall" color="textSecondary" style={styles.subtitle}>
        Enter the amount of water you drank (in ml)
      </Typography>

      <Input
        label="Amount (ml)"
        value={amount}
        onChangeText={(text) => {
          setAmount(text.replace(/[^0-9]/g, ''));
          setError(null);
        }}
        keyboardType="number-pad"
        placeholder="e.g., 300"
        containerStyle={styles.input}
        autoFocus
      />

      {error && (
        <Typography variant="bodySmall" color="error" style={styles.error}>
          {error}
        </Typography>
      )}

      <View style={styles.buttons}>
        <Button
          title="Cancel"
          onPress={onCancel}
          variant="outline"
          style={[styles.button, styles.buttonHalf]}
        />
        <Button
          title="Add"
          onPress={handleSave}
          disabled={!amount.trim()}
          style={[styles.button, styles.buttonHalf]}
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
    marginBottom: Spacing.sm,
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
});
