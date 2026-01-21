# Chat-Driven Hydration Logging

## Overview

ALARA can now log hydration intake from natural language conversations. Users can mention drinking water in various formats, and ALARA will extract the amount, convert it to milliliters, and save it to Supabase.

## Full Flow

```
User: "I just drank two bottles of water"
  ↓
ALARA extracts: "two bottles" → 1000ml (2 × 500ml)
  ↓
ALARA calls log_hydration tool with {amount: 1000}
  ↓
App calculates today's total (existing + new)
  ↓
App saves to Supabase (health_entries table)
  ↓
ALARA responds with encouraging feedback based on progress
```

## Natural Language Parsing

### Supported Formats

1. **Direct amounts:**
   - `"500ml"` or `"500 ml"` → 500ml
   - `"1.5 liters"` or `"1.5L"` → 1500ml
   - `"2L"` → 2000ml

2. **Number + unit:**
   - `"two bottles"` → 1000ml (2 × 500ml)
   - `"3 cups"` → 750ml (3 × 250ml)
   - `"a glass"` → 250ml
   - `"one bottle"` → 500ml

3. **Fractions:**
   - `"half a bottle"` → 250ml
   - `"quarter cup"` → 62.5ml
   - `"three-quarters of a liter"` → 750ml

### Common Conversions

| Unit | Milliliters |
|------|-------------|
| cup/glass | 250ml |
| bottle | 500ml |
| liter | 1000ml |
| mug | 350ml |
| small bottle | 330ml |
| large bottle | 750ml |

**File**: `src/lib/openrouter/hydrationParser.ts`

## Tool Calling

### OpenRouter Tool Schema

```json
{
  "name": "log_hydration",
  "arguments": {
    "amount": 500,
    "notes": "after workout"
  }
}
```

**File**: `src/lib/openrouter/tools/openrouterSchemas.ts`

## Execution Flow

### 1. Parse Tool Call

**File**: `src/context/ALARAContext.tsx`

```typescript
// OpenRouter returns tool call
{
  "function": {
    "name": "log_hydration",
    "arguments": "{\"amount\":500,\"notes\":\"after workout\"}"
  }
}

// Converted to action
{
  type: 'log_hydration',
  data: {
    amount: 500,
    notes: 'after workout'
  },
  confidence: 0.9
}
```

### 2. Execute Action

**File**: `src/lib/openrouter/actionExecutors.ts`

```typescript
executeLogHydration(userId, action)
```

### 3. Calculate Today's Total

```typescript
// Get today's date (midnight)
const today = new Date();
today.setHours(0, 0, 0, 0);
const todayStr = today.toISOString().split('T')[0];

// Fetch all today's hydration entries
const { data } = await supabase
  .from('health_entries')
  .select('data, created_at')
  .eq('user_id', userId)
  .eq('entry_type', 'vital')
  .gte('created_at', todayStr);

// Sum up amounts
const currentTotal = data.reduce((sum, entry) => {
  const entryData = entry.data;
  if (entryData?.type === 'hydration' && entryData?.amount) {
    return sum + entryData.amount;
  }
  return sum;
}, 0);

// Calculate new total
const newTotal = currentTotal + amount;
```

### 4. Save to Supabase

**Table**: `health_entries`

```sql
INSERT INTO health_entries (
  user_id,
  entry_type,
  data
) VALUES (
  'user-uuid',
  'vital',
  '{
    "type": "hydration",
    "amount": 500,
    "total": 1500,
    "timestamp": "2024-01-15T14:30:00Z"
  }'::jsonb
);
```

**Full Supabase Write:**

```typescript
const { error } = await supabase.from('health_entries').insert({
  user_id: userId,
  entry_type: 'vital',
  data: {
    type: 'hydration',
    amount: amountNum,        // e.g., 500
    total: newTotal,          // e.g., 1500 (cumulative for today)
    timestamp: new Date().toISOString(),
  },
});
```

### 5. Generate Encouraging Feedback

**File**: `src/context/ALARAContext.tsx`

