import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import 'reactflow/dist/style.css';
import { AuthProvider } from '@/components/AuthProvider';
import { Toaster } from 'sonner';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Archflow — Visual Architecture Diagramming',
  description: 'Canvas-first architecture diagramming with 150+ components, AWS service icons, smart snapping, and animated edges. No signup required.',
  keywords: ['architecture diagram', 'system design', 'AWS diagram', 'cloud architecture', 'diagramming tool'],
  authors: [{ name: 'Archflow' }],
  openGraph: {
    title: 'Archflow — Visual Architecture Diagramming',
    description: 'Design system architecture visually. 150+ components, AWS icons, smart snapping. Free to use.',
    type: 'website',
    siteName: 'Archflow',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Archflow — Visual Architecture Diagramming',
    description: 'Design system architecture visually. 150+ components, AWS icons, smart snapping. Free to use.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          {children}
          <Toaster position="bottom-right" theme="dark" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}
