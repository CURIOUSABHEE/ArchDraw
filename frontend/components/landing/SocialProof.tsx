'use client';

import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger);

const techs = ['Next.js', 'Supabase', 'AWS', 'Vercel', 'Docker', 'Kubernetes', 'Redis', 'PostgreSQL', 'React', 'TypeScript', 'Tailwind', 'Dagre', 'OpenAI', 'Kafka', 'GraphQL'];

export function SocialProof() {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    gsap.fromTo('.social-label',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out',
        scrollTrigger: { trigger: '.social-label', start: 'top 85%', toggleActions: 'play none none none' } }
    );

    return () => { ScrollTrigger.getAll().forEach(t => t.kill()); };
  }, []);

  return (
    <section className="py-16 overflow-hidden" style={{ backgroundColor: '#0d1117', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="max-w-7xl mx-auto px-4">
        <p className="social-label mb-10 text-center text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: '#334155' }}>
          Built for engineers who think in systems
        </p>

        <div
          className="relative"
          style={{
            maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
          }}
        >
          <div className="flex items-center gap-3 py-2" style={{ animation: 'marquee 30s linear infinite', width: 'max-content' }}>
            {[...techs, ...techs].map((tech, i) => (
              <span
                key={i}
                className="px-4 py-2 rounded-full text-sm whitespace-nowrap font-mono"
                style={{ color: '#475569', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}
