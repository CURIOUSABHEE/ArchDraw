'use client';

import { useEffect, useRef } from 'react';

const categories = [
  { label: 'Client & Entry', chips: ['Client', 'DNS', 'CDN', 'API Gateway', 'Load Balancer', 'Reverse Proxy'], color: '#5A5A5A' },
  { label: 'Compute',        chips: ['Server', 'Microservice', 'Serverless', 'Worker', 'Container', 'VM'],     color: '#3b82f6' },
  { label: 'Data Storage',   chips: ['SQL Database', 'NoSQL', 'Redis Cache', 'Object Storage', 'Data Warehouse', 'Time Series DB'], color: '#64748b' },
  { label: 'Messaging',      chips: ['Kafka', 'Message Queue', 'Event Bus', 'Pub/Sub', 'Webhook', 'Stream'],   color: '#f59e0b' },
  { label: 'AI / ML',        chips: ['LLM API', 'Vector Database', 'RAG Pipeline', 'ML Model', 'Embeddings', 'Fine-tuning'], color: '#5A5A5A' },
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
    <section ref={sectionRef} className="py-28 px-6" id="components">
      <div className="max-w-5xl mx-auto">
        {/* Floating card container */}
        <div className="bg-card rounded-3xl p-8 md:p-12 shadow-soft-4">
          <header className="reveal text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-wider mb-4 text-muted-foreground">Components</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              150+ components. Every layer covered.
            </h2>
          </header>

          <div className="space-y-5">
            {categories.map((cat, i) => (
              <div
                key={cat.label}
                className={`reveal reveal-delay-${Math.min(i + 1, 5)} flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-6`}
              >
                <span className="text-xs font-medium uppercase tracking-wider sm:w-28 shrink-0 pt-2 text-muted-foreground">{cat.label}</span>
                <div className="flex flex-wrap gap-2">
                  {cat.chips.map((chip) => (
                    <span
                      key={chip}
                      className="text-xs px-3 py-1.5 rounded-lg"
                      style={{ color: cat.color, backgroundColor: cat.color + '10' }}
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}