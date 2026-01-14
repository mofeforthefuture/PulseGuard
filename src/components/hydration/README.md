# Hydration Tracking

A visual, engaging hydration tracking system with animated water level indicators, gentle reminder glows, and positive reinforcement.

## Features

- ✅ **Visual Water Level Indicator** - Animated bottle/glass showing water level
- ✅ **Animated Fill** - Smooth spring animations when user drinks
- ✅ **Gentle Glow** - Soft pulsing glow for reminders
- ✅ **Positive Reinforcement** - Celebration animations and encouraging messages
- ✅ **No Numeric-Only UI** - Everything is visual and engaging

## Components

### WaterLevelIndicator

Visual water bottle indicator:
- Animated fill based on current amount
- Water gradient that changes color with progress
- Ripple effects when drinking
- Goal marker line
- Reminder glow effect
- Multiple sizes (sm, md, lg)

```tsx
<WaterLevelIndicator
  currentAmount={1500}
  goalAmount={2000}
  showGlow={showReminder}
  size="lg"
/>
```

### DrinkButton

Quick drink action buttons:
- Staggered entrance animations
- Success checkmark on press
- Press feedback animations
- Icon and amount display

```tsx
<DrinkButton
  amount={250}
  label="Glass"
  icon="🥛"
  onPress={handleDrink}
  delay={100}
/>
```

### HydrationTrackingScreen

Complete hydration tracking screen:
- Large water level indicator
- Progress card with percentage
- Quick drink buttons
- Completion celebration
- Tips card

```tsx
<HydrationTrackingScreen
  onDrink={handleDrink}
  currentAmount={1500}
  goalAmount={2000}
  showReminder={false}
/>
```

## Visual Features

### Water Level Indicator

- **Bottle Shape**: Rounded rectangle with cap
- **Animated Fill**: Smooth spring animation fills from bottom
- **Water Gradient**: Color changes based on progress:
  - Low (<50%): Light blue
  - Medium (50-75%): Standard blue
  - High (75-99%): Medium blue
  - Complete (100%): Bright blue
- **Water Surface**: Animated shimmer effect at top
- **Ripple Effect**: Expanding ripple when drinking
- **Goal Marker**: Visual line showing goal level

### Reminder Glow

- **Gentle Pulse**: Soft, pulsing glow around indicator
- **Primary Color**: Uses primary brand color
- **Non-Intrusive**: Subtle enough not to be annoying
- **Auto-Dismiss**: Can be configured to hide after time

### Positive Reinforcement

1. **Progress Messages**:
   - 50%: "💪 Halfway there! Keep it up!"
   - 75%: "🌟 Almost there! You're doing great!"

2. **Goal Celebration**:
   - Particle animation with emojis (💧 ✨ 🌟 💫 🎉 🎊)
   - Scale and fade animations
   - Completion card with congratulations

3. **Visual Feedback**:
   - Success checkmark on drink buttons
   - Ripple effect in water indicator
   - Progress bar updates smoothly

## Animations

### Fill Animation
- Spring animation for smooth fill
- Interpolates from 0% to current percentage
- Color transitions based on level

### Ripple Effect
- Triggers when amount increases
- Expanding circle from center
- Fades out smoothly

### Reminder Glow
- Continuous loop animation
- Opacity pulses between 0.3 and 0.8
- 2 second cycle

### Celebration
- 12 particles with different trajectories
- Rotating and floating animations
- Staggered timing for visual interest

## Integration

The hydration screen:
- Loads today's hydration data from `health_entries`
- Saves each drink as a `vital` entry type
- Tracks cumulative amount for the day
- Shows reminders when needed
- Celebrates goal completion

## Usage

Accessible from:
- Dashboard → "Hydration 💧" button
- Tab navigation → Hydration tab

## Data Structure

Hydration entries are stored in `health_entries`:
```json
{
  "type": "hydration",
  "amount": 250,
  "total": 1500,
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## Design Principles

1. **Visual First** - Water level is the primary indicator
2. **Engaging** - Animations make tracking fun
3. **Positive** - Encouraging messages and celebrations
4. **Gentle Reminders** - Soft glow, not pushy
5. **No Numbers Only** - Visual representation is primary

## Notes

- Default goal is 2000ml (2L) per day
- Reminders can be configured (currently every 2 hours)
- Each drink is saved individually for history
- Celebration only shows once per goal achievement
- Water color changes provide visual progress feedback
