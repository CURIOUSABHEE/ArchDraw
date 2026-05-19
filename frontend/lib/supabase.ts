import { createClient as _createClient, type SupabaseClient } from '@supabase/supabase-js';
import { type Database } from '../types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export let isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
let reachabilityPromise: Promise<boolean> | null = null;
let isReachable = true;

export function checkSupabaseReachability(): Promise<boolean> {
  if (!isSupabaseConfigured) return Promise.resolve(false);
  if (reachabilityPromise) return reachabilityPromise;

  reachabilityPromise = new Promise<boolean>((resolve) => {
    if (typeof window === 'undefined') {
      resolve(true); // default to true on server-side
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    fetch(`${supabaseUrl}/auth/v1/health`, {
      method: 'GET',
      credentials: 'omit',
      signal: controller.signal,
    })
      .then(() => {
        clearTimeout(timeoutId);
        isReachable = true;
        resolve(true);
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        console.warn('Supabase is configured but unreachable. Falling back to offline mode.', err);
        isSupabaseConfigured = false;
        isReachable = false;
        resolve(false);
      });
  });

  return reachabilityPromise;
}

// Start reachability check immediately in browser
if (typeof window !== 'undefined' && isSupabaseConfigured) {
  checkSupabaseReachability();
}

// Custom fetch to gracefully handle network failures (e.g. offline, DNS block)
const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  try {
    return await fetch(input, init);
  } catch (error) {
    console.warn('Supabase fetch failed, intercepting and degrading gracefully:', error);
    return new Response(
      JSON.stringify({
        error: 'service_unavailable',
        message: 'Supabase server is unreachable or offline',
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// Singleton for browser usage
let _client: SupabaseClient<Database> | null = null;

export function getSupabaseClient(): SupabaseClient<Database> {
  if (!isSupabaseConfigured || !isReachable) throw new Error('Supabase not configured or unreachable');
  if (!_client) {
    _client = _createClient<Database>(supabaseUrl, supabaseAnonKey, {
      global: {
        fetch: customFetch,
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      }
    });
  }
  return _client;
}

// Keep named export for compatibility
export const createClient = getSupabaseClient;

export interface UserCanvasesTable {
  insert: (values: Database['public']['Tables']['user_canvases']['Insert']) => Promise<{ data: unknown; error: unknown }>;
  upsert: (values: Database['public']['Tables']['user_canvases']['Insert']) => Promise<{ data: unknown; error: unknown }>;
  select: (columns?: string) => {
    order: (column: string, options?: { ascending?: boolean }) => Promise<{ data: Database['public']['Tables']['user_canvases']['Row'][] | null; error: unknown }>;
  };
  delete: () => {
    eq: (column: string, value: string) => Promise<{ data: unknown; error: unknown }>;
  };
}

export interface TutorialProgressTable {
  upsert: (
    values: Database['public']['Tables']['tutorial_progress']['Insert'],
    options?: { onConflict?: string }
  ) => {
    select: (columns?: string) => {
      single: () => Promise<{ data: Database['public']['Tables']['tutorial_progress']['Row'] | null; error: { message: string } | null }>;
    };
  } & Promise<{ data: unknown; error: { message: string } | null }>;
  select: (columns?: string) => {
    eq: (column: string, value: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{ data: Database['public']['Tables']['tutorial_progress']['Row'] | null; error: { message: string } | null }>;
      };
    };
  };
}

export interface TutorialResponseCacheTable {
  upsert: (
    values: Database['public']['Tables']['tutorial_response_cache']['Insert']
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
  select: (columns?: string) => {
    eq: (column: string, value: string) => {
      single: () => Promise<{ data: Database['public']['Tables']['tutorial_response_cache']['Row'] | null; error: { message: string } | null }>;
    };
  };
}


