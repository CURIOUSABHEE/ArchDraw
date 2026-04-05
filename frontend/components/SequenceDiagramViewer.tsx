/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { useDiagramStore } from '@/store/diagramStore';

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
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

  const diagram = sequenceDiagrams[activeCanvasId];

  useEffect(() => {
    if (!diagram?.mermaidSyntax || !containerRef.current) {
      setSvg('');
      return;
    }

    let cancelled = false;

    const renderDiagram = async () => {
      try {
        const id = `mermaid-${Date.now()}`;
        const { svg: rendered } = await mermaid.render(id, diagram.mermaidSyntax);
        if (!cancelled) {
          setSvg(rendered);
          setError('');
        }
      } catch (err) {
        console.error('Mermaid render error:', err);
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
    return null;
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-canvas-bg">
        <div className="text-center p-8">
          <p className="text-red-500 mb-2">{error}</p>
          <pre className="text-xs text-gray-500 max-w-2xl overflow-auto p-4 bg-gray-100 rounded">
            {diagram.mermaidSyntax}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-canvas-bg overflow-auto p-4">
      <div 
        ref={containerRef}
        className="max-w-full"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
}
