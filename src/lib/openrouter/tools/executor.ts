/**
 * Tool Execution Engine
 * Executes tools requested by ALARA and returns results
 * ALARA never writes directly to database - all writes go through this executor
 */

import type { ToolCall, ToolExecutionResult, ToolExecutionContext, ToolConfirmation } from './types';
import { getToolDefinition } from './registry';
import {
  executeLogMedication,
  executeCreateCheckIn,
  executeSaveHealthEntry,
  executeUpdateMood,
  executeCreateReminder,
  executeLogDoctorVisit,
  executeCreateCareLog,
} from '../actionExecutors';
import type { ALARAAction } from '../actions';

/**
 * Validate tool call parameters against tool definition
 */
function validateToolCall(
  toolCall: ToolCall,
  toolDefinition: ToolDefinition
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required parameters
  for (const param of toolDefinition.parameters) {
    if (param.required && !(param.name in toolCall.parameters)) {
      errors.push(`Missing required parameter: ${param.name}`);
    }
  }

  // Validate parameter types and enums
  for (const param of toolDefinition.parameters) {
    const value = toolCall.parameters[param.name];
    if (value === undefined) continue;

    // Type validation
    if (param.type === 'array' && !Array.isArray(value)) {
      errors.push(`Parameter ${param.name} must be an array`);
    } else if (param.type === 'boolean' && typeof value !== 'boolean') {
      errors.push(`Parameter ${param.name} must be a boolean`);
    } else if (param.type === 'number' && typeof value !== 'number') {
      errors.push(`Parameter ${param.name} must be a number`);
    } else if (param.type === 'string' && typeof value !== 'string') {
      errors.push(`Parameter ${param.name} must be a string`);
    } else if (param.type === 'object' && typeof value !== 'object' || Array.isArray(value)) {
      errors.push(`Parameter ${param.name} must be an object`);
    }

    // Enum validation
    if (param.enum && !param.enum.includes(value)) {
      errors.push(`Parameter ${param.name} must be one of: ${param.enum.join(', ')}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Apply medical safety guardrails
 */
function applyMedicalSafetyGuardrails(
  toolCall: ToolCall,
  toolDefinition: ToolDefinition,
  userMessage?: string
): { allowed: boolean; reason?: string } {
  // Check confidence threshold
  if (toolCall.confidence < 0.7) {
    return {
      allowed: false,
      reason: 'Confidence too low. Tool calls require confidence ≥ 0.7',
    };
  }

  // Critical tools always require explicit user intent
  if (toolDefinition.sensitivity === 'critical') {
    const lowerMessage = (userMessage || '').toLowerCase();
    const explicitKeywords = [
      'log',
      'record',
      'save',
      'create',
      'add',
      'document',
      'note',
    ];
    const hasExplicitIntent = explicitKeywords.some(keyword => lowerMessage.includes(keyword));
    
    if (!hasExplicitIntent) {
      return {
        allowed: false,
        reason: 'Critical tools require explicit user intent. Ask user to confirm.',
      };
    }
  }

  // High sensitivity tools need clear user statements
  if (toolDefinition.sensitivity === 'high') {
    // Check if user message contains relevant keywords
    const toolKeywords: Record<string, string[]> = {
      log_medication: ['took', 'taken', 'medication', 'medicine', 'pill', 'dose'],
      log_doctor_visit: ['doctor', 'clinic', 'hospital', 'visit', 'appointment', 'saw'],
    };

    const keywords = toolKeywords[toolCall.tool];
    if (keywords && userMessage) {
      const lowerMessage = userMessage.toLowerCase();
      const hasRelevantKeyword = keywords.some(keyword => lowerMessage.includes(keyword));
      
      if (!hasRelevantKeyword) {
        return {
          allowed: false,
          reason: 'User message does not clearly indicate intent for this tool',
        };
      }
    }
  }

  // Crisis mood requires additional safety checks
  if (toolCall.tool === 'update_mood' || toolCall.tool === 'create_check_in') {
    const mood = toolCall.parameters.mood;
    if (mood === 'crisis') {
      // Crisis mood should trigger safety protocols
      // For now, we allow it but flag it
      console.warn('[ToolExecutor] Crisis mood detected - ensure proper safety protocols');
    }
  }

  return { allowed: true };
}

/**
 * Create confirmation request for tools that require it
 */
function createConfirmationRequest(
  toolCall: ToolCall,
  toolDefinition: ToolDefinition
): ToolConfirmation {
  const parameterSummary = Object.entries(toolCall.parameters)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');

  const prompt = `I'd like to ${toolDefinition.name.toLowerCase()}: ${parameterSummary}. Is this correct?`;

  return {
    toolCallId: toolCall.id,
    tool: toolCall.tool,
    parameters: toolCall.parameters,
    prompt,
    sensitivity: toolDefinition.sensitivity,
  };
}

/**
 * Execute a tool call
 * Returns result or confirmation request
 */
export async function executeToolCall(
  context: ToolExecutionContext
): Promise<ToolExecutionResult> {
  const { userId, toolCall, toolDefinition, userMessage } = context;

  // Validate tool call
  const validation = validateToolCall(toolCall, toolDefinition);
  if (!validation.valid) {
    return {
      success: false,
      toolCallId: toolCall.id,
      tool: toolCall.tool,
      message: 'Tool call validation failed',
      error: validation.errors.join('; '),
    };
  }

  // Apply medical safety guardrails
  const safetyCheck = applyMedicalSafetyGuardrails(toolCall, toolDefinition, userMessage);
  if (!safetyCheck.allowed) {
    return {
      success: false,
      toolCallId: toolCall.id,
      tool: toolCall.tool,
      message: 'Tool call blocked by safety guardrails',
      error: safetyCheck.reason,
    };
  }

  // Check if confirmation is required
  if (toolDefinition.requiresConfirmation) {
    const confirmation = createConfirmationRequest(toolCall, toolDefinition);
    return {
      success: true,
      toolCallId: toolCall.id,
      tool: toolCall.tool,
      message: 'Tool execution pending user confirmation',
      requiresConfirmation: true,
      confirmationPrompt: confirmation.prompt,
    };
  }

  // Execute tool (no confirmation needed)
  return await executeToolDirectly(userId, toolCall, toolDefinition);
}

/**
 * Execute tool directly (after confirmation or if no confirmation needed)
 */
async function executeToolDirectly(
  userId: string,
  toolCall: ToolCall,
  toolDefinition: ToolDefinition
): Promise<ToolExecutionResult> {
  // Convert tool call to ALARA action format for compatibility
  const action: ALARAAction = {
    type: toolCall.tool as any,
    data: toolCall.parameters,
    confidence: toolCall.confidence,
  };

  let result: { success: boolean; message?: string; error?: string };

  try {
    switch (toolCall.tool) {
      case 'log_medication':
        result = await executeLogMedication(userId, action);
        break;
      case 'create_check_in':
        result = await executeCreateCheckIn(userId, action);
        break;
      case 'save_health_entry':
        result = await executeSaveHealthEntry(userId, action);
        break;
      case 'update_mood':
        result = await executeUpdateMood(userId, action);
        break;
      case 'create_reminder':
        result = await executeCreateReminder(userId, action);
        break;
      case 'log_doctor_visit':
        result = await executeLogDoctorVisit(userId, action);
        break;
      case 'create_care_log':
        result = await executeCreateCareLog(userId, action);
        break;
      case 'log_blood_pressure':
        const { executeLogBloodPressure } = await import('../actionExecutors');
        result = await executeLogBloodPressure(userId, action);
        break;
      case 'log_hydration':
        const { executeLogHydration } = await import('../actionExecutors');
        result = await executeLogHydration(userId, action);
        break;
      default:
        result = { success: false, error: `Unknown tool: ${toolCall.tool}` };
    }

    return {
      success: result.success,
      toolCallId: toolCall.id,
      tool: toolCall.tool,
      message: result.message || 'Tool executed successfully',
      error: result.error,
    };
  } catch (error: any) {
    return {
      success: false,
      toolCallId: toolCall.id,
      tool: toolCall.tool,
      message: 'Tool execution failed',
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Execute tool after user confirmation
 */
export async function executeToolWithConfirmation(
  userId: string,
  toolCall: ToolCall,
  toolDefinition: ToolDefinition
): Promise<ToolExecutionResult> {
  return await executeToolDirectly(userId, toolCall, toolDefinition);
}

/**
 * Format tool execution result for ALARA
 * This is what gets sent back to ALARA after tool execution
 */
export function formatToolResultForALARA(result: ToolExecutionResult): string {
  if (result.success) {
    return `[TOOL_RESULT:${result.toolCallId}:success] ${result.message}`;
  } else {
    return `[TOOL_RESULT:${result.toolCallId}:failed] ${result.error || result.message}`;
  }
}
