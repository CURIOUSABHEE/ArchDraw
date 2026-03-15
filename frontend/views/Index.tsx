'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** Redirect root to the editor */
const Index = () => {
  const router = useRouter();
  useEffect(() => { router.replace('/editor'); }, [router]);
  return null;
};

export default Index;
