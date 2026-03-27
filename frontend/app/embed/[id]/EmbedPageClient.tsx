'use client';

import { useEffect, useState, Suspense } from 'react';
import { EmbedCanvasViewer } from '@/components/embed/EmbedCanvasViewer';
import type { Node, Edge } from 'reactflow';

interface DiagramData {
  id: string;
  canvas_name: string;
  nodes: Node[];
  edges: Edge[];
}

interface EmbedPageClientProps {
  id: string;
  searchParams: { [key: string]: string | string[] | undefined };
}

function EmbedContent({ id, searchParams }: EmbedPageClientProps) {
  const [diagram, setDiagram] = useState<DiagramData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const theme = searchParams.theme === 'light' ? 'light' : 'dark';
  const zoom = parseFloat(String(searchParams.zoom || '1'));
  const showControls = searchParams.controls !== 'false';
  const pathType = (searchParams.path as 'smooth' | 'step' | 'straight' | 'bezier') || 'smooth';

  useEffect(() => {
    async function fetchDiagram() {
      try {
        const response = await fetch(`/api/embed/${id}`);
        if (!response.ok) {
          setError(response.status === 404 ? 'not_found' : 'failed');
          return;
        }
        const data = await response.json();
        setDiagram(data);
      } catch {
        setError('failed');
      } finally {
        setLoading(false);
      }
    }

    fetchDiagram();
  }, [id]);

  if (loading) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          background: theme === 'dark' ? '#0f172a' : '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            border: '3px solid transparent',
            borderTopColor: '#6366f1',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error === 'not_found') {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          background: theme === 'dark' ? '#0f172a' : '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>📊</div>
          <p style={{ color: theme === 'dark' ? '#f1f5f9' : '#1e293b', fontSize: 18, fontWeight: 600 }}>
            Diagram not found
          </p>
          <p style={{ color: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 14, marginTop: 8 }}>
            This diagram may have been deleted or the link is invalid.
          </p>
        </div>
      </div>
    );
  }

  if (error === 'failed' || !diagram) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          background: theme === 'dark' ? '#0f172a' : '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: theme === 'dark' ? '#f1f5f9' : '#1e293b', fontSize: 18, fontWeight: 600 }}>
            Failed to load diagram
          </p>
          <p style={{ color: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 14, marginTop: 8 }}>
            Please try refreshing the page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <EmbedCanvasViewer
      nodes={diagram.nodes}
      edges={diagram.edges}
      theme={theme}
      zoom={zoom}
      showControls={showControls}
      pathType={pathType}
    />
  );
}

export default function EmbedPageClient({ id, searchParams }: EmbedPageClientProps) {
  return (
    <Suspense
      fallback={
        <div
          style={{
            width: '100vw',
            height: '100vh',
            background: '#0f172a',
          }}
        />
      }
    >
      <EmbedContent id={id} searchParams={searchParams} />
    </Suspense>
  );
}
