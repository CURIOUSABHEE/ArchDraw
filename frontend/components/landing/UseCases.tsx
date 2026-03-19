'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { GraduationCap, FileText, BarChart2, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const cases: { Icon: LucideIcon; color: string; title: string; desc: string }[] = [
  { Icon: GraduationCap, color: '#6366f1', title: 'System Design Interviews',  desc: 'Practice drawing architectures for FAANG interviews. Use real templates as study guides.' },
  { Icon: FileText,      color: '#3b82f6', title: 'Engineering Documentation', desc: 'Replace Confluence diagrams with interactive, shareable architecture docs.' },
  { Icon: BarChart2,     color: '#6366f1', title: 'Technical Presentations',   desc: 'Export clean diagrams for pitch decks, RFCs, and engineering all-hands.' },
  { Icon: Users,         color: '#10b981', title: 'Team Onboarding',           desc: 'Help new engineers understand your system architecture from day one.' },
];

export function UseCases() {
  const sectionRef = useRef<HTMLElement>(null);

  // CSS IntersectionObserver reveal
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const els = section.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // GSAP hover-only
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    section.querySelectorAll<HTMLElement>('.usecase-card').forEach((card) => {
      const icon = card.querySelector<HTMLElement>('.card-icon');
      card.addEventListener('mouseenter', () => {
        gsap.to(card, { y: -4, duration: 0.3, ease: 'power2.out', boxShadow: '0 20px 40px rgba(99,102,241,0.1)' });
        if (icon) gsap.to(icon, { scale: 1.15, rotate: 5, duration: 0.3, ease: 'back.out(2)' });
      });
      card.addEventListener('mouseleave', () => {
        gsap.to(card, { y: 0, duration: 0.4, ease: 'power2.inOut', boxShadow: 'none' });
        if (icon) gsap.to(icon, { scale: 1, rotate: 0, duration: 0.3, ease: 'power2.inOut' });
      });
    });
  }, []);

  return (
    <section ref={sectionRef} className="py-28 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#080c14', opacity: 1 }} id="use-cases">
      <div className="max-w-5xl mx-auto h-px mb-20" style={{ background: 'linear-gradient(to right, transparent, rgba(99,102,241,0.3), transparent)' }} />

      <div className="max-w-5xl mx-auto">
        <header className="reveal text-center mb-16" style={{ opacity: 1 }}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: '#6366f1' }}>Use Cases</p>
          <h2 className="text-4xl font-bold text-white tracking-tight">
            Built for every kind of systems thinker
          </h2>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {cases.map((c, i) => (
            <article
              key={c.title}
              className={`usecase-card reveal reveal-delay-${i + 1} will-change-transform p-6 rounded-2xl flex flex-col gap-4`}
              style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', opacity: 1 }}
            >
              <div
                className="card-icon will-change-transform w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: c.color + '15', border: `1px solid ${c.color}25` }}
              >
                <c.Icon style={{ width: 18, height: 18, color: c.color }} />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-semibold text-white">{c.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{c.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
