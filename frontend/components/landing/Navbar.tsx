'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger);

const NAV_LINKS = ['Features', 'Templates', 'Use Cases'];
const NAV_TUTORIALS_HREF = '/tutorials';

export function Navbar() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Subtle slide-in only — no opacity manipulation
    gsap.fromTo(navRef.current,
      { y: -20 },
      { y: 0, duration: 0.5, ease: 'power2.out', delay: 0.1 }
    );

    ScrollTrigger.create({
      start: 'top -60',
      onEnter: () => gsap.to(navRef.current, {
        backgroundColor: 'rgba(8,12,20,0.92)',
        backdropFilter: 'blur(20px)',
        borderBottomColor: 'rgba(255,255,255,0.06)',
        duration: 0.3,
      }),
      onLeaveBack: () => gsap.to(navRef.current, {
        backgroundColor: 'transparent',
        borderBottomColor: 'transparent',
        duration: 0.3,
      }),
    });

    return () => { ScrollTrigger.getAll().forEach(t => t.kill()); };
  }, []);

  return (
    <header
      ref={navRef}
      className="navbar fixed top-0 z-50 w-full border-b border-transparent transition-colors duration-300"
      style={{ backgroundColor: 'transparent' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 group">
            <svg className="h-7 w-7 text-indigo-400 transition-transform group-hover:scale-105" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 2l8.66 5v10L12 22l-8.66-5V7L12 2z" />
            </svg>
            <span className="text-lg font-semibold text-white tracking-tight">Archflow</span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex gap-8">
            {NAV_LINKS.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(' ', '-')}`}
                className="nav-link relative text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                {item}
                <span className="nav-underline absolute -bottom-0.5 left-0 right-0 h-px bg-indigo-400 scale-x-0 origin-left transition-transform duration-300" />
              </a>
            ))}
            <a
              href={NAV_TUTORIALS_HREF}
              className="nav-link relative text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Tutorials
              <span className="nav-underline absolute -bottom-0.5 left-0 right-0 h-px bg-indigo-400 scale-x-0 origin-left transition-transform duration-300" />
            </a>
          </nav>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => router.push('/editor')}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-all"
            >
              Sign in
            </button>
            <button
              onClick={() => router.push('/editor')}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-lg shadow-indigo-500/20 transition-all"
            >
              Start designing
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-slate-400 hover:text-white p-2"
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
              <a
                key={item}
                href={`#${item.toLowerCase().replace(' ', '-')}`}
                className="block px-3 py-3 text-base font-medium text-slate-400 hover:text-white rounded-lg"
                onClick={() => setMobileOpen(false)}
              >
                {item}
              </a>
            ))}
            <a
              href={NAV_TUTORIALS_HREF}
              className="block px-3 py-3 text-base font-medium text-slate-400 hover:text-white rounded-lg"
              onClick={() => setMobileOpen(false)}
            >
              Tutorials
            </a>
            <div className="pt-4 flex flex-col gap-3">
              <button onClick={() => router.push('/editor')} className="w-full px-4 py-2.5 text-center font-medium text-slate-300 border border-white/10 rounded-lg">Sign in</button>
              <button onClick={() => router.push('/editor')} className="w-full px-4 py-2.5 text-center font-medium text-white bg-indigo-600 rounded-lg">Start designing</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
