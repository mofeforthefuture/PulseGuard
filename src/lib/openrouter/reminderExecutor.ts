/**
 * Reminder Executor
 * Creates reminders in Supabase with confirmation
 */

import { supabase } from '../supabase/client';
import type { ActionExecutionResult } from './actionExecutors';
import type { ParsedReminder } from './reminderParser';

export interface ReminderConfirmation {
  title: string;
  description?: string;
  reminderType: string;
  isRecurring: boolean;
  // One-time
  oneTimeDate?: string;
  oneTimeDateFormatted?: string;
  // Recurring
  time?: string;
  daysOfWeek?: number[];
  daysOfWeekFormatted?: string;
  interval?: string;
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
export function formatReminderConfirmation(parsed: ParsedReminder): ReminderConfirmation {
  const confirmation: ReminderConfirmation = {
    title: parsed.title,
    description: parsed.description,
    reminderType: parsed.reminderType,
    isRecurring: parsed.isRecurring,
  };
  
  if (parsed.isRecurring) {
    confirmation.time = parsed.time || '09:00';
    confirmation.daysOfWeek = parsed.daysOfWeek || [0, 1, 2, 3, 4, 5, 6];
    confirmation.daysOfWeekFormatted = formatDaysOfWeek(confirmation.daysOfWeek);
    
    if (parsed.interval) {
      confirmation.interval = `Every ${parsed.interval.amount} ${parsed.interval.unit}`;
    }
  } else {
    confirmation.oneTimeDate = parsed.oneTimeDate;
    if (parsed.oneTimeDate) {
      confirmation.oneTimeDateFormatted = formatDate(parsed.oneTimeDate);
    }
    confirmation.time = parsed.time || '09:00';
  }
  
  return confirmation;
}

/**
 * Create one-time reminder
 * For one-time reminders, we create a reminder with a single day_of_week
 */
async function createOneTimeReminder(
  userId: string,
  parsed: ParsedReminder
): Promise<{ success: boolean; reminderId?: string; error?: string }> {
  if (!parsed.oneTimeDate) {
    return { success: false, error: 'One-time date is required' };
  }
  
  try {
    const reminderDate = new Date(parsed.oneTimeDate);
    const dayOfWeek = reminderDate.getDay(); // 0 = Sunday, 6 = Saturday
    const time = parsed.time || '09:00';
    
    // For one-time reminders, we use a single day_of_week
    // The app can check if the reminder date matches today
    const { error, data } = await supabase.from('reminders').insert({
      user_id: userId,
      title: parsed.title,
      description: parsed.description || `One-time reminder for ${formatDate(parsed.oneTimeDate)}`,
      reminder_type: parsed.reminderType,
      time,
      days_of_week: [dayOfWeek],
      is_active: true,
    }).select('id').single();
    
    if (error) {
      console.error('[Reminder] Error creating one-time reminder:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, reminderId: data.id };
  } catch (error: any) {
    console.error('[Reminder] Error creating one-time reminder:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create recurring reminder
 */
async function createRecurringReminder(
  userId: string,
  parsed: ParsedReminder
): Promise<{ success: boolean; reminderId?: string; error?: string }> {
  try {
    const time = parsed.time || '09:00';
    const daysOfWeek = parsed.daysOfWeek || [0, 1, 2, 3, 4, 5, 6];
    
    let description = parsed.description;
    if (parsed.interval) {
      description = description || `Recurring reminder every ${parsed.interval.amount} ${parsed.interval.unit}`;
    } else {
      description = description || `Recurring reminder on ${formatDaysOfWeek(daysOfWeek)}`;
    }
    
    const { error, data } = await supabase.from('reminders').insert({
      user_id: userId,
      title: parsed.title,
      description,
      reminder_type: parsed.reminderType,
      time,
      days_of_week: daysOfWeek,
      is_active: true,
    }).select('id').single();
    
    if (error) {
      console.error('[Reminder] Error creating recurring reminder:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, reminderId: data.id };
  } catch (error: any) {
    console.error('[Reminder] Error creating recurring reminder:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Execute reminder creation
 * ALWAYS requires confirmation before creating
 */
export async function executeReminderCreation(
  userId: string,
  parsed: ParsedReminder
): Promise<ActionExecutionResult> {
  try {
    // Format confirmation data
    const confirmationData = formatReminderConfirmation(parsed);
    
    // ALWAYS require confirmation for reminders
    return {
      success: true,
      message: 'Reminder parsed. Please confirm details.',
      requiresConfirmation: true,
      confirmationData,
      data: {
        parsed,
        confirmationData,
      },
    };
  } catch (error: any) {
    console.error('[Reminder] Error executing reminder creation:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Execute reminder creation after confirmation
 */
export async function executeReminderCreationConfirmed(
  userId: string,
  parsed: ParsedReminder
): Promise<ActionExecutionResult> {
  try {
    let result: { success: boolean; reminderId?: string; error?: string };
    
    if (parsed.isRecurring) {
      result = await createRecurringReminder(userId, parsed);
    } else {
      result = await createOneTimeReminder(userId, parsed);
    }
    
    if (!result.success) {
      return {
        success: false,
        message: 'Failed to create reminder',
        error: result.error,
      };
    }
    
    const reminderType = parsed.isRecurring ? 'recurring' : 'one-time';
    const details = parsed.isRecurring
      ? `${formatDaysOfWeek(parsed.daysOfWeek || [])} at ${parsed.time || '09:00'}`
      : `${formatDate(parsed.oneTimeDate!)} at ${parsed.time || '09:00'}`;
    
    return {
      success: true,
      message: `Created ${reminderType} reminder: ${parsed.title} (${details})`,
      data: {
        reminderId: result.reminderId,
        reminderType,
      },
    };
  } catch (error: any) {
    console.error('[Reminder] Error executing confirmed reminder creation:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}
