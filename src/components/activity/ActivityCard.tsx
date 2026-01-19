/**
 * Activity Card Component
 * FLO-inspired soft card UI for daily step tracking
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useColors } from '../../lib/design/useColors';
import { Typography } from '../ui/Typography';
import { Spacing, BorderRadius, Shadows, Gradients } from '../../lib/design/tokens';
import {
  getTodayActivity,
  saveActivityLog,
  getWeeklyActivityTrend,
  type WeeklyActivityTrend,
} from '../../lib/services/activityService';
import {
  checkStepTrackingAvailability,
  getTodayStepCount,
  type StepTrackingStatus,
} from '../../lib/services/stepTracker';

export function ActivityCard() {
  const { user } = useAuth();
  const colors = useColors();
  const [steps, setSteps] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [weeklyTrend, setWeeklyTrend] = useState<WeeklyActivityTrend[]>([]);
  const [stepTrackingStatus, setStepTrackingStatus] = useState<StepTrackingStatus | null>(null);
  const [isLoadingDeviceSteps, setIsLoadingDeviceSteps] = useState(false);

  // Load today's activity on mount
  useEffect(() => {
    if (user?.id) {
      loadTodayActivity();
      loadWeeklyTrend();
      checkDeviceStepTracking();
    }
  }, [user?.id]);

  // Check device step tracking availability
  const checkDeviceStepTracking = async () => {
    try {
      const status = await checkStepTrackingAvailability();
      setStepTrackingStatus(status);
    } catch (error) {
      console.error('[ActivityCard] Error checking step tracking:', error);
    }
  };

  // Load steps from device
  const loadDeviceSteps = async () => {
    if (!stepTrackingStatus?.isAvailable) {
      Alert.alert(
        'Step Tracking Unavailable',
        'Step tracking is not available on this device. Please enter your steps manually.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsLoadingDeviceSteps(true);
    try {
      const deviceSteps = await getTodayStepCount();
      
      if (deviceSteps !== null && deviceSteps > 0) {
        // Update the steps input with device data
        setSteps(deviceSteps.toString());
        
        // Auto-save if we have a user
        if (user?.id) {
          await saveActivityLog(user.id, deviceSteps, notes.trim() || undefined, 'device');
          await loadWeeklyTrend(); // Refresh trend
        }
      } else if (stepTrackingStatus.platform === 'android') {
        Alert.alert(
          'Android Step Tracking',
          'On Android, we can only track steps in real-time. Please use manual entry or sync with a fitness app.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('[ActivityCard] Error loading device steps:', error);
      Alert.alert(
        'Error',
        'Could not load steps from device. Please enter manually.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoadingDeviceSteps(false);
    }
  };

  const loadTodayActivity = async () => {
    if (!user?.id) return;

    try {
      const activity = await getTodayActivity(user.id);
      if (activity) {
        setSteps(activity.steps_count.toString());
        setNotes(activity.activity_notes || '');
      } else {
        setSteps('');
        setNotes('');
      }
    } catch (error) {
      console.error('[ActivityCard] Error loading activity:', error);
    }
  };

  const loadWeeklyTrend = async () => {
    if (!user?.id) return;

    try {
      const trend = await getWeeklyActivityTrend(user.id);
      setWeeklyTrend(trend);
    } catch (error) {
      console.error('[ActivityCard] Error loading weekly trend:', error);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    const stepsNum = parseInt(steps, 10);
    if (isNaN(stepsNum) || stepsNum < 0) {
      return;
    }

    setIsLoading(true);
    try {
      const success = await saveActivityLog(
        user.id,
        stepsNum,
        notes.trim() || undefined,
        'manual'
      );

      if (success) {
        setIsEditing(false);
        await loadWeeklyTrend(); // Refresh weekly trend
      }
    } catch (error) {
      console.error('[ActivityCard] Error saving activity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatSteps = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const getWeeklyAverage = (): number => {
    if (weeklyTrend.length === 0) return 0;
    const total = weeklyTrend.reduce((sum, day) => sum + day.steps_count, 0);
    return Math.round(total / weeklyTrend.length);
  };

  const stepsValue = steps ? parseInt(steps, 10) : 0;
  const weeklyAverage = getWeeklyAverage();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Gradients.calm.start, Gradients.calm.end]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Typography variant="h3" weight="semibold" color="text">
              Today's Movement
            </Typography>
            {!isEditing && (
              <View style={styles.headerActions}>
                {stepTrackingStatus?.isAvailable && (
                  <TouchableOpacity
                    onPress={loadDeviceSteps}
                    disabled={isLoadingDeviceSteps}
                    style={styles.syncButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Typography
                      variant="caption"
                      color="textSecondary"
                      style={{ opacity: isLoadingDeviceSteps ? 0.5 : 1 }}
                    >
                      {isLoadingDeviceSteps ? 'Loading...' : '📱 Sync'}
                    </Typography>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => setIsEditing(true)}
                  style={styles.editButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Typography variant="caption" color="textSecondary">
                    {stepsValue > 0 ? 'Edit' : 'Add Steps'}
                  </Typography>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Steps Display/Input */}
          {isEditing ? (
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.stepsInput, { color: colors.text }]}
                value={steps}
                onChangeText={setSteps}
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
                autoFocus
                maxLength={6}
              />
              <Typography variant="body" color="textSecondary" style={styles.stepsLabel}>
                steps
              </Typography>
            </View>
          ) : (
            <View style={styles.stepsDisplay}>
              <Typography variant="display" weight="bold" color="text">
                {formatSteps(stepsValue)}
              </Typography>
              <Typography variant="body" color="textSecondary" style={styles.stepsLabel}>
                steps
              </Typography>
            </View>
          )}

          {/* Notes Input (when editing) */}
          {isEditing && (
            <TextInput
              style={[styles.notesInput, { color: colors.text, borderColor: colors.border }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes (optional)"
              placeholderTextColor={colors.textSecondary}
              multiline
              maxLength={200}
            />
          )}

          {/* Weekly Average */}
          {weeklyAverage > 0 && !isEditing && (
            <View style={styles.weeklyInfo}>
              <Typography variant="caption" color="textSecondary">
                Weekly avg: {formatSteps(weeklyAverage)} steps
              </Typography>
            </View>
          )}

          {/* Simple Weekly Trend */}
          {weeklyTrend.length > 0 && !isEditing && (
            <View style={styles.trendContainer}>
              <Typography variant="caption" color="textSecondary" style={styles.trendLabel}>
                Last 7 days
              </Typography>
              <View style={styles.trendBars}>
                {weeklyTrend.slice(-7).map((day, index) => {
                  const maxSteps = Math.max(...weeklyTrend.map((d) => d.steps_count), 1);
                  const height = maxSteps > 0 ? (day.steps_count / maxSteps) * 40 : 0;
                  
                  return (
                    <View key={index} style={styles.trendBarContainer}>
                      <View
                        style={[
                          styles.trendBar,
                          {
                            height: Math.max(height, 4),
                            backgroundColor: colors.primary + '40',
                          },
                        ]}
                      />
                      <Typography variant="caption" color="textSecondary" style={styles.trendDay}>
                        {new Date(day.date).getDate()}
                      </Typography>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Action Buttons (when editing) */}
          {isEditing && (
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() => {
                  setIsEditing(false);
                  loadTodayActivity(); // Reset to saved values
                }}
                style={[styles.cancelButton, { borderColor: colors.border }]}
              >
                <Typography variant="body" color="textSecondary">
                  Cancel
                </Typography>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                disabled={isLoading || !steps || isNaN(parseInt(steps, 10))}
                style={[
                  styles.saveButton,
                  {
                    backgroundColor: colors.primary,
                    opacity: isLoading || !steps || isNaN(parseInt(steps, 10)) ? 0.5 : 1,
                  },
                ]}
              >
                <Typography variant="body" weight="semibold" color="text" style={{ color: '#FFFFFF' }}>
                  {isLoading ? 'Saving...' : 'Save'}
                </Typography>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
  },
  card: {
    borderRadius: BorderRadius.xl,
    ...Platform.select({
      ios: {
        ...Shadows.md,
      },
      android: {
        elevation: 4,
      },
    }),
    overflow: 'hidden',
  },
  content: {
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  syncButton: {
    padding: Spacing.xs,
    marginRight: Spacing.xs,
  },
  editButton: {
    padding: Spacing.xs,
  },
  stepsDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.md,
  },
  stepsInput: {
    fontSize: 48,
    fontWeight: '700',
    minWidth: 120,
    marginRight: Spacing.xs,
  },
  stepsLabel: {
    marginLeft: Spacing.xs,
    fontSize: 18,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    minHeight: 60,
    fontSize: 14,
  },
  weeklyInfo: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  trendContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  trendLabel: {
    marginBottom: Spacing.xs,
  },
  trendBars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 60,
    marginTop: Spacing.xs,
  },
  trendBarContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: 2,
  },
  trendBar: {
    width: '80%',
    borderRadius: BorderRadius.sm,
    minHeight: 4,
  },
  trendDay: {
    marginTop: Spacing.xs,
    fontSize: 10,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  cancelButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  saveButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
});
