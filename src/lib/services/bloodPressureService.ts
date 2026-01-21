/**
 * Blood Pressure Service
 * Handles blood pressure logging and retrieval
 */

import { supabase } from '../supabase/client';
import type { BloodPressureReading, BloodPressureInput, AbnormalReason } from '../../types/care';

/**
 * Check if blood pressure reading is abnormal
 * Based on AHA guidelines:
 * - Normal: <120/<80
 * - Elevated: 120-129/<80
 * - High Stage 1: 130-139/80-89
 * - High Stage 2: 140+/90+
 * - Crisis: >180/>120
 */
function checkIfAbnormal(systolic: number, diastolic: number): {
  isAbnormal: boolean;
  reason: AbnormalReason;
} {
  // Crisis - immediate concern
  if (systolic >= 180 || diastolic >= 120) {
    return { isAbnormal: true, reason: 'both_high' };
  }

  // High Stage 2
  if (systolic >= 140 || diastolic >= 90) {
    if (systolic >= 140 && diastolic >= 90) {
      return { isAbnormal: true, reason: 'both_high' };
    } else if (systolic >= 140) {
      return { isAbnormal: true, reason: 'high_systolic' };
    } else {
      return { isAbnormal: true, reason: 'high_diastolic' };
    }
  }

  // High Stage 1
  if (systolic >= 130 || diastolic >= 80) {
    if (systolic >= 130 && diastolic >= 80) {
      return { isAbnormal: true, reason: 'both_high' };
    } else if (systolic >= 130) {
      return { isAbnormal: true, reason: 'high_systolic' };
    } else {
      return { isAbnormal: true, reason: 'high_diastolic' };
    }
  }

  // Low blood pressure (hypotension)
  if (systolic < 90 || diastolic < 60) {
    if (systolic < 90 && diastolic < 60) {
      return { isAbnormal: true, reason: 'both_low' };
    } else if (systolic < 90) {
      return { isAbnormal: true, reason: 'low_systolic' };
    } else {
      return { isAbnormal: true, reason: 'low_diastolic' };
    }
  }

  // Normal range
  return { isAbnormal: false, reason: null };
}

/**
 * Log a blood pressure reading
 */
export async function logBloodPressure(
  userId: string,
  input: BloodPressureInput
): Promise<BloodPressureReading | null> {
  try {
    const { isAbnormal, reason } = checkIfAbnormal(input.systolic, input.diastolic);

    const { data, error } = await supabase
      .from('blood_pressure_logs')
      .insert({
        user_id: userId,
        systolic: input.systolic,
        diastolic: input.diastolic,
        pulse: input.pulse || null,
        notes: input.notes || null,
        position: input.position || null,
        is_abnormal: isAbnormal,
        abnormal_reason: reason || null,
        recorded_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[BloodPressure] Error logging reading:', error);
      return null;
    }

    return data as BloodPressureReading;
  } catch (error) {
    console.error('[BloodPressure] Error logging reading:', error);
    return null;
  }
}

/**
 * Get recent blood pressure readings
 */
export async function getRecentBloodPressureReadings(
  userId: string,
  limit: number = 10
): Promise<BloodPressureReading[]> {
  try {
    const { data, error } = await supabase
      .from('blood_pressure_logs')
      .select('*')
      .eq('user_id', userId)
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[BloodPressure] Error fetching readings:', error);
      return [];
    }

    return (data || []) as BloodPressureReading[];
  } catch (error) {
    console.error('[BloodPressure] Error fetching readings:', error);
    return [];
  }
}

/**
 * Get blood pressure readings for a date range
 */
export async function getBloodPressureReadingsByDateRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<BloodPressureReading[]> {
  try {
    const { data, error } = await supabase
      .from('blood_pressure_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('recorded_at', startDate.toISOString())
      .lte('recorded_at', endDate.toISOString())
      .order('recorded_at', { ascending: false });

    if (error) {
      console.error('[BloodPressure] Error fetching readings by date range:', error);
      return [];
    }

    return (data || []) as BloodPressureReading[];
  } catch (error) {
    console.error('[BloodPressure] Error fetching readings by date range:', error);
    return [];
  }
}

/**
 * Get latest blood pressure reading
 */
export async function getLatestBloodPressureReading(
  userId: string
): Promise<BloodPressureReading | null> {
  try {
    const { data, error } = await supabase
      .from('blood_pressure_logs')
      .select('*')
      .eq('user_id', userId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No record found
        return null;
      }
      console.error('[BloodPressure] Error fetching latest reading:', error);
      return null;
    }

    return data as BloodPressureReading;
  } catch (error) {
    console.error('[BloodPressure] Error fetching latest reading:', error);
    return null;
  }
}

/**
 * Get abnormal readings count (for ALARA flagging)
 */
export async function getAbnormalReadingsCount(
  userId: string,
  days: number = 7
): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { count, error } = await supabase
      .from('blood_pressure_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_abnormal', true)
      .gte('recorded_at', cutoffDate.toISOString());

    if (error) {
      console.error('[BloodPressure] Error counting abnormal readings:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('[BloodPressure] Error counting abnormal readings:', error);
    return 0;
  }
}

/**
 * Delete a blood pressure reading
 */
export async function deleteBloodPressureReading(
  userId: string,
  readingId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('blood_pressure_logs')
      .delete()
      .eq('id', readingId)
      .eq('user_id', userId); // Ensure user owns the record

    if (error) {
      console.error('[BloodPressure] Error deleting reading:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[BloodPressure] Error deleting reading:', error);
    return false;
  }
}
