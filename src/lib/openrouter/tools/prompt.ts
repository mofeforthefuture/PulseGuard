/**
 * Tool Calling System Prompt
 * Instructions for ALARA on how to use tools
 */

import { TOOL_REGISTRY } from './registry';

/**
 * Generate system prompt with tool calling instructions
 */
export function getToolCallingSystemPrompt(): string {
  const toolsList = Object.values(TOOL_REGISTRY)
    .map(tool => {
      const params = tool.parameters
        .map(p => `${p.name}${p.required ? '*' : ''} (${p.type}${p.enum ? `: ${p.enum.join('|')}` : ''})`)
        .join(', ');
      
      const confirmationNote = tool.requiresConfirmation ? ' [REQUIRES CONFIRMATION]' : '';
      const sensitivityNote = tool.sensitivity === 'critical' ? ' [CRITICAL - VERIFY DETAILS]' : '';
      
      return `- ${tool.name} (${tool.id})${confirmationNote}${sensitivityNote}
    ${tool.description}
    Parameters: ${params}
    Example: [TOOL_CALL:{"id":"call-123","tool":"${tool.id}","parameters":{${tool.parameters.slice(0, 2).map(p => `"${p.name}":"${p.example || 'value'}"`).join(',')}},"confidence":0.9}]`;
    })
    .join('\n\n');

  return `
TOOL CALLING SYSTEM:

You can call tools to perform actions. Tools are executed by the app, not directly by you.

TOOL CALL FORMAT:
[TOOL_CALL:{"id":"unique-id","tool":"tool_id","parameters":{...},"confidence":0.9,"reasoning":"optional explanation"}]

AVAILABLE TOOLS:
${toolsList}

TOOL CALLING RULES:
1. Only call tools when user explicitly requests an action or clearly states information
2. Confidence must be ≥ 0.7 for tool execution
3. Tools marked [REQUIRES CONFIRMATION] will ask user before executing
4. Tools marked [CRITICAL] require explicit user intent - verify details
5. Never guess or infer - only use tools when intent is clear
6. You can call multiple tools in one response if needed
7. After tool execution, you'll receive results to incorporate into your response

MEDICAL SAFETY RULES:
- Never diagnose or provide medical advice
- Do not infer medication names - only use explicit mentions
- Crisis mood or severe symptoms should be handled with extra care
- Critical tools (care logs, doctor visits) require explicit user statements
- When in doubt, ask the user instead of calling a tool

EXECUTION FLOW:
1. User sends message
2. You decide if tools are needed
3. Include tool calls in your response: [TOOL_CALL:{...}]
4. App executes tools and returns results
5. You receive results and can respond naturally

EXAMPLE:
User: "I took my aspirin this morning"
You: "Got it! I'll log that for you. [TOOL_CALL:{"id":"call-1","tool":"log_medication","parameters":{"medication_name":"aspirin","dose":"1 tablet"},"confidence":0.95}]"
App executes → Returns: [TOOL_RESULT:call-1:success] Logged aspirin
You: "Done! I've logged your aspirin dose for this morning. 💊"
`;
}
