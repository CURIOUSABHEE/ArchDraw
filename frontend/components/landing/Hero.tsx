'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ArrowRight } from 'lucide-react';

const HeroCanvas = dynamic(() => import('./HeroCanvas'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#0f172a] rounded-xl" />,
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

    let ctx: { revert: () => void } | null = null;
    let cleanup: (() => void) | null = null;

    const setupAnimations = async () => {
      const { gsap } = await import('gsap');

      ctx = gsap.context(() => {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        tl.from('.hero-headline', {
          y: 32,
          opacity: 0,
          duration: 0.7,
        })
          .from('.hero-subtext', {
            y: 20,
            opacity: 0,
            duration: 0.6,
          }, '-=0.4')
          .from('.hero-cta-group', {
            y: 16,
            opacity: 0,
            duration: 0.5,
          }, '-=0.3')
          .from('.hero-trust-row', {
            opacity: 0,
            duration: 0.4,
          }, '-=0.2')
          .from('.hero-canvas-wrapper', {
            x: 40,
            opacity: 0,
            duration: 0.9,
            ease: 'power2.out',
          }, '-=0.8')
          .to('.hero-canvas-wrapper', {
            boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 80px rgba(99,102,241,0.22)',
            duration: 2,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          }, '+=0.5');

        const handleMouseMove = (e: MouseEvent) => {
          if (!canvas || !tilt) return;

          const rect = canvas.getBoundingClientRect();

          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;

          const rotateY = ((e.clientX - centerX) / (rect.width / 2)) * 12;
          const rotateX = -((e.clientY - centerY) / (rect.height / 2)) * 8;

          gsap.to(tilt, {
            rotateY,
            rotateX,
            duration: 0.8,
            ease: 'power2.out'
          });
        };

        const handleMouseLeave = () => {
          if (!tilt) return;
          gsap.to(tilt, {
            rotateY: 0,
            rotateX: 0,
            duration: 1,
            ease: 'power3.out'
          });
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
      <section
        className="relative overflow-hidden"
        style={{ backgroundColor: '#080c14', minHeight: '100vh' }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-20 pb-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[calc(100vh-8rem)]">
            <div className="h-[400px]" />
            <div className="h-[400px] bg-[#0f172a] rounded-2xl" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative overflow-hidden"
      style={{ backgroundColor: '#080c14', minHeight: '100vh' }}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 60% at 70% 40%, rgba(99,102,241,0.08) 0%, transparent 60%)' }} />

      {/* Grid pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-30" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-20 pb-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[calc(100vh-8rem)]">

          {/* Left side - Text content */}
          <div className="flex flex-col justify-center">
            <h1 className="hero-headline font-bold mb-6" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              <span className="bg-gradient-to-b from-white to-white/80 bg-clip-text text-transparent">
                Your architecture,
              </span>
              <br />
              <span className="bg-gradient-to-r from-indigo-300 via-indigo-400 to-indigo-500 bg-clip-text text-transparent">
                finally visual.
              </span>
            </h1>

            <p className="hero-subtext mb-8 leading-relaxed" style={{ fontSize: 18, fontWeight: 400, color: 'rgba(148,163,184,0.65)', lineHeight: 1.6, maxWidth: 480 }}>
              Design production-ready system diagrams in minutes. Drag, connect, think in systems.
            </p>

            <div className="hero-cta-group flex items-center gap-4 flex-wrap">
              <button
                onClick={() => router.push('/editor')}
                className="hero-cta-btn relative inline-flex items-center gap-2.5 px-6 py-3 text-white font-semibold rounded-xl text-sm transition-all hover:-translate-y-0.5"
                style={{ backgroundColor: '#6366f1', boxShadow: '0 4px 20px rgba(99,102,241,0.3)' }}
              >
                Start designing — it&apos;s free <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => document.getElementById('templates')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2 px-5 py-3 font-medium text-sm transition-all"
                style={{ color: '#64748b' }}
              >
                View templates →
              </button>
            </div>

            <div className="hero-trust-row flex items-center gap-6 mt-8">
              <span className="inline-flex items-center gap-1.5 text-[13px]" style={{ color: '#475569' }}>
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                No account needed
              </span>
              <span className="inline-flex items-center gap-1.5 text-[13px]" style={{ color: '#475569' }}>
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                150+ components
              </span>
            </div>
          </div>

          {/* Right side - Interactive Canvas */}
          <div
            ref={canvasRef}
            className="hero-canvas-wrapper relative"
            style={{ opacity: 1 }}
          >
            <div
              ref={tiltRef}
              className="relative rounded-2xl overflow-hidden"
              style={{
                transformStyle: 'preserve-3d',
                perspective: '1000px',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 40px rgba(99,102,241,0.08)'
              }}
            >
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-2.5" style={{ backgroundColor: '#161b22', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#28ca41]" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="rounded-md px-3 py-1 text-[10px] text-center max-w-[180px] mx-auto" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#475569' }}>
                    archflow.app/editor
                  </div>
                </div>
                <div className="text-[9px] font-medium px-2 py-0.5 rounded-full" style={{ color: '#818cf8', backgroundColor: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  Interactive
                </div>
              </div>

              {/* Canvas */}
              <div style={{ height: 380, background: '#0f172a', position: 'relative', overflow: 'hidden' }}>
                <HeroCanvas />
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scrollFade {
          0%, 100% { opacity: 0.3; transform: translateY(0); }
          50% { opacity: 0.7; transform: translateY(4px); }
        }
        .hero-cta-btn::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 60%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          transition: none;
        }
        .hero-cta-btn:hover::after {
          animation: shimmer 0.5s ease forwards;
        }
        @keyframes shimmer {
          from { left: -60%; }
          to { left: 130%; }
        }
      `}</style>
    </section>
  );
}
