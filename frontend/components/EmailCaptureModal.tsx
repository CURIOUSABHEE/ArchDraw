'use client';

import { useState } from 'react';
import { X, Mail, ArrowRight, Loader2, Github } from 'lucide-react';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { toast } from 'sonner';

export type EmailCaptureReason = 'share' | 'download';

interface Props {
  reason: EmailCaptureReason;
  onClose: () => void;
}

const COPY = {
  share:    { title: 'Share your diagram',  body: 'Sign in to generate a shareable link.' },
  download: { title: 'Save your work',      body: 'Sign in to download and sync your diagrams.' },
};

function saveGuestState(reason: EmailCaptureReason) {
  if (typeof window === 'undefined') return;
  import('@/store/diagramStore').then(({ useDiagramStore }) => {
    const { canvases, activeCanvasId } = useDiagramStore.getState();
    localStorage.setItem('guestCanvases', JSON.stringify(canvases));
    localStorage.setItem('pendingAction', JSON.stringify({ type: reason, canvasId: activeCanvasId }));
  });
}

function getRedirectTo() {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/auth/callback`;
}

export function EmailCaptureModal({ reason, onClose }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState<'email' | 'google' | 'github' | null>(null);
  const [sent, setSent] = useState(false);
  const copy = COPY[reason];

  const handleDismiss = () => {
    if (typeof window !== 'undefined') sessionStorage.setItem('emailModalDismissed', 'true');
    onClose();
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    if (!isSupabaseConfigured) { toast.error('Auth not configured'); return; }
    saveGuestState(reason);
    setLoading(provider);
    try {
      const supabase = getSupabaseClient();
      const opts = provider === 'google'
        ? { redirectTo: getRedirectTo(), queryParams: { access_type: 'offline', prompt: 'consent' } }
        : { redirectTo: getRedirectTo() };
      const { error } = await supabase.auth.signInWithOAuth({ provider, options: opts });
      if (error) { toast.error(error.message); setLoading(null); }
      // On success the page redirects — no need to reset loading
    } catch { toast.error('Something went wrong'); setLoading(null); }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    if (!isSupabaseConfigured) { toast.error('Auth not configured'); return; }
    saveGuestState(reason);
    setLoading('email');
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: getRedirectTo(), shouldCreateUser: true },
      });
      if (error) { toast.error(error.message); setLoading(null); return; }
      setSent(true);
    } catch { toast.error('Something went wrong'); }
    finally { setLoading(null); }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[6px]" onClick={handleDismiss} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-sm rounded-xl overflow-hidden shadow-2xl"
          style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4">
            <div>
              <p className="text-sm font-semibold text-white">{copy.title}</p>
              <p className="text-xs text-slate-400 mt-0.5">{copy.body}</p>
            </div>
            <button onClick={handleDismiss} className="p-1.5 rounded-md hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {sent ? (
            <div className="px-5 pb-6 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto">
                <Mail className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Check your email</p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  We sent a link to <span className="text-white font-medium">{email}</span>. Click it to continue.
                </p>
              </div>
              <button onClick={() => setSent(false)} className="text-xs text-slate-500 hover:text-slate-300 transition-colors underline underline-offset-2">
                ← Use different email
              </button>
            </div>
          ) : (
            <div className="px-5 pb-5 space-y-3">
              {/* Google */}
              <button
                onClick={() => handleOAuth('google')}
                disabled={loading !== null}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors text-sm text-white disabled:opacity-50"
              >
                {loading === 'google' ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                Continue with Google
              </button>

              {/* GitHub */}
              <button
                onClick={() => handleOAuth('github')}
                disabled={loading !== null}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors text-sm text-white disabled:opacity-50"
              >
                {loading === 'github' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Github className="w-4 h-4" />}
                Continue with GitHub
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs text-slate-500">or</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Email */}
              <form onSubmit={handleEmail} className="space-y-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full px-3 py-2.5 text-sm rounded-lg text-white placeholder:text-slate-500 outline-none transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
                <button
                  type="submit"
                  disabled={loading !== null || !email.trim()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading === 'email' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  {loading === 'email' ? 'Sending…' : 'Continue with Email →'}
                </button>
              </form>

              <p className="text-center">
                <button type="button" onClick={handleDismiss} className="text-[11px] text-slate-600 hover:text-slate-400 transition-colors">
                  Maybe later
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
