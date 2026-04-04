import { DashboardShell } from '@/components/dashboard/DashboardShell';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell activePage="Dashboard">{children}</DashboardShell>;
}
