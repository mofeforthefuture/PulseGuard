# Location Circles Feature

A rich, playful UI for managing location-based safe zones that alert emergency contacts when users enter or exit designated areas.

## Features

- ✅ **Interactive Map** with soft overlays and location circles
- ✅ **Rich Location Cards** with gradients, icons, and contact avatars
- ✅ **Active Location Glow** - subtle pulsing animation for active circles
- ✅ **Playful Add/Edit Flows** - engaging UI that feels like a game, not a form
- ✅ **Contact Integration** - see which contacts are associated with each circle

## Components

### LocationMapView

Interactive map component that displays location circles with:
- Soft gradient overlays
- Animated circles with radius visualization
- Active circle glow effect
- Tap to select circles

```tsx
<LocationMapView
  locationCircles={circles}
  activeCircleId={activeId}
  onCirclePress={handlePress}
  userLocation={userLocation}
  initialRegion={region}
/>
```

### LocationCard

Rich card component displaying location information:
- Gradient backgrounds based on state
- Icon selection (emoji-based)
- Contact avatars with overlap styling
- Active state indicator with glow
- Edit button for quick access

```tsx
<LocationCard
  locationCircle={circle}
  isActive={isActive}
  onPress={handlePress}
  onEdit={handleEdit}
/>
```

### AddLocationCircleModal

Playful modal for creating new location circles:
- Icon picker with visual grid
- Radius selector with emoji indicators
- Current location integration
- Smooth spring animations
- Gradient cards for each input section

```tsx
<AddLocationCircleModal
  visible={visible}
  onClose={handleClose}
  onSave={handleSave}
  initialLocation={userLocation}
/>
```

### EditLocationCircleModal

Similar playful UI for editing existing circles:
- Pre-filled with existing data
- Delete functionality
- Same engaging interactions as add flow

```tsx
<EditLocationCircleModal
  visible={visible}
  onClose={handleClose}
  onSave={handleSave}
  onDelete={handleDelete}
  locationCircle={circle}
/>
```

## Setup

### 1. Install Dependencies

```bash
npm install react-native-maps
```

For Expo, you may need to configure the maps provider. See [react-native-maps documentation](https://github.com/react-native-maps/react-native-maps).

### 2. Database Schema

Run the SQL schema in `supabase/location_circles_schema.sql` in your Supabase SQL Editor.

### 3. Permissions

Ensure location permissions are requested:

```tsx
import * as Location from 'expo-location';

const { status } = await Location.requestForegroundPermissionsAsync();
```

## Usage Example

```tsx
import { useState } from 'react';
import {
  LocationMapView,
  LocationCard,
  AddLocationCircleModal,
} from '@/src/components/location';
import { LocationCircleWithContacts } from '@/src/types/location';

export default function LocationCirclesScreen() {
  const [circles, setCircles] = useState<LocationCircleWithContacts[]>([]);
  const [activeId, setActiveId] = useState<string>();
  const [showAdd, setShowAdd] = useState(false);

  return (
    <View>
      <LocationMapView
        locationCircles={circles}
        activeCircleId={activeId}
        onCirclePress={(circle) => setActiveId(circle.id)}
      />
      
      {circles.map((circle) => (
        <LocationCard
          key={circle.id}
          locationCircle={circle}
          isActive={circle.id === activeId}
          onPress={() => setActiveId(circle.id)}
        />
      ))}
      
      <AddLocationCircleModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={(data) => {
          // Save to Supabase
          setCircles([...circles, newCircle]);
        }}
      />
    </View>
  );
}
```

## Design Principles

1. **Playful, Not Form-Like**: Icons, emojis, and visual selectors instead of plain inputs
2. **Rich Visuals**: Gradients, shadows, and animations throughout
3. **Clear Hierarchy**: Active states are obvious with glow effects
4. **Engaging Interactions**: Spring animations, smooth transitions
5. **Warm & Modern**: Uses the design system tokens for consistency

## Integration with Supabase

To fully integrate, you'll need to:

1. Create service functions to fetch/save location circles
2. Add contact management for each circle
3. Implement geofencing logic to detect entry/exit
4. Set up notifications for emergency contacts

Example service function:

```tsx
import { supabase } from '@/src/lib/supabase/client';

export async function getLocationCircles(userId: string) {
  const { data, error } = await supabase
    .from('location_circles')
    .select(`
      *,
      location_circle_contacts (*)
    `)
    .eq('user_id', userId)
    .eq('is_active', true);
    
  return { data, error };
}
```

## Notes

- The map component uses `react-native-maps` which requires native configuration
- For Expo managed workflow, you may need to use `expo-maps` or configure the native modules
- Contact avatars currently use fallback initials - integrate with image URLs when available
- The active glow effect uses animated opacity for smooth pulsing
