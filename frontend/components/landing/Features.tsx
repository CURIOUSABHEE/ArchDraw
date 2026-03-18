'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger);

const features = [
  { icon: '⬡', color: '#6366f1', title: '150+ Components', desc: 'Pre-built nodes for every layer — auth, databases, queues, AI services, cloud infra and more.' },
  { icon: '⚡', color: '#3b82f6', title: 'Smart Auto Layout', desc: "One click to organize your entire diagram with Dagre's hierarchical layout algorithm." },
  { icon: '📐', color: '#8b5cf6', title: 'Real-time Templates', desc: 'Start from battle-tested architectures — ChatGPT, Instagram, Netflix and more.' },
  { icon: '🔗', color: '#10b981', title: 'Share with a Link', desc: 'Generate a shareable URL for any diagram. Anyone can view and interact — no account needed.' },
  { icon: '⬇', color: '#f59e0b', title: 'Export as PNG', desc: 'Export high-resolution images for docs, presentations, or Notion pages. 3× resolution.' },
  { icon: '⊞', color: '#06b6d4', title: 'Multiple Canvases', desc: 'Work on different systems simultaneously with tabbed canvases. Switch instantly.' },
];

export function Features() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    gsap.fromTo('.features-headline',
      { opacity: 0, y: 50, filter: 'blur(8px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: '.features-headline', start: 'top 85%', toggleActions: 'play none none none' } }
    );

    gsap.fromTo('.feature-card',
      { opacity: 0, y: 50, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6,
        stagger: { amount: 0.5, grid: [2, 3], from: 'start' },
        ease: 'power2.out',
        scrollTrigger: { trigger: '.features-grid', start: 'top 75%', toggleActions: 'play none none none' } }
    );

    // Card hover effects
    document.querySelectorAll<HTMLElement>('.feature-card').forEach(card => {
      const icon = card.querySelector<HTMLElement>('.card-icon');
      card.addEventListener('mouseenter', () => {
        gsap.to(card, { y: -4, duration: 0.3, ease: 'power2.out', boxShadow: '0 20px 40px rgba(99,102,241,0.12)' });
        if (icon) gsap.to(icon, { scale: 1.15, rotate: 5, duration: 0.3, ease: 'back.out(2)' });
      });
      card.addEventListener('mouseleave', () => {
        gsap.to(card, { y: 0, duration: 0.4, ease: 'power2.inOut', boxShadow: 'none' });
        if (icon) gsap.to(icon, { scale: 1, rotate: 0, duration: 0.3, ease: 'power2.inOut' });
      });
    });

    return () => { ScrollTrigger.getAll().forEach(t => t.kill()); };
  }, []);

  return (
    <section ref={sectionRef} className="py-28 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#080c14' }} id="features">
      {/* Section divider */}
      <div className="section-divider max-w-5xl mx-auto h-px mb-20" style={{ background: 'linear-gradient(to right, transparent, rgba(99,102,241,0.3), transparent)' }} />

      <div className="max-w-5xl mx-auto">
        <header className="features-headline text-center mb-16 opacity-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: '#6366f1' }}>Features</p>
          <h2 className="text-4xl font-bold tracking-tight text-white">
            Everything you need to diagram faster
          </h2>
        </header>

        <div className="features-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <article
              key={f.title}
              className="feature-card will-change-transform p-6 rounded-2xl flex flex-col gap-4 opacity-0 cursor-default"
              style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="card-icon will-change-transform w-11 h-11 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: f.color + '15', border: `1px solid ${f.color}25` }}>
                {f.icon}
              </div>
              <div className="space-y-1.5">
                <h3 className="font-semibold text-white">{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{f.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
