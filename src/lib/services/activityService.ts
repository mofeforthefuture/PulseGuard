/**
 * Activity Service
 * Handles daily step tracking and activity logs
 */

import { supabase } from '../supabase/client';
import type { ActivityLog, WeeklyActivityTrend, ActivityStats } from '../../types/activity';

/**
 * Get today's activity log
 */
export async function getTodayActivity(userId: string): Promise<ActivityLog | null> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No record found - return null
        return null;
      }
      console.error('[Activity] Error fetching today activity:', error);
      return null;
    }

    return data as ActivityLog;
  } catch (error) {
    console.error('[Activity] Error fetching today activity:', error);
    return null;
  }
}

/**
 * Save or update activity log
 */
export async function saveActivityLog(
  userId: string,
  stepsCount: number,
  activityNotes?: string,
  source: 'device' | 'manual' = 'manual'
): Promise<boolean> {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { error } = await supabase
      .from('activity_logs')
      .upsert(
        {
          user_id: userId,
          date: today,
          steps_count: stepsCount,
          activity_notes: activityNotes || null,
          source,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,date',
        }
      );

    if (error) {
      console.error('[Activity] Error saving activity log:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Activity] Error saving activity log:', error);
    return false;
  }
}

/**
 * Get weekly activity trend (last 7 days)
 */
export async function getWeeklyActivityTrend(
  userId: string
): Promise<WeeklyActivityTrend[]> {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const startDate = sevenDaysAgo.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('activity_logs')
      .select('date, steps_count')
      .eq('user_id', userId)
      .gte('date', startDate)
      .order('date', { ascending: true });

    if (error) {
      console.error('[Activity] Error fetching weekly trend:', error);
      return [];
    }

    return (data || []).map((log) => ({
      date: log.date,
      steps_count: log.steps_count || 0,
    }));
  } catch (error) {
    console.error('[Activity] Error fetching weekly trend:', error);
    return [];
  }
}

/**
 * Get recent activity logs
 */
export async function getRecentActivityLogs(
  userId: string,
  limit: number = 5
): Promise<ActivityLog[]> {
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Activity] Error fetching recent activity logs:', error);
      return [];
    }

    return (data || []) as ActivityLog[];
  } catch (error) {
    console.error('[Activity] Error fetching recent activity logs:', error);
    return [];
  }
}

/**
 * Get activity statistics
 */
export async function getActivityStats(userId: string): Promise<ActivityStats> {
  try {
    const today = await getTodayActivity(userId);
    const weeklyTrend = await getWeeklyActivityTrend(userId);

    const weeklyTotal = weeklyTrend.reduce((sum, day) => sum + day.steps_count, 0);
    const weeklyAverage = weeklyTrend.length > 0 ? Math.round(weeklyTotal / weeklyTrend.length) : 0;

    return {
      todaySteps: today?.steps_count || 0,
      weeklyAverage,
      weeklyTotal,
    };
  } catch (error) {
    console.error('[Activity] Error calculating stats:', error);
    return {
      todaySteps: 0,
      weeklyAverage: 0,
      weeklyTotal: 0,
    };
  }
}
