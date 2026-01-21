# ALARA Tool-Calling Architecture - Examples

## 1. Request/Response Cycle

### Example 1: Simple Tool Call (No Confirmation)

**User Message:**
```
"I took my aspirin this morning"
```

**ALARA Response:**
```
"Got it! I'll log that for you. [TOOL_CALL:{"id":"call-123","tool":"log_medication","parameters":{"medication_name":"aspirin","dose":"1 tablet"},"confidence":0.95}]"
```

**App Execution Flow:**
1. Parse tool call from response
2. Validate tool call (tool exists, parameters valid)
3. Apply safety guardrails (confidence ≥ 0.7 ✓, explicit intent ✓)
4. Execute tool (no confirmation needed for log_medication)
5. Return result to ALARA

**Tool Execution Result:**
```json
{
  "success": true,
  "toolCallId": "call-123",
  "tool": "log_medication",
  "message": "Logged aspirin"
}
```

**ALARA Final Response:**
```
"Done! I've logged your aspirin dose for this morning. 💊"
```

---

### Example 2: Tool Call Requiring Confirmation

**User Message:**
```
"I want a reminder to take my medication at 9am every day"
```

**ALARA Response:**
```
"I'll set that up for you! [TOOL_CALL:{"id":"call-456","tool":"create_reminder","parameters":{"title":"Take medication","time":"09:00","days":[1,2,3,4,5,6,7],"reminder_type":"medication"},"confidence":0.9}]"
```

**App Execution Flow:**
1. Parse tool call
2. Validate tool call
3. Apply safety guardrails
4. **Detect requiresConfirmation = true**
5. **Create confirmation request** (don't execute yet)

**Confirmation Request:**
```json
{
  "toolCallId": "call-456",
  "tool": "create_reminder",
  "parameters": {
    "title": "Take medication",
    "time": "09:00",
    "days": [1,2,3,4,5,6,7]
  },
  "prompt": "I'd like to create reminder: title: Take medication, time: 09:00, days: 1,2,3,4,5,6,7. Is this correct?",
  "sensitivity": "low"
}
```

**User Confirms:**
```
"Yes, that's correct"
```

**App Executes Tool:**
```json
{
  "success": true,
  "toolCallId": "call-456",
  "tool": "create_reminder",
  "message": "Created reminder: Take medication"
}
```

**ALARA Final Response:**
```
"Perfect! I've set up your daily medication reminder for 9am. You'll get a notification every day! ⏰"
```

---

### Example 3: Critical Tool (Care Log)

**User Message:**
```
"I went to the hospital yesterday for a checkup"
```

**ALARA Response:**
```
"I'll log that hospital visit for you. Can you confirm the details? [TOOL_CALL:{"id":"call-789","tool":"create_care_log","parameters":{"log_type":"visit","title":"Hospital checkup","occurred_at":"2024-01-20T10:00:00Z"},"confidence":0.85}]"
```

**App Execution Flow:**
1. Parse tool call
2. Validate tool call
3. Apply safety guardrails
   - Check: sensitivity = 'critical' ✓
   - Check: explicit intent keywords found ("went", "hospital") ✓
4. **Requires confirmation** (critical tool)
5. **Create detailed confirmation**

**Confirmation Request:**
```json
{
  "toolCallId": "call-789",
  "tool": "create_care_log",
  "parameters": {
    "log_type": "visit",
    "title": "Hospital checkup",
    "occurred_at": "2024-01-20T10:00:00Z"
  },
  "prompt": "I'd like to create care log: log_type: visit, title: Hospital checkup, occurred_at: 2024-01-20T10:00:00Z. Please confirm these details are correct.",
  "sensitivity": "critical"
}
```

**User Confirms with Correction:**
```
"The date was actually January 19th, not 20th"
```

**App Updates and Executes:**
- Update parameters: `occurred_at: "2024-01-19T10:00:00Z"`
- Execute tool
- Return result

---

### Example 4: Multiple Tool Calls

**User Message:**
```
"I'm feeling great today and I took my morning medication"
```

**ALARA Response:**
```
"Awesome! I'll update your mood and log your medication. [TOOL_CALL:{"id":"call-1","tool":"update_mood","parameters":{"mood":"great"},"confidence":0.95}][TOOL_CALL:{"id":"call-2","tool":"log_medication","parameters":{"medication_name":"morning medication"},"confidence":0.9}]"
```

**App Execution:**
- Execute both tools in parallel
- Return results for both

**Results:**
```json
[
  {
    "success": true,
    "toolCallId": "call-1",
    "tool": "update_mood",
    "message": "Updated mood to great"
  },
  {
    "success": true,
    "toolCallId": "call-2",
    "tool": "log_medication",
    "message": "Logged morning medication"
  }
]
```

---

### Example 5: Tool Call Blocked by Safety Guardrails

**User Message:**
```
"I have a headache"
```

**ALARA Response (Incorrect - would be blocked):**
```
"I'll log that for you. [TOOL_CALL:{"id":"call-999","tool":"log_medication","parameters":{"medication_name":"aspirin"},"confidence":0.5}]"
```

**App Execution:**
1. Parse tool call
2. Validate tool call
3. **Apply safety guardrails:**
   - Confidence 0.5 < 0.7 → **BLOCKED**
   - User didn't mention taking medication → **BLOCKED**

**Result:**
```json
{
  "success": false,
  "toolCallId": "call-999",
  "tool": "log_medication",
  "message": "Tool call blocked by safety guardrails",
  "error": "Confidence too low. Tool calls require confidence ≥ 0.7"
}
```

**ALARA Corrected Response:**
```
"I'm sorry to hear about your headache. Are you planning to take any medication for it, or would you like to just note it as a symptom?"
```

---

## 2. Medical Safety Guardrails

### Guardrail Examples:

1. **Confidence Threshold**
   - All tool calls require confidence ≥ 0.7
   - Low confidence = ask user instead

2. **Explicit Intent Required**
   - Critical tools require explicit keywords
   - Cannot infer actions from context alone

3. **Crisis Detection**
   - Crisis mood triggers additional safety checks
   - May require immediate human review

4. **No Medical Diagnosis**
   - Tools never diagnose
   - Only log what user explicitly states

5. **Verification for Critical Records**
   - Care logs always require confirmation
   - Dates and details must be verified

---

## 3. Tool Execution Flow Diagram

```
User Message
    ↓
ALARA Generates Response (with tool calls)
    ↓
Parse Tool Calls
    ↓
Validate Tool Calls (registry, parameters)
    ↓
Apply Safety Guardrails
    ↓
    ├─→ Blocked? → Return error to ALARA
    │
    ├─→ Requires Confirmation?
    │   ├─→ Yes → Store confirmation request
    │   │        → Show to user
    │   │        → Wait for confirmation
    │   │        → Execute after confirmation
    │   │
    │   └─→ No → Execute immediately
    │
    └─→ Execute Tool
        ↓
    App writes to database
        ↓
    Return result to ALARA
        ↓
    ALARA incorporates result into response
```

---

## 4. Integration Points

### In ALARAContext.tsx:
```typescript
import { getToolExecutionManager } from '../lib/openrouter/tools/manager';
import { getToolCallingSystemPrompt } from '../lib/openrouter/tools/prompt';

// Replace action system with tool system
const toolManager = getToolExecutionManager();
const { cleanMessage, results, pendingConfirmations } = 
  await toolManager.parseAndExecute(user.id, rawResponse, userMessage);
```

### Confirmation UI Component:
```typescript
// Show pendingConfirmations to user
// On confirm: toolManager.executeWithConfirmation(userId, toolCall)
// On reject: Remove from pendingConfirmations
```
