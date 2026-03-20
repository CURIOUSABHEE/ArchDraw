import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  let userId: string | null = null;

  if (code) {
    const { data } = await supabase.auth.exchangeCodeForSession(code);
    userId = data.session?.user?.id ?? null;
  } else if (token_hash && type) {
    const { data } = await supabase.auth.verifyOtp({ token_hash, type: type as 'email' });
    userId = data.session?.user?.id ?? null;
  }

  // Guest-to-authenticated migration is handled client-side via AuthProvider
  // (server route has no access to localStorage)

  const redirectUrl = new URL('/editor', request.url);
  if (userId) {
    redirectUrl.searchParams.set('migrate_progress', '1');
  }

  return NextResponse.redirect(redirectUrl);
}
