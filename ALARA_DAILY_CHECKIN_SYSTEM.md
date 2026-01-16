# ALARA Daily Check-In System

## Overview

ALARA now proactively asks for daily health updates in a natural, conversational way. It tracks medications, doctor visits, and mood, bringing these topics up naturally during conversations.

## Features

### 1. Daily Check-In Tracking

**File**: `src/lib/openrouter/checkInTracker.ts`

- Tracks when ALARA last asked for a check-in
- Determines what data is missing:
  - Mood/feeling status
  - Medication compliance
  - Doctor visits (weekly check)
- Calculates days since last check-in

### 2. Natural Conversation Integration

ALARA doesn't make check-ins feel like a checklist. Instead:

- **Weaves questions naturally** into conversations
- **Asks at appropriate times** (not every message)
- **Uses personality-appropriate language**
- **Follows up on previous conversations**

### 3. What ALARA Tracks

#### Daily Check-Ins
- **Mood/Feeling**: "How are you feeling today?"
- **Medications**: "Have you taken your medications?"
- **Doctor Visits**: "Have you visited the doctor lately?" (weekly)

#### Data Storage
- **Check-ins**: Stored in `check_ins` table
- **Medications**: Logged via `log_medication` action
- **Doctor Visits**: Logged via `log_doctor_visit` action (new)
- **Mood**: Updated via `update_mood` or `create_check_in` actions

### 4. System Integration

#### Context Builder
- Checks check-in status before each conversation
- Includes check-in reminders in context when needed
- Provides missing data information to ALARA

#### System Prompts
- All personality modes include check-in instructions
- Instructions emphasize natural conversation flow
- Prevents robotic checklist behavior

#### Actions
- `log_doctor_visit`: New action for tracking doctor visits
- `create_check_in`: Updates daily check-in records
- `update_mood`: Quick mood updates
- `log_medication`: Medication compliance tracking

## How It Works

### Check-In Detection

```typescript
// Checks if user needs a check-in
const checkInStatus = await checkIfCheckInNeeded(userId);

// Returns:
{
  needsCheckIn: boolean,
  lastCheckInDate?: string,
  daysSinceLastCheckIn: number,
  missingData: {
    mood: boolean,
    medications: boolean,
    doctorVisit: boolean
  }
}
```

### Natural Prompting

ALARA receives context like:
```
Check-in reminder: You haven't checked in today. 
Consider naturally asking about: mood/feeling, medications. 
Work this into the conversation naturally, not as a checklist.
```

### Example Conversations

**Friendly Personality:**
- User: "Hey ALARA"
- ALARA: "Hey! How's it going? How are you feeling today? 😊"

**Sassy Personality:**
- User: "Just chilling"
- ALARA: "Cool, but real talk - did you take your meds today? 😏"

**Caring Personality:**
- User: "I'm okay"
- ALARA: "Glad to hear! Just checking - have you taken your medications? Want to make sure you're staying on track 💙"

## Database Schema

### Check-Ins Table
```sql
check_ins (
  id UUID,
  user_id UUID,
  date DATE,
  mood TEXT, -- great, good, okay, poor, crisis
  symptoms JSONB,
  medication_taken BOOLEAN,
  notes TEXT
)
```

### Health Entries (Doctor Visits)
```sql
health_entries (
  id UUID,
  user_id UUID,
  entry_type TEXT, -- 'note' for doctor visits
  data JSONB {
    visit_type: string,
    notes: string,
    visit_date: string,
    source: 'ai_inferred'
  }
)
```

## Configuration

### Check-In Frequency
- **Daily**: Mood and medications checked daily
- **Weekly**: Doctor visits checked weekly (7+ days)
- **Natural Timing**: Questions appear naturally in conversation, not forced

### Personality Adaptation
Each personality mode asks differently:
- **Friendly**: Warm, casual check-ins
- **Sassy**: Direct, playful reminders
- **Rude**: No-nonsense, straight to the point
- **Fun Nurse**: Energetic, health-focused
- **Professional**: Knowledgeable, caring
- **Caring**: Gentle, supportive

## Files Modified/Created

### New Files
1. `src/lib/openrouter/checkInTracker.ts` - Check-in tracking logic

### Modified Files
1. `src/lib/openrouter/client.ts` - Added check-in instructions to personality prompts
2. `src/lib/openrouter/contextBuilder.ts` - Integrated check-in status into context
3. `src/lib/openrouter/actions.ts` - Added `log_doctor_visit` action type
4. `src/lib/openrouter/actionExecutors.ts` - Added `executeLogDoctorVisit` function

## Usage

The system works automatically:

1. **User chats with ALARA**
2. **System checks** if check-in is needed
3. **ALARA naturally asks** about missing data during conversation
4. **User responds** with information
5. **ALARA saves** data via actions
6. **System tracks** what's been collected

## Benefits

✅ **Natural Conversations**: Doesn't feel like a medical questionnaire  
✅ **Proactive Health Tracking**: Ensures important data is collected  
✅ **Personality-Aware**: Each personality asks in their own style  
✅ **Non-Intrusive**: Questions appear naturally, not forced  
✅ **Comprehensive**: Tracks mood, medications, and doctor visits  
✅ **Automatic**: No manual setup required  

## Future Enhancements

- Customizable check-in frequency per user
- Reminder notifications for missed check-ins
- Health trend analysis based on check-in data
- Integration with medication reminders
- Doctor visit appointment tracking
