/**
 * OpenRouter-Compatible Tool Schemas
 * 
 * These schemas follow OpenAI's function calling format, which is compatible
 * with OpenRouter API. Each tool is defined with:
 * - Clear description
 * - Required and optional parameters
 * - Validation rules
 * - Example tool call JSON
 * 
 * Format: OpenAI Function Calling (OpenRouter compatible)
 */

export interface OpenRouterTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, any>;
      required: string[];
    };
  };
}

/**
 * Tool: log_blood_pressure
 * Log a blood pressure reading with systolic, diastolic, and optional pulse
 */
export const log_blood_pressure: OpenRouterTool = {
  type: 'function',
  function: {
    name: 'log_blood_pressure',
    description: 'Log a blood pressure reading. Use when user reports or measures their blood pressure. Validates readings and flags abnormal values automatically.',
    parameters: {
      type: 'object',
      properties: {
        systolic: {
          type: 'integer',
          description: 'Systolic blood pressure (top number). Must be between 1 and 300.',
          minimum: 1,
          maximum: 300,
        },
        diastolic: {
          type: 'integer',
          description: 'Diastolic blood pressure (bottom number). Must be between 1 and 200, and must be less than systolic.',
          minimum: 1,
          maximum: 200,
        },
        pulse: {
          type: 'integer',
          description: 'Optional pulse/heart rate reading in beats per minute. Typically between 40-200.',
          minimum: 40,
          maximum: 200,
        },
        position: {
          type: 'string',
          description: 'Position during measurement',
          enum: ['sitting', 'standing', 'lying', 'other'],
        },
        notes: {
          type: 'string',
          description: 'Optional notes about the reading (e.g., "after exercise", "morning reading")',
          maxLength: 500,
        },
      },
      required: ['systolic', 'diastolic'],
    },
  },
};

/**
 * Example tool call for log_blood_pressure:
 * {
 *   "name": "log_blood_pressure",
 *   "arguments": {
 *     "systolic": 120,
 *     "diastolic": 80,
 *     "pulse": 72,
 *     "position": "sitting",
 *     "notes": "Morning reading before breakfast"
 *   }
 * }
 */

/**
 * Tool: log_hydration
 * Log water/hydration intake in milliliters
 */
export const log_hydration: OpenRouterTool = {
  type: 'function',
  function: {
    name: 'log_hydration',
    description: 'Log water or hydration intake. Use when user mentions drinking water or other hydrating beverages. Amount is in milliliters (ml).',
    parameters: {
      type: 'object',
      properties: {
        amount: {
          type: 'integer',
          description: 'Amount of water/hydration consumed in milliliters (ml). Common values: 250ml (glass), 500ml (bottle), 1000ml (liter).',
          minimum: 1,
          maximum: 10000,
        },
        notes: {
          type: 'string',
          description: 'Optional notes (e.g., "with breakfast", "after workout", "lemon water")',
          maxLength: 200,
        },
      },
      required: ['amount'],
    },
  },
};

/**
 * Example tool call for log_hydration:
 * {
 *   "name": "log_hydration",
 *   "arguments": {
 *     "amount": 500,
 *     "notes": "Morning water bottle"
 *   }
 * }
 */

/**
 * Tool: schedule_reminder
 * Create a recurring reminder for medications, check-ins, or appointments
 */
export const schedule_reminder: OpenRouterTool = {
  type: 'function',
  function: {
    name: 'schedule_reminder',
    description: 'Create a recurring reminder. Use when user explicitly asks to be reminded about something (medication, check-in, appointment, etc.). Requires user confirmation before creating.',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Reminder title (e.g., "Take medication", "Daily check-in", "Doctor appointment")',
          minLength: 1,
          maxLength: 100,
        },
        time: {
          type: 'string',
          description: 'Time in 24-hour format (HH:MM). Example: "09:00" for 9 AM, "14:30" for 2:30 PM.',
          pattern: '^([0-1][0-9]|2[0-3]):[0-5][0-9]$',
        },
        days: {
          type: 'array',
          description: 'Days of week when reminder should trigger. 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday. Default is all days [0,1,2,3,4,5,6].',
          items: {
            type: 'integer',
            minimum: 0,
            maximum: 6,
          },
          minItems: 1,
          maxItems: 7,
        },
        reminder_type: {
          type: 'string',
          description: 'Type of reminder',
          enum: ['medication', 'check_in', 'appointment', 'other'],
        },
        description: {
          type: 'string',
          description: 'Optional detailed description of the reminder',
          maxLength: 500,
        },
      },
      required: ['title', 'time'],
    },
  },
};

/**
 * Example tool call for schedule_reminder:
 * {
 *   "name": "schedule_reminder",
 *   "arguments": {
 *     "title": "Take morning medication",
 *     "time": "09:00",
 *     "days": [1, 2, 3, 4, 5],
 *     "reminder_type": "medication",
 *     "description": "Take aspirin and vitamin D"
 *   }
 * }
 */

