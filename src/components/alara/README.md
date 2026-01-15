# ALARA Chat Feature

A full-featured chat interface for conversing with ALARA, your health companion.

## Features

- ✅ **Full Chat Interface** - Complete chat UI with message history
- ✅ **Chat History** - Messages are saved to Supabase and persist across sessions
- ✅ **Typing Indicator** - Shows when ALARA is "thinking" and generating a response
- ✅ **Smart Responses** - ALARA responds contextually to health-related queries
- ✅ **Smooth Animations** - Chat bubbles animate in with staggered delays
- ✅ **Accessible** - Tap the FloatingALARA mascot to open chat

## Usage

### Opening Chat

Users can open the chat by tapping the FloatingALARA mascot in the bottom corner of any screen (except emergency screens).

### Chat Interface

The chat screen provides:
- **Header** - Shows ALARA's status (Online/Typing...)
- **Message History** - Scrollable list of previous conversations
- **Input Field** - Type messages to ALARA
- **Send Button** - Send messages (disabled while ALARA is typing)

### ALARA Responses

ALARA uses intelligent, context-aware responses:

- **Health Queries** - Responds to questions about medications, symptoms, etc.
- **Greetings** - Friendly responses to hello/hi messages
- **Help Requests** - Provides information about available features
- **Emergency** - Directs users to call 911 for emergencies
- **Default** - Helpful, empathetic responses for general queries

## Database Schema

Chat messages are stored in the `alara_chat_messages` table:

```sql
CREATE TABLE alara_chat_messages (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  message_text TEXT NOT NULL,
  is_alara BOOLEAN NOT NULL,
  emoji TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

## Components

### ALARAChatScreen

Main chat interface component:

```tsx
import { ALARAChatScreen } from '@/src/components/alara';

<ALARAChatScreen onClose={() => router.back()} />
```

**Props:**
- `onClose?: () => void` - Callback when user closes chat

### ChatMessage Interface

```tsx
interface ChatMessage {
  id: string;
  text: string;
  isALARA: boolean;
  timestamp: Date;
  emoji?: string;
}
```

## Context Integration

The chat functionality is integrated into `ALARAContext`:

```tsx
const {
  chatHistory,
  isTyping,
  sendMessage,
  loadChatHistory,
  clearChatHistory,
} = useALARA();
```

### Methods

- **`sendMessage(text: string)`** - Send a message to ALARA
- **`loadChatHistory()`** - Load previous chat messages from database
- **`clearChatHistory()`** - Clear all chat history

## Future Enhancements

- **LLM Integration** - Replace rule-based responses with real AI (OpenAI, Anthropic, etc.)
- **Voice Input** - Speak to ALARA instead of typing
- **Message Search** - Search through chat history
- **Export Chat** - Export chat history as PDF/text
- **Rich Media** - Support for images, links, etc.
- **Context Awareness** - ALARA remembers previous conversations and user health data

## AI Integration

Currently, ALARA uses rule-based responses. To integrate with an LLM:

1. Replace `generateALARAResponse` in `ALARAContext.tsx`
2. Add API key to environment variables
3. Include user context (medications, health data) in prompts
4. Handle rate limiting and error cases

Example with OpenAI:

```tsx
const generateALARAResponse = async (userMessage: string): Promise<string> => {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are ALARA, a friendly health companion...',
      },
      {
        role: 'user',
        content: userMessage,
      },
    ],
  });
  
  return response.choices[0].message.content;
};
```

## Navigation

The chat screen is accessible via:
- **Route**: `/(tabs)/alara-chat`
- **Access**: Tap FloatingALARA mascot
- **Hidden from tab bar**: Not visible in bottom navigation

## Design

- **Gradient Background** - Matches app design system
- **Chat Bubbles** - ALARA messages use primary gradient, user messages use surface gradient
- **Animations** - Smooth entrance animations for messages
- **Typing Indicator** - Animated dots while ALARA is thinking
- **Empty State** - Friendly welcome message when no chat history
