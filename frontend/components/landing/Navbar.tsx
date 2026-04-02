'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

const NAV_LINKS = ['Features', 'Templates', 'Tutorials', 'Use Cases'];

export function Navbar() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const nav = navRef.current;
    if (!nav) return;

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = document.documentElement.classList.contains('dark') || prefersDark || true;

    const updateNavbar = () => {
      const scrolled = window.scrollY > 10;
      if (isDark) {
        nav.style.backgroundColor = scrolled ? 'hsl(var(--background) / 0.85)' : 'transparent';
        nav.style.backdropFilter = scrolled ? 'blur(16px)' : 'none';
        nav.style.borderBottomColor = scrolled ? 'hsl(var(--border) / 0.5)' : 'transparent';
      }
    };

    updateNavbar();
    window.addEventListener('scroll', updateNavbar, { passive: true });

    return () => {
      window.removeEventListener('scroll', updateNavbar);
    };
  }, []);

  return (
    <header
      ref={navRef}
      className="navbar fixed top-0 z-50 w-full border-b transition-all duration-300"
      style={{ backgroundColor: 'transparent', borderColor: 'transparent' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-border/30">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image src="/image.png" alt="ArchDraw Logo" width={32} height={32} className="transition-transform group-hover:scale-105" />
            <span className="text-xl font-bold text-foreground tracking-tight">Archflow</span>
          </Link>

          <nav className="hidden md:flex gap-8">
            {NAV_LINKS.map((item) => (
              <Link
                key={item}
                href={item === 'Tutorials' ? '/tutorials' : item === 'Blog' ? '/blog' : `#${item.toLowerCase().replace(' ', '-')}`}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                {item}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push('/editor')}>
              Sign in
            </Button>
            <Button size="sm" onClick={() => router.push('/editor')}>
              Start designing
            </Button>
          </div>

          <button
            className="md:hidden text-muted-foreground hover:text-foreground p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                d={mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="px-4 pt-2 pb-6 space-y-1">
            {NAV_LINKS.map((item) => (
              <Link
                key={item}
                href={item === 'Tutorials' ? '/tutorials' : item === 'Blog' ? '/blog' : `#${item.toLowerCase().replace(' ', '-')}`}
                className="block px-3 py-3 text-base font-medium text-muted-foreground hover:text-foreground rounded-lg"
                onClick={() => setMobileOpen(false)}
              >
                {item}
              </Link>
            ))}

            <div className="pt-4 flex flex-col gap-3">
              <Button variant="outline" className="w-full" onClick={() => router.push('/editor')}>
                Sign in
              </Button>
              <Button className="w-full" onClick={() => router.push('/editor')}>
                Start designing
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
