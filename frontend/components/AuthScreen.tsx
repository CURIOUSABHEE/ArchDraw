'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';

export function AuthScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { sendMagicLink } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setLoading(true);
    setError(null);
    console.log('Submitting email:', email);
    
    try {
      const { error: authError } = await sendMagicLink(email);
      
      if (authError) {
        console.error('Auth error:', authError);
        setError(authError.message || 'Failed to send magic link');
        setLoading(false);
      } else {
        setSent(true);
        setLoading(false);
      }
    } catch (err) {
      console.error('Exception:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a12',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        <div style={{
          background: '#16161e',
          borderRadius: 16,
          padding: 40,
          maxWidth: 400,
          width: '100%',
          textAlign: 'center',
          border: '1px solid #2a2a3e',
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            fontSize: 28,
          }}>
            ✉️
          </div>
          <h2 style={{
            color: '#fff',
            fontSize: 24,
            fontWeight: 700,
            marginBottom: 12,
          }}>
            Check your email
          </h2>
          <p style={{
            color: '#94a3b8',
            fontSize: 14,
            lineHeight: 1.6,
            marginBottom: 24,
          }}>
            We sent a magic link to <strong style={{ color: '#fff' }}>{email}</strong>. 
            Click the link in the email to sign in.
          </p>
          <button
            onClick={() => setSent(false)}
            style={{
              background: 'transparent',
              border: '1px solid #3b82f6',
              color: '#3b82f6',
              padding: '10px 20px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a12',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div style={{
        background: '#16161e',
        borderRadius: 16,
        padding: 40,
        maxWidth: 400,
        width: '100%',
        border: '1px solid #2a2a3e',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          marginBottom: 32,
        }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
          }}>⬡</div>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
            Archflow
          </span>
        </div>
        
        <h1 style={{
          color: '#fff',
          fontSize: 28,
          fontWeight: 700,
          textAlign: 'center',
          marginBottom: 8,
        }}>
          Welcome back
        </h1>
        <p style={{
          color: '#94a3b8',
          fontSize: 14,
          textAlign: 'center',
          marginBottom: 32,
        }}>
          Sign in with your email — no password needed
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block',
              color: '#94a3b8',
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 8,
            }}>
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid #2a2a3e',
                background: '#0a0a12',
                color: '#fff',
                fontSize: 15,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 8,
              padding: '12px 16px',
              marginBottom: 16,
              color: '#ef4444',
              fontSize: 13,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 8,
              border: 'none',
              background: loading ? '#3b82f6aa' : 'linear-gradient(135deg, #3b82f6, #6366f1)',
              color: '#fff',
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
          >
            {loading ? 'Sending...' : 'Send Magic Link'}
          </button>
        </form>

        <p style={{
          color: '#64748b',
          fontSize: 12,
          textAlign: 'center',
          marginTop: 24,
        }}>
          By signing in, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
}
