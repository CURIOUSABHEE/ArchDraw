'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const HeroCanvas = dynamic(() => import('./HeroCanvas'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-secondary rounded-xl" />,
});

export function Hero() {
  const router = useRouter();
  const { user, initialized } = useAuthStore();
  const canvasRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const gsapCtxRef = useRef<{ revert: () => void } | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.innerWidth < 768) return;

    const canvas = canvasRef.current;
    const tilt = tiltRef.current;
    if (!canvas || !tilt) return;

    let cleanup: (() => void) | null = null;

    const setupAnimations = async () => {
      const { gsap } = await import('gsap');

      const ctx = gsap.context(() => {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        tl.from('.hero-headline', { y: 32, opacity: 0, duration: 0.7 })
          .from('.hero-subtext', { y: 20, opacity: 0, duration: 0.6 }, '-=0.4')
          .from('.hero-cta-group', { y: 16, opacity: 0, duration: 0.5 }, '-=0.3')
          .from('.hero-trust-row', { opacity: 0, duration: 0.4 }, '-=0.2')
          .from('.hero-canvas-wrapper', { x: 40, opacity: 0, duration: 0.9, ease: 'power2.out' }, '-=0.8');

        const handleMouseMove = (e: MouseEvent) => {
          if (!canvas || !tilt) return;
          const rect = canvas.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const rotateY = ((e.clientX - centerX) / (rect.width / 2)) * 12;
          const rotateX = -((e.clientY - centerY) / (rect.height / 2)) * 8;
          gsap.to(tilt, { rotateY, rotateX, duration: 0.8, ease: 'power2.out' });
        };

        const handleMouseLeave = () => {
          if (!tilt) return;
          gsap.to(tilt, { rotateY: 0, rotateX: 0, duration: 1, ease: 'power3.out' });
        };

        window.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseleave', handleMouseLeave);

        cleanup = () => {
          window.removeEventListener('mousemove', handleMouseMove);
          canvas?.removeEventListener('mouseleave', handleMouseLeave);
        };
      });

      gsapCtxRef.current = ctx;
    };

    setupAnimations();

    return () => {
      cleanup?.();
      gsapCtxRef.current?.revert();
      gsapCtxRef.current = null;
    };
  }, [isClient]);

  if (!isClient) {
    return (
      <section className="relative min-h-screen overflow-hidden pt-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-12 pb-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[calc(100vh-8rem)]">
            <div className="h-[400px]" />
            <div className="h-[400px] bg-white rounded-2xl" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-screen overflow-hidden pt-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-12 pb-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[calc(100vh-8rem)]">
          <div className="flex flex-col justify-center">
            <h1 className="hero-headline font-bold mb-6 text-4xl sm:text-5xl lg:text-[3.5rem] tracking-tight leading-[1.1]">
              <span className="text-foreground">Your architecture,</span>
              <br />
              <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">finally visual.</span>
            </h1>

            <p className="hero-subtext mb-8 text-lg leading-relaxed max-w-[480px] text-muted-foreground">
              Design production-ready system diagrams in minutes. Drag, connect, think in systems.
            </p>

            <div className="hero-cta-group flex items-center gap-4 flex-wrap">
              {initialized && user ? (
                <button
                  onClick={() => router.push('/dashboard')}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-xl hover:opacity-90 transition-all shadow-md hover:shadow-lg bg-gradient-to-r from-primary to-purple-500 text-white"
                >
                  Go to Dashboard <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => router.push('/editor')}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-xl hover:opacity-90 transition-all shadow-md hover:shadow-lg bg-gradient-to-r from-primary to-purple-500 text-white"
                >
                  Start designing <ArrowRight className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => document.getElementById('templates')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-xl hover:bg-accent transition-all text-muted-foreground"
              >
                View templates
              </button>
            </div>

            <div className="hero-trust-row flex items-center gap-6 mt-8">
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                No account needed
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                150+ components
              </span>
            </div>
          </div>

          <div ref={canvasRef} className="hero-canvas-wrapper relative">
            <div
              ref={tiltRef}
              className="relative rounded-2xl overflow-hidden"
              style={{ transformStyle: 'preserve-3d', perspective: '1000px', boxShadow: '0 25px 70px rgba(0,0,0,0.1)' }}
            >
              <div className="flex items-center gap-2 px-4 py-3 bg-card">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#ef4444' }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#fbbf24' }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#22c55e' }} />
                </div>
                <div className="flex-1 mx-4">
                  <div className="rounded-lg px-3 py-1 text-[10px] text-center max-w-[180px] mx-auto bg-card text-muted-foreground">
                    archdraw.app/editor
                  </div>
                </div>
                <div className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  Interactive
                </div>
              </div>

              <div className="h-[380px] bg-card relative overflow-hidden">
                <HeroCanvas />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
