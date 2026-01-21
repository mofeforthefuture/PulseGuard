/**
 * Centralized metadata injection for AI requests
 * Automatically provides current datetime, timezone, and extensible metadata
 * to all OpenRouter API calls
 */

export interface RequestMetadata {
  datetime: string; // ISO 8601 format
  timezone: string; // IANA timezone identifier
  timezoneOffset: string; // UTC offset (e.g., "+01:00")
  dayOfWeek: string; // Full day name (e.g., "Monday")
  date: string; // YYYY-MM-DD format
  time: string; // HH:MM:SS format (24-hour)
  timestamp: number; // Unix timestamp in milliseconds
  // Extensible for future metadata
  [key: string]: string | number | undefined;
}

/**
 * Get current datetime and timezone information
 * Uses Africa/Lagos timezone (UTC+1) as specified
 */
export function getRequestMetadata(): RequestMetadata {
  const now = new Date();
  
  // Use Africa/Lagos timezone (UTC+1)
  const timezone = 'Africa/Lagos';
  
  // Format date in Africa/Lagos timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  
  const parts = formatter.formatToParts(now);
  const year = parts.find(p => p.type === 'year')?.value || '';
  const month = parts.find(p => p.type === 'month')?.value || '';
  const day = parts.find(p => p.type === 'day')?.value || '';
  const hour = parts.find(p => p.type === 'hour')?.value || '';
  const minute = parts.find(p => p.type === 'minute')?.value || '';
  const second = parts.find(p => p.type === 'second')?.value || '';
  
  // ISO 8601 datetime string with timezone
  const isoDateTime = `${year}-${month}-${day}T${hour}:${minute}:${second}+01:00`;
  
  // Get day of week
  const dayOfWeekFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
  });
  const dayOfWeek = dayOfWeekFormatter.format(now);
  
  // Get UTC offset for the timezone
  // For Africa/Lagos, this is always UTC+1 (no daylight saving time)
  // This can be extended to calculate dynamically for other timezones if needed
  const timezoneOffset = '+01:00'; // Africa/Lagos is UTC+1
  
  return {
    datetime: isoDateTime,
    timezone,
    timezoneOffset,
    dayOfWeek,
    date: `${year}-${month}-${day}`,
    time: `${hour}:${minute}:${second}`,
    timestamp: now.getTime(),
  };
}

/**
 * Format metadata as a system context string for injection into AI prompts
 * This ensures the model always knows the current date and time
 */
export function formatMetadataContext(metadata?: RequestMetadata): string {
  const meta = metadata || getRequestMetadata();
  
  return `CURRENT CONTEXT:
- Current Date & Time: ${meta.datetime} (${meta.timezone}, ${meta.timezoneOffset})
- Date: ${meta.date} (${meta.dayOfWeek})
- Time: ${meta.time}
- Timestamp: ${meta.timestamp}

IMPORTANT: Use this exact date and time information. Do NOT guess or infer the date. This is the current moment in the user's timezone.`;
}

/**
 * Enhanced metadata with additional context
 * Extensible for future metadata additions
 */
export function getEnhancedMetadata(additionalMetadata?: Record<string, string | number>): RequestMetadata {
  const baseMetadata = getRequestMetadata();
  
  return {
    ...baseMetadata,
    ...additionalMetadata,
  };
}
