'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import gsap from 'gsap';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
    <section ref={sectionRef} className="py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-background">
      <div className="max-w-3xl mx-auto h-px mb-20 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/5 blur-3xl rounded-full" />
      </div>

      <div className="max-w-3xl mx-auto text-center relative">
        <h2 className="reveal text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
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
        <Button
          ref={btnRef}
          size="lg"
          onClick={() => router.push('/editor')}
          className="reveal reveal-delay-2 will-change-transform text-lg px-10 py-6"
        >
          Open the canvas →
        </Button>
        <p className="text-sm text-muted-foreground mt-4">
          New to system design?{' '}
          <Link href="/tutorials" className="text-primary hover:text-primary/80 transition-colors underline underline-offset-2">
            Start with an interactive tutorial →
          </Link>
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {['Next.js', 'Supabase', 'Vercel', 'React'].map((t) => (
            <Badge key={t} variant="secondary" className="text-xs">
              {t}
            </Badge>
          ))}
        </div>
      </div>
    </section>
  );
}
