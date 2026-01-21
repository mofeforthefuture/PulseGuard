/**
 * Doctor Visit Confirmation Modal
 * Shows extracted doctor visit data for user confirmation
 */

import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import type { DoctorVisitConfirmation } from '../../lib/openrouter/doctorVisitExecutor';

interface DoctorVisitConfirmationModalProps {
  visible: boolean;
  confirmationData: DoctorVisitConfirmation;
  onConfirm: () => void;
  onReject: () => void;
  onEdit: (updatedData: DoctorVisitConfirmation) => void;
}

export function DoctorVisitConfirmationModal({
  visible,
  confirmationData,
  onConfirm,
  onReject,
  onEdit,
}: DoctorVisitConfirmationModalProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onReject}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Confirm Doctor Visit Details</Text>
          <Text style={styles.subtitle}>Please review and confirm the extracted information</Text>

          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.label}>📅 Visit Date:</Text>
              <Text style={styles.value}>{formatDate(confirmationData.visitDate)}</Text>
            </View>

            {confirmationData.followUpDate && (
              <View style={styles.detailRow}>
                <Text style={styles.label}>🔄 Follow-up:</Text>
                <Text style={styles.value}>
                  {confirmationData.followUpTiming || 'Scheduled'}
                  {'\n'}
                  <Text style={styles.dateValue}>
                    ({formatDate(confirmationData.followUpDate)})
                  </Text>
                </Text>
              </View>
            )}

            {confirmationData.diagnosis && (
              <View style={styles.detailRow}>
                <Text style={styles.label}>📋 Diagnosis:</Text>
                <Text style={styles.value}>{confirmationData.diagnosis}</Text>
              </View>
            )}

            {confirmationData.treatment && (
              <View style={styles.detailRow}>
                <Text style={styles.label}>💊 Treatment:</Text>
                <Text style={styles.value}>{confirmationData.treatment}</Text>
              </View>
            )}

            {confirmationData.medicationChanges && (
              <View style={styles.detailRow}>
                <Text style={styles.label}>💉 Medication Changes:</Text>
                <Text style={styles.value}>{confirmationData.medicationChanges}</Text>
              </View>
            )}

            {confirmationData.notes && (
              <View style={styles.detailRow}>
                <Text style={styles.label}>📝 Notes:</Text>
                <Text style={styles.value}>{confirmationData.notes}</Text>
              </View>
            )}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmButtonText}>✅ Confirm</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.editButton]}
              onPress={() => onEdit(confirmationData)}
            >
              <Text style={styles.editButtonText}>✏️ Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onReject}
            >
              <Text style={styles.cancelButtonText}>❌ Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  detailsContainer: {
    marginBottom: 24,
  },
  detailRow: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#1a1a1a',
    lineHeight: 22,
  },
  dateValue: {
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: '#F0F0F0',
  },
  editButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
});
