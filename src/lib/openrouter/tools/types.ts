/**
 * Tool Calling Types
 * Type definitions for ALARA's tool-calling system
 */

import type { ToolDefinition, ToolSensitivity } from './registry';

/**
 * Tool call request from ALARA
 */
export interface ToolCall {
  id: string; // Unique ID for this tool call
  tool: string; // Tool ID from registry
  parameters: Record<string, any>; // Tool parameters
  confidence: number; // 0-1, ALARA's confidence in this call
  reasoning?: string; // Optional: why ALARA wants to call this tool
}

/**
 * Tool execution result
 */
export interface ToolExecutionResult {
  success: boolean;
  toolCallId: string;
  tool: string;
  message: string;
  data?: any; // Additional result data
  error?: string;
  requiresConfirmation?: boolean; // If true, execution is pending confirmation
  confirmationPrompt?: string; // Message to show user for confirmation
}

/**
 * Tool confirmation request
 */
export interface ToolConfirmation {
  toolCallId: string;
  tool: string;
  parameters: Record<string, any>;
  prompt: string; // What to ask the user
  sensitivity: ToolSensitivity;
}

/**
 * Tool execution context
 */
export interface ToolExecutionContext {
  userId: string;
  toolCall: ToolCall;
  toolDefinition: ToolDefinition;
  userMessage?: string; // Original user message that triggered this
  chatContext?: string; // Additional chat context
}

/**
 * Tool execution response to ALARA
 */
export interface ToolExecutionResponse {
  toolCallId: string;
  tool: string;
  status: 'success' | 'failed' | 'pending_confirmation' | 'rejected';
  message: string;
  data?: any;
  error?: string;
}
