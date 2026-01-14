import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from '../../src/components/ui/SafeAreaView';
import { MedicationTrackingScreen } from '../../src/components/medication';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/lib/supabase/client';
import { Medication } from '../../src/types/health';

export default function MedicationsScreen() {
  const { user } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMedications();
  }, [user]);

  const loadMedications = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('medical_profiles')
        .select('medications')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error loading medications:', error);
      } else {
        // Extract medications from all profiles
        const allMedications: Medication[] = [];
        (data || []).forEach((profile) => {
          if (profile.medications && Array.isArray(profile.medications)) {
            allMedications.push(...(profile.medications as Medication[]));
          }
        });
        setMedications(allMedications);
      }
    } catch (error) {
      console.error('Error loading medications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDoseTaken = async (medicationId: string, doseId: string, takenAt: string) => {
    // TODO: Save to health_entries or check_ins
    console.log('Dose taken:', { medicationId, doseId, takenAt });
    
    // For now, just log it
    // In production, you'd save this to the database
    try {
      const { error } = await supabase.from('health_entries').insert({
        user_id: user?.id,
        entry_type: 'medication',
        data: {
          medication_id: medicationId,
          dose_id: doseId,
          taken_at: takenAt,
        },
      });

      if (error) {
        console.error('Error saving dose:', error);
      }
    } catch (error) {
      console.error('Error saving dose:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView>
        <LoadingState message="Loading your medications..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView>
      <MedicationTrackingScreen
        medications={medications}
        onDoseTaken={handleDoseTaken}
      />
    </SafeAreaView>
  );
}

