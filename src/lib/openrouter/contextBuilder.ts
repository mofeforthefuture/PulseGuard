/**
 * Context Builder Service
 * Builds compact, relevant context for ALARA before each AI call
 * Fetches ONLY what's needed based on user intent
 */

import {
  loadShortTermMemory,
  loadWorkingMemory,
  loadLongTermMemory,
  loadConversationSummary,
  type ShortTermMemory,
  type WorkingMemory,
  type LongTermMemory,
} from './memory';
import { supabase } from '../supabase/client';
import { checkIfCheckInNeeded, type CheckInStatus } from './checkInTracker';

export interface ALARAContext {
  // Long-term memory
  firstName: string;
  personality: string;
  conditions: Array<{ type: string; name?: string; severity?: string }>;
  medications: Array<{ name: string; dosage: string; frequency: string }>;
  relationshipState: {
    familiarityLevel: 'new' | 'familiar' | 'close';
    toneTolerance: 'formal' | 'casual' | 'playful';
  };

  // Working memory
  todayMood?: string;
  lastMedicationTaken?: { name: string; timestamp: Date };
  activeLocation?: { name: string; circleId: string };
  lastCheckInDate?: string;

  // Conversation context
  conversationSummary?: string;
  recentMessageCount: number;

  // Mood trend (24-48h)
  moodTrend?: {
    recent: string[];
    pattern: string;
  };

  // Check-in status
  checkInStatus?: CheckInStatus;
}

/**
 * Detect user intent from message (simple heuristic)
 */
function detectIntent(message: string): {
  needsMedicationInfo: boolean;
  needsMoodInfo: boolean;
  needsLocationInfo: boolean;
  needsHealthHistory: boolean;
} {
  const lower = message.toLowerCase();

  return {
    needsMedicationInfo:
      lower.includes('med') ||
      lower.includes('pill') ||
      lower.includes('take') ||
      lower.includes('dose'),
    needsMoodInfo:
      lower.includes('feel') ||
      lower.includes('mood') ||
      lower.includes('emotion') ||
      lower.includes('sad') ||
      lower.includes('happy') ||
      lower.includes('anxious'),
    needsLocationInfo:
      lower.includes('location') ||
      lower.includes('place') ||
      lower.includes('where') ||
      lower.includes('home') ||
      lower.includes('work'),
    needsHealthHistory:
      lower.includes('symptom') ||
      lower.includes('episode') ||
      lower.includes('attack') ||
      lower.includes('yesterday') ||
      lower.includes('last week'),
  };
}

/**
 * Load mood trend (last 24-48 hours)
 */
async function loadMoodTrend(userId: string): Promise<{
  recent: string[];
  pattern: string;
} | null> {
  try {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const { data: checkIns } = await supabase
      .from('check_ins')
      .select('mood, date')
      .eq('user_id', userId)
      .gte('date', twoDaysAgo.toISOString().split('T')[0])
      .not('mood', 'is', null)
      .order('date', { ascending: false })
      .limit(5);

    if (!checkIns || checkIns.length === 0) {
      return null;
    }

    const recent = checkIns.map((ci) => ci.mood || '').filter(Boolean);
    if (recent.length === 0) {
      return null;
    }

    // Simple pattern detection
    let pattern = 'stable';
    if (recent.length >= 2) {
      const first = recent[0];
      const last = recent[recent.length - 1];
      if (first === 'crisis' || first === 'poor') {
        pattern = 'declining';
      } else if (first === 'great' || first === 'good') {
        pattern = 'improving';
      }
    }

    return { recent, pattern };
  } catch (error) {
    console.error('[Context] Error loading mood trend:', error);
    return null;
  }
}

/**
 * Get last medication taken with timestamp
 */
async function getLastMedicationTaken(
  userId: string
): Promise<{ name: string; timestamp: Date } | null> {
  try {
    const { data: lastMedication } = await supabase
      .from('health_entries')
      .select('data, created_at')
      .eq('user_id', userId)
      .eq('entry_type', 'medication')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!lastMedication?.data) {
      return null;
    }

    const medData = lastMedication.data as any;
    if (medData.medication_name) {
      return {
        name: medData.medication_name,
        timestamp: new Date(lastMedication.created_at),
      };
    }

    return null;
  } catch (error) {
    console.error('[Context] Error loading last medication:', error);
    return null;
  }
}

/**
 * Build context for ALARA based on user message and intent
 */
