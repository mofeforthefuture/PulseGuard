/**
 * Doctor Visit Outcome Parser
 * Extracts follow-up timing, visit details, and outcomes from natural language
 */

export interface ParsedDoctorVisit {
  visitDate?: string; // ISO date string (YYYY-MM-DD)
  followUpTiming?: {
    amount: number;
    unit: 'days' | 'weeks' | 'months' | 'years';
    followUpDate?: string; // Calculated follow-up date
  };
  diagnosis?: string; // Only if explicitly stated
  treatment?: string; // Only if explicitly stated
  medicationChanges?: {
    action: 'added' | 'changed' | 'removed' | 'increased' | 'decreased';
    medication?: string;
    details?: string;
  }[]; // Only if explicitly mentioned
  notes?: string;
  visitType?: 'appointment' | 'follow_up' | 'consultation' | 'emergency';
  confidence: number; // 0-1
}

/**
 * Parse time phrases to days
 */
function parseTimeToDays(amount: number, unit: string): number {
  const normalizedUnit = unit.toLowerCase().replace(/s$/, ''); // Remove plural
  
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
 * Parse follow-up timing from text
 * Handles: "3 months", "two weeks", "in 6 weeks", "come back in 1 month"
 */
function parseFollowUpTiming(text: string, baseDate: Date = new Date()): {
  amount: number;
  unit: 'days' | 'weeks' | 'months' | 'years';
  followUpDate: string;
} | null {
  const lowerText = text.toLowerCase();
  
  // Number words
  const numberWords: Record<string, number> = {
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'eleven': 11, 'twelve': 12,
  };
  
  // Patterns for follow-up timing
  const patterns = [
    // "come back in 3 months"
    /(?:come back|return|follow.?up|next appointment).*?in\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+(day|days|week|weeks|month|months|year|years)/i,
    // "3 months" or "two weeks"
    /(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+(day|days|week|weeks|month|months|year|years)/i,
    // "in 3 months"
    /in\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+(day|days|week|weeks|month|months|year|years)/i,
  ];
  
  for (const pattern of patterns) {
    const match = lowerText.match(pattern);
    if (match) {
      const amountStr = match[1];
      const unit = match[2];
      
      // Convert number word to number
      const amount = numberWords[amountStr.toLowerCase()] || parseInt(amountStr, 10);
      
      if (amount > 0) {
        const days = parseTimeToDays(amount, unit);
        const followUpDate = new Date(baseDate);
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
 * Extract medication changes (only if explicitly stated)
 */
function extractMedicationChanges(text: string): ParsedDoctorVisit['medicationChanges'] {
  const lowerText = text.toLowerCase();
  const changes: ParsedDoctorVisit['medicationChanges'] = [];
  
  // Patterns for medication changes
  const changePatterns = [
    // "changed medication" or "switched to X"
    /(?:changed|switched|switched to|now taking|prescribed|added|increased|decreased|stopped|removed)\s+(?:medication|med|medicine|pill|drug)?\s*(?:to|:)?\s*([^.,!?]+)/i,
    // "medication changed to X"
    /medication\s+(?:changed|switched|is now)\s+(?:to|:)?\s*([^.,!?]+)/i,
  ];
  
  for (const pattern of changePatterns) {
    const match = text.match(pattern);
    if (match) {
      const medication = match[1].trim();
      
      // Determine action
      let action: 'added' | 'changed' | 'removed' | 'increased' | 'decreased' = 'changed';
      if (lowerText.includes('added') || lowerText.includes('prescribed') || lowerText.includes('new')) {
        action = 'added';
      } else if (lowerText.includes('stopped') || lowerText.includes('removed') || lowerText.includes('discontinued')) {
        action = 'removed';
      } else if (lowerText.includes('increased')) {
        action = 'increased';
      } else if (lowerText.includes('decreased') || lowerText.includes('reduced')) {
        action = 'decreased';
      }
      
      changes.push({
        action,
        medication,
        details: match[0],
      });
    }
  }
  
  return changes.length > 0 ? changes : undefined;
}

/**
 * Parse doctor visit outcome from natural language
 */
export function parseDoctorVisitOutcome(text: string, visitDate?: string): ParsedDoctorVisit {
  const lowerText = text.toLowerCase();
  const baseDate = visitDate ? new Date(visitDate) : new Date();
  
  const result: ParsedDoctorVisit = {
    confidence: 0.8,
  };
  
  // Extract visit date if mentioned
  const datePatterns = [
    /(?:visit|appointment|went|saw).*?(?:on|was|is)\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /(\d{4}-\d{2}-\d{2})/, // ISO format
  ];
  
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        const date = new Date(match[1]);
        if (!isNaN(date.getTime())) {
          result.visitDate = date.toISOString().split('T')[0];
          break;
        }
      } catch (e) {
        // Invalid date, continue
      }
    }
  }
  
  // Use provided visit date or default to today
  if (!result.visitDate) {
    result.visitDate = visitDate || new Date().toISOString().split('T')[0];
  }
  
  // Extract follow-up timing
  const followUp = parseFollowUpTiming(text, baseDate);
  if (followUp) {
    result.followUpTiming = followUp;
    result.confidence = 0.9; // Higher confidence if follow-up is clear
  }
  
  // Extract diagnosis (only if explicitly stated)
  const diagnosisPatterns = [
    /(?:diagnosis|diagnosed|found|discovered).*?is\s+([^.,!?]+)/i,
    /(?:diagnosis|diagnosed).*?:?\s*([^.,!?]+)/i,
  ];
  
  for (const pattern of diagnosisPatterns) {
    const match = text.match(pattern);
    if (match && !match[1].toLowerCase().includes('nothing') && !match[1].toLowerCase().includes('normal')) {
      result.diagnosis = match[1].trim();
      break;
    }
  }
  
  // Extract treatment (only if explicitly stated)
  const treatmentPatterns = [
    /(?:treatment|treated|prescribed|recommended).*?:?\s*([^.,!?]+)/i,
    /(?:will|going to|plan to).*?(?:treat|do|give)\s+([^.,!?]+)/i,
  ];
  
  for (const pattern of treatmentPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.treatment = match[1].trim();
      break;
    }
  }
  
  // Extract medication changes (only if explicitly mentioned)
  const medicationChanges = extractMedicationChanges(text);
  if (medicationChanges) {
    result.medicationChanges = medicationChanges;
  }
  
  // Determine visit type
  if (lowerText.includes('emergency') || lowerText.includes('urgent')) {
    result.visitType = 'emergency';
  } else if (lowerText.includes('follow') || lowerText.includes('follow-up')) {
    result.visitType = 'follow_up';
  } else if (lowerText.includes('consultation')) {
    result.visitType = 'consultation';
  } else {
    result.visitType = 'appointment';
  }
  
  // Extract general notes
  const notesParts: string[] = [];
  if (result.diagnosis) notesParts.push(`Diagnosis: ${result.diagnosis}`);
  if (result.treatment) notesParts.push(`Treatment: ${result.treatment}`);
  if (result.medicationChanges) {
    const medNotes = result.medicationChanges.map(m => 
      `${m.action} ${m.medication || 'medication'}`
    ).join(', ');
    notesParts.push(`Medication changes: ${medNotes}`);
  }
  
  if (notesParts.length > 0) {
    result.notes = notesParts.join('. ');
  }
  
  return result;
}

/**
 * Validate parsed doctor visit
 */
export function validateDoctorVisit(parsed: ParsedDoctorVisit): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!parsed.visitDate) {
    errors.push('Visit date is required');
  }
  
  if (parsed.followUpTiming) {
    if (parsed.followUpTiming.amount <= 0) {
      errors.push('Follow-up timing amount must be positive');
    }
    if (!parsed.followUpTiming.followUpDate) {
      errors.push('Follow-up date could not be calculated');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
