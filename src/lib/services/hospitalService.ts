/**
 * Hospital Service
 * Handles hospital information storage and retrieval
 */

import { supabase } from '../supabase/client';
import type { Hospital, HospitalInput } from '../../types/care';

/**
 * Get all hospitals for a user
 */
export async function getHospitals(userId: string): Promise<Hospital[]> {
  try {
    const { data, error } = await supabase
      .from('hospitals')
      .select('*')
      .eq('user_id', userId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Hospital] Error fetching hospitals:', error);
      return [];
    }

    return (data || []) as Hospital[];
  } catch (error) {
    console.error('[Hospital] Error fetching hospitals:', error);
    return [];
  }
}

/**
 * Get primary hospital for a user
 */
export async function getPrimaryHospital(userId: string): Promise<Hospital | null> {
  try {
    const { data, error } = await supabase
      .from('hospitals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_primary', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No primary hospital found
        return null;
      }
      console.error('[Hospital] Error fetching primary hospital:', error);
      return null;
    }

    return data as Hospital;
  } catch (error) {
    console.error('[Hospital] Error fetching primary hospital:', error);
    return null;
  }
}

/**
 * Create a new hospital
 */
export async function createHospital(
  userId: string,
  input: HospitalInput
): Promise<Hospital | null> {
  try {
    const { data, error } = await supabase
      .from('hospitals')
      .insert({
        user_id: userId,
        hospital_name: input.hospital_name,
        phone_number: input.phone_number,
        patient_card_id: input.patient_card_id || null,
        is_primary: input.is_primary || false,
        address: input.address || null,
        notes: input.notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('[Hospital] Error creating hospital:', error);
      return null;
    }

    return data as Hospital;
  } catch (error) {
    console.error('[Hospital] Error creating hospital:', error);
    return null;
  }
}

/**
 * Update a hospital
 */
export async function updateHospital(
  userId: string,
  hospitalId: string,
  input: HospitalInput
): Promise<Hospital | null> {
  try {
    const { data, error } = await supabase
      .from('hospitals')
      .update({
        hospital_name: input.hospital_name,
        phone_number: input.phone_number,
        patient_card_id: input.patient_card_id || null,
        is_primary: input.is_primary !== undefined ? input.is_primary : undefined,
        address: input.address || null,
        notes: input.notes || null,
      })
      .eq('id', hospitalId)
      .eq('user_id', userId) // Ensure user owns the record
      .select()
      .single();

    if (error) {
      console.error('[Hospital] Error updating hospital:', error);
      return null;
    }

    return data as Hospital;
  } catch (error) {
    console.error('[Hospital] Error updating hospital:', error);
    return null;
  }
}

/**
 * Set a hospital as primary (automatically unsets others)
 */
export async function setPrimaryHospital(
  userId: string,
  hospitalId: string
): Promise<boolean> {
  try {
    // First, unset all primary hospitals
    await supabase
      .from('hospitals')
      .update({ is_primary: false })
      .eq('user_id', userId)
      .eq('is_primary', true);

    // Then set this one as primary
    const { error } = await supabase
      .from('hospitals')
      .update({ is_primary: true })
      .eq('id', hospitalId)
      .eq('user_id', userId);

    if (error) {
      console.error('[Hospital] Error setting primary hospital:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Hospital] Error setting primary hospital:', error);
    return false;
  }
}

/**
 * Delete a hospital
 */
export async function deleteHospital(
  userId: string,
  hospitalId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('hospitals')
      .delete()
      .eq('id', hospitalId)
      .eq('user_id', userId); // Ensure user owns the record

    if (error) {
      console.error('[Hospital] Error deleting hospital:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Hospital] Error deleting hospital:', error);
    return false;
  }
}

/**
 * Format hospital info for emergency messages
 */
export function formatHospitalForEmergency(hospital: Hospital | null): string {
  if (!hospital) {
    return '';
  }

  let info = `\n\nHospital Information:\n${hospital.hospital_name}\nPhone: ${hospital.phone_number}`;
  
  if (hospital.patient_card_id) {
    info += `\nPatient Card ID: ${hospital.patient_card_id}`;
  }
  
  if (hospital.address) {
    info += `\nAddress: ${hospital.address}`;
  }

  return info;
}
