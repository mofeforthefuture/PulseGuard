# OpenRouter Tool Schemas Documentation

## Overview

This document defines OpenRouter-compatible tool schemas for ALARA. These schemas follow OpenAI's function calling format, which is fully compatible with OpenRouter API.

## Tool List

1. **log_blood_pressure** - Log blood pressure readings
2. **log_hydration** - Log water/hydration intake
3. **schedule_reminder** - Create recurring reminders
4. **log_doctor_visit** - Log healthcare provider visits
5. **add_clinical_date** - Add clinical dates (tests, procedures, etc.)
6. **add_care_log** - Add care log entries (medical records)
7. **get_today_summary** - Get today's health data summary (read-only)

---

## 1. log_blood_pressure

**Purpose**: Log a blood pressure reading with systolic, diastolic, and optional pulse.

**When to use**: When user reports or measures their blood pressure.

**Validation Rules**:
- Systolic: 1-300
- Diastolic: 1-200, must be < systolic
- Pulse: 40-200 (optional)
- Position: enum ['sitting', 'standing', 'lying', 'other'] (optional)

**Example Tool Call**:
```json
{
  "name": "log_blood_pressure",
  "arguments": {
    "systolic": 120,
    "diastolic": 80,
    "pulse": 72,
    "position": "sitting",
    "notes": "Morning reading before breakfast"
  }
}
```

**Safety Rules**:
- Requires confidence ≥ 0.7
- No confirmation needed (low risk)
- User reporting BP is considered explicit intent

---

## 2. log_hydration

**Purpose**: Log water or hydration intake in milliliters.

**When to use**: When user mentions drinking water or other hydrating beverages.

**Validation Rules**:
- Amount: 1-10000 ml
- Notes: max 200 characters (optional)

**Example Tool Call**:
```json
{
  "name": "log_hydration",
  "arguments": {
    "amount": 500,
    "notes": "Morning water bottle"
  }
}
```

**Safety Rules**:
- Requires confidence ≥ 0.7
- No confirmation needed (low risk)
- Common amounts: 250ml (glass), 500ml (bottle), 1000ml (liter)

---

## 3. schedule_reminder

**Purpose**: Create a recurring reminder for medications, check-ins, or appointments.

**When to use**: When user explicitly asks to be reminded about something.

**Validation Rules**:
- Title: 1-100 characters (required)
- Time: HH:MM format, 24-hour (required)
- Days: Array of 0-6 (0=Sunday, 6=Saturday), default all days
- Reminder type: enum ['medication', 'check_in', 'appointment', 'other'] (optional)

**Example Tool Call**:
```json
{
  "name": "schedule_reminder",
  "arguments": {
    "title": "Take morning medication",
    "time": "09:00",
    "days": [1, 2, 3, 4, 5],
    "reminder_type": "medication",
    "description": "Take aspirin and vitamin D"
  }
}
```

**Safety Rules**:
- Requires confidence ≥ 0.8
- **Requires user confirmation** before creating
- User must explicitly ask for reminder

---

## 4. log_doctor_visit

**Purpose**: Log a visit to a healthcare provider (doctor, clinic, hospital).

**When to use**: When user mentions visiting a healthcare provider.

**Validation Rules**:
- Visit type: enum ['appointment', 'emergency', 'follow_up', 'consultation'] (required)
- Date: YYYY-MM-DD format (required)
- Notes: max 1000 characters (optional)

**Example Tool Call**:
```json
{
  "name": "log_doctor_visit",
  "arguments": {
    "visit_type": "appointment",
    "date": "2024-01-15",
    "notes": "Annual checkup with Dr. Smith"
  }
}
```

**Safety Rules**:
- Requires confidence ≥ 0.8
- **Requires user confirmation** before logging
- User must explicitly mention visit
- Verify date is correct

---

## 5. add_clinical_date

**Purpose**: Add a clinical date for lab tests, scans, procedures, follow-ups, or screenings.

**When to use**: When user mentions upcoming medical tests or procedures.

**Validation Rules**:
- Clinical date: ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SSZ) (required)
- Description: 1-200 characters (required)
- Clinical type: enum ['lab_test', 'scan', 'procedure', 'follow_up', 'screening', 'other'] (optional)
- Location: max 200 characters (optional)
- Provider name: max 200 characters (optional)
- Preparation notes: max 500 characters (optional)
- Reminder enabled: boolean, defaults to true (optional)

**Example Tool Call**:
```json
{
  "name": "add_clinical_date",
  "arguments": {
    "clinical_date": "2024-02-15T10:00:00Z",
    "description": "Blood test for cholesterol and glucose",
    "clinical_type": "lab_test",
    "location": "City Hospital Lab",
    "provider_name": "Dr. Johnson",
    "preparation_notes": "Fast for 12 hours before test",
    "reminder_enabled": true
  }
}
```

**Safety Rules**:
- Requires confidence ≥ 0.8
- **Requires user confirmation** before adding
- User must explicitly mention clinical date
- Verify date and time are correct

---

## 6. add_care_log

