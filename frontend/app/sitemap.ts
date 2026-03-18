import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://archflow.app', lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: 'https://archflow.app/editor', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: 'https://archflow.app/privacy', lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: 'https://archflow.app/terms', lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];
}
