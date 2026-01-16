# ALARA Memory System - Cost Optimization

## Overview

The memory system has been refactored for cost efficiency while preserving human-like memory and continuity.

## Key Changes

### 1. Summarization Strategy

**Before**: Summarized every 7 messages  
**After**: Summarizes only when:
- Every 10 messages (increased interval)
- Major topic shift detected
- After emergency events

### 2. Delta-Based Summarization

- Only uses last 10 messages (not 30) for context
- Provides existing summary + delta messages
- Updates only if something meaningful changed
- AI can return "NO_UPDATE" if no meaningful change

### 3. Token Limits

- Summary token limit: **150 tokens** (reduced from 300)
- Max summary length: ~2-3 sentences
- Extremely concise pattern descriptions

### 4. Context Building

**Before**: Last 15-20 messages  
**After**: Last 5-8 messages for most turns

- Short-term memory default: 8 messages (reduced from 15)
- Context builder uses 8 messages
- Summaries are optional and only included if message count > 10

### 5. Emergency Mode

- **Bypasses summaries entirely** in emergency mode
- No summary generation during emergencies
- Focuses on immediate response

## Cost Savings

### Summary Generation
- **Before**: Every 7 messages = ~14% of messages
- **After**: Every 10 messages + topic shifts = ~10-12% of messages
- **Delta approach**: Only updates if meaningful change = ~50% fewer updates
- **Token reduction**: 150 tokens vs 300 tokens = 50% reduction per summary

### Context Building
- **Before**: 15-20 messages per turn
- **After**: 5-8 messages per turn
- **Savings**: ~60% reduction in context tokens

### Total Estimated Savings
- **Summary costs**: ~70% reduction (fewer calls + smaller tokens)
- **Context costs**: ~60% reduction per turn
- **Overall**: ~50-60% cost reduction while maintaining quality

## Implementation Details

### Topic Shift Detection

Detects major topic shifts by:
1. Extracting health-related keywords from recent messages
2. Comparing with previous summary topics
3. Triggering update if new topics emerge
4. Emergency keywords always trigger updates

### Delta-Based Update Logic

```typescript
// Only update if:
1. Interval threshold met (10 messages) OR
2. Topic shift detected OR
3. Emergency event occurred

// When updating:
- Provide existing summary + last 10 messages
- AI decides if update is needed
- Returns "NO_UPDATE" if no meaningful change
- Only saves if summary actually changed
```

### Summary Optionality

- Summaries are **optional**, not required
- Only included in context if:
  - Summary exists
  - Message count > 10 (enough history)
- System works without summaries for new users

## Files Modified

1. `src/lib/openrouter/conversationSummary.ts`
   - Changed interval to 10 messages
   - Added topic shift detection
   - Implemented delta-based summarization
   - Reduced token limit to 150
   - Added emergency bypass

2. `src/lib/openrouter/contextBuilder.ts`
   - Reduced message limit from 20 to 8
   - Made summaries optional (only if count > 10)

3. `src/lib/openrouter/memory.ts`
   - Updated default limit from 15 to 8 messages

4. `src/context/ALARAContext.tsx`
   - Passes emergency state to summary function
   - Passes user message for topic shift detection
   - Reduced short-term memory to 8 messages

## Quality Preservation

Despite cost reductions:
- ✅ Human-like memory maintained
- ✅ Continuity preserved with 5-8 message context
- ✅ Topic shifts still captured
- ✅ Emergency handling improved (no summary overhead)
- ✅ Patterns still tracked in summaries

## Future Optimizations

1. **Adaptive intervals**: Increase interval based on conversation length
2. **Smart caching**: Cache summaries for similar topics
3. **Compression**: Further reduce summary tokens for very long conversations
4. **Batch processing**: Batch summary updates during low-activity periods