/**
 * Tool: log_doctor_visit
 * Log a visit to a doctor, clinic, or hospital
 */
export const log_doctor_visit: OpenRouterTool = {
  type: 'function',
  function: {
    name: 'log_doctor_visit',
    description: 'Log a visit to a healthcare provider (doctor, clinic, hospital). Use when user mentions visiting a healthcare provider. Requires user confirmation before logging.',
    parameters: {
      type: 'object',
      properties: {
        visit_type: {
          type: 'string',
          description: 'Type of visit',
          enum: ['appointment', 'emergency', 'follow_up', 'consultation'],
        },
        date: {
          type: 'string',
          description: 'Date of visit in ISO 8601 format (YYYY-MM-DD). Use current date if not specified.',
          pattern: '^\\d{4}-\\d{2}-\\d{2}$',
        },
        notes: {
          type: 'string',
          description: 'Optional notes about the visit (e.g., "Annual checkup", "Follow-up for blood pressure", "Emergency visit for chest pain")',
          maxLength: 1000,
        },
      },
      required: ['visit_type', 'date'],
    },
  },
};

/**
 * Example tool call for log_doctor_visit:
 * {
 *   "name": "log_doctor_visit",
 *   "arguments": {
 *     "visit_type": "appointment",
 *     "date": "2024-01-15",
 *     "notes": "Annual checkup with Dr. Smith"
 *   }
 * }
 */

/**
 * Tool: add_clinical_date
 * Add a clinical date (lab test, scan, procedure, follow-up, screening)
 */
export const add_clinical_date: OpenRouterTool = {
  type: 'function',
  function: {
    name: 'add_clinical_date',
    description: 'Add a clinical date for lab tests, scans, procedures, follow-ups, or screenings. Use when user mentions upcoming medical tests or procedures. Requires user confirmation.',
    parameters: {
      type: 'object',
      properties: {
        clinical_date: {
          type: 'string',
          description: 'Date and time of the clinical event in ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ or YYYY-MM-DD). If time not specified, defaults to 00:00:00.',
          pattern: '^(\\d{4}-\\d{2}-\\d{2})(T\\d{2}:\\d{2}:\\d{2}(Z|[+-]\\d{2}:\\d{2})?)?$',
        },
        description: {
          type: 'string',
          description: 'Description of the clinical date (e.g., "Blood test", "MRI scan", "Colonoscopy", "Follow-up appointment")',
          minLength: 1,
          maxLength: 200,
        },
        clinical_type: {
          type: 'string',
          description: 'Type of clinical event',
          enum: ['lab_test', 'scan', 'procedure', 'follow_up', 'screening', 'other'],
        },
        location: {
          type: 'string',
          description: 'Location where the clinical event will take place (e.g., "City Hospital", "LabCorp Main St")',
          maxLength: 200,
        },
        provider_name: {
          type: 'string',
          description: 'Name of the healthcare provider or facility',
          maxLength: 200,
        },
        preparation_notes: {
          type: 'string',
          description: 'Preparation instructions (e.g., "Fast for 12 hours", "No food or drink after midnight")',
          maxLength: 500,
        },
        notes: {
          type: 'string',
          description: 'Additional notes about the clinical date',
          maxLength: 1000,
        },
        reminder_enabled: {
          type: 'boolean',
          description: 'Whether to enable reminders for this clinical date. Defaults to true.',
        },
      },
      required: ['clinical_date', 'description'],
    },
  },
};

/**
 * Example tool call for add_clinical_date:
 * {
 *   "name": "add_clinical_date",
 *   "arguments": {
 *     "clinical_date": "2024-02-15T10:00:00Z",
 *     "description": "Blood test for cholesterol and glucose",
 *     "clinical_type": "lab_test",
 *     "location": "City Hospital Lab",
 *     "provider_name": "Dr. Johnson",
 *     "preparation_notes": "Fast for 12 hours before test",
 *     "reminder_enabled": true
 *   }
 * }
 */

/**
 * Tool: add_care_log
 * Add a care log entry for medical events, visits, procedures, or treatments
 */
