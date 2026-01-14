import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from '../../src/components/ui/SafeAreaView';
import { FirstResponderModeScreen } from '../../src/components/firstresponder';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/lib/supabase/client';
import { MedicalProfile } from '../../src/types/health';
import { Colors, Spacing } from '../../src/lib/design/tokens';

export default function FirstResponderModePage() {
  const { user } = useAuth();
  const [medicalProfiles, setMedicalProfiles] = useState<MedicalProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMedicalProfiles();
  }, [user]);

  const loadMedicalProfiles = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('medical_profiles')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error loading medical profiles:', error);
      } else {
        // Transform data to match MedicalProfile interface
        const profiles: MedicalProfile[] = (data || []).map((profile) => ({
          id: profile.id,
          user_id: profile.user_id,
          condition_type: profile.condition_type,
          condition_name: profile.condition_name || undefined,
          severity: profile.severity || undefined,
          diagnosis_date: profile.diagnosis_date || undefined,
          medications: (profile.medications as any) || undefined,
          triggers: (profile.triggers as any) || undefined,
          emergency_instructions: profile.emergency_instructions || undefined,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
        }));
        setMedicalProfiles(profiles);
      }
    } catch (error) {
      console.error('Error loading medical profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <SafeAreaView>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <FirstResponderModeScreen
      user={user}
      medicalProfiles={medicalProfiles}
      emergencyContactName={user.emergency_contact_name || undefined}
      emergencyContactPhone={user.emergency_contact_phone || undefined}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
});
