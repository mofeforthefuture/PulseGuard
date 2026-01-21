/**
 * Recommendation Parser Service
 * Parses doctor recommendations (e.g., "Return in 2 weeks") and converts to dates
 */

/**
 * Parse a recommendation text and calculate the reminder date
 * Supports formats like:
 * - "Return in 2 weeks"
 * - "Come back in 1 month"
 * - "Follow up in 3 months"
 * - "See you in 2 weeks"
 * - "Return in 14 days"
 */
export function parseRecommendationToDate(recommendation: string, baseDate?: Date): Date | null {
  if (!recommendation || recommendation.trim().length === 0) {
    return null;
  }

  const text = recommendation.toLowerCase().trim();
  const startDate = baseDate || new Date();

  // Patterns to match:
  // - "in X days/weeks/months"
  // - "X days/weeks/months"
  // - "after X days/weeks/months"

  // Extract number and unit
  const patterns = [
    // "in X days"
    /in\s+(\d+)\s+days?/i,
    // "X days"
    /^(\d+)\s+days?$/i,
    // "after X days"
    /after\s+(\d+)\s+days?/i,
    // "in X weeks"
    /in\s+(\d+)\s+weeks?/i,
    // "X weeks"
    /^(\d+)\s+weeks?$/i,
    // "after X weeks"
    /after\s+(\d+)\s+weeks?/i,
    // "in X months"
    /in\s+(\d+)\s+months?/i,
    // "X months"
    /^(\d+)\s+months?$/i,
    // "after X months"
    /after\s+(\d+)\s+months?/i,
    // "in X years"
    /in\s+(\d+)\s+years?/i,
    // "X years"
    /^(\d+)\s+years?$/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const number = parseInt(match[1], 10);
      if (isNaN(number) || number <= 0) {
        continue;
      }

      const resultDate = new Date(startDate);

      if (pattern.source.includes('days?')) {
        resultDate.setDate(resultDate.getDate() + number);
        return resultDate;
      } else if (pattern.source.includes('weeks?')) {
        resultDate.setDate(resultDate.getDate() + (number * 7));
        return resultDate;
      } else if (pattern.source.includes('months?')) {
        resultDate.setMonth(resultDate.getMonth() + number);
        return resultDate;
      } else if (pattern.source.includes('years?')) {
        resultDate.setFullYear(resultDate.getFullYear() + number);
        return resultDate;
      }
    }
  }

  // If no pattern matches, return null
  return null;
}

/**
 * Format a recommendation for display
 */
export function formatRecommendation(recommendation: string): string {
  if (!recommendation) return '';
  
  // Capitalize first letter
  return recommendation.charAt(0).toUpperCase() + recommendation.slice(1);
}

/**
 * Get a human-readable description of the parsed date
 */
export function getDateDescription(date: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `Overdue by ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'day' : 'days'}`;
  } else if (diffDays === 0) {
    return 'Due today';
  } else if (diffDays === 1) {
    return 'Due tomorrow';
  } else if (diffDays <= 7) {
    return `Due in ${diffDays} days`;
  } else if (diffDays <= 30) {
    const weeks = Math.floor(diffDays / 7);
    return `Due in ${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
  } else {
    const months = Math.floor(diffDays / 30);
    return `Due in ${months} ${months === 1 ? 'month' : 'months'}`;
  }
}
