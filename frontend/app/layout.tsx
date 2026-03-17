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
  title: 'ArchDraw — Visual Architecture Diagramming',
  description: 'Canvas-first architecture diagramming with 150+ components, AWS service icons, smart snapping, and animated edges.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          {children}
          <Toaster position="bottom-right" theme="dark" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}
