/**
 * Conversation Summary Service
 * Cost-efficient summarization: only updates when needed
 * - Every 10 messages OR
 * - On major topic shift OR
 * - After emergency events
 */

import Constants from "expo-constants"
import { supabase } from "../supabase/client"
import { loadConversationSummary, saveConversationSummary } from "./memory"

const SUMMARY_UPDATE_INTERVAL = 10 // Update every 10 messages
const SUMMARY_TOKEN_LIMIT = 150 // Max tokens for summary
import { formatMetadataContext } from './metadata';

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

/**
 * Detect if there's been a major topic shift in recent messages
 */
function detectTopicShift(
  recentMessages: Array<{ role: "user" | "assistant"; content: string }>,
  previousTopics: string[] = [],
): boolean {
  if (recentMessages.length < 3) return false

  // Extract keywords from recent messages
  const recentText = recentMessages
    .slice(-5)
    .map((m) => m.content.toLowerCase())
    .join(" ")

  // Health-related topic keywords
  const healthKeywords = [
    "medication",
    "med",
    "pill",
    "symptom",
    "pain",
    "mood",
    "feel",
    "episode",
    "attack",
    "emergency",
    "doctor",
    "appointment",
  ]

  // Check if recent messages contain new health topics
  const currentTopics = healthKeywords.filter((keyword) => recentText.includes(keyword))

  // If we have new topics not in previous summary, it's a shift
  if (previousTopics.length > 0) {
    const hasNewTopics = currentTopics.some((topic) => !previousTopics.includes(topic))
    if (hasNewTopics && currentTopics.length > previousTopics.length) {
      return true
    }
  }

  // Emergency keywords always trigger a shift
  const emergencyKeywords = ["emergency", "911", "urgent", "help", "crisis", "panic"]
  if (emergencyKeywords.some((keyword) => recentText.includes(keyword))) {
    return true
  }

  return false
}

/**
 * Generate or update conversation summary using delta-based approach
 * Only updates if something meaningful changed
 */
async function generateSummary(
  recentMessages: Array<{ role: "user" | "assistant"; content: string }>,
  existingSummary: string | null,
  apiKey: string,
): Promise<string | null> {
  // Delta-based: only use last 10 messages for update
  const deltaMessages = recentMessages.slice(-10)

  // If we have an existing summary, check if update is needed
  if (existingSummary) {
    // Extract topics from existing summary
    const summaryLower = existingSummary.toLowerCase()
    const previousTopics = [
      "medication",
      "med",
      "symptom",
      "mood",
      "episode",
      "emergency",
    ].filter((topic) => summaryLower.includes(topic))

    // Check if there's a meaningful topic shift
    const hasTopicShift = detectTopicShift(deltaMessages, previousTopics)

    // If no topic shift and messages are just continuation, skip update
    if (!hasTopicShift && deltaMessages.length < 5) {
      return null // No meaningful change, keep existing summary
    }
  }

  const systemPrompt = `You are a conversation summarizer. Create a VERY concise summary (max ${SUMMARY_TOKEN_LIMIT} tokens, ~2-3 sentences) that captures:
- Communication patterns (tone, style)
- Health-related patterns (compliance, stress trends)
- Relationship context (familiarity, comfort topics)
- Important recurring themes

Do NOT quote messages. Describe patterns only. Be extremely concise.`

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt },
  ]

  if (existingSummary) {
    messages.push({
      role: "user",
      content: `Previous summary: ${existingSummary}\n\nUpdate ONLY if something meaningful changed. If not, return "NO_UPDATE". Recent messages:\n${deltaMessages.map((m) => `${m.role}: ${m.content}`).join("\n")}`,
    })
  } else {
    messages.push({
      role: "user",
      content: `Create a concise summary (max ${SUMMARY_TOKEN_LIMIT} tokens) based on:\n${deltaMessages.map((m) => `${m.role}: ${m.content}`).join("\n")}`,
    })
  }

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://pulseguard.app",
        "X-Title": "PulseGuard",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages,
        temperature: 0.2, // Lower temperature for more consistent, concise summaries
        max_tokens: SUMMARY_TOKEN_LIMIT,
      }),
    })

    if (!response.ok) {
      await response.json().catch(() => ({}))
      throw new Error(`Summary generation failed: ${response.status}`)
    }

    const data = await response.json()
    const summary = data.choices[0]?.message?.content?.trim() || ""

    // If AI says no update needed, return null
    if (summary.toUpperCase().includes("NO_UPDATE") || summary.length < 20) {
      return null
    }

    return summary
  } catch (error) {
    console.error("[Summary] Error generating summary:", error)
    // Don't throw - return null to indicate failure, caller will handle gracefully
    return null
  }
}