```typescript
const { total, goal, progress, isGoalReached } = result.data;

// Progress-based feedback
if (isGoalReached) {
  // "Awesome! You've hit your daily goal of 2000ml! 🎉"
} else if (progress >= 75) {
  // "Almost there! You're at 75% of your goal! 🌟"
} else if (progress >= 50) {
  // "Halfway there! Keep it up! 💪"
} else if (progress >= 25) {
  // "Great start! You're at 25% of your goal."
}
```

## Example Conversations

### Simple Amount
**User**: "I drank 500ml"
**ALARA**: "Logged 500ml. (Total today: 500ml)"

### Natural Language
**User**: "Just finished two bottles"
**ALARA**: "Logged 1000ml. (Total today: 1000ml)"

### With Progress Feedback
**User**: "Had a cup of water"
**ALARA**: "Logged 250ml. Great start! You're at 12% of your goal. (Total today: 250ml)"

### Halfway Point
**User**: "Drank a liter"
**ALARA**: "Logged 1000ml. Halfway there! Keep it up! 💪 (Total today: 1000ml)"

### Goal Reached
**User**: "Finished another bottle"
**ALARA**: "Logged 500ml. Awesome! You've hit your daily goal of 2000ml! 🎉 (Total today: 2000ml)"

### Exceeding Goal
**User**: "Had another glass"
**ALARA**: "Logged 250ml. Wow, you're crushing it! Over 112% of your goal! 💧✨ (Total today: 2250ml)"

## Database Schema

### health_entries Table

```sql
CREATE TABLE health_entries (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  entry_type TEXT,  -- 'vital' for hydration
  data JSONB,       -- Contains hydration data
  created_at TIMESTAMP WITH TIME ZONE
);
```

### Data Structure

```json
{
  "type": "hydration",
  "amount": 500,
  "total": 1500,
  "timestamp": "2024-01-15T14:30:00Z"
}
```

## Edge Cases

### Unclear Amount
**User**: "I drank some water"
**ALARA**: "I couldn't figure out how much you drank. Could you tell me the amount? Like '500ml' or 'two bottles'?"

### Invalid Amount
**User**: "I drank 50000ml"
**ALARA**: "That amount seems too high (max 10000ml). Could you double-check?"

### No Amount Specified
**User**: "I'm drinking water"
**ALARA**: "How much did you drink? You can say it like '500ml' or 'two bottles'."

## Encouraging Feedback Rules

1. **25% (500ml)**: "Great start! You're at 25% of your goal."
2. **50% (1000ml)**: "Halfway there! Keep it up! 💪"
3. **75% (1500ml)**: "Almost there! You're at 75% of your goal! 🌟"
4. **100% (2000ml)**: "Awesome! You've hit your daily goal of 2000ml! 🎉"
5. **>100%**: "Wow, you're crushing it! Over X% of your goal! 💧✨"

**Important**: Feedback is encouraging but not pushy. ALARA celebrates progress naturally without nagging.

## Files Modified

1. **`src/lib/openrouter/hydrationParser.ts`** - Natural language parser
2. **`src/lib/openrouter/actionExecutors.ts`** - Hydration executor
3. **`src/lib/openrouter/actions.ts`** - Action type and instructions
4. **`src/lib/openrouter/client.ts`** - Tool calling support
5. **`src/context/ALARAContext.tsx`** - Tool call handling and feedback
6. **`src/lib/openrouter/tools/executor.ts`** - Tool executor integration

## Testing

### Test Cases

1. ✅ "500ml" → 500ml
2. ✅ "two bottles" → 1000ml
3. ✅ "a cup" → 250ml
4. ✅ "1.5 liters" → 1500ml
5. ✅ "half a bottle" → 250ml
6. ✅ "three glasses" → 750ml
7. ✅ Progress feedback at 50%, 75%, 100%
8. ✅ Today's total calculation
9. ✅ Supabase write with correct structure

## Future Enhancements

- [ ] Support for other beverages (coffee, tea, juice)
- [ ] Custom daily goals per user
- [ ] Weekly/monthly hydration trends
- [ ] Reminder system integration
- [ ] Hydration streaks and achievements
