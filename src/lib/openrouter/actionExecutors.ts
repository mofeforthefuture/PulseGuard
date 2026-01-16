/**
 * Action Executors
 * Execute ALARA's decisions and update the database
 */

import { supabase } from '../supabase/client';
import type { ALARAAction } from './actions';

export interface ActionExecutionResult {
  success: boolean;
  message?: string;
  error?: string;
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
      default:
        result = { success: false, error: `Unknown action type: ${action.type}` };
    }

    results.push(result);
    console.log('[ALARA] Action executed:', action.type, result);
  }

  return results;
}
