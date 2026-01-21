# Natural Language Reminder Scheduling

## Overview

ALARA can parse natural language reminder requests and create reminders in Supabase. The system uses injected system time from metadata context to calculate concrete dates, supports both one-time and recurring reminders, and always requires user confirmation before saving.

## Full Flow

```
User: "Remind me to take medication in 2 weeks"
  ↓
ALARA extracts:
  - Title: "take medication"
  - Type: one-time
  - Date: 2 weeks from current date (from metadata context)
  - Time: default 9am (or extracted from message)
  ↓
ALARA requests confirmation with extracted data
  ↓
User confirms: "Yes"
  ↓
App saves to Supabase reminders table
  ↓
ALARA confirms completion
```

## Data Structures

### 1. Parsed Reminder

```typescript
interface ParsedReminder {
  title: string;                    // "Take medication"
  description?: string;
  reminderType: 'medication' | 'check_in' | 'appointment' | 'other';
  isRecurring: boolean;
  
  // One-time reminders
  oneTimeDate?: string;              // "2024-01-29" (ISO format)
  
  // Recurring reminders
  time?: string;                     // "09:00" (HH:MM format)
  daysOfWeek?: number[];             // [1, 2, 3, 4, 5] (Monday-Friday)
  interval?: {
    amount: number;                   // 3
    unit: 'days' | 'weeks' | 'months';
  };
  
  confidence: number;                 // 0-1
}
```

### 2. Confirmation Data

```typescript
interface ReminderConfirmation {
  title: string;
  description?: string;
  reminderType: string;
  isRecurring: boolean;
  
  // One-time
  oneTimeDate?: string;              // "2024-01-29"
  oneTimeDateFormatted?: string;    // "January 29, 2024"
  
  // Recurring
  time?: string;                     // "09:00"
  daysOfWeek?: number[];            // [1, 2, 3, 4, 5]
  daysOfWeekFormatted?: string;     // "Weekdays"
  interval?: string;                 // "Every 3 months"
}
```

### 3. Supabase Reminder Structure

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
  'Take medication',
  'One-time reminder for January 29, 2024',
  'medication',
  '09:00',
  [1],  -- Day of week for one-time (Monday)
  true
);
```

**For Recurring Reminder**:
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
  'Daily check-in',
  'Recurring reminder on Weekdays',
  'check_in',
  '09:00',
  [1, 2, 3, 4, 5],  -- Monday-Friday
  true
);
```

## Natural Language Parsing

### One-Time Reminders

| User Input | Parsed Result |
|------------|--------------|
| "in 2 weeks" | Date: 2 weeks from now |
| "tomorrow at 9am" | Date: tomorrow, Time: 09:00 |
| "next Monday" | Date: next Monday |
| "January 15" | Date: January 15 (current year) |
| "in 3 months" | Date: 3 months from now |

### Recurring Reminders

| User Input | Parsed Result |
|------------|--------------|
| "every day" | Days: [0,1,2,3,4,5,6], Time: 09:00 |
| "every weekday at 9am" | Days: [1,2,3,4,5], Time: 09:00 |
| "every Monday" | Days: [1], Time: 09:00 |
| "every 3 months" | Interval: every 3 months, Days: all |
| "daily at 2pm" | Days: all, Time: 14:00 |

### Time Extraction

- "9am" → 09:00
- "2:30pm" → 14:30
- "14:00" → 14:00
- "at 9" → 09:00
- Default: 09:00 if not specified

## Example Conversations

### One-Time Reminder

**User**: "Remind me to take medication in 2 weeks"

**ALARA**: "I've extracted the following reminder:

Title: take medication
Type: One-time
Date: January 29, 2024
Time: 09:00

Is this correct? (Please confirm or let me know what to change)"

**User**: "Yes"

**ALARA**: "✅ Created one-time reminder: take medication (January 29, 2024 at 09:00)"

**Supabase Write**:
```json
{
  "user_id": "user-uuid",
  "title": "take medication",
  "description": "One-time reminder for January 29, 2024",
  "reminder_type": "medication",
  "time": "09:00",
  "days_of_week": [1],  // Monday (day of week for Jan 29)
  "is_active": true
}
```

---

### Recurring Reminder

**User**: "Remind me to check in every weekday at 9am"

**ALARA**: "I've extracted the following reminder:

Title: check in
Type: Recurring
Days: Weekdays
Time: 09:00

Is this correct? (Please confirm or let me know what to change)"

**User**: "Yes"

**ALARA**: "✅ Created recurring reminder: check in (Weekdays at 09:00)"

