# Daily Health Summary Generator

## Overview

The daily health summary provides ALARA with current health context for better awareness. It includes last BP reading, today's hydration, upcoming appointments, and recent check-ins. All queries use `user_id` for RLS safety and user isolation.

## Data Included

1. **Last Blood Pressure Reading**
   - Systolic/Diastolic values
   - Date recorded
   - Abnormal flag and reason (if applicable)

2. **Hydration Today**
   - Total milliliters consumed
   - Goal (default 2000ml)
   - Progress percentage
   - Status indicator

3. **Upcoming Appointments**
   - Next 5 appointments (within 7 days)
   - Title, scheduled date
   - Days until appointment
   - Status

4. **Recent Check-ins**
   - Last 3 check-ins (within 7 days)
   - Date, mood, medication status
   - Symptom count

## RLS Safety

All queries use `user_id` for Row Level Security:

```typescript
// Example: Blood pressure query
.eq('user_id', userId) // RLS enforces user isolation

// Example: Hydration query
.eq('user_id', userId) // RLS enforces user isolation

// Example: Appointments query
.eq('user_id', userId) // RLS enforces user isolation

// Example: Check-ins query
.eq('user_id', userId) // RLS enforces user isolation
```

**All queries are isolated by user_id** - no cross-user data leakage possible.

## System Prompt Injection

The summary is automatically injected into the AI system prompt:

```
DAILY HEALTH SUMMARY:

📊 Last Blood Pressure: 120/80 on Jan 15 (normal)
💧 Hydration Today: 1500ml / 2000ml (75%) - 🌟 Almost there!
📅 Upcoming Appointments:
  - Annual checkup: Jan 20 (in 5 days)
  - Follow-up: Jan 25 (in 10 days)
📝 Recent Check-ins:
  - Jan 15, mood: good, medication taken
  - Jan 14, mood: okay, medication taken
```

## Example Summary Output

### Full Summary

```
DAILY HEALTH SUMMARY:

📊 Last Blood Pressure: 140/90 on Jan 10 (high_systolic)
💧 Hydration Today: 2000ml / 2000ml (100%) - ✅ Goal reached!

📅 Upcoming Appointments:
  - Annual checkup: Jan 20 (in 5 days)
  - Follow-up appointment: Jan 25 (in 10 days)

📝 Recent Check-ins:
  - Jan 15, mood: good, medication taken
  - Jan 14, mood: okay, medication taken, 2 symptom(s)
  - Jan 13, mood: great, medication taken
```

### Minimal Summary (No Data)

```
DAILY HEALTH SUMMARY:

📊 Last Blood Pressure: No readings yet
💧 Hydration Today: 0ml / 2000ml (0%) - Just starting
📅 Upcoming Appointments: None scheduled
📝 Recent Check-ins: None in the last 7 days
```

## Usage

### In Context Builder

**File**: `src/lib/openrouter/contextBuilder.ts`

```typescript
// Load daily health summary
let dailyHealthSummary: string | undefined;
try {
  dailyHealthSummary = await getFormattedDailyHealthSummary(userId);
} catch (error) {
  console.warn('[Context] Error loading daily health summary (non-critical):', error);
}

// Add to context
return {
  // ... other context
  dailyHealthSummary,
};
```

### In System Prompt

**File**: `src/lib/openrouter/contextBuilder.ts`

```typescript
// Daily health summary (injected for better context awareness)
if (context.dailyHealthSummary) {
  parts.push(`\n${context.dailyHealthSummary}`);
}
```

## Query Examples

### Blood Pressure Query

```typescript
const { data, error } = await supabase
  .from('blood_pressure_logs')
  .select('*')
  .eq('user_id', userId) // RLS safety
  .order('recorded_at', { ascending: false })
  .limit(1)
  .single();
```

### Hydration Query

```typescript
const today = new Date();
today.setHours(0, 0, 0, 0);
const todayStr = today.toISOString().split('T')[0];

const { data, error } = await supabase
  .from('health_entries')
  .select('data, created_at')
  .eq('user_id', userId) // RLS safety
  .eq('entry_type', 'vital')
  .gte('created_at', todayStr);
```

### Appointments Query

```typescript
const { data, error } = await supabase
  .from('appointments')
  .select('*')
  .eq('user_id', userId) // RLS safety
  .in('status', ['scheduled', 'confirmed'])
  .gte('scheduled_at', today)
  .order('scheduled_at', { ascending: true })
  .limit(5);
```

### Check-ins Query

```typescript
const cutoffDate = new Date();
cutoffDate.setDate(cutoffDate.getDate() - 7);
const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

const { data, error } = await supabase
  .from('check_ins')
  .select('*')
  .eq('user_id', userId) // RLS safety
  .gte('date', cutoffDateStr)
  .order('date', { ascending: false })
  .limit(3);
```

## Performance

- **Parallel Queries**: All data fetched in parallel using `Promise.all()`
- **Limited Results**: Only fetches necessary data (5 appointments, 3 check-ins)
- **Error Handling**: Graceful degradation - returns empty summary on error
- **Non-Blocking**: Summary loading doesn't block AI response generation

## Files

1. **`src/lib/services/dailyHealthSummary.ts`** - Summary generator
2. **`src/lib/openrouter/contextBuilder.ts`** - Context integration
3. **`src/lib/openrouter/client.ts`** - System prompt injection

## RLS Policies

All tables have RLS enabled with user isolation:

```sql
-- Example RLS policy
CREATE POLICY "Users can view own data"
  ON public.blood_pressure_logs
  FOR SELECT
  USING (auth.uid() = user_id);
```

This ensures:
- ✅ Users can only see their own data
- ✅ No cross-user data access
- ✅ Database-level security enforcement
- ✅ All queries automatically filtered by user_id

## Future Enhancements

- [ ] Cache summary for a few minutes to reduce database queries
- [ ] Add medication adherence tracking
- [ ] Include activity/steps data
- [ ] Add trend indicators (improving/declining)
- [ ] Support custom summary sections