/**
 * Check if summary should be updated and update if needed
 * Only updates:
 * - Every 10 messages OR
 * - On major topic shift OR
 * - After emergency events
 */
export async function updateConversationSummaryIfNeeded(
  userId: string,
  currentMessageCount: number,
  isEmergency: boolean = false,
  userMessage?: string,
): Promise<void> {
  // Emergency mode bypasses summaries entirely
  if (isEmergency) {
    return
  }

  try {
    const existingSummary = await loadConversationSummary(userId)
    const messagesSinceLastUpdate = existingSummary
      ? currentMessageCount - existingSummary.messageCount
      : currentMessageCount

    // Check if we should update based on interval
    const shouldUpdateByInterval = messagesSinceLastUpdate >= SUMMARY_UPDATE_INTERVAL

    // Check for topic shift if we have recent messages
    let shouldUpdateByTopicShift = false
    if (userMessage && messagesSinceLastUpdate >= 3) {
      // Load last few messages to detect topic shift
      const { data: recentMessagesData } = await supabase
        .from("alara_chat_messages")
        .select("message_text, is_alara")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5)

      if (recentMessagesData && recentMessagesData.length > 0) {
        const recentMessages = recentMessagesData.reverse().map((msg) => ({
          role: msg.is_alara ? ("assistant" as const) : ("user" as const),
          content: msg.message_text,
        }))

        const previousTopics = existingSummary?.summaryText
          ? ["medication", "med", "symptom", "mood", "episode", "emergency"].filter(
              (topic) => existingSummary.summaryText.toLowerCase().includes(topic),
            )
          : []

        shouldUpdateByTopicShift = detectTopicShift(recentMessages, previousTopics)
      }
    }

    // Only update if one of the conditions is met
    if (!shouldUpdateByInterval && !shouldUpdateByTopicShift) {
      return
    }

    const apiKey =
      Constants.expoConfig?.extra?.openrouterApiKey || process.env.EXPO_PUBLIC_OPENROUTER_API_KEY

    if (!apiKey) {
      console.warn("[Summary] No API key, skipping summary update")
      return
    }

    // Load recent messages for summary generation (delta-based: only last 10)
    const { data: messages } = await supabase
      .from("alara_chat_messages")
      .select("message_text, is_alara, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10) // Delta-based: only last 10 messages

    if (!messages || messages.length === 0) {
      return
    }

    const recentMessages = messages.reverse().map((msg) => ({
      role: msg.is_alara ? ("assistant" as const) : ("user" as const),
      content: msg.message_text,
    }))

    // Generate new summary (delta-based update)
    const newSummary = await generateSummary(
      recentMessages,
      existingSummary?.summaryText || null,
      apiKey,
    )

    // Only save if summary changed meaningfully
    if (newSummary && newSummary !== existingSummary?.summaryText) {
      await saveConversationSummary(userId, newSummary, currentMessageCount)
      console.log("[Summary] Updated conversation summary (delta-based)")
    } else if (!newSummary) {
      // No meaningful change, but update message count to track interval
      if (shouldUpdateByInterval) {
        await saveConversationSummary(
          userId,
          existingSummary?.summaryText || "",
          currentMessageCount,
        )
      }
    }
  } catch (error) {
    console.error("[Summary] Error updating conversation summary:", error)
    // Don't throw - summary updates are non-critical and optional
  }
}
