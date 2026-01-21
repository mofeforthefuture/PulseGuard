import React, { useState } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Typography } from '../ui/Typography';
import { Input } from '../ui/Input';
import { Spacing, BorderRadius } from '../../lib/design/tokens';
import { useColors } from '../../lib/design/useColors';
import {
  getMedicalCheckup,
  upsertMedicalCheckup,
  updateLastCheckupDate,
  updateCheckupInterval,
  getCheckupStatus,
  getDaysUntilNextCheckup,
  syncCheckupReminders,
} from '../../lib/services/checkupService';
import { useAuth } from '../../context/AuthContext';
import type { MedicalCheckup } from '../../types/care';

interface MedicalCheckupCardProps {
  checkup: MedicalCheckup | null;
  onCheckupUpdated?: () => void;
}

function formatDate(dateString?: string): string {
  if (!dateString) return 'Not set';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

function getStatusColor(status: string, colors: any): string {
  switch (status) {
    case 'overdue':
      return colors.emergency;
    case 'due_soon':
      return colors.concern;
    case 'up_to_date':
      return colors.calm;
    default:
      return colors.textLight;
  }
}

export function MedicalCheckupCard({ checkup, onCheckupUpdated }: MedicalCheckupCardProps) {
  const { user } = useAuth();
  const colors = useColors();
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showMarkCompleteModal, setShowMarkCompleteModal] = useState(false);
  const [intervalMonths, setIntervalMonths] = useState(
    checkup?.interval_months.toString() || '3'
  );
  const [isSaving, setIsSaving] = useState(false);

  const status = getCheckupStatus(checkup);
  const statusColor = getStatusColor(status.status, colors);

  const handleUpdateInterval = async () => {
    if (!user?.id) return;

    const interval = parseInt(intervalMonths, 10);
    if (isNaN(interval) || interval < 1 || interval > 24) {
      return;
    }

    setIsSaving(true);
    try {
      await updateCheckupInterval(user.id, interval);
      setShowSettingsModal(false);
      onCheckupUpdated?.();
    } catch (error) {
      console.error('Error updating interval:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const updated = await updateLastCheckupDate(user.id, today);
      if (updated) {
        await syncCheckupReminders(user.id, updated);
      }
      setShowMarkCompleteModal(false);
      onCheckupUpdated?.();
    } catch (error) {
      console.error('Error marking checkup complete:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInitialize = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      const interval = parseInt(intervalMonths, 10) || 3;
      await upsertMedicalCheckup(user.id, {
        interval_months: interval,
      });
      setShowSettingsModal(false);
      onCheckupUpdated?.();
    } catch (error) {
      console.error('Error initializing checkup:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!checkup) {
    return (
      <>
        <Card variant="calm">
          <Typography variant="h3" color="text" weight="semibold" style={styles.title}>
            Medical Checkup Tracking
          </Typography>
          <Typography variant="body" color="textSecondary" style={styles.subtitle}>
            Track your regular medical checkups
          </Typography>
          <Button
            title="Set Up Checkup Tracking"
            onPress={() => setShowSettingsModal(true)}
            style={styles.button}
          />
        </Card>

        <SettingsModal
          visible={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          intervalMonths={intervalMonths}
          onIntervalChange={setIntervalMonths}
          onSave={handleInitialize}
          isSaving={isSaving}
          isNew={true}
        />
      </>
    );
  }

  return (
    <>
      <Card variant={status.status === 'overdue' ? 'emergency' : status.status === 'due_soon' ? 'concern' : 'calm'}>
        <View style={styles.header}>
          <Typography variant="h3" color="text" weight="semibold" style={styles.title}>
            Medical Checkup
          </Typography>
          <TouchableOpacity
            onPress={() => setShowSettingsModal(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Typography variant="bodySmall" color="primary" weight="medium">
              Settings
            </Typography>
          </TouchableOpacity>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Typography variant="caption" color="textSecondary" style={styles.label}>
              Last Checkup
            </Typography>
            <Typography variant="body" color="text" weight="medium">
              {formatDate(checkup.last_checkup_date)}
            </Typography>
          </View>

          <View style={styles.infoItem}>
            <Typography variant="caption" color="textSecondary" style={styles.label}>
              Next Due
            </Typography>
            <Typography
              variant="body"
              style={[styles.nextDate, { color: statusColor }]}
              weight="semibold"
            >
              {formatDate(checkup.next_checkup_date)}
            </Typography>
          </View>
        </View>

        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Typography
              variant="caption"
              style={[styles.statusText, { color: statusColor }]}
              weight="semibold"
            >
              {status.message}
            </Typography>
          </View>
          <Typography variant="caption" color="textLight">
            Every {checkup.interval_months} {checkup.interval_months === 1 ? 'month' : 'months'}
          </Typography>
        </View>

        <Button
          title="Mark Checkup Complete"
          onPress={() => setShowMarkCompleteModal(true)}
          variant={status.status === 'overdue' ? 'emergency' : 'primary'}
          style={styles.button}
        />
      </Card>

      <SettingsModal
        visible={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        intervalMonths={intervalMonths}
        onIntervalChange={setIntervalMonths}
        onSave={handleUpdateInterval}
        isSaving={isSaving}
        isNew={false}
      />

      <MarkCompleteModal
        visible={showMarkCompleteModal}
        onClose={() => setShowMarkCompleteModal(false)}
        onConfirm={handleMarkComplete}
        isSaving={isSaving}
      />
    </>
  );
}

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  intervalMonths: string;
  onIntervalChange: (value: string) => void;
  onSave: () => void;
  isSaving: boolean;
  isNew: boolean;
}

function SettingsModal({
  visible,
  onClose,
  intervalMonths,
  onIntervalChange,
  onSave,
  isSaving,
  isNew,
}: SettingsModalProps) {
  const colors = useColors();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Card style={styles.modalContent}>
          <Typography variant="h2" color="text" weight="bold" style={styles.modalTitle}>
            {isNew ? 'Set Up Checkup Tracking' : 'Checkup Settings'}
          </Typography>

          <Input
            label="Checkup Interval (months)"
            value={intervalMonths}
            onChangeText={(text) => onIntervalChange(text.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            placeholder="3"
            containerStyle={styles.inputContainer}
          />

          <Typography variant="bodySmall" color="textSecondary" style={styles.helpText}>
            How often should you have a medical checkup? (1-24 months)
          </Typography>

          <View style={styles.modalButtons}>
            <Button
              title="Cancel"
              onPress={onClose}
              variant="outline"
              style={styles.modalButton}
            />
            <Button
              title={isSaving ? 'Saving...' : 'Save'}
              onPress={onSave}
              disabled={isSaving || !intervalMonths || parseInt(intervalMonths, 10) < 1}
              style={styles.modalButton}
            />
          </View>
        </Card>
      </View>
    </Modal>
  );
}

interface MarkCompleteModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSaving: boolean;
}

function MarkCompleteModal({ visible, onClose, onConfirm, isSaving }: MarkCompleteModalProps) {
  const colors = useColors();
  const today = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Card style={styles.modalContent}>
          <Typography variant="h2" color="text" weight="bold" style={styles.modalTitle}>
            Mark Checkup Complete
          </Typography>

          <Typography variant="body" color="text" style={styles.confirmText}>
            Mark your checkup as completed on {today}?
          </Typography>

          <Typography variant="bodySmall" color="textSecondary" style={styles.helpText}>
            This will update your last checkup date and calculate your next due date.
          </Typography>

          <View style={styles.modalButtons}>
            <Button
              title="Cancel"
              onPress={onClose}
              variant="outline"
              style={styles.modalButton}
            />
            <Button
              title={isSaving ? 'Saving...' : 'Confirm'}
              onPress={onConfirm}
              disabled={isSaving}
              style={styles.modalButton}
            />
          </View>
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: Spacing.xs,
  },
  subtitle: {
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  infoItem: {
    flex: 1,
  },
  label: {
    marginBottom: Spacing.xs / 2,
  },
  nextDate: {
    fontSize: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: 11,
  },
  button: {
    marginTop: Spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    marginBottom: Spacing.md,
  },
  inputContainer: {
    marginBottom: Spacing.sm,
  },
  helpText: {
    marginBottom: Spacing.md,
  },
  confirmText: {
    marginBottom: Spacing.sm,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  modalButton: {
    flex: 1,
  },
});
