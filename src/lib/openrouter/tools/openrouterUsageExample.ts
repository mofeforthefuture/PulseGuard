/**
 * OpenRouter Tool Usage Example
 * 
 * This file demonstrates how to use OpenRouter-compatible tool schemas
 * with the OpenRouter API for ALARA.
 */

import { formatToolsForOpenRouter, getToolByName } from './openrouterSchemas';
import type { OpenRouterTool } from './openrouterSchemas';

/**
 * Example: Prepare OpenRouter API request with tools
 */
export function prepareOpenRouterRequest(
  userMessage: string,
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  systemPrompt: string,
  apiKey: string
) {
  // Get all tools formatted for OpenRouter
  const tools = formatToolsForOpenRouter();

  // Prepare messages
  const messages = [
    {
      role: 'system' as const,
      content: systemPrompt,
    },
    ...chatHistory.map(msg => ({
      role: msg.role,
      content: msg.content,
    })),
    {
      role: 'user' as const,
      content: userMessage,
    },
  ];

  // OpenRouter API request
  return {
    model: 'openai/gpt-4o', // or your preferred model
    messages,
    tools,
    tool_choice: 'auto' as const, // Let model decide when to use tools
    // Alternative: 'required' to force tool use, or specific tool name
  };
}

/**
 * Example: Handle OpenRouter response with tool calls
 */
export async function handleOpenRouterResponse(
  response: any,
  userId: string
) {
  const message = response.choices[0]?.message;
  
  if (!message) {
    throw new Error('No message in response');
  }

  // Check if model wants to call tools
  if (message.tool_calls && message.tool_calls.length > 0) {
    const toolResults = [];

    for (const toolCall of message.tool_calls) {
      const toolName = toolCall.function.name;
      let arguments_parsed: any;

      try {
        arguments_parsed = JSON.parse(toolCall.function.arguments);
      } catch (error) {
        console.error(`[OpenRouter] Error parsing tool arguments for ${toolName}:`, error);
        toolResults.push({
          tool_call_id: toolCall.id,
          role: 'tool' as const,
          name: toolName,
          content: JSON.stringify({ error: 'Invalid arguments' }),
        });
        continue;
      }

      // Get tool definition for validation
      const toolDefinition = getToolByName(toolName);
      if (!toolDefinition) {
        toolResults.push({
          tool_call_id: toolCall.id,
          role: 'tool' as const,
          name: toolName,
          content: JSON.stringify({ error: 'Unknown tool' }),
        });
        continue;
      }

      // Execute tool (this would call your executor)
      // For now, just return a placeholder
      const result = await executeTool(toolName, arguments_parsed, userId);

      toolResults.push({
        tool_call_id: toolCall.id,
        role: 'tool' as const,
        name: toolName,
        content: JSON.stringify(result),
      });
    }

    // Return tool results for follow-up request
    return {
      hasToolCalls: true,
      toolResults,
      assistantMessage: message.content || '',
    };
  }

  // No tool calls, just return the message
  return {
    hasToolCalls: false,
    assistantMessage: message.content || '',
  };
}

/**
 * Example: Execute tool (placeholder - integrate with your executor)
 */
async function executeTool(
  toolName: string,
  arguments_: any,
  userId: string
): Promise<any> {
  // This would integrate with your tool executor
  // For example:
  // import { getToolExecutionManager } from './manager';
  // const manager = getToolExecutionManager();
  // return await manager.executeTool(...);

  switch (toolName) {
    case 'log_blood_pressure':
      // Execute blood pressure logging
      return { success: true, message: 'Blood pressure logged' };
    
    case 'log_hydration':
      // Execute hydration logging
      return { success: true, message: 'Hydration logged' };
    
    case 'get_today_summary':
      // Fetch and return summary
      return {
        success: true,
        summary: {
          checkIns: [],
          medications: [],
          bloodPressure: [],
          hydration: 0,
        },
      };
    
    default:
      return { success: false, error: 'Tool not implemented' };
  }
}

/**
 * Example: Complete request/response cycle with tool calling
 */
export async function completeToolCallingCycle(
  userMessage: string,
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  systemPrompt: string,
  apiKey: string,
  userId: string
): Promise<string> {
  // Step 1: Prepare initial request
  const request = prepareOpenRouterRequest(userMessage, chatHistory, systemPrompt, apiKey);

  // Step 2: Make API call
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://pulseguard.app', // Optional: for analytics
      'X-Title': 'PulseGuard ALARA', // Optional: for analytics
    },
    body: JSON.stringify(request),
  });

  const data = await response.json();

  // Step 3: Handle response
  const handled = await handleOpenRouterResponse(data, userId);

  if (handled.hasToolCalls) {
    // Step 4: Make follow-up request with tool results
    const followUpMessages = [
      ...request.messages,
      {
        role: 'assistant' as const,
        content: handled.assistantMessage,
        tool_calls: data.choices[0].message.tool_calls,
      },
      ...handled.toolResults,
    ];

    const followUpRequest = {
      ...request,
      messages: followUpMessages,
    };

    const followUpResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(followUpRequest),
    });

    const followUpData = await followUpResponse.json();
    return followUpData.choices[0]?.message?.content || '';
  }

  return handled.assistantMessage;
}
