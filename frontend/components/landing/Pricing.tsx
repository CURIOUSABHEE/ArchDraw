'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const freeFeatures = [
  'Unlimited canvases',
  '150+ components',
  'All templates',
  'Export as PNG',
  'Share with link',
  'No account needed to start',
];

const proFeatures = [
  'Everything in Free',
  'Team collaboration (real-time)',
  'Custom component library',
  'Password-protected shares',
  'Version history',
  'Priority support',
];

function Check() {
  return (
    <svg className="w-4 h-4 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function Pricing() {
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

  return (
    <section ref={sectionRef} className="py-28 px-6" id="pricing">
      <div className="max-w-4xl mx-auto">
        <header className="reveal text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Free while in beta. Forever generous after.
          </h2>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Free */}
          <div className="reveal reveal-delay-1 relative rounded-2xl border border-primary/30 bg-card p-8 flex flex-col shadow-soft-3">
            <span className="absolute top-4 right-4 bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">Current plan</span>
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-foreground mb-1">Free</h3>
              <p className="text-4xl font-extrabold text-foreground">$0<span className="text-base font-normal text-muted-foreground">/month</span></p>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {freeFeatures.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Check />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => router.push('/editor')}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-colors"
            >
              Start for free →
            </button>
          </div>

          {/* Pro */}
          <div className="reveal reveal-delay-2 relative rounded-2xl border border-border/20 bg-card p-8 flex flex-col shadow-soft-2">
            <span className="absolute top-4 right-4 bg-muted text-muted-foreground text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">Coming soon</span>
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-foreground mb-1">Pro</h3>
              <p className="text-4xl font-extrabold text-muted-foreground">TBD</p>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {proFeatures.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <svg className="w-4 h-4 text-muted-foreground/40 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <button className="w-full py-3 border border-border/20 text-muted-foreground font-semibold rounded-xl hover:bg-accent transition-colors">
              Join waitlist
            </button>
          </div>
        </div>

        <p className="reveal reveal-delay-3 text-center text-sm text-muted-foreground mt-8">No credit card ever required for free plan</p>
      </div>
    </section>
  );
}
