'use client';

import ReactFlow, {
  Background, BackgroundVariant, Controls, MiniMap,
  useReactFlow, ReactFlowProvider,
  NodeMouseHandler, EdgeMouseHandler, NodeDragHandler,
  SelectionMode, ConnectionLineType, MarkerType,
  type OnSelectionChangeParams,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useDiagramStore, registerFitViewCallback } from '@/store/diagramStore';
import { SystemNode } from '@/components/SystemNode';
import { ShapeNode } from '@/components/ShapeNode';
import { GroupNode } from '@/components/GroupNode';
import { TextLabelNode } from '@/components/TextLabelNode';
import { AnnotationNode } from '@/components/AnnotationNode';
import { GuideLines } from '@/components/GuideLines';
import { ContextMenu, type ContextMenuState } from '@/components/ContextMenu';
import { useSnapping } from '@/hooks/useSnapping';
import { useCallback, useEffect, useRef, DragEvent, useState, Fragment } from 'react';
import { EdgeLabelRenderer, type ReactFlowInstance } from 'reactflow';
import { LayoutGrid, Sparkles, LayoutTemplate, MousePointer2 } from 'lucide-react';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';
import { FlowEdge } from '@/components/edges/FlowEdge';
import { EdgeLegend } from '@/components/edges/EdgeLegend';
import { EDGE_TYPE_CONFIGS, EdgeType } from '@/data/edgeTypes';
import { useTheme } from 'next-themes';
import { TemplateModal } from '@/components/TemplateModal';

// Module-level ref so the store can call fitView without hooks
export const reactFlowRef: { instance: ReactFlowInstance | null } = { instance: null };

const NODE_TYPES = {
  systemNode:     SystemNode,
  shapeNode:      ShapeNode,
  groupNode:      GroupNode,
  textLabelNode:  TextLabelNode,
  annotationNode: AnnotationNode,
};

const EDGE_TYPES = {
  custom: FlowEdge,
};

