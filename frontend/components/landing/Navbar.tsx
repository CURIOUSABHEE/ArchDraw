'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function Navbar() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <header
      className="sticky top-0 z-50 w-full bg-white border-b border-slate-200 transition-all duration-300"
      style={scrolled ? { backgroundColor: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' } : {}}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <a href="/" className="flex items-center space-x-2 group">
            <svg className="h-8 w-8 text-indigo-600 transition-transform group-hover:scale-105" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 2l8.66 5v10L12 22l-8.66-5V7L12 2z" />
            </svg>
            <span className="text-xl font-semibold text-slate-900 tracking-tight">Archflow</span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex space-x-8">
            {['Features', 'Templates', 'Use Cases'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(' ', '-')}`}
                className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
              >
                {item}
              </a>
            ))}
          </nav>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center space-x-3">
            <button
              onClick={() => router.push('/editor')}
              className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50 transition-all"
            >
              Sign in
            </button>
            <button
              onClick={() => router.push('/editor')}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 shadow-sm transition-all"
            >
              Start designing
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-slate-600 hover:text-slate-900 p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d={mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white">
          <div className="px-4 pt-2 pb-6 space-y-1">
            {['Features', 'Templates', 'Use Cases'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(' ', '-')}`}
                className="block px-3 py-3 text-base font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-md"
                onClick={() => setMobileOpen(false)}
              >
                {item}
              </a>
            ))}
            <div className="pt-4 flex flex-col space-y-3">
              <button onClick={() => router.push('/editor')} className="w-full px-4 py-2.5 text-center font-medium text-slate-700 border border-slate-200 rounded-md">Sign in</button>
              <button onClick={() => router.push('/editor')} className="w-full px-4 py-2.5 text-center font-medium text-white bg-indigo-600 rounded-md">Start designing</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
