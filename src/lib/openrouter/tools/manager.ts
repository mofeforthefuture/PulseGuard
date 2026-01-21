/**
 * Tool Execution Manager
 * Manages the complete tool execution flow including confirmations
 */

import type { ToolCall, ToolExecutionResult, ToolExecutionContext, ToolConfirmation } from './types';
import { getToolDefinition } from './registry';
import { parseToolCallsFromResponse, validateToolCalls } from './parser';
import { executeToolCall, executeToolWithConfirmation, formatToolResultForALARA } from './executor';

export interface ToolExecutionManager {
  executeToolCalls: (
    userId: string,
    toolCalls: ToolCall[],
    userMessage?: string
  ) => Promise<ToolExecutionResult[]>;
  executeWithConfirmation: (
    userId: string,
    toolCall: ToolCall
  ) => Promise<ToolExecutionResult>;
  parseAndExecute: (
    userId: string,
    alaraResponse: string,
    userMessage?: string
  ) => Promise<{
    cleanMessage: string;
    results: ToolExecutionResult[];
    pendingConfirmations: ToolConfirmation[];
  }>;
}

/**
 * Create tool execution manager
 */
export function createToolExecutionManager(): ToolExecutionManager {
  // Store pending confirmations
  const pendingConfirmations = new Map<string, ToolConfirmation>();

  return {
    /**
     * Execute multiple tool calls
     */
    async executeToolCalls(
      userId: string,
      toolCalls: ToolCall[],
      userMessage?: string
    ): Promise<ToolExecutionResult[]> {
      const results: ToolExecutionResult[] = [];

      for (const toolCall of toolCalls) {
        const toolDefinition = getToolDefinition(toolCall.tool);
        if (!toolDefinition) {
          results.push({
            success: false,
            toolCallId: toolCall.id,
            tool: toolCall.tool,
            message: 'Unknown tool',
            error: `Tool ${toolCall.tool} not found in registry`,
          });
          continue;
        }

        const context: ToolExecutionContext = {
          userId,
          toolCall,
          toolDefinition,
          userMessage,
        };

        const result = await executeToolCall(context);
        results.push(result);

        // Store confirmation request if needed
        if (result.requiresConfirmation && result.confirmationPrompt) {
          pendingConfirmations.set(toolCall.id, {
            toolCallId: toolCall.id,
            tool: toolCall.tool,
            parameters: toolCall.parameters,
            prompt: result.confirmationPrompt,
            sensitivity: toolDefinition.sensitivity,
          });
        }
      }

      return results;
    },

    /**
     * Execute tool after user confirmation
     */
    async executeWithConfirmation(
      userId: string,
      toolCall: ToolCall
    ): Promise<ToolExecutionResult> {
      const toolDefinition = getToolDefinition(toolCall.tool);
      if (!toolDefinition) {
        return {
          success: false,
          toolCallId: toolCall.id,
          tool: toolCall.tool,
          message: 'Unknown tool',
          error: `Tool ${toolCall.tool} not found in registry`,
        };
      }

      // Remove from pending confirmations
      pendingConfirmations.delete(toolCall.id);

      return await executeToolWithConfirmation(userId, toolCall, toolDefinition);
    },

    /**
     * Parse tool calls from ALARA response and execute
     */
    async parseAndExecute(
      userId: string,
      alaraResponse: string,
      userMessage?: string
    ): Promise<{
      cleanMessage: string;
      results: ToolExecutionResult[];
      pendingConfirmations: ToolConfirmation[];
    }> {
      // Parse tool calls
      const { cleanMessage, toolCalls } = parseToolCallsFromResponse(alaraResponse);

      // Validate tool calls
      const { valid, invalid } = validateToolCalls(toolCalls);

      // Log invalid calls
      if (invalid.length > 0) {
        console.warn('[ToolManager] Invalid tool calls:', invalid);
      }

      // Execute valid tool calls
      const results = await this.executeToolCalls(userId, valid, userMessage);

      // Get pending confirmations
      const pending = Array.from(pendingConfirmations.values());

      return {
        cleanMessage,
        results,
        pendingConfirmations: pending,
      };
    },
  };
}

/**
 * Global tool execution manager instance
 */
let globalToolManager: ToolExecutionManager | null = null;

/**
 * Get or create global tool execution manager
 */
export function getToolExecutionManager(): ToolExecutionManager {
  if (!globalToolManager) {
    globalToolManager = createToolExecutionManager();
  }
  return globalToolManager;
}
