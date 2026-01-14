# Medication Tracking

An engaging medication tracking system with visual cards, timeline views, and animated interactions.

## Features

- ✅ **Medication Cards** - Rich cards with icons, progress bars, and status indicators
- ✅ **Timeline View** - Visual timeline showing all doses throughout the day
- ✅ **Animated Check-off** - Satisfying spring animations when marking doses as taken
- ✅ **Color States** - Visual feedback with gradient colors for taken/missed/pending
- ✅ **No Lists** - Card-based layout, not table or list style

## Components

### MedicationCard

Rich medication card showing:
- Medication icon (auto-detected or custom)
- Name and dosage
- Progress bar showing completion
- Next dose information
- Completion badge when all doses taken
- Pulsing animation for upcoming doses

```tsx
<MedicationCard
  medication={medication}
  onDoseToggle={handleDoseToggle}
/>
```

### TimelineView

Visual timeline showing all doses:
- Chronological layout with connecting lines
- Color-coded status (taken/missed/pending/upcoming)
- Current time highlighting
- Animated check-off interaction
- Taken time display

```tsx
<TimelineView
  doses={allDoses}
  onDoseToggle={handleDoseToggle}
/>
```

### MedicationTrackingScreen

Complete tracking screen with:
- Summary statistics
- Timeline view
- Medication cards
- Empty state

```tsx
<MedicationTrackingScreen
  medications={medications}
  onDoseTaken={handleDoseTaken}
/>
```

## Color States

### Medication Cards
- **All Taken**: Green gradient (success)
- **Partially Taken**: Amber gradient (reminder)
- **Not Started**: Surface gradient (neutral)

### Timeline Doses
- **Taken**: Green gradient (success) ✓
- **Missed**: Coral gradient (concern) ✕
- **Upcoming**: Amber gradient (reminder) ⏰
- **Pending**: Surface gradient (neutral) ○

## Animations

### Check-off Animation
When a dose is marked as taken:
1. Card scales down (0.95)
2. Bounces up (1.08) with checkmark scale
3. Settles back (1.0)
4. Color transitions to success gradient

### Pulse Animation
- Upcoming doses pulse subtly
- Medication cards with upcoming doses pulse
- Current time doses have enhanced glow

## Usage

The medication tracking screen is accessible from:
- Dashboard → "Medications 💊" button
- Tab navigation → Medications tab

## Data Flow

1. Medications are loaded from `medical_profiles.medications` (JSONB)
2. Doses are generated based on frequency:
   - "once" → 1 dose
   - "twice" → 2 doses (9 AM, 9 PM)
   - "three" → 3 doses (8 AM, 2 PM, 8 PM)
3. Dose status is calculated based on current time
4. When marked as taken, saved to `health_entries` table

## Status Calculation

- **Upcoming**: Within 30 minutes of scheduled time
- **Pending**: Future dose, not yet due
- **Missed**: Past dose, not taken (after 1 hour window)
- **Taken**: Successfully marked as taken

## Integration

The screen automatically:
- Loads medications from user's medical profiles
- Generates daily doses based on frequency
- Calculates status for each dose
- Saves dose tracking to health_entries
- Updates UI with animations

## Design Principles

1. **Engaging, Not Clinical** - Warm colors, friendly animations
2. **Visual Feedback** - Immediate response to actions
3. **Clear Status** - Color coding makes status obvious
4. **Card-Based** - No tables or lists, everything is a card
5. **Timeline Visualization** - See the whole day at a glance
