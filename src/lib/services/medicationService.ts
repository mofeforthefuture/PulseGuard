/**
 * Medication Service
 * Handles medication CRUD operations and dose tracking
 */

import { supabase } from '../supabase/client';
import type { Medication } from '../../types/health';

export interface MedicationDoseLog {
  id: string;
  medication_id: string;
  medication_name: string;
  dosage: string;
  scheduled_time: string;
  taken_at?: string;
  status: 'taken' | 'missed';
  created_at: string;
}

/**
 * Get all medications for a user with profile tracking
 */
export async function getMedications(userId: string): Promise<Medication[]> {
  try {
    const { data, error } = await supabase
      .from('medical_profiles')
      .select('id, medications')
      .eq('user_id', userId);

    if (error) {
      console.error('[Medication] Error fetching medications:', error);
      return [];
    }

    // Extract medications from all profiles
    const allMedications: Medication[] = [];
    (data || []).forEach((profile) => {
      if (profile.medications && Array.isArray(profile.medications)) {
        allMedications.push(...(profile.medications as Medication[]));
      }
    });

    return allMedications;
  } catch (error) {
    console.error('[Medication] Error fetching medications:', error);
    return [];
  }
}

/**
 * Get medications with profile and index information
 */
export async function getMedicationsWithIndices(
  userId: string
): Promise<Array<{ medication: Medication; profileId: string; index: number }>> {
  try {
    const { data, error } = await supabase
      .from('medical_profiles')
      .select('id, medications')
      .eq('user_id', userId);

    if (error) {
      console.error('[Medication] Error fetching medications:', error);
      return [];
    }

    const medicationsWithIndices: Array<{
      medication: Medication;
      profileId: string;
      index: number;
    }> = [];

    (data || []).forEach((profile) => {
      if (profile.medications && Array.isArray(profile.medications)) {
        (profile.medications as Medication[]).forEach((med, index) => {
          medicationsWithIndices.push({
            medication: med,
            profileId: profile.id,
            index,
          });
        });
      }
    });

    return medicationsWithIndices;
  } catch (error) {
    console.error('[Medication] Error fetching medications:', error);
    return [];
  }
}

/**
 * Add medication to a medical profile
 */
export async function addMedication(
  userId: string,
  medication: Medication,
  conditionType?: string
): Promise<boolean> {
  try {
    // Find or create a medical profile
    let { data: profile, error: profileError } = await supabase
      .from('medical_profiles')
      .select('id, medications')
      .eq('user_id', userId)
      .limit(1)
      .single();

    if (profileError || !profile) {
      // Create new medical profile if none exists
      if (!conditionType) {
        conditionType = 'other';
      }
      const { data: newProfile, error: createError } = await supabase
        .from('medical_profiles')
        .insert({
          user_id: userId,
          condition_type: conditionType,
          medications: [medication],
        })
        .select()
        .single();

      if (createError) {
        console.error('[Medication] Error creating profile:', createError);
        return false;
      }
      profile = newProfile;
    } else {
      // Add medication to existing profile
      const existingMedications = (profile.medications as Medication[]) || [];
      const updatedMedications = [...existingMedications, medication];

      const { error: updateError } = await supabase
        .from('medical_profiles')
        .update({ medications: updatedMedications })
        .eq('id', profile.id);

      if (updateError) {
        console.error('[Medication] Error updating medications:', updateError);
        return false;
      }
    }

    // Create reminder if time is specified
    if (medication.time) {
      await upsertMedicationReminder(userId, medication.name, medication.time);
    }

    return true;
  } catch (error) {
    console.error('[Medication] Error adding medication:', error);
    return false;
  }
}

/**
 * Update medication in a medical profile
 */
export async function updateMedication(
  userId: string,
  medicationName: string,
  medication: Medication
): Promise<boolean> {
  try {
    const { data: profiles, error: profileError } = await supabase
      .from('medical_profiles')
      .select('id, medications')
      .eq('user_id', userId);

    if (profileError || !profiles || profiles.length === 0) {
      console.error('[Medication] Profile not found:', profileError);
      return false;
    }

    // Find the profile and medication index
    for (const profile of profiles) {
      const existingMedications = (profile.medications as Medication[]) || [];
      const medicationIndex = existingMedications.findIndex((m) => m.name === medicationName);

      if (medicationIndex >= 0) {
        const updatedMedications = [...existingMedications];
        updatedMedications[medicationIndex] = medication;

        const { error: updateError } = await supabase
          .from('medical_profiles')
          .update({ medications: updatedMedications })
          .eq('id', profile.id);

        if (updateError) {
          console.error('[Medication] Error updating medication:', updateError);
          return false;
        }

        // Update reminder if time changed
        if (medication.time) {
          await upsertMedicationReminder(userId, medication.name, medication.time);
        }

        return true;
      }
    }

    console.error('[Medication] Medication not found');
    return false;
  } catch (error) {
    console.error('[Medication] Error updating medication:', error);
    return false;
  }
}

