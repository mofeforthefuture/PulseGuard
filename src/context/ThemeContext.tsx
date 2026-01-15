import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase/client';

export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'pulseguard_theme_preference';

interface ThemeContextType {
  theme: 'light' | 'dark';
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const { user } = useAuth();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isLoading, setIsLoading] = useState(true);

  // Load theme preference on mount (from local storage first, then sync with database)
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Sync with database when user logs in (after initial load)
  useEffect(() => {
    if (user?.id && !isLoading) {
      syncThemeWithDatabase();
    }
  }, [user?.id, isLoading]);

  // Update theme based on mode
  useEffect(() => {
    if (themeMode === 'system') {
      setTheme(systemColorScheme === 'dark' ? 'dark' : 'light');
    } else {
      setTheme(themeMode);
    }
  }, [themeMode, systemColorScheme]);

  // Load theme preference from local storage first (immediate), then sync with database
  const loadThemePreference = async () => {
    try {
      // Load from local storage first (immediate)
      const storedTheme = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
      
      if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
        setThemeModeState(storedTheme as ThemeMode);
      }

      // Then sync with database if user is logged in
      if (user?.id) {
        await syncThemeWithDatabase();
      }
    } catch (error) {
      console.error('Error loading theme preference from storage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Sync theme preference with database
  const syncThemeWithDatabase = async () => {
    if (!user?.id) return;

    try {
      // Get from database
      const { data, error } = await supabase
        .from('profiles')
        .select('theme_preference')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading theme preference from database:', error);
        return;
      }

      // If database has a preference, use it (database is source of truth for logged-in users)
      if (data?.theme_preference) {
        const dbTheme = data.theme_preference as ThemeMode;
        setThemeModeState(dbTheme);
        // Update local storage to match database
        await SecureStore.setItemAsync(THEME_STORAGE_KEY, dbTheme);
      } else {
        // If no database preference, save current local preference to database
        const localTheme = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
        if (localTheme && ['light', 'dark', 'system'].includes(localTheme)) {
          await supabase
            .from('profiles')
            .update({ theme_preference: localTheme })
            .eq('id', user.id);
        }
      }
    } catch (error) {
      console.error('Error syncing theme with database:', error);
    }
  };

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);

    // Save to local storage immediately (works even when offline)
    try {
      await SecureStore.setItemAsync(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Error saving theme preference to storage:', error);
    }

    // Save to database (if user is logged in)
    if (user?.id) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ theme_preference: mode })
          .eq('id', user.id);

        if (error) {
          console.error('Error saving theme preference to database:', error);
        }
      } catch (error) {
        console.error('Error saving theme preference to database:', error);
      }
    }
  }, [user?.id]);

  const toggleTheme = useCallback(async () => {
    const newMode = theme === 'light' ? 'dark' : 'light';
    await setThemeMode(newMode);
  }, [theme, setThemeMode]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeMode,
        setThemeMode,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
