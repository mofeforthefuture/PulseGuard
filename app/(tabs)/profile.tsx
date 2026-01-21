import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeAreaView } from '../../src/components/ui/SafeAreaView';
import { SettingsSection } from '../../src/components/ui/SettingsSection';
import { SettingsItem } from '../../src/components/ui/SettingsItem';
import { PersonalitySelector } from '../../src/components/ui/PersonalitySelector';
import { Typography } from '../../src/components/ui/Typography';
import { BottomSheet } from '../../src/components/ui/BottomSheet';
import { ProfileSummaryCard } from '../../src/components/profile/ProfileSummaryCard';
import { EmergencyContactForm } from '../../src/components/profile/EmergencyContactForm';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useALARA } from '../../src/context/ALARAContext';
import { Spacing } from '../../src/lib/design/tokens';
import { getThemeColors } from '../../src/lib/design/themes';
import { getUserSettings, updateUserSettings } from '../../src/lib/services/userSettingsService';
import type { ALARAPersonality } from '../../src/lib/openrouter/client';

export default function ProfileScreen() {
  const { user, signOut, refreshUser } = useAuth();
  const { theme, themeMode, setThemeMode } = useTheme();
  const { personality, setPersonality } = useALARA();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = getThemeColors(theme);
  
  // App-specific settings state
  const [medicationReminders, setMedicationReminders] = useState(true);
  const [checkInReminders, setCheckInReminders] = useState(true);
  const [emergencyAlerts, setEmergencyAlerts] = useState(true);
  const [locationTracking, setLocationTracking] = useState(true);
  const [showEmergencyContactForm, setShowEmergencyContactForm] = useState(false);

  // Load settings from user profile
  useEffect(() => {
    const loadSettings = async () => {
      if (user?.id) {
        const settings = await getUserSettings(user.id);
        setMedicationReminders(settings.medication_reminders_enabled ?? true);
        setCheckInReminders(settings.check_in_reminders_enabled ?? true);
        setEmergencyAlerts(settings.emergency_alerts_enabled ?? true);
        setLocationTracking(settings.location_tracking_enabled ?? true);
      }
    };
    loadSettings();
  }, [user?.id]);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: signOut 
        },
      ]
    );
  };

  const handleThemeChange = async (enabled: boolean) => {
    await setThemeMode(enabled ? 'dark' : 'light');
  };

  const handleSettingChange = async (
    setting: 'medicationReminders' | 'checkInReminders' | 'emergencyAlerts' | 'locationTracking',
    value: boolean
  ) => {
    if (!user?.id) return;

    // Update local state immediately
    switch (setting) {
      case 'medicationReminders':
        setMedicationReminders(value);
        break;
      case 'checkInReminders':
        setCheckInReminders(value);
        break;
      case 'emergencyAlerts':
        setEmergencyAlerts(value);
        break;
      case 'locationTracking':
        setLocationTracking(value);
        break;
    }

    // Update in database
    const dbField = {
      medicationReminders: 'medication_reminders_enabled',
      checkInReminders: 'check_in_reminders_enabled',
      emergencyAlerts: 'emergency_alerts_enabled',
      locationTracking: 'location_tracking_enabled',
    }[setting];

    await updateUserSettings(user.id, { [dbField]: value });
  };

  const handleEmergencyContactSave = async () => {
    // Refresh user data to get updated emergency contact
    await refreshUser();
    setShowEmergencyContactForm(false);
  };

  return (
    <SafeAreaView>
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]} 
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.md }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Typography variant="h1" color="text" weight="bold" style={styles.title}>
            Profile
          </Typography>
        </View>

        {/* Profile Summary */}
        <ProfileSummaryCard
          user={user}
          onMedicalProfilePress={() => {
            // TODO: Navigate to medical profile edit
            Alert.alert('Medical Profile', 'Medical profile editing coming soon!');
          }}
        />

        {/* Emergency Contacts Section */}
        <SettingsSection title="Emergency Contacts" icon="call">
          {user?.emergency_contact_name && user?.emergency_contact_phone ? (
            <>
              <SettingsItem
                label={user.emergency_contact_name}
                onPress={() => setShowEmergencyContactForm(true)}
                showArrow={true}
              />
              <SettingsItem
                label={user.emergency_contact_phone}
                onPress={() => setShowEmergencyContactForm(true)}
                showArrow={false}
                isLast
              />
            </>
          ) : (
            <SettingsItem
              label="Add Emergency Contact"
              onPress={() => setShowEmergencyContactForm(true)}
              isLast
            />
          )}
        </SettingsSection>

        {/* ALARA Settings Section */}
        <SettingsSection title="ALARA Settings" icon="chatbubbles">
          <View style={styles.personalityContainer}>
            <Typography variant="body" color="textSecondary" style={styles.personalityDescription}>
              Choose ALARA's personality. This affects how ALARA responds to you in chat.
            </Typography>
            <PersonalitySelector value={personality} onChange={setPersonality} />
          </View>
          <SettingsItem
            label="Chat preferences"
            onPress={() => {
              // TODO: Navigate to chat preferences
              Alert.alert('Chat Preferences', 'Chat preferences coming soon!');
            }}
            isLast
          />
        </SettingsSection>

        {/* App Settings Section */}
        <SettingsSection title="App Settings" icon="settings">
          <SettingsItem
            label="Medication reminders"
            rightIcon="toggle"
            toggleValue={medicationReminders}
            onToggleChange={(value) => handleSettingChange('medicationReminders', value)}
          />
          <SettingsItem
            label="Check-in reminders"
            rightIcon="toggle"
            toggleValue={checkInReminders}
            onToggleChange={(value) => handleSettingChange('checkInReminders', value)}
          />
          <SettingsItem
            label="Emergency alerts"
            rightIcon="toggle"
            toggleValue={emergencyAlerts}
            onToggleChange={(value) => handleSettingChange('emergencyAlerts', value)}
          />
          <SettingsItem
            label="Location tracking"
            rightIcon="toggle"
            toggleValue={locationTracking}
            onToggleChange={(value) => handleSettingChange('locationTracking', value)}
          />
          <SettingsItem
            label="Theme"
            rightIcon="toggle"
            toggleValue={theme === 'dark'}
            onToggleChange={handleThemeChange}
            isLast
          />
        </SettingsSection>

        {/* Account Section */}
        <SettingsSection title="Account" icon="person-circle">
          <View style={[styles.accountInfo, { borderBottomColor: colors.border + '20' }]}>
            <Typography variant="body" color="textSecondary" style={styles.accountLabel}>
              Email
            </Typography>
            <Typography variant="body" color="text" weight="medium">
              {user?.email || 'Not available'}
            </Typography>
          </View>
          {user?.created_at && (
            <View style={[styles.accountInfo, { borderBottomColor: colors.border + '20' }]}>
              <Typography variant="body" color="textSecondary" style={styles.accountLabel}>
                Account created
              </Typography>
              <Typography variant="body" color="text" weight="medium">
                {new Date(user.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Typography>
            </View>
          )}
          <TouchableOpacity
            onPress={handleSignOut}
            activeOpacity={0.7}
            style={[styles.signOutItem, { borderTopColor: colors.border + '20' }]}
          >
            <Typography variant="body" style={[styles.signOutText, { color: colors.error }]} weight="semibold">
              Sign Out
            </Typography>
          </TouchableOpacity>
        </SettingsSection>

        {/* Emergency Contact Form Bottom Sheet */}
        <BottomSheet
          visible={showEmergencyContactForm}
          onClose={() => setShowEmergencyContactForm(false)}
        >
          <EmergencyContactForm
            visible={showEmergencyContactForm}
            onClose={() => setShowEmergencyContactForm(false)}
            onSave={handleEmergencyContactSave}
            contact={
              user?.emergency_contact_name && user?.emergency_contact_phone
                ? {
                    name: user.emergency_contact_name,
                    phone: user.emergency_contact_phone,
                  }
                : null
            }
          />
        </BottomSheet>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    textAlign: 'center',
  },
  accountInfo: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
  },
  accountLabel: {
    marginBottom: Spacing.xs / 2,
    fontSize: 12,
  },
  signOutItem: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderTopWidth: 1,
    marginTop: Spacing.sm,
  },
  signOutText: {
    textAlign: 'center',
  },
  personalityContainer: {
    padding: Spacing.md,
  },
  personalityDescription: {
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
});



