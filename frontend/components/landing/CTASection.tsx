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
    <section ref={sectionRef} className="py-32 px-6 relative overflow-hidden">
      {/* Floating card container */}
      <div className="max-w-3xl mx-auto bg-card rounded-3xl p-12 shadow-soft-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="reveal text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-foreground">
            <span>Start building your</span>
            <br />
            <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              architecture today.
            </span>
          </h2>
          <p className="reveal reveal-delay-1 text-lg mb-10 text-muted-foreground">
            No account needed. No credit card. Just your ideas.
          </p>
          <button
            ref={btnRef}
            onClick={() => router.push('/editor')}
            className="reveal reveal-delay-2 will-change-transform text-lg px-10 py-4 rounded-xl hover:opacity-90 transition-all shadow-md hover:shadow-lg bg-gradient-to-r from-primary to-purple-500 text-white"
          >
            Open the canvas →
          </button>
          <p className="text-sm mt-4 text-muted-foreground">
            New to system design?{' '}
            <Link href="/tutorials" className="text-primary hover:opacity-80 transition-opacity">
              Start with an interactive tutorial →
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}