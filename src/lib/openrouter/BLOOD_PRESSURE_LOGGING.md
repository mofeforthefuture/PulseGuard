# Chat-Driven Blood Pressure Logging

## Overview

ALARA can now log blood pressure readings from natural language conversations. Users can simply type their BP values in any format, and ALARA will extract, validate, and log them to Supabase.

## Flow

```
User: "My BP is 120/80"
  ↓
ALARA extracts: systolic=120, diastolic=80
  ↓
ALARA calls log_blood_pressure tool
  ↓
App validates and saves to Supabase
  ↓
ALARA responds calmly (no diagnosis)
```

## Implementation

### 1. Natural Language Parsing

ALARA extracts BP values from various formats:
- `"120/80"` or `"120/ 80"` or `"120 / 80"`
- `"120 over 80"`
- `"systolic 120 diastolic 80"` or `"sys 120 dia 80"`
- `"BP is 140/90"` or `"blood pressure 120/80"`

**File**: `src/lib/openrouter/bloodPressureParser.ts`

### 2. Tool Calling

OpenRouter tool calling format:
```json
{
  "name": "log_blood_pressure",
  "arguments": {
    "systolic": 120,
    "diastolic": 80,
    "pulse": 72,
    "position": "sitting",
    "notes": "Morning reading"
  }
}
```

**File**: `src/lib/openrouter/tools/openrouterSchemas.ts`

### 3. Execution

**File**: `src/lib/openrouter/actionExecutors.ts`
- `executeLogBloodPressure()` - Validates and saves to Supabase
- Uses `bloodPressureService.logBloodPressure()` for database operations
- Automatically detects abnormal values

### 4. Response Handling

**File**: `src/context/ALARAContext.tsx`
- Parses tool calls from OpenRouter response
- Executes blood pressure logging
- Adds gentle flagging for unusual values
- Handles errors gracefully

## Edge Cases

### Missing Values
- **User**: "My BP is 120"
- **ALARA**: "I got the systolic (120), but I need the diastolic too. What's the bottom number?"

### Invalid Ranges
- **User**: "My BP is 500/300"
- **ALARA**: "Those numbers seem unusual. Could you double-check? Systolic should be 1-300 and diastolic 1-200."

### Reversed Values
- **User**: "My BP is 80/120" (diastolic > systolic)
- **ALARA**: "I think those might be reversed. Is it 120/80 instead?"

### Parsing Errors
- **User**: "I measured my blood pressure"
- **ALARA**: "What were the numbers? You can say it like '120/80' or '120 over 80'."

## Confirmation for Unusual Values

### High Blood Pressure (Stage 2)
- Systolic ≥ 140 or Diastolic ≥ 90
- **Response**: "I noticed this reading is a bit higher than normal. Keep an eye on it and consider mentioning it to your healthcare provider if it continues."

### Crisis Range
- Systolic ≥ 180 or Diastolic ≥ 120
- **Response**: "I noticed this reading is quite high. If you're experiencing symptoms or this is unusual for you, please consider reaching out to your healthcare provider."

### Low Blood Pressure
- Systolic < 90 or Diastolic < 60
- **Response**: "I noticed this reading is lower than usual. If you're feeling dizzy or unwell, please consider checking with your healthcare provider."

**Important**: ALARA never diagnoses. It only logs values and provides gentle, non-medical observations.

## Validation Rules

1. **Systolic**: 1-300
2. **Diastolic**: 1-200
3. **Diastolic < Systolic** (with tolerance for measurement errors)
4. **Pulse** (optional): 40-200
5. **Position** (optional): sitting, standing, lying, other

## Example Conversations

### Normal Reading
**User**: "Just checked my BP, it's 120/80"
**ALARA**: "Got it! I've logged 120/80 for you. 👍"

### High Reading
**User**: "My blood pressure is 150/95"
**ALARA**: "I've logged 150/95. I noticed this reading is a bit higher than normal. Keep an eye on it and consider mentioning it to your healthcare provider if it continues."

### With Pulse
**User**: "BP is 120/80, pulse 72"
**ALARA**: "Logged! 120/80 with pulse 72. All set! 💓"

### Unclear Input
**User**: "I took my blood pressure"
**ALARA**: "What were the numbers? You can say it like '120/80' or '120 over 80'."

## Database Schema

Blood pressure readings are saved to `blood_pressure_logs` table:
- `systolic`: integer (required)
- `diastolic`: integer (required)
- `pulse`: integer (optional)
- `position`: enum (optional)
- `notes`: text (optional)
- `is_abnormal`: boolean (auto-detected)
- `abnormal_reason`: enum (auto-detected)
- `recorded_at`: timestamp (auto-set)

## Safety Features

1. **No Diagnosis**: ALARA never diagnoses or provides medical advice
2. **Gentle Flagging**: Unusual values are noted gently without alarm
3. **Validation**: All values are validated before saving
4. **Error Handling**: Graceful handling of parsing errors
5. **Confirmation**: Unusual values are flagged but still logged

## Future Enhancements

- [ ] Support for multiple readings in one message
- [ ] Trend analysis and gentle suggestions
- [ ] Integration with medication tracking
- [ ] Reminder system for regular BP checks
- [ ] Export functionality for healthcare providers
