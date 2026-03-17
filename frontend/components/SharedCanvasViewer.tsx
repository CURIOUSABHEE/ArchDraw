'use client';

import { useState } from 'react';
import ReactFlow, {
  Background, BackgroundVariant, Controls, MiniMap, ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Download } from 'lucide-react';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';
import { SystemNode } from '@/components/SystemNode';
import { ShapeNode } from '@/components/ShapeNode';
import { GroupNode } from '@/components/GroupNode';
import { TextLabelNode } from '@/components/TextLabelNode';
import { AnnotationNode } from '@/components/AnnotationNode';
import { CustomBezierEdge } from '@/components/edges/CustomBezierEdge';
import { EmailCaptureModal } from '@/components/EmailCaptureModal';

const NODE_TYPES = {
  systemNode:     SystemNode,
  shapeNode:      ShapeNode,
  groupNode:      GroupNode,
  textLabelNode:  TextLabelNode,
  annotationNode: AnnotationNode,
};

const EDGE_TYPES = { default: CustomBezierEdge };

interface SharedCanvas {
  id: string;
  canvas_name: string;
  nodes: unknown[];
  edges: unknown[];
}

function Viewer({ canvas }: { canvas: SharedCanvas }) {
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const doDownload = async () => {
    const el = document.querySelector('.react-flow__viewport') as HTMLElement | null;
    if (!el) return;
    setIsDownloading(true);
    try {
      const dataUrl = await toPng(el, {
        backgroundColor: '#0f172a',
        pixelRatio: 3,
        cacheBust: true,
        filter: (node) => {
          const cls = (node as HTMLElement).classList;
          if (!cls) return true;
          return (
            !cls.contains('react-flow__minimap') &&
            !cls.contains('react-flow__controls') &&
            !cls.contains('react-flow__panel') &&
            !cls.contains('react-flow__background')
          );
        },
      });
      const blob = await (await fetch(dataUrl)).blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${canvas.canvas_name}-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Downloaded!');
      setDownloaded(true);
    } catch {
      toast.error('Download failed');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadClick = () => {
    // Check if dismissed this session
    const dismissed = typeof window !== 'undefined' && sessionStorage.getItem('emailModalDismissed') === 'true';
    if (dismissed) {
      doDownload();
      return;
    }
    setShowEmailCapture(true);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0f172a' }}>
      {/* Top banner */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2.5 bg-[#0f172a]/95 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-md flex items-center justify-center">
            <div className="w-2 h-2 border border-white/80 rounded-sm" />
          </div>
          <span className="text-white font-semibold text-sm">Archflow</span>
          <span className="text-white/30 text-sm">·</span>
          <span className="text-white/60 text-sm truncate max-w-xs">{canvas.canvas_name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white/40 text-xs">View only</span>
          <button
            onClick={handleDownloadClick}
            disabled={isDownloading}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md bg-white/10 hover:bg-white/15 text-white/80 hover:text-white transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            {isDownloading ? 'Downloading…' : 'Download'}
          </button>
          <a
            href="/editor"
            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-md transition-colors font-medium"
          >
            Create your own →
          </a>
        </div>
      </div>

      {/* Downloaded banner */}
      {downloaded && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-4 py-2.5 bg-green-500/15 border border-green-500/30 rounded-lg backdrop-blur-sm">
          <span className="text-green-400 text-xs font-medium">✅ Diagram downloaded!</span>
          <a href="/editor" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors underline underline-offset-2">
            Start designing for free →
          </a>
        </div>
      )}

      {/* Canvas */}
      <ReactFlow
        nodes={canvas.nodes as never[]}
        edges={canvas.edges as never[]}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        panOnDrag={true}
        zoomOnScroll={true}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          type: 'default',
          animated: true,
          style: { strokeWidth: 1.5, stroke: '#94a3b8' },
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} color="#334155" />
        <Controls showInteractive={false} className="!bg-card/90 !border !border-border/60 !rounded-lg" />
        <MiniMap zoomable pannable className="!bg-card/90 !border !border-border/60 !rounded-lg" maskColor="rgba(0,0,0,0.04)" />
      </ReactFlow>

      {showEmailCapture && (
        <EmailCaptureModal
          reason="download"
          onClose={() => {
            setShowEmailCapture(false);
            // After dismissing, allow direct download
            doDownload();
          }}
        />
      )}
    </div>
  );
}

export function SharedCanvasViewer({ canvas }: { canvas: SharedCanvas }) {
  return (
    <ReactFlowProvider>
      <Viewer canvas={canvas} />
    </ReactFlowProvider>
  );
}
