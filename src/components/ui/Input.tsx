import React from 'react';
import { TextInput, StyleSheet, View, ViewStyle, TextInputProps } from 'react-native';
import { Typography } from './Typography';
import {
  Spacing,
  BorderRadius,
  Typography as TypographyTokens,
  Shadows,
} from '../../lib/design/tokens';
import { useColors } from '../../lib/design/useColors';

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
  const colors = useColors();
  
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
          {
            borderColor: error ? colors.error : colors.border,
            color: colors.text,
            backgroundColor: colors.surface,
          },
          variant === 'elevated' && { borderColor: colors.borderLight },
          error && { borderColor: colors.error, borderWidth: 2 },
          style,
        ]}
        placeholderTextColor={colors.textLight}
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
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    fontSize: TypographyTokens.fontSize.md,
    fontFamily: TypographyTokens.fontFamily.regular,
  },
  inputElevated: {
    ...Shadows.sm,
  },
  errorText: {
    marginTop: Spacing.xs,
  },
});
