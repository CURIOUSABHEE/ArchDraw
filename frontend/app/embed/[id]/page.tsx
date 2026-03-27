import { Metadata } from 'next';
import EmbedPageClient from './EmbedPageClient';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  
  return {
    title: 'ArchDraw - Embedded Diagram',
    description: 'View this architecture diagram',
    robots: 'noindex',
    other: {
      'og:type': 'website',
      'og:title': 'ArchDraw Diagram',
      'og:description': 'Architecture diagram created with ArchDraw',
    },
  };
}

export default async function EmbedPage({ params, searchParams }: Props) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  return (
    <EmbedPageClient 
      id={resolvedParams.id}
      searchParams={resolvedSearchParams}
    />
  );
}
