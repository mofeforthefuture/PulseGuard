/**
 * Natural Language Reminder Parser
 * Parses phrases like "in 2 weeks", "every 3 months", "tomorrow at 9am"
 * Converts to concrete dates using system time
 */

export interface ParsedReminder {
  title: string;
  description?: string;
  reminderType: 'medication' | 'check_in' | 'appointment' | 'other';
  isRecurring: boolean;
  // For one-time reminders
  oneTimeDate?: string; // ISO date string (YYYY-MM-DD)
  // For recurring reminders
  time?: string; // HH:MM format (24-hour)
  daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
  // For recurring with interval
  interval?: {
    amount: number;
    unit: 'days' | 'weeks' | 'months';
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
  'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
  'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60,
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
 * Extract time from text (e.g., "9am", "2:30pm", "14:00")
 */
function extractTime(text: string): string | null {
  const lowerText = text.toLowerCase();
  
  // Patterns for time extraction
  const patterns = [
    // "9am" or "9 am" or "9:00am"
    /(\d{1,2}):?(\d{2})?\s*(am|pm)/i,
    // "14:00" or "14:30" (24-hour)
    /(\d{1,2}):(\d{2})\b/,
    // "at 9" or "at 9 o'clock"
    /at\s+(\d{1,2})(?:\s*o'?clock)?/i,
  ];
  
  for (const pattern of patterns) {
    const match = lowerText.match(pattern);
    if (match) {
      let hour = parseInt(match[1], 10);
      const minutes = match[2] ? parseInt(match[2], 10) : 0;
      const ampm = match[3]?.toLowerCase();
      
      // Handle AM/PM
      if (ampm === 'pm' && hour !== 12) {
        hour += 12;
      } else if (ampm === 'am' && hour === 12) {
        hour = 0;
      }
      
      // Validate
      if (hour >= 0 && hour <= 23 && minutes >= 0 && minutes <= 59) {
        return `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
    }
  }
  
  return null;
}

/**
 * Parse one-time reminder (e.g., "in 2 weeks", "tomorrow", "next Monday")
 */
function parseOneTimeReminder(text: string, currentDate: Date): {
  date: string;
  time?: string;
} | null {
  const lowerText = text.toLowerCase();
  const result: { date?: string; time?: string } = {};
  
  // Extract time first
  const extractedTime = extractTime(text);
  if (extractedTime) {
    result.time = extractedTime;
  }
  
  // "tomorrow"
  if (lowerText.includes('tomorrow')) {
    const tomorrow = new Date(currentDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    result.date = tomorrow.toISOString().split('T')[0];
    return result as { date: string; time?: string };
  }
  
  // "today"
  if (lowerText.includes('today')) {
    result.date = currentDate.toISOString().split('T')[0];
    return result as { date: string; time?: string };
  }
  
  // "in X days/weeks/months"
  const inPattern = /in\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+(day|days|week|weeks|month|months|year|years)/i;
  const inMatch = lowerText.match(inPattern);
  if (inMatch) {
    const amountStr = inMatch[1];
    const unit = inMatch[2];
    const amount = NUMBER_WORDS[amountStr.toLowerCase()] || parseInt(amountStr, 10);
    
    if (amount > 0) {
      const days = parseTimeToDays(amount, unit);
      const futureDate = new Date(currentDate);
      futureDate.setDate(futureDate.getDate() + days);
      result.date = futureDate.toISOString().split('T')[0];
      return result as { date: string; time?: string };
    }
  }
  
  // "next Monday/Tuesday/etc"
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (let i = 0; i < dayNames.length; i++) {
    if (lowerText.includes(`next ${dayNames[i]}`) || lowerText.includes(`on ${dayNames[i]}`)) {
      const targetDay = i;
      const currentDay = currentDate.getDay();
      let daysUntil = (targetDay - currentDay + 7) % 7;
      if (daysUntil === 0) daysUntil = 7; // Next week if today
      
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + daysUntil);
      result.date = nextDate.toISOString().split('T')[0];
      return result as { date: string; time?: string };
    }
  }
  
  // Specific date patterns (e.g., "January 15", "1/15/2024")
  const datePatterns = [
    /(\d{1,2})[\/\-](\d{1,2})[\/\-]?(\d{2,4})?/, // MM/DD/YYYY
    /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:,?\s+(\d{4}))?/i,
  ];
  
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        const date = new Date(match[0]);
        if (!isNaN(date.getTime())) {
          result.date = date.toISOString().split('T')[0];
          return result as { date: string; time?: string };
        }
      } catch (e) {
        // Invalid date, continue
      }
    }
  }
  
  return null;
}

/**
 * Parse recurring reminder (e.g., "every day", "every 3 months", "daily at 9am")
 */
function parseRecurringReminder(text: string): {
  time?: string;
  daysOfWeek?: number[];
  interval?: { amount: number; unit: 'days' | 'weeks' | 'months' };
} | null {
  const lowerText = text.toLowerCase();
  const result: any = {};
  
  // Extract time
  const extractedTime = extractTime(text);
  if (extractedTime) {
    result.time = extractedTime;
  }
  
  // "every day" or "daily"
  if (lowerText.includes('every day') || lowerText.includes('daily')) {
    result.daysOfWeek = [0, 1, 2, 3, 4, 5, 6]; // All days
    return result;
  }
  
  // "every weekday" or "weekdays"
  if (lowerText.includes('weekday') || lowerText.includes('weekdays')) {
    result.daysOfWeek = [1, 2, 3, 4, 5]; // Monday-Friday
    return result;
  }
  
  // "every weekend"
  if (lowerText.includes('weekend')) {
    result.daysOfWeek = [0, 6]; // Saturday-Sunday
    return result;
  }
  
  // "every Monday/Tuesday/etc"
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const days: number[] = [];
  for (let i = 0; i < dayNames.length; i++) {
    if (lowerText.includes(dayNames[i])) {
      days.push(i);
    }
  }
  if (days.length > 0) {
    result.daysOfWeek = days;
    return result;
  }
  
  // "every X days/weeks/months"
  const everyPattern = /every\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+(day|days|week|weeks|month|months|year|years)/i;
  const everyMatch = lowerText.match(everyPattern);
  if (everyMatch) {
    const amountStr = everyMatch[1];
    const unit = everyMatch[2];
    const amount = NUMBER_WORDS[amountStr.toLowerCase()] || parseInt(amountStr, 10);
    
    if (amount > 0) {
      const normalizedUnit = unit.toLowerCase().replace(/s$/, '');
      if (['day', 'week', 'month'].includes(normalizedUnit)) {
        result.interval = {
          amount,
          unit: normalizedUnit as 'days' | 'weeks' | 'months',
        };
        // For interval-based reminders, default to all days
        result.daysOfWeek = [0, 1, 2, 3, 4, 5, 6];
        return result;
      }
    }
  }
  
  return null;
}

/**
 * Determine reminder type from context
 */
function determineReminderType(text: string): 'medication' | 'check_in' | 'appointment' | 'other' {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('medication') || lowerText.includes('medicine') || lowerText.includes('pill') || lowerText.includes('drug')) {
    return 'medication';
  }
  if (lowerText.includes('check') || lowerText.includes('check-in') || lowerText.includes('checkin')) {
    return 'check_in';
  }
  if (lowerText.includes('appointment') || lowerText.includes('doctor') || lowerText.includes('visit')) {
    return 'appointment';
  }
  
  return 'other';
}

/**
 * Extract title from reminder text
 */
function extractTitle(text: string, reminderType: string): string {
  const lowerText = text.toLowerCase();
  
  // Try to extract the main action
  const actionPatterns = [
    /(?:remind me to|remind me|remember to|don't forget to)\s+(.+?)(?:\s+(?:in|every|at|on)|$)/i,
    /(.+?)\s+(?:in|every|at|on)\s+/i,
  ];
  
  for (const pattern of actionPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const title = match[1].trim();
      if (title.length > 0 && title.length < 100) {
        return title;
      }
    }
  }
  
  // Default titles based on type
  const defaultTitles: Record<string, string> = {
    medication: 'Take medication',
    check_in: 'Daily check-in',
    appointment: 'Appointment reminder',
    other: 'Reminder',
  };
  
  return defaultTitles[reminderType] || 'Reminder';
}

/**
 * Parse natural language reminder
 */
export function parseReminder(text: string, currentDate: Date = new Date()): ParsedReminder | null {
  const lowerText = text.toLowerCase();
  
  // Determine if it's recurring or one-time
  const isRecurring = lowerText.includes('every') || 
                      lowerText.includes('daily') || 
                      lowerText.includes('weekly') ||
                      lowerText.includes('monthly');
  
  const reminderType = determineReminderType(text);
  const title = extractTitle(text, reminderType);
  
  if (isRecurring) {
    const recurring = parseRecurringReminder(text);
    if (recurring) {
      return {
        title,
        reminderType,
        isRecurring: true,
        time: recurring.time || '09:00', // Default to 9 AM
        daysOfWeek: recurring.daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
        interval: recurring.interval,
        confidence: 0.85,
      };
    }
  } else {
    const oneTime = parseOneTimeReminder(text, currentDate);
    if (oneTime) {
      return {
        title,
        reminderType,
        isRecurring: false,
        oneTimeDate: oneTime.date,
        time: oneTime.time || '09:00', // Default to 9 AM
        confidence: 0.9,
      };
    }
  }
  
  // If we can't parse, return null
  return null;
}

/**
 * Validate parsed reminder
 */
export function validateReminder(parsed: ParsedReminder): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!parsed.title || parsed.title.length === 0) {
    errors.push('Title is required');
  }
  
  if (parsed.isRecurring) {
    if (!parsed.time) {
      errors.push('Time is required for recurring reminders');
    }
    if (!parsed.daysOfWeek || parsed.daysOfWeek.length === 0) {
      errors.push('Days of week are required for recurring reminders');
    }
  } else {
    if (!parsed.oneTimeDate) {
      errors.push('Date is required for one-time reminders');
    }
    // Validate date is not in the past
    const reminderDate = new Date(parsed.oneTimeDate!);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (reminderDate < today) {
      errors.push('Reminder date cannot be in the past');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
