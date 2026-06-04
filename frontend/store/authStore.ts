import { create } from 'zustand';
import { SupabaseClient, User, Session } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured, checkSupabaseReachability, isReachable } from '@/lib/supabase';
import logger from '@/lib/logger';

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
  initialized: boolean;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  initialized: false,

  signOut: async () => {
    if (!isSupabaseConfigured) return;
    try {
      const supabase = getSupabaseInstance();
      await supabase.auth.signOut();
      set({ user: null });
    } catch (err) {
      logger.error('Sign out error:', err);
    }
  },

  initialize: async () => {
    if (get().initialized) return;

    // Await reachability check to determine if Supabase is actually accessible
    await checkSupabaseReachability();

    // If Supabase isn't properly configured, unreachable, or navigator is offline, skip auth and allow access
    const isOffline = typeof window !== 'undefined' && !window.navigator.onLine;
    if (!isSupabaseConfigured || !isReachable || isOffline) {
      set({ user: { id: 'guest', email: 'guest@local' } as User, loading: false, initialized: true });
      return;
    }
    
    try {
      const supabase = getSupabaseInstance();
      
      // Wrap getSession in a timeout to prevent indefinite hangs (e.g. from Web Locks API issues)
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise<{ data: { session: Session | null }, error: unknown }>((_, reject) => {
        setTimeout(() => reject(new Error('Supabase getSession timed out - operating in offline mode')), 3000);
      });
      
      const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]);
      
      if (error) {
        // Specifically catch and silence AuthRetryableFetchError in logs if we are offline
        if (error.name === 'AuthRetryableFetchError') {
          logger.warn('[Auth] Operating in offline mode due to fetch error');
          set({ user: { id: 'guest', email: 'guest@local' } as User, loading: false, initialized: true });
          return;
        }
        logger.warn('Auth session retrieval returned an error:', error);
      }

      set({ 
        user: session?.user ?? null, 
        loading: false, 
        initialized: true 
      });

      supabase.auth.onAuthStateChange((event, session) => {
        logger.log(`[Auth] State change: ${event}`);
        set({ user: session?.user ?? null, loading: false });
      });
    } catch (err) {
      const error = err as { name?: string; message?: string };
      const errName = error?.name || '';
      const errMsg = error?.message || '';
      const isOfflineError = 
        errName === 'AuthRetryableFetchError' ||
        errName === 'AuthApiError' ||
        errMsg.toLowerCase().includes('offline') ||
        errMsg.toLowerCase().includes('operating in offline mode') ||
        !isReachable;

      if (isOfflineError) {
        logger.warn('[Auth] Operating in offline mode after catching initialization exception cleanly');
        set({ user: { id: 'guest', email: 'guest@local' } as User, loading: false, initialized: true });
      } else {
        logger.error('Auth initialization caught a critical exception:', err);
        set({ user: null, loading: false, initialized: true });
      }
    }
  },
}));
