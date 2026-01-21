# Tool-Calling Architecture - Implementation Guide

## Where It's Called

### 1. Tool Registry
**File**: `src/lib/openrouter/tools/registry.ts`
**Purpose**: Central registry of all available tools
**Usage**: 
- Defines all tools ALARA can call
- Used by parser, executor, and prompt generator
- Single source of truth for tool definitions

### 2. Tool Parser
**File**: `src/lib/openrouter/tools/parser.ts`
**Called From**: `src/lib/openrouter/tools/manager.ts`
**Purpose**: Parse tool calls from ALARA responses
**Functions**:
- `parseToolCallsFromResponse()` - Extracts tool calls from text
- `validateToolCalls()` - Validates against registry

### 3. Tool Executor
**File**: `src/lib/openrouter/tools/executor.ts`
**Called From**: `src/lib/openrouter/tools/manager.ts`
**Purpose**: Execute tools with safety checks
**Functions**:
- `executeToolCall()` - Main execution function
- `executeToolWithConfirmation()` - Execute after user confirms
- `applyMedicalSafetyGuardrails()` - Safety validation

### 4. Tool Manager
**File**: `src/lib/openrouter/tools/manager.ts`
**Called From**: `src/context/ALARAContext.tsx` (to be integrated)
**Purpose**: Orchestrates tool execution flow
**Functions**:
- `parseAndExecute()` - Parse response and execute tools
- `executeToolCalls()` - Execute multiple tools
- `executeWithConfirmation()` - Execute confirmed tools

### 5. System Prompt
**File**: `src/lib/openrouter/tools/prompt.ts`
**Called From**: `src/lib/openrouter/client.ts`
**Purpose**: Generate tool calling instructions for ALARA
**Function**: `getToolCallingSystemPrompt()`

### 6. Action Executors
**File**: `src/lib/openrouter/actionExecutors.ts`
**Called From**: `src/lib/openrouter/tools/executor.ts`
**Purpose**: Actual database operations
**Functions**: All `execute*` functions that write to database

---

## Integration Steps

### Step 1: Update ALARAContext to use Tool System

**File**: `src/context/ALARAContext.tsx`

Replace:
```typescript
import { parseActionsFromResponse } from '../lib/openrouter/actions';
import { executeActions } from '../lib/openrouter/actionExecutors';
```

With:
```typescript
import { getToolExecutionManager } from '../lib/openrouter/tools/manager';
```

Update response processing:
```typescript
// OLD:
const { cleanMessage, actions } = parseActionsFromResponse(rawResponse);
const actionResults = await executeActions(user.id, actions);

// NEW:
const toolManager = getToolExecutionManager();
const { cleanMessage, results, pendingConfirmations } = 
  await toolManager.parseAndExecute(user.id, rawResponse, userMessage);

// Handle results
results.forEach(result => {
  if (result.success) {
    console.log(`[Tool] ${result.tool}: ${result.message}`);
  } else {
    console.warn(`[Tool] ${result.tool} failed: ${result.error}`);
  }
});

// Store pending confirmations for UI
if (pendingConfirmations.length > 0) {
  // TODO: Show confirmation UI
}
```

### Step 2: Update System Prompt

**File**: `src/lib/openrouter/client.ts`

Replace:
```typescript
const actionInstructions = enableActions ? getActionSystemPrompt() : '';
```

With:
```typescript
import { getToolCallingSystemPrompt } from './tools/prompt';
const toolInstructions = enableActions ? getToolCallingSystemPrompt() : '';
```

Update prompt construction:
```typescript
const fullSystemPrompt = metadataContext + '\n\n' + 
  systemPrompt + contextString + toolInstructions + memoryRules + 
  '\n\nImportant: Respond naturally...';
```

### Step 3: Create Confirmation UI Component

**File**: `src/components/alara/ToolConfirmationModal.tsx` (to be created)

```typescript
interface ToolConfirmationModalProps {
  confirmation: ToolConfirmation;
  onConfirm: () => void;
  onReject: () => void;
  onModify?: (updatedParams: Record<string, any>) => void;
}
```

---

## Current Status

✅ **Completed:**
- Tool registry structure
- Tool execution flow
- Safety guardrails
- Parser and executor
- Documentation

⏳ **To Be Integrated:**
- Update ALARAContext to use tool system
- Create confirmation UI component
- Update system prompt generation
- Add pending confirmations state management

---

## Testing the Architecture

### Test Case 1: Simple Tool (No Confirmation)
```
User: "I took my aspirin"
Expected: Tool executes immediately, result returned
```

### Test Case 2: Tool Requiring Confirmation
```
User: "Set a reminder for medication at 9am"
Expected: Confirmation request created, waits for user
```

### Test Case 3: Blocked by Safety
```
User: "I have a headache"
ALARA tries: log_medication with low confidence
Expected: Blocked, ALARA asks for clarification
```

### Test Case 4: Critical Tool
```
User: "I went to the hospital"
Expected: Confirmation required, details verified
```
