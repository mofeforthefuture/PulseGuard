# Chat-Based Doctor Visit Outcome Logging

## Overview

ALARA can parse doctor visit outcomes from natural language, extract follow-up timing, and create care logs and reminders. **All doctor visit outcomes require user confirmation** before being saved to the database.

## Full Flow

```
User: "Doctor said come back in 3 months"
  ↓
ALARA extracts:
  - Visit date: today (or mentioned date)
  - Follow-up: 3 months from now
  ↓
ALARA requests confirmation with extracted data
  ↓
User confirms: "Yes, that's correct"
  ↓
App creates:
  1. Care log entry (care_logs table)
  2. Follow-up reminder (reminders table)
  ↓
ALARA confirms completion
```

## Data Structures

### 1. Parsed Doctor Visit

```typescript
interface ParsedDoctorVisit {
  visitDate: string;              // ISO date: "2024-01-15"
  followUpTiming?: {
    amount: number;               // e.g., 3
    unit: 'days' | 'weeks' | 'months' | 'years';
    followUpDate: string;          // Calculated: "2024-04-15"
  };
  diagnosis?: string;              // Only if explicitly stated
  treatment?: string;              // Only if explicitly stated
  medicationChanges?: {
    action: 'added' | 'changed' | 'removed' | 'increased' | 'decreased';
    medication?: string;
    details?: string;
  }[];
  notes?: string;
  visitType: 'appointment' | 'follow_up' | 'consultation' | 'emergency';
  confidence: number;              // 0-1
}
```

### 2. Confirmation Data

```typescript
interface DoctorVisitConfirmation {
  visitDate: string;              // "2024-01-15"
  followUpDate?: string;          // "2024-04-15"
  followUpTiming?: string;        // "in 3 months"
  diagnosis?: string;             // Only if mentioned
  treatment?: string;             // Only if mentioned
  medicationChanges?: string;    // "changed to X, added Y"
  notes?: string;
  visitType: string;             // "appointment"
}
```

### 3. Care Log (Supabase)

**Table**: `care_logs`

```sql
INSERT INTO care_logs (
  user_id,
  log_type,
  title,
  occurred_at,
  diagnosis,
  treatment,
  notes,
  follow_up_required,
  follow_up_notes
) VALUES (
  'user-uuid',
  'visit',
  'Doctor visit - appointment',
  '2024-01-15T00:00:00Z',
  'Blood pressure well controlled',  -- Only if explicitly stated
  'Continue current medication',      -- Only if explicitly stated
  'Diagnosis: Blood pressure well controlled. Treatment: Continue current medication.',
  true,
  'Follow-up in 3 months'
);
```

**Data Structure**:
```json
{
  "id": "uuid",
  "user_id": "user-uuid",
  "log_type": "visit",
  "title": "Doctor visit - appointment",
  "occurred_at": "2024-01-15T00:00:00Z",
  "diagnosis": "Blood pressure well controlled",
  "treatment": "Continue current medication",
  "notes": "Diagnosis: Blood pressure well controlled. Treatment: Continue current medication.",
  "follow_up_required": true,
  "follow_up_notes": "Follow-up in 3 months",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### 4. Follow-Up Reminder (Supabase)

**Table**: `reminders`

```sql
INSERT INTO reminders (
  user_id,
  title,
  description,
  reminder_type,
  time,
  days_of_week,
  is_active
) VALUES (
  'user-uuid',
  'Follow-up doctor appointment',
  'Follow-up appointment scheduled for 2024-04-15',
  'appointment',
  '09:00',
  [1],  -- Monday (day of week for follow-up date)
  true
);
```

**Data Structure**:
```json
{
  "id": "uuid",
  "user_id": "user-uuid",
  "title": "Follow-up doctor appointment",
  "description": "Follow-up appointment scheduled for 2024-04-15",
  "reminder_type": "appointment",
  "time": "09:00",
  "days_of_week": [1],
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z"
}
```

## Confirmation UX

### Example Confirmation Flow

**User**: "Doctor said come back in 3 months"

**ALARA Response**:
```
I've extracted the following from your doctor visit:

📅 Visit Date: January 15, 2024
🔄 Follow-up: In 3 months (April 15, 2024)
📋 Visit Type: Appointment

Is this correct? (Yes/No/Edit)
```

**User**: "Yes"

**ALARA Response**:
```
✅ Logged! I've created:
- Care log entry for your visit
- Reminder for your follow-up on April 15, 2024

You'll get a reminder when it's time for your follow-up! 📅
```

### Confirmation UI Component Example

```typescript
interface DoctorVisitConfirmationModalProps {
  confirmationData: DoctorVisitConfirmation;
  onConfirm: () => void;
  onReject: () => void;
  onEdit: (updatedData: DoctorVisitConfirmation) => void;
}

