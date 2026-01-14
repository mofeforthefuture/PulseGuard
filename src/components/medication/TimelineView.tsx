import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MedicationDose } from '../../types/medication';
import {
  Colors,
  Gradients,
  Spacing,
  BorderRadius,
  Shadows,
  Animation,
} from '../../lib/design/tokens';
import { Typography } from '../ui/Typography';

interface TimelineViewProps {
  doses: MedicationDose[];
  onDoseToggle: (doseId: string) => void;
}

export function TimelineView({ doses, onDoseToggle }: TimelineViewProps) {
  // Sort doses by scheduled time
  const sortedDoses = [...doses].sort((a, b) =>
    a.scheduledTime.localeCompare(b.scheduledTime)
  );

  const isCurrentTime = (scheduledTime: string): boolean => {
    const now = new Date();
    const [hours, minutes] = scheduledTime.split(':');
    const scheduled = new Date();
    scheduled.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const diff = Math.abs(now.getTime() - scheduled.getTime());
    return diff < 30 * 60 * 1000; // Within 30 minutes
  };

  return (
    <View style={styles.container}>
      <Typography variant="h2" color="text" weight="bold" style={styles.title}>
        Today's Timeline
      </Typography>
      
      <View style={styles.timeline}>
        {sortedDoses.map((dose, index) => {
          const isLast = index === sortedDoses.length - 1;
          const isCurrent = isCurrentTime(dose.scheduledTime);
          
          return (
            <View key={dose.id} style={styles.timelineItem}>
              {/* Timeline Line */}
              {!isLast && (
                <View
                  style={[
                    styles.timelineLine,
                    {
                      backgroundColor:
                        dose.status === 'taken'
                          ? Colors.success
                          : dose.status === 'missed'
                          ? Colors.error
                          : Colors.border,
                    },
                  ]}
                />
              )}

              {/* Dose Card */}
              <DoseCard
                dose={dose}
                isCurrent={isCurrent}
                onPress={() => {
                  if (dose.status === 'pending' || dose.status === 'upcoming') {
                    onDoseToggle(dose.id);
                  }
                }}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

// Animated Dose Card Component
function DoseCard({
  dose,
  isCurrent,
  onPress,
}: {
  dose: MedicationDose;
  isCurrent: boolean;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const [isTaken, setIsTaken] = useState(dose.status === 'taken');

  useEffect(() => {
    if (dose.status === 'taken' && !isTaken) {
      setIsTaken(true);
      // Celebration animation
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1.1,
            useNativeDriver: true,
            ...Animation.spring,
          }),
          Animated.spring(checkmarkScale, {
            toValue: 1,
            useNativeDriver: true,
            ...Animation.spring,
          }),
        ]),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          ...Animation.spring,
        }),
      ]).start();
    }
  }, [dose.status, isTaken, scaleAnim, checkmarkScale]);

  const getDoseStatusColor = (status: MedicationDose['status']): [string, string] => {
    switch (status) {
      case 'taken':
        return [Gradients.success.start, Gradients.success.end];
      case 'missed':
        return [Gradients.concern.start, Gradients.concern.end];
      case 'upcoming':
        return [Gradients.reminder.start, Gradients.reminder.end];
      default:
        return [Gradients.surface.start, Gradients.surface.end];
    }
  };

  const getDoseIcon = (status: MedicationDose['status']): string => {
    switch (status) {
      case 'taken':
        return '✓';
      case 'missed':
        return '✕';
      case 'upcoming':
        return '⏰';
      default:
        return '○';
    }
  };

  const getTimeLabel = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  };

  const handlePress = () => {
    if (dose.status === 'pending' || dose.status === 'upcoming') {
      // Press animation
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 0.95,
          useNativeDriver: true,
          ...Animation.spring,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          ...Animation.spring,
        }),
      ]).start();
      
      setTimeout(() => {
        onPress();
      }, 100);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      disabled={dose.status === 'taken' || dose.status === 'missed'}
      style={styles.doseCardContainer}
    >
      <Animated.View
        style={[
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={getDoseStatusColor(dose.status)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.doseCard,
            isCurrent && styles.doseCardCurrent,
          ]}
        >
          {/* Time */}
          <View style={styles.timeContainer}>
            <Typography variant="h3" color="text" weight="bold" style={styles.time}>
              {getTimeLabel(dose.scheduledTime)}
            </Typography>
            {isCurrent && (
              <View style={styles.currentBadge}>
                <Typography variant="caption" color="text" weight="bold">
                  NOW
                </Typography>
              </View>
            )}
          </View>

          {/* Medication Info */}
          <View style={styles.medicationInfo}>
            <View style={styles.statusIconContainer}>
              <Animated.View
                style={{
                  transform: [{ scale: checkmarkScale }],
                }}
              >
                <Text
                  style={[
                    styles.statusIcon,
                    {
                      color:
                        dose.status === 'taken'
                          ? Colors.success
                          : dose.status === 'missed'
                          ? Colors.error
                          : Colors.text,
                    },
                  ]}
                >
                  {getDoseIcon(dose.status)}
                </Text>
              </Animated.View>
            </View>
            <View style={styles.medicationDetails}>
              <Typography variant="body" color="text" weight="semibold">
                {dose.medicationName}
              </Typography>
              <Typography variant="bodySmall" color="textSecondary">
                {dose.dosage}
              </Typography>
            </View>
          </View>

          {/* Taken Time */}
          {dose.status === 'taken' && dose.takenAt && (
            <View style={styles.takenTime}>
              <Text style={styles.takenIcon}>✓</Text>
              <Typography variant="caption" color="textSecondary">
                Taken at {new Date(dose.takenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </View>
          )}
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
  },
  title: {
    marginBottom: Spacing.lg,
  },
  timeline: {
    position: 'relative',
  },
  timelineItem: {
    position: 'relative',
    marginBottom: Spacing.lg,
  },
  timelineLine: {
    position: 'absolute',
    left: 24,
    top: 60,
    width: 2,
    height: '100%',
    zIndex: 0,
  },
  doseCardContainer: {
    marginLeft: Spacing.md,
  },
  doseCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    ...Platform.select({
      ios: {
        ...Shadows.md,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  doseCardCurrent: {
    ...Platform.select({
      ios: {
        shadowColor: Colors.warning,
        shadowOpacity: 0.5,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
    borderWidth: 2,
    borderColor: Colors.warning,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  time: {
    letterSpacing: 0.5,
  },
  currentBadge: {
    backgroundColor: Colors.warning,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  medicationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface + '80',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  statusIcon: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  medicationDetails: {
    flex: 1,
  },
  takenTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border + '40',
  },
  takenIcon: {
    fontSize: 14,
    marginRight: Spacing.xs,
    color: Colors.success,
  },
});
