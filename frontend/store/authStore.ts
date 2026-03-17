import { create } from 'zustand';
import { SupabaseClient, User } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase';

let supabase: SupabaseClient | null = null;

export function getSupabaseInstance(): SupabaseClient {
  if (!supabase) {
    supabase = getSupabaseClient();
    console.log('Supabase client initialized');
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
    console.log('Sending magic link to:', email);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    });
    console.log('Magic link response:', error);
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
  },
}));
