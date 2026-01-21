# Doctor Recommendation Parsing

## Overview

ALARA can parse doctor recommendations from natural language, extract intervals and frequencies, and propose reminder schedules. **All recommendations require user approval** before creating reminders. The system **never interprets recommendations medically** - it only extracts timing and action information.

## Full Flow

```
User: "Doctor said return in 3 months"
  ↓
ALARA extracts:
  - Recommendation: "return in 3 months"
  - Action: "Follow-up appointment"
  - Interval: 3 months
  - Proposed: One-time reminder for 3 months from now
  ↓
ALARA requests approval with proposed reminder
  ↓
User approves: "Yes"
  ↓
App creates reminder with source='doctor_recommendation'
  ↓
ALARA confirms completion
```

## Data Structures

### 1. Parsed Doctor Recommendation

```typescript
interface ParsedDoctorRecommendation {
  recommendationText: string;        // "Return in 3 months"
  action?: string;                   // "Follow-up appointment"
  interval?: {
    amount: number;                   // 3
    unit: 'days' | 'weeks' | 'months' | 'years';
    duration?: number;                // Total duration if "for X" specified
  };
  frequency?: {
    amount: number;                   // 1
    unit: 'daily' | 'weekly' | 'monthly';
  };
  proposedReminder?: {
    title: string;                    // "Follow-up appointment"
    isRecurring: boolean;
    oneTimeDate?: string;             // "2024-04-15"
    time?: string;                    // "09:00"
    daysOfWeek?: number[];            // [1] for recurring
    interval?: {
      amount: number;
      unit: 'days' | 'weeks' | 'months';
    };
  };
  confidence: number;                 // 0-1
}
```

### 2. Confirmation Data

```typescript
interface DoctorRecommendationConfirmation {
  recommendationText: string;        // "Return in 3 months"
  action?: string;                   // "Follow-up appointment"
  proposedReminder: {
    title: string;
    isRecurring: boolean;
    oneTimeDate?: string;             // "2024-04-15"
    oneTimeDateFormatted?: string;    // "April 15, 2024"
    time?: string;                    // "09:00"
    daysOfWeek?: number[];            // [1]
    daysOfWeekFormatted?: string;     // "Monday"
    interval?: string;                 // "Every 3 months"
  };
}
```

