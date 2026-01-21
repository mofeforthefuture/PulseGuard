/**
 * Hydration Natural Language Parser
 * Converts phrases like "two bottles", "500ml", "a cup" to milliliters
 */

export interface ParsedHydration {
  amount: number; // in milliliters
  notes?: string;
  confidence: number; // 0-1, how confident we are in the extraction
}

/**
 * Common hydration amounts in milliliters
 */
const HYDRATION_AMOUNTS: Record<string, number> = {
  // Cups and glasses
  'cup': 250,
  'cups': 250,
  'glass': 250,
  'glasses': 250,
  'mug': 350,
  'mugs': 350,
  
  // Bottles
  'bottle': 500,
  'bottles': 500,
  'water bottle': 500,
  'water bottles': 500,
  'small bottle': 330,
  'small bottles': 330,
  'large bottle': 750,
  'large bottles': 750,
  
  // Containers
  'liter': 1000,
  'liters': 1000,
  'litre': 1000,
  'litres': 1000,
  'l': 1000,
  'gallon': 3785,
  'gallons': 3785,
  
  // Common sizes
  'shot': 30,
  'shots': 30,
  'sip': 50,
  'sips': 50,
  'gulp': 100,
  'gulps': 100,
};

/**
 * Number words to numbers
 */
const NUMBER_WORDS: Record<string, number> = {
  'zero': 0,
  'one': 1,
  'two': 2,
  'three': 3,
  'four': 4,
  'five': 5,
  'six': 6,
  'seven': 7,
  'eight': 8,
  'nine': 9,
  'ten': 10,
  'eleven': 11,
  'twelve': 12,
  'thirteen': 13,
  'fourteen': 14,
  'fifteen': 15,
  'sixteen': 16,
  'seventeen': 17,
  'eighteen': 18,
  'nineteen': 19,
  'twenty': 20,
  'thirty': 30,
  'forty': 40,
  'fifty': 50,
  'sixty': 60,
  'seventy': 70,
  'eighty': 80,
  'ninety': 90,
  'hundred': 100,
  'a': 1,
  'an': 1,
};

/**
 * Parse hydration amount from natural language
 * Handles formats like:
 * - "500ml" or "500 ml"
 * - "two bottles"
 * - "a cup"
 * - "1.5 liters"
 * - "half a bottle"
 */
export function parseHydrationFromText(text: string): ParsedHydration | null {
  const lowerText = text.toLowerCase().trim();
  
  // Pattern 1: Direct ml/liter amounts (e.g., "500ml", "1.5L", "2 liters")
  const mlPattern = /(\d+\.?\d*)\s*(ml|milliliter|milliliters|millilitre|millilitres)/i;
  const literPattern = /(\d+\.?\d*)\s*(l|liter|liters|litre|litres)/i;
  
  let match = lowerText.match(mlPattern);
  if (match) {
    const amount = parseFloat(match[1]);
    if (amount > 0 && amount <= 10000) {
      return {
        amount: Math.round(amount),
        confidence: 0.95,
      };
    }
  }
  
  match = lowerText.match(literPattern);
  if (match) {
    const liters = parseFloat(match[1]);
    if (liters > 0 && liters <= 10) {
      return {
        amount: Math.round(liters * 1000),
        confidence: 0.95,
      };
    }
  }
  
  // Pattern 2: Number + unit (e.g., "two bottles", "3 cups", "a glass")
  const words = lowerText.split(/\s+/);
  
  // Find number (word or digit)
  let quantity = 1;
  let unitIndex = -1;
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i].replace(/[^a-z]/g, ''); // Remove punctuation
    
    // Check if it's a number word
    if (NUMBER_WORDS[word] !== undefined) {
      quantity = NUMBER_WORDS[word];
      // Look for unit in next few words
      for (let j = i + 1; j < Math.min(i + 4, words.length); j++) {
        const nextWord = words[j].replace(/[^a-z]/g, '');
        if (HYDRATION_AMOUNTS[nextWord] !== undefined) {
          unitIndex = j;
          break;
        }
      }
      if (unitIndex >= 0) break;
    }
    
    // Check if it's a digit
    const digitMatch = words[i].match(/^(\d+\.?\d*)$/);
    if (digitMatch) {
      quantity = parseFloat(digitMatch[1]);
      // Look for unit in next few words
      for (let j = i + 1; j < Math.min(i + 4, words.length); j++) {
        const nextWord = words[j].replace(/[^a-z]/g, '');
        if (HYDRATION_AMOUNTS[nextWord] !== undefined) {
          unitIndex = j;
          break;
        }
      }
      if (unitIndex >= 0) break;
    }
  }
  
  // If no number found, check for "a/an" + unit
  if (unitIndex === -1) {
    for (let i = 0; i < words.length; i++) {
      const word = words[i].replace(/[^a-z]/g, '');
      if ((word === 'a' || word === 'an') && i + 1 < words.length) {
        const nextWord = words[i + 1].replace(/[^a-z]/g, '');
        if (HYDRATION_AMOUNTS[nextWord] !== undefined) {
          quantity = 1;
          unitIndex = i + 1;
          break;
        }
      }
    }
  }
  
  // If still no unit found, check for standalone units
  if (unitIndex === -1) {
    for (let i = 0; i < words.length; i++) {
      const word = words[i].replace(/[^a-z]/g, '');
      if (HYDRATION_AMOUNTS[word] !== undefined) {
        unitIndex = i;
        break;
      }
    }
  }
  
  if (unitIndex >= 0) {
    const unitWord = words[unitIndex].replace(/[^a-z]/g, '');
    const unitAmount = HYDRATION_AMOUNTS[unitWord];
    
    if (unitAmount) {
      // Handle fractions (e.g., "half a bottle", "quarter cup")
      if (lowerText.includes('half')) {
        quantity = quantity * 0.5;
      } else if (lowerText.includes('quarter')) {
        quantity = quantity * 0.25;
      } else if (lowerText.includes('third')) {
        quantity = quantity * (1/3);
      } else if (lowerText.includes('three quarter') || lowerText.includes('three-quarters')) {
        quantity = quantity * 0.75;
      }
      
      const totalAmount = Math.round(quantity * unitAmount);
      
      if (totalAmount > 0 && totalAmount <= 10000) {
        // Extract notes (context around the hydration mention)
        let notes: string | undefined;
        const contextMatch = text.match(/(?:with|after|before|during|this morning|this evening|just now|recently)[^.!?]*/i);
        if (contextMatch) {
          notes = contextMatch[0].trim();
        }
        
        return {
          amount: totalAmount,
          notes,
          confidence: 0.85,
        };
      }
    }
  }
  
  // Pattern 3: Just a number (assume ml if reasonable)
  const justNumber = lowerText.match(/^(\d+\.?\d*)$/);
  if (justNumber) {
    const amount = parseFloat(justNumber[1]);
    if (amount >= 50 && amount <= 10000) {
      return {
        amount: Math.round(amount),
        confidence: 0.7, // Lower confidence - could be ml or something else
      };
    }
  }
  
  return null;
}

/**
 * Validate parsed hydration amount
 */
export function validateHydration(parsed: ParsedHydration): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (parsed.amount < 1) {
    errors.push('Amount must be at least 1ml');
  }
  if (parsed.amount > 10000) {
    errors.push('Amount cannot exceed 10000ml (10L)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
