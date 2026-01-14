import { supabase } from './client';
import type { User } from '../../types/user';

export interface AuthResponse {
  user: User | null;
  error: Error | null;
}

export const auth = {
  async signUp(email: string, password: string, fullName?: string): Promise<AuthResponse> {
    try {
      console.log('Starting signup for:', email);
      
      // Step 1: Create auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: undefined, // Don't redirect on email confirmation
        },
      });

      if (error) {
        console.error('Auth signup error:', {
          message: error.message,
          status: error.status,
          name: error.name,
        });
        
        // Provide more helpful error messages
        if (error.message.includes('Network request failed')) {
          throw new Error('Unable to connect to server. Please check your internet connection and try again.');
        } else if (error.message.includes('User already registered')) {
          throw new Error('An account with this email already exists. Please sign in instead.');
        } else if (error.message.includes('Password')) {
          throw new Error('Password does not meet requirements. Please use a stronger password.');
        }
        
        throw error;
      }

      if (!data.user) {
        throw new Error('User creation failed - no user returned');
      }

      console.log('Auth user created:', data.user.id);

      // Step 2: Profile creation
      // Profile is automatically created by database trigger (handle_new_user)
      // But we can try to create it manually if trigger doesn't exist yet
      if (data.user && data.session) {
        // User is authenticated - try to ensure profile exists
        console.log('Checking/creating profile for user:', data.user.id);
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: data.user.email,
            full_name: fullName,
          }, {
            onConflict: 'id'
          });

        if (profileError) {
          console.warn('Profile upsert failed (may already exist or trigger created it):', profileError.message);
          // Don't fail - trigger might have created it, or it will be created on first login
        } else {
          console.log('Profile ensured successfully');
        }
      } else if (data.user && !data.session) {
        // User created but needs email confirmation
        console.log('User created but requires email confirmation. Profile will be created by database trigger or on first login.');
      }

      return {
        user: data.user as unknown as User,
        error: null,
      };
    } catch (error: any) {
      console.error('Signup error:', error);
      return {
        user: null,
        error: error as Error,
      };
    }
  },

  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return {
        user: data.user as unknown as User,
        error: null,
      };
    } catch (error) {
      return {
        user: null,
        error: error as Error,
      };
    }
  },

  async signOut(): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      return { error: error as Error | null };
    } catch (error) {
      return { error: error as Error };
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting auth user:', userError);
        return null;
      }
      
      if (!user) return null;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        // Return basic user info even if profile doesn't exist yet
        return {
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || null,
          phone_number: null,
          emergency_contact_name: null,
          emergency_contact_phone: null,
          created_at: user.created_at || new Date().toISOString(),
          updated_at: user.updated_at || new Date().toISOString(),
        } as User;
      }

      return profile as User | null;
    } catch (error) {
      console.error('Unexpected error in getCurrentUser:', error);
      return null;
    }
  },

  async getSession() {
    return supabase.auth.getSession();
  },
};



