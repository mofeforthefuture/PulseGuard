/**
 * History Service
 * Handles fetching emergency events and check-in history
 */

import { supabase } from '../supabase/client';
import type { CheckIn } from '../../types/health';

export interface EmergencyEvent {
  id: string;
  user_id: string;
  event_type: 'panic_button' | 'detected_pattern' | 'manual';
  location: {
    lat?: number;
    lng?: number;
    address?: string;
  } | null;
  sms_content: string | null;
  sms_sent_to: string[] | null;
  ai_analysis: Record<string, any> | null;
  resolved_at: string | null;
  created_at: string;
}

// Re-export for convenience
export type { EmergencyEvent as HistoryEmergencyEvent };

/**
 * Get all emergency events for a user (chronological)
 */
export async function getEmergencyEvents(userId: string): Promise<EmergencyEvent[]> {
  try {
    const { data, error } = await supabase
      .from('emergency_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[History] Error fetching emergency events:', error);
      return [];
    }

    return (data || []) as EmergencyEvent[];
  } catch (error) {
    console.error('[History] Error fetching emergency events:', error);
    return [];
  }
}

/**
 * Get all check-ins for a user (chronological)
 */
export async function getCheckInHistory(userId: string, limit?: number): Promise<CheckIn[]> {
  try {
    let query = supabase
      .from('check_ins')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[History] Error fetching check-ins:', error);
      return [];
    }

    return (data || []) as CheckIn[];
  } catch (error) {
    console.error('[History] Error fetching check-ins:', error);
    return [];
  }
}
