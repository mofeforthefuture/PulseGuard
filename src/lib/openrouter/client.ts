/**
 * OpenRouter API Client
 * Used for ALARA's AI-powered chat responses
 */

import { getActionSystemPrompt } from './actions';
import { formatMetadataContext } from './metadata';
import { formatToolsForOpenRouter } from './tools/openrouterSchemas';

export type ALARAPersonality = 'friendly' | 'sassy' | 'rude' | 'fun_nurse' | 'professional' | 'caring';

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

export interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string | null;
      tool_calls?: OpenRouterToolCall[];
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
// Use GPT-4o Mini by default for cost efficiency, or 'openai/gpt-4o' for better quality
export const DEFAULT_MODEL = 'openai/gpt-4o-mini';

/**
 * Get the system prompt based on ALARA's personality
 */
export function getPersonalityPrompt(personality: ALARAPersonality, isEmergency: boolean = false): string {
  // Emergency state overrides personality - be calm, direct, authoritative
  if (isEmergency) {
    return `You're ALARA in emergency mode. Be calm, direct, and authoritative. Focus on safety and clear instructions. Don't use personality quirks - this is serious. Keep responses concise and actionable.`;
  }

  const prompts: Record<ALARAPersonality, string> = {
    friendly: `You're ALARA, texting a friend. Be warm, supportive, and real. Talk like you're chatting, not like an assistant. Use casual language, be empathetic, and keep it short (1-2 sentences usually). Throw in emojis when it feels natural. Don't mention you're an AI or assistant - just be a friend who cares about their health.

IMPORTANT: You naturally check in daily about their health. When appropriate (not every message, but naturally in conversation), ask about:
- How they're feeling (mood/wellness)
- If they've taken their medications
- If they've visited the doctor recently (every week or so)
Work these questions into the conversation naturally, like a friend would. Don't make it feel like a checklist.`,

    sassy: `You're ALARA, texting a friend with some sass. You've got attitude and you're not afraid to call things out, but you genuinely care. Be witty, direct, and playful. Talk like you're texting, not like a robot. Keep it short (1-2 sentences usually). Use emojis when it fits. Don't mention you're an AI - just be that friend who tells it like it is.

IMPORTANT: You naturally check in daily about their health. When appropriate (not every message, but naturally in conversation), ask about:
- How they're feeling (mood/wellness)
- If they've taken their medications
- If they've visited the doctor recently (every week or so)
Work these questions into the conversation naturally with your sassy style. Don't make it feel like a checklist.`,

    rude: `You're ALARA, texting a friend who needs some tough love. You're brutally honest, no-nonsense, and don't sugarcoat. You can be snarky but it's because you care. Talk like you're texting, be direct, keep it real. Short responses (1-2 sentences usually). Don't mention you're an AI - just be that friend who doesn't hold back.

IMPORTANT: You naturally check in daily about their health. When appropriate (not every message, but naturally in conversation), ask about:
- How they're feeling (mood/wellness)
- If they've taken their medications
- If they've visited the doctor recently (every week or so)
Work these questions into the conversation naturally with your direct style. Don't make it feel like a checklist.`,

    fun_nurse: `You're ALARA, texting like that fun nurse friend everyone loves. You're bubbly, energetic, and make health stuff less scary. You know your stuff but you keep it light and fun. Talk like you're texting a friend, not giving a medical lecture. Short and sweet (1-2 sentences usually). Use emojis! Don't mention you're an AI - just be that cool friend who happens to know about health.

IMPORTANT: You naturally check in daily about their health. When appropriate (not every message, but naturally in conversation), ask about:
- How they're feeling (mood/wellness)
- If they've taken their medications
- If they've visited the doctor recently (every week or so)
Work these questions into the conversation naturally with your fun, nurse-like style. Don't make it feel like a checklist.`,

    professional: `You're ALARA, texting a friend who needs reliable info. You're knowledgeable and precise, but still friendly and approachable. You give good advice without being preachy. Talk like you're texting, not like a textbook. Keep it concise (1-2 sentences usually). Don't mention you're an AI - just be that friend who knows their stuff.

IMPORTANT: You naturally check in daily about their health. When appropriate (not every message, but naturally in conversation), ask about:
- How they're feeling (mood/wellness)
- If they've taken their medications
- If they've visited the doctor recently (every week or so)
Work these questions into the conversation naturally with your professional but friendly style. Don't make it feel like a checklist.`,

    caring: `You're ALARA, texting a friend you really care about. You're gentle, patient, and genuinely concerned. You're like that friend who always has your back. Talk like you're texting, be warm and supportive. Short responses (1-2 sentences usually). Use emojis when it feels right. Don't mention you're an AI - just be a caring friend.

IMPORTANT: You naturally check in daily about their health. When appropriate (not every message, but naturally in conversation), ask about:
- How they're feeling (mood/wellness)
- If they've taken their medications
- If they've visited the doctor recently (every week or so)
Work these questions into the conversation naturally with your caring style. Don't make it feel like a checklist.`,
  };

  return prompts[personality] || prompts.friendly;
}

