'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { Bot, Camera, Film, Car, Layers, Brain, GraduationCap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const templates: { Icon: LucideIcon; name: string; desc: string; nodes: string; tags: string[]; accent: string }[] = [
  { Icon: Bot,    name: 'ChatGPT Architecture', desc: 'LLM RAG pipeline, vector DB, streaming',          nodes: '14', tags: ['AI', 'LLM', 'RAG'],        accent: '#6366f1' },
  { Icon: Camera, name: 'Instagram',            desc: 'Feed service, media pipeline, Kafka, CDN',        nodes: '22', tags: ['Social', 'Kafka'],          accent: '#6366f1' },
  { Icon: Film,   name: 'Netflix',              desc: 'Video transcoding, CDN, recommendation ML',       nodes: '18', tags: ['Streaming', 'CDN', 'ML'],   accent: '#ef4444' },
  { Icon: Car,    name: 'Uber',                 desc: 'Real-time matching, maps API, location tracking', nodes: '26', tags: ['Real-time', 'Maps'],        accent: '#f59e0b' },
  { Icon: Layers, name: 'ArchFlow itself',      desc: 'The architecture of this very tool',              nodes: '23', tags: ['Next.js', 'Supabase'],      accent: '#10b981' },
  { Icon: Brain,  name: 'RAG Application',      desc: 'Vector DB, embeddings, LLM, retrieval pipeline', nodes: '10', tags: ['AI', 'Vector', 'RAG'],      accent: '#6366f1' },
];

export function Templates() {
  const router = useRouter();
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

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    section.querySelectorAll<HTMLElement>('.template-card').forEach((card) => {
      card.addEventListener('mouseenter', () => gsap.to(card, { y: -4, duration: 0.3, ease: 'power2.out' }));
      card.addEventListener('mouseleave', () => gsap.to(card, { y: 0, duration: 0.4, ease: 'power2.inOut' }));
    });
  }, []);

  return (
    <section ref={sectionRef} className="py-28 px-6 sm:px-12 lg:px-24" id="templates">
      <div className="max-w-6xl mx-auto">
        <header className="reveal text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-wider mb-4 text-primary">Templates</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-4">
            Start from real-world architectures
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Learn system design by exploring how the world&apos;s biggest products are built.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {templates.map((t, i) => (
            <div
              key={t.name}
              className={`template-card reveal reveal-delay-${Math.min(i + 1, 5)} will-change-transform p-5 flex flex-col justify-between cursor-pointer rounded-2xl bg-card transition-all hover:shadow-lg`}
              style={{ boxShadow: '0 4px 16px hsl(var(--foreground) / 0.06)' }}
              onClick={() => router.push('/editor')}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: t.accent + '15' }}>
                      <t.Icon style={{ width: 15, height: 15, color: t.accent }} />
                    </div>
                    <h3 className="font-semibold text-foreground">{t.name}</h3>
                  </div>
                  <Badge variant="secondary" className="text-[10px] font-medium">{t.nodes} Nodes</Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{t.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {t.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-1 rounded-lg"
                      style={{ borderColor: t.accent + '30', color: t.accent, backgroundColor: t.accent + '10' }}
                    >{tag}</span>
                  ))}
                </div>
              </div>
              <div className="mt-4 text-sm flex items-center gap-1 font-medium text-primary">
                Load template
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                </svg>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 text-center flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => router.push('/editor')}
            className="px-5 py-2.5 text-sm font-medium border border-foreground/10 rounded-xl hover:bg-accent transition-all"
          >
            Browse all templates →
          </button>
          <button
            onClick={() => router.push('/tutorials')}
            className="px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-xl hover:bg-accent transition-all flex items-center gap-2"
          >
            <GraduationCap className="w-4 h-4" />
            Try interactive tutorials
          </button>
        </div>
      </div>
    </section>
  );
}
