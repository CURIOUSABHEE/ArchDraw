'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import gsap from 'gsap';

export function CTASection() {
  const router = useRouter();
  const sectionRef = useRef<HTMLElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

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
    const btn = btnRef.current;
    if (!btn) return;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = btn.getBoundingClientRect();
      const deltaX = (e.clientX - (rect.left + rect.width / 2)) * 0.25;
      const deltaY = (e.clientY - (rect.top + rect.height / 2)) * 0.25;
      gsap.to(btn, { x: deltaX, y: deltaY, duration: 0.3, ease: 'power2.out' });
    };
    const handleMouseLeave = () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
    };
    btn.addEventListener('mousemove', handleMouseMove);
    btn.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      btn.removeEventListener('mousemove', handleMouseMove);
      btn.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <section ref={sectionRef} className="py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-3xl mx-auto h-px mb-20 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="max-w-3xl mx-auto text-center relative">
        <h2 className="reveal text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
          <span className="text-foreground">
            Start building your
          </span>
          <br />
          <span className="text-primary">
            architecture today.
          </span>
        </h2>
        <p className="reveal reveal-delay-1 text-lg text-muted-foreground mb-10">
          No account needed. No credit card. Just your ideas.
        </p>
        <button
          ref={btnRef}
          onClick={() => router.push('/editor')}
          className="reveal reveal-delay-2 will-change-transform text-lg px-10 py-4 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all shadow-md hover:shadow-lg"
        >
          Open the canvas →
        </button>
        <p className="text-sm text-muted-foreground mt-4">
          New to system design?{' '}
          <Link href="/tutorials" className="text-primary hover:text-primary/80 transition-colors">
            Start with an interactive tutorial →
          </Link>
        </p>
      </div>
    </section>
  );
}
