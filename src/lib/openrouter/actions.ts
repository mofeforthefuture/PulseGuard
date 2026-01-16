/**
 * ALARA Action System
 * Allows ALARA to make decisions and update the database
 */

export type ALARAActionType =
  | 'log_medication'
  | 'create_check_in'
  | 'save_health_entry'
  | 'update_mood'
  | 'create_reminder'
  | 'log_doctor_visit'
  | 'none';

export interface ALARAAction {
  type: ALARAActionType;
  data?: Record<string, any>;
  confidence?: number; // 0-1, how confident ALARA is about this action
}

export interface ALARAResponseWithActions {
  message: string;
  actions: ALARAAction[];
}

/**
 * Parse actions from ALARA's response
 * ALARA can return actions in JSON format at the end of messages
 * Format: [ACTION:{"type":"log_medication","data":{"medication_name":"Aspirin"}}]
 */
export function parseActionsFromResponse(response: string): {
  cleanMessage: string;
  actions: ALARAAction[];
} {
  const actions: ALARAAction[] = [];
  let cleanMessage = response;

  // Look for action markers: [ACTION:{...}]
  const actionRegex = /\[ACTION:(\{.*?\})\]/g;
  let match;

  while ((match = actionRegex.exec(response)) !== null) {
    try {
      const actionData = JSON.parse(match[1]);
      if (actionData.type && actionData.type !== 'none') {
        actions.push({
          type: actionData.type as ALARAActionType,
          data: actionData.data || {},
          confidence: actionData.confidence || 0.8,
        });
      }
    } catch (error) {
      console.error('[ALARA] Error parsing action:', error, match[1]);
    }
  }

  // Remove action markers from message
  cleanMessage = cleanMessage.replace(actionRegex, '').trim();

  return { cleanMessage, actions };
}

/**
 * Generate system prompt with action instructions
 */
export function getActionSystemPrompt(): string {
  return `
You can perform actions by including them in your response using this format:
[ACTION:{"type":"action_type","data":{...},"confidence":0.9}]

Available actions:
1. log_medication - When user mentions taking medication
   Example: [ACTION:{"type":"log_medication","data":{"medication_name":"Aspirin","dose":"1 tablet"}}]

2. create_check_in - When user shares how they're feeling
   Example: [ACTION:{"type":"create_check_in","data":{"mood":"good","symptoms":["headache"],"notes":"Feeling better today"}}]

3. save_health_entry - For general health notes or symptoms
   Example: [ACTION:{"type":"save_health_entry","data":{"entry_type":"symptom","symptoms":["fatigue"],"severity":"mild"}}]

4. update_mood - Quick mood update
   Example: [ACTION:{"type":"update_mood","data":{"mood":"great"}}]

5. create_reminder - When user wants to be reminded
   Example: [ACTION:{"type":"create_reminder","data":{"title":"Take medication","time":"09:00","days":[1,2,3,4,5]}}]

6. log_doctor_visit - When user mentions visiting a doctor, clinic, or hospital
   Example: [ACTION:{"type":"log_doctor_visit","data":{"visit_type":"appointment","notes":"Annual checkup","date":"2024-01-15"}}]

MEMORY WRITE RULES (CRITICAL):
- Only write to database when action confidence ≥ 0.7
- Intent must be unambiguous - don't guess
- Only use these automatic writes:
  * Mood updates (when user clearly states mood)
  * Medication logs (when user explicitly mentions taking medication)
  * Check-ins (when user shares how they're feeling)
  * Health notes (when user describes symptoms or health events)
  * Reminders (when user explicitly asks for a reminder)
- All writes are logged with source = "ai_inferred"
- If intent is unclear, ask the user instead of writing
- Don't create actions for every message - only when it makes sense
- Keep your text response natural - the action is separate
- If unsure, don't include an action (or use type "none")
`;
}
