# ALARA Conversational Memory System

## Overview

ALARA now uses a retrieval-based memory architecture that separates memory into distinct types and prevents hallucination by never allowing the AI to "remember" things on its own.

## Architecture

### Memory Types

1. **Short-term Memory** (`memory.ts`)
   - Last 10-20 messages from current conversation
   - Used for conversation flow continuity
   - NOT sent raw to the model - only recent messages for context

2. **Working Memory** (`memory.ts`)
   - Today's mood
   - Last medication taken (with timestamp)
   - Active location (if any)
   - Last check-in date
   - Hydration status (future)

3. **Long-term Memory** (`memory.ts`)
   - User first name
   - Selected personality
   - Active health conditions
   - Current medications
   - Relationship state (familiarity level, tone tolerance)

### Conversation Summary System

- **Table**: `conversation_summaries` (see `supabase/conversation_summary_schema.sql`)
- **Update Frequency**: Every 5-10 messages (configurable via `SUMMARY_UPDATE_INTERVAL`)
- **Content**: Patterns, not quotes
  - Communication patterns (tone, style, preferences)
  - Health-related patterns (compliance habits, stress trends)
  - Relationship context
  - Important recurring themes

### Context Builder Service

**File**: `src/lib/openrouter/contextBuilder.ts`

Before every AI call:
1. Detects user intent from incoming message
2. Fetches ONLY relevant data from Supabase
3. Builds compact context object including:
   - User first name
   - Selected personality
   - Active health conditions
   - Current medications + last taken
   - Mood trend (24-48h)
   - Active location (if any)
   - Conversation summary
   - Relationship state

**Key Feature**: Never sends full chat history to the AI.

## System Prompt Enforcement

### Memory Humility Rules

ALARA is instructed to:
- Never claim perfect memory
- Use phrases like "last time you mentioned..." or "from what I remember..."
- Ask clarifying questions if context is unclear
- Never diagnose or give medical advice
- Speak according to selected personality mode

### Emergency State Override

When emergency keywords are detected, personality is overridden:
- Becomes calm, direct, and authoritative
- Focuses on safety and clear instructions
- No personality quirks

## Memory Write Rules (Safety)

ALARA may only write to the database when:
- Action confidence ≥ 0.7
- Intent is unambiguous
- Action type is allowed

**Supported automatic writes**:
- Mood updates
- Medication logs
- Check-ins
- Health notes
- Reminders

**All writes are logged with** `source = "ai_inferred"`

## Files Created/Modified

### New Files
1. `supabase/conversation_summary_schema.sql` - Database schema for conversation summaries
2. `src/lib/openrouter/memory.ts` - Memory loading functions (short-term, working, long-term)
3. `src/lib/openrouter/conversationSummary.ts` - Summary generation and update service
4. `src/lib/openrouter/contextBuilder.ts` - Context building service with intent detection

### Modified Files
1. `src/lib/openrouter/client.ts` - Updated system prompts with memory rules and emergency override
2. `src/lib/openrouter/actions.ts` - Added memory write rules to action system prompt
3. `src/lib/openrouter/actionExecutors.ts` - Changed source from `'alara_chat'` to `'ai_inferred'`
4. `src/context/ALARAContext.tsx` - Integrated new memory system, removed old userContext approach

## Database Setup

Run the conversation summary schema:

```sql
-- Run this in Supabase SQL Editor
-- File: supabase/conversation_summary_schema.sql
```

## Usage

The system is automatically integrated. When a user sends a message:

1. Context is built based on message intent
2. Short-term memory (last 15 messages) is loaded
3. AI generates response with proper context
4. Actions are executed (if confidence ≥ 0.7)
5. Conversation summary is updated if needed (every 7 messages)

## Key Benefits

1. **No Hallucination**: AI never claims to remember things it doesn't have context for
2. **Efficient**: Only fetches relevant data based on intent
3. **Explainable**: All memory sources are traceable (database queries)
4. **Safe**: Strict rules on when AI can write to database
5. **Scalable**: Conversation summaries prevent context from growing indefinitely

## Future Enhancements

- Relationship state learning (familiarity level based on message count)
- Tone tolerance learning (based on user responses)
- Hydration status tracking
- More sophisticated intent detection
- Context compression for very long conversations
