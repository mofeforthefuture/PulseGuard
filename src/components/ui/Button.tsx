import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Animated,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Colors,
  Spacing,
  BorderRadius,
  TouchTarget,
  Typography,
  Gradients,
  Shadows,
  Animation,
} from '../../lib/design/tokens';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'emergency' | 'outline' | 'calm' | 'reminder' | 'concern';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
  size = 'md',
  fullWidth = false,
}: ButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.96,
        useNativeDriver: true,
        ...Animation.spring,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.8,
        duration: Animation.fast,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        ...Animation.spring,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: Animation.fast,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = () => {
    if (!disabled && !loading) {
      onPress();
    }
  };

  const getGradient = () => {
    switch (variant) {
      case 'primary':
        return [Gradients.primary.start, Gradients.primary.end];
      case 'secondary':
        return [Gradients.secondary.start, Gradients.secondary.end];
      case 'emergency':
        return [Gradients.emergency.start, Gradients.emergency.end];
      case 'calm':
        return [Gradients.calm.start, Gradients.calm.end];
      case 'reminder':
        return [Gradients.reminder.start, Gradients.reminder.end];
      case 'concern':
        return [Gradients.concern.start, Gradients.concern.end];
      default:
        return [Gradients.primary.start, Gradients.primary.end];
    }
  };

  const getTextColor = () => {
    if (variant === 'outline') {
      return Colors.primary;
    }
    if (variant === 'calm' || variant === 'reminder' || variant === 'concern') {
      return Colors.text;
    }
    return '#FFFFFF';
  };

  const getShadow = () => {
    if (variant === 'emergency') return Shadows.emergency;
    if (variant === 'calm') return Shadows.calm;
    if (variant === 'reminder') return Shadows.reminder;
    if (variant === 'concern') return Shadows.concern;
    if (variant === 'primary' || variant === 'secondary') return Shadows.md;
    return {};
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          paddingVertical: Spacing.sm,
          paddingHorizontal: Spacing.md,
          minHeight: TouchTarget.min,
        };
      case 'lg':
        return {
          paddingVertical: Spacing.lg,
          paddingHorizontal: Spacing.xl,
          minHeight: TouchTarget.large,
        };
      default:
        return {
          paddingVertical: Spacing.md,
          paddingHorizontal: Spacing.lg,
          minHeight: TouchTarget.comfortable,
        };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return Typography.fontSize.sm;
      case 'lg':
        return Typography.fontSize.lg;
      default:
        return Typography.fontSize.md;
    }
  };

  const buttonContent = (
    <Animated.View
      style={[
        styles.button,
        getSizeStyles(),
        variant === 'outline' && styles.outline,
        disabled && styles.disabled,
        fullWidth && styles.fullWidth,
        getShadow(),
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
        style,
      ]}
    >
      {variant !== 'outline' && !disabled ? (
        <LinearGradient
          colors={getGradient()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            color={variant === 'outline' ? Colors.primary : getTextColor()}
            size="small"
          />
        ) : (
          <Text
            style={[
              styles.text,
              {
                fontSize: getFontSize(),
                color: disabled
                  ? variant === 'outline'
                    ? Colors.textDisabled
                    : getTextColor()
                  : getTextColor(),
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        )}
      </View>
    </Animated.View>
  );

  return (
    <TouchableOpacity
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={1}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading }}
    >
      {buttonContent}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: Typography.fontWeight.semibold,
    letterSpacing: Typography.letterSpacing.normal,
  },
});
