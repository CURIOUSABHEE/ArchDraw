'use client';

import dynamic from 'next/dynamic';

export const LandingPage = dynamic(() => import('@/views/Landing'), {
  ssr: false,
  loading: () => <div style={{ minHeight: '100vh', background: '#0a0a12' }} />,
});

export const EditorPage = dynamic(() => import('@/views/Editor'), {
  ssr: false,
  loading: () => <div style={{ minHeight: '100vh', background: '#0a0a12' }} />,
});
