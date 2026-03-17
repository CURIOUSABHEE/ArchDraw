import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 10)}...` : 'MISSING');

export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase configuration. Check .env.local');
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

export function getSupabaseClient() {
  return createClient();
}
