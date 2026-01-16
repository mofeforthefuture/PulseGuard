/**
 * ALARA Memory System
 * Implements retrieval-based memory architecture with clear separation:
 * - Short-term: Current conversation (last 10-20 messages, not sent raw)
 * - Working: Today's mood, last medication, hydration, active location
 * - Long-term: Stable user facts (name, conditions, preferences, relationship state)
 */

import { supabase } from '../supabase/client';

export interface ShortTermMemory {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  messageCount: number;
}

export interface WorkingMemory {
  todayMood?: string;
  lastMedicationTaken?: {
    name: string;
    timestamp: Date;
  };
  hydrationStatus?: string;
  activeLocation?: {
    name: string;
    circleId: string;
  };
  lastCheckInDate?: string;
}

export interface LongTermMemory {
  firstName: string;
  personality: string;
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
  preferences?: Record<string, any>;
  relationshipState?: {
    familiarityLevel: 'new' | 'familiar' | 'close';
    toneTolerance: 'formal' | 'casual' | 'playful';
  };
}

export interface ConversationSummary {
  summaryText: string;
  messageCount: number;
  lastUpdated: Date;
}

/**
 * Load short-term memory (last 5-8 messages from current conversation for cost efficiency)
 */
export async function loadShortTermMemory(
  userId: string,
  limit: number = 8
): Promise<ShortTermMemory> {
  try {
    const { data, error } = await supabase
      .from('alara_chat_messages')
      .select('message_text, is_alara, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Memory] Error loading short-term memory:', error);
      return { messages: [], messageCount: 0 };
    }

    const messages = (data || [])
      .reverse() // Reverse to get chronological order
      .map((msg) => ({
        role: msg.is_alara ? ('assistant' as const) : ('user' as const),
        content: msg.message_text,
        timestamp: new Date(msg.created_at),
      }));

    return {
      messages,
      messageCount: messages.length,
    };
  } catch (error) {
    console.error('[Memory] Error loading short-term memory:', error);
    return { messages: [], messageCount: 0 };
  }
}

/**
 * Load working memory (today's state: mood, medications, location)
 */
export async function loadWorkingMemory(userId: string): Promise<WorkingMemory> {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Load today's check-in
    const { data: checkIn } = await supabase
      .from('check_ins')
      .select('mood, date, medication_taken')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    // Load last medication entry
    const { data: lastMedication } = await supabase
      .from('health_entries')
      .select('data, created_at')
      .eq('user_id', userId)
      .eq('entry_type', 'medication')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Load active location circles
    const { data: activeLocation } = await supabase
      .from('location_circles')
      .select('id, name')
      .eq('user_id', userId)
      .eq('is_active', true)
      .limit(1)
      .single();

    // Load most recent check-in date
    const { data: lastCheckIn } = await supabase
      .from('check_ins')
      .select('date')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    const workingMemory: WorkingMemory = {};

    if (checkIn?.mood) {
      workingMemory.todayMood = checkIn.mood;
    }

    if (lastMedication?.data) {
      const medData = lastMedication.data as any;
      if (medData.medication_name) {
        workingMemory.lastMedicationTaken = {
          name: medData.medication_name,
          timestamp: new Date(lastMedication.created_at),
        };
      }
    }

    if (activeLocation) {
      workingMemory.activeLocation = {
        name: activeLocation.name,
        circleId: activeLocation.id,
      };
    }

    if (lastCheckIn?.date) {
      workingMemory.lastCheckInDate = lastCheckIn.date;
    }

    return workingMemory;
  } catch (error) {
    console.error('[Memory] Error loading working memory:', error);
    return {};
  }
}

/**
 * Load long-term memory (stable user facts)
 */
export async function loadLongTermMemory(userId: string): Promise<LongTermMemory | null> {
  try {
    // Load profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, alara_personality')
      .eq('id', userId)
      .single();

    if (!profile) {
      return null;
    }

    // Load medical profiles
    const { data: medicalProfiles } = await supabase
      .from('medical_profiles')
      .select('condition_type, condition_name, severity, medications')
      .eq('user_id', userId);

    // Extract conditions
    const conditions = (medicalProfiles || []).map((profile) => ({
      type: profile.condition_type,
      name: profile.condition_name || undefined,
      severity: profile.severity || undefined,
    }));

    // Extract medications
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

    const firstName = profile.full_name
      ? profile.full_name.split(' ')[0]
      : 'there';

    return {
      firstName,
      personality: profile.alara_personality || 'friendly',
      conditions,
      medications,
      relationshipState: {
        familiarityLevel: 'familiar', // Could be calculated based on message count
        toneTolerance: 'casual', // Default, could be learned
      },
    };
  } catch (error) {
    console.error('[Memory] Error loading long-term memory:', error);
    return null;
  }
}

/**
 * Load conversation summary
 */
export async function loadConversationSummary(
  userId: string
): Promise<ConversationSummary | null> {
  try {
    const { data, error } = await supabase
      .from('conversation_summaries')
      .select('summary_text, message_count, last_updated')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No summary exists yet
        return null;
      }
      console.error('[Memory] Error loading conversation summary:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    return {
      summaryText: data.summary_text,
      messageCount: data.message_count,
      lastUpdated: new Date(data.last_updated),
    };
  } catch (error) {
    console.error('[Memory] Error loading conversation summary:', error);
    return null;
  }
}

/**
 * Save or update conversation summary
 */
export async function saveConversationSummary(
  userId: string,
  summaryText: string,
  messageCount: number
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('conversation_summaries')
      .upsert(
        {
          user_id: userId,
          summary_text: summaryText,
          message_count: messageCount,
          last_updated: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      );

    if (error) {
      console.error('[Memory] Error saving conversation summary:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Memory] Error saving conversation summary:', error);
    return false;
  }
}
