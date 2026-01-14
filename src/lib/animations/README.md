# Animation System

A comprehensive, intentional animation system for meaningful user feedback across the PulseGuard app.

## Philosophy

**Animate with intent** - Every animation serves a purpose:
- **Tap feedback** - Confirms user interaction
- **State changes** - Smooth transitions between states
- **Success states** - Rewarding visual feedback
- **Emergency transitions** - Immediate, no delays
- **List entrances** - Staggered, organized appearance

## Core Principles

1. **Every tap has feedback** - Users know their interaction was registered
2. **State changes are animated** - Smooth transitions, not jarring jumps
3. **Emergency transitions are immediate** - No delays when seconds matter
4. **Success states feel rewarding** - Celebratory animations for achievements
5. **Don't overanimate** - Animations enhance, not distract

## Animation Utilities

Located in `src/lib/animations/utils.ts`:

### Tap Feedback
- `createTapFeedback()` - Press down animation
- `createTapRelease()` - Press up animation

### Success States
- `createSuccessAnimation()` - Checkmark animation
- `createSuccessBounce()` - Scale bounce for success

### Transitions
- `createFadeIn()` / `createFadeOut()` - Smooth opacity transitions
- `createSlideIn()` / `createSlideOut()` - Slide animations
- `createImmediateTransition()` - Instant (for emergencies)

### List Animations
- `createStaggeredEntrance()` - Staggered list item animations

### Loading States
- `createLoadingPulse()` - Pulsing loading indicator

## Components with Animations

### UI Components

#### Button (`src/components/ui/Button.tsx`)
- ✅ Tap feedback (scale + opacity)
- ✅ Spring animations for natural feel
- ✅ Loading state support

#### Card (`src/components/ui/Card.tsx`)
- ✅ Tap feedback when pressable
- ✅ Scale animation on press

#### LoadingState (`src/components/ui/LoadingState.tsx`)
- ✅ Fade in animation
- ✅ Pulsing indicator animation

#### SuccessIndicator (`src/components/ui/SuccessIndicator.tsx`)
- ✅ Bounce in animation
- ✅ Checkmark scale animation
- ✅ Auto-dismiss with fade out

### Feature Components

#### LocationCard (`src/components/location/LocationCard.tsx`)
- ✅ Tap feedback (scale animation)
- ✅ Smooth press interactions

#### MedicationCard (`src/components/medication/MedicationCard.tsx`)
- ✅ Animated check-off interaction
- ✅ Celebration bounce on dose taken
- ✅ Pulsing for upcoming doses

#### EmergencySOSScreen (`src/components/emergency/EmergencySOSScreen.tsx`)
- ✅ **Immediate** entrance (0ms duration)
- ✅ Pulsing SOS button
- ✅ Contact status animations

#### MedicationTrackingScreen (`src/components/medication/MedicationTrackingScreen.tsx`)
- ✅ Staggered entrance for medication cards
- ✅ Fade + slide animations

#### EmergencyScreen (`app/(tabs)/emergency.tsx`)
- ✅ Staggered entrance for location cards
- ✅ Smooth list animations

## Animation Timing

All animations use consistent timing from design tokens:

- **Fast**: 150ms - Quick feedback
- **Normal**: 300ms - Standard transitions
- **Slow**: 500ms - Deliberate animations
- **Spring**: Natural, bouncy feel

## Emergency Considerations

Emergency screens and transitions use **immediate** animations (0ms duration):
- No delays
- Instant visual feedback
- Critical for time-sensitive situations

## Best Practices

1. **Use native driver** when possible for performance
2. **Keep animations short** - Don't make users wait
3. **Match animation to intent** - Success = bounce, error = shake
4. **Stagger list items** - 50-80ms delay between items
5. **Provide feedback** - Every interaction should have visual response

## Examples

### Adding Tap Feedback to a Component

```tsx
import { useRef } from 'react';
import { Animated, TouchableOpacity } from 'react-native';
import { createTapFeedback, createTapRelease } from '@/lib/animations/utils';

function MyComponent() {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    createTapFeedback(scaleAnim).start();
  };

  const handlePressOut = () => {
    createTapRelease(scaleAnim).start();
  };

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        {/* Content */}
      </Animated.View>
    </TouchableOpacity>
  );
}
```

### Staggered List Animation

```tsx
import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { createStaggeredEntrance } from '@/lib/animations/utils';

function MyList({ items }) {
  const anims = useRef(
    items.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const animations = createStaggeredEntrance(anims, 60);
    animations.forEach(anim => anim.start());
  }, [items.length, anims]);

  return items.map((item, index) => (
    <Animated.View
      key={item.id}
      style={{
        opacity: anims[index],
        transform: [{
          translateY: anims[index].interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0],
          }),
        }],
      }}
    >
      {/* Item content */}
    </Animated.View>
  ));
}
```

## Performance

- All animations use `useNativeDriver: true` when possible
- Transform and opacity animations are GPU-accelerated
- Color animations cannot use native driver (fallback to JS)
- List animations are optimized with staggered delays

## Future Enhancements

- Haptic feedback integration
- Reduced motion support
- Custom easing curves
- Animation presets for common patterns
