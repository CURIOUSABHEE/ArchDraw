'use client';

import { useEffect, useRef } from 'react';
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

  return (
    <section ref={sectionRef} className="py-28 px-4 sm:px-6 lg:px-8" id="use-cases">
      <div className="max-w-5xl mx-auto">
        <header className="reveal text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-wider mb-4 text-primary">Use Cases</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Built for every kind of systems thinker
          </h2>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {cases.map((c, i) => (
            <div
              key={c.title}
              className={`reveal reveal-delay-${Math.min(i + 1, 5)} p-6 rounded-2xl bg-card transition-all hover:shadow-lg`}
              style={{ boxShadow: '0 4px 16px hsl(var(--foreground) / 0.06)' }}
            >
              <div className="flex flex-col gap-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: c.color + '15' }}
                >
                  <c.Icon style={{ width: 18, height: 18, color: c.color }} />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-semibold text-foreground">{c.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