/**
 * Delete medication from a medical profile
 */
export async function deleteMedication(
  userId: string,
  medicationName: string
): Promise<boolean> {
  try {
    const { data: profiles, error: profileError } = await supabase
      .from('medical_profiles')
      .select('id, medications')
      .eq('user_id', userId);

    if (profileError || !profiles || profiles.length === 0) {
      console.error('[Medication] Profile not found:', profileError);
      return false;
    }

    // Find the profile and medication
    for (const profile of profiles) {
      const existingMedications = (profile.medications as Medication[]) || [];
      const medicationIndex = existingMedications.findIndex((m) => m.name === medicationName);

      if (medicationIndex >= 0) {
        const updatedMedications = existingMedications.filter((_, index) => index !== medicationIndex);

        const { error: updateError } = await supabase
          .from('medical_profiles')
          .update({ medications: updatedMedications })
          .eq('id', profile.id);

        if (updateError) {
          console.error('[Medication] Error deleting medication:', updateError);
          return false;
        }

        return true;
      }
    }

    console.error('[Medication] Medication not found');
    return false;
  } catch (error) {
    console.error('[Medication] Error deleting medication:', error);
    return false;
  }
}

/**
 * Log a medication dose
 */
export async function logDose(
  userId: string,
  medicationId: string,
  medicationName: string,
  dosage: string,
  scheduledTime: string
): Promise<boolean> {
  try {
    const { error } = await supabase.from('health_entries').insert({
      user_id: userId,
      entry_type: 'medication',
      data: {
        medication_id: medicationId,
        medication_name: medicationName,
        dosage,
        scheduled_time: scheduledTime,
        taken_at: new Date().toISOString(),
        status: 'taken',
      },
    });

    if (error) {
      console.error('[Medication] Error logging dose:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Medication] Error logging dose:', error);
    return false;
  }
}

/**
 * Create or update medication reminder
 */
export async function upsertMedicationReminder(
  userId: string,
  medicationName: string,
  time: string,
  daysOfWeek: number[] = [0, 1, 2, 3, 4, 5, 6] // All days by default
): Promise<boolean> {
  try {
    const title = `Take ${medicationName}`;
    
    // Check if reminder already exists
    const { data: existing, error: findError } = await supabase
      .from('reminders')
      .select('id')
      .eq('user_id', userId)
      .eq('reminder_type', 'medication')
      .eq('title', title)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is fine
      console.error('[Medication] Error finding reminder:', findError);
    }

    const reminderData = {
      user_id: userId,
      title,
      description: `Reminder to take ${medicationName}`,
      reminder_type: 'medication' as const,
      time,
      days_of_week: daysOfWeek,
      is_active: true,
    };

    if (existing) {
      // Update existing reminder
      const { error: updateError } = await supabase
        .from('reminders')
        .update(reminderData)
        .eq('id', existing.id);

      if (updateError) {
        console.error('[Medication] Error updating reminder:', updateError);
        return false;
      }
    } else {
      // Create new reminder
      const { error: insertError } = await supabase
        .from('reminders')
        .insert(reminderData);

      if (insertError) {
        console.error('[Medication] Error creating reminder:', insertError);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('[Medication] Error upserting reminder:', error);
    return false;
  }
}

/**
 * Get dose history for a medication
 */
export async function getDoseHistory(
  userId: string,
  medicationName: string,
  days: number = 7
): Promise<MedicationDoseLog[]> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { data, error } = await supabase
      .from('health_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('entry_type', 'medication')
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Medication] Error fetching dose history:', error);
      return [];
    }

    const logs: MedicationDoseLog[] = (data || [])
      .filter((entry) => {
        const entryData = entry.data as any;
        return entryData?.medication_name === medicationName;
      })
      .map((entry) => {
        const entryData = entry.data as any;
        return {
          id: entry.id,
          medication_id: entryData.medication_id || '',
          medication_name: entryData.medication_name || medicationName,
          dosage: entryData.dosage || '',
          scheduled_time: entryData.scheduled_time || '',
          taken_at: entryData.taken_at || undefined,
          status: entryData.status || 'taken',
          created_at: entry.created_at,
        };
      });

    return logs;
  } catch (error) {
    console.error('[Medication] Error fetching dose history:', error);
    return [];
  }
}
