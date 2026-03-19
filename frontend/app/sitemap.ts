import type { MetadataRoute } from 'next';
import { TUTORIALS } from '@/data/tutorials';

export default function sitemap(): MetadataRoute.Sitemap {
  const tutorialEntries: MetadataRoute.Sitemap = TUTORIALS.map((t) => ({
    url: `https://archflow.app/tutorials/${t.id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.9,
  }));

  const learnEntries: MetadataRoute.Sitemap = TUTORIALS.map((t) => ({
    url: `https://archflow.app/learn/${t.id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.9,
  }));

  return [
    { url: 'https://archflow.app', lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: 'https://archflow.app/tutorials', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: 'https://archflow.app/editor', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: 'https://archflow.app/privacy', lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: 'https://archflow.app/terms', lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    ...tutorialEntries,
    ...learnEntries,
  ];
}
