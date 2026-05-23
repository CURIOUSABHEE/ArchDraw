'use client';

import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useDiagramStore } from '@/store/diagramStore';
import { NewCanvasBanner } from '@/components/dashboard/NewCanvasBanner';
import { NewCanvasCard } from '@/components/dashboard/NewCanvasCard';
import { TemplatePreviewCard } from '@/components/dashboard/TemplatePreviewCard';
import { CanvasCard } from '@/components/dashboard/CanvasCard';
import { getLayoutedElements } from '@/lib/layoutUtils';
import type { Template } from '@/data/templates';

interface DashboardClientProps {
  templates: Template[];
  aiPrompts: string[];
}

export function DashboardClient({ templates, aiPrompts }: DashboardClientProps) {
  const router = useRouter();
  const { initialized } = useAuthStore();
  const [layoutedTemplates, setLayoutedTemplates] = useState<Template[]>(templates);
  const {
    canvases,
    addCanvas,
    switchCanvas,
  } = useDiagramStore();

  useEffect(() => {
    // Process templates layout asynchronously to prevent UI freeze
    const layoutTemplatesAsync = async () => {
      // Use setTimeout to yield to the main thread
      await new Promise(resolve => setTimeout(resolve, 50));
      const processed = templates.map((template) => {
        // If it already has positions, getLayoutedElements will just re-layout them,
        // but wait, let's only layout if they have {x:0, y:0} or just run it.
        const { nodes, edges } = getLayoutedElements(template.nodes, template.edges, 'LR');
        return { ...template, nodes, edges };
      });
      setLayoutedTemplates(processed);
    };
    layoutTemplatesAsync();
  }, [templates]);

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

  const handleUseTemplate = (templateId: string) => {
    if (templateId === 'blank') {
      handleNewCanvas();
    } else {
      router.push(`/editor?template=${templateId}`);
    }
  };

  const showBanner = canvases.length <= 1;

  if (!initialized) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">
          Your Work
          </h2>
          <span className="hidden sm:inline text-xs font-medium text-[hsl(var(--muted-foreground))]">
            {canvases.length} saved canvases
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {/* New Canvas Card - always first in grid */}
          <NewCanvasCard
            onClick={() => handleNewCanvas()}
            onTemplate={() => handleUseTemplate('blank')}
            onAI={() => {}}
          />

          {/* Canvas Cards */}
          {Array.from(new Map(canvases.map(c => [c.id, c])).values())
            .sort((a, b) => {
              const aTime = a.lastAccessedAt || a.updatedAt || 0;
              const bTime = b.lastAccessedAt || b.updatedAt || 0;
              return bTime - aTime;
            })
            .map((canvas) => (
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
          {layoutedTemplates.map((template) => (
            <div key={template.id} className="flex-shrink-0 w-64">
              <TemplatePreviewCard
                title={template.name}
                description={template.description}
                techTags={template.tags}
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
          {aiPrompts.map((prompt) => (
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
  );
}
