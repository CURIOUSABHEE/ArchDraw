'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HeroCanvas = dynamic(() => import('./HeroCanvas'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-card rounded-xl" />,
});

export function Hero() {
  const router = useRouter();
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
      <section className="relative min-h-screen bg-background overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-20 pb-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[calc(100vh-8rem)]">
            <div className="h-[400px]" />
            <div className="h-[400px] bg-card rounded-2xl" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-screen bg-background overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_60%_at_70%_40%,hsl(var(--primary)_/_0.08)_0%,transparent_60%)]" />
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-20 pb-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[calc(100vh-8rem)]">
          <div className="flex flex-col justify-center">
            <h1 className="hero-headline font-bold mb-6 text-4xl sm:text-5xl lg:text-[3.5rem] tracking-tight leading-[1.1]">
              <span className="text-foreground">
                Your architecture,
              </span>
              <br />
              <span className="text-primary">
                finally visual.
              </span>
            </h1>

            <p className="hero-subtext mb-8 text-lg text-muted-foreground leading-relaxed max-w-[480px]">
              Design production-ready system diagrams in minutes. Drag, connect, think in systems.
            </p>

            <div className="hero-cta-group flex items-center gap-4 flex-wrap">
              <Button size="lg" onClick={() => router.push('/editor')} className="gap-2 shadow-lg shadow-primary/40 hover:shadow-xl hover:shadow-primary/50 hover:scale-105 transition-all bg-primary pulse-glow-btn">
                Start designing — it&apos;s free <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => document.getElementById('templates')?.scrollIntoView({ behavior: 'smooth' })} className="gap-2">
                View templates →
              </Button>
            </div>

            <div className="hero-trust-row flex items-center gap-6 mt-8">
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                No account needed
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                150+ components
              </span>
            </div>
          </div>

          <div ref={canvasRef} className="hero-canvas-wrapper relative">
            <div
              ref={tiltRef}
              className="relative rounded-2xl overflow-hidden border border-border/50"
              style={{ transformStyle: 'preserve-3d', perspective: '1000px', boxShadow: '0 40px 80px hsl(var(--foreground) / 0.2), 0 0 40px hsl(var(--primary) / 0.08)' }}
            >
              <div className="flex items-center gap-2 px-4 py-2.5 bg-secondary border-b border-border/50">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="rounded-md px-3 py-1 text-[10px] text-center max-w-[180px] mx-auto bg-muted text-muted-foreground">
                    archflow.app/editor
                  </div>
                </div>
                <div className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
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
