import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MedicationCard } from './MedicationCard';
import { TimelineView } from './TimelineView';
import { MedicationWithDoses, MedicationDose } from '../../types/medication';
import { Medication } from '../../types/health';
import {
  Colors,
  Gradients,
  Spacing,
  Animation,
} from '../../lib/design/tokens';
import { createStaggeredEntrance } from '../../lib/animations/utils';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';

interface MedicationTrackingScreenProps {
  medications: Medication[];
  onDoseTaken: (medicationId: string, doseId: string, takenAt: string) => void;
}

export function MedicationTrackingScreen({
  medications,
  onDoseTaken,
}: MedicationTrackingScreenProps) {
  const [medicationsWithDoses, setMedicationsWithDoses] = useState<MedicationWithDoses[]>([]);
  const cardAnims = useRef<Animated.Value[]>([]).current;

  // Initialize animations for medication cards
  useEffect(() => {
    // Create animation values for each medication card
    while (cardAnims.length < medications.length) {
      cardAnims.push(new Animated.Value(0));
    }
    // Trim if medications list shrinks
    if (cardAnims.length > medications.length) {
      cardAnims.splice(medications.length);
    }
    
    // Start staggered entrance animations
    if (medications.length > 0) {
      const animations = createStaggeredEntrance(cardAnims.slice(0, medications.length), 80);
      animations.forEach(anim => anim.start());
    }
  }, [medications.length, cardAnims]);

  // Convert medications to MedicationWithDoses format
  useEffect(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const medsWithDoses: MedicationWithDoses[] = medications.map((med, index) => {
      // Parse frequency to determine doses
      const doses: MedicationDose[] = [];
      
      // Simple frequency parsing (can be enhanced)
      if (med.frequency?.toLowerCase().includes('once')) {
        const time = med.time || '09:00';
        doses.push({
          id: `${index}-0`,
          medicationId: `med-${index}`,
          medicationName: med.name,
          dosage: med.dosage,
          scheduledTime: time,
          status: getDoseStatus(time),
        });
      } else if (med.frequency?.toLowerCase().includes('twice')) {
        doses.push(
          {
            id: `${index}-0`,
            medicationId: `med-${index}`,
            medicationName: med.name,
            dosage: med.dosage,
            scheduledTime: '09:00',
            status: getDoseStatus('09:00'),
          },
          {
            id: `${index}-1`,
            medicationId: `med-${index}`,
            medicationName: med.name,
            dosage: med.dosage,
            scheduledTime: '21:00',
            status: getDoseStatus('21:00'),
          }
        );
      } else if (med.frequency?.toLowerCase().includes('three')) {
        doses.push(
          {
            id: `${index}-0`,
            medicationId: `med-${index}`,
            medicationName: med.name,
            dosage: med.dosage,
            scheduledTime: '08:00',
            status: getDoseStatus('08:00'),
          },
          {
            id: `${index}-1`,
            medicationId: `med-${index}`,
            medicationName: med.name,
            dosage: med.dosage,
            scheduledTime: '14:00',
            status: getDoseStatus('14:00'),
          },
          {
            id: `${index}-2`,
            medicationId: `med-${index}`,
            medicationName: med.name,
            dosage: med.dosage,
            scheduledTime: '20:00',
            status: getDoseStatus('20:00'),
          }
        );
      } else {
        // Default to once daily
        const time = med.time || '09:00';
        doses.push({
          id: `${index}-0`,
          medicationId: `med-${index}`,
          medicationName: med.name,
          dosage: med.dosage,
          scheduledTime: time,
          status: getDoseStatus(time),
        });
      }

      return {
        id: `med-${index}`,
        name: med.name,
        dosage: med.dosage,
        frequency: med.frequency || 'Once daily',
        time: med.time,
        icon: getMedicationIcon(med.name),
        doses,
      };
    });

    setMedicationsWithDoses(medsWithDoses);
  }, [medications]);

  const getDoseStatus = (scheduledTime: string): MedicationDose['status'] => {
    const now = new Date();
    const [hours, minutes] = scheduledTime.split(':');
    const scheduled = new Date();
    scheduled.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // Check if time has passed
    if (now > scheduled) {
      // Check if it's within the last hour (could be taken)
      const diff = now.getTime() - scheduled.getTime();
      if (diff < 60 * 60 * 1000) {
        return 'upcoming'; // Still can be taken
      }
      return 'missed';
    }

    // Check if it's within next 30 minutes
    const diff = scheduled.getTime() - now.getTime();
    if (diff < 30 * 60 * 1000) {
      return 'upcoming';
    }

    return 'pending';
  };

  const getMedicationIcon = (name: string): string => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('inhaler') || lowerName.includes('asthma')) return '🫁';
    if (lowerName.includes('insulin') || lowerName.includes('diabetes')) return '💉';
    if (lowerName.includes('epilepsy') || lowerName.includes('seizure')) return '⚡';
    if (lowerName.includes('heart') || lowerName.includes('cardiac')) return '❤️';
    if (lowerName.includes('pain')) return '💊';
    return '💊';
  };

  const handleDoseToggle = (doseId: string) => {
    setMedicationsWithDoses((prev) => {
      return prev.map((med) => {
        const updatedDoses = med.doses.map((dose) => {
          if (dose.id === doseId && (dose.status === 'pending' || dose.status === 'upcoming')) {
            const takenAt = new Date().toISOString();
            onDoseTaken(med.id, doseId, takenAt);
            return {
              ...dose,
              status: 'taken' as const,
              takenAt,
            };
          }
          return dose;
        });

        return {
          ...med,
          doses: updatedDoses,
        };
      });
    });
  };

  // Collect all doses for timeline
  const allDoses: MedicationDose[] = medicationsWithDoses.flatMap((med) => med.doses);

  // Calculate summary stats
  const totalDoses = allDoses.length;
  const takenDoses = allDoses.filter((d) => d.status === 'taken').length;
  const missedDoses = allDoses.filter((d) => d.status === 'missed').length;
  const pendingDoses = allDoses.filter((d) => d.status === 'pending' || d.status === 'upcoming').length;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Gradients.background.start, Gradients.background.end]}
        style={StyleSheet.absoluteFill}
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Typography variant="h1" color="text" weight="bold" style={styles.title}>
            Medication Tracking 💊
          </Typography>
          <Typography variant="body" color="textSecondary" style={styles.subtitle}>
            Track your doses throughout the day
          </Typography>
        </View>

        {/* Summary Stats */}
        <Card variant="gradient" padding="lg" style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Typography variant="h2" color="text" weight="bold" style={styles.summaryNumber}>
                {takenDoses}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Taken
              </Typography>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Typography variant="h2" color="text" weight="bold" style={styles.summaryNumber}>
                {pendingDoses}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Pending
              </Typography>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Typography variant="h2" color="text" weight="bold" style={[styles.summaryNumber, { color: missedDoses > 0 ? Colors.error : Colors.text }]}>
                {missedDoses}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Missed
              </Typography>
            </View>
          </View>
        </Card>

        {/* Timeline View */}
        {allDoses.length > 0 && (
          <TimelineView doses={allDoses} onDoseToggle={handleDoseToggle} />
        )}

        {/* Medication Cards */}
        <View style={styles.medicationsSection}>
          <Typography variant="h2" color="text" weight="bold" style={styles.sectionTitle}>
            Your Medications
          </Typography>
          {medicationsWithDoses.map((medication, index) => {
            const anim = cardAnims[index] || new Animated.Value(1);
            return (
              <Animated.View
                key={medication.id}
                style={{
                  opacity: anim,
                  transform: [
                    {
                      translateY: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    },
                  ],
                }}
              >
                <MedicationCard
                  medication={medication}
                  onDoseToggle={handleDoseToggle}
                />
              </Animated.View>
            );
          })}
        </View>

        {medicationsWithDoses.length === 0 && (
          <Card variant="gradient" padding="xl" style={styles.emptyCard}>
            <Typography variant="h3" color="text" style={styles.emptyTitle}>
              No Medications Tracked
            </Typography>
            <Typography variant="body" color="textSecondary" style={styles.emptyDescription}>
              Add medications to your medical profile to start tracking doses.
            </Typography>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  subtitle: {
    marginTop: Spacing.xs,
  },
  summaryCard: {
    marginBottom: Spacing.xl,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryNumber: {
    marginBottom: Spacing.xs,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  medicationsSection: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  emptyCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    marginTop: Spacing.xl,
  },
  emptyTitle: {
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    textAlign: 'center',
  },
});