### 3. Supabase Reminder (with source)

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
  'Follow-up appointment',
  'Doctor recommendation: "Return in 3 months"',
  'appointment',
  '09:00',
  [1],  -- Day of week for the reminder date
  true
);
```

**Data Structure**:
```json
{
  "id": "uuid",
  "user_id": "user-uuid",
  "title": "Follow-up appointment",
  "description": "Doctor recommendation: \"Return in 3 months\"",
  "reminder_type": "appointment",
  "time": "09:00",
  "days_of_week": [1],
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Note**: The `description` field contains `"Doctor recommendation: \"...\""` which serves as the source indicator. The system can identify doctor recommendations by checking if description starts with "Doctor recommendation:".

## Example Conversations

### Simple Interval

**User**: "Doctor said return in 3 months"

**ALARA**: "I've parsed the doctor's recommendation and proposed this reminder:

Doctor said: "return in 3 months"
Action: Follow-up appointment

Proposed reminder:
Title: Follow-up appointment
Type: One-time
Date: April 15, 2024
Time: 9:00 AM

Would you like to approve this reminder? (Yes/No/Edit)"

**User**: "Yes"

**ALARA**: "✅ Created one-time reminder from doctor recommendation: Follow-up appointment (April 15, 2024 at 9:00 AM)"

**Supabase Write**:
```json
{
  "user_id": "user-uuid",
  "title": "Follow-up appointment",
  "description": "Doctor recommendation: \"return in 3 months\"",
  "reminder_type": "appointment",
  "time": "09:00",
  "days_of_week": [1],
  "is_active": true
}
```

---

### With Frequency

**User**: "Doctor told me to check my BP daily for a month"

**ALARA**: "I've parsed the doctor's recommendation and proposed this reminder:

Doctor said: "check my BP daily for a month"
Action: check my BP

Proposed reminder:
Title: check my BP
Type: Recurring
Days: Every day
Time: 9:00 AM

Would you like to approve this reminder? (Yes/No/Edit)"

**User**: "Yes"

**ALARA**: "✅ Created recurring reminder from doctor recommendation: check my BP (Every day at 9:00 AM)"

**Supabase Write**:
```json
{
  "user_id": "user-uuid",
  "title": "check my BP",
  "description": "Doctor recommendation: \"check my BP daily for a month\"",
  "reminder_type": "check_in",
  "time": "09:00",
  "days_of_week": [0, 1, 2, 3, 4, 5, 6],
  "is_active": true
}
```

---

### Follow-Up After Interval

**User**: "Follow up after 2 weeks"

**ALARA**: "I've parsed the doctor's recommendation and proposed this reminder:

Doctor said: "follow up after 2 weeks"
Action: Follow-up appointment

Proposed reminder:
Title: Follow-up appointment
Type: One-time
Date: January 29, 2024
Time: 9:00 AM

Would you like to approve this reminder? (Yes/No/Edit)"

**User**: "Yes"

**ALARA**: "✅ Created one-time reminder from doctor recommendation: Follow-up appointment (January 29, 2024 at 9:00 AM)"

---

### Weekly Monitoring

**User**: "Doctor wants me to monitor symptoms weekly"

**ALARA**: "I've parsed the doctor's recommendation and proposed this reminder:

Doctor said: "monitor symptoms weekly"
Action: monitor symptoms

Proposed reminder:
Title: monitor symptoms
Type: Recurring
Days: Monday
Interval: Every 1 weeks
Time: 9:00 AM

Would you like to approve this reminder? (Yes/No/Edit)"

**User**: "Yes"

**ALARA**: "✅ Created recurring reminder from doctor recommendation: monitor symptoms (Monday at 9:00 AM)"

---

### Unclear Recommendation

**User**: "Doctor said something about checking"

**ALARA**: "I couldn't extract a clear interval or frequency from that. Could you tell me what the doctor said more specifically? For example: 'return in 3 months' or 'check BP daily'."

---

## Natural Language Parsing

### Interval Patterns

| User Input | Extracted Interval |
|------------|-------------------|
| "Return in 3 months" | 3 months |
| "Follow up after 2 weeks" | 2 weeks |
| "Come back in 1 month" | 1 month |
| "in 6 weeks" | 6 weeks |

### Frequency Patterns

| User Input | Extracted Frequency |
|------------|-------------------|
| "daily" | daily |
| "every day" | daily |
| "weekly" | weekly |
| "every week" | weekly |
| "monthly" | monthly |
| "every 3 months" | monthly (every 3) |

### Action Extraction

- "check BP" → Action: "check BP"
- "return" → Action: "Follow-up appointment"
- "monitor symptoms" → Action: "monitor symptoms"
- "follow up" → Action: "Follow-up appointment"

### Duration Patterns

- "for a month" → Duration: 30 days
- "for 2 weeks" → Duration: 14 days
- "for 3 months" → Duration: 90 days

## Reminder Proposal Logic

### One-Time Reminders
- **Trigger**: Interval specified (e.g., "in 3 months")
- **Proposal**: One-time reminder on calculated date
- **Example**: "Return in 3 months" → Reminder on date 3 months from now

### Recurring Reminders
- **Trigger**: Frequency specified (e.g., "daily", "weekly")
- **Proposal**: Recurring reminder with specified frequency
- **Example**: "Check BP daily" → Daily reminder

### Combined (Frequency + Duration)
- **Trigger**: Frequency + duration (e.g., "daily for a month")
- **Proposal**: Recurring reminder (duration noted in description)
- **Example**: "Check BP daily for a month" → Daily reminder, description includes "for a month"

## Safety Rules

1. **No Medical Interpretation**: Only extracts timing and action - never interprets what it means medically
2. **Always Require Approval**: User must approve before creating reminder
3. **Preserve Original Text**: Original recommendation stored in description
4. **Source Tracking**: Description includes "Doctor recommendation: ..." for identification
5. **No Assumptions**: Only uses explicitly stated intervals/frequencies

## Confirmation UX

### Confirmation Modal

**Component**: `src/components/alara/DoctorRecommendationConfirmationModal.tsx`

Shows:
- Original recommendation text (highlighted)
- Extracted action
- Proposed reminder details
- Source indicator: "doctor_recommendation"

Actions:
- **Approve**: Creates reminder with source tracking
- **Edit**: Allows user to modify proposed reminder
- **Decline**: Cancels reminder creation

## Files

1. **`src/lib/openrouter/doctorRecommendationParser.ts`** - Natural language parser
2. **`src/lib/openrouter/doctorRecommendationExecutor.ts`** - Reminder creation with source tracking
3. **`src/lib/openrouter/actionExecutors.ts`** - Action executor integration
4. **`src/lib/openrouter/actions.ts`** - System prompt instructions
5. **`src/components/alara/DoctorRecommendationConfirmationModal.tsx`** - Confirmation UI

## Integration

### In ALARAContext.tsx

```typescript
// Handle doctor recommendation with approval
if (action.type === 'parse_doctor_recommendation') {
  const result = await executeParseDoctorRecommendation(userId, action);
  
  if (result.requiresConfirmation && result.confirmationData) {
    // Show confirmation modal
    setPendingConfirmation({
      type: 'doctor_recommendation',
      data: result.confirmationData,
      onApprove: async () => {
        const approved = await executeDoctorRecommendationApprovedAction(
          userId,
          result.confirmationData
        );
        // Handle result
      },
    });
  }
}
```

## Source Tracking

Doctor recommendations are tracked via the `description` field:

```typescript
description: `Doctor recommendation: "${recommendationText}"`
```

To query doctor recommendation reminders:
```sql
SELECT * FROM reminders 
WHERE description LIKE 'Doctor recommendation:%'
AND user_id = 'user-uuid';
```

## Future Enhancements

- [ ] Link to specific doctor visit/care log
- [ ] Support for multiple recommendations in one message
- [ ] Smart reminder time suggestions based on user patterns
- [ ] Integration with medication tracking
- [ ] Reminder completion tracking
