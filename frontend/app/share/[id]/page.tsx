import SharePageClient from './SharePageClient';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return [];
}

export default async function SharePage({ params }: Props) {
  const { id } = await params;
  return <SharePageClient id={id} />;
}