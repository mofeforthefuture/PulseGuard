/**
 * Doctor Visit Reminder Service
 * Handles doctor visit reminders based on recommendations
 */

import { supabase } from '../supabase/client';
import { parseRecommendationToDate } from './recommendationParser';
import type { DoctorVisitReminder, DoctorVisitReminderInput } from '../../types/care';

/**
 * Create a doctor visit reminder from a recommendation
 */
export async function createDoctorVisitReminder(
  userId: string,
  input: DoctorVisitReminderInput
): Promise<DoctorVisitReminder | null> {
  try {
    // Parse the recommendation to get the reminder date
    const baseDate = input.visit_date ? new Date(input.visit_date) : new Date();
    const reminderDate = parseRecommendationToDate(input.recommendation_text, baseDate);

    if (!reminderDate) {
      console.error('[DoctorVisitReminder] Could not parse recommendation:', input.recommendation_text);
      return null;
    }

    const { data, error } = await supabase
      .from('doctor_visit_reminders')
      .insert({
        user_id: userId,
        doctor_name: input.doctor_name,
        recommendation_text: input.recommendation_text,
        reminder_date: reminderDate.toISOString().split('T')[0],
        visit_date: input.visit_date || null,
        notes: input.notes || null,
        is_completed: false,
      })
      .select()
      .single();

    if (error) {
      console.error('[DoctorVisitReminder] Error creating reminder:', error);
      return null;
    }

    return data as DoctorVisitReminder;
  } catch (error) {
    console.error('[DoctorVisitReminder] Error creating reminder:', error);
    return null;
  }
}

/**
 * Get all doctor visit reminders for a user
 */
export async function getDoctorVisitReminders(
  userId: string,
  includeCompleted: boolean = false
): Promise<DoctorVisitReminder[]> {
  try {
    let query = supabase
      .from('doctor_visit_reminders')
      .select('*')
      .eq('user_id', userId)
      .order('reminder_date', { ascending: true });

    if (!includeCompleted) {
      query = query.eq('is_completed', false);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[DoctorVisitReminder] Error fetching reminders:', error);
      return [];
    }

    return (data || []) as DoctorVisitReminder[];
  } catch (error) {
    console.error('[DoctorVisitReminder] Error fetching reminders:', error);
    return [];
  }
}

/**
 * Get upcoming doctor visit reminders
 */
export async function getUpcomingDoctorVisitReminders(
  userId: string,
  days: number = 30
): Promise<DoctorVisitReminder[]> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + days);

    const { data, error } = await supabase
      .from('doctor_visit_reminders')
      .select('*')
      .eq('user_id', userId)
      .eq('is_completed', false)
      .gte('reminder_date', new Date().toISOString().split('T')[0])
      .lte('reminder_date', cutoffDate.toISOString().split('T')[0])
      .order('reminder_date', { ascending: true });

    if (error) {
      console.error('[DoctorVisitReminder] Error fetching upcoming reminders:', error);
      return [];
    }

    return (data || []) as DoctorVisitReminder[];
  } catch (error) {
    console.error('[DoctorVisitReminder] Error fetching upcoming reminders:', error);
    return [];
  }
}

/**
 * Mark a reminder as completed
 */
export async function completeDoctorVisitReminder(
  userId: string,
  reminderId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('doctor_visit_reminders')
      .update({
        is_completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq('id', reminderId)
      .eq('user_id', userId); // Ensure user owns the record

    if (error) {
      console.error('[DoctorVisitReminder] Error completing reminder:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[DoctorVisitReminder] Error completing reminder:', error);
    return false;
  }
}

/**
 * Delete a doctor visit reminder
 */
export async function deleteDoctorVisitReminder(
  userId: string,
  reminderId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('doctor_visit_reminders')
      .delete()
      .eq('id', reminderId)
      .eq('user_id', userId); // Ensure user owns the record

    if (error) {
      console.error('[DoctorVisitReminder] Error deleting reminder:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[DoctorVisitReminder] Error deleting reminder:', error);
    return false;
  }
}

/**
 * Get days until reminder date
 */
export function getDaysUntilReminder(reminderDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(reminderDate);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
