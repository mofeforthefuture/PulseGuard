/**
 * ALARA Tool Registry
 * Centralized registry of all available tools for ALARA
 * Tools are executed by the app, not directly by ALARA
 */

export type ToolCategory = 'health_logging' | 'reminders' | 'care_records' | 'read_only';

export type ToolSensitivity = 'low' | 'medium' | 'high' | 'critical';

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  enum?: string[]; // For constrained values
  example?: any;
}

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  sensitivity: ToolSensitivity;
  requiresConfirmation: boolean; // If true, must confirm before execution
  parameters: ToolParameter[];
  executor: string; // Function name in actionExecutors
  medicalSafetyRules?: string[]; // Specific safety rules for this tool
}

/**
 * Tool Registry - All available tools for ALARA
 */
export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
  log_medication: {
    id: 'log_medication',
    name: 'Log Medication',
    description: 'Log when user takes medication. Only use when user explicitly mentions taking medication.',
    category: 'health_logging',
    sensitivity: 'high',
    requiresConfirmation: false, // Low risk, user explicitly mentioned it
    parameters: [
      {
        name: 'medication_name',
        type: 'string',
        description: 'Name of the medication',
        required: true,
        example: 'Aspirin',
      },
      {
        name: 'dose',
        type: 'string',
        description: 'Dosage taken',
        required: false,
        example: '1 tablet',
      },
      {
        name: 'taken_at',
        type: 'string',
        description: 'ISO timestamp when medication was taken (defaults to now)',
        required: false,
      },
    ],
    executor: 'executeLogMedication',
    medicalSafetyRules: [
      'Only log if user explicitly states they took the medication',
      'Do not infer medication from symptoms alone',
      'Verify medication name matches user\'s known medications if possible',
    ],
  },

  create_check_in: {
    id: 'create_check_in',
    name: 'Create Daily Check-In',
    description: 'Create or update a daily health check-in with mood, symptoms, and notes.',
    category: 'health_logging',
    sensitivity: 'medium',
    requiresConfirmation: false, // User is sharing their state
    parameters: [
      {
        name: 'mood',
        type: 'string',
        description: 'User mood',
        required: false,
        enum: ['great', 'good', 'okay', 'poor', 'crisis'],
        example: 'good',
      },
      {
        name: 'symptoms',
        type: 'array',
        description: 'Array of symptom names',
        required: false,
        example: ['headache', 'fatigue'],
      },
      {
        name: 'medication_taken',
        type: 'boolean',
        description: 'Whether medication was taken today',
        required: false,
        example: true,
      },
      {
        name: 'notes',
        type: 'string',
        description: 'Additional notes about the check-in',
        required: false,
      },
    ],
    executor: 'executeCreateCheckIn',
    medicalSafetyRules: [
      'Do not diagnose symptoms',
      'If user mentions severe symptoms, encourage medical consultation',
      'Crisis mood should trigger additional safety checks',
    ],
  },

  update_mood: {
    id: 'update_mood',
    name: 'Update Mood',
    description: 'Quick mood update. Use when user clearly states their mood.',
    category: 'health_logging',
    sensitivity: 'low',
    requiresConfirmation: false,
    parameters: [
      {
        name: 'mood',
        type: 'string',
        description: 'User mood',
        required: true,
        enum: ['great', 'good', 'okay', 'poor', 'crisis'],
        example: 'good',
      },
    ],
    executor: 'executeUpdateMood',
    medicalSafetyRules: [
      'Crisis mood should be flagged for immediate attention',
      'Do not infer mood from context - only use explicit statements',
    ],
  },

  save_health_entry: {
    id: 'save_health_entry',
    name: 'Save Health Entry',
    description: 'Save a general health note, symptom, or health event.',
    category: 'health_logging',
    sensitivity: 'medium',
    requiresConfirmation: false,
    parameters: [
      {
        name: 'entry_type',
        type: 'string',
        description: 'Type of entry',
        required: true,
        enum: ['symptom', 'medication', 'vital', 'note'],
        example: 'symptom',
      },
      {
        name: 'data',
        type: 'object',
        description: 'Entry data (varies by entry_type)',
        required: true,
        example: { symptoms: ['headache'], severity: 'mild' },
      },
    ],
    executor: 'executeSaveHealthEntry',
    medicalSafetyRules: [
      'Do not diagnose or interpret symptoms',
      'Severe symptoms should be flagged',
      'Encourage medical consultation for concerning entries',
    ],
  },

  create_reminder: {
    id: 'create_reminder',
    name: 'Create Reminder',
    description: 'Create a recurring reminder for medication, check-ins, or appointments.',
    category: 'reminders',
    sensitivity: 'low',
    requiresConfirmation: true, // Confirm before creating reminders
    parameters: [
      {
        name: 'title',
        type: 'string',
        description: 'Reminder title',
        required: true,
        example: 'Take medication',
      },
      {
        name: 'time',
        type: 'string',
        description: 'Time in HH:MM format (24-hour)',
        required: true,
        example: '09:00',
      },
      {
        name: 'days',
        type: 'array',
        description: 'Days of week (0=Sunday, 6=Saturday)',
        required: false,
        example: [1, 2, 3, 4, 5],
      },
      {
        name: 'reminder_type',
        type: 'string',
        description: 'Type of reminder',
        required: false,
        enum: ['medication', 'check_in', 'appointment'],
        example: 'medication',
      },
      {
        name: 'description',
        type: 'string',
        description: 'Optional reminder description',
        required: false,
      },
    ],
    executor: 'executeCreateReminder',
    medicalSafetyRules: [
      'Verify reminder details with user before creating',
      'Medication reminders should match known medications',
    ],
  },

  create_care_log: {
    id: 'create_care_log',
    name: 'Create Care Log',
    description: 'Log a healthcare visit, procedure, test, or medical event. Requires confirmation.',
    category: 'care_records',
    sensitivity: 'critical',
    requiresConfirmation: true, // Always confirm medical records
    parameters: [
      {
        name: 'log_type',
        type: 'string',
        description: 'Type of care log',
        required: true,
        enum: ['visit', 'procedure', 'test', 'diagnosis', 'treatment', 'hospital_stay', 'emergency_visit', 'therapy_session', 'other'],
        example: 'visit',
      },
      {
        name: 'title',
        type: 'string',
        description: 'Title of the care log entry',
        required: true,
        example: 'Annual checkup',
      },
      {
        name: 'occurred_at',
        type: 'string',
        description: 'ISO timestamp when the event occurred',
        required: true,
        example: '2024-01-15T10:00:00Z',
      },
      {
        name: 'diagnosis',
        type: 'string',
        description: 'Diagnosis or findings (if applicable)',
        required: false,
      },
      {
        name: 'treatment',
        type: 'string',
        description: 'Treatment received (if applicable)',
        required: false,
      },
      {
        name: 'notes',
        type: 'string',
        description: 'Additional notes',
        required: false,
      },
    ],
    executor: 'executeCreateCareLog',
    medicalSafetyRules: [
      'ALWAYS require user confirmation before creating care logs',
      'Do not infer diagnoses - only log what user explicitly states',
      'Verify dates and details with user',
      'Medical records are permanent - accuracy is critical',
    ],
  },

  log_doctor_visit: {
    id: 'log_doctor_visit',
    name: 'Log Doctor Visit',
    description: 'Log a visit to a doctor, clinic, or hospital.',
    category: 'care_records',
    sensitivity: 'high',
    requiresConfirmation: true,
    parameters: [
      {
        name: 'visit_type',
        type: 'string',
        description: 'Type of visit',
        required: true,
        enum: ['appointment', 'emergency', 'follow_up', 'consultation'],
        example: 'appointment',
      },
      {
        name: 'date',
        type: 'string',
        description: 'Date of visit (YYYY-MM-DD)',
        required: true,
        example: '2024-01-15',
      },
      {
        name: 'notes',
        type: 'string',
        description: 'Notes about the visit',
        required: false,
      },
    ],
    executor: 'executeLogDoctorVisit',
    medicalSafetyRules: [
      'Require confirmation for all doctor visit logs',
      'Do not infer visit details - only log explicit information',
      'Verify dates are correct',
    ],
  },
};

/**
 * Get tool definition by ID
 */
export function getToolDefinition(toolId: string): ToolDefinition | undefined {
  return TOOL_REGISTRY[toolId];
}

/**
 * Get all tools by category
 */
export function getToolsByCategory(category: ToolCategory): ToolDefinition[] {
  return Object.values(TOOL_REGISTRY).filter(tool => tool.category === category);
}

/**
 * Get tools that require confirmation
 */
export function getToolsRequiringConfirmation(): ToolDefinition[] {
  return Object.values(TOOL_REGISTRY).filter(tool => tool.requiresConfirmation);
}

/**
 * Get tools by sensitivity level
 */
export function getToolsBySensitivity(sensitivity: ToolSensitivity): ToolDefinition[] {
  return Object.values(TOOL_REGISTRY).filter(tool => tool.sensitivity === sensitivity);
}
