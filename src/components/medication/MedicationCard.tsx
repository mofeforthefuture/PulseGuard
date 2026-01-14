import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MedicationWithDoses } from '../../types/medication';
import {
  Colors,
  Gradients,
  Spacing,
  BorderRadius,
  Shadows,
  Animation,
} from '../../lib/design/tokens';
import { Typography } from '../ui/Typography';

interface MedicationCardProps {
  medication: MedicationWithDoses;
  onDoseToggle: (doseId: string) => void;
}

export function MedicationCard({ medication, onDoseToggle }: MedicationCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Get medication icon
  const getMedicationIcon = (): string => {
    if (medication.icon) return medication.icon;
    
    const name = medication.name.toLowerCase();
    if (name.includes('inhaler') || name.includes('asthma')) return '🫁';
    if (name.includes('insulin') || name.includes('diabetes')) return '💉';
    if (name.includes('epilepsy') || name.includes('seizure')) return '⚡';
    if (name.includes('heart') || name.includes('cardiac')) return '❤️';
    if (name.includes('pain')) return '💊';
    return '💊';
  };

  // Calculate completion percentage
  const totalDoses = medication.doses.length;
  const takenDoses = medication.doses.filter((d) => d.status === 'taken').length;
  const completionPercentage = totalDoses > 0 ? (takenDoses / totalDoses) * 100 : 0;

  // Get status color
  const getStatusColor = (): [string, string] => {
    if (completionPercentage === 100) {
      return [Gradients.success.start, Gradients.success.end];
    }
    if (completionPercentage > 0) {
      return [Gradients.reminder.start, Gradients.reminder.end];
    }
    return [Gradients.surface.start, Gradients.surface.end];
  };

  // Pulse animation for upcoming doses
  const hasUpcoming = medication.doses.some((d) => d.status === 'upcoming');
  useEffect(() => {
    if (hasUpcoming) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [hasUpcoming, pulseAnim]);

  const handlePress = () => {
    // Find next pending dose
    const nextDose = medication.doses.find((d) => d.status === 'pending' || d.status === 'upcoming');
    if (nextDose) {
      // Animated check-off interaction
      Animated.sequence([
        // Press down
        Animated.spring(scaleAnim, {
          toValue: 0.92,
          useNativeDriver: true,
          ...Animation.spring,
        }),
        // Bounce back with celebration
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1.08,
            useNativeDriver: true,
            ...Animation.spring,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        // Settle
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            ...Animation.spring,
          }),
          Animated.spring(pulseAnim, {
            toValue: 1,
            useNativeDriver: true,
            ...Animation.spring,
          }),
        ]),
      ]).start();
      
      // Small delay before updating state for better UX
      setTimeout(() => {
        onDoseToggle(nextDose.id);
      }, 150);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.9}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.card,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={getStatusColor()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <Animated.View
            style={[
              styles.content,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>{getMedicationIcon()}</Text>
              </View>
              <View style={styles.headerText}>
                <Typography variant="h3" color="text" weight="bold" style={styles.name}>
                  {medication.name}
                </Typography>
                <Typography variant="bodySmall" color="textSecondary" style={styles.dosage}>
                  {medication.dosage}
                </Typography>
              </View>
              {completionPercentage === 100 && (
                <View style={styles.completeBadge}>
                  <Text style={styles.checkmark}>✓</Text>
                </View>
              )}
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${completionPercentage}%`,
                      backgroundColor:
                        completionPercentage === 100
                          ? Colors.success
                          : completionPercentage > 0
                          ? Colors.warning
                          : Colors.border,
                    },
                  ]}
                />
              </View>
              <Typography variant="caption" color="textSecondary" style={styles.progressText}>
                {takenDoses} / {totalDoses} doses
              </Typography>
            </View>

            {/* Next Dose Info */}
            {medication.doses.length > 0 && (
              <View style={styles.nextDose}>
                {(() => {
                  const nextDose = medication.doses.find(
                    (d) => d.status === 'pending' || d.status === 'upcoming'
                  );
                  const lastTaken = medication.doses
                    .filter((d) => d.status === 'taken')
                    .sort((a, b) => (b.takenAt || '').localeCompare(a.takenAt || ''))[0];

                  if (nextDose) {
                    return (
                      <View style={styles.doseInfo}>
                        <Text style={styles.doseIcon}>⏰</Text>
                        <Typography variant="bodySmall" color="text" weight="medium">
                          Next: {nextDose.scheduledTime}
                        </Typography>
                      </View>
                    );
                  }
                  if (lastTaken) {
                    return (
                      <View style={styles.doseInfo}>
                        <Text style={styles.doseIcon}>✓</Text>
                        <Typography variant="bodySmall" color="textSecondary">
                          Last taken: {lastTaken.takenAt ? new Date(lastTaken.takenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : lastTaken.scheduledTime}
                        </Typography>
                      </View>
                    );
                  }
                  return null;
                })()}
              </View>
            )}
          </Animated.View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  card: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        ...Shadows.lg,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  gradient: {
    padding: Spacing.lg,
  },
  content: {
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surface + '80',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  icon: {
    fontSize: 32,
  },
  headerText: {
    flex: 1,
  },
  name: {
    marginBottom: Spacing.xs,
  },
  dosage: {
    marginTop: 2,
  },
  completeBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 20,
    color: Colors.text,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginBottom: Spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.border + '40',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  progressText: {
    fontSize: 11,
  },
  nextDose: {
    marginTop: Spacing.xs,
  },
  doseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doseIcon: {
    fontSize: 16,
    marginRight: Spacing.xs,
  },
});
