/**
 * Doctor Recommendation Parser
 * Parses doctor recommendations like "Return in 3 months", "Check BP daily for a month"
 * Extracts intervals and proposes reminder schedules
 * NO medical interpretation - only extracts what doctor said
 */

export interface ParsedDoctorRecommendation {
  recommendationText: string; // Original text
  action?: string; // What to do (e.g., "check BP", "return", "follow up")
  interval?: {
    amount: number;
    unit: 'days' | 'weeks' | 'months' | 'years';
    duration?: number; // Total duration if specified (e.g., "for a month")
  };
  frequency?: {
    amount: number;
    unit: 'daily' | 'weekly' | 'monthly';
  };
  proposedReminder?: {
    title: string;
    isRecurring: boolean;
    // For one-time
    oneTimeDate?: string;
    // For recurring
    time?: string;
    daysOfWeek?: number[];
    interval?: {
      amount: number;
      unit: 'days' | 'weeks' | 'months';
    };
  };
  confidence: number; // 0-1
}

/**
 * Number words to numbers
 */
const NUMBER_WORDS: Record<string, number> = {
  'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
  'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
  'a': 1, 'an': 1,
};

/**
 * Parse time phrase to days
 */
function parseTimeToDays(amount: number, unit: string): number {
  const normalizedUnit = unit.toLowerCase().replace(/s$/, '');
  
  switch (normalizedUnit) {
    case 'day':
      return amount;
    case 'week':
      return amount * 7;
    case 'month':
      return amount * 30; // Approximate
    case 'year':
      return amount * 365;
    default:
      return 0;
  }
}

/**
 * Extract action from recommendation text
 */
