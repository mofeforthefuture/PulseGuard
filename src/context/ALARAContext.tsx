import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type ALARAState = 'idle' | 'calm' | 'reminder' | 'concern' | 'emergency' | 'thinking';

export interface ALARAMessage {
  text: string;
  duration?: number; // Auto-dismiss after this many ms (0 = no auto-dismiss)
  priority?: 'low' | 'medium' | 'high';
}

interface ALARAContextType {
  state: ALARAState;
  message: ALARAMessage | null;
  setState: (state: ALARAState) => void;
  showMessage: (message: ALARAMessage) => void;
  hideMessage: () => void;
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
}

const ALARAContext = createContext<ALARAContextType | undefined>(undefined);

export function ALARAProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ALARAState>('idle');
  const [message, setMessage] = useState<ALARAMessage | null>(null);
  const [isVisible, setIsVisible] = useState(true);

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

  return (
    <ALARAContext.Provider
      value={{
        state,
        message,
        setState,
        showMessage,
        hideMessage,
        isVisible,
        setIsVisible,
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
