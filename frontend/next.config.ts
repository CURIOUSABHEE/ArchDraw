import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { 
    key: 'Content-Security-Policy', 
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://*.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://*.groq.com https://api.groq.com wss://*.supabase.co https://*.vercel-scripts.com; frame-ancestors 'self'; base-uri 'self';" 
  },
];

const embedHeaders = [
  { key: 'X-Frame-Options', value: 'ALLOWALL' },
  { key: 'Content-Security-Policy', value: "frame-ancestors *" },
];

const nextConfig: NextConfig = {
  transpilePackages: ['reactflow', '@reactflow/core', '@reactflow/background', '@reactflow/controls', '@reactflow/minimap'],
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'gsap',
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-context-menu',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-hover-card',
      '@radix-ui/react-label',
      '@radix-ui/react-menubar',
      '@radix-ui/react-navigation-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-progress',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slider',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-toggle',
      '@radix-ui/react-toggle-group',
      '@radix-ui/react-tooltip',
    ],
  },
  turbopack: { root: __dirname },
  async headers() {
    return [
      {
        source: '/embed/:path*',
        headers: embedHeaders,
      },
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
  logging: {
    fetches: { fullUrl: false },
  },
};

export default nextConfig;
