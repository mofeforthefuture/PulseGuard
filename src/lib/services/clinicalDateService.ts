/**
 * Clinical Date Service
 * Handles clinical date reminders (lab tests, scans, procedures, etc.)
 */

import { supabase } from '../supabase/client';
import type { ClinicalDate, ClinicalDateInput } from '../../types/care';

/**
 * Get all clinical dates for a user
 */
export async function getClinicalDates(
  userId: string,
  includeCompleted: boolean = false
): Promise<ClinicalDate[]> {
  try {
    let query = supabase
      .from('clinical_dates')
      .select('*')
      .eq('user_id', userId)
      .order('clinical_date', { ascending: true });

    if (!includeCompleted) {
      query = query.eq('is_completed', false);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[ClinicalDate] Error fetching clinical dates:', error);
      return [];
    }

    return (data || []) as ClinicalDate[];
  } catch (error) {
    console.error('[ClinicalDate] Error fetching clinical dates:', error);
    return [];
  }
}

/**
 * Get upcoming clinical dates
 */
export async function getUpcomingClinicalDates(
  userId: string,
  days: number = 30
): Promise<ClinicalDate[]> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + days);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('clinical_dates')
      .select('*')
      .eq('user_id', userId)
      .eq('is_completed', false)
      .gte('clinical_date', today)
      .lte('clinical_date', cutoffDateStr)
      .order('clinical_date', { ascending: true });

    if (error) {
      console.error('[ClinicalDate] Error fetching upcoming clinical dates:', error);
      return [];
    }

    return (data || []) as ClinicalDate[];
  } catch (error) {
    console.error('[ClinicalDate] Error fetching upcoming clinical dates:', error);
    return [];
  }
}

/**
 * Create a clinical date
 */
export async function createClinicalDate(
  userId: string,
  input: ClinicalDateInput
): Promise<ClinicalDate | null> {
  try {
    const { data, error } = await supabase
      .from('clinical_dates')
      .insert({
        user_id: userId,
        clinical_date: input.clinical_date,
        description: input.description,
        clinical_type: input.clinical_type || null,
        location: input.location || null,
        provider_name: input.provider_name || null,
        preparation_notes: input.preparation_notes || null,
        notes: input.notes || null,
        reminder_enabled: input.reminder_enabled !== false, // Default to true
      })
      .select()
      .single();

    if (error) {
      console.error('[ClinicalDate] Error creating clinical date:', error);
      return null;
    }

    return data as ClinicalDate;
  } catch (error) {
    console.error('[ClinicalDate] Error creating clinical date:', error);
    return null;
  }
}

/**
 * Update a clinical date
 */
export async function updateClinicalDate(
  userId: string,
  clinicalDateId: string,
  input: Partial<ClinicalDateInput>
): Promise<ClinicalDate | null> {
  try {
    const updateData: any = {};

    if (input.clinical_date !== undefined) updateData.clinical_date = input.clinical_date;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.clinical_type !== undefined) updateData.clinical_type = input.clinical_type || null;
    if (input.location !== undefined) updateData.location = input.location || null;
    if (input.provider_name !== undefined) updateData.provider_name = input.provider_name || null;
    if (input.preparation_notes !== undefined) updateData.preparation_notes = input.preparation_notes || null;
    if (input.notes !== undefined) updateData.notes = input.notes || null;
    if (input.reminder_enabled !== undefined) updateData.reminder_enabled = input.reminder_enabled;

    const { data, error } = await supabase
      .from('clinical_dates')
      .update(updateData)
      .eq('id', clinicalDateId)
      .eq('user_id', userId) // Ensure user owns the record
      .select()
      .single();

    if (error) {
      console.error('[ClinicalDate] Error updating clinical date:', error);
      return null;
    }

    return data as ClinicalDate;
  } catch (error) {
    console.error('[ClinicalDate] Error updating clinical date:', error);
    return null;
  }
}