function DoctorVisitConfirmationModal({
  confirmationData,
  onConfirm,
  onReject,
  onEdit,
}: DoctorVisitConfirmationModalProps) {
  return (
    <Modal>
      <Text>Confirm Doctor Visit Details</Text>
      
      <View>
        <Text>Visit Date: {formatDate(confirmationData.visitDate)}</Text>
        {confirmationData.followUpDate && (
          <Text>Follow-up: {confirmationData.followUpTiming} ({formatDate(confirmationData.followUpDate)})</Text>
        )}
        {confirmationData.diagnosis && (
          <Text>Diagnosis: {confirmationData.diagnosis}</Text>
        )}
        {confirmationData.treatment && (
          <Text>Treatment: {confirmationData.treatment}</Text>
        )}
        {confirmationData.medicationChanges && (
          <Text>Medication Changes: {confirmationData.medicationChanges}</Text>
        )}
      </View>
      
      <Button onPress={onConfirm}>Confirm</Button>
      <Button onPress={onReject}>Cancel</Button>
      <Button onPress={() => onEdit(confirmationData)}>Edit</Button>
    </Modal>
  );
}
```

## Example Conversations

### Simple Follow-Up

**User**: "Doctor said come back in 3 months"
**ALARA**: "I've extracted: Visit today, follow-up in 3 months (April 15, 2024). Is this correct?"
**User**: "Yes"
**ALARA**: "✅ Logged! Created care log and reminder for April 15."

### With Medication Change

**User**: "The visit went well, changed medication to Metformin"
**ALARA**: "I've extracted: Visit today, medication changed to Metformin. Is this correct?"
**User**: "Yes"
**ALARA**: "✅ Logged! I've noted the medication change in your care log."

### Complex Outcome

**User**: "Went to doctor yesterday. Diagnosis is hypertension, treatment is medication, and follow-up in two weeks"
**ALARA**: "I've extracted:
- Visit Date: January 14, 2024
- Diagnosis: hypertension
- Treatment: medication
- Follow-up: In 2 weeks (January 28, 2024)

Is this correct?"
**User**: "Yes"
**ALARA**: "✅ Logged! Created care log with diagnosis and treatment, plus reminder for January 28."

### Unclear Input

**User**: "I went to the doctor"
**ALARA**: "What happened at the visit? Did the doctor mention a follow-up, diagnosis, or medication changes?"

## Natural Language Parsing

### Follow-Up Timing Patterns

- "come back in 3 months" → 3 months
- "next appointment is in two weeks" → 2 weeks
- "follow-up in 6 weeks" → 6 weeks
- "return in 1 month" → 1 month

### Medication Change Patterns

- "changed medication to X" → changed
- "switched to X" → changed
- "added new medication" → added
- "stopped taking X" → removed
- "increased dosage" → increased
- "decreased dosage" → decreased

**Important**: Only extracts if explicitly stated. Never assumes medication changes.

## Safety Rules

1. **Always Require Confirmation**: Doctor visit outcomes are critical medical records
2. **Never Assume**: Only use explicitly stated information
3. **No Medication Inference**: Never assume medication changes unless user explicitly states them
4. **Verify Dates**: Always confirm visit date and follow-up date
5. **Clear Presentation**: Show all extracted data clearly for user review

## Files

1. **`src/lib/openrouter/doctorVisitParser.ts`** - Natural language parser
2. **`src/lib/openrouter/doctorVisitExecutor.ts`** - Care log and reminder creation
3. **`src/lib/openrouter/actionExecutors.ts`** - Action executor with confirmation flow
4. **`src/lib/openrouter/actions.ts`** - System prompt instructions

## Integration

### In ALARAContext.tsx

```typescript
// Handle doctor visit outcome with confirmation
if (action.type === 'log_doctor_visit_outcome') {
  const result = await executeLogDoctorVisitOutcome(userId, action);
  
  if (result.requiresConfirmation && result.confirmationData) {
    // Show confirmation modal
    setPendingConfirmation({
      type: 'doctor_visit_outcome',
      data: result.confirmationData,
      onConfirm: async () => {
        const confirmed = await executeDoctorVisitOutcomeConfirmed(
          userId,
          result.confirmationData
        );
        // Handle result
      },
    });
  }
}
```

## Future Enhancements

- [ ] Link to existing appointments
- [ ] Support for multiple follow-ups
- [ ] Integration with medication tracking
- [ ] Export to healthcare providers
- [ ] Photo/document attachments
