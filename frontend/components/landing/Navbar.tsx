'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const NAV_LINKS = ['Features', 'Templates', 'Blog', 'Use Cases'];

export function Navbar() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const scrollTriggerRef = useRef<{ kill: () => void; gsapKill: () => void } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const nav = navRef.current;

    Promise.all([
      import('gsap'),
      import('gsap/ScrollTrigger'),
    ]).then(([gsapModule, scrollTriggerModule]) => {
      const gsap = gsapModule.default;
      const { ScrollTrigger } = scrollTriggerModule;
      gsap.registerPlugin(ScrollTrigger);

      gsap.fromTo(nav,
        { y: -20 },
        { y: 0, duration: 0.5, ease: 'power2.out', delay: 0.1 }
      );

      const trigger = ScrollTrigger.create({
        start: 'top -60',
        onEnter: () => gsap.to(nav, {
          backgroundColor: 'rgba(8,12,20,0.85)',
          backdropFilter: 'blur(16px)',
          borderBottomColor: 'rgba(255,255,255,0.06)',
          duration: 0.3,
        }),
        onLeaveBack: () => gsap.to(nav, {
          backgroundColor: 'transparent',
          backdropFilter: 'none',
          borderBottomColor: 'transparent',
          duration: 0.3,
        }),
      });

      const entranceTl = gsap.globalTimeline[gsap.globalTimeline.length - 1];
      scrollTriggerRef.current = {
        kill: () => trigger.kill(),
        gsapKill: () => entranceTl?.kill(),
      };
    });

    return () => {
      if (nav) {
        nav.style.backgroundColor = 'transparent';
        nav.style.backdropFilter = 'none';
        nav.style.borderBottomColor = 'transparent';
      }
      scrollTriggerRef.current?.kill();
      scrollTriggerRef.current?.gsapKill();
    };
  }, []);

  return (
    <header
      ref={navRef}
      className="navbar fixed top-0 z-50 w-full transition-all duration-300"
      style={{ backgroundColor: 'transparent', borderBottom: '1px solid transparent' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <svg className="h-8 w-8 text-indigo-400 transition-transform group-hover:scale-105" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 2l8.66 5v10L12 22l-8.66-5V7L12 2z" />
            </svg>
            <span className="text-xl font-bold text-white tracking-tight">Archflow</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex gap-8">
            {NAV_LINKS.map((item) => (
              <Link
                key={item}
                href={item === 'Blog' ? '/blog' : `#${item.toLowerCase().replace(' ', '-')}`}
                className="nav-link text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#080c14] rounded"
              >
                {item}
              </Link>
            ))}
          </nav>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => router.push('/editor')}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#080c14]"
            >
              Sign in
            </button>
            <button
              onClick={() => router.push('/editor')}
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-lg shadow-indigo-500/20 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#080c14]"
            >
              Start designing
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-slate-400 hover:text-white p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#080c14] rounded"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d={mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/06" style={{ backgroundColor: '#080c14' }}>
          <div className="px-4 pt-2 pb-6 space-y-1">
            {NAV_LINKS.map((item) => (
              <Link
                key={item}
                href={item === 'Blog' ? '/blog' : `#${item.toLowerCase().replace(' ', '-')}`}
                className="block px-3 py-3 text-base font-medium text-slate-400 hover:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-inset"
                onClick={() => setMobileOpen(false)}
              >
                {item}
              </Link>
            ))}

            <div className="pt-4 flex flex-col gap-3">
              <button 
                onClick={() => router.push('/editor')} 
                className="w-full px-4 py-2.5 text-center font-medium text-slate-300 border border-white/10 rounded-lg hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-inset"
              >
                Sign in
              </button>
              <button 
                onClick={() => router.push('/editor')} 
                className="w-full px-4 py-2.5 text-center font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-inset"
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
