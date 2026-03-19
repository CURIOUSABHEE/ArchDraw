'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import gsap from 'gsap';
import { Bot, Camera, Film, Car, Layers, Brain, GraduationCap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

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
    section.querySelectorAll<HTMLElement>('.template-card').forEach((card) => {
      card.addEventListener('mouseenter', () => gsap.to(card, { y: -4, duration: 0.3, ease: 'power2.out' }));
      card.addEventListener('mouseleave', () => gsap.to(card, { y: 0, duration: 0.4, ease: 'power2.inOut' }));
    });
  }, []);

  return (
    <section ref={sectionRef} className="py-28 px-6 sm:px-12 lg:px-24" style={{ backgroundColor: '#080c14', opacity: 1 }} id="templates">
      <div className="max-w-6xl mx-auto h-px mb-20" style={{ background: 'linear-gradient(to right, transparent, rgba(99,102,241,0.3), transparent)' }} />

      <div className="max-w-6xl mx-auto">
        <header className="reveal text-center mb-16" style={{ opacity: 1 }}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: '#6366f1' }}>Templates</p>
          <h2 className="text-4xl font-bold text-white tracking-tight mb-4">
            Start from real-world architectures
          </h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: '#64748b' }}>
            Learn system design by exploring how the world&apos;s biggest products are built.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {templates.map((t, i) => (
            <article
              key={t.name}
              className={`template-card reveal reveal-delay-${Math.min(i + 1, 5)} will-change-transform p-5 rounded-2xl flex flex-col justify-between cursor-pointer`}
              style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', opacity: 1 }}
              onClick={() => router.push('/editor')}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: t.accent + '15', border: `1px solid ${t.accent}25` }}>
                      <t.Icon style={{ width: 15, height: 15, color: t.accent }} />
                    </div>
                    <h3 className="font-semibold text-white">{t.name}</h3>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider" style={{ color: '#475569', backgroundColor: 'rgba(255,255,255,0.04)' }}>{t.nodes} Nodes</span>
                </div>
                <p className="text-sm mb-4 leading-relaxed" style={{ color: '#64748b' }}>{t.desc}</p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {t.tags.map((tag) => (
                    <span key={tag} className="px-2.5 py-0.5 text-xs font-medium rounded-full" style={{ color: t.accent, backgroundColor: t.accent + '15', border: `1px solid ${t.accent}25` }}>{tag}</span>
                  ))}
                </div>
              </div>
              <button className="text-sm flex items-center gap-1 font-semibold transition-colors" style={{ color: '#6366f1' }}>
                Load template
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </button>
            </article>
          ))}
        </div>

        <div className="mt-14 text-center flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => router.push('/editor')}
            className="inline-flex items-center px-6 py-3 rounded-xl font-semibold text-sm transition-all"
            style={{ color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'transparent' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.16)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
          >
            Browse all templates →
          </button>
          <Link
            href="/tutorials"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-slate-300 hover:text-white text-sm transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}
            onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.2)')}
            onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.1)')}
          >
            <GraduationCap className="w-4 h-4" />
            Try interactive tutorials
          </Link>
        </div>
      </div>
    </section>
  );
}
