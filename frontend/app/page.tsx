'use client';

import dynamic from 'next/dynamic';

const LandingPage = dynamic(() => import('@/views/Landing'), {
  ssr: false,
  loading: () => (
    <div style={{ minHeight: '100vh', background: '#0a0a12' }} />
  ),
});

export default function Home() {
  return <LandingPage />;
}