export async function buildALARAContext(
  userId: string,
  userMessage: string
): Promise<ALARAContext | null> {
  try {
    const intent = detectIntent(userMessage);

    // Always load long-term memory (core user facts)
    // If it fails, create a minimal context so ALARA can still respond
    const longTerm = await loadLongTermMemory(userId);
    if (!longTerm) {
      // Return minimal context instead of null so ALARA can still respond
      return {
        firstName: 'there',
        personality: 'friendly',
        conditions: [],
        medications: [],
        relationshipState: {
          familiarityLevel: 'new',
          toneTolerance: 'casual',
        },
        recentMessageCount: 0,
      };
    }

    // Load working memory (today's state)
    const working = await loadWorkingMemory(userId);

    // Load conversation summary (optional - only if available)
    const summary = await loadConversationSummary(userId);

    // Load short-term memory (last 5-8 messages for cost efficiency)
    // Use 8 messages for better context, but can be reduced to 5 if needed
    const shortTerm = await loadShortTermMemory(userId, 8);

    // Load mood trend if needed
    let moodTrend: { recent: string[]; pattern: string } | undefined;
    if (intent.needsMoodInfo || intent.needsHealthHistory) {
      const trend = await loadMoodTrend(userId);
      if (trend) {
        moodTrend = trend;
      }
    }

    // Get last medication if needed
    let lastMedicationTaken = working.lastMedicationTaken;
    if (intent.needsMedicationInfo && !lastMedicationTaken) {
      const lastMed = await getLastMedicationTaken(userId);
      if (lastMed) {
        lastMedicationTaken = lastMed;
      }
    }

    // Check if daily check-in is needed
    const checkInStatus = await checkIfCheckInNeeded(userId);

    return {
      // Long-term
      firstName: longTerm.firstName,
      personality: longTerm.personality,
      conditions: longTerm.conditions,
      medications: longTerm.medications,
      relationshipState: longTerm.relationshipState || {
        familiarityLevel: 'familiar',
        toneTolerance: 'casual',
      },

      // Working
      todayMood: working.todayMood,
      lastMedicationTaken,
      activeLocation: working.activeLocation,
      lastCheckInDate: working.lastCheckInDate,

      // Conversation
      conversationSummary: summary?.summaryText,
      recentMessageCount: shortTerm.messageCount,

      // Mood trend
      moodTrend,

      // Check-in status
      checkInStatus,
    };
  } catch (error) {
    console.error('[Context] Error building ALARA context:', error);
    return null;
  }
}

/**
 * Build context string for system prompt
 */
export function buildContextString(context: ALARAContext | null): string {
  if (!context) {
    return '';
  }

  const parts: string[] = [];

  // User identity
  parts.push(`You're chatting with ${context.firstName}.`);

  // Personality
  parts.push(`Your personality mode: ${context.personality}.`);

  // Health conditions (only if relevant)
  if (context.conditions.length > 0) {
    const conditionList = context.conditions
      .map((c) => {
        let desc = c.type.replace(/_/g, ' ');
        if (c.name && c.name !== c.type) {
          desc += ` (${c.name})`;
        }
        if (c.severity) {
          desc += ` - ${c.severity}`;
        }
        return desc;
      })
      .join(', ');
    parts.push(`They manage: ${conditionList}.`);
  }

  // Medications (only if relevant)
  if (context.medications.length > 0) {
    const medList = context.medications
      .map((m) => `${m.name} (${m.dosage}, ${m.frequency})`)
      .join(', ');
    parts.push(`Current medications: ${medList}.`);

    // Last medication taken
    if (context.lastMedicationTaken) {
      const hoursAgo = Math.floor(
        (Date.now() - context.lastMedicationTaken.timestamp.getTime()) /
          (1000 * 60 * 60)
      );
      if (hoursAgo < 24) {
        parts.push(
          `Last medication taken: ${context.lastMedicationTaken.name} (${hoursAgo}h ago).`
        );
      }
    }
  }

  // Today's mood
  if (context.todayMood) {
    parts.push(`Today's mood: ${context.todayMood}.`);
  }

  // Mood trend
  if (context.moodTrend && context.moodTrend.recent.length > 0) {
    parts.push(
      `Recent mood trend: ${context.moodTrend.recent.join(', ')} (${context.moodTrend.pattern}).`
    );
  }

  // Active location
  if (context.activeLocation) {
    parts.push(`Currently at: ${context.activeLocation.name}.`);
  }

  // Conversation summary (optional - only include if available and relevant)
  if (context.conversationSummary && context.recentMessageCount > 10) {
    // Only include summary if we have enough conversation history
    parts.push(`\nConversation context:\n${context.conversationSummary}`);
  }

  // Check-in status (for natural prompts)
  if (context.checkInStatus?.needsCheckIn) {
    const missing = context.checkInStatus.missingData;
    const missingItems: string[] = [];
    if (missing.mood) missingItems.push("mood/feeling");
    if (missing.medications) missingItems.push("medications");
    if (missing.doctorVisit) missingItems.push("doctor visit");
    
    if (missingItems.length > 0) {
      parts.push(
        `\nCheck-in reminder: You haven't checked in today. Consider naturally asking about: ${missingItems.join(", ")}. Work this into the conversation naturally, not as a checklist.`
      );
    }
  }

  // Relationship state
  parts.push(
    `Relationship: ${context.relationshipState.familiarityLevel} familiarity, ${context.relationshipState.toneTolerance} tone.`
  );

  return (
    `\n\nUser Context:\n${parts.join('\n')}\n\n` +
    `IMPORTANT MEMORY RULES:\n` +
    `- You do NOT have perfect memory. Use phrases like "last time you mentioned..." or "from what I remember..."\n` +
    `- If context is unclear, ask clarifying questions instead of guessing.\n` +
    `- Never claim to remember something you're not certain about.\n` +
    `- Reference the conversation summary for patterns, not specific quotes.\n`
  );
}
