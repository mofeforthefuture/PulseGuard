# Step Tracking Implementation Guide

## Overview

The app now supports device step tracking with graceful fallback to manual entry. This guide explains how it works and how to extend it.

## Current Implementation

### ✅ What's Working Now

1. **Manual Entry** (Always Available)
   - Users can always enter steps manually
   - Works on all platforms
   - No permissions required

2. **Device Step Tracking** (Basic)
   - Uses Expo's built-in `expo-sensors` Pedometer
   - **iOS**: Can query historical step data (today's steps)
   - **Android**: Limited to real-time step watching (can't query historical)
   - Requires device motion permissions

### 📱 Platform Differences

| Platform | Historical Queries | Real-Time Watching | Background Support |
|----------|-------------------|-------------------|-------------------|
| **iOS** | ✅ Yes | ✅ Yes | ⚠️ Limited |
| **Android** | ❌ No | ✅ Yes | ❌ No |
| **Web** | ❌ No | ❌ No | ❌ No |

## How It Works

### Step Tracker Service

**File**: `src/lib/services/stepTracker.ts`

```typescript
// Check if step tracking is available
const status = await checkStepTrackingAvailability();

// Get today's steps (iOS only for historical)
const steps = await getTodayStepCount();

// Watch steps in real-time (both iOS & Android)
const subscription = watchStepCount((data) => {
  console.log('Current steps:', data.steps);
});
```

### Activity Card Integration

The `ActivityCard` component:
1. Checks device availability on mount
2. Shows a "📱 Sync" button if device tracking is available
3. Loads steps from device when user taps sync
4. Falls back to manual entry if device tracking fails

## Installation

### 1. Install Dependencies

```bash
npm install expo-sensors
```

The package is already added to `package.json`.

### 2. Permissions

**iOS** (`app.json` or `app.config.js`):
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSMotionUsageDescription": "PulseGuard needs access to motion data to track your daily steps."
      }
    }
  }
}
```

**Android**: Permissions are handled automatically by Expo.

### 3. Build Requirements

⚠️ **Important**: Device step tracking requires a **custom dev client** or **production build**. It won't work in Expo Go.

```bash
# Create a development build
npx expo run:ios
# or
npx expo run:android
```

## Future Enhancements

### Option 1: HealthKit (iOS) - Recommended

For better iOS support, especially background tracking:

```bash
npm install @kingstinct/react-native-healthkit
```

**Benefits:**
- Background step tracking
- Historical data queries
- Works when app is closed
- More reliable

**Setup:**
1. Add config plugin to `app.json`
2. Request HealthKit permissions
3. Use HealthKit API for step queries

### Option 2: Health Connect (Android) - Recommended

For better Android support:

```bash
npm install react-native-health-connect
```

**Benefits:**
- Modern Android health data store
- Works with many fitness apps
- Better privacy controls
- Historical data support

**Setup:**
1. User must have Health Connect installed
2. Request permissions
3. Query steps from Health Connect

### Option 3: Google Fit (Android) - Legacy

```bash
npm install react-native-google-fit
```

**Note**: Google Fit APIs are being deprecated in favor of Health Connect.

## Usage Examples

### Basic Usage (Current Implementation)

```typescript
import { getTodayStepCount, checkStepTrackingAvailability } from '@/lib/services/stepTracker';

// Check if available
const status = await checkStepTrackingAvailability();
if (status.isAvailable) {
  // Get today's steps (iOS only)
  const steps = await getTodayStepCount();
  if (steps !== null) {
    console.log('Today\'s steps:', steps);
  }
}
```

### Real-Time Step Watching

```typescript
import { watchStepCount } from '@/lib/services/stepTracker';

const subscription = watchStepCount((data) => {
  console.log('Current step count:', data.steps);
  // Update UI with real-time steps
});

// Clean up when done
subscription?.remove();
```

### With Activity Service

```typescript
import { getTodayStepCount } from '@/lib/services/stepTracker';
import { saveActivityLog } from '@/lib/services/activityService';

// Get steps from device
const deviceSteps = await getTodayStepCount();

if (deviceSteps !== null) {
  // Save to database
  await saveActivityLog(userId, deviceSteps, undefined, 'device');
}
```

## Limitations & Workarounds

### Android Historical Data

**Problem**: Android can't query historical step data via Expo Pedometer.

**Solutions**:
1. **Manual Entry**: Always available
2. **Health Connect**: Integrate for historical data
3. **Real-Time Tracking**: Track steps as they happen (requires app to be open)

### Background Tracking

**Problem**: Expo Pedometer doesn't work well in background.

**Solutions**:
1. **HealthKit** (iOS): Use for background tracking
2. **Health Connect** (Android): Syncs from other apps
3. **Periodic Sync**: Check steps when app opens

### Permissions

**Problem**: Users may deny motion permissions.

**Solution**: Always provide manual entry as fallback (already implemented).

## Testing

### Test on Device

1. Build with dev client: `npx expo run:ios` or `npx expo run:android`
2. Grant motion permissions when prompted
3. Test sync button in ActivityCard
4. Verify steps are saved with `source: 'device'`

### Test Manual Entry

1. Deny permissions or use simulator
2. Verify manual entry still works
3. Verify steps are saved with `source: 'manual'`

## Troubleshooting

### "Step tracking unavailable"

- **Cause**: Device doesn't support step tracking or permissions denied
- **Solution**: Use manual entry (always available)

### "Could not load steps from device"

- **Cause**: Permissions issue or device limitation
- **Solution**: Check permissions, use manual entry

### Android: "Can only track in real-time"

- **Cause**: Android limitation with Expo Pedometer
- **Solution**: Use Health Connect integration for historical data

## Next Steps

1. ✅ **Current**: Basic device tracking with manual fallback
2. 🔄 **Next**: Add HealthKit integration for iOS
3. 🔄 **Future**: Add Health Connect for Android
4. 🔄 **Future**: Background step syncing
5. 🔄 **Future**: Step goal setting and achievements
