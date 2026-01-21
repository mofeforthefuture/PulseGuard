/**
 * Action Executors
 * Execute ALARA's decisions and update the database
 */

import { supabase } from '../supabase/client';
import type { ALARAAction } from './actions';
import { parseDoctorVisitOutcome, validateDoctorVisit } from './doctorVisitParser';
import { executeDoctorVisitOutcome, formatConfirmationData } from './doctorVisitExecutor';
import { parseReminder, validateReminder } from './reminderParser';
import { executeReminderCreation, executeReminderCreationConfirmed, formatReminderConfirmation } from './reminderExecutor';
import { parseDoctorRecommendation, validateDoctorRecommendation } from './doctorRecommendationParser';
import { executeDoctorRecommendation, executeDoctorRecommendationApproved, formatDoctorRecommendationConfirmation } from './doctorRecommendationExecutor';

export interface ActionExecutionResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
  requiresConfirmation?: boolean;
  confirmationData?: any;
}

/**
 * Execute a medication logging action
 */
export async function executeLogMedication(
  userId: string,
  action: ALARAAction
): Promise<ActionExecutionResult> {
  try {
    const medicationName = action.data?.medication_name;
    const dose = action.data?.dose || 'Unknown';

    if (!medicationName) {
      return { success: false, error: 'Medication name required' };
    }

    // Save to health_entries
    const { error } = await supabase.from('health_entries').insert({
      user_id: userId,
      entry_type: 'medication',
      data: {
        medication_name: medicationName,
        dose,
        logged_at: new Date().toISOString(),
        source: 'ai_inferred',
      },
    });

    if (error) {
      console.error('[ALARA] Error logging medication:', error);
      return { success: false, error: error.message };
    }

    return { success: true, message: `Logged ${medicationName}` };
  } catch (error: any) {
    console.error('[ALARA] Error executing log_medication:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Execute a check-in creation action
 */
export async function executeCreateCheckIn(
  userId: string,
  action: ALARAAction
): Promise<ActionExecutionResult> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const mood = action.data?.mood;
    const symptoms = action.data?.symptoms || [];
    const notes = action.data?.notes;
    const medicationTaken = action.data?.medication_taken || false;

    // Check if check-in already exists for today
    const { data: existing } = await supabase
      .from('check_ins')
      .select('id')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    const checkInData: any = {
      user_id: userId,
      date: today,
      medication_taken: medicationTaken,
    };

    if (mood) checkInData.mood = mood;
    if (symptoms.length > 0) checkInData.symptoms = symptoms;
    if (notes) checkInData.notes = notes;

    if (existing) {
      // Update existing check-in
      const { error } = await supabase
        .from('check_ins')
        .update(checkInData)
        .eq('id', existing.id);

      if (error) {
        console.error('[ALARA] Error updating check-in:', error);
        return { success: false, error: error.message };
      }

      return { success: true, message: 'Updated today\'s check-in' };
    } else {
      // Create new check-in
      const { error } = await supabase.from('check_ins').insert(checkInData);

      if (error) {
        console.error('[ALARA] Error creating check-in:', error);
        return { success: false, error: error.message };
      }

      return { success: true, message: 'Created check-in for today' };
    }
  } catch (error: any) {
    console.error('[ALARA] Error executing create_check_in:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Execute a health entry save action
 */
export async function executeSaveHealthEntry(
  userId: string,
  action: ALARAAction
): Promise<ActionExecutionResult> {
  try {
    const entryType = action.data?.entry_type || 'note';
    const entryData = action.data?.data || action.data || {};

    const { error } = await supabase.from('health_entries').insert({
      user_id: userId,
      entry_type: entryType,
      data: {
        ...entryData,
        source: 'ai_inferred',
        created_at: new Date().toISOString(),
      },
    });

    if (error) {
      console.error('[ALARA] Error saving health entry:', error);
      return { success: false, error: error.message };
    }

    return { success: true, message: 'Saved health entry' };
  } catch (error: any) {
    console.error('[ALARA] Error executing save_health_entry:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Execute a mood update action
 */
export async function executeUpdateMood(
  userId: string,
  action: ALARAAction
): Promise<ActionExecutionResult> {
  try {
    const mood = action.data?.mood;
    if (!mood) {
      return { success: false, error: 'Mood required' };
    }

    const today = new Date().toISOString().split('T')[0];

    // Check if check-in exists
    const { data: existing } = await supabase
      .from('check_ins')
      .select('id')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (existing) {
      // Update existing check-in
      const { error } = await supabase
        .from('check_ins')
        .update({ mood })
        .eq('id', existing.id);

      if (error) {
        console.error('[ALARA] Error updating mood:', error);
        return { success: false, error: error.message };
      }
    } else {
      // Create new check-in with just mood
      const { error } = await supabase.from('check_ins').insert({
        user_id: userId,
        date: today,
        mood,
      });

      if (error) {
        console.error('[ALARA] Error creating mood check-in:', error);
        return { success: false, error: error.message };
      }
    }

    return { success: true, message: `Updated mood to ${mood}` };
  } catch (error: any) {
    console.error('[ALARA] Error executing update_mood:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Execute a reminder creation action
 */
export async function executeCreateReminder(
  userId: string,
  action: ALARAAction
): Promise<ActionExecutionResult> {
  try {
    const title = action.data?.title;
    const time = action.data?.time;
    const days = action.data?.days || [1, 2, 3, 4, 5, 6, 7]; // Default: every day
    const reminderType = action.data?.reminder_type || 'medication';
    const description = action.data?.description;

    if (!title || !time) {
      return { success: false, error: 'Title and time required' };
    }

    const { error } = await supabase.from('reminders').insert({
      user_id: userId,
      title,
      description,
      reminder_type: reminderType,
      time,
      days_of_week: days,
      is_active: true,
    });

    if (error) {
      console.error('[ALARA] Error creating reminder:', error);
      return { success: false, error: error.message };
    }

    return { success: true, message: `Created reminder: ${title}` };
  } catch (error: any) {
    console.error('[ALARA] Error executing create_reminder:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Execute a doctor visit logging action
 */
export async function executeLogDoctorVisit(
  userId: string,
  action: ALARAAction
): Promise<ActionExecutionResult> {
  try {
    const visitType = action.data?.visit_type || 'appointment';
    const notes = action.data?.notes || '';
    const visitDate = action.data?.date || new Date().toISOString().split('T')[0];

    // Save to health_entries
    const { error } = await supabase.from('health_entries').insert({
      user_id: userId,
      entry_type: 'note',
      data: {
        visit_type: visitType,
        notes: notes || `Doctor visit on ${visitDate}`,
        visit_date: visitDate,
        source: 'ai_inferred',
        created_at: new Date().toISOString(),
      },
    });

    if (error) {
      console.error('[ALARA] Error logging doctor visit:', error);
      return { success: false, error: error.message };
    }

    return { success: true, message: `Logged doctor visit: ${visitType}` };
  } catch (error: any) {
    console.error('[ALARA] Error executing log_doctor_visit:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Execute a care log creation action
 */
export async function executeCreateCareLog(
  userId: string,
  action: ALARAAction
): Promise<ActionExecutionResult> {
  try {
    const logType = action.data?.log_type;
    const title = action.data?.title;
    const occurredAt = action.data?.occurred_at;
    const diagnosis = action.data?.diagnosis;
    const treatment = action.data?.treatment;
    const notes = action.data?.notes;
    const durationMinutes = action.data?.duration_minutes;
    const locationType = action.data?.location_type;
    const locationName = action.data?.location_name;
    const medicationsPrescribed = action.data?.medications_prescribed;
    const testResults = action.data?.test_results;
    const symptomsReported = action.data?.symptoms_reported;
    const followUpRequired = action.data?.follow_up_required || false;
    const followUpNotes = action.data?.follow_up_notes;

    if (!logType || !title || !occurredAt) {
      return { success: false, error: 'log_type, title, and occurred_at are required' };
    }

    const { error } = await supabase.from('care_logs').insert({
      user_id: userId,
      log_type: logType,
      title,
      occurred_at: occurredAt,
      diagnosis: diagnosis || null,
      treatment: treatment || null,
      notes: notes || null,
      duration_minutes: durationMinutes || null,
      location_type: locationType || null,
      location_name: locationName || null,
      medications_prescribed: medicationsPrescribed || null,
      test_results: testResults || null,
      symptoms_reported: symptomsReported || null,
      follow_up_required: followUpRequired,
      follow_up_notes: followUpNotes || null,
    });

    if (error) {
      console.error('[ALARA] Error creating care log:', error);
      return { success: false, error: error.message };
    }

    return { success: true, message: `Created care log: ${title}` };
  } catch (error: any) {
    console.error('[ALARA] Error executing create_care_log:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Execute a blood pressure logging action
 */
export async function executeLogBloodPressure(
  userId: string,
  action: ALARAAction
): Promise<ActionExecutionResult> {
  try {
    const systolic = action.data?.systolic;
    const diastolic = action.data?.diastolic;
    const pulse = action.data?.pulse;
    const position = action.data?.position;
    const notes = action.data?.notes;

    // Validation: Required fields
    if (systolic === undefined || systolic === null) {
      return { success: false, error: 'Systolic value is required' };
    }
    if (diastolic === undefined || diastolic === null) {
      return { success: false, error: 'Diastolic value is required' };
    }

    // Validation: Type checks
    const systolicNum = typeof systolic === 'string' ? parseInt(systolic, 10) : systolic;
    const diastolicNum = typeof diastolic === 'string' ? parseInt(diastolic, 10) : diastolic;
    const pulseNum = pulse ? (typeof pulse === 'string' ? parseInt(pulse, 10) : pulse) : undefined;

    // Validation: Range checks
    if (isNaN(systolicNum) || systolicNum < 1 || systolicNum > 300) {
      return { success: false, error: 'Systolic must be between 1 and 300' };
    }
    if (isNaN(diastolicNum) || diastolicNum < 1 || diastolicNum > 200) {
      return { success: false, error: 'Diastolic must be between 1 and 200' };
    }
    if (diastolicNum >= systolicNum) {
      return { success: false, error: 'Diastolic must be less than systolic' };
    }
    if (pulseNum !== undefined && (isNaN(pulseNum) || pulseNum < 40 || pulseNum > 200)) {
      return { success: false, error: 'Pulse must be between 40 and 200 if provided' };
    }

    // Validation: Position enum
    const validPositions = ['sitting', 'standing', 'lying', 'other'];
    if (position && !validPositions.includes(position)) {
      return { success: false, error: `Position must be one of: ${validPositions.join(', ')}` };
    }

    // Use blood pressure service to log (handles abnormal detection)
    const { logBloodPressure } = await import('../services/bloodPressureService');
    const reading = await logBloodPressure(userId, {
      systolic: systolicNum,
      diastolic: diastolicNum,
      pulse: pulseNum,
      position: position as any,
      notes: notes || undefined,
    });

    if (!reading) {
      return { success: false, error: 'Failed to save blood pressure reading' };
    }

    // Determine if confirmation needed (unusual values)
    const isUnusual = reading.is_abnormal;
    const message = isUnusual
      ? `Logged blood pressure: ${systolicNum}/${diastolicNum} (unusual value detected)`
      : `Logged blood pressure: ${systolicNum}/${diastolicNum}`;

    return {
      success: true,
      message,
      data: {
        reading,
        isUnusual,
        abnormalReason: reading.abnormal_reason,
      },
    };
  } catch (error: any) {
    console.error('[ALARA] Error executing log_blood_pressure:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Execute a hydration logging action
 */
export async function executeLogHydration(
  userId: string,
  action: ALARAAction
): Promise<ActionExecutionResult> {
  try {
    const amount = action.data?.amount;
    const notes = action.data?.notes;

    // Validation: Required field
    if (amount === undefined || amount === null) {
      return { success: false, error: 'Amount is required' };
    }

    // Validation: Type check
    const amountNum = typeof amount === 'string' ? parseInt(amount, 10) : amount;

    // Validation: Range check
    if (isNaN(amountNum) || amountNum < 1 || amountNum > 10000) {
      return { success: false, error: 'Amount must be between 1 and 10000ml' };
    }

    // Get today's current hydration total
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // Load today's hydration entries to calculate current total
    const { data: existingEntries, error: fetchError } = await supabase
      .from('health_entries')
      .select('data, created_at')
      .eq('user_id', userId)
      .eq('entry_type', 'vital')
      .gte('created_at', todayStr);

    if (fetchError) {
      console.error('[ALARA] Error fetching hydration entries:', fetchError);
      // Continue anyway - we'll just use the new amount
    }

    // Calculate current total
    const currentTotal = (existingEntries || []).reduce((sum, entry) => {
      const entryData = entry.data as any;
      if (entryData?.type === 'hydration' && entryData?.amount) {
        const entryDate = new Date(entry.created_at);
        if (entryDate >= today) {
          return sum + entryData.amount;
        }
      }
      return sum;
    }, 0);

    const newTotal = currentTotal + amountNum;

    // Save to health_entries
    const { error } = await supabase.from('health_entries').insert({
      user_id: userId,
      entry_type: 'vital',
      data: {
        type: 'hydration',
        amount: amountNum,
        total: newTotal,
        timestamp: new Date().toISOString(),
      },
    });

    if (error) {
      console.error('[ALARA] Error logging hydration:', error);
      return { success: false, error: error.message };
    }

    // Calculate progress toward goal (default 2000ml)
    const goal = 2000; // 2L per day
    const progress = (newTotal / goal) * 100;
    const isGoalReached = newTotal >= goal;

    return {
      success: true,
      message: `Logged ${amountNum}ml of water`,
      data: {
        amount: amountNum,
        total: newTotal,
        goal,
        progress,
        isGoalReached,
        notes: notes || undefined,
      },
    };
  } catch (error: any) {
    console.error('[ALARA] Error executing log_hydration:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Execute doctor visit outcome logging
 * Parses natural language, creates care log, and follow-up reminder
 * ALWAYS requires confirmation before executing
 */
export async function executeLogDoctorVisitOutcome(
  userId: string,
  action: ALARAAction
): Promise<ActionExecutionResult> {
  try {
    const userMessage = action.data?.user_message || action.data?.text || '';
    const visitDate = action.data?.visit_date;

    if (!userMessage) {
      return { success: false, error: 'User message is required to parse visit outcome' };
    }

    // Parse doctor visit outcome from natural language
    const parsed = parseDoctorVisitOutcome(userMessage, visitDate);
    
    // Validate parsed data
    const validation = validateDoctorVisit(parsed);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.join('; '),
        requiresConfirmation: false,
      };
    }

    // Format confirmation data
    const confirmationData = formatConfirmationData(parsed);

    // ALWAYS require confirmation for doctor visit outcomes (critical data)
    return {
      success: true,
      message: 'Doctor visit outcome parsed. Please confirm details.',
      requiresConfirmation: true,
      confirmationData,
      data: {
        parsed,
        confirmationData,
      },
    };
  } catch (error: any) {
    console.error('[ALARA] Error executing log_doctor_visit_outcome:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Execute doctor visit outcome after confirmation
 */
export async function executeDoctorVisitOutcomeConfirmed(
  userId: string,
  confirmationData: any
): Promise<ActionExecutionResult> {
  try {
    // Re-parse to get full parsed object
    const parsed = confirmationData.parsed || {
      visitDate: confirmationData.visitDate,
      visitType: confirmationData.visitType,
      followUpTiming: confirmationData.followUpDate ? {
        followUpDate: confirmationData.followUpDate,
        amount: 0,
        unit: 'days' as const,
      } : undefined,
      diagnosis: confirmationData.diagnosis,
      treatment: confirmationData.treatment,
      medicationChanges: confirmationData.medicationChanges ? [{
        action: 'changed' as const,
        medication: confirmationData.medicationChanges,
      }] : undefined,
      notes: confirmationData.notes,
      confidence: 1.0,
    };

    // Execute the visit outcome logging
    return await executeDoctorVisitOutcome(userId, parsed);
  } catch (error: any) {
    console.error('[ALARA] Error executing confirmed doctor visit outcome:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Execute schedule reminder action
 * Parses natural language and creates reminder with confirmation
 */
export async function executeScheduleReminder(
  userId: string,
  action: ALARAAction
): Promise<ActionExecutionResult> {
  try {
    const userMessage = action.data?.user_message || action.data?.text || action.data?.reminder_text || '';
    
    if (!userMessage) {
      return { success: false, error: 'Reminder text is required' };
    }
    
    // Get current date from metadata context (injected system time)
    // The metadata context provides the current date/time in the system prompt
    // We use the actual current date for calculations
    const currentDate = new Date(); // Uses system time
    
    // Parse reminder from natural language
    const parsed = parseReminder(userMessage, currentDate);
    
    if (!parsed) {
      return {
        success: false,
        error: 'Could not parse reminder. Please specify a date/time like "in 2 weeks" or "every day at 9am"',
      };
    }
    
    // Validate parsed reminder
    const validation = validateReminder(parsed);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.join('; '),
        requiresConfirmation: false,
      };
    }
    
    // Execute reminder creation (will return confirmation request)
    return await executeReminderCreation(userId, parsed);
  } catch (error: any) {
    console.error('[ALARA] Error executing schedule_reminder:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Execute reminder creation after confirmation
 */
export async function executeReminderConfirmed(
  userId: string,
  confirmationData: any
): Promise<ActionExecutionResult> {
  try {
    // Re-construct parsed reminder from confirmation data
    const parsed = confirmationData.parsed || {
      title: confirmationData.title,
      description: confirmationData.description,
      reminderType: confirmationData.reminderType,
      isRecurring: confirmationData.isRecurring,
      oneTimeDate: confirmationData.oneTimeDate,
      time: confirmationData.time || '09:00',
      daysOfWeek: confirmationData.daysOfWeek,
      interval: confirmationData.interval,
      confidence: 1.0,
    };
    
    return await executeReminderCreationConfirmed(userId, parsed);
  } catch (error: any) {
    console.error('[ALARA] Error executing confirmed reminder:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Execute parse doctor recommendation action
 * Parses doctor recommendations and proposes reminder schedules
 * ALWAYS requires user approval before creating
 */
export async function executeParseDoctorRecommendation(
  userId: string,
  action: ALARAAction
): Promise<ActionExecutionResult> {
  try {
    const recommendationText = action.data?.recommendation_text || 
                               action.data?.text || 
                               action.data?.user_message || '';
    
    if (!recommendationText) {
      return { success: false, error: 'Doctor recommendation text is required' };
    }
    
    // Parse doctor recommendation from natural language
    const parsed = parseDoctorRecommendation(recommendationText);
    
    if (!parsed) {
      return {
        success: false,
        error: 'Could not parse doctor recommendation. Please specify an interval or frequency (e.g., "in 3 months", "daily for a month").',
      };
    }
    
    // Validate parsed recommendation
    const validation = validateDoctorRecommendation(parsed);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.join('; '),
        requiresConfirmation: false,
      };
    }
    
    // Execute recommendation parsing (will return confirmation request)
    return await executeDoctorRecommendation(userId, parsed);
  } catch (error: any) {
    console.error('[ALARA] Error executing parse_doctor_recommendation:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Execute doctor recommendation after user approval
 */
export async function executeDoctorRecommendationApprovedAction(
  userId: string,
  confirmationData: any
): Promise<ActionExecutionResult> {
  try {
    // Re-construct parsed recommendation from confirmation data
    const parsed = confirmationData.parsed || {
      recommendationText: confirmationData.recommendationText,
      action: confirmationData.action,
      proposedReminder: confirmationData.proposedReminder,
      confidence: 1.0,
    };
    
    return await executeDoctorRecommendationApproved(userId, parsed);
  } catch (error: any) {
    console.error('[ALARA] Error executing approved doctor recommendation:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Execute all actions from ALARA
 */
export async function executeActions(
  userId: string,
  actions: ALARAAction[]
): Promise<ActionExecutionResult[]> {
  const results: ActionExecutionResult[] = [];

  for (const action of actions) {
    if (action.type === 'none' || !action.type) {
      continue;
    }

    // Only execute high-confidence actions (0.7+)
    if (action.confidence && action.confidence < 0.7) {
      console.log('[ALARA] Skipping low-confidence action:', action);
      continue;
    }

    let result: ActionExecutionResult;

    switch (action.type) {
      case 'log_medication':
        result = await executeLogMedication(userId, action);
        break;
      case 'create_check_in':
        result = await executeCreateCheckIn(userId, action);
        break;
      case 'save_health_entry':
        result = await executeSaveHealthEntry(userId, action);
        break;
      case 'update_mood':
        result = await executeUpdateMood(userId, action);
        break;
      case 'create_reminder':
        result = await executeCreateReminder(userId, action);
        break;
      case 'log_doctor_visit':
        result = await executeLogDoctorVisit(userId, action);
        break;
      case 'create_care_log':
        result = await executeCreateCareLog(userId, action);
        break;
      case 'log_blood_pressure':
        result = await executeLogBloodPressure(userId, action);
        break;
      case 'log_hydration':
        result = await executeLogHydration(userId, action);
        break;
      case 'log_doctor_visit_outcome':
        result = await executeLogDoctorVisitOutcome(userId, action);
        break;
      case 'schedule_reminder':
        result = await executeScheduleReminder(userId, action);
        break;
      case 'parse_doctor_recommendation':
        result = await executeParseDoctorRecommendation(userId, action);
        break;
      default:
        result = { success: false, error: `Unknown action type: ${action.type}` };
    }

    results.push(result);
    console.log('[ALARA] Action executed:', action.type, result);
  }

  return results;
}
