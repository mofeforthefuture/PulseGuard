# Emergency SOS Screen

A cinematic, full-screen emergency interface that feels urgent but controlled. Designed to provide immediate emergency response with visual feedback and clear status indicators.

## Features

- ✅ **Full-Screen Gradient** - Immersive emergency gradient background
- ✅ **Pulsing SOS Button** - Large, animated button with pulsing glow effect
- ✅ **ALARA Integration** - Automatically switches ALARA to emergency state
- ✅ **Active Location Highlighting** - Shows current location circle if active
- ✅ **Contact Status Cards** - Real-time feedback on call/text progress
- ✅ **Instant Feedback** - Visual indicators for each contact action
- ✅ **Cinematic Design** - Serious, urgent feel without being overwhelming

## Usage

```tsx
import { EmergencySOSScreen } from '@/src/components/emergency';

<EmergencySOSScreen
  onCancel={() => setShowSOS(false)}
  emergencyContacts={[
    {
      id: '1',
      name: 'Mom',
      phone: '+1234567890',
      relationship: 'Emergency Contact',
    },
  ]}
  activeLocationCircle={activeCircle}
  userLocation={userLocation}
/>
```

## Props

### EmergencySOSScreenProps

- `onCancel: () => void` - Callback when user cancels/leaves SOS screen
- `emergencyContacts: EmergencyContact[]` - Array of emergency contacts to notify
- `activeLocationCircle?: LocationCircleWithContacts` - Currently active location circle (optional)
- `userLocation?: { latitude: number; longitude: number }` - User's current location (optional)

### EmergencyContact

```tsx
interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship?: string;
}
```

## Behavior

### Activation Flow

1. **User taps panic button** on emergency screen
2. **Confirmation alert** appears
3. **SOS screen activates** with full-screen gradient
4. **ALARA switches to emergency state** automatically
5. **Contacts are called sequentially** with visual feedback
6. **SMS is sent** to all contacts with location
7. **Status updates** show progress for each contact

### Contact Status States

- `pending` - Contact not yet processed
- `calling` - Currently attempting to call
- `texting` - Sending SMS message
- `success` - Successfully contacted
- `failed` - Failed to contact

### Animations

- **SOS Button Pulse**: Continuous scale and opacity animation
- **Outer Glow**: Expanding glow effect around button
- **Screen Entrance**: Slide-in and fade animation
- **Status Updates**: Smooth transitions between states

## Design Principles

1. **Urgent but Controlled**: Red gradient conveys urgency, but layout remains clear
2. **Cinematic**: Full-screen experience with dramatic animations
3. **Clear Feedback**: Every action shows immediate visual response
4. **Accessible**: Large touch targets, high contrast, clear typography
5. **Reassuring**: Status indicators show that help is being contacted

## Integration

The SOS screen is automatically triggered from the emergency screen when the panic button is activated. It:

1. Collects emergency contacts from:
   - User profile (primary emergency contact)
   - Active location circle contacts
2. Gets current location if available
3. Shows active location circle if one is selected
4. Automatically calls and texts all contacts

## Customization

### Colors

The screen uses the emergency gradient from the design system:
- `Gradients.emergency.start` - Bright red
- `Gradients.emergency.end` - Lighter red
- `Colors.emergencyDark` - Dark red for depth

### Button Size

The SOS button is 240x240 pixels with a 120px border radius for a perfect circle.

### Animation Timing

- Pulse: 1000ms per cycle
- Glow: 1500ms per cycle
- Entrance: 250ms (Animation.normal)

## Notes

- The screen uses `expo-sms` for sending emergency messages
- Phone calls use `Linking.openURL('tel:...')` to open the dialer
- Location is included in SMS messages as a Google Maps link
- ALARA automatically switches to emergency state and shows a message
- The screen can be cancelled before activation, but once active, contacts are being notified
