'use client';

import { useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger);

const faqs = [
  { q: 'Is ArchFlow really free?', a: 'Yes. ArchFlow is completely free during beta. You can create unlimited diagrams, use all templates, and export without any limits.' },
  { q: 'Do I need an account to use it?', a: 'No. You can start designing immediately without signing up. Create an account only when you want to save, share, or download your diagrams.' },
  { q: 'How is this different from Lucidchart or draw.io?', a: 'ArchFlow is purpose-built for software architecture — not general diagrams. Every component, template, and feature is designed for engineers thinking about systems.' },
  { q: 'Can I share my diagrams with teammates?', a: 'Yes. Click Share to generate a public link. Anyone with the link can view and interact with your diagram without needing an account.' },
  { q: 'What export formats are supported?', a: 'Currently PNG at 3× resolution (print-ready quality). PDF and SVG exports are on the roadmap.' },
  { q: 'Is my data secure?', a: 'Your diagrams are stored securely in Supabase (PostgreSQL). Guest diagrams are stored locally in your browser. We never sell your data.' },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    gsap.fromTo('.faq-headline',
      { opacity: 0, y: 50, filter: 'blur(8px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: '.faq-headline', start: 'top 85%', toggleActions: 'play none none none' } }
    );

    gsap.fromTo('.faq-item',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'power2.out',
        scrollTrigger: { trigger: '.faq-list', start: 'top 80%', toggleActions: 'play none none none' } }
    );

    return () => { ScrollTrigger.getAll().forEach(t => t.kill()); };
  }, []);

  return (
    <section className="py-28 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#0d1117' }} id="faq">
      {/* Section divider */}
      <div className="max-w-2xl mx-auto h-px mb-20" style={{ background: 'linear-gradient(to right, transparent, rgba(99,102,241,0.3), transparent)' }} />

      <div className="max-w-2xl mx-auto">
        <header className="faq-headline text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: '#6366f1' }}>FAQ</p>
          <h2 className="text-4xl font-bold text-white tracking-tight">Frequently asked questions</h2>
        </header>

        <div className="faq-list space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="faq-item rounded-2xl overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <button
                className="w-full flex items-center justify-between px-6 py-4 text-left"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-medium text-white">{faq.q}</span>
                <svg
                  className={`w-4 h-4 shrink-0 transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`}
                  style={{ color: '#475569' }}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {open === i && (
                <div className="px-6 pb-5 text-sm leading-relaxed" style={{ color: '#64748b', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '1rem' }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
