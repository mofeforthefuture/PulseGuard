import React from 'react';
import { TextInput, StyleSheet, View, ViewStyle, TextInputProps } from 'react-native';
import { Typography } from './Typography';
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography as TypographyTokens,
  Shadows,
} from '../../lib/design/tokens';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  variant?: 'default' | 'elevated';
}

export function Input({
  label,
  error,
  containerStyle,
  style,
  variant = 'default',
  ...props
}: InputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Typography variant="label" color="text" style={styles.label}>
          {label}
        </Typography>
      )}
      <TextInput
        style={[
          styles.input,
          variant === 'elevated' && styles.inputElevated,
          error && styles.inputError,
          style,
        ]}
        placeholderTextColor={Colors.textLight}
        {...props}
      />
      {error && (
        <Typography variant="caption" color="error" style={styles.errorText}>
          {error}
        </Typography>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    marginBottom: Spacing.xs,
  },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    fontSize: TypographyTokens.fontSize.md,
    color: Colors.text,
    backgroundColor: Colors.surface,
    fontFamily: TypographyTokens.fontFamily.regular,
  },
  inputElevated: {
    ...Shadows.sm,
    borderColor: Colors.borderLight,
  },
  inputError: {
    borderColor: Colors.error,
    borderWidth: 2,
  },
  errorText: {
    marginTop: Spacing.xs,
  },
});
