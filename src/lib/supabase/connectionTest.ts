import { supabase } from './client';

/**
 * Test if Supabase connection is working
 */
export async function testSupabaseConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    // Try a simple health check - get the current session (doesn't require auth)
    const { error } = await supabase.auth.getSession();
    
    // If we get here without a network error, connection is working
    // (error is OK if there's no session)
    return { success: true };
  } catch (error: any) {
    console.error('Supabase connection test failed:', error);
    
    if (error.message?.includes('Network request failed')) {
      return {
        success: false,
        error: 'Cannot connect to Supabase. Please check:\n1. Your internet connection\n2. Supabase project is active\n3. URL is correct in .env file',
      };
    }
    
    return {
      success: false,
      error: error.message || 'Connection test failed',
    };
  }
}
