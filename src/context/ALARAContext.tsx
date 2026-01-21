import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase/client';
import { generateALARAResponse as generateOpenRouterResponse, type ALARAPersonality } from '../lib/openrouter/client';
import { buildALARAContext, buildContextString } from '../lib/openrouter/contextBuilder';
import { parseActionsFromResponse } from '../lib/openrouter/actions';
import { executeActions } from '../lib/openrouter/actionExecutors';
import { updateConversationSummaryIfNeeded } from '../lib/openrouter/conversationSummary';
import { loadShortTermMemory } from '../lib/openrouter/memory';
import { Audio } from 'expo-av';
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
  const [state, setStateInternal] = useState<ALARAState>('idle');
  const [message, setMessage] = useState<ALARAMessage | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [personality, setPersonality] = useState<ALARAPersonality>('friendly');
  const [hasPersonalitySet, setHasPersonalitySet] = useState(false);
  const previousStateRef = useRef<ALARAState>('idle');
  const soundRefs = useRef<{ messageSound: Audio.Sound | null; errorSound: Audio.Sound | null }>({
    messageSound: null,
    errorSound: null,
  });

  // Load sound files
  useEffect(() => {
    const loadSounds = async () => {
      try {
        // Load message notification sound
        const { sound: messageSound } = await Audio.Sound.createAsync(
          require('../assets/sounds/messageNotification.mp3'),
          { shouldPlay: false, volume: 0.5 }
        );
        soundRefs.current.messageSound = messageSound;

        // Load error sound
        const { sound: errorSound } = await Audio.Sound.createAsync(
          require('../assets/sounds/error.mp3'),
          { shouldPlay: false, volume: 0.6 }
        );
        soundRefs.current.errorSound = errorSound;
      } catch (error) {
        console.log('Could not load ALARA sounds (this is okay):', error);
      }
    };

    loadSounds();

    // Cleanup sounds on unmount
    return () => {
      soundRefs.current.messageSound?.unloadAsync();
      soundRefs.current.errorSound?.unloadAsync();
    };
  }, []);

  // Play sound when state changes to concern or emergency
  const setState = useCallback((newState: ALARAState) => {
    const previousState = previousStateRef.current;
    setStateInternal(newState);
    previousStateRef.current = newState;

    // Play error sound when transitioning to concern or emergency
    if ((newState === 'concern' || newState === 'emergency') && previousState !== newState) {
      soundRefs.current.errorSound?.replayAsync().catch((error) => {
        console.log('Could not play error sound:', error);
      });
    }
  }, []);

  // Play message notification sound
  const playMessageSound = useCallback(async () => {
    try {
      await soundRefs.current.messageSound?.replayAsync();
    } catch (error) {
      console.log('Could not play message sound:', error);
    }
  }, []);

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

  // Load chat history and personality on mount
  useEffect(() => {
    if (user?.id) {
      loadPersonality();
      loadChatHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    console.log('[ALARA] Generating response for:', userMessage);
    
    // Get OpenRouter API key from environment
    const apiKey = Constants.expoConfig?.extra?.openrouterApiKey || process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
    
    if (!apiKey) {
      console.warn('[ALARA] OpenRouter API key not found, using fallback response');
      // Fallback to simple response if API key is missing
      setState('calm');
      return "Hey! I'm having trouble connecting right now. Can you check the API key? 😊";
    }

    if (!user?.id) {
      setState('calm');
      return "I need to know who you are to chat. Please sign in! 😊";
    }

    setState('thinking');

    try {
      // Build context using new context builder (fetches only relevant data)
      // If context building fails, continue with empty context
      let contextString = '';
      let historyForAPI: Array<{ role: 'user' | 'assistant'; content: string }> = [];
      
      try {
        const context = await buildALARAContext(user.id, userMessage);
        contextString = buildContextString(context);
        console.log('[ALARA] Context built, personality:', personality);
      } catch (contextError) {
        console.warn('[ALARA] Context building failed, continuing without context:', contextError);
        // Continue with empty context - response will still work
      }

      // Load short-term memory (last 5-8 messages for cost efficiency)
      // Note: We don't send full history - only recent messages for continuity
      try {
        const shortTermMemory = await loadShortTermMemory(user.id, 8);
        historyForAPI = shortTermMemory.messages
          .filter((msg) => msg.content.trim().length > 0)
          .map((msg) => ({
            role: msg.role,
            content: msg.content,
          }));
      } catch (memoryError) {
        console.warn('[ALARA] Short-term memory loading failed, continuing without history:', memoryError);
        // Continue with empty history - response will still work
      }

      // Use OpenRouter to generate response with new context system
      console.log('[ALARA] Calling OpenRouter API with context length:', contextString.length, 'history messages:', historyForAPI.length);
      const rawResponse = await generateOpenRouterResponse(
        userMessage,
        personality,
        historyForAPI,
        apiKey,
        undefined, // model (use default)
        contextString, // user context (built from memory system)
        true // enable actions
      );
      console.log('[ALARA] Received response from OpenRouter');

      // Parse actions from response
      console.log('[ALARA] Parsing response, length:', rawResponse.length);
      const { cleanMessage, actions } = parseActionsFromResponse(rawResponse);
      console.log('[ALARA] Parsed message, actions count:', actions.length);

      // Determine state based on response content (simple heuristic)
      // Check both user message and response for emergency
      const lowerUserMessage = userMessage.toLowerCase();
      const lowerResponse = cleanMessage.toLowerCase();
      const isEmergency =
        lowerUserMessage.includes('emergency') ||
        lowerUserMessage.includes('911') ||
        lowerUserMessage.includes('urgent') ||
        lowerUserMessage.includes('help me') ||
        lowerResponse.includes('emergency') ||
        lowerResponse.includes('911') ||
        lowerResponse.includes('urgent');

      if (isEmergency) {
        setState('emergency');
      } else if (lowerResponse.includes('concern') || lowerResponse.includes('worry') || lowerResponse.includes('symptom')) {
        setState('concern');
      } else {
        setState('calm');
      }

      // Execute actions if user is authenticated
      if (user?.id && actions.length > 0) {
        console.log('[ALARA] Executing actions:', actions);
        const actionResults = await executeActions(user.id, actions);
        
        // Log results (could show to user if needed)
        actionResults.forEach((result, index) => {
          if (result.success) {
            console.log('[ALARA] Action succeeded:', actions[index].type, result.message);
          } else {
            console.warn('[ALARA] Action failed:', actions[index].type, result.error);
          }
        });
      }

      console.log('[ALARA] Response received:', cleanMessage.substring(0, 50) + '...');
      
      // Update conversation summary if needed (cost-efficient: every 10 messages, topic shifts, or after emergencies)
      // Emergency mode bypasses summaries entirely
      // Do this asynchronously without awaiting to avoid blocking the response
      const totalMessageCount = chatHistory.length + 1; // +1 for the message we just sent
      updateConversationSummaryIfNeeded(user.id, totalMessageCount, isEmergency, userMessage).catch((error) => {
        // Silently fail - summary updates are non-critical
        console.error('[ALARA] Summary update failed (non-critical):', error);
      });

      return cleanMessage;
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
  }, [personality, chatHistory, setState, user?.id]);

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
      // Save message asynchronously - don't block on it
      saveMessage(userMessage).catch((error) => {
        console.error('[ALARA] Failed to save user message (non-critical):', error);
      });

      // Show typing indicator
      setIsTyping(true);
      setState('thinking');

      // Generate ALARA response
      console.log('[ALARA] Starting response generation...');
      const responseText = await generateALARAResponse(text);
      console.log('[ALARA] Response generated successfully, length:', responseText.length);

      // Add ALARA response to history
      const alaraMessage: ChatMessage = {
        id: `alara-${Date.now()}`,
        text: responseText,
        isALARA: true,
        timestamp: new Date(),
      };

      setIsTyping(false);
      setChatHistory((prev) => [...prev, alaraMessage]);
      
      // Play message notification sound for new ALARA message
      playMessageSound();
      
      // Save ALARA message asynchronously - don't block on it
      saveMessage(alaraMessage).catch((error) => {
        console.error('[ALARA] Failed to save ALARA message (non-critical):', error);
      });
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
  }, [generateALARAResponse, saveMessage, setState, playMessageSound]);

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
