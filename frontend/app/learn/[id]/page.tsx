import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTutorialById, TUTORIALS, isLeveledTutorial } from '@/data/tutorials';
import type { TutorialData } from '@/data/tutorials';
import type { Tutorial } from '@/lib/tutorial/types';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';

export function generateStaticParams() {
  return TUTORIALS.map((t) => ({ id: t.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const tutorial = getTutorialById(id);
  if (!tutorial) return { title: 'Not Found | ArchFlow' };

  const keywords = [
    `how to design ${tutorial.title} architecture`,
    `${tutorial.title} system design`,
    ...tutorial.tags,
    'system design',
    'architecture diagram',
    'ArchFlow',
  ].join(', ');

  return {
    title: `How to Design ${tutorial.title} Architecture | ArchFlow`,
    description: tutorial.description,
    keywords,
    openGraph: {
      title: `How to Design ${tutorial.title} Architecture | ArchFlow`,
      description: tutorial.description,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `How to Design ${tutorial.title} Architecture | ArchFlow`,
      description: tutorial.description,
    },
  };
}

export default async function LearnPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tutorial = getTutorialById(id);
  if (!tutorial) notFound();

  // Extract company name from title (strip "How to Design " prefix if present)
  const companyName = tutorial.title.replace(/^How to Design\s+/i, '').replace(/\s+Architecture$/i, '');

  // Get steps array — leveled tutorials have levels[].steps, others have steps directly
  const isLeveled = isLeveledTutorial(tutorial.id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allSteps: any[] = isLeveled
    ? (tutorial as Tutorial).levels?.flatMap((l: { steps: unknown[] }) => l.steps) ?? []
    : (tutorial as TutorialData).steps ?? [];

  // Compute stepCount and nodeCount for canonical Tutorial type
  const stepCount = isLeveled
    ? (tutorial as Tutorial).levels?.reduce((sum: number, l: { steps: unknown[] }) => sum + l.steps.length, 0) ?? 0
    : (tutorial as TutorialData).stepCount ?? 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nodeCount = allSteps.reduce((sum: number, s: { requiredNodes?: unknown[] }) => sum + (s.requiredNodes?.length ?? 0), 0) || ((tutorial as TutorialData).nodeCount ?? 0);

  // JSON-LD: HowTo structured data (Task 6)
  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `How to Design ${tutorial.title}`,
    description: tutorial.description,
    step: allSteps.map((step: { title: string; explanation: string }) => ({
      '@type': 'HowToStep',
      name: step.title,
      text: step.explanation,
    })),
  };

  // JSON-LD: BreadcrumbList structured data (Task 7)
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://archflow.app' },
      { '@type': 'ListItem', position: 2, name: 'Tutorials', item: 'https://archflow.app/tutorials' },
      { '@type': 'ListItem', position: 3, name: tutorial.title, item: `https://archflow.app/learn/${tutorial.id}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div style={{ background: '#080c14', color: '#f1f5f9', minHeight: '100vh' }}>
        <Navbar />

        <main className="pt-24 pb-24">
          <div className="max-w-3xl mx-auto px-6">

            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm mb-10" aria-label="Breadcrumb">
              <Link href="/" className="text-slate-500 hover:text-slate-300 transition-colors">Home</Link>
              <span className="text-slate-700">/</span>
              <Link href="/tutorials" className="text-slate-500 hover:text-slate-300 transition-colors">Tutorials</Link>
              <span className="text-slate-700">/</span>
              <span className="text-slate-400">{tutorial.title}</span>
            </nav>

            {/* Meta badges */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span
                className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}
              >
                {tutorial.difficulty}
              </span>
              <span className="text-xs text-slate-500">{tutorial.category}</span>
              <span className="text-xs text-slate-500">·</span>
              <span className="text-xs text-slate-500">{tutorial.estimatedTime}</span>
              <span className="text-xs text-slate-500">·</span>
              <span className="text-xs text-slate-500">{stepCount} steps</span>
            </div>

            {/* H1 */}
            <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
              How to Design {companyName} Architecture
            </h1>

            {/* Intro */}
            <p className="text-lg text-slate-400 leading-relaxed mb-8">
              {tutorial.description} In this guide, you&apos;ll walk through each component of the system,
              understand why it exists, and learn the key architectural decisions that make it work at scale.
            </p>

            {/* CTA */}
            <div className="mb-12 p-5 rounded-2xl" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <p className="text-sm text-slate-300 mb-3">
                Want to build this architecture yourself? Try the interactive tutorial and place each component on a live canvas.
              </p>
              <Link
                href={`/tutorials/${tutorial.id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-medium transition-colors"
                style={{ background: '#4f46e5' }}
              >
                Try the interactive tutorial →
              </Link>
            </div>

            {/* Architecture Overview */}
            <h2 className="text-2xl font-bold text-white mb-4">The Architecture Overview</h2>
            <p className="text-slate-400 leading-relaxed mb-12">
              The {companyName} architecture is a {tutorial.difficulty.toLowerCase()}-level distributed system
              built around {nodeCount} core components. It covers {(tutorial.tags as string[]).join(', ')}, and is
              designed to handle real-world scale. The sections below break down each component and explain
              how they connect.
            </p>

            {/* Components */}
            <h2 className="text-2xl font-bold text-white mb-8">Components of {companyName} Architecture</h2>

            <div className="flex flex-col gap-10 mb-16">
              {allSteps.map((step: { id: number; title: string; explanation: string; why: string; messages: Array<{ type: string; content: string }> }) => (
                <div key={step.id}>
                  <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
                  <p className="text-slate-400 leading-relaxed mb-3">{step.explanation}</p>
                  <p className="text-slate-400 leading-relaxed mb-3">{step.why}</p>
                  <div
                    className="text-sm px-4 py-3 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#94a3b8' }}
                  >
                    <span className="font-medium text-indigo-400">Key insight:</span>{' '}
                    {step.messages.find((m: { type: string; content: string }) => m.type === 'guide')?.content ?? step.explanation}
                  </div>
                </div>
              ))}
            </div>

            {/* Key Architectural Decisions */}
            <h2 className="text-2xl font-bold text-white mb-5">Key Architectural Decisions</h2>
            <ul className="flex flex-col gap-3 mb-16 list-none pl-0">
              {tutorial.tags.map((tag: string) => (
                <li key={tag} className="flex items-start gap-3 text-slate-400">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                  <span>{tag} is a core part of the {companyName} architecture, enabling the system to scale and remain resilient.</span>
                </li>
              ))}
            </ul>

            {/* Build it yourself */}
            <h2 className="text-2xl font-bold text-white mb-4">Build This Architecture Yourself</h2>
            <p className="text-slate-400 leading-relaxed mb-8">
              Reading about architecture is one thing — building it is another. ArchFlow&apos;s interactive
              tutorial walks you through placing each component on a canvas, connecting them, and validating
              your design step by step. It&apos;s the fastest way to internalize how {companyName} actually works.
            </p>

            <Link
              href={`/tutorials/${tutorial.id}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-base transition-colors"
              style={{ background: '#4f46e5' }}
            >
              Start Interactive Tutorial →
            </Link>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
