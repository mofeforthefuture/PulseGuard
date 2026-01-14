import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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
  Typography as TypographyTokens,
} from '../../lib/design/tokens';
import { MedicalProfile, Medication } from '../../types/health';
import { User } from '../../types/user';

interface FirstResponderModeScreenProps {
  user: User;
  medicalProfiles: MedicalProfile[];
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export function FirstResponderModeScreen({
  user,
  medicalProfiles,
  emergencyContactName,
  emergencyContactPhone,
}: FirstResponderModeScreenProps) {
  // Get condition color and icon
  const getConditionConfig = (conditionType: string, severity?: string) => {
    const configs: Record<string, { color: string; icon: string; label: string }> = {
      asthma: {
        color: Colors.warning,
        icon: '🫁',
        label: 'ASTHMA',
      },
      sickle_cell_disease: {
        color: Colors.error,
        icon: '🩸',
        label: 'SICKLE CELL',
      },
      epilepsy: {
        color: Colors.error,
        icon: '⚡',
        label: 'EPILEPSY',
      },
      diabetes: {
        color: Colors.warning,
        icon: '💉',
        label: 'DIABETES',
      },
      heart_condition: {
        color: Colors.error,
        icon: '❤️',
        label: 'HEART CONDITION',
      },
      allergies: {
        color: Colors.error,
        icon: '⚠️',
        label: 'ALLERGIES',
      },
      other: {
        color: Colors.info,
        icon: '🏥',
        label: 'MEDICAL CONDITION',
      },
    };

    const config = configs[conditionType] || configs.other;
    
    // Adjust color based on severity
    if (severity === 'severe') {
      return { ...config, color: Colors.error };
    }
    if (severity === 'moderate') {
      return { ...config, color: Colors.warning };
    }
    
    return config;
  };

  // Collect all medications from all profiles
  const allMedications: Medication[] = [];
  medicalProfiles.forEach((profile) => {
    if (profile.medications && Array.isArray(profile.medications)) {
      allMedications.push(...profile.medications);
    }
  });

  // Collect all triggers/allergies
  const allTriggers: string[] = [];
  medicalProfiles.forEach((profile) => {
    if (profile.triggers && Array.isArray(profile.triggers)) {
      allTriggers.push(...profile.triggers);
    }
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.surface, Colors.background]}
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
            FIRST RESPONDER MODE
          </Typography>
          <Typography variant="body" color="textSecondary" style={styles.subtitle}>
            Critical Medical Information
          </Typography>
        </View>

        {/* Patient Name */}
        <Card variant="gradient" padding="lg" style={styles.nameCard}>
          <View style={styles.nameRow}>
            <Text style={styles.nameIcon}>👤</Text>
            <View style={styles.nameContent}>
              <Typography variant="h1" color="text" weight="bold" style={styles.patientName}>
                {user.full_name || 'Patient'}
              </Typography>
              {user.phone_number && (
                <Typography variant="body" color="textSecondary" style={styles.phone}>
                  📞 {user.phone_number}
                </Typography>
              )}
            </View>
          </View>
        </Card>

        {/* Conditions - Color Coded Tags */}
        {medicalProfiles.length > 0 && (
          <View style={styles.section}>
            <Typography variant="h2" color="text" weight="bold" style={styles.sectionTitle}>
              MEDICAL CONDITIONS
            </Typography>
            <View style={styles.conditionsContainer}>
              {medicalProfiles.map((profile) => {
                const config = getConditionConfig(profile.condition_type, profile.severity);
                return (
                  <View
                    key={profile.id}
                    style={[
                      styles.conditionTag,
                      {
                        backgroundColor: config.color + '20',
                        borderColor: config.color,
                      },
                    ]}
                  >
                    <Text style={styles.conditionIcon}>{config.icon}</Text>
                    <Typography
                      variant="h3"
                      color="text"
                      weight="bold"
                      style={styles.conditionLabel}
                    >
                      {config.label}
                    </Typography>
                    {profile.severity && (
                      <View
                        style={[
                          styles.severityBadge,
                          {
                            backgroundColor: config.color,
                          },
                        ]}
                      >
                        <Typography variant="bodySmall" color="text" weight="semibold">
                          {profile.severity.toUpperCase()}
                        </Typography>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Medications - High Contrast Warning Cards */}
        {allMedications.length > 0 && (
          <View style={styles.section}>
            <Typography variant="h2" color="text" weight="bold" style={styles.sectionTitle}>
              CURRENT MEDICATIONS
            </Typography>
            {allMedications.map((med, index) => (
              <Card
                key={index}
                variant="reminder"
                padding="md"
                style={styles.medicationCard}
              >
                <View style={styles.medicationHeader}>
                  <Text style={styles.medicationIcon}>💊</Text>
                  <View style={styles.medicationInfo}>
                    <Typography variant="h3" color="text" weight="bold" style={styles.medicationName}>
                      {med.name.toUpperCase()}
                    </Typography>
                    <Typography variant="body" color="textSecondary" style={styles.medicationDosage}>
                      {med.dosage}
                    </Typography>
                  </View>
                </View>
                {med.frequency && (
                  <View style={styles.medicationDetail}>
                    <Text style={styles.detailIcon}>⏰</Text>
                    <Typography variant="body" color="text" weight="medium">
                      {med.frequency}
                    </Typography>
                  </View>
                )}
                {med.time && (
                  <View style={styles.medicationDetail}>
                    <Text style={styles.detailIcon}>🕐</Text>
                    <Typography variant="body" color="text" weight="medium">
                      Time: {med.time}
                    </Typography>
                  </View>
                )}
              </Card>
            ))}
          </View>
        )}

        {/* Allergies/Triggers - High Contrast Warning */}
        {allTriggers.length > 0 && (
          <View style={styles.section}>
            <Card variant="concern" padding="lg" style={styles.allergyCard}>
              <View style={styles.allergyHeader}>
                <Text style={styles.allergyIcon}>⚠️</Text>
                <Typography variant="h2" color="text" weight="bold" style={styles.allergyTitle}>
                  ALLERGIES & TRIGGERS
                </Typography>
              </View>
              <View style={styles.triggersList}>
                {allTriggers.map((trigger, index) => (
                  <View key={index} style={styles.triggerItem}>
                    <Text style={styles.triggerBullet}>•</Text>
                    <Typography variant="h3" color="text" weight="semibold" style={styles.triggerText}>
                      {trigger.toUpperCase()}
                    </Typography>
                  </View>
                ))}
              </View>
            </Card>
          </View>
        )}

        {/* Emergency Instructions */}
        {medicalProfiles.some((p) => p.emergency_instructions) && (
          <View style={styles.section}>
            <Typography variant="h2" color="text" weight="bold" style={styles.sectionTitle}>
              EMERGENCY INSTRUCTIONS
            </Typography>
            {medicalProfiles
              .filter((p) => p.emergency_instructions)
              .map((profile) => (
                <Card key={profile.id} variant="emergency" padding="lg" style={styles.instructionCard}>
                  <View style={styles.instructionHeader}>
                    <Text style={styles.instructionIcon}>🚨</Text>
                    <Typography variant="h3" color="text" weight="bold" style={styles.instructionTitle}>
                      {getConditionConfig(profile.condition_type).label}
                    </Typography>
                  </View>
                  <Typography variant="body" color="text" weight="medium" style={styles.instructionText}>
                    {profile.emergency_instructions}
                  </Typography>
                </Card>
              ))}
          </View>
        )}

        {/* Emergency Contact */}
        {(emergencyContactName || emergencyContactPhone) && (
          <View style={styles.section}>
            <Typography variant="h2" color="text" weight="bold" style={styles.sectionTitle}>
              EMERGENCY CONTACT
            </Typography>
            <Card variant="gradient" padding="lg" style={styles.contactCard}>
              <View style={styles.contactRow}>
                <Text style={styles.contactIcon}>📞</Text>
                <View style={styles.contactInfo}>
                  <Typography variant="h3" color="text" weight="bold" style={styles.contactName}>
                    {emergencyContactName?.toUpperCase() || 'EMERGENCY CONTACT'}
                  </Typography>
                  {emergencyContactPhone && (
                    <Typography variant="body" color="textSecondary" style={styles.contactPhone}>
                      {emergencyContactPhone}
                    </Typography>
                  )}
                </View>
              </View>
            </Card>
          </View>
        )}

        {/* Footer Note */}
        <View style={styles.footer}>
          <Typography variant="body" color="textSecondary" style={styles.footerText}>
            This information is for first responders only
          </Typography>
          <Typography variant="bodySmall" color="textLight" style={styles.footerSubtext}>
            Last updated: {new Date().toLocaleDateString()}
          </Typography>
        </View>
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
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    marginBottom: Spacing.xxl,
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    textAlign: 'center',
  },
  nameCard: {
    marginBottom: Spacing.xxl,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameIcon: {
    fontSize: 40,
    marginRight: Spacing.md,
  },
  nameContent: {
    flex: 1,
  },
  patientName: {
    marginBottom: Spacing.xs,
  },
  phone: {
    marginTop: Spacing.xs,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
    letterSpacing: 1,
  },
  conditionsContainer: {
    gap: Spacing.md,
  },
  conditionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 3,
    marginBottom: Spacing.md,
  },
  conditionIcon: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  conditionLabel: {
    flex: 1,
    letterSpacing: 1,
  },
  severityBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  medicationCard: {
    marginBottom: Spacing.lg,
    ...Platform.select({
      ios: {
        ...Shadows.lg,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  medicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  medicationIcon: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    marginBottom: Spacing.xs,
    letterSpacing: 0.5,
  },
  medicationDosage: {
    marginTop: Spacing.xs,
  },
  medicationDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingLeft: Spacing.xl,
  },
  detailIcon: {
    fontSize: 18,
    marginRight: Spacing.sm,
  },
  allergyCard: {
    ...Platform.select({
      ios: {
        ...Shadows.xl,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  allergyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  allergyIcon: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  allergyTitle: {
    flex: 1,
    letterSpacing: 1,
  },
  triggersList: {
    marginTop: Spacing.md,
  },
  triggerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingLeft: Spacing.md,
  },
  triggerBullet: {
    fontSize: 20,
    marginRight: Spacing.sm,
    color: Colors.error,
  },
  triggerText: {
    flex: 1,
    letterSpacing: 0.5,
  },
  instructionCard: {
    marginBottom: Spacing.lg,
    ...Platform.select({
      ios: {
        ...Shadows.xl,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  instructionIcon: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  instructionTitle: {
    flex: 1,
    letterSpacing: 1,
  },
  instructionText: {
    lineHeight: TypographyTokens.lineHeight.md * 1.3,
    letterSpacing: 0.2,
  },
  contactCard: {
    marginBottom: Spacing.lg,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactIcon: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    marginBottom: Spacing.xs,
    letterSpacing: 0.5,
  },
  contactPhone: {
    marginTop: Spacing.xs,
  },
  footer: {
    marginTop: Spacing.xxl,
    alignItems: 'center',
    paddingTop: Spacing.xl,
    borderTopWidth: 2,
    borderTopColor: Colors.border,
  },
  footerText: {
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  footerSubtext: {
    textAlign: 'center',
  },
});
