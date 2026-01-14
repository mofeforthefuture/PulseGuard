# ALARA Design System

A rich, warm, and modern design system for the PulseGuard/ALARA medical companion app. This design system emphasizes depth, gradients, and a friendly, reassuring aesthetic.

## 🎨 Design Philosophy

- **Warm & Modern**: Gradient-based colors create depth and visual interest
- **Medical-Safe**: High contrast, readable typography with friendly, rounded fonts
- **Alive & Dynamic**: Animated interactions with press feedback
- **Status-Aware**: Color-coded status variants (calm, reminder, concern, emergency)
- **Accessible**: Large touch targets, proper contrast ratios, semantic colors

## 📦 Installation

The design system is already integrated. To use gradients, ensure you have:

```bash
npm install expo-linear-gradient
```

## 🚀 Quick Start

```typescript
import { Button, Card, Typography, StatusBadge } from '@/components/ui';
import { Colors, Gradients, Spacing } from '@/lib/design/tokens';
```

## 🎯 Core Components

### Button

Animated buttons with gradient support and press feedback.

```tsx
import { Button } from '@/components/ui/Button';

// Primary gradient button
<Button
  title="Get Started"
  onPress={handlePress}
  variant="primary"
  size="lg"
/>

// Status-based buttons
<Button variant="calm" title="All Good" onPress={handlePress} />
<Button variant="reminder" title="Take Medication" onPress={handlePress} />
<Button variant="concern" title="Check Symptoms" onPress={handlePress} />
<Button variant="emergency" title="Emergency" onPress={handlePress} />
```

**Variants:**
- `primary` - Primary gradient (purple-blue)
- `secondary` - Secondary gradient (pink)
- `emergency` - Emergency gradient (red)
- `calm` - Calm status (green gradient)
- `reminder` - Reminder status (amber gradient)
- `concern` - Concern status (coral gradient)
- `outline` - Outlined button

**Sizes:**
- `sm` - Small
- `md` - Medium (default)
- `lg` - Large

### Card

Cards with depth, soft shadows, and gradient variants.

```tsx
import { Card } from '@/components/ui/Card';

// Default card
<Card>
  <Typography variant="h3">Card Title</Typography>
  <Typography>Card content goes here</Typography>
</Card>

// Status-based cards
<Card variant="calm" shadow="md">
  <Typography>Everything looks good!</Typography>
</Card>

<Card variant="emergency" shadow="lg">
  <Typography>Emergency information</Typography>
</Card>

// Gradient card
<Card variant="gradient" padding="lg">
  <Typography>Premium content</Typography>
</Card>
```

**Variants:**
- `default` - White surface
- `elevated` - Elevated white surface
- `calm` - Calm status gradient
- `reminder` - Reminder status gradient
- `concern` - Concern status gradient
- `emergency` - Emergency status gradient
- `gradient` - Subtle surface gradient

**Shadow Levels:**
- `sm` - Small shadow
- `md` - Medium shadow (default)
- `lg` - Large shadow
- `xl` - Extra large shadow
- `none` - No shadow

**Padding:**
- `sm` - Small padding
- `md` - Medium padding (default)
- `lg` - Large padding
- `xl` - Extra large padding

### Typography

Friendly, rounded, medical-safe typography hierarchy.

```tsx
import { Typography } from '@/components/ui/Typography';

<Typography variant="hero">Welcome</Typography>
<Typography variant="h1">Main Heading</Typography>
<Typography variant="h2">Section Heading</Typography>
<Typography variant="body">Body text</Typography>
<Typography variant="caption" color="textSecondary">
  Caption text
</Typography>
```

**Variants:**
- `hero` - Hero text (48px)
- `display` - Display text (40px)
- `h1` - Heading 1 (32px)
- `h2` - Heading 2 (24px)
- `h3` - Heading 3 (20px)
- `h4` - Heading 4 (18px)
- `body` - Body text (16px, default)
- `bodySmall` - Small body (14px)
- `caption` - Caption (12px)
- `label` - Label text (14px, medium weight)

**Colors:**
- `primary` - Primary brand color
- `secondary` - Secondary brand color
- `text` - Primary text (default)
- `textSecondary` - Secondary text
- `textLight` - Light text
- `error` - Error color
- `success` - Success color
- `warning` - Warning color

**Weights:**
- `regular` - Regular weight (400)
- `medium` - Medium weight (500)
- `semibold` - Semibold weight (600)
- `bold` - Bold weight (700)

### StatusBadge

Status-based badges with gradient support.

```tsx
import { StatusBadge } from '@/components/ui/StatusBadge';

<StatusBadge status="calm" label="All Good" />
<StatusBadge status="reminder" label="Reminder" variant="gradient" />
<StatusBadge status="concern" label="Check In" variant="solid" />
<StatusBadge status="emergency" label="Emergency" size="lg" />
```

**Status Types:**
- `calm` - Green gradient (all good)
- `reminder` - Amber gradient (reminder)
- `concern` - Coral gradient (concern)
- `emergency` - Red gradient (emergency)

**Variants:**
- `gradient` - Gradient background (default)
- `solid` - Solid color background
- `outline` - Outlined badge

