import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/docs', '/tutorials', '/tutorials/*', '/learn/*'],
      disallow: ['/editor', '/api', '/share', '/auth'],
    },
    sitemap: 'https://archdraw.app/sitemap.xml',
  };
}
