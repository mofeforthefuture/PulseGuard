# Daily Activity Tracking Feature

## Overview

A FLO-inspired daily step tracking feature with soft, calm gradient UI that tracks steps and displays weekly trends.

## Database Schema

### New Table: `activity_logs`

```sql
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  date DATE NOT NULL,
  steps_count INTEGER NOT NULL DEFAULT 0,
  activity_notes TEXT,
  source TEXT CHECK (source IN ('device', 'manual')) DEFAULT 'manual',
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(user_id, date)
);
```

**Fields:**
- `id`: Primary key (UUID)
- `user_id`: Foreign key to profiles
- `date`: Date of activity (YYYY-MM-DD)
- `steps_count`: Number of steps taken
- `activity_notes`: Optional notes about the activity
- `source`: 'device' or 'manual' (default: 'manual')
- `created_at`, `updated_at`: Timestamps

**Indexes:**
- `idx_activity_logs_user_id`: For user queries
- `idx_activity_logs_date`: For date queries
- `idx_activity_logs_user_date`: Composite for user + date queries

**RLS Policies:**
- Users can only view/insert/update/delete their own activity logs

## Setup Instructions

### 1. Run Database Schema

Execute the SQL file in Supabase SQL Editor:

```bash
# File: supabase/activity_logs_schema.sql
```

### 2. Component Usage

The `ActivityCard` component is already integrated into the Dashboard (`app/(tabs)/index.tsx`).

## Features

### ✅ Daily Step Tracking
- Manual entry of step count
- Optional activity notes
- Auto-saves to database
- Tracks source (device/manual)

### ✅ FLO-Inspired UI
- Soft gradient background (calm green)
- Rounded card design
- Large, readable step display
- Clean, minimal interface

### ✅ Weekly Trend
- Simple bar chart visualization
- Shows last 7 days
- Weekly average calculation
- No complex charts (MVP-friendly)

### ✅ Graceful Permissions Handling
- Works without device permissions
- Manual entry always available
- Future: Device integration ready

## Component Structure

```
src/
├── components/
│   └── activity/
│       └── ActivityCard.tsx      # Main UI component
├── lib/
│   └── services/
│       └── activityService.ts    # Database operations
└── types/
    └── activity.ts                # TypeScript types
```

## Usage

### ActivityCard Component

```tsx
import { ActivityCard } from '@/components/activity/ActivityCard';

<ActivityCard />
```

The component:
- Automatically loads today's activity
- Shows weekly trend
- Allows editing/saving steps
- Handles all database operations

### Service Functions

```typescript
import {
  getTodayActivity,
  saveActivityLog,
  getWeeklyActivityTrend,
  getActivityStats,
} from '@/lib/services/activityService';

// Get today's activity
const activity = await getTodayActivity(userId);

// Save activity
await saveActivityLog(userId, 5000, 'Morning walk', 'manual');

// Get weekly trend
const trend = await getWeeklyActivityTrend(userId);

// Get stats
const stats = await getActivityStats(userId);
```

## UI Design

### Card Style
- **Gradient**: Calm green (`Gradients.calm`)
- **Border Radius**: Extra large (`BorderRadius.xl`)
- **Shadow**: Medium depth
- **Padding**: Large spacing

### Typography
- **Title**: "Today's Movement" (H3, semibold)
- **Steps**: Large display number (48px, bold)
- **Labels**: Body text, secondary color

### Weekly Trend
- Simple bar chart
- 7 bars (one per day)
- Proportional height
- Day numbers below bars

## Future Enhancements

1. **Device Integration**
   - iOS HealthKit integration
   - Android Google Fit integration
   - Automatic step syncing

2. **Enhanced Tracking**
   - Distance calculation
   - Calories burned
   - Active minutes

3. **Advanced Visualizations**
   - Monthly trends
   - Goal setting
   - Achievement badges

4. **ALARA Integration**
   - Natural check-ins about activity
   - Encouragement messages
   - Goal reminders

## Files Created

1. `supabase/activity_logs_schema.sql` - Database schema
2. `src/types/activity.ts` - TypeScript types
3. `src/lib/services/activityService.ts` - Service functions
4. `src/components/activity/ActivityCard.tsx` - UI component

## Files Modified

1. `app/(tabs)/index.tsx` - Added ActivityCard to dashboard