**Sizes:**
- `sm` - Small
- `md` - Medium (default)
- `lg` - Large

## 🎨 Design Tokens

### Colors

```typescript
import { Colors } from '@/lib/design/tokens';

// Primary colors
Colors.primary        // #7B85FF
Colors.primaryLight   // #9BA3FF
Colors.primaryDark    // #5A64DD

// Status colors
Colors.calm           // #E8F5E9
Colors.reminder       // #FFF3E0
Colors.concern        // #FFE0E0
Colors.emergency      // #FF4757

// Neutral colors
Colors.background     // #FAFAFA
Colors.surface        // #FFFFFF
Colors.text           // #1A1A1A
Colors.textSecondary  // #6B6B6B
```

### Gradients

```typescript
import { Gradients } from '@/lib/design/tokens';

// Use with LinearGradient
<LinearGradient
  colors={[Gradients.primary.start, Gradients.primary.end]}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
>
  {/* Content */}
</LinearGradient>
```

### Spacing

```typescript
import { Spacing } from '@/lib/design/tokens';

Spacing.xs   // 4
Spacing.sm   // 8
Spacing.md   // 16
Spacing.lg   // 24
Spacing.xl   // 32
Spacing.xxl  // 48
Spacing.xxxl // 64
```

### Shadows

```typescript
import { Shadows } from '@/lib/design/tokens';

// Apply shadow styles
<View style={Shadows.md}>
  {/* Content */}
</View>

// Status-based shadows
<View style={Shadows.calm}>
  {/* Content */}
</View>
```

### Typography Tokens

```typescript
import { Typography } from '@/lib/design/tokens';

Typography.fontSize.md        // 16
Typography.lineHeight.md      // 24
Typography.fontWeight.bold    // '700'
Typography.letterSpacing.wide // 0.5
```

## 📐 Best Practices

1. **Use Status Colors Consistently**
   - `calm` - For positive, reassuring states
   - `reminder` - For reminders and notifications
   - `concern` - For warnings that need attention
   - `emergency` - Only for critical, emergency situations

2. **Typography Hierarchy**
   - Use `hero` sparingly for main CTAs
   - Use `h1`-`h4` for section headings
   - Use `body` for most content
   - Use `caption` for metadata and helper text

3. **Shadows for Depth**
   - Use `sm` for subtle elevation
   - Use `md` for standard cards
   - Use `lg` for modals and important content
   - Use status shadows for status-based components

4. **Touch Targets**
   - Minimum 44px for accessibility
   - Use `TouchTarget.comfortable` (48px) for better UX
   - Use `TouchTarget.large` (56px) for primary actions

5. **Animations**
   - Buttons automatically animate on press
   - Use `Animation.normal` (250ms) for most transitions
   - Use `Animation.spring` for natural motion

## 🎭 Examples

### Status Card with Badge

```tsx
<Card variant="calm" shadow="md" padding="lg">
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
    <StatusBadge status="calm" label="All Good" />
    <Typography variant="h3">Your health looks great!</Typography>
  </View>
  <Typography variant="body" color="textSecondary" style={{ marginTop: Spacing.sm }}>
    Keep up the good work with your daily check-ins.
  </Typography>
</Card>
```

### Emergency Button

```tsx
<Button
  variant="emergency"
  title="Call Emergency"
  onPress={handleEmergency}
  size="lg"
  fullWidth
/>
```

### Form with Typography

```tsx
<Card padding="lg">
  <Typography variant="h2" style={{ marginBottom: Spacing.md }}>
    Medical Profile
  </Typography>
  <Input
    label="Full Name"
    placeholder="Enter your name"
  />
  <Input
    label="Date of Birth"
    placeholder="MM/DD/YYYY"
    variant="elevated"
  />
  <Button
    title="Save"
    onPress={handleSave}
    variant="primary"
    style={{ marginTop: Spacing.md }}
  />
</Card>
```

## 🔄 Migration from Old Constants

If you're using the old `constants.ts` file:

```typescript
// Old
import { Colors, Spacing } from '@/lib/utils/constants';

// New (recommended)
import { Colors, Spacing } from '@/lib/design/tokens';
```

The old constants file still works but is deprecated. All new code should use the design system tokens.

## 📚 Component Index

All UI components are located in `src/components/ui/`:

- `Button.tsx` - Animated gradient buttons
- `Card.tsx` - Cards with depth and shadows
- `Typography.tsx` - Typography component
- `StatusBadge.tsx` - Status-based badges
- `Input.tsx` - Form inputs (updated to use design system)
- `SafeAreaView.tsx` - Safe area wrapper

## 🎨 Customization

To customize the design system, edit `src/lib/design/tokens.ts`. All components automatically use the updated tokens.

## 📝 Notes

- Gradients require `expo-linear-gradient` (already added to package.json)
- Typography uses system fonts by default. To use custom rounded fonts, load them via `expo-font` and update `Typography.fontFamily` in tokens
- All animations use React Native's `Animated` API for smooth performance
- Shadows work on both iOS and Android (using `elevation` for Android)