export const add_care_log: OpenRouterTool = {
  type: 'function',
  function: {
    name: 'add_care_log',
    description: 'Add a care log entry for past medical events, visits, procedures, tests, diagnoses, treatments, or hospital stays. This creates a permanent medical record. ALWAYS requires user confirmation before creating. Only use when user explicitly mentions a past medical event.',
    parameters: {
      type: 'object',
      properties: {
        log_type: {
          type: 'string',
          description: 'Type of care log entry',
          enum: ['visit', 'procedure', 'test', 'diagnosis', 'treatment', 'hospital_stay', 'emergency_visit', 'therapy_session', 'other'],
        },
        title: {
          type: 'string',
          description: 'Title of the care log entry (e.g., "Annual checkup", "Knee surgery", "Blood test results")',
          minLength: 1,
          maxLength: 200,
        },
        occurred_at: {
          type: 'string',
          description: 'Date and time when the event occurred in ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ). If time not specified, defaults to 00:00:00.',
          pattern: '^(\\d{4}-\\d{2}-\\d{2})(T\\d{2}:\\d{2}:\\d{2}(Z|[+-]\\d{2}:\\d{2})?)?$',
        },
        diagnosis: {
          type: 'string',
          description: 'Diagnosis or findings (only if user explicitly states a diagnosis). Do not infer or guess diagnoses.',
          maxLength: 500,
        },
        treatment: {
          type: 'string',
          description: 'Treatment received (only if user explicitly mentions treatment)',
          maxLength: 500,
        },
        notes: {
          type: 'string',
          description: 'Additional notes about the care log entry',
          maxLength: 2000,
        },
        duration_minutes: {
          type: 'integer',
          description: 'Duration of the event in minutes (for procedures, hospital stays, etc.)',
          minimum: 1,
          maximum: 10080, // Max 1 week
        },
        location_type: {
          type: 'string',
          description: 'Type of location where event occurred',
          enum: ['in_person', 'virtual', 'phone', 'hospital', 'clinic', 'emergency_room'],
        },
        location_name: {
          type: 'string',
          description: 'Name of the facility or location',
          maxLength: 200,
        },
      },
      required: ['log_type', 'title', 'occurred_at'],
    },
  },
};

/**
 * Example tool call for add_care_log:
 * {
 *   "name": "add_care_log",
 *   "arguments": {
 *     "log_type": "visit",
 *     "title": "Annual checkup with cardiologist",
 *     "occurred_at": "2024-01-15T10:00:00Z",
 *     "diagnosis": "Blood pressure well controlled",
 *     "treatment": "Continue current medication",
 *     "location_type": "in_person",
 *     "location_name": "City Medical Center",
 *     "notes": "Routine follow-up, all vitals normal"
 *   }
 * }
 */

/**
 * Tool: get_today_summary
 * Get a summary of today's health data (read-only)
 */
export const get_today_summary: OpenRouterTool = {
  type: 'function',
  function: {
    name: 'get_today_summary',
    description: 'Get a summary of today\'s health data including check-ins, medications, blood pressure readings, hydration, and any logged health entries. This is a read-only tool that retrieves information without modifying data.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
};

/**
 * Example tool call for get_today_summary:
 * {
 *   "name": "get_today_summary",
 *   "arguments": {}
 * }
 */

/**
 * All OpenRouter-compatible tools
 */
export const OPENROUTER_TOOLS: OpenRouterTool[] = [
  log_blood_pressure,
  log_hydration,
  schedule_reminder,
  log_doctor_visit,
  add_clinical_date,
  add_care_log,
  get_today_summary,
];

/**
 * Get tool by name
 */
export function getToolByName(name: string): OpenRouterTool | undefined {
  return OPENROUTER_TOOLS.find(tool => tool.function.name === name);
}

/**
 * Get all tool names
 */
export function getAllToolNames(): string[] {
  return OPENROUTER_TOOLS.map(tool => tool.function.name);
}

/**
 * Validation rules for each tool
 * These are enforced by the executor, not by OpenRouter
 */
export const TOOL_VALIDATION_RULES: Record<string, {
  requiresConfirmation: boolean;
  sensitivity: 'low' | 'medium' | 'high' | 'critical';
  minConfidence: number;
  explicitIntentRequired: boolean;
}> = {
  log_blood_pressure: {
    requiresConfirmation: false,
    sensitivity: 'medium',
    minConfidence: 0.7,
    explicitIntentRequired: false, // User reporting BP is explicit enough
  },
  log_hydration: {
    requiresConfirmation: false,
    sensitivity: 'low',
    minConfidence: 0.7,
    explicitIntentRequired: false,
  },
  schedule_reminder: {
    requiresConfirmation: true,
    sensitivity: 'low',
    minConfidence: 0.8,
    explicitIntentRequired: true, // User must explicitly ask for reminder
  },
  log_doctor_visit: {
    requiresConfirmation: true,
    sensitivity: 'high',
    minConfidence: 0.8,
    explicitIntentRequired: true,
  },
  add_clinical_date: {
    requiresConfirmation: true,
    sensitivity: 'high',
    minConfidence: 0.8,
    explicitIntentRequired: true,
  },
  add_care_log: {
    requiresConfirmation: true,
    sensitivity: 'critical',
    minConfidence: 0.9,
    explicitIntentRequired: true, // Must be explicit - creates permanent record
  },
  get_today_summary: {
    requiresConfirmation: false,
    sensitivity: 'low',
    minConfidence: 0.5, // Read-only, lower threshold
    explicitIntentRequired: false,
  },
};

/**
 * Format tool schemas for OpenRouter API
 * OpenRouter expects tools in the 'tools' array of the request
 */
export function formatToolsForOpenRouter(): Array<{ type: string; function: any }> {
  return OPENROUTER_TOOLS.map(tool => ({
    type: tool.type,
    function: tool.function,
  }));
}
