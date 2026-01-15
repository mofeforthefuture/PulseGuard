import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase/client';

export type ALARAState = 'idle' | 'calm' | 'reminder' | 'concern' | 'emergency' | 'thinking';

export interface ALARAMessage {
  text: string;
  duration?: number; // Auto-dismiss after this many ms (0 = no auto-dismiss)
  priority?: 'low' | 'medium' | 'high';
}

export interface ChatMessage {
  id: string;
  text: string;
  isALARA: boolean;
  timestamp: Date;
  emoji?: string;
}

interface ALARAContextType {
  state: ALARAState;
  message: ALARAMessage | null;
  chatHistory: ChatMessage[];
  isTyping: boolean;
  setState: (state: ALARAState) => void;
  showMessage: (message: ALARAMessage) => void;
  hideMessage: () => void;
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
  sendMessage: (text: string) => Promise<void>;
  loadChatHistory: () => Promise<void>;
  clearChatHistory: () => Promise<void>;
}

const ALARAContext = createContext<ALARAContextType | undefined>(undefined);

export function ALARAProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<ALARAState>('idle');
  const [message, setMessage] = useState<ALARAMessage | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  // Load chat history on mount
  useEffect(() => {
    if (user?.id) {
      loadChatHistory();
    }
  }, [user?.id]);

  const showMessage = useCallback((newMessage: ALARAMessage) => {
    setMessage(newMessage);
    
    // Auto-dismiss after duration if specified
    if (newMessage.duration && newMessage.duration > 0) {
      setTimeout(() => {
        setMessage((current) => {
          // Only dismiss if this is still the current message
          if (current === newMessage) {
            return null;
          }
          return current;
        });
      }, newMessage.duration);
    }
  }, []);

  const hideMessage = useCallback(() => {
    setMessage(null);
  }, []);

  const loadChatHistory = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('alara_chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(100); // Load last 100 messages

      if (error) {
        console.error('Error loading chat history:', error);
        return;
      }

      const messages: ChatMessage[] = (data || []).map((msg) => ({
        id: msg.id,
        text: msg.message_text,
        isALARA: msg.is_alara,
        timestamp: new Date(msg.created_at),
        emoji: msg.emoji || undefined,
      }));

      setChatHistory(messages);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  }, [user?.id]);

  const saveMessage = useCallback(async (msg: ChatMessage) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase.from('alara_chat_messages').insert({
        user_id: user.id,
        message_text: msg.text,
        is_alara: msg.isALARA,
        emoji: msg.emoji || null,
        created_at: msg.timestamp.toISOString(),
      });

      if (error) {
        console.error('Error saving message:', error);
      }
    } catch (error) {
      console.error('Error saving message:', error);
    }
  }, [user?.id]);

  const generateALARAResponse = useCallback(async (userMessage: string): Promise<string> => {
    // Simple rule-based responses (can be replaced with LLM later)
    const lowerMessage = userMessage.toLowerCase();

    // Health-related queries
    if (lowerMessage.includes('how are you') || lowerMessage.includes('how do you feel')) {
      return "I'm doing great! I'm here to help you with your health. How are you feeling today? 😊";
    }

    if (lowerMessage.includes('medication') || lowerMessage.includes('med')) {
      return "I can help you track your medications! Have you taken all your doses today? 💊";
    }

    if (lowerMessage.includes('symptom') || lowerMessage.includes('pain') || lowerMessage.includes('hurt')) {
      setState('concern');
      return "I'm sorry to hear that. Would you like to log this in your check-in? Your health is important. 🤔";
    }

    if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
      setState('calm');
      return "You're welcome! I'm always here to help. Is there anything else you'd like to know? 😊";
    }

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      setState('calm');
      return "Hello! 👋 I'm ALARA, your health companion. How can I help you today?";
    }

    if (lowerMessage.includes('help')) {
      return "I can help you with:\n• Medication reminders\n• Health check-ins\n• Tracking your symptoms\n• Answering health questions\n\nWhat would you like help with? 💬";
    }

    if (lowerMessage.includes('emergency') || lowerMessage.includes('urgent')) {
      setState('emergency');
      return "If this is a medical emergency, please call 911 immediately. I can help you contact your emergency contacts if needed. 🚨";
    }

    // Default responses
    const defaultResponses = [
      "That's interesting! Tell me more about that. 💭",
      "I'm here to help. Can you tell me a bit more? 🤔",
      "I understand. How can I assist you with that? 😊",
      "Let me help you with that. What would you like to know? 💬",
    ];

    setState('thinking');
    // Simulate thinking delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    setState('calm');

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  }, [setState]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    // Add user message to history immediately
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text: text.trim(),
      isALARA: false,
      timestamp: new Date(),
    };

    setChatHistory((prev) => [...prev, userMessage]);
    await saveMessage(userMessage);

    // Show typing indicator
    setIsTyping(true);
    setState('thinking');

    // Generate ALARA response
    const responseText = await generateALARAResponse(text);

    // Add ALARA response to history
    const alaraMessage: ChatMessage = {
      id: `alara-${Date.now()}`,
      text: responseText,
      isALARA: true,
      timestamp: new Date(),
    };

    setIsTyping(false);
    setChatHistory((prev) => [...prev, alaraMessage]);
    await saveMessage(alaraMessage);
  }, [generateALARAResponse, saveMessage, setState]);

  const clearChatHistory = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('alara_chat_messages')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Error clearing chat history:', error);
        return;
      }

      setChatHistory([]);
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  }, [user?.id]);

  return (
    <ALARAContext.Provider
      value={{
        state,
        message,
        chatHistory,
        isTyping,
        setState,
        showMessage,
        hideMessage,
        isVisible,
        setIsVisible,
        sendMessage,
        loadChatHistory,
        clearChatHistory,
      }}
    >
      {children}
    </ALARAContext.Provider>
  );
}

export function useALARA() {
  const context = useContext(ALARAContext);
  if (context === undefined) {
    throw new Error('useALARA must be used within an ALARAProvider');
  }
  return context;
}
