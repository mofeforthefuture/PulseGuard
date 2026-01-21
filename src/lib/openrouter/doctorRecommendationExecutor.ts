/**
 * Doctor Recommendation Executor
 * Creates reminders from doctor recommendations with source='doctor_recommendation'
 */

import { supabase } from '../supabase/client';
import type { ActionExecutionResult } from './actionExecutors';
import type { ParsedDoctorRecommendation } from './doctorRecommendationParser';

export interface DoctorRecommendationConfirmation {
  recommendationText: string;
  action?: string;
  proposedReminder: {
    title: string;
    isRecurring: boolean;
    oneTimeDate?: string;
    oneTimeDateFormatted?: string;
    time?: string;
    daysOfWeek?: number[];
    daysOfWeekFormatted?: string;
    interval?: string;
  };
}

/**
 * Format days of week for display
 */
function formatDaysOfWeek(days: number[]): string {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  if (days.length === 7) {
    return 'Every day';
  }
  if (days.length === 5 && days.every(d => [1, 2, 3, 4, 5].includes(d))) {
    return 'Weekdays';
  }
  if (days.length === 2 && days.every(d => [0, 6].includes(d))) {
    return 'Weekends';
  }
  
  return days.map(d => dayNames[d]).join(', ');
}

/**
 * Format date for display
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format confirmation data for user review
 */
export function formatDoctorRecommendationConfirmation(
  parsed: ParsedDoctorRecommendation
): DoctorRecommendationConfirmation {
  const proposed = parsed.proposedReminder!;
  
  const confirmation: DoctorRecommendationConfirmation = {
    recommendationText: parsed.recommendationText,
    action: parsed.action,
    proposedReminder: {
      title: proposed.title,
      isRecurring: proposed.isRecurring,
    },
  };
  
  if (proposed.isRecurring) {
    confirmation.proposedReminder.time = proposed.time || '09:00';
    confirmation.proposedReminder.daysOfWeek = proposed.daysOfWeek || [0, 1, 2, 3, 4, 5, 6];
    confirmation.proposedReminder.daysOfWeekFormatted = formatDaysOfWeek(
      confirmation.proposedReminder.daysOfWeek
    );
    
    if (proposed.interval) {
      confirmation.proposedReminder.interval = `Every ${proposed.interval.amount} ${proposed.interval.unit}`;
    }
  } else {
    confirmation.proposedReminder.oneTimeDate = proposed.oneTimeDate;
    if (proposed.oneTimeDate) {
      confirmation.proposedReminder.oneTimeDateFormatted = formatDate(proposed.oneTimeDate);
    }
    confirmation.proposedReminder.time = proposed.time || '09:00';
  }
  
  return confirmation;
}

/**
 * Create reminder from doctor recommendation
 */
async function createRecommendationReminder(
  userId: string,
  parsed: ParsedDoctorRecommendation
): Promise<{ success: boolean; reminderId?: string; error?: string }> {
  const proposed = parsed.proposedReminder!;
  
  try {
    // Determine reminder type based on action
    let reminderType: 'medication' | 'check_in' | 'appointment' | 'other' = 'other';
    if (parsed.action?.toLowerCase().includes('medication') || parsed.action?.toLowerCase().includes('pill')) {
      reminderType = 'medication';
    } else if (parsed.action?.toLowerCase().includes('check') || parsed.action?.toLowerCase().includes('monitor')) {
      reminderType = 'check_in';
    } else if (parsed.action?.toLowerCase().includes('appointment') || parsed.action?.toLowerCase().includes('return') || parsed.action?.toLowerCase().includes('follow')) {
      reminderType = 'appointment';
    }
    
    // Create description with source indication
    const description = `Doctor recommendation: "${parsed.recommendationText}"`;
    
    if (proposed.isRecurring) {
      const time = proposed.time || '09:00';
      const daysOfWeek = proposed.daysOfWeek || [0, 1, 2, 3, 4, 5, 6];
      
      const { error, data } = await supabase.from('reminders').insert({
        user_id: userId,
        title: proposed.title,
        description,
        reminder_type: reminderType,
        time,
        days_of_week: daysOfWeek,
        is_active: true,
      }).select('id').single();
      
      if (error) {
        console.error('[DoctorRecommendation] Error creating recurring reminder:', error);
        return { success: false, error: error.message };
      }
      
      return { success: true, reminderId: data.id };
    } else {
      // One-time reminder
      if (!proposed.oneTimeDate) {
        return { success: false, error: 'One-time date is required' };
      }
      
      const reminderDate = new Date(proposed.oneTimeDate);
      const dayOfWeek = reminderDate.getDay();
      const time = proposed.time || '09:00';
      
      const { error, data } = await supabase.from('reminders').insert({
        user_id: userId,
        title: proposed.title,
        description,
        reminder_type: reminderType,
        time,
        days_of_week: [dayOfWeek],
        is_active: true,
      }).select('id').single();
      
      if (error) {
        console.error('[DoctorRecommendation] Error creating one-time reminder:', error);
        return { success: false, error: error.message };
      }
      
      return { success: true, reminderId: data.id };
    }
  } catch (error: any) {
    console.error('[DoctorRecommendation] Error creating reminder:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Execute doctor recommendation parsing and reminder proposal
 * ALWAYS requires confirmation before creating
 */
export async function executeDoctorRecommendation(
  userId: string,
  parsed: ParsedDoctorRecommendation
): Promise<ActionExecutionResult> {
  try {
    // Format confirmation data
    const confirmationData = formatDoctorRecommendationConfirmation(parsed);
    
    // ALWAYS require confirmation for doctor recommendations
    return {
      success: true,
      message: 'Doctor recommendation parsed. Please review and approve the proposed reminder.',
      requiresConfirmation: true,
      confirmationData,
      data: {
        parsed,
        confirmationData,
      },
    };
  } catch (error: any) {
    console.error('[DoctorRecommendation] Error executing recommendation:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Execute reminder creation after user approval
 */
export async function executeDoctorRecommendationApproved(
  userId: string,
  parsed: ParsedDoctorRecommendation
): Promise<ActionExecutionResult> {
  try {
    // Create reminder
    const result = await createRecommendationReminder(userId, parsed);
    
    if (!result.success) {
      return {
        success: false,
        message: 'Failed to create reminder from doctor recommendation',
        error: result.error,
      };
    }
    
    const proposed = parsed.proposedReminder!;
    const reminderType = proposed.isRecurring ? 'recurring' : 'one-time';
    const details = proposed.isRecurring
      ? `${formatDaysOfWeek(proposed.daysOfWeek || [])} at ${proposed.time || '09:00'}`
      : `${formatDate(proposed.oneTimeDate!)} at ${proposed.time || '09:00'}`;
    
    return {
      success: true,
      message: `Created ${reminderType} reminder from doctor recommendation: ${proposed.title} (${details})`,
      data: {
        reminderId: result.reminderId,
        reminderType,
        source: 'doctor_recommendation',
      },
    };
  } catch (error: any) {
    console.error('[DoctorRecommendation] Error executing approved recommendation:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}
