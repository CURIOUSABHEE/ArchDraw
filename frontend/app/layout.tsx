import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import 'reactflow/dist/style.css';
import { AuthProvider } from '@/components/AuthProvider';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/ThemeProvider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://archdraw.app'),
  title: {
    default: 'ArchDraw — Visual System Architecture Design Tool',
    template: '%s | ArchDraw',
  },
  description: 'Design production-ready system architecture diagrams visually. Drag, connect, and think in systems. Used by engineers to design scalable backends.',
  keywords: [
    'system design tool', 'architecture diagram', 'system architecture',
    'software architecture diagram', 'system design diagram maker',
    'backend architecture tool', 'microservices diagram', 'cloud architecture diagram',
    'system design interview', 'network diagram tool',
  ],
  authors: [{ name: 'ArchDraw' }],
  creator: 'ArchDraw',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://archdraw.app',
    title: 'ArchDraw — Visual System Architecture Design Tool',
    description: 'Design production-ready system architecture diagrams visually.',
    siteName: 'ArchDraw',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'ArchDraw System Architecture Design Tool' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ArchDraw — Visual System Architecture Design Tool',
    description: 'Design production-ready system architecture diagrams visually.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('archdraw-theme');
                  if (theme === 'dark' || (!theme && 'dark' === 'dark')) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="archdraw-theme" themes={['dark', 'light']}>
          <AuthProvider>
            {children}
            <Toaster position="bottom-right" theme="dark" richColors />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