function extractAction(text: string): string | undefined {
  const lowerText = text.toLowerCase();
  
  // Common action patterns
  const actionPatterns = [
    /(?:check|monitor|track|measure|test)\s+([^.,!?]+?)(?:\s+(?:in|after|for|every|daily|weekly|monthly)|$)/i,
    /(?:return|come back|follow up|follow-up|schedule|book)\s+(?:in|after|for|on)?/i,
    /(?:take|use|apply)\s+([^.,!?]+?)(?:\s+(?:in|after|for|every|daily|weekly|monthly)|$)/i,
  ];
  
  for (const pattern of actionPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  // Default actions based on keywords
  if (lowerText.includes('return') || lowerText.includes('come back') || lowerText.includes('follow up')) {
    return 'Follow-up appointment';
  }
  if (lowerText.includes('check') || lowerText.includes('monitor')) {
    return 'Check as recommended';
  }
  
  return undefined;
}

/**
 * Parse interval from recommendation
 */
function parseInterval(text: string, currentDate: Date = new Date()): {
  amount: number;
  unit: 'days' | 'weeks' | 'months' | 'years';
  followUpDate?: string;
} | null {
  const lowerText = text.toLowerCase();
  
  // Patterns for intervals
  const patterns = [
    // "in 3 months", "after 2 weeks"
    /(?:in|after)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+(day|days|week|weeks|month|months|year|years)/i,
    // "3 months", "2 weeks"
    /(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+(day|days|week|weeks|month|months|year|years)/i,
  ];
  
  for (const pattern of patterns) {
    const match = lowerText.match(pattern);
    if (match) {
      const amountStr = match[1];
      const unit = match[2];
      const amount = NUMBER_WORDS[amountStr.toLowerCase()] || parseInt(amountStr, 10);
      
      if (amount > 0) {
        const days = parseTimeToDays(amount, unit);
        const followUpDate = new Date(currentDate);
        followUpDate.setDate(followUpDate.getDate() + days);
        
        return {
          amount,
          unit: unit.replace(/s$/, '') as 'days' | 'weeks' | 'months' | 'years',
          followUpDate: followUpDate.toISOString().split('T')[0],
        };
      }
    }
  }
  
  return null;
}

/**
 * Parse frequency (e.g., "daily", "weekly", "every day")
 */
function parseFrequency(text: string): {
  amount: number;
  unit: 'daily' | 'weekly' | 'monthly';
} | null {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('daily') || lowerText.includes('every day')) {
    return { amount: 1, unit: 'daily' };
  }
  if (lowerText.includes('weekly') || lowerText.includes('every week')) {
    return { amount: 1, unit: 'weekly' };
  }
  if (lowerText.includes('monthly') || lowerText.includes('every month')) {
    return { amount: 1, unit: 'monthly' };
  }
  
  // "every X days/weeks/months"
  const everyPattern = /every\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+(day|days|week|weeks|month|months)/i;
  const match = lowerText.match(everyPattern);
  if (match) {
    const amountStr = match[1];
    const unit = match[2];
    const amount = NUMBER_WORDS[amountStr.toLowerCase()] || parseInt(amountStr, 10);
    
    if (amount > 0) {
      const normalizedUnit = unit.toLowerCase().replace(/s$/, '');
      if (normalizedUnit === 'day') {
        return { amount, unit: 'daily' };
      } else if (normalizedUnit === 'week') {
        return { amount, unit: 'weekly' };
      } else if (normalizedUnit === 'month') {
        return { amount, unit: 'monthly' };
      }
    }
  }
  
  return null;
}

/**
 * Parse duration (e.g., "for a month", "for 2 weeks")
 */
function parseDuration(text: string): number | undefined {
  const lowerText = text.toLowerCase();
  
  const durationPattern = /for\s+(?:a|an|the)?\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+(day|days|week|weeks|month|months|year|years)/i;
  const match = lowerText.match(durationPattern);
  
  if (match) {
    const amountStr = match[1];
    const unit = match[2];
    const amount = NUMBER_WORDS[amountStr.toLowerCase()] || parseInt(amountStr, 10);
    
    if (amount > 0) {
      return parseTimeToDays(amount, unit);
    }
  }
  
  return undefined;
}

/**
 * Propose reminder schedule based on parsed recommendation
 */
function proposeReminderSchedule(
  parsed: Omit<ParsedDoctorRecommendation, 'proposedReminder' | 'confidence'>
): ParsedDoctorRecommendation['proposedReminder'] {
  // If frequency is specified (e.g., "daily", "weekly"), create recurring reminder
  if (parsed.frequency) {
    const title = parsed.action || 'Doctor recommendation reminder';
    const time = '09:00'; // Default time
    
    if (parsed.frequency.unit === 'daily') {
      return {
        title,
        isRecurring: true,
        time,
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Every day
        interval: {
          amount: parsed.frequency.amount,
          unit: 'days',
        },
      };
    } else if (parsed.frequency.unit === 'weekly') {
      return {
        title,
        isRecurring: true,
        time,
        daysOfWeek: [1], // Monday (default)
        interval: {
          amount: parsed.frequency.amount,
          unit: 'weeks',
        },
      };
    } else if (parsed.frequency.unit === 'monthly') {
      return {
        title,
        isRecurring: true,
        time,
        daysOfWeek: [1], // Monday (default)
        interval: {
          amount: parsed.frequency.amount,
          unit: 'months',
        },
      };
    }
  }
  
  // If interval is specified (e.g., "in 3 months"), create one-time reminder
  if (parsed.interval && parsed.interval.followUpDate) {
    return {
      title: parsed.action || 'Follow-up reminder',
      isRecurring: false,
      oneTimeDate: parsed.interval.followUpDate,
      time: '09:00',
    };
  }
  
  return undefined;
}

/**
 * Parse doctor recommendation from natural language
 */
export function parseDoctorRecommendation(
  text: string,
  currentDate: Date = new Date()
): ParsedDoctorRecommendation | null {
  const recommendationText = text.trim();
  
  if (!recommendationText) {
    return null;
  }
  
  const result: Omit<ParsedDoctorRecommendation, 'proposedReminder' | 'confidence'> = {
    recommendationText,
  };
  
  // Extract action
  const action = extractAction(text);
  if (action) {
    result.action = action;
  }
  
  // Extract interval (e.g., "in 3 months", "after 2 weeks")
  const interval = parseInterval(text, currentDate);
  if (interval) {
    result.interval = {
      amount: interval.amount,
      unit: interval.unit,
    };
    
    // Check for duration (e.g., "for a month")
    const duration = parseDuration(text);
    if (duration) {
      result.interval.duration = duration;
    }
  }
  
  // Extract frequency (e.g., "daily", "weekly", "every day")
  const frequency = parseFrequency(text);
  if (frequency) {
    result.frequency = frequency;
  }
  
  // If we have interval or frequency, propose reminder schedule
  let proposedReminder: ParsedDoctorRecommendation['proposedReminder'] = undefined;
  let confidence = 0.7;
  
  if (result.interval || result.frequency) {
    proposedReminder = proposeReminderSchedule(result);
    confidence = 0.9; // Higher confidence if we can extract interval/frequency
  }
  
  // If no interval or frequency found, we can't create a meaningful reminder
  if (!proposedReminder) {
    return null;
  }
  
  return {
    ...result,
    proposedReminder,
    confidence,
  };
}

/**
 * Validate parsed recommendation
 */
export function validateDoctorRecommendation(parsed: ParsedDoctorRecommendation): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!parsed.recommendationText) {
    errors.push('Recommendation text is required');
  }
  
  if (!parsed.proposedReminder) {
    errors.push('Could not propose reminder schedule from recommendation');
  } else {
    if (parsed.proposedReminder.isRecurring) {
      if (!parsed.proposedReminder.time) {
        errors.push('Time is required for recurring reminders');
      }
      if (!parsed.proposedReminder.daysOfWeek || parsed.proposedReminder.daysOfWeek.length === 0) {
        errors.push('Days of week are required for recurring reminders');
      }
    } else {
      if (!parsed.proposedReminder.oneTimeDate) {
        errors.push('Date is required for one-time reminders');
      }
      // Validate date is not in the past
      const reminderDate = new Date(parsed.proposedReminder.oneTimeDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (reminderDate < today) {
        errors.push('Reminder date cannot be in the past');
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
