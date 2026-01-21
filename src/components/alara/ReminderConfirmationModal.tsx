/**
 * Reminder Confirmation Modal
 * Shows extracted reminder data for user confirmation
 */

import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import type { ReminderConfirmation } from '../../lib/openrouter/reminderExecutor';

interface ReminderConfirmationModalProps {
  visible: boolean;
  confirmationData: ReminderConfirmation;
  onConfirm: () => void;
  onReject: () => void;
  onEdit: (updatedData: ReminderConfirmation) => void;
}

export function ReminderConfirmationModal({
  visible,
  confirmationData,
  onConfirm,
  onReject,
  onEdit,
}: ReminderConfirmationModalProps) {
  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':');
    const h = parseInt(hour, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return `${displayHour}:${minute} ${ampm}`;
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
          <Text style={styles.title}>Confirm Reminder</Text>
          <Text style={styles.subtitle}>Please review the reminder details</Text>

          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.label}>📝 Title:</Text>
              <Text style={styles.value}>{confirmationData.title}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>🔄 Type:</Text>
              <Text style={styles.value}>
                {confirmationData.isRecurring ? 'Recurring' : 'One-time'}
              </Text>
            </View>

            {confirmationData.isRecurring ? (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.label}>📅 Days:</Text>
                  <Text style={styles.value}>
                    {confirmationData.daysOfWeekFormatted || 'Every day'}
                  </Text>
                </View>
                {confirmationData.interval && (
                  <View style={styles.detailRow}>
                    <Text style={styles.label}>⏰ Interval:</Text>
                    <Text style={styles.value}>{confirmationData.interval}</Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.detailRow}>
                <Text style={styles.label}>📅 Date:</Text>
                <Text style={styles.value}>
                  {confirmationData.oneTimeDateFormatted || confirmationData.oneTimeDate}
                </Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.label}>⏰ Time:</Text>
              <Text style={styles.value}>
                {confirmationData.time ? formatTime(confirmationData.time) : '9:00 AM'}
              </Text>
            </View>

            {confirmationData.description && (
              <View style={styles.detailRow}>
                <Text style={styles.label}>📋 Description:</Text>
                <Text style={styles.value}>{confirmationData.description}</Text>
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
