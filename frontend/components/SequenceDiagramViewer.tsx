'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import mermaid from 'mermaid';
import { useDiagramStore } from '@/store/diagramStore';
import logger from '@/lib/logger';

mermaid.initialize({
  startOnLoad: false,
  theme: 'neutral',
  securityLevel: 'loose',
  sequence: {
    actorMargin: 50,
    boxMargin: 10,
    boxTextMargin: 5,
    noteMargin: 10,
    messageMargin: 35,
  },
});

export function SequenceDiagramViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');
  const activeCanvasId = useDiagramStore((s) => s.activeCanvasId);
  const sequenceDiagrams = useDiagramStore((s) => s.sequenceDiagrams);

  const diagram = useMemo(() => 
    sequenceDiagrams[activeCanvasId],
    [sequenceDiagrams, activeCanvasId]
  );

  useEffect(() => {
    if (!diagram?.mermaidSyntax || !containerRef.current) {
      setSvg('');
      return;
    }

    let cancelled = false;

    const renderDiagram = async () => {
      try {
        const id = `mermaid-${Date.now().toString(36)}`;
        const { svg: rendered } = await mermaid.render(id, diagram.mermaidSyntax);
        if (!cancelled) {
          setSvg(rendered);
          setError('');
        }
      } catch (err) {
        logger.error('Mermaid render error:', err);
        if (!cancelled) {
          setError('Failed to render sequence diagram');
          setSvg('');
        }
      }
    };

    renderDiagram();
    return () => { cancelled = true; };
  }, [diagram?.mermaidSyntax]);

  if (!diagram) {
    return (
      <div className="flex-1 flex items-center justify-center bg-canvas-bg">
        <p className="text-muted-foreground text-sm italic">No sequence diagram available for this canvas.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-canvas-bg">
        <div className="text-center p-8 max-w-2xl">
          <p className="text-red-500 font-medium mb-4">{error}</p>
          <div className="text-left bg-gray-900 text-gray-300 p-6 rounded-xl overflow-auto text-[11px] font-mono leading-relaxed border border-white/10 shadow-2xl">
            <pre>{diagram.mermaidSyntax}</pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-canvas-bg overflow-auto p-8">
      <div 
        ref={containerRef}
        className="max-w-full bg-white p-10 rounded-2xl shadow-xl border border-gray-100"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
}
