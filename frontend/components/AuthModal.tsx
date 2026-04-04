'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!isSupabaseConfigured) {
        setError('Auth not configured');
        return;
      }

      const supabase = getSupabaseClient();
      
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
      }

      onOpenChange(false);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    if (!isSupabaseConfigured) {
      setError('Auth not configured');
      return;
    }

    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setError(error.message);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0" 
        style={{ background: 'rgba(0, 0, 0, 0.3)' }}
        onClick={() => onOpenChange(false)} 
      />

      {/* Modal */}
      <div 
        className="relative w-full max-w-md mx-4 p-8"
        style={{ 
          background: 'white', 
          borderRadius: 20,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 p-2 rounded-lg transition-colors hover:bg-gray-100"
          style={{ color: '#6B6B6B' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Title */}
        <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">
          {mode === 'signin' ? 'Welcome back' : 'Create account'}
        </h2>
        <p className="text-sm mb-6" style={{ color: '#6B6B6B' }}>
          {mode === 'signin' ? 'Sign in to access your diagrams' : 'Start designing architecture diagrams'}
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: '#1A1A1A' }}>
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#B0B0B0' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full py-3 pl-11 pr-4 text-sm rounded-[14px] outline-none transition-all"
                style={{ 
                  background: '#F8F8F8',
                  boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.04)',
                  color: '#1A1A1A'
                }}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: '#1A1A1A' }}>
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#B0B0B0' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full py-3 pl-11 pr-11 text-sm rounded-[14px] outline-none transition-all"
                style={{ 
                  background: '#F8F8F8',
                  boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.04)',
                  color: '#1A1A1A'
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 transition-colors"
                style={{ color: '#B0B0B0' }}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs" style={{ color: '#E5484D' }}>{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-sm font-medium text-white rounded-[14px] transition-all hover:opacity-90 disabled:opacity-50"
            style={{ 
              background: '#1A1A1A',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (mode === 'signin' ? 'Sign in' : 'Create account')}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px" style={{ background: '#E0E0E0' }} />
          <span className="text-xs" style={{ color: '#B0B0B0' }}>or</span>
          <div className="flex-1 h-px" style={{ background: '#E0E0E0' }} />
        </div>

        {/* Google OAuth */}
        <button
          onClick={() => handleOAuthSignIn('google')}
          className="w-full py-3 px-4 text-sm font-medium rounded-[14px] transition-all hover:bg-gray-50 flex items-center justify-center gap-2"
          style={{ background: '#F8F8F8', color: '#1A1A1A' }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        {/* Toggle mode */}
        <p className="text-center text-sm mt-6" style={{ color: '#6B6B6B' }}>
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            className="font-medium hover:underline"
            style={{ color: '#1A1A1A' }}
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
