import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import {
  Colors,
  Gradients,
  Spacing,
  BorderRadius,
  Shadows,
} from '../../lib/design/tokens';
import { LocationCircleWithContacts } from '../../types/location';
import { Hospital } from '../../types/care';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface EmergencySOSFlowProps {
  onCancel: () => void;
  onActivate: () => void;
  userLocation?: { latitude: number; longitude: number };
  primaryHospital?: Hospital | null;
}

export function EmergencySOSFlow({
  onCancel,
  onActivate,
  userLocation,
  primaryHospital,
}: EmergencySOSFlowProps) {
  const [countdown, setCountdown] = useState(5);
  const [isActivating, setIsActivating] = useState(false);
  const countdownAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Countdown timer
  useEffect(() => {
    if (countdown > 0 && !isActivating) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
        
        // Pulse animation on each countdown
        Animated.sequence([
          Animated.timing(countdownAnim, {
            toValue: 1.2,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(countdownAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }, 1000);

      return () => clearTimeout(timer);
    } else if (countdown === 0 && !isActivating) {
      setIsActivating(true);
      onActivate();
    }
  }, [countdown, isActivating, onActivate, countdownAnim]);

  // Continuous pulse animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [pulseAnim]);

  const locationText = userLocation
    ? `https://maps.google.com/?q=${userLocation.latitude},${userLocation.longitude}`
    : 'Location unavailable';

  return (
    <View style={styles.container}>
      {/* Full-screen gradient background */}
      <LinearGradient
        colors={[Gradients.emergency.start, Gradients.emergency.end, Colors.emergencyDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Overlay */}
      <View style={styles.overlay} />

      {/* Content */}
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Typography variant="display" color="text" weight="bold" style={styles.title}>
            EMERGENCY SOS
          </Typography>
          <Typography variant="body" color="text" style={styles.subtitle}>
            Activating in {countdown} seconds...
          </Typography>
        </View>

        {/* Countdown Display */}
        <View style={styles.countdownContainer}>
          <Animated.View
            style={[
              styles.countdownCircle,
              {
                transform: [{ scale: countdownAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={[Colors.emergency, Colors.emergencyDark]}
              style={styles.countdownGradient}
            >
              <Typography variant="hero" color="text" weight="bold" style={styles.countdownText}>
                {countdown}
              </Typography>
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Information Cards */}
        <View style={styles.infoContainer}>
          {/* Location Sharing */}
          <Card variant="gradient" padding="md" style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Typography variant="h2" style={styles.infoIcon}>
                📍
              </Typography>
              <View style={styles.infoContent}>
                <Typography variant="body" color="text" weight="semibold">
                  Sharing Location
                </Typography>
                <Typography variant="bodySmall" color="textSecondary" style={styles.infoDetail}>
                  {locationText}
                </Typography>
              </View>
            </View>
          </Card>

          {/* Hospital Information */}
          {primaryHospital && (
            <Card variant="gradient" padding="md" style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Typography variant="h2" style={styles.infoIcon}>
                  🏥
                </Typography>
                <View style={styles.infoContent}>
                  <Typography variant="body" color="text" weight="semibold">
                    {primaryHospital.hospital_name}
                  </Typography>
                  <Typography variant="bodySmall" color="textSecondary" style={styles.infoDetail}>
                    Phone: {primaryHospital.phone_number}
                  </Typography>
                  {primaryHospital.patient_card_id && (
                    <Typography variant="bodySmall" color="textSecondary" style={styles.infoDetail}>
                      Patient ID: {primaryHospital.patient_card_id}
                    </Typography>
                  )}
                </View>
              </View>
            </Card>
          )}

          {/* Patient ID (if no hospital but has patient ID) */}
          {!primaryHospital && primaryHospital?.patient_card_id && (
            <Card variant="gradient" padding="md" style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Typography variant="h2" style={styles.infoIcon}>
                  🆔
                </Typography>
                <View style={styles.infoContent}>
                  <Typography variant="body" color="text" weight="semibold">
                    Patient ID
                  </Typography>
                  <Typography variant="bodySmall" color="textSecondary" style={styles.infoDetail}>
                    {primaryHospital.patient_card_id}
                  </Typography>
                </View>
              </View>
            </Card>
          )}
        </View>

        {/* Cancel Button */}
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <Animated.View
            style={[
              styles.cancelButtonInner,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <Typography variant="body" color="text" weight="semibold">
              Cancel
            </Typography>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  content: {
    flex: 1,
    padding: Spacing.xl,
    paddingTop: Spacing.xxxl,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: Spacing.xxl,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.sm,
    letterSpacing: 4,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.9,
  },
  countdownContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.xxl,
  },
  countdownCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        ...Shadows.xl,
        shadowColor: Colors.emergency,
        shadowOpacity: 0.8,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  countdownGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownText: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
  infoContainer: {
    gap: Spacing.md,
  },
  infoCard: {
    marginBottom: Spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: Spacing.md,
    fontSize: 32,
  },
  infoContent: {
    flex: 1,
  },
  infoDetail: {
    marginTop: Spacing.xs / 2,
  },
  cancelButton: {
    alignSelf: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  cancelButtonInner: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
});
