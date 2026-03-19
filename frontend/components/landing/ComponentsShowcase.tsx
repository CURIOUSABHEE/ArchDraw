'use client';

import { useEffect, useRef } from 'react';

const categories = [
  { label: 'Client & Entry', chips: ['Client', 'DNS', 'CDN', 'API Gateway', 'Load Balancer', 'Reverse Proxy'], color: '#6366f1' },
  { label: 'Compute',        chips: ['Server', 'Microservice', 'Serverless', 'Worker', 'Container', 'VM'],     color: '#3b82f6' },
  { label: 'Data Storage',   chips: ['SQL Database', 'NoSQL', 'Redis Cache', 'Object Storage', 'Data Warehouse', 'Time Series DB'], color: '#64748b' },
  { label: 'Messaging',      chips: ['Kafka', 'Message Queue', 'Event Bus', 'Pub/Sub', 'Webhook', 'Stream'],   color: '#f59e0b' },
  { label: 'AI / ML',        chips: ['LLM API', 'Vector Database', 'RAG Pipeline', 'ML Model', 'Embeddings', 'Fine-tuning'], color: '#6366f1' },
  { label: 'External',       chips: ['Stripe', 'Resend', 'Twilio', 'OpenAI', 'GitHub', 'Slack'],              color: '#10b981' },
];

export function ComponentsShowcase() {
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
    <section ref={sectionRef} className="py-28 px-6 lg:px-8" style={{ backgroundColor: '#0d1117', opacity: 1 }} id="components">
      <div className="max-w-5xl mx-auto h-px mb-20" style={{ background: 'linear-gradient(to right, transparent, rgba(99,102,241,0.3), transparent)' }} />

      <div className="max-w-5xl mx-auto">
        <header className="reveal text-center mb-16" style={{ opacity: 1 }}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: '#6366f1' }}>Components</p>
          <h2 className="text-4xl font-bold text-white tracking-tight">
            150+ components. Every layer covered.
          </h2>
        </header>

        <div className="space-y-5">
          {categories.map((cat, i) => (
            <div
              key={cat.label}
              className={`reveal reveal-delay-${Math.min(i + 1, 5)} flex items-start gap-6`}
              style={{ opacity: 1 }}
            >
              <span className="text-xs font-semibold uppercase tracking-wider w-28 shrink-0 pt-2" style={{ color: '#334155' }}>{cat.label}</span>
              <div className="flex flex-wrap gap-2">
                {cat.chips.map((chip) => (
                  <span key={chip} className="px-3 py-1.5 rounded-full text-xs font-medium" style={{ color: cat.color, backgroundColor: cat.color + '10', border: `1px solid ${cat.color}20` }}>
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a href="/editor" className="text-sm font-semibold transition-colors" style={{ color: '#6366f1' }}>
            View all components →
          </a>
        </div>
      </div>
    </section>
  );
}
