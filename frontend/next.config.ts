import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['reactflow', '@reactflow/core', '@reactflow/background', '@reactflow/controls', '@reactflow/minimap'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
