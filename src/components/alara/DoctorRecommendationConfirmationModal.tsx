/**
 * Doctor Recommendation Confirmation Modal
 * Shows parsed recommendation and proposed reminder for user approval
 */

import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import type { DoctorRecommendationConfirmation } from '../../lib/openrouter/doctorRecommendationExecutor';

interface DoctorRecommendationConfirmationModalProps {
  visible: boolean;
  confirmationData: DoctorRecommendationConfirmation;
  onApprove: () => void;
  onReject: () => void;
  onEdit: (updatedData: DoctorRecommendationConfirmation) => void;
}

export function DoctorRecommendationConfirmationModal({
  visible,
  confirmationData,
  onApprove,
  onReject,
  onEdit,
}: DoctorRecommendationConfirmationModalProps) {
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
          <Text style={styles.title}>Doctor Recommendation</Text>
          <Text style={styles.subtitle}>Review and approve the proposed reminder</Text>

          <ScrollView style={styles.scrollView}>
            <View style={styles.detailsContainer}>
              <View style={styles.recommendationBox}>
                <Text style={styles.recommendationLabel}>👨‍⚕️ Doctor Said:</Text>
                <Text style={styles.recommendationText}>
                  "{confirmationData.recommendationText}"
                </Text>
              </View>

              {confirmationData.action && (
                <View style={styles.detailRow}>
                  <Text style={styles.label}>📋 Action:</Text>
                  <Text style={styles.value}>{confirmationData.action}</Text>
                </View>
              )}

              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>Proposed Reminder</Text>

              <View style={styles.detailRow}>
                <Text style={styles.label}>📝 Title:</Text>
                <Text style={styles.value}>{confirmationData.proposedReminder.title}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.label}>🔄 Type:</Text>
                <Text style={styles.value}>
                  {confirmationData.proposedReminder.isRecurring ? 'Recurring' : 'One-time'}
                </Text>
              </View>

              {confirmationData.proposedReminder.isRecurring ? (
                <>
                  <View style={styles.detailRow}>
                    <Text style={styles.label}>📅 Days:</Text>
                    <Text style={styles.value}>
                      {confirmationData.proposedReminder.daysOfWeekFormatted || 'Every day'}
                    </Text>
                  </View>
                  {confirmationData.proposedReminder.interval && (
                    <View style={styles.detailRow}>
                      <Text style={styles.label}>⏰ Interval:</Text>
                      <Text style={styles.value}>
                        {confirmationData.proposedReminder.interval}
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.detailRow}>
                  <Text style={styles.label}>📅 Date:</Text>
                  <Text style={styles.value}>
                    {confirmationData.proposedReminder.oneTimeDateFormatted || 
                     confirmationData.proposedReminder.oneTimeDate}
                  </Text>
                </View>
              )}

              <View style={styles.detailRow}>
                <Text style={styles.label}>⏰ Time:</Text>
                <Text style={styles.value}>
                  {confirmationData.proposedReminder.time 
                    ? formatTime(confirmationData.proposedReminder.time) 
                    : '9:00 AM'}
                </Text>
              </View>

              <View style={styles.sourceBox}>
                <Text style={styles.sourceLabel}>ℹ️ Source:</Text>
                <Text style={styles.sourceText}>doctor_recommendation</Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.approveButton]}
              onPress={onApprove}
            >
              <Text style={styles.approveButtonText}>✅ Approve</Text>
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
              <Text style={styles.cancelButtonText}>❌ Decline</Text>
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
    maxHeight: '80%',
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
  scrollView: {
    maxHeight: 400,
  },
  detailsContainer: {
    marginBottom: 24,
  },
  recommendationBox: {
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  recommendationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 16,
    color: '#1a1a1a',
    fontStyle: 'italic',
    lineHeight: 22,
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
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  sourceBox: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  sourceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  sourceText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  buttonContainer: {
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#007AFF',
  },
  approveButtonText: {
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
