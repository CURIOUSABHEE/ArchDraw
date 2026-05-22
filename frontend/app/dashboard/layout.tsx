'use client';

import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  let activePage = 'Dashboard';
  if (pathname.includes('/templates')) activePage = 'Templates';
  if (pathname.includes('/learn')) activePage = 'Learn';
  
  return <DashboardShell activePage={activePage}>{children}</DashboardShell>;
}
