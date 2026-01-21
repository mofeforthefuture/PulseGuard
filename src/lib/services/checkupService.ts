/**
 * Medical Checkup Service
 * Handles medical checkup tracking and reminders
 */

import { supabase } from '../supabase/client';
import type { MedicalCheckup, MedicalCheckupInput } from '../../types/care';

/**
 * Get user's medical checkup settings
 */
export async function getMedicalCheckup(
  userId: string
): Promise<MedicalCheckup | null> {
  try {
    const { data, error } = await supabase
      .from('medical_checkups')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No record found - return null
        return null;
      }
      console.error('[Checkup] Error fetching checkup:', error);
      return null;
    }

    return data as MedicalCheckup;
  } catch (error) {
    console.error('[Checkup] Error fetching checkup:', error);
    return null;
  }
}

/**
 * Create or update medical checkup settings
 */
export async function upsertMedicalCheckup(
  userId: string,
  input: MedicalCheckupInput
): Promise<MedicalCheckup | null> {
  try {
    const { data, error } = await supabase
      .from('medical_checkups')
      .upsert(
        {
          user_id: userId,
          interval_months: input.interval_months,
          last_checkup_date: input.last_checkup_date || null,
          notes: input.notes || null,
        },
        {
          onConflict: 'user_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('[Checkup] Error upserting checkup:', error);
      return null;
    }

    return data as MedicalCheckup;
  } catch (error) {
    console.error('[Checkup] Error upserting checkup:', error);
    return null;
  }
}

/**
 * Update last checkup date (marks checkup as completed)
 */
export async function updateLastCheckupDate(
  userId: string,
  checkupDate: string
): Promise<MedicalCheckup | null> {
  try {
    const { data, error } = await supabase
      .from('medical_checkups')
      .update({
        last_checkup_date: checkupDate,
        reminder_1_week_sent: false,
        reminder_due_date_sent: false,
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('[Checkup] Error updating last checkup date:', error);
      return null;
    }

    return data as MedicalCheckup;
  } catch (error) {
    console.error('[Checkup] Error updating last checkup date:', error);
    return null;
  }
}

/**
 * Update checkup interval
 */
export async function updateCheckupInterval(
  userId: string,
  intervalMonths: number
): Promise<MedicalCheckup | null> {
  try {
    const { data, error } = await supabase
      .from('medical_checkups')
      .update({
        interval_months: intervalMonths,
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('[Checkup] Error updating interval:', error);
      return null;
    }

    return data as MedicalCheckup;
  } catch (error) {
    console.error('[Checkup] Error updating interval:', error);
    return null;
  }
}

/**
 * Get days until next checkup
 */
export function getDaysUntilNextCheckup(nextCheckupDate?: string): number | null {
  if (!nextCheckupDate) return null;

  const nextDate = new Date(nextCheckupDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  nextDate.setHours(0, 0, 0, 0);

  const diffTime = nextDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Check if checkup is due soon (within 7 days)
 */
export function isCheckupDueSoon(nextCheckupDate?: string): boolean {
  const daysUntil = getDaysUntilNextCheckup(nextCheckupDate);
  return daysUntil !== null && daysUntil <= 7 && daysUntil >= 0;
}

/**
 * Check if checkup is overdue
 */
export function isCheckupOverdue(nextCheckupDate?: string): boolean {
  const daysUntil = getDaysUntilNextCheckup(nextCheckupDate);
  return daysUntil !== null && daysUntil < 0;
}

/**
 * Get checkup status
 */
export function getCheckupStatus(checkup: MedicalCheckup | null): {
  status: 'up_to_date' | 'due_soon' | 'overdue' | 'no_data';
  daysUntil: number | null;
  message: string;
} {
  if (!checkup || !checkup.next_checkup_date) {
    return {
      status: 'no_data',
      daysUntil: null,
      message: 'No checkup scheduled',
    };
  }

  const daysUntil = getDaysUntilNextCheckup(checkup.next_checkup_date);

  if (daysUntil === null) {
    return {
      status: 'no_data',
      daysUntil: null,
      message: 'No checkup scheduled',
    };
  }

  if (daysUntil < 0) {
    return {
      status: 'overdue',
      daysUntil,
      message: `Overdue by ${Math.abs(daysUntil)} ${Math.abs(daysUntil) === 1 ? 'day' : 'days'}`,
    };
  }

  if (daysUntil <= 7) {
    return {
      status: 'due_soon',
      daysUntil,
      message: `Due in ${daysUntil} ${daysUntil === 1 ? 'day' : 'days'}`,
    };
  }

  return {
    status: 'up_to_date',
    daysUntil,
    message: `Due in ${daysUntil} ${daysUntil === 1 ? 'day' : 'days'}`,
  };
}

/**
 * Create or update reminders for checkup notifications
 * This should be called after creating/updating a checkup
 * 
 * Note: The reminders table uses 'appointment' type for checkups.
 * In a production system, you'd want to:
 * 1. Use a proper scheduling system (e.g., cron jobs, push notifications)
 * 2. Create one-time reminders rather than recurring weekly ones
 * 3. Integrate with a notification service
 */
export async function syncCheckupReminders(
  userId: string,
  checkup: MedicalCheckup
): Promise<boolean> {
  try {
    if (!checkup.next_checkup_date) {
      // Delete existing reminders if no date set
      await supabase
        .from('reminders')
        .delete()
        .eq('user_id', userId)
        .eq('reminder_type', 'appointment')
        .like('title', '%Medical Checkup%');
      return true;
    }

    const nextDate = new Date(checkup.next_checkup_date);
    const oneWeekBefore = new Date(nextDate);
    oneWeekBefore.setDate(oneWeekBefore.getDate() - 7);

    // Delete existing checkup reminders
    await supabase
      .from('reminders')
      .delete()
      .eq('user_id', userId)
      .eq('reminder_type', 'appointment')
      .like('title', '%Medical Checkup%');

    // Only create reminders if the dates are in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Create reminder for 1 week before (if not in the past)
    if (oneWeekBefore >= today) {
      const reminder1Week = {
        user_id: userId,
        title: 'Medical Checkup Reminder (1 week)',
        description: 'Your medical checkup is scheduled in 1 week',
        reminder_type: 'appointment' as const,
        time: '09:00:00', // 9 AM
        days_of_week: [oneWeekBefore.getDay()],
        is_active: true,
      };

      const { error: error1 } = await supabase.from('reminders').insert(reminder1Week);
      if (error1) {
        console.error('[Checkup] Error creating 1-week reminder:', error1);
      }
    }

    // Create reminder for due date (if not in the past)
    if (nextDate >= today) {
      const reminderDue = {
        user_id: userId,
        title: 'Medical Checkup Due Today',
        description: 'Your medical checkup is due today',
        reminder_type: 'appointment' as const,
        time: '09:00:00', // 9 AM
        days_of_week: [nextDate.getDay()],
        is_active: true,
      };

      const { error: error2 } = await supabase.from('reminders').insert(reminderDue);
      if (error2) {
        console.error('[Checkup] Error creating due date reminder:', error2);
      }
    }

    return true;
  } catch (error) {
    console.error('[Checkup] Error syncing reminders:', error);
    return false;
  }
}
