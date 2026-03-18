'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger);

export function CTASection() {
  const router = useRouter();
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    gsap.fromTo('.cta-headline',
      { opacity: 0, y: 80, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 1, ease: 'power4.out',
        scrollTrigger: { trigger: '.cta-headline', start: 'top 85%', toggleActions: 'play none none none' } }
    );

    gsap.fromTo('.cta-sub',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out',
        scrollTrigger: { trigger: '.cta-sub', start: 'top 85%', toggleActions: 'play none none none' } }
    );

    gsap.fromTo('.cta-btn',
      { opacity: 0, scale: 0.9 },
      { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.4)',
        scrollTrigger: { trigger: '.cta-btn', start: 'top 90%', toggleActions: 'play none none none' } }
    );

    // Magnetic button
    const btn = btnRef.current;
    if (!btn) return;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = btn.getBoundingClientRect();
      const deltaX = (e.clientX - (rect.left + rect.width / 2)) * 0.25;
      const deltaY = (e.clientY - (rect.top + rect.height / 2)) * 0.25;
      gsap.to(btn, { x: deltaX, y: deltaY, duration: 0.3, ease: 'power2.out' });
    };
    const handleMouseLeave = () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
    };
    btn.addEventListener('mousemove', handleMouseMove);
    btn.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
      btn.removeEventListener('mousemove', handleMouseMove);
      btn.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <section className="py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden" style={{ backgroundColor: '#080c14' }}>
      {/* Section divider */}
      <div className="max-w-3xl mx-auto h-px mb-20" style={{ background: 'linear-gradient(to right, transparent, rgba(99,102,241,0.3), transparent)' }} />

      {/* Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-500/8 blur-3xl rounded-full" />
      </div>

      <div className="max-w-3xl mx-auto text-center relative">
        <h2 className="cta-headline text-5xl sm:text-6xl font-extrabold tracking-tight mb-6 opacity-0">
          <span className="bg-gradient-to-br from-white via-white/90 to-white/40 bg-clip-text text-transparent">
            Start building your
          </span>
          <br />
          <span className="bg-gradient-to-r from-indigo-300 via-indigo-400 to-indigo-500 bg-clip-text text-transparent">
            architecture today.
          </span>
        </h2>
        <p className="cta-sub text-xl mb-10 opacity-0" style={{ color: '#64748b' }}>
          No account needed. No credit card. Just your ideas.
        </p>
        <button
          ref={btnRef}
          onClick={() => router.push('/editor')}
          className="cta-btn will-change-transform inline-flex items-center px-10 py-4 text-white font-bold text-lg rounded-2xl opacity-0 transition-colors"
          style={{ backgroundColor: '#6366f1', boxShadow: '0 0 40px rgba(99,102,241,0.4)' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#4f46e5')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#6366f1')}
        >
          Open the canvas →
        </button>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {['Next.js', 'Supabase', 'Vercel', 'React'].map((t) => (
            <span key={t} className="px-3 py-1.5 text-xs font-medium rounded-full" style={{ color: '#475569', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
