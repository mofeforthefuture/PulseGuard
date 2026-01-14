import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { storage } from './storage';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Debug logging
if (__DEV__) {
  console.log('Supabase Config:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlLength: supabaseUrl?.length || 0,
    keyLength: supabaseAnonKey?.length || 0,
    urlPrefix: supabaseUrl?.substring(0, 30) || 'N/A',
    urlEndsWith: supabaseUrl?.endsWith('.supabase.co') || false,
  });
  
  // Validate URL format
  if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
    console.warn('⚠️ Supabase URL should start with https://');
  }
  if (supabaseUrl && !supabaseUrl.includes('.supabase.co')) {
    console.warn('⚠️ Supabase URL format looks incorrect. Should be: https://xxxxx.supabase.co');
  }
}

if (!supabaseUrl || !supabaseAnonKey) {
  const error = new Error(
    'Missing Supabase environment variables. Please check your .env file and ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set.'
  );
  console.error('Supabase Configuration Error:', error.message);
  throw error;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