**Purpose**: Add a care log entry for past medical events, visits, procedures, or treatments.

**When to use**: When user explicitly mentions a past medical event. Creates permanent medical record.

**Validation Rules**:
- Log type: enum ['visit', 'procedure', 'test', 'diagnosis', 'treatment', 'hospital_stay', 'emergency_visit', 'therapy_session', 'other'] (required)
- Title: 1-200 characters (required)
- Occurred at: ISO 8601 format (required)
- Diagnosis: max 500 characters (optional, only if user explicitly states)
- Treatment: max 500 characters (optional, only if user explicitly mentions)
- Notes: max 2000 characters (optional)
- Duration minutes: 1-10080 (optional)
- Location type: enum ['in_person', 'virtual', 'phone', 'hospital', 'clinic', 'emergency_room'] (optional)
- Location name: max 200 characters (optional)

**Example Tool Call**:
```json
{
  "name": "add_care_log",
  "arguments": {
    "log_type": "visit",
    "title": "Annual checkup with cardiologist",
    "occurred_at": "2024-01-15T10:00:00Z",
    "diagnosis": "Blood pressure well controlled",
    "treatment": "Continue current medication",
    "location_type": "in_person",
    "location_name": "City Medical Center",
    "notes": "Routine follow-up, all vitals normal"
  }
}
```

**Safety Rules**:
- Requires confidence ≥ 0.9 (highest threshold)
- **ALWAYS requires user confirmation** before creating
- User must explicitly mention past medical event
- **Do not infer diagnoses** - only log what user explicitly states
- Verify dates and details with user
- Medical records are permanent - accuracy is critical

---

## 7. get_today_summary

**Purpose**: Get a summary of today's health data (read-only).

**When to use**: When user asks about today's health summary or wants to review their data.

**Validation Rules**:
- No parameters required

**Example Tool Call**:
```json
{
  "name": "get_today_summary",
  "arguments": {}
}
```

**Safety Rules**:
- Requires confidence ≥ 0.5 (read-only, lower threshold)
- No confirmation needed
- Returns: check-ins, medications, blood pressure, hydration, health entries

---

## Tool Validation Summary

| Tool | Requires Confirmation | Sensitivity | Min Confidence | Explicit Intent Required |
|------|----------------------|-------------|----------------|--------------------------|
| log_blood_pressure | No | Medium | 0.7 | No |
| log_hydration | No | Low | 0.7 | No |
| schedule_reminder | **Yes** | Low | 0.8 | Yes |
| log_doctor_visit | **Yes** | High | 0.8 | Yes |
| add_clinical_date | **Yes** | High | 0.8 | Yes |
| add_care_log | **Yes** | Critical | 0.9 | Yes |
| get_today_summary | No | Low | 0.5 | No |

---

## Integration with OpenRouter API

### Request Format

```json
{
  "model": "openai/gpt-4o",
  "messages": [
    {
      "role": "system",
      "content": "You are ALARA..."
    },
    {
      "role": "user",
      "content": "I took my blood pressure, it's 120/80"
    }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "log_blood_pressure",
        "description": "...",
        "parameters": {...}
      }
    }
  ],
  "tool_choice": "auto"
}
```

### Response Format

```json
{
  "id": "gen-...",
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "I'll log that for you!",
        "tool_calls": [
          {
            "id": "call_abc123",
            "type": "function",
            "function": {
              "name": "log_blood_pressure",
              "arguments": "{\"systolic\":120,\"diastolic\":80}"
            }
          }
        ]
      }
    }
  ]
}
```

---

## Future Expansion

The schema structure supports easy expansion:

1. **Add new tools**: Add to `OPENROUTER_TOOLS` array
2. **Add parameters**: Extend `properties` in tool definition
3. **Add validation**: Add entry to `TOOL_VALIDATION_RULES`
4. **Add safety rules**: Extend validation rules object

### Example: Adding a New Tool

```typescript
export const log_symptom: OpenRouterTool = {
  type: 'function',
  function: {
    name: 'log_symptom',
    description: 'Log a symptom or health concern',
    parameters: {
      type: 'object',
      properties: {
        symptom_name: {
          type: 'string',
          description: 'Name of the symptom',
        },
        severity: {
          type: 'string',
          enum: ['mild', 'moderate', 'severe'],
        },
      },
      required: ['symptom_name'],
    },
  },
};

// Add to array
export const OPENROUTER_TOOLS: OpenRouterTool[] = [
  // ... existing tools
  log_symptom,
];

// Add validation rules
export const TOOL_VALIDATION_RULES: Record<string, {...}> = {
  // ... existing rules
  log_symptom: {
    requiresConfirmation: false,
    sensitivity: 'medium',
    minConfidence: 0.7,
    explicitIntentRequired: false,
  },
};
```

---

## Notes

- All date/time fields use ISO 8601 format
- All validation rules are enforced by the executor, not OpenRouter
- Tool calls are parsed and validated before execution
- Sensitive tools require user confirmation before execution
- Medical records (care logs) have the highest safety requirements
