/**
 * Blood Pressure Natural Language Parser
 * Extracts systolic, diastolic, and optional values from user messages
 */

export interface ParsedBloodPressure {
  systolic: number;
  diastolic: number;
  pulse?: number;
  position?: 'sitting' | 'standing' | 'lying' | 'other';
  notes?: string;
  confidence: number; // 0-1, how confident we are in the extraction
}

/**
 * Parse blood pressure from natural language
 * Handles formats like:
 * - "120/80"
 * - "120 over 80"
 * - "systolic 120 diastolic 80"
 * - "BP is 140/90"
 * - "my blood pressure is 120/80"
 */
export function parseBloodPressureFromText(text: string): ParsedBloodPressure | null {
  const lowerText = text.toLowerCase();
  
  // Common patterns
  const patterns = [
    // "120/80" or "120/ 80" or "120 /80"
    /(\d{2,3})\s*\/\s*(\d{2,3})/,
    // "120 over 80" or "120 over 80"
    /(\d{2,3})\s+over\s+(\d{2,3})/,
    // "systolic 120 diastolic 80" or "sys 120 dia 80"
    /(?:systolic|sys)\s*:?\s*(\d{2,3}).*?(?:diastolic|dia)\s*:?\s*(\d{2,3})/i,
    // "diastolic 80 systolic 120" (reversed)
    /(?:diastolic|dia)\s*:?\s*(\d{2,3}).*?(?:systolic|sys)\s*:?\s*(\d{2,3})/i,
  ];

  let systolic: number | null = null;
  let diastolic: number | null = null;
  let match: RegExpMatchArray | null = null;

  // Try each pattern
  for (const pattern of patterns) {
    match = lowerText.match(pattern);
    if (match) {
      const first = parseInt(match[1], 10);
      const second = parseInt(match[2], 10);
      
      // Determine which is systolic and which is diastolic
      // Systolic is typically higher (but not always, so we check ranges)
      if (first > second && first <= 300 && second <= 200) {
        systolic = first;
        diastolic = second;
      } else if (second > first && second <= 300 && first <= 200) {
        // Might be reversed, but if first is in diastolic range, assume it's correct
        if (first >= 40 && first <= 200 && second >= 60 && second <= 300) {
          systolic = second;
          diastolic = first;
        } else {
          systolic = first;
          diastolic = second;
        }
      } else {
        // Both in valid ranges, assume first is systolic
        if (first >= 60 && first <= 300 && second >= 40 && second <= 200) {
          systolic = first;
          diastolic = second;
        }
      }
      
      if (systolic && diastolic) break;
    }
  }

  if (!systolic || !diastolic) {
    return null;
  }

  // Validate ranges
  if (systolic < 1 || systolic > 300 || diastolic < 1 || diastolic > 200) {
    return null;
  }

  // Validate diastolic < systolic (with some tolerance for measurement errors)
  if (diastolic >= systolic) {
    // This might be a measurement error, but we'll flag it
    // Still return it but with lower confidence
    if (diastolic - systolic > 10) {
      // Too much difference, likely reversed
      return null;
    }
  }

  // Extract pulse if mentioned
  let pulse: number | undefined;
  const pulsePatterns = [
    /(?:pulse|heart rate|hr|bpm)\s*:?\s*(\d{2,3})/i,
    /(\d{2,3})\s*(?:bpm|beats)/i,
  ];
  for (const pattern of pulsePatterns) {
    const pulseMatch = lowerText.match(pattern);
    if (pulseMatch) {
      const pulseValue = parseInt(pulseMatch[1], 10);
      if (pulseValue >= 40 && pulseValue <= 200) {
        pulse = pulseValue;
        break;
      }
    }
  }

  // Extract position
  let position: 'sitting' | 'standing' | 'lying' | 'other' | undefined;
  if (lowerText.includes('sitting')) {
    position = 'sitting';
  } else if (lowerText.includes('standing')) {
    position = 'standing';
  } else if (lowerText.includes('lying') || lowerText.includes('laying')) {
    position = 'lying';
  }

  // Extract notes (context around the BP reading)
  let notes: string | undefined;
  const contextMatch = text.match(/(?:after|before|during|this morning|this evening|just now|recently)[^.!?]*/i);
  if (contextMatch) {
    notes = contextMatch[0].trim();
  }

  // Calculate confidence based on how clear the extraction was
  let confidence = 0.9;
  if (diastolic >= systolic) {
    confidence = 0.6; // Lower confidence if diastolic >= systolic
  }
  if (!match) {
    confidence = 0.5; // Lower confidence if pattern matching was unclear
  }

  return {
    systolic,
    diastolic,
    pulse,
    position,
    notes,
    confidence,
  };
}

/**
 * Validate parsed blood pressure values
 */
export function validateBloodPressure(parsed: ParsedBloodPressure): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (parsed.systolic < 1 || parsed.systolic > 300) {
    errors.push(`Systolic value ${parsed.systolic} is out of valid range (1-300)`);
  }
  if (parsed.diastolic < 1 || parsed.diastolic > 200) {
    errors.push(`Diastolic value ${parsed.diastolic} is out of valid range (1-200)`);
  }
  if (parsed.diastolic >= parsed.systolic) {
    errors.push(`Diastolic (${parsed.diastolic}) should be less than systolic (${parsed.systolic})`);
  }
  if (parsed.pulse !== undefined) {
    if (parsed.pulse < 40 || parsed.pulse > 200) {
      errors.push(`Pulse value ${parsed.pulse} is out of valid range (40-200)`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
