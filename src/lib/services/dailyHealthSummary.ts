/**
 * Daily Health Summary Service
 * Generates a daily health summary for AI context awareness
 * All queries use user_id for RLS safety and user isolation
 */

import { supabase } from '../supabase/client';
import { getLatestBloodPressureReading } from './bloodPressureService';
import { getUpcomingAppointments } from './careService';
import type { BloodPressureReading } from '../../types/care';
import type { Appointment } from '../../types/care';
import type { CheckIn } from '../../types/health';

export interface DailyHealthSummary {
  lastBloodPressure?: {
    systolic: number;
    diastolic: number;
    recordedAt: string;
    isAbnormal: boolean;
    abnormalReason?: string;
  };
  hydrationToday: {
    total: number; // ml
    goal: number; // ml (default 2000)
    progress: number; // percentage
  };
  upcomingAppointments: Array<{
    title: string;
    scheduledAt: string;
    daysUntil: number;
    status: string;
  }>;
  recentCheckIns: Array<{
    date: string;
    mood?: string;
    medicationTaken: boolean;
    symptomsCount?: number;
  }>;
}

/**
 * Get today's hydration total
 */
async function getTodayHydration(userId: string): Promise<number> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    // Fetch today's hydration entries
    const { data, error } = await supabase
      .from('health_entries')
      .select('data, created_at')
      .eq('user_id', userId) // RLS safety: user isolation
      .eq('entry_type', 'vital')
      .gte('created_at', todayStr);
    
    if (error) {
      console.error('[DailySummary] Error fetching hydration:', error);
      return 0;
    }
    
    // Sum up all hydration entries for today
    const total = (data || []).reduce((sum, entry) => {
      const entryData = entry.data as any;
      if (entryData?.type === 'hydration' && entryData?.amount) {
        const entryDate = new Date(entry.created_at);
        if (entryDate >= today) {
          return sum + entryData.amount;
        }
      }
      return sum;
    }, 0);
    
    return total;
  } catch (error) {
    console.error('[DailySummary] Error calculating hydration:', error);
    return 0;
  }
}

/**
 * Get recent check-ins (last 7 days)
 */
async function getRecentCheckIns(userId: string, limit: number = 7): Promise<CheckIn[]> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - limit);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('check_ins')
      .select('*')
      .eq('user_id', userId) // RLS safety: user isolation
      .gte('date', cutoffDateStr)
      .order('date', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('[DailySummary] Error fetching check-ins:', error);
      return [];
    }
    
    return (data || []) as CheckIn[];
  } catch (error) {
    console.error('[DailySummary] Error fetching check-ins:', error);
    return [];
  }
}

/**
 * Calculate days until appointment
 */
