import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase/client';
import { auth } from '../lib/supabase/auth';
import type { User } from '../types/user';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session with error handling
    auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        if (session) {
          auth.getCurrentUser()
            .then(setUser)
            .catch((error) => {
              console.error('Error fetching current user:', error);
              setUser(null);
            });
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error getting session:', error);
        setSession(null);
        setUser(null);
        setLoading(false);
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        try {
          const currentUser = await auth.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          console.error('Error fetching user on auth change:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { user, error } = await auth.signIn(email, password);
    if (error) throw error;
    setUser(user);
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { user, error } = await auth.signUp(email, password, fullName);
    if (error) throw error;
    setUser(user);
  };

  const signOut = async () => {
    const { error } = await auth.signOut();
    if (error) throw error;
    setUser(null);
    setSession(null);
  };

  const refreshUser = async () => {
    if (session) {
      try {
        const currentUser = await auth.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error refreshing user:', error);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}



