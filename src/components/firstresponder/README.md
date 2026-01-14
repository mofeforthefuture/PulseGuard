# First Responder Mode

A specialized screen designed for emergency responders to quickly access critical medical information. Features large typography, color-coded conditions, and high-contrast medication warnings for readability at arm's length.

## Features

- ✅ **Large Typography** - All text is sized for arm's-length reading
- ✅ **Color-Coded Condition Tags** - Visual hierarchy with condition-specific colors
- ✅ **High-Contrast Medication Cards** - Warning-style cards for medications
- ✅ **Clear Iconography** - Large, recognizable icons throughout
- ✅ **No Clutter** - Clean layout with visual richness
- ✅ **Emergency Instructions** - Highlighted critical care instructions

## Design Principles

1. **Readability First** - All text is large enough to read from a distance
2. **Visual Hierarchy** - Color coding and size create clear information hierarchy
3. **High Contrast** - Critical information uses high-contrast cards
4. **Icon Clarity** - Large, emoji-based icons for quick recognition
5. **No Clutter** - Clean spacing, no unnecessary elements

## Usage

```tsx
import { FirstResponderModeScreen } from '@/src/components/firstresponder';

<FirstResponderModeScreen
  user={user}
  medicalProfiles={medicalProfiles}
  emergencyContactName={user.emergency_contact_name}
  emergencyContactPhone={user.emergency_contact_phone}
/>
```

## Typography Scale

- **Display**: 40px - Main title
- **Hero**: 48px - Patient name
- **H1**: 32px - Section titles
- **H2**: 24px - Condition labels, medication names
- **H3**: 20px - Details, phone numbers

## Color Coding

### Conditions

- **Asthma**: Warning (orange) - 🫁
- **Sickle Cell Disease**: Error (red) - 🩸
- **Epilepsy**: Error (red) - ⚡
- **Diabetes**: Warning (orange) - 💉
- **Heart Condition**: Error (red) - ❤️
- **Allergies**: Error (red) - ⚠️
- **Other**: Info (blue) - 🏥

### Severity Indicators

- **Severe**: Red border and badge
- **Moderate**: Orange/warning colors
- **Mild**: Standard condition colors

## Sections

1. **Patient Information**
   - Name (Hero size)
   - Phone number

2. **Medical Conditions**
   - Color-coded tags with icons
   - Severity badges
   - Large, bold labels

3. **Current Medications**
   - High-contrast warning cards
   - Medication name (H2)
   - Dosage and frequency
   - Time information

4. **Allergies & Triggers**
   - High-contrast concern card
   - Bulleted list
   - Large, bold text

5. **Emergency Instructions**
   - Emergency variant cards
   - Condition-specific instructions
   - Large, readable text

6. **Emergency Contact**
   - Contact name and phone
   - Large, clear display

## Accessibility

- **Large Touch Targets**: All interactive elements are easily tappable
- **High Contrast**: Text meets WCAG AA standards
- **Clear Hierarchy**: Information is organized by importance
- **Readable Fonts**: System fonts with appropriate weights
- **Icon Support**: Emoji icons for universal recognition

## Integration

The First Responder Mode is accessible from:
- Profile screen → "View First Responder Mode" button
- Direct route: `/(tabs)/first-responder`

The screen automatically loads:
- User profile information
- All medical profiles from Supabase
- Emergency contact information
- Medications and triggers from all profiles

## Notes

- The screen is designed to be shown to first responders during emergencies
- All information is displayed in a clear, scannable format
- No sensitive information is hidden - everything is visible for emergency use
- The layout is optimized for quick scanning and comprehension
- Last updated date is shown in the footer
