import { createClient as _createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Singleton for browser usage
let _client: ReturnType<typeof _createClient> | null = null;

export function getSupabaseClient() {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');
  if (!_client) _client = _createClient(supabaseUrl, supabaseAnonKey);
  return _client;
}

// Keep named export for compatibility
export const createClient = getSupabaseClient;
