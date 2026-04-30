'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useDiagramStore } from '@/store/diagramStore';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { NewCanvasBanner } from '@/components/dashboard/NewCanvasBanner';
import { NewCanvasCard } from '@/components/dashboard/NewCanvasCard';
import { TemplatePreviewCard } from '@/components/dashboard/TemplatePreviewCard';
import { CanvasCard } from '@/components/dashboard/CanvasCard';

const quickStartTemplates = [
  {
    id: 'microservices',
    title: 'Microservices',
    description: 'Distributed system architecture',
    techTags: ['Docker', 'K8s', 'API'],
    nodes: [],
    edges: [],
  },
  {
    id: 'ml-pipeline',
    title: 'ML Pipeline',
    description: 'Machine learning workflow',
    techTags: ['Python', 'TensorFlow'],
    nodes: [],
    edges: [],
  },
  {
    id: 'saas',
    title: 'SaaS Platform',
    description: 'Multi-tenant architecture',
    techTags: ['React', 'Node.js'],
    nodes: [],
    edges: [],
  },
  {
    id: 'e-commerce',
    title: 'E-commerce',
    description: 'Online store system',
    techTags: ['Shopify', 'Stripe'],
    nodes: [],
    edges: [],
  },
  {
    id: 'chatapp',
    title: 'Chat App',
    description: 'Real-time messaging',
    techTags: ['WebSocket', 'Redis'],
    nodes: [],
    edges: [],
  },
];

const aiPrompts = [
  'E-commerce System',
  'Real-time Chat',
  'SaaS Platform',
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, initialized } = useAuthStore();
  const {
    canvases,
    addCanvas,
    removeCanvas,
    switchCanvas,
  } = useDiagramStore();

  useEffect(() => {
    if (initialized && !user) {
      router.push('/');
    }
  }, [initialized, user, router]);

  const handleNewCanvas = (fromTemplate?: string) => {
    if (fromTemplate) {
      router.push(`/editor?template=${fromTemplate}`);
    } else {
      addCanvas();
      router.push('/editor');
    }
  };

  const handleOpenCanvas = (id: string) => {
    switchCanvas(id);
    router.push('/editor');
  };

  const handleDeleteCanvas = (id: string) => {
    if (canvases.length > 1) {
      removeCanvas(id);
    }
  };

  const handleDuplicateCanvas = (id: string) => {
    const { duplicateCanvas } = useDiagramStore.getState();
    duplicateCanvas?.(id);
  };

  const handleUseTemplate = (templateId: string) => {
    if (templateId === 'blank') {
      handleNewCanvas();
    } else {
      router.push(`/editor?template=${templateId}`);
    }
  };

  const showBanner = canvases.length <= 1;

  return (
    <DashboardShell activePage="Dashboard">
      <div className="space-y-8">
        {/* New Canvas Banner - only shown when canvases <= 1 */}
        {showBanner && (
          <NewCanvasBanner
            onFromScratch={() => handleNewCanvas()}
            onFromTemplate={() => handleUseTemplate('blank')}
            onAIGenerate={() => {}}
          />
        )}

        {/* Your Work Section */}
        <div>
          <h2 className="text-lg font-semibold text-[#1A1A1A] dark:text-white mb-4">
            Your Work
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* New Canvas Card - always first in grid */}
            <NewCanvasCard
              onClick={() => handleNewCanvas()}
              onTemplate={() => handleUseTemplate('blank')}
              onAI={() => {}}
            />

            {/* Canvas Cards */}
            {canvases.map((canvas) => (
              <CanvasCard
                key={canvas.id}
                id={canvas.id}
                name={canvas.name}
                nodes={canvas.nodes}
                edges={canvas.edges}
                updatedAt={canvas.updatedAt}
                isPinned={canvas.isPinned}
                isFavorite={canvas.isFavorite}
                onClick={() => handleOpenCanvas(canvas.id)}
              />
            ))}
          </div>
        </div>

        {/* Architecture Templates Section */}
        <div>
          <h2 className="text-lg font-semibold text-[#1A1A1A] dark:text-white mb-4">
            Architecture Templates
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-2 px-1 -mx-1" style={{ scrollbarWidth: 'none' }}>
            {quickStartTemplates.map((template) => (
              <div key={template.id} className="flex-shrink-0 w-64">
                <TemplatePreviewCard
                  title={template.title}
                  description={template.description}
                  techTags={template.techTags}
                  nodes={template.nodes}
                  edges={template.edges}
                  onClick={() => handleUseTemplate(template.id)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* AI Quick Start Section */}
        <div>
          <h2 className="text-lg font-semibold text-[#1A1A1A] dark:text-white mb-4">
            AI Quick Start
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-[#6B6B6B] dark:text-gray-400">
              Try:
            </span>
            {aiPrompts.map((prompt, index) => (
              <button
                key={prompt}
                onClick={() => {}}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'hsl(var(--card))',
                  boxShadow: '0 2px 8px hsl(var(--foreground) / 0.06)',
                }}
              >
                <Sparkles className="w-3 h-3" />
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
