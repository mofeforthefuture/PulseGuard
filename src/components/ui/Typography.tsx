import React from 'react';
import { Text, StyleSheet, TextStyle, TextProps } from 'react-native';
import { Typography as TypographyTokens } from '../../lib/design/tokens';
import { useColors } from '../../lib/design/useColors';

interface TypographyProps extends TextProps {
  variant?:
    | 'hero'
    | 'display'
    | 'h1'
    | 'h2'
    | 'h3'
    | 'h4'
    | 'body'
    | 'bodySmall'
    | 'caption'
    | 'label';
  color?: 'primary' | 'secondary' | 'text' | 'textSecondary' | 'textLight' | 'error' | 'success' | 'warning';
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right';
  style?: TextStyle;
  children: React.ReactNode;
}

export function Typography({
  variant = 'body',
  color = 'text',
  weight = 'regular',
  align = 'left',
  style,
  children,
  ...props
}: TypographyProps) {
  const colors = useColors();
  
  const getVariantStyles = (): TextStyle => {
    switch (variant) {
      case 'hero':
        return {
          fontSize: TypographyTokens.fontSize.hero,
          lineHeight: TypographyTokens.lineHeight.hero,
          fontWeight: TypographyTokens.fontWeight.bold,
          letterSpacing: TypographyTokens.letterSpacing.tight,
        };
      case 'display':
        return {
          fontSize: TypographyTokens.fontSize.display,
          lineHeight: TypographyTokens.lineHeight.display,
          fontWeight: TypographyTokens.fontWeight.bold,
          letterSpacing: TypographyTokens.letterSpacing.tight,
        };
      case 'h1':
        return {
          fontSize: TypographyTokens.fontSize.xxxl,
          lineHeight: TypographyTokens.lineHeight.xxxl,
          fontWeight: TypographyTokens.fontWeight.bold,
          letterSpacing: TypographyTokens.letterSpacing.normal,
        };
      case 'h2':
        return {
          fontSize: TypographyTokens.fontSize.xxl,
          lineHeight: TypographyTokens.lineHeight.xxl,
          fontWeight: TypographyTokens.fontWeight.semibold,
          letterSpacing: TypographyTokens.letterSpacing.normal,
        };
      case 'h3':
        return {
          fontSize: TypographyTokens.fontSize.xl,
          lineHeight: TypographyTokens.lineHeight.xl,
          fontWeight: TypographyTokens.fontWeight.semibold,
          letterSpacing: TypographyTokens.letterSpacing.normal,
        };
      case 'h4':
        return {
          fontSize: TypographyTokens.fontSize.lg,
          lineHeight: TypographyTokens.lineHeight.lg,
          fontWeight: TypographyTokens.fontWeight.medium,
          letterSpacing: TypographyTokens.letterSpacing.normal,
        };
      case 'body':
        return {
          fontSize: TypographyTokens.fontSize.md,
          lineHeight: TypographyTokens.lineHeight.md,
          fontWeight: TypographyTokens.fontWeight.regular,
          letterSpacing: TypographyTokens.letterSpacing.normal,
        };
      case 'bodySmall':
        return {
          fontSize: TypographyTokens.fontSize.sm,
          lineHeight: TypographyTokens.lineHeight.sm,
          fontWeight: TypographyTokens.fontWeight.regular,
          letterSpacing: TypographyTokens.letterSpacing.normal,
        };
      case 'caption':
        return {
          fontSize: TypographyTokens.fontSize.xs,
          lineHeight: TypographyTokens.lineHeight.xs,
          fontWeight: TypographyTokens.fontWeight.regular,
          letterSpacing: TypographyTokens.letterSpacing.wide,
        };
      case 'label':
        return {
          fontSize: TypographyTokens.fontSize.sm,
          lineHeight: TypographyTokens.lineHeight.sm,
          fontWeight: TypographyTokens.fontWeight.medium,
          letterSpacing: TypographyTokens.letterSpacing.normal,
        };
      default:
        return {
          fontSize: TypographyTokens.fontSize.md,
          lineHeight: TypographyTokens.lineHeight.md,
          fontWeight: TypographyTokens.fontWeight.regular,
        };
    }
  };

  const getColor = (): string => {
    switch (color) {
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.secondary;
      case 'text':
        return colors.text;
      case 'textSecondary':
        return colors.textSecondary;
      case 'textLight':
        return colors.textLight;
      case 'error':
        return colors.error;
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      default:
        return colors.text;
    }
  };

  const getWeight = (): TextStyle['fontWeight'] => {
    switch (weight) {
      case 'regular':
        return TypographyTokens.fontWeight.regular;
      case 'medium':
        return TypographyTokens.fontWeight.medium;
      case 'semibold':
        return TypographyTokens.fontWeight.semibold;
      case 'bold':
        return TypographyTokens.fontWeight.bold;
      default:
        return TypographyTokens.fontWeight.regular;
    }
  };

  return (
    <Text
      style={[
        styles.base,
        getVariantStyles(),
        {
          color: getColor(),
          fontWeight: getWeight(),
          textAlign: align,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: TypographyTokens.fontFamily.regular,
  },
});
