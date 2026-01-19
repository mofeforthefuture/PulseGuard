/**
 * Step Tracker Service
 * Handles device step tracking with graceful fallback to manual entry
 * 
 * Platform Support:
 * - iOS: Uses Expo Pedometer (can query historical data)
 * - Android: Uses Expo Pedometer (real-time only, limited)
 * - Future: Can integrate HealthKit (iOS) and Health Connect (Android)
 */

import { Platform } from 'react-native';
import { Pedometer } from 'expo-sensors';

export interface StepData {
  steps: number;
  source: 'device' | 'manual';
  timestamp: Date;
}

export interface StepTrackingStatus {
  isAvailable: boolean;
  hasPermission: boolean;
  canQueryHistorical: boolean; // iOS only
  platform: 'ios' | 'android' | 'web';
}

/**
 * Check if step tracking is available on this device
 */
export async function checkStepTrackingAvailability(): Promise<StepTrackingStatus> {
  try {
    const isAvailable = await Pedometer.isAvailableAsync();
    
    // Request permissions
    let hasPermission = false;
    if (isAvailable) {
      // On iOS, we need to request motion permissions
      // On Android, permissions are handled automatically
      hasPermission = true; // Expo Pedometer handles permissions internally
    }

    return {
      isAvailable,
      hasPermission,
      canQueryHistorical: Platform.OS === 'ios' && isAvailable, // Only iOS supports historical queries
      platform: Platform.OS as 'ios' | 'android' | 'web',
    };
  } catch (error) {
    console.error('[StepTracker] Error checking availability:', error);
    return {
      isAvailable: false,
      hasPermission: false,
      canQueryHistorical: false,
      platform: Platform.OS as 'ios' | 'android' | 'web',
    };
  }
}

/**
 * Get today's step count from device
 * Works on iOS (historical query) and Android (real-time only)
 */
export async function getTodayStepCount(): Promise<number | null> {
  try {
    const isAvailable = await Pedometer.isAvailableAsync();
    if (!isAvailable) {
      return null;
    }

    // On iOS, we can query historical data
    if (Platform.OS === 'ios') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const now = new Date();

      const result = await Pedometer.getStepCountAsync(today, now);
      return result?.steps || null;
    }

    // On Android, we can only watch real-time steps
    // For today's total, we'd need to track it ourselves or use Health Connect
    // For now, return null and let user enter manually
    return null;
  } catch (error) {
    console.error('[StepTracker] Error getting step count:', error);
    return null;
  }
}

/**
 * Watch step count in real-time (works on both iOS and Android)
 * Returns a subscription that can be cleaned up
 */
export function watchStepCount(
  callback: (data: { steps: number }) => void
): { remove: () => void } | null {
  try {
    const subscription = Pedometer.watchStepCount(callback);
    return {
      remove: () => {
        subscription.remove();
      },
    };
  } catch (error) {
    console.error('[StepTracker] Error watching step count:', error);
    return null;
  }
}

/**
 * Get step count for a date range (iOS only)
 */
export async function getStepCountForRange(
  startDate: Date,
  endDate: Date
): Promise<number | null> {
  try {
    if (Platform.OS !== 'ios') {
      console.warn('[StepTracker] Historical queries only supported on iOS');
      return null;
    }

    const isAvailable = await Pedometer.isAvailableAsync();
    if (!isAvailable) {
      return null;
    }

    const result = await Pedometer.getStepCountAsync(startDate, endDate);
    return result?.steps || null;
  } catch (error) {
    console.error('[StepTracker] Error getting step count for range:', error);
    return null;
  }
}

/**
 * Request motion permissions (iOS)
 * Note: Expo Pedometer handles permissions automatically, but you may want to
 * request explicitly for better UX
 */
export async function requestMotionPermissions(): Promise<boolean> {
  try {
    // Expo Pedometer automatically requests permissions when needed
    // This is a placeholder for future HealthKit integration
    const isAvailable = await Pedometer.isAvailableAsync();
    return isAvailable;
  } catch (error) {
    console.error('[StepTracker] Error requesting permissions:', error);
    return false;
  }
}