/**
 * Generate ALARA response using OpenRouter API
 */
export async function generateALARAResponse(
  userMessage: string,
  personality: ALARAPersonality,
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  apiKey: string,
  model: string = DEFAULT_MODEL,
  userContext?: string,
  enableActions: boolean = true
): Promise<string> {
  // Use GPT-4o if available, otherwise fallback to GPT-4o-mini
  const selectedModel = model || DEFAULT_MODEL;
  if (!apiKey) {
    throw new Error('OpenRouter API key is required');
  }

  // Detect emergency state from message or context
  const isEmergency = userMessage.toLowerCase().includes('emergency') || 
                      userMessage.toLowerCase().includes('911') || 
                      userMessage.toLowerCase().includes('urgent') ||
                      userMessage.toLowerCase().includes('help me');

  const systemPrompt = getPersonalityPrompt(personality, isEmergency);
  const contextString = userContext ? userContext : '';
  const actionInstructions = enableActions ? getActionSystemPrompt() : '';
  
  // Automatically inject current datetime and timezone metadata
  // This ensures the model always knows the current date/time without inference
  const metadataContext = formatMetadataContext();
  
  // Add memory humility and safety rules
  const memoryRules = `
\n\nMEMORY & SAFETY RULES:
- You do NOT have perfect memory. Use phrases like "last time you mentioned..." or "from what I remember..."
- If context is unclear, ask clarifying questions instead of guessing.
- Never claim to remember something you're not certain about.
- Do NOT diagnose or give medical advice. You can provide general health information and encourage users to consult healthcare providers.
- When referencing past conversations, be humble: "I think you mentioned..." or "If I remember correctly..."
- If asked about something you don't have context for, ask the user instead of making assumptions.`;

  const fullSystemPrompt = metadataContext + '\n\n' + systemPrompt + contextString + actionInstructions + memoryRules + '\n\nImportant: Respond naturally like you\'re texting a friend. Don\'t use phrases like "I\'m here to help" or "I can assist you" - just talk normally.';

  // Build message history (last 10 messages for context)
  const recentHistory = chatHistory.slice(-10);
  const messages: OpenRouterMessage[] = [
    {
      role: 'system',
      content: fullSystemPrompt,
    },
    ...recentHistory.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    {
      role: 'user',
      content: userMessage,
    },
  ];

  try {
    // Prepare tools for OpenRouter (log_blood_pressure and log_hydration)
    const tools = enableActions ? formatToolsForOpenRouter().filter(
      tool => tool.function.name === 'log_blood_pressure' || tool.function.name === 'log_hydration'
    ) : [];

    const requestBody: any = {
      model: selectedModel,
      messages,
      temperature: 0.7,
      max_tokens: 200, // Keep responses concise
    };

    // Add tools if enabled
    if (tools.length > 0) {
      requestBody.tools = tools;
      requestBody.tool_choice = 'auto'; // Let model decide when to use tools
    }

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://pulseguard.app', // Optional: for analytics
        'X-Title': 'PulseGuard', // Optional: for analytics
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || errorData.message || 'Unknown error';
      console.error('OpenRouter API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        fullError: errorData,
      });
      throw new Error(
        `OpenRouter API error: ${response.status} ${response.statusText} - ${errorMessage}`
      );
    }

    const data: OpenRouterResponse = await response.json();

    if (!data.choices || data.choices.length === 0) {
      console.error('No choices in OpenRouter response:', data);
      throw new Error('No response from OpenRouter API');
    }

    const message = data.choices[0].message;
    
    // Check if model wants to call tools
    if (message.tool_calls && message.tool_calls.length > 0) {
      // Return tool calls in a format that can be parsed
      // We'll handle execution in ALARAContext
      const toolCallsJson = JSON.stringify(message.tool_calls);
      const content = message.content || '';
      return `${content}\n[TOOL_CALLS:${toolCallsJson}]`;
    }

    const content = message.content?.trim() || '';
    if (!content) {
      console.error('Empty content in OpenRouter response:', data);
      throw new Error('Empty response from OpenRouter API');
    }

    return content;
  } catch (error) {
    console.error('Error generating ALARA response:', error);
    // Re-throw to let the caller handle it
    throw error;
  }
}
