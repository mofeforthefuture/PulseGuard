# FloatingALARA Component

A floating mascot component that provides a friendly, animated companion throughout the app. ALARA (Advanced Life-Aid Response Assistant) appears in the bottom corner of screens and provides contextual messages and feedback.

## Features

- ✅ **Always Visible** (except on emergency screen)
- ✅ **Idle Animations**: Blink and breathe animations for a living feel
- ✅ **Chat Bubble**: Expands to show messages with smooth spring animations
- ✅ **State-Based Colors**: Changes color and expression based on context
- ✅ **Smooth Animations**: Spring-based animations for natural motion
- ✅ **Calm & Friendly**: Designed to be reassuring, like Duolingo's bird but calmer

## Usage

### Basic Setup

The component is already integrated into the root layout. You just need to use the `useALARA` hook in your screens:

```tsx
import { useALARA } from '@/src/context/ALARAContext';

export default function MyScreen() {
  const { showMessage, setState } = useALARA();

  useEffect(() => {
    setState('calm');
    showMessage({
      text: "Welcome! I'm here to help.",
      duration: 5000, // Auto-dismiss after 5 seconds
    });
  }, []);

  return (
    // Your screen content
  );
}
```

### States

ALARA has several states that change its appearance:

- `idle` - Default state, primary colors
- `calm` - Green gradient, happy expression 😊
- `reminder` - Amber gradient, reminder expression ⏰
- `concern` - Coral gradient, concerned expression 🤔
- `emergency` - Red gradient, alert expression 🚨
- `thinking` - Subtle animation, thinking expression 💭

### Showing Messages

```tsx
const { showMessage, setState, hideMessage } = useALARA();

// Show a message
showMessage({
  text: "Don't forget to take your medication!",
  duration: 6000, // Auto-dismiss after 6 seconds (0 = no auto-dismiss)
  priority: 'medium', // Optional: 'low' | 'medium' | 'high'
});

// Manually hide message
hideMessage();

// Change state
setState('reminder');
```

### Common Patterns

#### Welcome Message
```tsx
useEffect(() => {
  setState('calm');
  showMessage({
    text: "Hi! I'm ALARA, your health companion.",
    duration: 6000,
  });
}, []);
```

#### Reminder
```tsx
const handleReminder = () => {
  setState('reminder');
  showMessage({
    text: "Time for your daily check-in!",
    duration: 6000,
  });
};
```

#### Concern
```tsx
const handleConcern = () => {
  setState('concern');
  showMessage({
    text: "I noticed you haven't checked in today. Everything okay?",
    duration: 8000,
  });
};
```

#### Processing/Thinking
```tsx
const handleProcessing = async () => {
  setState('thinking');
  // Do async work
  await someOperation();
  // Show result
  setState('calm');
  showMessage({
    text: "All done!",
    duration: 3000,
  });
};
```

## Animations

### Idle Animations

- **Breathing**: Subtle scale animation (1.0 to 1.05) that loops continuously
- **Blinking**: Random blinks every 2-5 seconds
- **Floating**: Gentle vertical movement

### Chat Bubble

- **Expand**: Spring animation when message appears
- **Collapse**: Spring animation when message is dismissed
- **Mascot Growth**: Mascot slightly grows (1.25x) when bubble is open

### State Transitions

- **Color Changes**: Smooth spring animation between state colors
- **Expression Changes**: Emoji changes based on state

## Positioning

The component is positioned in the bottom-right corner by default, with safe area insets respected. It automatically hides on the emergency screen.

## Customization

### Change Position

Edit `app/_layout.tsx`:

```tsx
<FloatingALARA position="bottom-left" />
```

### Hide/Show Programmatically

```tsx
const { setIsVisible } = useALARA();

// Hide ALARA
setIsVisible(false);

// Show ALARA
setIsVisible(true);
```

## Design Tokens

The component uses the design system tokens:
- Colors from `Colors` and `Gradients`
- Spacing from `Spacing`
- Border radius from `BorderRadius`
- Shadows from `Shadows`
- Animation timings from `Animation`

## Accessibility

- Mascot is touchable and can dismiss messages
- Chat bubble is dismissible by tapping
- Proper accessibility labels on images
- Respects safe area insets

## Examples

See `src/lib/alara/usage-example.tsx` for more detailed usage examples and helper functions.
