# Chat-to-Bottom Sheet Handoff

## Overview

When ALARA extracts structured data from chat (BP, hydration, appointments), it automatically opens a bottom sheet with prefilled fields. Users can review, edit, and confirm before saving. This ensures data accuracy and provides a smooth, context-preserving experience.

## Flow

```
User: "My BP is 120/80"
  ↓
ALARA extracts: { systolic: 120, diastolic: 80 }
  ↓
Bottom sheet opens with prefilled form
  ↓
User reviews/edits if needed
  ↓
User confirms → Data saved
  ↓
Success message in chat
```

## Features

### 1. Automatic Extraction
- ALARA extracts structured data from natural language
- Data is immediately available for bottom sheet

### 2. Prefilled Forms
- All extracted fields are prefilled
- Users can edit any field before confirming
- Source message is preserved for context

### 3. Smooth Animations
- Bottom sheet slides up smoothly
- Keyboard handling for form inputs
- No context loss during transition

### 4. Context Preservation
- Original user message stored
- Chat history maintained
- No data loss if user cancels

## Supported Data Types

### 1. Blood Pressure
- **Fields**: Systolic, Diastolic, Pulse (optional), Position, Notes
- **Validation**: Range checks, diastolic < systolic
- **Special**: Shows warning if reading is unusual

### 2. Hydration
- **Fields**: Amount (ml), Notes (optional)
- **Validation**: Positive number, reasonable range
- **Helper**: Common amounts displayed

### 3. Appointment (Future)
- **Fields**: Title, Date, Notes
- **Validation**: Date format, required fields

## Components

### Main Component
**File**: `src/components/alara/ALARADataConfirmationSheet.tsx`

Unified bottom sheet that handles all data types:
- Detects data type
- Renders appropriate form
- Handles confirmation/cancellation
- Manages form state

### Form Components
**Directory**: `src/components/alara/forms/`

- `BloodPressureForm.tsx` - BP input form
- `HydrationForm.tsx` - Hydration input form
- `AppointmentForm.tsx` - Appointment input form

Each form:
- Accepts initial data
- Updates parent on changes
- Validates input
- Provides helpful UI

## Integration

### In ALARAContext

**State Management**:
```typescript
const [showDataConfirmationSheet, setShowDataConfirmationSheet] = useState(false);
const [dataConfirmationData, setDataConfirmationData] = useState<DataConfirmation | null>(null);
const [pendingUserMessage, setPendingUserMessage] = useState<string>('');
```

**Triggering Bottom Sheet**:
```typescript
// After action execution
if (actions[index].type === 'log_blood_pressure' && result.success) {
  const bpData: BloodPressureData = {
    type: 'blood_pressure',
    source: userMessage,
    systolic: actions[index].data?.systolic,
    diastolic: actions[index].data?.diastolic,
    // ... other fields
  };
  setDataConfirmationData(bpData);
  setShowDataConfirmationSheet(true);
  setPendingUserMessage(userMessage);
}
```

**Handling Confirmation**:
```typescript
const handleDataConfirmation = async (confirmedData: DataConfirmation) => {
  // Create action from confirmed data
  const action = { /* ... */ };
  
  // Execute action
  const results = await executeActions(user.id, [action]);
  
  // Add success/error message to chat
  // Close bottom sheet
};
```

## User Experience

### Opening
1. User types natural language
2. ALARA extracts data
3. Bottom sheet slides up smoothly
4. Form is prefilled with extracted data
5. ALARA message: "I've extracted your [data type]. Please review and confirm in the form below."

### Editing
- All fields are editable
- Real-time validation
- Helpful hints and warnings
- Source message visible for context

### Confirming
1. User reviews prefilled data
2. Edits if needed
3. Taps "Confirm & Save"
4. Bottom sheet closes smoothly
5. Success message appears in chat
6. Data saved to database

### Canceling
1. User taps "Cancel" or swipes down
2. Bottom sheet closes
3. No data saved
4. Chat context preserved
5. User can try again

## Animations

### Bottom Sheet
- **Open**: Spring animation (tension: 50, friction: 7)
- **Close**: Timing animation (250ms)
- **Backdrop**: Fade in/out (200ms)

### Keyboard
- **Avoiding**: KeyboardAvoidingView handles keyboard
- **Dismiss**: Keyboard dismissed on open/close
- **Behavior**: Platform-specific (iOS: padding, Android: height)

## Data Flow

```
User Message
  ↓
ALARA Extraction (Tool Call)
  ↓
Action Execution
  ↓
Bottom Sheet Trigger
  ↓
Form Prefill
  ↓
User Review/Edit
  ↓
Confirmation
  ↓
Action Execution (Confirmed)
  ↓
Success Message
```

## Error Handling

### Extraction Errors
- If extraction fails, no bottom sheet
- ALARA asks for clarification in chat

### Validation Errors
- Form shows inline errors
- Submit disabled until valid
- Clear error messages

### Save Errors
- Error message in chat
- Bottom sheet closes
- User can try again

## Context Preservation

### What's Preserved
- Original user message
- Chat history
- ALARA's response
- Extracted data (until confirmed)

### What's Not Lost
- Conversation context
- User's intent
- Previous messages
- Form state (until cancel)

## Future Enhancements

- [ ] Appointment form integration
- [ ] Multi-step forms (e.g., medication logging)
- [ ] Form templates for common patterns
- [ ] Auto-save drafts
- [ ] Undo/redo support
- [ ] Voice input for forms
- [ ] Smart field suggestions

## Files

1. **`src/components/alara/ALARADataConfirmationSheet.tsx`** - Main bottom sheet component
2. **`src/components/alara/forms/BloodPressureForm.tsx`** - BP form
3. **`src/components/alara/forms/HydrationForm.tsx`** - Hydration form
4. **`src/components/alara/forms/AppointmentForm.tsx`** - Appointment form
5. **`src/context/ALARAContext.tsx`** - Integration and state management

## Example Usage

### Blood Pressure
```
User: "BP is 140/90"
ALARA: "I've extracted your blood pressure reading. Please review and confirm in the form below."
[Bottom sheet opens with 140/90 prefilled]
User edits if needed → Confirms
ALARA: "Saved your blood pressure reading: 140/90 ✅"
```

### Hydration
```
User: "Drank 500ml"
ALARA: "I've extracted your hydration amount. Please review and confirm in the form below."
[Bottom sheet opens with 500ml prefilled]
User confirms
ALARA: "Logged 500ml. (Total today: 1500ml) ✅"
```
