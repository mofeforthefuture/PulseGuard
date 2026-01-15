# Theme Migration Guide

## Overview

Dark mode theming has been implemented across the app. All components should use the `useColors()` hook to get theme-aware colors.

## Migration Pattern

### Before (Static Colors)
```tsx
import { Colors } from '../../lib/design/tokens';

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    color: Colors.text,
  },
});
```

### After (Theme-Aware)
```tsx
import { useColors } from '../../lib/design/useColors';

function MyComponent() {
  const colors = useColors();
  
  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.text }}>Hello</Text>
    </View>
  );
}
```

## Components Already Updated

✅ **UI Components:**
- `SafeAreaView` - Uses theme colors
- `Card` - Uses theme colors
- `Button` - Uses theme colors
- `Typography` - Uses theme colors
- `Input` - Uses theme colors
- `Toggle` - Uses theme colors
- `LoadingState` - Uses theme colors
- `SuccessIndicator` - Uses theme colors
- `StatusBadge` - Uses theme colors
- `SettingsItem` - Uses theme colors
- `SettingsSection` - Uses theme colors

✅ **Feature Components:**
- `ChatBubble` - Uses theme colors
- `ALARAChatScreen` - Uses theme colors

✅ **Screens:**
- `Dashboard` (index.tsx) - Uses Typography component
- `History` - Uses Typography component
- `Profile` - Fully theme-aware
- `Check-in` - Uses theme colors
- `First Responder` - Uses theme colors

## Components Still Using Static Colors

The following components still reference `Colors` directly and should be migrated:

### Feature Components:
- `FirstResponderModeScreen` - Uses Colors.warning, Colors.error, Colors.info, Colors.surface, Colors.background
- `EmergencySOSScreen` - Uses Colors.textSecondary, Colors.warning, Colors.success, Colors.error, Colors.emergency
- `MedicationTrackingScreen` - Uses Colors.error, Colors.border
- `MedicationCard` - Uses Colors.success, Colors.warning, Colors.border, Colors.surface
- `TimelineView` - Uses Colors.success, Colors.error, Colors.border, Colors.warning, Colors.surface, Colors.text
- `HydrationTrackingScreen` - Uses Colors.success, Colors.primary, Colors.border
- `WaterLevelIndicator` - Uses Colors.primary, Colors.border, Colors.surface, Colors.warning
- `DrinkButton` - Uses Colors.success, Colors.text
- `LocationCard` - Uses Colors.primary, Colors.surface, Colors.border, Colors.success
- `LocationMapView` - May use Colors
- `AddLocationCircleModal` - Uses Colors.textLight, Colors.surface, Colors.text, Colors.border
- `EditLocationCircleModal` - Uses Colors.textLight, Colors.surface, Colors.text, Colors.border
- `FloatingALARA` - Uses Colors from tokens

## Quick Migration Steps

1. **Import useColors hook:**
   ```tsx
   import { useColors } from '../../lib/design/useColors';
   ```

2. **Call hook in component:**
   ```tsx
   function MyComponent() {
     const colors = useColors();
     // ... rest of component
   }
   ```

3. **Replace static Colors references:**
   - `Colors.background` → `colors.background`
   - `Colors.surface` → `colors.surface`
   - `Colors.text` → `colors.text`
   - `Colors.textSecondary` → `colors.textSecondary`
   - `Colors.border` → `colors.border`
   - etc.

4. **Move dynamic styles out of StyleSheet.create:**
   ```tsx
   // Instead of:
   const styles = StyleSheet.create({
     container: {
       backgroundColor: Colors.background, // ❌ Static
     },
   });
   
   // Use:
   const styles = StyleSheet.create({
     container: {}, // Base styles only
   });
   
   // In component:
   <View style={[styles.container, { backgroundColor: colors.background }]} />
   ```

## Theme Colors Available

All colors from `LightColors` and `DarkColors` are available via `useColors()`:

- `colors.primary`, `colors.primaryLight`, `colors.primaryDark`
- `colors.secondary`, `colors.secondaryLight`, `colors.secondaryDark`
- `colors.background`, `colors.surface`, `colors.surfaceElevated`
- `colors.text`, `colors.textSecondary`, `colors.textLight`, `colors.textDisabled`
- `colors.border`, `colors.borderLight`, `colors.divider`
- `colors.success`, `colors.warning`, `colors.error`, `colors.info`
- `colors.calm`, `colors.reminder`, `colors.concern`, `colors.emergency`

## Status Colors

Status colors (calm, reminder, concern, emergency) are theme-aware but maintain their semantic meaning:
- Light mode: Lighter, softer variants
- Dark mode: Darker, more muted variants

## Notes

- Semantic colors (success, error, warning) remain consistent across themes
- Primary and secondary colors remain the same (brand colors)
- Status colors adapt to theme but maintain their meaning
- All neutral colors (background, surface, text, border) fully adapt
