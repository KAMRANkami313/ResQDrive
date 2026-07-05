import { supabase } from '@api/supabase';
import { UserProfile } from '@app-types/index';

export interface SignUpInput {
  email: string;
  password: string;
  fullName: string;
  phone: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface AuthResult {
  user: UserProfile | null;
  error: string | null;
}

function mapAuthError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('Invalid login credentials')) {
    return 'Invalid email or password. Please try again.';
  }
  if (message.includes('User already registered')) {
    return 'An account with this email already exists.';
  }
  if (message.includes('Password should be at least')) {
    return 'Password must be at least 6 characters long.';
  }
  if (message.includes('Unable to validate email address')) {
    return 'Please enter a valid email address.';
  }
  return message;
}

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.warn('[auth] fetchProfile error:', error.message);
      return null;
    }
    return data as UserProfile;
  } catch (err) {
    console.warn('[auth] fetchProfile exception:', err);
    return null;
  }
}

export const authService = {
  async signUp({ email, password, fullName, phone }: SignUpInput): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
          },
        },
      });

      if (error) return { user: null, error: mapAuthError(error) };
      if (!data.user) return { user: null, error: 'Sign up failed. Please try again.' };

      const profile = await fetchProfile(data.user.id);
      return { user: profile, error: null };
    } catch (err) {
      return { user: null, error: mapAuthError(err) };
    }
  },

  async signIn({ email, password }: SignInInput): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { user: null, error: mapAuthError(error) };
      if (!data.user) return { user: null, error: 'Sign in failed. Please try again.' };

      const profile = await fetchProfile(data.user.id);
      return { user: profile, error: null };
    } catch (err) {
      return { user: null, error: mapAuthError(err) };
    }
  },

  async signOut(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      return { error: error ? mapAuthError(error) : null };
    } catch (err) {
      return { error: mapAuthError(err) };
    }
  },

  async resetPassword(email: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'resqdrive://reset-password',
      });
      return { error: error ? mapAuthError(error) : null };
    } catch (err) {
      return { error: mapAuthError(err) };
    }
  },

  async getCurrentSession(): Promise<UserProfile | null> {
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.user) return null;
      return await fetchProfile(data.session.user.id);
    } catch (err) {
      console.warn('[auth] getCurrentSession exception:', err);
      return null;
    }
  },

  onAuthStateChange(callback: (user: UserProfile | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[auth] onAuthStateChange:', event);
      if (!session?.user) {
        callback(null);
        return;
      }
      const profile = await fetchProfile(session.user.id);
      callback(profile);
    });
  },
};