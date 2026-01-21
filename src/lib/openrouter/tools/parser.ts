/**
 * Tool Call Parser
 * Parses tool calls from ALARA's responses
 * Supports both legacy [ACTION:...] format and new [TOOL_CALL:...] format
 */

import type { ToolCall } from './types';
import { getToolDefinition } from './registry';

/**
 * Parse tool calls from ALARA response
 * Supports formats:
 * - Legacy: [ACTION:{"type":"log_medication","data":{...}}]
 * - New: [TOOL_CALL:{"id":"call-123","tool":"log_medication","parameters":{...},"confidence":0.9}]
 */
export function parseToolCallsFromResponse(response: string): {
  cleanMessage: string;
  toolCalls: ToolCall[];
} {
  const toolCalls: ToolCall[] = [];
  let cleanMessage = response;

  // Parse new TOOL_CALL format
  const toolCallRegex = /\[TOOL_CALL:(\{.*?\})\]/g;
  let match;

  while ((match = toolCallRegex.exec(response)) !== null) {
    try {
      const callData = JSON.parse(match[1]);
      if (callData.tool && callData.parameters) {
        toolCalls.push({
          id: callData.id || `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          tool: callData.tool,
          parameters: callData.parameters,
          confidence: callData.confidence || 0.8,
          reasoning: callData.reasoning,
        });
      }
    } catch (error) {
      console.error('[ToolParser] Error parsing tool call:', error, match[1]);
    }
  }

  // Also parse legacy ACTION format for backward compatibility
  const actionRegex = /\[ACTION:(\{.*?\})\]/g;
  while ((match = actionRegex.exec(response)) !== null) {
    try {
      const actionData = JSON.parse(match[1]);
      if (actionData.type && actionData.type !== 'none') {
        // Convert legacy action to tool call format
        toolCalls.push({
          id: `legacy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          tool: actionData.type,
          parameters: actionData.data || {},
          confidence: actionData.confidence || 0.8,
        });
      }
    } catch (error) {
      console.error('[ToolParser] Error parsing legacy action:', error, match[1]);
    }
  }

  // Remove both formats from message
  cleanMessage = cleanMessage.replace(toolCallRegex, '').replace(actionRegex, '').trim();

  return { cleanMessage, toolCalls };
}

/**
 * Validate parsed tool calls against registry
 */
export function validateToolCalls(toolCalls: ToolCall[]): {
  valid: ToolCall[];
  invalid: Array<{ toolCall: ToolCall; error: string }>;
} {
  const valid: ToolCall[] = [];
  const invalid: Array<{ toolCall: ToolCall; error: string }> = [];

  for (const toolCall of toolCalls) {
    const toolDefinition = getToolDefinition(toolCall.tool);
    if (!toolDefinition) {
      invalid.push({
        toolCall,
        error: `Unknown tool: ${toolCall.tool}`,
      });
      continue;
    }

    // Basic validation
    if (toolCall.confidence < 0 || toolCall.confidence > 1) {
      invalid.push({
        toolCall,
        error: 'Confidence must be between 0 and 1',
      });
      continue;
    }

    valid.push(toolCall);
  }

  return { valid, invalid };
}
