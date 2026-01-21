# ALARA Tool-Calling Architecture

## Overview

ALARA uses a tool-calling architecture where the AI assistant requests actions through tools, but **never writes directly to the database**. All database operations are executed by the app with proper validation, safety checks, and user confirmations.

## Architecture Principles

1. **Separation of Concerns**: ALARA requests, app executes
2. **Safety First**: Multiple guardrails prevent unsafe operations
3. **User Control**: Sensitive actions require explicit confirmation
4. **Medical Safety**: Special rules for health-related operations
5. **Extensibility**: Easy to add new tools and metadata

---

## 1. Tool Registry Structure

### Location: `src/lib/openrouter/tools/registry.ts`

The tool registry is the single source of truth for all available tools:

```typescript
export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
  log_medication: {
    id: 'log_medication',
    name: 'Log Medication',
    description: 'Log when user takes medication...',
    category: 'health_logging',
    sensitivity: 'high',
    requiresConfirmation: false,
    parameters: [...],
    executor: 'executeLogMedication',
    medicalSafetyRules: [...],
  },
  // ... more tools
};
```

### Tool Definition Fields:

- **id**: Unique tool identifier
- **name**: Human-readable name
- **description**: What the tool does
- **category**: Tool category (health_logging, reminders, care_records, read_only)
- **sensitivity**: Risk level (low, medium, high, critical)
- **requiresConfirmation**: Whether user must confirm before execution
- **parameters**: Parameter schema with validation rules
- **executor**: Function name that executes the tool
- **medicalSafetyRules**: Tool-specific safety guidelines

---

## 2. Tool Execution Flow

### Step-by-Step Flow:

```
1. User sends message to ALARA
   ↓
2. ALARA generates response with tool calls
   Format: [TOOL_CALL:{"id":"...","tool":"...","parameters":{...},"confidence":0.9}]
   ↓
3. Parse tool calls from response
   - Extract tool calls
   - Clean message text
   ↓
4. Validate tool calls
   - Check tool exists in registry
   - Validate parameters (type, required, enum)
   ↓
5. Apply medical safety guardrails
   - Confidence threshold (≥ 0.7)
   - Explicit intent verification
   - Sensitivity-based checks
   ↓
6. Check if confirmation required
   ├─→ Yes → Create confirmation request
   │         → Store pending confirmation
   │         → Show to user
   │         → Wait for user response
   │         → Execute after confirmation
   │
   └─→ No → Execute immediately
           ↓
7. Execute tool (app writes to database)
   ↓
8. Return result to ALARA
   Format: [TOOL_RESULT:call-id:success] Message
   ↓
9. ALARA incorporates result into response
```

---

## 3. Example Request/Response Cycle

### Example: Logging Medication (No Confirmation)

**User:**
```
"I took my aspirin this morning"
```

**ALARA Response:**
```
"Got it! I'll log that for you. [TOOL_CALL:{"id":"call-123","tool":"log_medication","parameters":{"medication_name":"aspirin","dose":"1 tablet"},"confidence":0.95}]"
```

**App Processing:**
1. Parse: Extract tool call, clean message
2. Validate: Tool exists ✓, parameters valid ✓
3. Safety: Confidence 0.95 ≥ 0.7 ✓, explicit intent ✓
4. Execute: No confirmation needed → Execute immediately
5. Result: `{success: true, message: "Logged aspirin"}`

**ALARA Final Response:**
```
"Done! I've logged your aspirin dose for this morning. 💊"
```

### Example: Creating Reminder (Requires Confirmation)

**User:**
```
"Remind me to take my medication at 9am"
```

**ALARA Response:**
```
"I'll set that up! [TOOL_CALL:{"id":"call-456","tool":"create_reminder","parameters":{"title":"Take medication","time":"09:00","days":[1,2,3,4,5,6,7]},"confidence":0.9}]"
```

**App Processing:**
1. Parse: Extract tool call
2. Validate: Tool exists ✓, parameters valid ✓
3. Safety: Confidence 0.9 ≥ 0.7 ✓
4. **Confirmation Required**: `requiresConfirmation: true`
5. **Create Confirmation Request**:
   ```json
   {
     "toolCallId": "call-456",
     "tool": "create_reminder",
     "prompt": "I'd like to create reminder: title: Take medication, time: 09:00, days: 1,2,3,4,5,6,7. Is this correct?",
     "sensitivity": "low"
   }
   ```