/**
 * Mark a clinical date as completed
 */
export async function completeClinicalDate(
  userId: string,
  clinicalDateId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('clinical_dates')
      .update({
        is_completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq('id', clinicalDateId)
      .eq('user_id', userId);

    if (error) {
      console.error('[ClinicalDate] Error completing clinical date:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[ClinicalDate] Error completing clinical date:', error);
    return false;
  }
}

/**
 * Delete a clinical date
 */
export async function deleteClinicalDate(
  userId: string,
  clinicalDateId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('clinical_dates')
      .delete()
      .eq('id', clinicalDateId)
      .eq('user_id', userId);

    if (error) {
      console.error('[ClinicalDate] Error deleting clinical date:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[ClinicalDate] Error deleting clinical date:', error);
    return false;
  }
}

/**
 * Get days until clinical date
 */
export function getDaysUntilClinicalDate(clinicalDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(clinicalDate);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get clinical date status
 */
export function getClinicalDateStatus(clinicalDate: ClinicalDate): {
  status: 'upcoming' | 'today' | 'overdue' | 'completed';
  daysUntil: number;
  message: string;
} {
  if (clinicalDate.is_completed) {
    return {
      status: 'completed',
      daysUntil: 0,
      message: 'Completed',
    };
  }

  const daysUntil = getDaysUntilClinicalDate(clinicalDate.clinical_date);

  if (daysUntil < 0) {
    return {
      status: 'overdue',
      daysUntil,
      message: `Overdue by ${Math.abs(daysUntil)} ${Math.abs(daysUntil) === 1 ? 'day' : 'days'}`,
    };
  }

  if (daysUntil === 0) {
    return {
      status: 'today',
      daysUntil: 0,
      message: 'Today',
    };
  }

  return {
    status: 'upcoming',
    daysUntil,
    message: daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`,
  };
}

/**
 * Create reminders for clinical dates
 * This should be called after creating/updating a clinical date
 */
export async function syncClinicalDateReminders(
  userId: string,
  clinicalDate: ClinicalDate
): Promise<boolean> {
  try {
    if (!clinicalDate.reminder_enabled || clinicalDate.is_completed) {
      return true; // No reminders needed
    }

    const date = new Date(clinicalDate.clinical_date);
    const oneWeekBefore = new Date(date);
    oneWeekBefore.setDate(oneWeekBefore.getDate() - 7);
    const oneDayBefore = new Date(date);
    oneDayBefore.setDate(oneDayBefore.getDate() - 1);

    // Delete existing reminders for this clinical date
    await supabase
      .from('reminders')
      .delete()
      .eq('user_id', userId)
      .eq('reminder_type', 'appointment')
      .like('title', `%${clinicalDate.description}%`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Create reminder for 1 week before (if not in the past)
    if (oneWeekBefore >= today) {
      const reminder1Week = {
        user_id: userId,
        title: `Clinical Date Reminder: ${clinicalDate.description}`,
        description: `Your ${clinicalDate.description} is scheduled in 1 week`,
        reminder_type: 'appointment' as const,
        time: '09:00:00',
        days_of_week: [oneWeekBefore.getDay()],
        is_active: true,
      };

      await supabase.from('reminders').insert(reminder1Week);
    }

    // Create reminder for 1 day before (if not in the past)
    if (oneDayBefore >= today) {
      const reminder1Day = {
        user_id: userId,
        title: `Clinical Date Reminder: ${clinicalDate.description}`,
        description: `Your ${clinicalDate.description} is scheduled tomorrow`,
        reminder_type: 'appointment' as const,
        time: '09:00:00',
        days_of_week: [oneDayBefore.getDay()],
        is_active: true,
      };

      await supabase.from('reminders').insert(reminder1Day);
    }

    return true;
  } catch (error) {
    console.error('[ClinicalDate] Error syncing reminders:', error);
    return false;
  }
}