function CanvasInner() {
  const {
    nodes, edges, onNodesChange, onEdgesChange, onConnect,
    setSelectedNodeId, setSelectedNodeIds, setSelectedEdgeId,
    showGrid,
    pendingLabelEdgeId, setPendingLabelEdgeId, updateEdgeData,
  } = useDiagramStore();
  const { resolvedTheme } = useTheme();

  const reactFlowInstance = useReactFlow();
  const { onNodeDrag, onNodeDragStop: onNodeDragStopSnap } = useSnapping();
  const [labelDraft, setLabelDraft] = useState('');
  const labelInputRef = useRef<HTMLInputElement>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);

  // Keep module ref in sync so store.fitView() can call it directly
  useEffect(() => {
    reactFlowRef.instance = reactFlowInstance;
    registerFitViewCallback((opts) => reactFlowInstance.fitView(opts));
    return () => {
      reactFlowRef.instance = null;
    };
  }, [reactFlowInstance]);

  // Cmd+D / Ctrl+D — duplicate selected nodes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // ? key — toggle shortcuts modal
      if (e.key === '?' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        setShowShortcuts((v) => !v);
        return;
      }
      if (!(e.metaKey || e.ctrlKey) || e.key !== 'd') return;
      const active = document.activeElement;
      if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return;
      e.preventDefault();

      const store = useDiagramStore.getState();
      const selected = store.nodes.filter((n) => n.selected);
      if (!selected.length) return;

      store.pushHistory();

      const duplicates = selected.map((n) => ({
        ...n,
        id: crypto.randomUUID(),
        position: { x: n.position.x + 40, y: n.position.y + 40 },
        selected: true,
        data: { ...n.data },
      }));

      const deselectedOriginals = store.nodes.map((n) =>
        n.selected ? { ...n, selected: false } : n
      );

      store.importDiagram([...deselectedOriginals, ...duplicates], store.edges);
      setSelectedNodeIds(duplicates.map((d) => d.id));
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setSelectedNodeIds]);

  // Focus label input when a new edge is drawn
  useEffect(() => {
    if (pendingLabelEdgeId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLabelDraft('');
      requestAnimationFrame(() => labelInputRef.current?.focus());
    }
  }, [pendingLabelEdgeId]);

  const commitEdgeLabel = useCallback(() => {
    if (pendingLabelEdgeId) {
      if (labelDraft.trim()) updateEdgeData(pendingLabelEdgeId, { label: labelDraft.trim() });
      setPendingLabelEdgeId(null);
    }
  }, [pendingLabelEdgeId, labelDraft, updateEdgeData, setPendingLabelEdgeId]);

  const dismissEdgeLabel = useCallback(() => {
    setPendingLabelEdgeId(null);
    setLabelDraft('');
  }, [setPendingLabelEdgeId]);


  const onNodeDragStop: NodeDragHandler = useCallback((_e, node) => {
    onNodeDragStopSnap(_e, node, reactFlowInstance.getNodes());
    useDiagramStore.getState().pushHistory();
  }, [onNodeDragStopSnap, reactFlowInstance]);

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('application/archdraw');
    if (!raw) return;
    const comp = JSON.parse(raw);
    const position = reactFlowInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY });
    const id = `${comp.id}-${Date.now()}`;
    const store = useDiagramStore.getState();
    store.importDiagram([...store.nodes, {
      id, type: 'systemNode', position,
      data: { label: comp.label, category: comp.category, color: comp.color, icon: comp.icon, technology: comp.technology },
    }], store.edges);
  }, [reactFlowInstance]);

  const onNodeClick: NodeMouseHandler = useCallback((_e, node) => {
    setSelectedNodeId(node.id);
    setSelectedEdgeId(null);
  }, [setSelectedNodeId, setSelectedEdgeId]);

  const onEdgeClick: EdgeMouseHandler = useCallback((_e, edge) => {
    const { editingEdgeId, pendingEditEdgeId } = useDiagramStore.getState();
    if (editingEdgeId === edge.id || pendingEditEdgeId === edge.id) return;
    useDiagramStore.getState().setSelectedEdgeId(edge.id);
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  const onEdgeDoubleClick: EdgeMouseHandler = useCallback((_e, edge) => {
    setPendingLabelEdgeId(edge.id);
  }, [setPendingLabelEdgeId]);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    useDiagramStore.getState().setEditingEdgeId(null);
    useDiagramStore.getState().setPendingEditEdgeId(null);
    dismissEdgeLabel();
    setContextMenu(null);
  }, [setSelectedNodeId, setSelectedEdgeId, dismissEdgeLabel]);

  const onSelectionChange = useCallback(({ nodes: sel }: OnSelectionChangeParams) => {
    setSelectedNodeIds(sel.map((n) => n.id));
  }, [setSelectedNodeIds]);

  const onPaneContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const onNodeContextMenu: NodeMouseHandler = useCallback((e, node) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId: node.id });
  }, []);

  return (
    <div className="flex-1 relative overflow-hidden">
      {/* Canvas background with radial gradient */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: resolvedTheme === 'dark'
            ? 'radial-gradient(ellipse at center, rgba(30, 41, 59, 0.3) 0%, rgba(15, 23, 42, 1) 70%)'
            : 'radial-gradient(ellipse at center, rgba(241, 245, 249, 0.5) 0%, rgba(248, 250, 252, 1) 70%)',
        }}
      />
      {/* Vignette overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: resolvedTheme === 'dark'
            ? 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.15) 100%)'
            : 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.02) 100%)',
        }}
      />
      <div className="absolute inset-0 bg-background">
        <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onEdgeDoubleClick={onEdgeDoubleClick}
        onPaneClick={onPaneClick}
        onPaneContextMenu={onPaneContextMenu}
        onNodeContextMenu={onNodeContextMenu}
        onSelectionChange={onSelectionChange}
        selectionMode={SelectionMode.Partial}
        snapToGrid
        snapGrid={[20, 20]}
        minZoom={0.1}
        maxZoom={2}
        fitView
        elevateEdgesOnSelect={true}
        proOptions={{ hideAttribution: true }}
        connectionLineType={ConnectionLineType.SmoothStep}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: {
            stroke: '#94a3b8',
            strokeWidth: 1.5,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#94a3b8',
          },
        }}
      >
        <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
          <defs>
            {Object.values(EDGE_TYPE_CONFIGS).map((cfg) => (
              <Fragment key={cfg.id}>
                <marker id={`marker-${cfg.id}-end`} markerWidth="7" markerHeight="7" refX="6" refY="2.5" orient="auto" markerUnits="strokeWidth">
                  <path d="M0,0 L0,5 L6,2.5 z" fill={cfg.color} />
                </marker>
                {cfg.markerStart && (
                  <marker id={`marker-${cfg.id}-start`} markerWidth="7" markerHeight="7" refX="0" refY="2.5" orient="auto-start-reverse" markerUnits="strokeWidth">
                    <path d="M0,0 L0,5 L6,2.5 z" fill={cfg.color} />
                  </marker>
                )}
              </Fragment>
            ))}
            <style>{`
              @keyframes edgeDash { to { stroke-dashoffset: -20; } }
            `}</style>
          </defs>
        </svg>
        {showGrid && (
          <Background
            variant={BackgroundVariant.Dots}
            color={resolvedTheme === 'dark' ? '#1e293b' : '#cbd5e1'}
            gap={20}
            size={1.5}
          />
        )}
        <Controls
          showInteractive={false}
          className="!bg-card/90 !backdrop-blur-sm !border !border-border/60 !rounded-lg !shadow-md [&>button]:!border-0 [&>button]:!border-b [&>button]:!border-border/40 [&>button:hover]:!bg-accent"
        />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          className="!bg-card/90 !backdrop-blur-sm !border !border-border/60 !rounded-lg !shadow-md"
          maskColor="rgba(0,0,0,0.04)"
        />

        {/* Floating label prompt after double-clicking an edge */}
        {pendingLabelEdgeId && (() => {
          const edge = edges.find((e) => e.id === pendingLabelEdgeId);
          const srcNode = edge ? nodes.find((n) => n.id === edge.source) : null;
          const tgtNode = edge ? nodes.find((n) => n.id === edge.target) : null;
          const midX = srcNode && tgtNode
            ? (srcNode.position.x + (srcNode.width ?? 140) / 2 + tgtNode.position.x + (tgtNode.width ?? 140) / 2) / 2
            : 400;
          const midY = srcNode && tgtNode
            ? (srcNode.position.y + (srcNode.height ?? 80) / 2 + tgtNode.position.y + (tgtNode.height ?? 80) / 2) / 2
            : 300;
          return (
            <EdgeLabelRenderer>
              <div
                className="nodrag nopan"
                style={{
                  position: 'absolute',
                  transform: `translate(-50%, -50%) translate(${midX}px, ${midY}px)`,
                  pointerEvents: 'all',
                  zIndex: 1000,
                }}
              >
                <input
                  ref={labelInputRef}
                  value={labelDraft}
                  onChange={(e) => setLabelDraft(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter') { e.preventDefault(); commitEdgeLabel(); }
                    if (e.key === 'Escape') dismissEdgeLabel();
                  }}
                  onBlur={commitEdgeLabel}
                  placeholder="Label"
                  autoFocus
                  style={{
                    width: 100,
                    background: resolvedTheme === 'dark' ? '#1e293b' : '#ffffff',
                    border: resolvedTheme === 'dark' ? '1px solid #475569' : '1px solid #cbd5e1',
                    borderRadius: 9999,
                    padding: '2px 10px',
                    fontSize: 10,
                    fontFamily: 'system-ui, sans-serif',
                    color: resolvedTheme === 'dark' ? '#f1f5f9' : '#1e293b',
                    outline: 'none',
                    textAlign: 'center',
                    boxShadow: resolvedTheme === 'dark' ? '0 1px 4px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.1)',
                  }}
                />
              </div>
            </EdgeLabelRenderer>
          );
        })()}
      </ReactFlow>
      </div>

      <GuideLines />
      <EdgeLegend />

      {contextMenu && (
        <ContextMenu menu={contextMenu} onClose={() => setContextMenu(null)} />
      )}

      {nodes.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
          <div className="text-center mb-8">
            <LayoutGrid className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h2 className="text-lg font-semibold text-foreground/60 mb-2">Start building your architecture</h2>
            <p className="text-xs text-muted-foreground/50">Choose how you want to begin</p>
          </div>
          
          <div className="flex items-center gap-3 pointer-events-auto">
            {/* AI Generate - Primary */}
            <button
              onClick={() => {/* TODO: open AI panel */}}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)',
                boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
              }}
            >
              <Sparkles className="w-4 h-4" />
              Generate with AI
            </button>
            
            {/* Templates - Secondary */}
            <button
              onClick={() => setTemplatesOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-accent/60 hover:bg-accent text-foreground border border-border/50 transition-all hover:scale-105 active:scale-95"
            >
              <LayoutTemplate className="w-4 h-4" />
              Use Template
            </button>
            
            {/* Start from Scratch - Ghost */}
            <button
              onClick={() => {/* User can start dragging components */}}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-all"
            >
              <MousePointer2 className="w-4 h-4" />
              Start from Scratch
            </button>
          </div>
          
          <p className="text-[10px] text-muted-foreground/40 mt-6">Press ? for keyboard shortcuts</p>
        </div>
      )}

      {/* Keyboard shortcuts button */}
      <button
        onClick={() => setShowShortcuts(true)}
        className="absolute bottom-4 right-4 z-10 w-7 h-7 rounded-full bg-card/80 border border-border/60 text-muted-foreground hover:text-foreground hover:bg-card transition-colors flex items-center justify-center text-xs font-semibold shadow-sm"
        title="Keyboard shortcuts (?)"
      >
        ?
      </button>

      {showShortcuts && <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />}
      {templatesOpen && <TemplateModal onClose={() => setTemplatesOpen(false)} />}
    </div>
  );
}

export function Canvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}
