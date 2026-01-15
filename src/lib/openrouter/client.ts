/**
 * OpenRouter API Client
 * Used for ALARA's AI-powered chat responses
 */

export type ALARAPersonality = 'friendly' | 'sassy' | 'rude' | 'fun_nurse' | 'professional' | 'caring';

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
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
export function getPersonalityPrompt(personality: ALARAPersonality): string {
  const prompts: Record<ALARAPersonality, string> = {
    friendly: `You're ALARA, texting a friend. Be warm, supportive, and real. Talk like you're chatting, not like an assistant. Use casual language, be empathetic, and keep it short (1-2 sentences usually). Throw in emojis when it feels natural. Don't mention you're an AI or assistant - just be a friend who cares about their health.`,

    sassy: `You're ALARA, texting a friend with some sass. You've got attitude and you're not afraid to call things out, but you genuinely care. Be witty, direct, and playful. Talk like you're texting, not like a robot. Keep it short (1-2 sentences usually). Use emojis when it fits. Don't mention you're an AI - just be that friend who tells it like it is.`,

    rude: `You're ALARA, texting a friend who needs some tough love. You're brutally honest, no-nonsense, and don't sugarcoat. You can be snarky but it's because you care. Talk like you're texting, be direct, keep it real. Short responses (1-2 sentences usually). Don't mention you're an AI - just be that friend who doesn't hold back.`,

    fun_nurse: `You're ALARA, texting like that fun nurse friend everyone loves. You're bubbly, energetic, and make health stuff less scary. You know your stuff but you keep it light and fun. Talk like you're texting a friend, not giving a medical lecture. Short and sweet (1-2 sentences usually). Use emojis! Don't mention you're an AI - just be that cool friend who happens to know about health.`,

    professional: `You're ALARA, texting a friend who needs reliable info. You're knowledgeable and precise, but still friendly and approachable. You give good advice without being preachy. Talk like you're texting, not like a textbook. Keep it concise (1-2 sentences usually). Don't mention you're an AI - just be that friend who knows their stuff.`,

    caring: `You're ALARA, texting a friend you really care about. You're gentle, patient, and genuinely concerned. You're like that friend who always has your back. Talk like you're texting, be warm and supportive. Short responses (1-2 sentences usually). Use emojis when it feels right. Don't mention you're an AI - just be a caring friend.`,
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
  userContext?: string
): Promise<string> {
  // Use GPT-4o if available, otherwise fallback to GPT-4o-mini
  const selectedModel = model || DEFAULT_MODEL;
  if (!apiKey) {
    throw new Error('OpenRouter API key is required');
  }

  const systemPrompt = getPersonalityPrompt(personality);
  const contextString = userContext ? userContext : '';
  const fullSystemPrompt = systemPrompt + contextString + '\n\nImportant: Respond naturally like you\'re texting a friend. Don\'t use phrases like "I\'m here to help" or "I can assist you" - just talk normally.';

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
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://pulseguard.app', // Optional: for analytics
        'X-Title': 'PulseGuard', // Optional: for analytics
      },
      body: JSON.stringify({
        model: selectedModel,
        messages,
        temperature: 0.7,
        max_tokens: 200, // Keep responses concise
      }),
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

    const content = data.choices[0].message.content.trim();
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
