import { create } from 'zustand';
import { SupabaseClient, User } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

let supabase: SupabaseClient | null = null;

export function getSupabaseInstance(): SupabaseClient {
  if (!supabase) {
    supabase = getSupabaseClient();
  }
  return supabase;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  email: string | null;
  initialized: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  sendMagicLink: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  email: null,
  initialized: false,

  setUser: (user) => set({ user, loading: false }),
  setLoading: (loading) => set({ loading }),

  sendMagicLink: async (email) => {
    const supabase = getSupabaseInstance();
    const redirectTo = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
      : typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : undefined;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    if (!error) {
      set({ email });
    }
    return { error: error as Error | null };
  },

  signOut: async () => {
    const supabase = getSupabaseInstance();
    await supabase.auth.signOut();
    set({ user: null, email: null });
  },

  initialize: async () => {
    if (get().initialized) return;
    // If Supabase isn't properly configured, skip auth and allow access
    if (!isSupabaseConfigured) {
      set({ user: { id: 'guest', email: 'guest@local' } as User, loading: false, initialized: true });
      return;
    }
    try {
      const supabase = getSupabaseInstance();
      const { data: { session } } = await supabase.auth.getSession();
      set({ 
        user: session?.user ?? null, 
        loading: false, 
        initialized: true 
      });

      supabase.auth.onAuthStateChange((_event, session) => {
        set({ user: session?.user ?? null, loading: false });
      });
    } catch (err) {
      console.error('Auth initialization failed:', err);
      set({ user: null, loading: false, initialized: true });
    }
  },
}));
