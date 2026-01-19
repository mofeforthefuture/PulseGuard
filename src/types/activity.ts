/**
 * Activity Tracking Types
 */

export interface ActivityLog {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD format
  steps_count: number;
  activity_notes?: string;
  source: 'device' | 'manual';
  created_at: string;
  updated_at: string;
}

export interface WeeklyActivityTrend {
  date: string;
  steps_count: number;
}

export interface ActivityStats {
  todaySteps: number;
  weeklyAverage: number;
  weeklyTotal: number;
}
