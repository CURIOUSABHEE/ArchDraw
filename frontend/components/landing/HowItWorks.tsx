'use client';

import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    num: '01',
    title: 'Pick your components',
    desc: 'Browse 150+ pre-built architecture components organized by category. Search or drag to add.',
    side: 'left',
  },
  {
    num: '02',
    title: 'Connect and organize',
    desc: 'Draw connections between components. Auto-layout arranges everything cleanly with one click.',
    side: 'right',
  },
  {
    num: '03',
    title: 'Share or export',
    desc: 'Generate a shareable link or export as high-resolution PNG for your docs and presentations.',
    side: 'left',
  },
];

export function HowItWorks() {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    gsap.fromTo('.hiw-headline',
      { opacity: 0, y: 50, filter: 'blur(8px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: '.hiw-headline', start: 'top 85%', toggleActions: 'play none none none' } }
    );

    document.querySelectorAll('.step-left').forEach(el => {
      gsap.fromTo(el,
        { opacity: 0, x: -60, filter: 'blur(4px)' },
        { opacity: 1, x: 0, filter: 'blur(0px)', duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 78%', toggleActions: 'play none none none' } }
      );
    });

    document.querySelectorAll('.step-right').forEach(el => {
      gsap.fromTo(el,
        { opacity: 0, x: 60, filter: 'blur(4px)' },
        { opacity: 1, x: 0, filter: 'blur(0px)', duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 78%', toggleActions: 'play none none none' } }
      );
    });

    return () => { ScrollTrigger.getAll().forEach(t => t.kill()); };
  }, []);

  return (
    <section className="py-28 px-6 lg:px-8" style={{ backgroundColor: '#0d1117' }} id="how-it-works">
      {/* Section divider */}
      <div className="max-w-5xl mx-auto h-px mb-20" style={{ background: 'linear-gradient(to right, transparent, rgba(99,102,241,0.3), transparent)' }} />

      <div className="max-w-5xl mx-auto">
        <header className="hiw-headline text-center mb-24 opacity-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: '#6366f1' }}>How it works</p>
          <h2 className="text-4xl font-bold text-white tracking-tight">
            From blank canvas to production diagram in minutes
          </h2>
        </header>

        <div className="space-y-24">
          {steps.map((step) => (
            <div
              key={step.num}
              className={`${step.side === 'left' ? 'step-left' : 'step-right'} opacity-0 flex flex-col md:flex-row${step.side === 'right' ? '-reverse' : ''} items-center gap-12 lg:gap-20`}
            >
              {/* Text */}
              <div className="flex-1">
                <div className="text-8xl font-extrabold select-none mb-6" style={{ color: 'rgba(99,102,241,0.08)', lineHeight: 1 }}>{step.num}</div>
                <h3 className="text-2xl font-bold text-white mb-4">{step.title}</h3>
                <p className="text-lg leading-relaxed" style={{ color: '#64748b' }}>{step.desc}</p>
              </div>

              {/* Visual placeholder */}
              <div className="flex-1 w-full">
                <div className="rounded-2xl p-8 min-h-[220px] flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="text-5xl opacity-30">{step.num === '01' ? '⬡' : step.num === '02' ? '⟶' : '↗'}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
