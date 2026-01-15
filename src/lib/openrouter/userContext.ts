/**
 * User Context Builder for ALARA
 * Builds a comprehensive context string about the user for ALARA's system prompt
 */

import { supabase } from '../supabase/client';
import type { User } from '../../types/user';
import type { MedicalProfile } from '../../types/health';

export interface UserContext {
  name: string;
  conditions: Array<{
    type: string;
    name?: string;
    severity?: string;
  }>;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
  }>;
  recentCheckIns: Array<{
    date: string;
    mood?: string;
    notes?: string;
  }>;
  emergencyContact?: {
    name: string;
    phone: string;
  };
}

/**
 * Load user context from database
 */
export async function loadUserContext(userId: string): Promise<UserContext | null> {
  try {
    // Load profile (name, emergency contact)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, emergency_contact_name, emergency_contact_phone')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error loading profile:', profileError);
      return null;
    }

    // Load medical profiles (conditions, medications)
    const { data: medicalProfiles, error: medicalError } = await supabase
      .from('medical_profiles')
      .select('condition_type, condition_name, severity, medications')
      .eq('user_id', userId);

    if (medicalError) {
      console.error('Error loading medical profiles:', medicalError);
    }

    // Load recent check-ins (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: checkIns, error: checkInError } = await supabase
      .from('check_ins')
      .select('date, mood, notes')
      .eq('user_id', userId)
      .gte('date', sevenDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: false })
      .limit(7);

    if (checkInError) {
      console.error('Error loading check-ins:', checkInError);
    }

    // Extract conditions
    const conditions = (medicalProfiles || []).map((profile) => ({
      type: profile.condition_type,
      name: profile.condition_name || undefined,
      severity: profile.severity || undefined,
    }));

    // Extract medications from all profiles
    const medications: Array<{ name: string; dosage: string; frequency: string }> = [];
    (medicalProfiles || []).forEach((profile) => {
      if (profile.medications && Array.isArray(profile.medications)) {
        profile.medications.forEach((med: any) => {
          if (med.name) {
            medications.push({
              name: med.name,
              dosage: med.dosage || 'Unknown',
              frequency: med.frequency || 'Unknown',
            });
          }
        });
      }
    });

    return {
      name: profile?.full_name || 'there',
      conditions,
      medications,
      recentCheckIns: (checkIns || []).map((ci) => ({
        date: ci.date,
        mood: ci.mood || undefined,
        notes: ci.notes || undefined,
      })),
      emergencyContact: profile?.emergency_contact_name && profile?.emergency_contact_phone
        ? {
            name: profile.emergency_contact_name,
            phone: profile.emergency_contact_phone,
          }
        : undefined,
    };
  } catch (error) {
    console.error('Error loading user context:', error);
    return null;
  }
}

/**
 * Build a context string for ALARA's system prompt
 */
export function buildContextString(context: UserContext | null): string {
  if (!context) {
    return '';
  }

  const parts: string[] = [];

  // User's name - use first name if available
  const firstName = context.name && context.name !== 'there' 
    ? context.name.split(' ')[0] 
    : null;
  
  if (firstName) {
    parts.push(`You're chatting with ${firstName}.`);
  }

  // Health conditions
  if (context.conditions.length > 0) {
    const conditionList = context.conditions
      .map((c) => {
        let desc = c.type.replace(/_/g, ' ');
        if (c.name && c.name !== c.type) {
          desc += ` (${c.name})`;
        }
        if (c.severity) {
          desc += ` - ${c.severity} severity`;
        }
        return desc;
      })
      .join(', ');
    const pronoun = firstName ? 'They' : 'The user';
    parts.push(`${pronoun} manage${firstName ? '' : 's'}: ${conditionList}.`);
  }

  // Medications
  if (context.medications.length > 0) {
    const medList = context.medications
      .map((m) => `${m.name} (${m.dosage}, ${m.frequency})`)
      .join(', ');
    parts.push(`Current medications: ${medList}.`);
  }

  // Recent check-ins (mood trends)
  if (context.recentCheckIns.length > 0) {
    const moods = context.recentCheckIns
      .filter((ci) => ci.mood)
      .map((ci) => ci.mood)
      .slice(0, 3); // Last 3 moods
    if (moods.length > 0) {
      parts.push(`Recent mood trends: ${moods.join(', ')}.`);
    }
  }

  // Emergency contact (for context, not to share unless emergency)
  if (context.emergencyContact) {
    parts.push(`Emergency contact available: ${context.emergencyContact.name}.`);
  }

  return parts.length > 0 ? `\n\nUser Context:\n${parts.join('\n')}\n\nUse this information naturally in conversation. Don't list it all out - just reference it when relevant.` : '';
}
