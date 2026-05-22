import { createClient as _createClient, type SupabaseClient } from '@supabase/supabase-js';
import { type Database } from '../types/supabase';
import logger from '@/lib/logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
let reachabilityPromise: Promise<boolean> | null = null;
export let isReachable = true;

// Singleton for browser usage
let _client: SupabaseClient<Database> | null = null;

export function checkSupabaseReachability(): Promise<boolean> {
  if (!isSupabaseConfigured) return Promise.resolve(false);
  if (reachabilityPromise) return reachabilityPromise;

  reachabilityPromise = new Promise<boolean>((resolve) => {
    if (typeof window === 'undefined') {
      resolve(true); // default to true on server-side
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 1000); // 1s timeout is enough for a health check

    fetch(`${supabaseUrl}/auth/v1/health`, {
      method: 'GET',
      credentials: 'omit',
      signal: controller.signal,
      cache: 'no-store',
    })
      .then((res) => {
        clearTimeout(timeoutId);
        isReachable = res.ok;
        if (!isReachable) {
          _client = null;
        }
        resolve(isReachable);
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        // Silently log and fallback to guest mode
        if (err.name === 'AbortError') {
          logger.info('[Supabase] Health check timed out, entering offline mode');
        } else {
          logger.info('[Supabase] Connection failed, entering offline mode');
        }
        isReachable = false;
        _client = null;
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
    const isOffline = typeof window !== 'undefined' && !window.navigator.onLine;
    
    if (isOffline || !isReachable) {
      // Use 404 as a "definitively not found/offline" status to stop GoTrue-js retries.
      // GoTrue-js retries on 5xx and network errors, but 4xx are treated as final.
      return new Response(
        JSON.stringify({
          error: 'offline',
          message: 'Application is operating in offline mode',
        }),
        {
          status: 404,
          statusText: 'Not Found',
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    logger.warn('Supabase fetch failed, intercepting and degrading gracefully:', error);
    // Return a 503 if we think it might be a temporary hiccup
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

export function getSupabaseClient(): SupabaseClient<Database> {
  // We only throw if the basic configuration (URL/Key) is missing.
  // Reachability and online status are handled gracefully by customFetch.
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

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

/**
 * Types for specific table queries to ensure type safety without 'any'.
 */
export interface UserCanvasesTable {
  upsert: (values: {
    id: string;
    user_id: string;
    name: string;
    nodes: unknown;
    edges: unknown;
    updated_at: string;
  }) => Promise<{ error: { message: string } | null }>;
  insert: (values: {
    id: string;
    user_id: string;
    name: string;
    nodes: unknown;
    edges: unknown;
  }) => Promise<{ error: { message: string } | null }>;
  select: (columns?: string) => {
    order: (column: string, options: { ascending: boolean }) => Promise<{ data: Database['public']['Tables']['user_canvases']['Row'][] | null; error: { message: string } | null }>;
    eq: (column: string, value: string) => {
      order: (column: string, options: { ascending: boolean }) => Promise<{ data: Database['public']['Tables']['user_canvases']['Row'][] | null; error: { message: string } | null }>;
    };
  };
  delete: () => {
    eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>;
  };
}

export interface TutorialResponseCacheTable {
  upsert: (values: { question_hash: string, response: string }) => Promise<{ error: { message: string } | null }>;
  select: (columns?: string) => {
    eq: (column: string, value: string) => {
      single: () => Promise<{ data: Database['public']['Tables']['tutorial_response_cache']['Row'] | null; error: { message: string } | null }>;
    };
  };
}

export interface TutorialProgressTable {
  upsert: (values: {
    user_id: string;
    tutorial_id: string;
    current_level: number;
    current_step: number;
    current_phase: string;
    completed_levels: number[];
    canvas_nodes: unknown[];
    canvas_edges: unknown[];
    explain_count: number;
    updated_at: string;
  }, options?: { onConflict: string }) => {
    select: () => {
      single: () => Promise<{ data: unknown; error: { message: string } | null }>;
    };
  };
  select: (columns?: string) => {
    eq: (column: string, value: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{ data: Database['public']['Tables']['tutorial_progress']['Row'] | null; error: { message: string } | null }>;
      };
    };
  };
  delete: () => {
    eq: (column: string, value: string) => {
      eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>;
    };
  };
}
