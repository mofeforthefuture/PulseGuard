import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase/client';
import { generateALARAResponse as generateOpenRouterResponse, type ALARAPersonality } from '../lib/openrouter/client';
import { loadUserContext, buildContextString } from '../lib/openrouter/userContext';
import Constants from 'expo-constants';

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
  personality: ALARAPersonality;
  hasPersonalitySet: boolean;
  setState: (state: ALARAState) => void;
  showMessage: (message: ALARAMessage) => void;
  hideMessage: () => void;
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
  sendMessage: (text: string) => Promise<void>;
  loadChatHistory: () => Promise<void>;
  clearChatHistory: () => Promise<void>;
  setPersonality: (personality: ALARAPersonality) => Promise<void>;
}

const ALARAContext = createContext<ALARAContextType | undefined>(undefined);

export function ALARAProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<ALARAState>('idle');
  const [message, setMessage] = useState<ALARAMessage | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [personality, setPersonality] = useState<ALARAPersonality>('friendly');
  const [hasPersonalitySet, setHasPersonalitySet] = useState(false);
  const [userContextString, setUserContextString] = useState<string>('');

  // Load user's ALARA personality preference
  const loadPersonality = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('alara_personality')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading personality:', error);
        setPersonality('friendly');
        return;
      }

      if (data?.alara_personality) {
        setPersonality(data.alara_personality as ALARAPersonality);
      } else {
        // No personality set - use friendly as default but mark as not set
        setPersonality('friendly');
      }
    } catch (error) {
      console.error('Error loading personality:', error);
      setPersonality('friendly');
    }
  }, [user?.id]);

  // Check if personality has been explicitly set
  // If there's chat history, they've implicitly chosen
  useEffect(() => {
    if (chatHistory.length > 0) {
      // If they have chat history, they've already chosen (even if default)
      setHasPersonalitySet(true);
    } else {
      // No chat history - check if they've explicitly set it in database
      // For now, if no chat history, show modal to let them choose
      setHasPersonalitySet(false);
    }
  }, [chatHistory.length]);

  // Load user context for ALARA
  const loadUserContextForALARA = useCallback(async () => {
    if (!user?.id) {
      setUserContextString('');
      return;
    }

    try {
      const context = await loadUserContext(user.id);
      if (context) {
        const contextString = buildContextString(context);
        setUserContextString(contextString);
      } else {
        setUserContextString('');
      }
    } catch (error) {
      console.error('Error loading user context:', error);
      setUserContextString('');
    }
  }, [user?.id]);

  // Load chat history and personality on mount
  useEffect(() => {
    if (user?.id) {
      loadPersonality();
      loadChatHistory();
      loadUserContextForALARA();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Refresh user context periodically (every 5 minutes) or when chat history changes significantly
  useEffect(() => {
    if (!user?.id) return;

    // Refresh context when new messages are added (user might have updated their profile)
    const interval = setInterval(() => {
      loadUserContextForALARA();
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(interval);
  }, [user?.id, loadUserContextForALARA]);

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
    console.log('[ALARA] Generating response for:', userMessage);
    
    // Get OpenRouter API key from environment
    const apiKey = Constants.expoConfig?.extra?.openrouterApiKey || process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
    
    if (!apiKey) {
      console.warn('[ALARA] OpenRouter API key not found, using fallback response');
      // Fallback to simple response if API key is missing
      setState('calm');
      return "Hey! I'm having trouble connecting right now. Can you check the API key? 😊";
    }

    console.log('[ALARA] API key found, personality:', personality, 'context length:', userContextString.length);

    // Convert chat history to OpenRouter format
    const historyForAPI = chatHistory
      .filter((msg) => msg.text.trim().length > 0)
      .map((msg) => ({
        role: msg.isALARA ? ('assistant' as const) : ('user' as const),
        content: msg.text,
      }));

    setState('thinking');

    try {
      // Use OpenRouter to generate response with user context
      const response = await generateOpenRouterResponse(
        userMessage,
        personality,
        historyForAPI,
        apiKey,
        undefined, // model (use default)
        userContextString // user context
      );

      // Determine state based on response content (simple heuristic)
      const lowerResponse = response.toLowerCase();
      if (lowerResponse.includes('emergency') || lowerResponse.includes('911') || lowerResponse.includes('urgent')) {
        setState('emergency');
      } else if (lowerResponse.includes('concern') || lowerResponse.includes('worry') || lowerResponse.includes('symptom')) {
        setState('concern');
      } else {
        setState('calm');
      }

      console.log('[ALARA] Response received:', response.substring(0, 50) + '...');
      return response;
    } catch (error) {
      console.error('[ALARA] Error generating response:', error);
      setState('calm');
      
      // Fallback response based on personality
      const fallbackResponses: Record<ALARAPersonality, string> = {
        friendly: "Oops, having some connection issues! Try again in a sec? 😊",
        sassy: "Ugh, my connection is being annoying. Give it a moment? 😏",
        rude: "Connection's being dumb. Try again when it's working. 🙄",
        fun_nurse: "Oops! Technical hiccup! Give me a sec and try again! 🏥✨",
        professional: "Having a connection issue. Try again in a moment.",
        caring: "Having a bit of trouble connecting, but I'm still here! Try again? 💙",
      };

      return fallbackResponses[personality] || fallbackResponses.friendly;
    }
  }, [personality, chatHistory, setState, userContextString]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) {
      console.log('[ALARA] sendMessage called with empty text');
      return;
    }

    console.log('[ALARA] sendMessage called with:', text);
    
    try {
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
    } catch (error) {
      console.error('Error in sendMessage:', error);
      setIsTyping(false);
      setState('calm');
      
      // Show error message to user
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        text: "Sorry, I'm having trouble responding right now. Please try again! 😊",
        isALARA: true,
        timestamp: new Date(),
      };
      setChatHistory((prev) => [...prev, errorMessage]);
    }
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

  const updatePersonality = useCallback(async (newPersonality: ALARAPersonality) => {
    if (!user?.id) return;

    setPersonality(newPersonality);
    setHasPersonalitySet(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ alara_personality: newPersonality })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating personality:', error);
        // Revert on error
        loadPersonality();
      }
    } catch (error) {
      console.error('Error updating personality:', error);
      // Revert on error
      loadPersonality();
    }
  }, [user?.id, loadPersonality]);

  return (
    <ALARAContext.Provider
      value={{
        state,
        message,
        chatHistory,
        isTyping,
        personality,
        hasPersonalitySet,
        setState,
        showMessage,
        hideMessage,
        isVisible,
        setIsVisible,
        sendMessage,
        loadChatHistory,
        clearChatHistory,
        setPersonality: updatePersonality,
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
