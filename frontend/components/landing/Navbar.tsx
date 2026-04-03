'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const NAV_LINKS = ['Features', 'Templates', 'Tutorials', 'Use Cases'];

export function Navbar() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className="fixed top-0 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-[1200px] mx-auto rounded-2xl"
      style={{ 
        background: '#ffffff', 
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        padding: '14px 24px'
      }}
    >
      <div className="flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2.5 group">
          <Image src="/image.png" alt="ArchDraw Logo" width={28} height={28} className="transition-transform group-hover:scale-105" />
          <span className="text-lg font-semibold text-gray-800 tracking-tight">ArchDraw</span>
        </Link>

        <nav className="hidden md:flex gap-8">
          {NAV_LINKS.map((item) => (
            <Link
              key={item}
              href={item === 'Tutorials' ? '/tutorials' : item === 'Blog' ? '/blog' : `#${item.toLowerCase().replace(' ', '-')}`}
              className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
            >
              {item}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => router.push('/editor')}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 rounded-xl hover:bg-gray-100 transition-all"
          >
            Sign in
          </button>
          <button
            onClick={() => router.push('/editor')}
            className="px-4 py-2 text-sm font-medium text-white rounded-xl hover:opacity-90 transition-all shadow-md hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            Start designing
          </button>
        </div>

        <button
          className="md:hidden text-gray-500 hover:text-gray-800 p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
              d={mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 rounded-b-2xl mt-3 pt-2">
          <div className="px-2 pt-2 pb-6 space-y-1">
            {NAV_LINKS.map((item) => (
              <Link
                key={item}
                href={item === 'Tutorials' ? '/tutorials' : item === 'Blog' ? '/blog' : `#${item.toLowerCase().replace(' ', '-')}`}
                className="block px-3 py-3 text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-xl"
                onClick={() => setMobileOpen(false)}
              >
                {item}
              </Link>
            ))}

            <div className="pt-4 flex flex-col gap-3">
              <button
                onClick={() => router.push('/editor')}
                className="w-full px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-xl transition-all"
              >
                Sign in
              </button>
              <button
                onClick={() => router.push('/editor')}
                className="w-full px-4 py-2.5 text-sm font-medium text-white rounded-xl hover:opacity-90 transition-all"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
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