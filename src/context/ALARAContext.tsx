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
import { ALARADataConfirmationSheet, type DataConfirmation, type BloodPressureData, type HydrationData, type AppointmentData } from '../components/alara/ALARADataConfirmationSheet';
import { executeLogBloodPressure, executeLogHydration } from '../lib/openrouter/actionExecutors';
import type { ALARAAction } from '../lib/openrouter/actions';

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
  
  // Bottom sheet state for data confirmation
  const [showDataConfirmationSheet, setShowDataConfirmationSheet] = useState(false);
  const [dataConfirmationData, setDataConfirmationData] = useState<DataConfirmation | null>(null);
  const [pendingUserMessage, setPendingUserMessage] = useState<string>(''); // Preserve context
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
          require('../../assets/sounds/messageNotification.mp3'),
          { shouldPlay: false, volume: 0.5 }
        );
        soundRefs.current.messageSound = messageSound;

        // Load error sound
        const { sound: errorSound } = await Audio.Sound.createAsync(
          require('../../assets/sounds/error.mp3'),
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

      // Parse tool calls and actions from response
      console.log('[ALARA] Parsing response, length:', rawResponse.length);
      
      // Check for OpenRouter tool calls first
      let toolCalls: any[] = [];
      let responseContent = rawResponse;
      
      const toolCallsMatch = rawResponse.match(/\[TOOL_CALLS:(.+?)\]/);
      if (toolCallsMatch) {
        try {
          toolCalls = JSON.parse(toolCallsMatch[1]);
          responseContent = rawResponse.replace(/\[TOOL_CALLS:.+?\]/, '').trim();
          console.log('[ALARA] Found tool calls:', toolCalls.length);
        } catch (error) {
          console.error('[ALARA] Error parsing tool calls:', error);
        }
      }
      
      // Parse legacy actions format
      const { cleanMessage, actions } = parseActionsFromResponse(responseContent);
      console.log('[ALARA] Parsed message, actions count:', actions.length, 'tool calls:', toolCalls.length);
      
      // Convert OpenRouter tool calls to actions format
      for (const toolCall of toolCalls) {
        if (toolCall.function?.name === 'log_blood_pressure') {
          try {
            const args = JSON.parse(toolCall.function.arguments);
            actions.push({
              type: 'log_blood_pressure',
              data: {
                systolic: args.systolic,
                diastolic: args.diastolic,
                pulse: args.pulse,
                position: args.position,
                notes: args.notes,
              },
              confidence: 0.9, // High confidence for tool calls
            });
          } catch (error) {
            console.error('[ALARA] Error parsing blood pressure tool call:', error);
          }
        } else if (toolCall.function?.name === 'log_hydration') {
          try {
            const args = JSON.parse(toolCall.function.arguments);
            actions.push({
              type: 'log_hydration',
              data: {
                amount: args.amount,
                notes: args.notes,
              },
              confidence: 0.9, // High confidence for tool calls
            });
          } catch (error) {
            console.error('[ALARA] Error parsing hydration tool call:', error);
          }
        }
      }

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
        
        // Handle blood pressure results with confirmation for unusual values
        let needsConfirmation = false;
        let confirmationData: any = null;
        let confirmationType: string | null = null;
        let hydrationFeedback = '';
        
        let shouldShowBottomSheet = false;
        let bottomSheetData: DataConfirmation | null = null;
        
        actionResults.forEach((result, index) => {
          if (result.success) {
            console.log('[ALARA] Action succeeded:', actions[index].type, result.message);
            
            // Check if blood pressure needs confirmation (always show bottom sheet for BP)
            if (actions[index].type === 'log_blood_pressure' && result.success) {
              // Always show bottom sheet for BP to allow editing
              const bpData: BloodPressureData = {
                type: 'blood_pressure',
                source: userMessage,
                systolic: actions[index].data?.systolic,
                diastolic: actions[index].data?.diastolic,
                pulse: actions[index].data?.pulse,
                position: actions[index].data?.position,
                notes: actions[index].data?.notes,
                isUnusual: result.data?.isUnusual,
                abnormalReason: result.data?.abnormalReason,
              };
              shouldShowBottomSheet = true;
              bottomSheetData = bpData;
              cleanMessage = "I've extracted your blood pressure reading. Please review and confirm in the form below.";
            }
            
            // Handle hydration logging - show bottom sheet for confirmation
            if (actions[index].type === 'log_hydration' && result.success) {
              // Always show bottom sheet for hydration to allow editing
              const hydrationData: HydrationData = {
                type: 'hydration',
                source: userMessage,
                amount: actions[index].data?.amount,
                notes: actions[index].data?.notes,
              };
              shouldShowBottomSheet = true;
              bottomSheetData = hydrationData;
              cleanMessage = "I've extracted your hydration amount. Please review and confirm in the form below.";
            }
            
            // Check if doctor visit outcome requires confirmation
            if (actions[index].type === 'log_doctor_visit_outcome' && result.requiresConfirmation) {
              needsConfirmation = true;
              confirmationType = 'doctor_visit_outcome';
              confirmationData = result.confirmationData || result.data;
              
              // Format confirmation message for ALARA response
              const conf = result.confirmationData || {};
              const parts: string[] = [];
              parts.push(`Visit Date: ${conf.visitDate || 'Today'}`);
              if (conf.followUpTiming && conf.followUpDate) {
                parts.push(`Follow-up: ${conf.followUpTiming} (${conf.followUpDate})`);
              }
              if (conf.diagnosis) parts.push(`Diagnosis: ${conf.diagnosis}`);
              if (conf.treatment) parts.push(`Treatment: ${conf.treatment}`);
              if (conf.medicationChanges) parts.push(`Medication: ${conf.medicationChanges}`);
              
              cleanMessage = `I've extracted the following from your doctor visit:\n\n${parts.join('\n')}\n\nIs this correct? (Please confirm or let me know what to change)`;
            }
            
            // Check if reminder scheduling requires confirmation
            if (actions[index].type === 'schedule_reminder' && result.requiresConfirmation) {
              needsConfirmation = true;
              confirmationType = 'reminder';
              confirmationData = result.confirmationData || result.data;
              
              // Format confirmation message for ALARA response
              const conf = result.confirmationData || {};
              const parts: string[] = [];
              parts.push(`Title: ${conf.title}`);
              if (conf.isRecurring) {
                parts.push(`Type: Recurring`);
                parts.push(`Days: ${conf.daysOfWeekFormatted || 'Every day'}`);
                if (conf.interval) parts.push(`Interval: ${conf.interval}`);
              } else {
                parts.push(`Type: One-time`);
                parts.push(`Date: ${conf.oneTimeDateFormatted || conf.oneTimeDate}`);
              }
              parts.push(`Time: ${conf.time || '09:00'}`);
              
              cleanMessage = `I've extracted the following reminder:\n\n${parts.join('\n')}\n\nIs this correct? (Please confirm or let me know what to change)`;
            }
            
            // Check if doctor recommendation requires confirmation
            if (actions[index].type === 'parse_doctor_recommendation' && result.requiresConfirmation) {
              needsConfirmation = true;
              confirmationType = 'doctor_recommendation';
              confirmationData = result.confirmationData || result.data;
              
              // Format confirmation message for ALARA response
              const conf = result.confirmationData || {};
              const parts: string[] = [];
              parts.push(`Doctor said: "${conf.recommendationText}"`);
              if (conf.action) parts.push(`Action: ${conf.action}`);
              parts.push(`\nProposed reminder:`);
              parts.push(`Title: ${conf.proposedReminder?.title}`);
              if (conf.proposedReminder?.isRecurring) {
                parts.push(`Type: Recurring`);
                parts.push(`Days: ${conf.proposedReminder.daysOfWeekFormatted || 'Every day'}`);
                if (conf.proposedReminder.interval) parts.push(`Interval: ${conf.proposedReminder.interval}`);
              } else {
                parts.push(`Type: One-time`);
                parts.push(`Date: ${conf.proposedReminder?.oneTimeDateFormatted || conf.proposedReminder?.oneTimeDate}`);
              }
              parts.push(`Time: ${conf.proposedReminder?.time || '09:00'}`);
              
              cleanMessage = `I've parsed the doctor's recommendation and proposed this reminder:\n\n${parts.join('\n')}\n\nWould you like to approve this reminder? (Yes/No/Edit)`;
            }
            
          } else {
            console.warn('[ALARA] Action failed:', actions[index].type, result.error);
            
            // If blood pressure logging failed, update response to mention it
            if (actions[index].type === 'log_blood_pressure') {
              const errorMsg = result.error || 'Failed to log blood pressure';
              // Add error context to response (will be handled in final response)
              if (errorMsg.includes('required') || errorMsg.includes('invalid')) {
                cleanMessage = cleanMessage + ` (Note: I couldn't extract the blood pressure values clearly. Could you tell me the numbers again?)`;
              }
            }
            
            // If hydration logging failed, update response
            if (actions[index].type === 'log_hydration') {
              const errorMsg = result.error || 'Failed to log hydration';
              if (errorMsg.includes('required') || errorMsg.includes('invalid')) {
                cleanMessage = cleanMessage + ` (I couldn't figure out how much you drank. Could you tell me the amount? Like "500ml" or "two bottles"?)`;
              }
            }
          }
        });
        
        // Show bottom sheet if needed (after processing all actions)
        if (shouldShowBottomSheet && bottomSheetData) {
          setDataConfirmationData(bottomSheetData);
          setShowDataConfirmationSheet(true);
          setPendingUserMessage(userMessage); // Preserve context
        }
        
        // If unusual BP value, add gentle flagging to response
        if (needsConfirmation && confirmationData) {
          const { systolic, diastolic, abnormalReason } = confirmationData;
          let flagMessage = '';
          
          // Gentle flagging based on abnormal reason
          if (abnormalReason === 'both_high' || abnormalReason === 'high_systolic' || abnormalReason === 'high_diastolic') {
            if (systolic >= 180 || diastolic >= 120) {
              flagMessage = ' I noticed this reading is quite high. If you\'re experiencing symptoms or this is unusual for you, please consider reaching out to your healthcare provider.';
            } else {
              flagMessage = ' I noticed this reading is a bit higher than normal. Keep an eye on it and consider mentioning it to your healthcare provider if it continues.';
            }
          } else if (abnormalReason === 'both_low' || abnormalReason === 'low_systolic' || abnormalReason === 'low_diastolic') {
            flagMessage = ' I noticed this reading is lower than usual. If you\'re feeling dizzy or unwell, please consider checking with your healthcare provider.';
          }
          
          if (flagMessage) {
            // Update clean message to include gentle flagging
            cleanMessage = cleanMessage.replace(/\.$/, '') + flagMessage;
          }
        }
        
        // Add hydration feedback if available
        if (hydrationFeedback) {
          // Replace the clean message with hydration feedback if it's just a generic response
          if (cleanMessage.toLowerCase().includes('logged') || cleanMessage.toLowerCase().includes('got it')) {
            cleanMessage = hydrationFeedback;
          } else {
            cleanMessage = cleanMessage + ' ' + hydrationFeedback;
          }
        }
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

  // Handle bottom sheet confirmation
  const handleDataConfirmation = useCallback(async (confirmedData: DataConfirmation) => {
    if (!user?.id) return;

    try {
      let action: ALARAAction | null = null;

      switch (confirmedData.type) {
        case 'blood_pressure': {
          const bpData = confirmedData as BloodPressureData;
          action = {
            type: 'log_blood_pressure',
            data: {
              systolic: bpData.systolic,
              diastolic: bpData.diastolic,
              pulse: bpData.pulse,
              position: bpData.position,
              notes: bpData.notes,
            },
            confidence: 1.0, // User confirmed
          };
          break;
        }
        case 'hydration': {
          const hydrationData = confirmedData as HydrationData;
          action = {
            type: 'log_hydration',
            data: {
              amount: hydrationData.amount,
              notes: hydrationData.notes,
            },
            confidence: 1.0, // User confirmed
          };
          break;
        }
        case 'appointment': {
          // Appointment handling can be added later
          console.log('[ALARA] Appointment confirmation not yet implemented');
          break;
        }
      }

      if (action) {
        const results = await executeActions(user.id, [action]);
        const result = results[0];

        if (result.success) {
          // Add success message to chat
          const successMessage: ChatMessage = {
            id: `success-${Date.now()}`,
            text: result.message || 'Saved successfully! ✅',
            isALARA: true,
            timestamp: new Date(),
          };
          setChatHistory((prev) => [...prev, successMessage]);
          saveMessage(successMessage).catch(console.error);
        } else {
          // Add error message to chat
          const errorMessage: ChatMessage = {
            id: `error-${Date.now()}`,
            text: result.error || 'Failed to save. Please try again.',
            isALARA: true,
            timestamp: new Date(),
          };
          setChatHistory((prev) => [...prev, errorMessage]);
        }
      }

      // Close bottom sheet
      setShowDataConfirmationSheet(false);
      setDataConfirmationData(null);
      setPendingUserMessage('');
    } catch (error) {
      console.error('[ALARA] Error confirming data:', error);
      setShowDataConfirmationSheet(false);
      setDataConfirmationData(null);
      setPendingUserMessage('');
    }
  }, [user?.id, saveMessage]);

  const handleDataConfirmationCancel = useCallback(() => {
    setShowDataConfirmationSheet(false);
    setDataConfirmationData(null);
    setPendingUserMessage('');
  }, []);

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
        showDataConfirmationSheet,
        dataConfirmationData,
      }}
    >
      {children}
      <ALARADataConfirmationSheet
        visible={showDataConfirmationSheet}
        data={dataConfirmationData}
        onConfirm={handleDataConfirmation}
        onCancel={handleDataConfirmationCancel}
      />
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