function calculateDaysUntil(appointmentDate: string): number {
  const appointment = new Date(appointmentDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  appointment.setHours(0, 0, 0, 0);
  
  const diffTime = appointment.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Generate daily health summary
 * All queries use user_id for RLS safety
 */
export async function generateDailyHealthSummary(userId: string): Promise<DailyHealthSummary> {
  try {
    // Fetch all data in parallel for efficiency
    const [lastBP, hydrationTotal, appointments, checkIns] = await Promise.all([
      getLatestBloodPressureReading(userId),
      getTodayHydration(userId),
      getUpcomingAppointments(userId, 7), // Next 7 days
      getRecentCheckIns(userId, 7), // Last 7 days
    ]);
    
    const summary: DailyHealthSummary = {
      hydrationToday: {
        total: hydrationTotal,
        goal: 2000, // Default 2L per day
        progress: Math.round((hydrationTotal / 2000) * 100),
      },
      upcomingAppointments: [],
      recentCheckIns: [],
    };
    
    // Process last BP reading
    if (lastBP) {
      summary.lastBloodPressure = {
        systolic: lastBP.systolic,
        diastolic: lastBP.diastolic,
        recordedAt: lastBP.recorded_at,
        isAbnormal: lastBP.is_abnormal,
        abnormalReason: lastBP.abnormal_reason || undefined,
      };
    }
    
    // Process upcoming appointments
    summary.upcomingAppointments = appointments.slice(0, 5).map(apt => ({
      title: apt.title,
      scheduledAt: apt.scheduled_at,
      daysUntil: calculateDaysUntil(apt.scheduled_at),
      status: apt.status,
    }));
    
    // Process recent check-ins
    summary.recentCheckIns = checkIns.map(checkIn => ({
      date: checkIn.date,
      mood: checkIn.mood || undefined,
      medicationTaken: checkIn.medication_taken,
      symptomsCount: checkIn.symptoms ? (checkIn.symptoms as any[]).length : undefined,
    }));
    
    return summary;
  } catch (error) {
    console.error('[DailySummary] Error generating summary:', error);
    // Return empty summary on error
    return {
      hydrationToday: {
        total: 0,
        goal: 2000,
        progress: 0,
      },
      upcomingAppointments: [],
      recentCheckIns: [],
    };
  }
}

/**
 * Format daily health summary as a string for AI system prompt
 */
export function formatDailyHealthSummary(summary: DailyHealthSummary): string {
  const parts: string[] = [];
  
  parts.push('DAILY HEALTH SUMMARY:');
  parts.push('');
  
  // Last BP reading
  if (summary.lastBloodPressure) {
    const bp = summary.lastBloodPressure;
    const date = new Date(bp.recordedAt);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const abnormalNote = bp.isAbnormal ? ` (${bp.abnormalReason || 'unusual value'})` : '';
    parts.push(`📊 Last Blood Pressure: ${bp.systolic}/${bp.diastolic} on ${dateStr}${abnormalNote}`);
  } else {
    parts.push('📊 Last Blood Pressure: No readings yet');
  }
  
  parts.push('');
  
  // Hydration today
  const hydration = summary.hydrationToday;
  const hydrationStatus = hydration.progress >= 100 
    ? '✅ Goal reached!' 
    : hydration.progress >= 75 
    ? '🌟 Almost there!' 
    : hydration.progress >= 50 
    ? '💪 Halfway there' 
    : hydration.progress >= 25 
    ? 'Getting started' 
    : 'Just starting';
  parts.push(`💧 Hydration Today: ${hydration.total}ml / ${hydration.goal}ml (${hydration.progress}%) - ${hydrationStatus}`);
  
  parts.push('');
  
  // Upcoming appointments
  if (summary.upcomingAppointments.length > 0) {
    parts.push('📅 Upcoming Appointments:');
    summary.upcomingAppointments.forEach(apt => {
      const date = new Date(apt.scheduledAt);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const daysText = apt.daysUntil === 0 
        ? 'Today' 
        : apt.daysUntil === 1 
        ? 'Tomorrow' 
        : `in ${apt.daysUntil} days`;
      parts.push(`  - ${apt.title}: ${dateStr} (${daysText})`);
    });
  } else {
    parts.push('📅 Upcoming Appointments: None scheduled');
  }
  
  parts.push('');
  
  // Recent check-ins
  if (summary.recentCheckIns.length > 0) {
    parts.push('📝 Recent Check-ins:');
    summary.recentCheckIns.slice(0, 3).forEach(checkIn => {
      const date = new Date(checkIn.date);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const moodText = checkIn.mood ? `, mood: ${checkIn.mood}` : '';
      const medText = checkIn.medicationTaken ? ', medication taken' : '';
      const symptomsText = checkIn.symptomsCount ? `, ${checkIn.symptomsCount} symptom(s)` : '';
      parts.push(`  - ${dateStr}${moodText}${medText}${symptomsText}`);
    });
  } else {
    parts.push('📝 Recent Check-ins: None in the last 7 days');
  }
  
  return parts.join('\n');
}

/**
 * Get formatted daily health summary string
 * Convenience function that generates and formats in one call
 */
export async function getFormattedDailyHealthSummary(userId: string): Promise<string> {
  const summary = await generateDailyHealthSummary(userId);
  return formatDailyHealthSummary(summary);
}
