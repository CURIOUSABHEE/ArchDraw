import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && supabaseAnonKey.startsWith('eyJ')
);

export function createClient() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

export function getSupabaseClient() {
  return createClient();
}
