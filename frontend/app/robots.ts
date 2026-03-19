import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/tutorials', '/tutorials/*', '/learn/*'],
      disallow: ['/editor', '/api', '/share', '/auth'],
    },
    sitemap: 'https://archflow.app/sitemap.xml',
  };
}
