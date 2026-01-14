# ALARA Check-In

A friendly, chat-like check-in experience that feels like talking to a friend. Features speech bubbles, soft animations, emoji reactions, and celebratory micro-animations.

## Features

- ✅ **Speech Bubbles** - Chat-like interface with ALARA and user messages
- ✅ **Soft Animations** - Smooth transitions between prompts
- ✅ **Emoji Reactions** - Visual, engaging response options
- ✅ **Progress Indicators** - Clear progress bar showing completion
- ✅ **Celebratory Animations** - Fun micro-animations on completion
- ✅ **Friendly & Human** - Warm, conversational tone throughout

## Components

### ChatBubble

Speech bubble component for messages:
- ALARA messages (left side, primary gradient)
- User messages (right side, surface gradient)
- Emoji support
- Smooth entrance animations
- Tail styling for chat feel

```tsx
<ChatBubble
  message="How are you feeling?"
  isALARA={true}
  emoji="😊"
  delay={100}
/>
```

### EmojiReactionButton

Interactive emoji button for responses:
- Staggered entrance animations
- Selection state with gradient
- Celebration bounce on selection
- Press feedback animations

```tsx
<EmojiReactionButton
  emoji="😄"
  label="Great"
  onPress={handleSelect}
  isSelected={selected === 'great'}
  delay={100}
/>
```

### ALARACheckInScreen

Complete check-in flow:
- Multi-step conversation
- Progress tracking
- Auto-advancing prompts
- Celebration on completion
- Saves to Supabase

```tsx
<ALARACheckInScreen
  onComplete={handleComplete}
  onCancel={handleCancel}
/>
```

## Check-In Flow

1. **Greeting** - ALARA welcomes the user
2. **Mood** - Emoji selection for mood (great/good/okay/poor/crisis)
3. **Medication** - Yes/No for medication taken
4. **Symptoms** - Optional symptom tracking (can skip)
5. **Notes** - Optional text input for additional notes
6. **Completion** - Celebration animation and thank you message

## Animations

### Message Entrance
- Slide in from side (ALARA from left, user from right)
- Fade in
- Scale animation
- Staggered delays for multiple messages

### Emoji Reactions
- Staggered entrance (each button appears with delay)
- Selection bounce (scale up then settle)
- Press feedback (scale down then up)

### Celebration
- Confetti emojis (🎉 ✨ 🌟 💫 🎊)
- Rotating and floating animations
- Scale fade-in
- Appears on completion

## Design Principles

1. **Friendly & Human** - Conversational tone, warm colors
2. **Visual Engagement** - Emojis, gradients, animations
3. **Clear Progress** - Progress bar and step counter
4. **Smooth Flow** - Auto-advancing, natural conversation pace
5. **Celebration** - Positive reinforcement on completion

## Integration

The check-in screen:
- Sets ALARA to 'calm' state
- Shows messages in chat format
- Collects mood, medication, symptoms, notes
- Saves to `check_ins` table in Supabase
- Updates or creates check-in for current date

## Usage

Accessible from:
- Dashboard → "Check In with ALARA 💬" button
- Direct route: `/(tabs)/check-in`

## Data Structure

```typescript
interface CheckInData {
  mood?: 'great' | 'good' | 'okay' | 'poor' | 'crisis';
  symptoms?: Symptom[];
  medication_taken?: boolean;
  notes?: string;
}
```

## Notes

- Check-ins are unique per user per day (upsert logic)
- Symptoms step can be skipped
- Notes are optional
- Celebration animation plays on completion
- ALARA state automatically switches to 'calm' during check-in
