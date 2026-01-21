/**
 * Care Service
 * Aggregates care-related data for summaries and dashboards
 */

import { supabase } from '../supabase/client';
import type { Appointment, CareLog } from '../../types/care';

/**
 * Get upcoming appointments (next 30 days)
 */
export async function getUpcomingAppointments(
  userId: string,
  days: number = 30
): Promise<Appointment[]> {
  try {
    const today = new Date().toISOString();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + days);
    const cutoffDateStr = cutoffDate.toISOString();

    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['scheduled', 'confirmed'])
      .gte('scheduled_at', today)
      .lte('scheduled_at', cutoffDateStr)
      .order('scheduled_at', { ascending: true });

    if (error) {
      console.error('[Care] Error fetching upcoming appointments:', error);
      return [];
    }

    return (data || []) as Appointment[];
  } catch (error) {
    console.error('[Care] Error fetching upcoming appointments:', error);
    return [];
  }
}

/**
 * Get next appointment
 */
export async function getNextAppointment(userId: string): Promise<Appointment | null> {
  try {
    const today = new Date().toISOString();

    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['scheduled', 'confirmed'])
      .gte('scheduled_at', today)
      .order('scheduled_at', { ascending: true })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No appointment found
      }
      console.error('[Care] Error fetching next appointment:', error);
      return null;
    }

    return data as Appointment;
  } catch (error) {
    console.error('[Care] Error fetching next appointment:', error);
    return null;
  }
}

/**
 * Get recent care logs
 */
export async function getRecentCareLogs(
  userId: string,
  limit: number = 10
): Promise<CareLog[]> {
  try {
    const { data, error } = await supabase
      .from('care_logs')
      .select('*')
      .eq('user_id', userId)
      .order('occurred_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Care] Error fetching care logs:', error);
      return [];
    }

    return (data || []) as CareLog[];
  } catch (error) {
    console.error('[Care] Error fetching care logs:', error);
    return [];
  }
}

/**
 * Get all care logs for a user (for history timeline)
 */
export async function getAllCareLogs(
  userId: string,
  logType?: string
): Promise<CareLog[]> {
  try {
    let query = supabase
      .from('care_logs')
      .select('*')
      .eq('user_id', userId)
      .order('occurred_at', { ascending: false });

    if (logType) {
      query = query.eq('log_type', logType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Care] Error fetching all care logs:', error);
      return [];
    }

    return (data || []) as CareLog[];
  } catch (error) {
    console.error('[Care] Error fetching all care logs:', error);
    return [];
  }
}

/**
 * Get care logs by date range
 */
export async function getCareLogsByDateRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<CareLog[]> {
  try {
    const { data, error } = await supabase
      .from('care_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('occurred_at', startDate.toISOString())
      .lte('occurred_at', endDate.toISOString())
      .order('occurred_at', { ascending: false });

    if (error) {
      console.error('[Care] Error fetching care logs by date range:', error);
      return [];
    }

    return (data || []) as CareLog[];
  } catch (error) {
    console.error('[Care] Error fetching care logs by date range:', error);
    return [];
  }
}

/**
 * Get days until appointment
 */
export function getDaysUntilAppointment(appointmentDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(appointmentDate);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format date for display (e.g., "March 2024")
 */
export function formatMonthYear(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
