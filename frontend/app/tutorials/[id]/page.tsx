import type { Metadata } from 'next';
import { getTutorialById } from '@/data/tutorials';
import TutorialPageClient from './TutorialPageClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const tutorial = getTutorialById(id);
  if (!tutorial) return { title: 'Tutorial Not Found | ArchFlow' };

  const keywords = [
    ...tutorial.tags,
    'system design',
    'architecture diagram',
    'ArchFlow',
  ].join(', ');

  return {
    title: `How to Design ${tutorial.title} | ArchFlow`,
    description: tutorial.description,
    keywords,
    openGraph: {
      title: `How to Design ${tutorial.title} | ArchFlow`,
      description: tutorial.description,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `How to Design ${tutorial.title} | ArchFlow`,
      description: tutorial.description,
    },
  };
}

export default function TutorialPage() {
  return <TutorialPageClient />;
}
