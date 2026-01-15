import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeAreaView } from '../../src/components/ui/SafeAreaView';
import { SettingsSection } from '../../src/components/ui/SettingsSection';
import { SettingsItem } from '../../src/components/ui/SettingsItem';
import { PersonalitySelector } from '../../src/components/ui/PersonalitySelector';
import { Typography } from '../../src/components/ui/Typography';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useALARA } from '../../src/context/ALARAContext';
import { Spacing } from '../../src/lib/design/tokens';
import { getThemeColors } from '../../src/lib/design/themes';
import type { ALARAPersonality } from '../../src/lib/openrouter/client';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { theme, themeMode, setThemeMode } = useTheme();
  const { personality, setPersonality } = useALARA();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = getThemeColors(theme);
  
  // App-specific settings state (load from user profile if available)
  const [medicationReminders, setMedicationReminders] = useState(true);
  const [checkInReminders, setCheckInReminders] = useState(true);
  const [emergencyAlerts, setEmergencyAlerts] = useState(true);
  const [locationTracking, setLocationTracking] = useState(true);

  // Load settings from user profile
  useEffect(() => {
    // TODO: Load from user profile when available
    // These would come from the profiles table
  }, [user]);

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
            Settings
          </Typography>
        </View>

        {/* Profile Section */}
        <SettingsSection title="Profile" icon="person">
          <SettingsItem
            label="Medical profile"
            onPress={() => {
              // TODO: Navigate to medical profile edit
            }}
          />
          <SettingsItem
            label="Emergency contacts"
            onPress={() => {
              // TODO: Navigate to emergency contacts
            }}
          />
          <SettingsItem
            label="Reset password"
            onPress={() => {
              // TODO: Navigate to reset password
            }}
            isLast
          />
        </SettingsSection>

        {/* Notifications Section */}
        <SettingsSection title="Notifications" icon="notifications">
          <SettingsItem
            label="Medication reminders"
            rightIcon="toggle"
            toggleValue={medicationReminders}
            onToggleChange={setMedicationReminders}
          />
          <SettingsItem
            label="Daily check-in reminders"
            rightIcon="toggle"
            toggleValue={checkInReminders}
            onToggleChange={setCheckInReminders}
          />
          <SettingsItem
            label="Emergency alerts"
            rightIcon="toggle"
            toggleValue={emergencyAlerts}
            onToggleChange={setEmergencyAlerts}
            isLast
          />
        </SettingsSection>

        {/* Health & Safety Section */}
        <SettingsSection title="Health & Safety" icon="shield-checkmark">
          <SettingsItem
            label="Location tracking"
            rightIcon="toggle"
            toggleValue={locationTracking}
            onToggleChange={setLocationTracking}
          />
          <SettingsItem
            label="First Responder Mode"
            onPress={() => router.push('/(tabs)/first-responder')}
            isLast
          />
        </SettingsSection>

        {/* ALARA Settings Section */}
        <SettingsSection title="ALARA" icon="chatbubbles">
          <View style={styles.personalityContainer}>
            <Typography variant="body" color="textSecondary" style={styles.personalityDescription}>
              Choose ALARA's personality. This affects how ALARA responds to you in chat.
            </Typography>
            <PersonalitySelector value={personality} onChange={setPersonality} />
          </View>
        </SettingsSection>

        {/* App Settings Section */}
        <SettingsSection title="App" icon="settings">
          <SettingsItem
            label="Dark mode"
            rightIcon="toggle"
            toggleValue={theme === 'dark'}
            onToggleChange={handleThemeChange}
          />
          <SettingsItem
            label="Privacy & Data"
            onPress={() => {
              // TODO: Navigate to privacy
            }}
          />
          <SettingsItem
            label="About PulseGuard"
            onPress={() => {
              // TODO: Navigate to about
            }}
            isLast
          />
          <TouchableOpacity
            onPress={handleSignOut}
            activeOpacity={0.7}
            style={[styles.logOutItem, { borderTopColor: colors.border + '20' }]}
          >
            <Typography variant="body" style={[styles.logOutText, { color: colors.error }]}>
              Log Out
            </Typography>
          </TouchableOpacity>
        </SettingsSection>
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
  logOutItem: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderTopWidth: 1,
  },
  logOutText: {
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



