import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from '../../src/components/ui/SafeAreaView';
import { MedicationTrackingScreen } from '../../src/components/medication';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { BottomSheet } from '../../src/components/ui/BottomSheet';
import { MedicationForm } from '../../src/components/medication/MedicationForm';
import { FloatingActionButton } from '../../src/components/ui/FloatingActionButton';
import { useAuth } from '../../src/context/AuthContext';
import {
  getMedications,
  addMedication,
  updateMedication,
  deleteMedication,
  logDose,
} from '../../src/lib/services/medicationService';
import type { Medication } from '../../src/types/health';

export default function MedicationsScreen() {
  const { user } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMedicationForm, setShowMedicationForm] = useState(false);
  const [editingMedication, setEditingMedication] = useState<{ medication: Medication; index: number } | null>(null);

  useEffect(() => {
    loadMedications();
  }, [user?.id]);

  const loadMedications = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const meds = await getMedications(user.id);
      setMedications(meds);
    } catch (error) {
      console.error('Error loading medications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDoseTaken = async (medicationId: string, doseId: string, takenAt: string) => {
    if (!user?.id) return;

    // Find the medication
    const medication = medications.find((_, index) => `med-${index}` === medicationId);
    if (!medication) return;

    try {
      await logDose(
        user.id,
        medicationId,
        medication.name,
        medication.dosage,
        '09:00' // This should come from the dose data
      );
      
      // Reload medications to refresh the UI
      await loadMedications();
    } catch (error) {
      console.error('Error saving dose:', error);
    }
  };

  const handleAddMedication = () => {
    setEditingMedication(null);
    setShowMedicationForm(true);
  };

  const handleEditMedication = (medication: Medication, index: number) => {
    setEditingMedication({ medication, index });
    setShowMedicationForm(true);
  };

  const handleSaveMedication = async (medication: Medication) => {
    if (!user?.id) return;

    try {
      if (editingMedication) {
        // Update existing medication (use name to find it)
        const success = await updateMedication(
          user.id,
          editingMedication.medication.name,
          medication
        );
        if (success) {
          await loadMedications();
          setShowMedicationForm(false);
          setEditingMedication(null);
        } else {
          Alert.alert('Error', 'Failed to update medication. Please try again.');
        }
      } else {
        // Add new medication
        const success = await addMedication(user.id, medication);
        if (success) {
          await loadMedications();
          setShowMedicationForm(false);
        } else {
          Alert.alert('Error', 'Failed to add medication. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error saving medication:', error);
      Alert.alert('Error', 'An error occurred. Please try again.');
    }
  };

  const handleDeleteMedication = async () => {
    if (!user?.id || !editingMedication) return;

    Alert.alert(
      'Delete Medication?',
      `Are you sure you want to delete ${editingMedication.medication.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await deleteMedication(
                user.id,
                editingMedication.medication.name
              );
              if (success) {
                await loadMedications();
                setShowMedicationForm(false);
                setEditingMedication(null);
              } else {
                Alert.alert('Error', 'Failed to delete medication. Please try again.');
              }
            } catch (error) {
              console.error('Error deleting medication:', error);
              Alert.alert('Error', 'An error occurred. Please try again.');
            }
          },
        },
      ]
    );
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
        onEditMedication={handleEditMedication}
      />
      
      <FloatingActionButton
        icon="➕"
        label="Add Medication"
        onPress={handleAddMedication}
        variant="primary"
      />

      <BottomSheet
        visible={showMedicationForm}
        onClose={() => {
          setShowMedicationForm(false);
          setEditingMedication(null);
        }}
      >
        <MedicationForm
          medication={editingMedication?.medication || null}
          onSave={handleSaveMedication}
          onCancel={() => {
            setShowMedicationForm(false);
            setEditingMedication(null);
          }}
          onDelete={editingMedication ? handleDeleteMedication : undefined}
        />
      </BottomSheet>
    </SafeAreaView>
  );
}

