'use client';

import { useState } from 'react';
import { X, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { toast } from 'sonner';

export type EmailCaptureReason = 'share' | 'download';

interface Props {
  reason: EmailCaptureReason;
  onClose: () => void;
  onAuthenticated?: () => void; // called if user is already authed somehow
}

const COPY = {
  share: {
    icon: '✦',
    title: 'Share your diagram',
    body: 'Enter your email to generate a shareable link for this diagram.',
    cta: 'Continue with Email →',
  },
  download: {
    icon: '✦',
    title: 'Save your work',
    body: 'Enter your email to download your diagram and keep your canvas synced across devices.',
    cta: 'Continue with Email →',
  },
};

export function EmailCaptureModal({ reason, onClose, onAuthenticated }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const copy = COPY[reason];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    // Save guest canvases before redirecting
    if (typeof window !== 'undefined') {
      const { useDiagramStore } = await import('@/store/diagramStore');
      const canvases = useDiagramStore.getState().canvases;
      localStorage.setItem('guestCanvases', JSON.stringify(canvases));
      localStorage.setItem('pendingAction', JSON.stringify({ type: reason }));
    }

    if (!isSupabaseConfigured) {
      toast.error('Auth not configured');
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          shouldCreateUser: true,
        },
      });
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
      setSent(true);
    } catch {
      toast.error('Something went wrong, try again');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('emailModalDismissed', 'true');
    }
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[8px]" onClick={handleDismiss} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-sm bg-card border border-border/80 rounded-xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between px-5 pt-5 pb-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/15 flex items-center justify-center">
                <Mail className="w-3.5 h-3.5 text-indigo-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-indigo-500 tracking-wide">{copy.icon} {copy.title}</p>
              </div>
            </div>
            <button onClick={handleDismiss} className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {sent ? (
            /* ── Confirmation screen ── */
            <div className="px-5 py-6 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto">
                <Mail className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">📧 Check your email</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  We sent a link to <span className="text-foreground font-medium">{email}</span>.
                  Click it to continue — no password needed.
                </p>
              </div>
              <button
                onClick={() => setSent(false)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
              >
                ← Use different email
              </button>
            </div>
          ) : (
            /* ── Email form ── */
            <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">{copy.body}</p>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
                className="w-full px-3 py-2.5 text-sm bg-muted/60 border border-border/60 rounded-lg outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 text-foreground placeholder:text-muted-foreground/50 transition-colors"
              />

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                {loading ? 'Sending…' : copy.cta}
              </button>

              <p className="text-[11px] text-muted-foreground/60 text-center">
                No password needed. We&apos;ll send you a magic link.
              </p>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                >
                  Maybe later
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