6. **Show to User**: Display confirmation prompt
7. **User Confirms**: "Yes"
8. **Execute**: Create reminder in database
9. **Result**: `{success: true, message: "Created reminder: Take medication"}`

**ALARA Final Response:**
```
"Perfect! I've set up your daily medication reminder for 9am. ⏰"
```

### Example: Critical Tool (Care Log)

**User:**
```
"I went to the hospital yesterday for a checkup"
```

**ALARA Response:**
```
"I'll log that visit. Can you confirm the details? [TOOL_CALL:{"id":"call-789","tool":"create_care_log","parameters":{"log_type":"visit","title":"Hospital checkup","occurred_at":"2024-01-20T10:00:00Z"},"confidence":0.85}]"
```

**App Processing:**
1. Parse: Extract tool call
2. Validate: Tool exists ✓
3. Safety: 
   - Confidence 0.85 ≥ 0.7 ✓
   - Sensitivity: 'critical' → Requires explicit intent
   - Check keywords: "went", "hospital" found ✓
4. **Confirmation Required**: Critical tools always require confirmation
5. **Create Detailed Confirmation**:
   ```json
   {
     "toolCallId": "call-789",
     "tool": "create_care_log",
     "prompt": "I'd like to create care log: log_type: visit, title: Hospital checkup, occurred_at: 2024-01-20T10:00:00Z. Please confirm these details are correct.",
     "sensitivity": "critical"
   }
   ```
6. **User Reviews & Confirms**: "Yes, but the date was January 19th"
7. **Update Parameters**: `occurred_at: "2024-01-19T10:00:00Z"`
8. **Execute**: Create care log
9. **Result**: `{success: true, message: "Created care log: Hospital checkup"}`

---

## 4. Medical Safety Guardrails

### Guardrail Layers:

#### Layer 1: Confidence Threshold
- **Rule**: All tool calls require confidence ≥ 0.7
- **Action**: Block low-confidence calls, ask user instead
- **Example**: Confidence 0.5 → Blocked, ALARA asks for clarification

#### Layer 2: Explicit Intent Verification
- **Rule**: Critical/high sensitivity tools require explicit user statements
- **Action**: Check for intent keywords in user message
- **Example**: `log_medication` requires keywords like "took", "taken", "medication"

#### Layer 3: Sensitivity-Based Rules
- **Low**: Basic logging (mood updates) - minimal checks
- **Medium**: Health entries - verify intent
- **High**: Medication logs, doctor visits - explicit statements required
- **Critical**: Care logs - always require confirmation + verification

#### Layer 4: Parameter Validation
- **Type Checking**: Ensure parameters match expected types
- **Required Fields**: All required parameters must be present
- **Enum Validation**: Constrained values must be in allowed list
- **Example**: `mood` must be one of: ['great', 'good', 'okay', 'poor', 'crisis']

#### Layer 5: Medical-Specific Rules
- **No Diagnosis**: Tools never diagnose or interpret symptoms
- **Crisis Detection**: Crisis mood triggers additional safety protocols
- **Verification**: Critical records (care logs) require date/time verification
- **No Inference**: Only log what user explicitly states

### Safety Rule Examples:

```typescript
// Tool-specific safety rules
medicalSafetyRules: [
  'Only log if user explicitly states they took the medication',
  'Do not infer medication from symptoms alone',
  'Verify medication name matches user\'s known medications if possible',
]
```

---

## 5. File Structure

```
src/lib/openrouter/tools/
├── registry.ts          # Tool definitions and registry
├── types.ts             # TypeScript interfaces
├── executor.ts          # Tool execution engine
├── parser.ts            # Parse tool calls from responses
├── manager.ts           # Tool execution manager
├── prompt.ts            # System prompt generation
├── index.ts             # Centralized exports
├── EXAMPLES.md          # Usage examples
└── ARCHITECTURE.md      # This file
```

---

## 6. Integration Points

### In ALARAContext.tsx:

```typescript
import { getToolExecutionManager } from '../lib/openrouter/tools/manager';
import { getToolCallingSystemPrompt } from '../lib/openrouter/tools/prompt';

// Replace old action system
const toolManager = getToolExecutionManager();
const { cleanMessage, results, pendingConfirmations } = 
  await toolManager.parseAndExecute(user.id, rawResponse, userMessage);

// Handle results
results.forEach(result => {
  if (result.success) {
    console.log(`Tool ${result.tool} executed: ${result.message}`);
  } else {
    console.warn(`Tool ${result.tool} failed: ${result.error}`);
  }
});

// Handle pending confirmations
if (pendingConfirmations.length > 0) {
  // Show confirmation UI to user
  // On confirm: toolManager.executeWithConfirmation(userId, toolCall)
}
```

### In System Prompt:

```typescript
// Add tool calling instructions to system prompt
const toolPrompt = getToolCallingSystemPrompt();
const fullSystemPrompt = metadataContext + '\n\n' + 
  systemPrompt + toolPrompt + memoryRules;
```

---

## 7. Adding New Tools

### Step 1: Define Tool in Registry

```typescript
// In registry.ts
export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
  // ... existing tools
  new_tool: {
    id: 'new_tool',
    name: 'New Tool',
    description: 'What this tool does',
    category: 'health_logging',
    sensitivity: 'medium',
    requiresConfirmation: false,
    parameters: [
      {
        name: 'param1',
        type: 'string',
        description: 'Parameter description',
        required: true,
      },
    ],
    executor: 'executeNewTool',
    medicalSafetyRules: [
      'Safety rule 1',
      'Safety rule 2',
    ],
  },
};
```

### Step 2: Create Executor Function

```typescript
// In actionExecutors.ts
export async function executeNewTool(
  userId: string,
  action: ALARAAction
): Promise<ActionExecutionResult> {
  // Implementation
}
```

### Step 3: Add to Executor Switch

```typescript
// In tools/executor.ts
case 'new_tool':
  result = await executeNewTool(userId, action);
  break;
```

---

## 8. Confirmation System

### Confirmation Flow:

1. **Tool Requires Confirmation** → Create `ToolConfirmation` object
2. **Store Pending Confirmation** → Map<toolCallId, ToolConfirmation>
3. **Show to User** → Display confirmation prompt UI
4. **User Responds**:
   - **Confirm** → Execute tool
   - **Reject** → Cancel, remove from pending
   - **Modify** → Update parameters, then execute

### Confirmation UI Component (to be implemented):

```typescript
<ToolConfirmationModal
  confirmation={pendingConfirmation}
  onConfirm={(toolCall) => {
    toolManager.executeWithConfirmation(userId, toolCall);
  }}
  onReject={() => {
    // Remove from pending
  }}
  onModify={(updatedParams) => {
    // Update parameters and execute
  }}
/>
```

---

## 9. Key Design Decisions

1. **ALARA Never Writes Directly**: All database writes go through executor
2. **Confidence-Based Execution**: Low confidence = ask user
3. **Sensitivity Tiers**: Different rules for different risk levels
4. **Explicit Intent Required**: Cannot infer actions from context
5. **Confirmation for Sensitive Actions**: User must approve critical operations
6. **Extensible Registry**: Easy to add new tools without changing core logic
7. **Backward Compatible**: Still supports legacy [ACTION:...] format

---

## 10. Medical Safety Checklist

Before executing any tool, verify:

- [ ] Confidence ≥ 0.7
- [ ] User explicitly stated intent (for high/critical tools)
- [ ] Parameters validated (types, required fields, enums)
- [ ] No medical diagnosis or interpretation
- [ ] Crisis mood handled appropriately
- [ ] Critical tools confirmed by user
- [ ] Dates/times verified (for care records)
- [ ] Medication names match known medications (if possible)

---

## Summary

This architecture ensures:
- ✅ ALARA can request actions but never writes directly
- ✅ All database operations go through validated executors
- ✅ Sensitive actions require user confirmation
- ✅ Multiple safety guardrails prevent unsafe operations
- ✅ Medical safety rules are enforced at every step
- ✅ System is extensible for future tools and metadata
