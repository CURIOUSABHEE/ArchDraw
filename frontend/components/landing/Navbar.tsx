'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const NAV_LINKS = ['Features', 'Templates', 'Tutorials', 'Use Cases'];

export function Navbar() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const nav = navRef.current;
    if (!nav) return;

    const updateNavbar = () => {
      const scrolled = window.scrollY > 10;
      if (scrolled) {
        nav.classList.add('floating-toolbar');
        nav.classList.remove('mx-4', 'mt-4', 'rounded-2xl');
        nav.style.background = 'transparent';
        nav.style.boxShadow = 'none';
      } else {
        nav.classList.remove('floating-toolbar');
        nav.classList.add('mx-4', 'mt-4', 'rounded-2xl');
        nav.style.background = 'hsl(var(--card))';
        nav.style.boxShadow = '0 4px 20px hsl(var(--foreground) / 0.08)';
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
      className="fixed top-0 z-50 w-[calc(100%-2rem)] mx-4 mt-4 rounded-2xl"
      style={{ background: 'hsl(var(--card))', boxShadow: '0 4px 20px hsl(var(--foreground) / 0.08)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image src="/image.png" alt="ArchDraw Logo" width={28} height={28} className="transition-transform group-hover:scale-105" />
            <span className="text-lg font-semibold text-foreground tracking-tight">ArchDraw</span>
          </Link>

          <nav className="hidden md:flex gap-8">
            {NAV_LINKS.map((item) => (
              <Link
                key={item}
                href={item === 'Tutorials' ? '/tutorials' : item === 'Blog' ? '/blog' : `#${item.toLowerCase().replace(' ', '-')}`}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => router.push('/editor')}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-xl hover:bg-accent transition-all"
            >
              Sign in
            </button>
            <button
              onClick={() => router.push('/editor')}
              className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-xl hover:bg-primary/90 transition-all shadow-sm hover:shadow-md"
            >
              Start designing
            </button>
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
        <div className="md:hidden border-t border-foreground/5 bg-card rounded-b-2xl">
          <div className="px-4 pt-2 pb-6 space-y-1">
            {NAV_LINKS.map((item) => (
              <Link
                key={item}
                href={item === 'Tutorials' ? '/tutorials' : item === 'Blog' ? '/blog' : `#${item.toLowerCase().replace(' ', '-')}`}
                className="block px-3 py-3 text-sm font-medium text-muted-foreground hover:text-foreground rounded-xl"
                onClick={() => setMobileOpen(false)}
              >
                {item}
              </Link>
            ))}

            <div className="pt-4 flex flex-col gap-3">
              <button
                onClick={() => router.push('/editor')}
                className="w-full px-4 py-2.5 text-sm font-medium border border-foreground/10 rounded-xl hover:bg-accent transition-all"
              >
                Sign in
              </button>
              <button
                onClick={() => router.push('/editor')}
                className="w-full px-4 py-2.5 text-sm font-medium bg-primary text-white rounded-xl hover:bg-primary/90 transition-all"
              >
                Start designing
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