**Supabase Write**:
```json
{
  "user_id": "user-uuid",
  "title": "check in",
  "description": "Recurring reminder on Weekdays",
  "reminder_type": "check_in",
  "time": "09:00",
  "days_of_week": [1, 2, 3, 4, 5],  // Monday-Friday
  "is_active": true
}
```

---

### With Specific Time

**User**: "Remind me about my appointment tomorrow at 2pm"

**ALARA**: "I've extracted the following reminder:

Title: my appointment
Type: One-time
Date: January 16, 2024
Time: 14:00

Is this correct? (Please confirm or let me know what to change)"

**User**: "Yes"

**ALARA**: "✅ Created one-time reminder: my appointment (January 16, 2024 at 14:00)"

---

### Recurring with Interval

**User**: "Remind me to see the doctor every 3 months"

**ALARA**: "I've extracted the following reminder:

Title: see the doctor
Type: Recurring
Days: Every day
Interval: Every 3 months
Time: 09:00

Is this correct? (Please confirm or let me know what to change)"

**User**: "Yes"

**ALARA**: "✅ Created recurring reminder: see the doctor (Every 3 months at 09:00)"

---

### Complex Request

**User**: "Set a reminder for my medication every Monday, Wednesday, and Friday at 8am"

**ALARA**: "I've extracted the following reminder:

Title: my medication
Type: Recurring
Days: Monday, Wednesday, Friday
Time: 08:00

Is this correct? (Please confirm or let me know what to change)"

**User**: "Yes"

**ALARA**: "✅ Created recurring reminder: my medication (Monday, Wednesday, Friday at 08:00)"

---

### Unclear Input

**User**: "I need a reminder"

**ALARA**: "What would you like to be reminded about? You can say something like 'remind me to take medication in 2 weeks' or 'remind me every day at 9am'."

---

## System Time Integration

The reminder parser uses the current date/time from the injected metadata context:

```typescript
// From metadata context (injected in system prompt)
const currentDate = new Date(); // Uses system time from metadata
// Or from action data:
const currentDate = action.data?.current_date 
  ? new Date(action.data.current_date) 
  : new Date();
```

This ensures reminders are calculated based on the actual current date, not a guessed date.

## Confirmation UX

### Confirmation Modal Example

```typescript
<ReminderConfirmationModal
  visible={showConfirmation}
  confirmationData={confirmationData}
  onConfirm={async () => {
    const result = await executeReminderConfirmed(userId, confirmationData);
    if (result.success) {
      // Show success message
    }
  }}
  onReject={() => {
    // Cancel reminder creation
  }}
  onEdit={(updatedData) => {
    // Allow user to edit before confirming
  }}
/>
```

## Edge Cases

### Past Dates
**User**: "Remind me yesterday"
**ALARA**: "I can't create reminders for past dates. Please specify a future date."

### Unclear Timing
**User**: "Remind me soon"
**ALARA**: "When would you like to be reminded? You can say 'in 2 weeks', 'tomorrow', or a specific date."

### Missing Title
**User**: "in 2 weeks"
**ALARA**: "What would you like to be reminded about? For example: 'remind me to take medication in 2 weeks'."

## Files

1. **`src/lib/openrouter/reminderParser.ts`** - Natural language parser
2. **`src/lib/openrouter/reminderExecutor.ts`** - Reminder creation and confirmation
3. **`src/lib/openrouter/actionExecutors.ts`** - Action executor integration
4. **`src/lib/openrouter/actions.ts`** - System prompt instructions

## Integration

### In ALARAContext.tsx

```typescript
// Handle reminder scheduling with confirmation
if (action.type === 'schedule_reminder') {
  const result = await executeScheduleReminder(userId, action);
  
  if (result.requiresConfirmation && result.confirmationData) {
    // Show confirmation modal
    setPendingConfirmation({
      type: 'reminder',
      data: result.confirmationData,
      onConfirm: async () => {
        const confirmed = await executeReminderConfirmed(
          userId,
          result.confirmationData
        );
        // Handle result
      },
    });
  }
}
```

## Supabase Schema

```sql
CREATE TABLE reminders (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  reminder_type TEXT NOT NULL,  -- 'medication' | 'check_in' | 'appointment'
  time TIME NOT NULL,            -- '09:00' format
  days_of_week INTEGER[] NOT NULL, -- [0,1,2,3,4,5,6] (Sunday-Saturday)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Future Enhancements

- [ ] Support for "every X days" recurring reminders
- [ ] Integration with calendar apps
- [ ] Smart time suggestions based on user patterns
- [ ] Reminder templates
- [ ] Bulk reminder creation
