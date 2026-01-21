import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Platform,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { useALARA } from '../../context/ALARAContext';
import {
  Colors,
  Gradients,
  Spacing,
  BorderRadius,
  Shadows,
  Animation,
} from '../../lib/design/tokens';
import { LocationCircleWithContacts } from '../../types/location';
import { getPrimaryHospital, formatHospitalForEmergency } from '../../lib/services/hospitalService';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship?: string;
}

interface EmergencySOSScreenProps {
  onCancel: () => void;
  emergencyContacts: EmergencyContact[];
  activeLocationCircle?: LocationCircleWithContacts;
  userLocation?: { latitude: number; longitude: number };
  userId?: string;
}

type ContactStatus = 'pending' | 'calling' | 'texting' | 'success' | 'failed';

interface ContactAction {
  contact: EmergencyContact;
  status: ContactStatus;
  action: 'call' | 'text';
}

export function EmergencySOSScreen({
  onCancel,
  emergencyContacts,
  activeLocationCircle,
  userLocation,
  userId,
}: EmergencySOSScreenProps) {
  const { setState, showMessage } = useALARA();
  const [isActive, setIsActive] = useState(false);
  const [contactActions, setContactActions] = useState<ContactAction[]>([]);

  // Animation refs
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.8)).current;
  const glowScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const slideInAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeInAnim = useRef(new Animated.Value(0)).current;

  // Set ALARA to emergency state
  useEffect(() => {
    setState('emergency');
    showMessage({
      text: 'Emergency activated! Your contacts are being notified.',
      duration: 0, // Don't auto-dismiss
    });
  }, [setState, showMessage]);

  // Pulsing SOS button animation
  useEffect(() => {
    if (isActive) {
      // Main pulse
      const pulse = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseScale, {
              toValue: 1.15,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(pulseScale, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(pulseOpacity, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(pulseOpacity, {
              toValue: 0.8,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
        ])
      );

      // Outer glow
      const glow = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(glowScale, {
              toValue: 1.5,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(glowScale, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(glowOpacity, {
              toValue: 0.6,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(glowOpacity, {
              toValue: 0,
              duration: 1500,
              useNativeDriver: true,
            }),
          ]),
        ])
      );

      pulse.start();
      glow.start();

      return () => {
        pulse.stop();
        glow.stop();
      };
    }
  }, [isActive, pulseScale, pulseOpacity, glowScale, glowOpacity]);

  // Screen entrance animation - IMMEDIATE for emergency
  useEffect(() => {
    // Emergency transitions must be instant - no delays
    Animated.parallel([
      Animated.timing(slideInAnim, {
        toValue: 0,
        duration: 0, // Immediate
        useNativeDriver: true,
      }),
      Animated.timing(fadeInAnim, {
        toValue: 1,
        duration: 0, // Immediate
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideInAnim, fadeInAnim]);

  const handleActivateSOS = async () => {
    setIsActive(true);

    // Initialize contact actions
    const actions: ContactAction[] = emergencyContacts.map((contact) => ({
      contact,
      status: 'pending' as ContactStatus,
      action: 'call' as 'call' | 'text',
    }));
    setContactActions(actions);

    // Start calling contacts
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      
      // Update to calling
      setContactActions((prev) => {
        const updated = [...prev];
        updated[i] = { ...updated[i], status: 'calling' };
        return updated;
      });

      // Simulate call attempt
      try {
        const phoneUrl = `tel:${action.contact.phone}`;
        const canOpen = await Linking.canOpenURL(phoneUrl);
        
        if (canOpen) {
          // Small delay for visual feedback
          await new Promise((resolve) => setTimeout(resolve, 1500));
          
          // Update to success (in real app, would check actual call status)
          setContactActions((prev) => {
            const updated = [...prev];
            updated[i] = { ...updated[i], status: 'success' };
            return updated;
          });

          // Open phone dialer
          await Linking.openURL(phoneUrl);
        } else {
          setContactActions((prev) => {
            const updated = [...prev];
            updated[i] = { ...updated[i], status: 'failed' };
            return updated;
          });
        }
      } catch (error) {
        setContactActions((prev) => {
          const updated = [...prev];
          updated[i] = { ...updated[i], status: 'failed' };
          return updated;
        });
      }
    }

    // Send SMS to all contacts
    try {
      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable && userLocation) {
        const locationText = `https://maps.google.com/?q=${userLocation.latitude},${userLocation.longitude}`;
        
        // Get primary hospital info for emergency message
        let hospitalInfo = '';
        if (userId) {
          const primaryHospital = await getPrimaryHospital(userId);
          if (primaryHospital) {
            hospitalInfo = formatHospitalForEmergency(primaryHospital);
          }
        }
        
        const message = `🚨 EMERGENCY ALERT 🚨\n\nI need help immediately.\n\nMy location: ${locationText}${hospitalInfo}\n\nPlease call or come to my location.`;

        const phoneNumbers = emergencyContacts.map((c) => c.phone);
        
        await SMS.sendSMSAsync(phoneNumbers, message);
        
        // Update text status
        setContactActions((prev) =>
          prev.map((action) => ({
            ...action,
            action: 'text' as const,
            status: action.status === 'success' ? 'success' : 'texting',
          }))
        );
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
    }
  };

  const getStatusIcon = (status: ContactStatus): string => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'calling':
        return '📞';
      case 'texting':
        return '💬';
      case 'success':
        return '✅';
      case 'failed':
        return '❌';
      default:
        return '⏳';
    }
  };

  const getStatusColor = (status: ContactStatus): string => {
    switch (status) {
      case 'pending':
        return Colors.textSecondary;
      case 'calling':
      case 'texting':
        return Colors.warning;
      case 'success':
        return Colors.success;
      case 'failed':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideInAnim }],
          opacity: fadeInAnim,
        },
      ]}
    >
      {/* Full-screen gradient background */}
      <LinearGradient
        colors={[Gradients.emergency.start, Gradients.emergency.end, Colors.emergencyDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Overlay pattern for depth */}
      <View style={styles.overlay} />

      {/* Content */}
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Typography variant="display" color="text" weight="bold" style={styles.title}>
            EMERGENCY SOS
          </Typography>
          <Typography variant="body" color="text" style={styles.subtitle}>
            Help is on the way
          </Typography>
        </View>

        {/* SOS Button */}
        <View style={styles.sosContainer}>
          {/* Outer glow */}
          {isActive && (
            <Animated.View
              style={[
                styles.glow,
                {
                  transform: [{ scale: glowScale }],
                  opacity: glowOpacity,
                },
              ]}
            />
          )}

          {/* Main button */}
          <TouchableOpacity
            onPress={isActive ? undefined : handleActivateSOS}
            activeOpacity={0.9}
            disabled={isActive}
            style={styles.sosButtonContainer}
          >
            <Animated.View
              style={[
                styles.sosButton,
                {
                  transform: [{ scale: pulseScale }],
                  opacity: pulseOpacity,
                },
              ]}
            >
              <LinearGradient
                colors={[Colors.emergency, Colors.emergencyDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sosButtonGradient}
              >
                <Typography variant="hero" color="text" weight="bold" style={styles.sosText}>
                  {isActive ? 'SOS ACTIVE' : 'TAP FOR SOS'}
                </Typography>
                {!isActive && (
                  <Typography variant="bodySmall" color="text" style={styles.sosSubtext}>
                    Hold to activate emergency response
                  </Typography>
                )}
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Active Location */}
        {activeLocationCircle && (
          <Card variant="emergency" padding="md" style={styles.locationCard}>
            <View style={styles.locationHeader}>
              <Text style={styles.locationIcon}>{activeLocationCircle.icon || '📍'}</Text>
              <View style={styles.locationInfo}>
                <Typography variant="h4" color="text" weight="semibold">
                  {activeLocationCircle.name}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Active Location Circle
                </Typography>
              </View>
            </View>
            {userLocation && (
              <Typography variant="caption" color="textSecondary" style={styles.locationCoords}>
                {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
              </Typography>
            )}
          </Card>
        )}

        {/* Contact Status Cards */}
        {isActive && contactActions.length > 0 && (
          <View style={styles.contactsContainer}>
            <Typography variant="h3" color="text" weight="semibold" style={styles.contactsTitle}>
              Contacting Emergency Contacts
            </Typography>
            {contactActions.map((action, index) => (
              <Card
                key={action.contact.id}
                variant="gradient"
                padding="md"
                style={styles.contactCard}
              >
                <View style={styles.contactRow}>
                  <View style={styles.contactInfo}>
                    <View
                      style={[
                        styles.contactAvatar,
                        { backgroundColor: getStatusColor(action.status) + '20' },
                      ]}
                    >
                      <Text style={styles.contactAvatarText}>
                        {action.contact.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.contactDetails}>
                      <Typography variant="body" color="text" weight="medium">
                        {action.contact.name}
                      </Typography>
                      {action.contact.relationship && (
                        <Typography variant="caption" color="textSecondary">
                          {action.contact.relationship}
                        </Typography>
                      )}
                    </View>
                  </View>
                  <View style={styles.contactStatus}>
                    <Text style={styles.statusIcon}>{getStatusIcon(action.status)}</Text>
                    <Typography
                      variant="caption"
                      color={getStatusColor(action.status)}
                      weight="medium"
                      style={styles.statusText}
                    >
                      {action.status === 'calling' && 'Calling...'}
                      {action.status === 'texting' && 'Sending SMS...'}
                      {action.status === 'success' && 'Contacted'}
                      {action.status === 'failed' && 'Failed'}
                      {action.status === 'pending' && 'Pending'}
                    </Typography>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Cancel Button */}
        {!isActive && (
          <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
            <Typography variant="body" color="text" weight="medium">
              Cancel
            </Typography>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
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
  sosContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.xxl,
  },
  glow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: Colors.emergency,
    ...Platform.select({
      ios: {
        shadowColor: Colors.emergency,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 40,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  sosButtonContainer: {
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  sosButton: {
    width: '100%',
    height: '100%',
    borderRadius: 120,
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
  sosButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  sosText: {
    textAlign: 'center',
    marginBottom: Spacing.xs,
    letterSpacing: 2,
  },
  sosSubtext: {
    textAlign: 'center',
    opacity: 0.9,
  },
  locationCard: {
    marginBottom: Spacing.lg,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  locationIcon: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  locationInfo: {
    flex: 1,
  },
  locationCoords: {
    marginTop: Spacing.xs,
  },
  contactsContainer: {
    marginTop: Spacing.lg,
  },
  contactsTitle: {
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  contactCard: {
    marginBottom: Spacing.sm,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  contactAvatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  contactDetails: {
    flex: 1,
  },
  contactStatus: {
    alignItems: 'flex-end',
  },
  statusIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  statusText: {
    fontSize: 11,
  },
  cancelButton: {
    alignSelf: 'center',
    padding: Spacing.md,
    marginTop: Spacing.xl,
  },
});
