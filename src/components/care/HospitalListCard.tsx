import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
// import { Audio } from 'expo-av'; // Uncomment if adding sound files
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { Spacing, BorderRadius } from '../../lib/design/tokens';
import { useColors } from '../../lib/design/useColors';
import type { Hospital } from '../../types/care';

interface HospitalListCardProps {
  hospitals: Hospital[];
  onEdit?: (hospital: Hospital) => void;
  onDelete?: (hospitalId: string) => void;
  onSetPrimary?: (hospitalId: string) => void;
  onAddNew?: () => void;
}

export function HospitalListCard({
  hospitals,
  onEdit,
  onDelete,
  onSetPrimary,
  onAddNew,
}: HospitalListCardProps) {
  const colors = useColors();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Play copy sound (optional - gracefully fails if sound file not available)
  const playCopySound = async () => {
    try {
      // Note: Add a copy.mp3 file to assets/sounds/ for sound feedback
      // For now, we'll skip sound and rely on haptics
      // You can uncomment and add the sound file if desired:
      /*
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/copy.mp3'),
        { shouldPlay: true, volume: 0.3 }
      );
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
      */
    } catch (error) {
      // Silently fail - haptics will still provide feedback
    }
  };

  // Copy card ID to clipboard
  const handleCopyCardId = async (cardId: string) => {
    try {
      await Clipboard.setStringAsync(cardId);
      setCopiedId(cardId);
      
      // Haptic feedback
      try {
        if (Platform.OS === 'ios') {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      } catch (hapticError) {
        // Haptics might not be available on all devices
        console.log('Haptics not available:', hapticError);
      }
      
      // Sound feedback
      await playCopySound();
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    } catch (error) {
      console.error('Error copying card ID:', error);
      Alert.alert('Error', 'Failed to copy card ID');
    }
  };

  // Copy all hospital details to clipboard
  const handleCopyHospitalDetails = async (hospital: Hospital) => {
    try {
      const details = [
        `Hospital: ${hospital.hospital_name}`,
        hospital.phone_number ? `Phone: ${hospital.phone_number}` : '',
        hospital.patient_card_id ? `Card ID: ${hospital.patient_card_id}` : '',
        hospital.address ? `Address: ${hospital.address}` : '',
        hospital.notes ? `Notes: ${hospital.notes}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      await Clipboard.setStringAsync(details);
      
      // Haptic feedback
      try {
        if (Platform.OS === 'ios') {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      } catch (hapticError) {
        // Haptics might not be available on all devices
        console.log('Haptics not available:', hapticError);
      }
      
      // Sound feedback
      await playCopySound();
      
      Alert.alert('Copied!', 'Hospital details copied to clipboard');
    } catch (error) {
      console.error('Error copying hospital details:', error);
      Alert.alert('Error', 'Failed to copy hospital details');
    }
  };

  return (
    <Card>
      <View style={styles.header}>
        <Typography variant="h3" color="text" weight="semibold" style={styles.title}>
          Hospital Information
        </Typography>
        {onAddNew && (
          <Button
            title="Add Hospital"
            onPress={onAddNew}
            variant="outline"
            style={styles.addButton}
          />
        )}
      </View>

      {hospitals.length === 0 ? (
        <View style={styles.emptyState}>
          <Typography variant="body" color="textSecondary" style={styles.emptyText}>
            No hospitals added yet
          </Typography>
          <Typography variant="bodySmall" color="textLight" style={styles.emptySubtext}>
            Add hospital information for emergency use
          </Typography>
        </View>
      ) : (
        hospitals.map((hospital) => (
          <View
            key={hospital.id}
            style={[
              styles.hospitalItem,
              {
                backgroundColor: colors.surface,
                borderColor: hospital.is_primary ? colors.primary : colors.border,
                borderLeftWidth: hospital.is_primary ? 4 : 1,
              },
            ]}
          >
            <View style={styles.hospitalHeader}>
              <View style={styles.hospitalMain}>
                <View style={styles.hospitalTitleRow}>
                  <Typography variant="body" color="text" weight="semibold">
                    {hospital.hospital_name}
                  </Typography>
                  {hospital.is_primary && (
                    <View style={[styles.primaryBadge, { backgroundColor: colors.primary + '20' }]}>
                      <Typography
                        variant="caption"
                        style={[styles.primaryText, { color: colors.primary }]}
                        weight="semibold"
                      >
                        Primary
                      </Typography>
                    </View>
                  )}
                </View>
                <Typography variant="bodySmall" color="textSecondary" style={styles.phone}>
                  📞 {hospital.phone_number}
                </Typography>
                {hospital.patient_card_id && (
                  <View style={styles.cardIdRow}>
                    <Typography variant="bodySmall" color="textSecondary" style={styles.cardId}>
                      🏥 Card ID: {hospital.patient_card_id}
                    </Typography>
                    <TouchableOpacity
                      onPress={() => handleCopyCardId(hospital.patient_card_id!)}
                      style={[
                        styles.copyButton,
                        copiedId === hospital.patient_card_id && {
                          backgroundColor: colors.success + '20',
                        },
                      ]}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Typography variant="bodySmall" style={styles.copyIcon}>
                        {copiedId === hospital.patient_card_id ? '✓' : '📋'}
                      </Typography>
                    </TouchableOpacity>
                  </View>
                )}
                {hospital.address && (
                  <Typography variant="bodySmall" color="textSecondary" style={styles.address}>
                    📍 {hospital.address}
                  </Typography>
                )}
                {hospital.notes && (
                  <Typography variant="bodySmall" color="textSecondary" style={styles.notes}>
                    {hospital.notes}
                  </Typography>
                )}
              </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() => handleCopyHospitalDetails(hospital)}
                style={[
                  styles.copyDetailsButton,
                  { backgroundColor: colors.primary + '10' },
                ]}
              >
                <Typography variant="bodySmall" color="primary" weight="medium">
                  📋 Copy Details
                </Typography>
              </TouchableOpacity>
              {!hospital.is_primary && onSetPrimary && (
                <Button
                  title="Set as Primary"
                  onPress={() => onSetPrimary(hospital.id)}
                  variant="outline"
                  style={styles.actionButton}
                />
              )}
              {onEdit && (
                <TouchableOpacity
                  onPress={() => onEdit(hospital)}
                  style={styles.editButton}
                >
                  <Typography variant="bodySmall" color="primary">
                    Edit
                  </Typography>
                </TouchableOpacity>
              )}
              {onDelete && (
                <TouchableOpacity
                  onPress={() => onDelete(hospital.id)}
                  style={styles.deleteButton}
                >
                  <Typography variant="bodySmall" color="error">
                    Delete
                  </Typography>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    flex: 1,
  },
  addButton: {
    marginTop: 0,
  },
  emptyState: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    textAlign: 'center',
  },
  hospitalItem: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
  },
  hospitalHeader: {
    marginBottom: Spacing.sm,
  },
  hospitalMain: {
    flex: 1,
  },
  hospitalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  primaryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.sm,
  },
  primaryText: {
    fontSize: 10,
  },
  phone: {
    marginTop: Spacing.xs / 2,
  },
  cardIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs / 2,
  },
  cardId: {
    flex: 1,
  },
  copyButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'transparent',
  },
  copyIcon: {
    fontSize: 16,
  },
  address: {
    marginTop: Spacing.xs / 2,
  },
  notes: {
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  copyDetailsButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  actionButton: {
    flex: 1,
    marginTop: 0,
  },
  editButton: {
    padding: Spacing.sm,
  },
  deleteButton: {
    padding: Spacing.sm,
  },
});
