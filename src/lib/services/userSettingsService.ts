/**
 * User Settings Service
 * Handles user profile settings and preferences
 */

import { supabase } from '../supabase/client';

export interface UserSettings {
  medication_reminders_enabled?: boolean;
  check_in_reminders_enabled?: boolean;
  emergency_alerts_enabled?: boolean;
  location_tracking_enabled?: boolean;
}

/**
 * Get user settings
 */
export async function getUserSettings(userId: string): Promise<UserSettings> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('medication_reminders_enabled, check_in_reminders_enabled, emergency_alerts_enabled, location_tracking_enabled')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[UserSettings] Error fetching settings:', error);
      return {
        medication_reminders_enabled: true,
        check_in_reminders_enabled: true,
        emergency_alerts_enabled: true,
        location_tracking_enabled: true,
      };
    }

    return {
      medication_reminders_enabled: data?.medication_reminders_enabled ?? true,
      check_in_reminders_enabled: data?.check_in_reminders_enabled ?? true,
      emergency_alerts_enabled: data?.emergency_alerts_enabled ?? true,
      location_tracking_enabled: data?.location_tracking_enabled ?? true,
    };
  } catch (error) {
    console.error('[UserSettings] Error fetching settings:', error);
    return {
      medication_reminders_enabled: true,
      check_in_reminders_enabled: true,
      emergency_alerts_enabled: true,
      location_tracking_enabled: true,
    };
  }
}

/**
 * Update user settings
 */
export async function updateUserSettings(
  userId: string,
  settings: Partial<UserSettings>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update(settings)
      .eq('id', userId);

    if (error) {
      console.error('[UserSettings] Error updating settings:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[UserSettings] Error updating settings:', error);
    return false;
  }
}
