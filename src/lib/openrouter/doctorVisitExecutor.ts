/**
 * Doctor Visit Outcome Executor
 * Creates care logs and reminders for doctor visit outcomes
 */

import { supabase } from '../supabase/client';
import type { ActionExecutionResult } from './actionExecutors';
import type { ParsedDoctorVisit } from './doctorVisitParser';

export interface DoctorVisitConfirmation {
  visitDate: string;
  followUpDate?: string;
  followUpTiming?: string;
  diagnosis?: string;
  treatment?: string;
  medicationChanges?: string;
  notes?: string;
  visitType: string;
}

/**
 * Create care log for doctor visit
 */
async function createCareLog(
  userId: string,
  parsed: ParsedDoctorVisit
): Promise<{ success: boolean; careLogId?: string; error?: string }> {
  try {
    const { error, data } = await supabase.from('care_logs').insert({
      user_id: userId,
      log_type: 'visit',
      title: `Doctor visit - ${parsed.visitType || 'appointment'}`,
      occurred_at: parsed.visitDate ? `${parsed.visitDate}T00:00:00Z` : new Date().toISOString(),
      diagnosis: parsed.diagnosis || null,
      treatment: parsed.treatment || null,
      notes: parsed.notes || null,
      follow_up_required: !!parsed.followUpTiming,
      follow_up_notes: parsed.followUpTiming
        ? `Follow-up in ${parsed.followUpTiming.amount} ${parsed.followUpTiming.unit}`
        : null,
    }).select('id').single();

    if (error) {
      console.error('[DoctorVisit] Error creating care log:', error);
      return { success: false, error: error.message };
    }

    return { success: true, careLogId: data.id };
  } catch (error: any) {
    console.error('[DoctorVisit] Error creating care log:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create reminder for follow-up appointment
 */
async function createFollowUpReminder(
  userId: string,
  parsed: ParsedDoctorVisit,
  careLogId?: string
): Promise<{ success: boolean; reminderId?: string; error?: string }> {
  if (!parsed.followUpTiming || !parsed.followUpTiming.followUpDate) {
    return { success: false, error: 'Follow-up date is required' };
  }

  try {
    const followUpDate = new Date(parsed.followUpTiming.followUpDate);
    const today = new Date();
    
    // Only create reminder if follow-up is in the future
    if (followUpDate <= today) {
      return { success: false, error: 'Follow-up date must be in the future' };
    }

    // Create reminder for the follow-up date
    // Use 9 AM as default time
    const reminderTime = '09:00';
    
    // Calculate which day of week the follow-up falls on
    const dayOfWeek = followUpDate.getDay(); // 0 = Sunday, 6 = Saturday
    
    const { error, data } = await supabase.from('reminders').insert({
      user_id: userId,
      title: 'Follow-up doctor appointment',
      description: `Follow-up appointment scheduled for ${parsed.followUpTiming.followUpDate}`,
      reminder_type: 'appointment',
      time: reminderTime,
      days_of_week: [dayOfWeek], // One-time reminder on that day
      is_active: true,
    }).select('id').single();

    if (error) {
      console.error('[DoctorVisit] Error creating follow-up reminder:', error);
      return { success: false, error: error.message };
    }

    return { success: true, reminderId: data.id };
  } catch (error: any) {
    console.error('[DoctorVisit] Error creating follow-up reminder:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Format confirmation data for user review
 */
export function formatConfirmationData(parsed: ParsedDoctorVisit): DoctorVisitConfirmation {
  const confirmation: DoctorVisitConfirmation = {
    visitDate: parsed.visitDate || new Date().toISOString().split('T')[0],
    visitType: parsed.visitType || 'appointment',
  };

  if (parsed.followUpTiming) {
    confirmation.followUpDate = parsed.followUpTiming.followUpDate;
    confirmation.followUpTiming = `in ${parsed.followUpTiming.amount} ${parsed.followUpTiming.unit}`;
  }

  if (parsed.diagnosis) {
    confirmation.diagnosis = parsed.diagnosis;
  }

  if (parsed.treatment) {
    confirmation.treatment = parsed.treatment;
  }

  if (parsed.medicationChanges && parsed.medicationChanges.length > 0) {
    confirmation.medicationChanges = parsed.medicationChanges
      .map(m => `${m.action} ${m.medication || 'medication'}`)
      .join(', ');
  }

  if (parsed.notes) {
    confirmation.notes = parsed.notes;
  }

  return confirmation;
}

/**
 * Execute doctor visit outcome logging
 * Creates care log and follow-up reminder if needed
 */
export async function executeDoctorVisitOutcome(
  userId: string,
  parsed: ParsedDoctorVisit
): Promise<ActionExecutionResult> {
  try {
    // Create care log
    const careLogResult = await createCareLog(userId, parsed);
    if (!careLogResult.success) {
      return {
        success: false,
        message: 'Failed to create care log',
        error: careLogResult.error,
      };
    }

    // Create follow-up reminder if needed
    let reminderCreated = false;
    if (parsed.followUpTiming) {
      const reminderResult = await createFollowUpReminder(
        userId,
        parsed,
        careLogResult.careLogId
      );
      reminderCreated = reminderResult.success;
      
      if (!reminderResult.success) {
        console.warn('[DoctorVisit] Care log created but reminder failed:', reminderResult.error);
      }
    }

    const messages: string[] = [];
    messages.push('Logged doctor visit');
    
    if (parsed.followUpTiming && reminderCreated) {
      messages.push(`Created reminder for follow-up ${parsed.followUpTiming.amount} ${parsed.followUpTiming.unit} from now`);
    }

    return {
      success: true,
      message: messages.join('. '),
      data: {
        careLogId: careLogResult.careLogId,
        followUpReminderCreated: reminderCreated,
        followUpDate: parsed.followUpTiming?.followUpDate,
      },
    };
  } catch (error: any) {
    console.error('[DoctorVisit] Error executing doctor visit outcome:', error);
    return {
      success: false,
      message: 'Failed to log doctor visit',
      error: error.message || 'Unknown error',
    };
  }
}
