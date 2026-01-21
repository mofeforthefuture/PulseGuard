import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { Spacing } from '../../lib/design/tokens';
import { useColors } from '../../lib/design/useColors';
import type { User } from '../../types/user';

interface ProfileSummaryCardProps {
  user: User | null;
  onMedicalProfilePress?: () => void;
}

export function ProfileSummaryCard({ user, onMedicalProfilePress }: ProfileSummaryCardProps) {
  const colors = useColors();

  return (
    <Card variant="calm">
      <View style={styles.container}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
            <Typography variant="h1" style={{ color: colors.primary }}>
              {user?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?'}
            </Typography>
          </View>
        </View>
        <View style={styles.infoContainer}>
          <Typography variant="h2" color="text" weight="bold" style={styles.name}>
            {user?.full_name || 'User'}
          </Typography>
          {user?.email && (
            <Typography variant="bodySmall" color="textSecondary" style={styles.email}>
              {user.email}
            </Typography>
          )}
        </View>
        {onMedicalProfilePress && (
          <TouchableOpacity
            onPress={onMedicalProfilePress}
            style={[styles.medicalButton, { borderColor: colors.primary }]}
          >
            <Typography variant="bodySmall" style={{ color: colors.primary }} weight="medium">
              Medical Profile
            </Typography>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: Spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    marginBottom: Spacing.xs / 2,
  },
  email: {
    fontSize: 12,
  },
  medicalButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
  },
});
