'use client';

import { useEffect, useRef } from 'react';
import { Boxes, Zap, LayoutTemplate, Link2, Download, LayoutGrid } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const features: { Icon: LucideIcon; color: string; title: string; desc: string }[] = [
  { Icon: Boxes,          color: '#6366f1', title: '150+ Components',    desc: 'Pre-built nodes for every layer — auth, databases, queues, AI services, cloud infra and more.' },
  { Icon: Zap,            color: '#3b82f6', title: 'Smart Auto Layout',  desc: "One click to organize your entire diagram with Dagre's hierarchical layout algorithm." },
  { Icon: LayoutTemplate, color: '#6366f1', title: 'Real-time Templates', desc: 'Start from battle-tested architectures — ChatGPT, Instagram, Netflix and more.' },
  { Icon: Link2,          color: '#10b981', title: 'Share with a Link',  desc: 'Generate a shareable URL for any diagram. Anyone can view and interact — no account needed.' },
  { Icon: Download,       color: '#f59e0b', title: 'Export as PNG',      desc: 'Export high-resolution images for docs, presentations, or Notion pages. 3× resolution.' },
  { Icon: LayoutGrid,     color: '#06b6d4', title: 'Multiple Canvases',  desc: 'Work on different systems simultaneously with tabbed canvases. Switch instantly.' },
];

export function Features() {
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
    <section ref={sectionRef} className="py-28 px-4 sm:px-6 lg:px-8" id="features">
      <div className="max-w-5xl mx-auto">
        <header className="reveal text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-wider mb-4 text-primary">Features</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Everything you need to diagram faster
          </h2>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div
              key={f.title}
              className={`reveal reveal-delay-${Math.min(i + 1, 5)} p-6 rounded-2xl bg-card transition-all hover:shadow-lg`}
              style={{ boxShadow: '0 4px 16px hsl(var(--foreground) / 0.06)' }}
            >
              <div className="flex flex-col gap-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: f.color + '15' }}
                >
                  <f.Icon style={{ width: 18, height: 18, color: f.color }} />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-semibold text-foreground">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
