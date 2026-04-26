'use client';

import { useMemo, useCallback, useEffect } from 'react';
import ReactFlow, {
  Background, BackgroundVariant, Controls, MiniMap, ReactFlowProvider,
  useNodesState, useEdgesState, ConnectionLineType,
  Node, Edge, OnNodesChange, OnEdgesChange,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ExternalLink, Download } from 'lucide-react';
import { SystemNode } from '@/components/SystemNode';
import { ShapeNode } from '@/components/ShapeNode';
import { GroupNode } from '@/components/GroupNode';
import { TextLabelNode } from '@/components/TextLabelNode';
import { AnnotationNode } from '@/components/AnnotationNode';
import { MessageBrokerNode } from '@/components/MessageBrokerNode';
import { BaseNode, DatabaseNode, CacheNode } from '@/components/nodes';
import { FlowEdge } from '@/components/edges/FlowEdge';
import { useTheme } from '@/lib/theme';

const NODE_TYPES = {
  systemNode: SystemNode,
  architectureNode: SystemNode,
  baseNode: BaseNode,
  databaseNode: DatabaseNode,
  cacheNode: CacheNode,
  shapeNode: ShapeNode,
  groupNode: GroupNode,
  group: GroupNode,
  textLabelNode: TextLabelNode,
  annotationNode: AnnotationNode,
  messageBrokerNode: MessageBrokerNode,
};

const EDGE_TYPES = { custom: FlowEdge };

export interface DiagramData {
  nodes: Node[];
  edges: Edge[];
  sessionId?: string;
  diagramUrl?: string;
  label?: string;
}

interface InlineDiagramProps {
  data: DiagramData;
  onOpenFullEditor?: () => void;
  height?: number;
}

export function InlineDiagram({ data, onOpenFullEditor, height = 400 }: InlineDiagramProps) {
  const { isDark } = useTheme();
  
  const [nodes, setNodes, onNodesChange] = useNodesState(data.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(data.edges);

  useEffect(() => {
    setNodes(data.nodes);
  }, [data.nodes, setNodes]);

  useEffect(() => {
    setEdges(data.edges);
  }, [data.edges, setEdges]);

  const defaultEdgeOptions = useMemo(() => ({
    type: 'custom',
    data: { edgeType: 'sync', pathType: 'smooth' },
  }), []);

  const handleOpenEditor = useCallback(() => {
    if (onOpenFullEditor) {
      onOpenFullEditor();
    } else if (data.sessionId) {
      window.open(`/editor?session=${data.sessionId}`, '_blank');
    } else if (data.diagramUrl) {
      window.open(data.diagramUrl, '_blank');
    }
  }, [data.sessionId, data.diagramUrl, onOpenFullEditor]);

  return (
    <div className="relative rounded-lg overflow-hidden border border-border/50 bg-background">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={true}
        zoomOnScroll={true}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        proOptions={{ hideAttribution: true }}
        connectionLineType={ConnectionLineType.SmoothStep}
        defaultEdgeOptions={defaultEdgeOptions}
        minZoom={0.1}
        maxZoom={2}
        style={{ height }}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1} 
          color={isDark ? 'rgba(100, 120, 150, 0.15)' : 'rgba(180, 190, 200, 0.3)'} 
        />
        <Controls 
          showInteractive={false} 
          className="!bg-card/90 !border !border-border/60 !rounded-lg !w-6" 
          style={{ width: 28 }}
        />
        <MiniMap 
          zoomable 
          pannable 
          className="!bg-card/90 !border !border-border/60 !rounded-lg !w-24 !h-16" 
          maskColor={isDark ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.02)'}
          nodeColor={(node) => (node.data?.tierColor ?? '#6366f1')}
        />
      </ReactFlow>

      <div className="absolute bottom-3 right-3 flex items-center gap-2">
        {data.sessionId && (
          <button
            onClick={handleOpenEditor}
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-lg"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open in Editor
          </button>
        )}
        {data.sessionId && (
          <a
            href={`/api/diagram/session/${data.sessionId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md bg-white/10 hover:bg-white/15 text-white/80 hover:text-white transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            JSON
          </a>
        )}
      </div>
    </div>
  );
}

interface InlineDiagramRendererProps {
  content: string;
  onNavigateToEditor?: (sessionId: string) => void;
}

export function InlineDiagramRenderer({ content, onNavigateToEditor }: InlineDiagramRendererProps) {
  const { isDark } = useTheme();
  
  const diagramData = useMemo(() => {
    try {
      const jsonMatch = content.match(/\{[\s\S]*"nodes":\s*\[[\s\S]*\][\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.nodes && Array.isArray(parsed.nodes) && parsed.nodes.length > 0) {
          const edges = parsed.edges || [];
          const nodes = parsed.nodes.map((n: Record<string, unknown>) => ({
            ...n,
            type: (n.type as string) || 'systemNode',
          }));
          const edgeData = edges.map((e: Record<string, unknown>) => ({
            ...e,
            type: 'custom',
          }));
          
          return {
            nodes,
            edges: edgeData,
            sessionId: parsed.sessionId as string | undefined,
            diagramUrl: parsed.diagramUrl as string | undefined,
            label: parsed.label as string | undefined,
          } as DiagramData;
        }
      }
    } catch (e) {
      // Not valid JSON, ignore
    }
    return null;
  }, [content]);

  if (!diagramData) {
    return null;
  }

  const handleOpenEditor = () => {
    if (diagramData.sessionId && onNavigateToEditor) {
      onNavigateToEditor(diagramData.sessionId);
    } else if (diagramData.sessionId) {
      window.location.href = `/editor?session=${diagramData.sessionId}`;
    }
  };

  return (
    <div className="my-3">
      {diagramData.label && (
        <p className="text-xs text-muted-foreground mb-1.5">{diagramData.label}</p>
      )}
      <InlineDiagram 
        data={diagramData} 
        onOpenFullEditor={handleOpenEditor}
        height={350}
      />
    </div>
  );
}
