'use client';

import ReactFlow, {
  Background, BackgroundVariant, Controls, MiniMap,
  useReactFlow, ReactFlowProvider,
  NodeMouseHandler, EdgeMouseHandler, NodeDragHandler,
  SelectionMode, ConnectionLineType,
  type OnSelectionChangeParams,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useDiagramStore, registerFitViewCallback } from '@/store/diagramStore';
import { SystemNode } from '@/components/SystemNode';
import { ShapeNode } from '@/components/ShapeNode';
import { GroupNode } from '@/components/GroupNode';
import { TextLabelNode } from '@/components/TextLabelNode';
import { AnnotationNode } from '@/components/AnnotationNode';
import { MessageBrokerNode } from '@/components/MessageBrokerNode';
import { BaseNode, DatabaseNode, CacheNode } from '@/components/nodes';
import { getNodeShape } from '@/lib/nodeShapes';
import { createNode } from '@/lib/nodeFactory';
import { GuideLines } from '@/components/GuideLines';
import { ContextMenu, type ContextMenuState } from '@/components/ContextMenu';
import { useSnapping } from '@/hooks/useSnapping';
import { useMiddleMousePan } from '@/hooks/useCanvasInteractions';
import { useCallback, useEffect, useRef, DragEvent, useState } from 'react';
import { EdgeLabelRenderer, type ReactFlowInstance } from 'reactflow';
import { LayoutGrid, LayoutTemplate, MousePointer2 } from 'lucide-react';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';
import { FlowEdge } from '@/components/edges/FlowEdge';
import { useCanvasTheme } from '@/lib/theme';
import { TemplateModal } from '@/components/TemplateModal';

// Module-level ref so the store can call fitView without hooks
export const reactFlowRef: { instance: ReactFlowInstance | null } = { instance: null };

const NODE_TYPES = {
  systemNode:        SystemNode,
  baseNode:          BaseNode,
  databaseNode:     DatabaseNode,
  cacheNode:         CacheNode,
  shapeNode:         ShapeNode,
  groupNode:         GroupNode,
  textLabelNode:     TextLabelNode,
  annotationNode:    AnnotationNode,
  messageBrokerNode: MessageBrokerNode,
};

const EDGE_TYPES = {
  custom: FlowEdge,
};

function CanvasInner() {
  const {
    nodes, edges, onNodesChange, onEdgesChange, onConnect,
    selectedNodeIds, selectedEdgeId,
    setSelectedNodeId, setSelectedNodeIds, setSelectedEdgeId,
    showGrid,
    pendingLabelEdgeId, setPendingLabelEdgeId, updateEdgeData, setCanvasMode
  } = useDiagramStore();
  const canvasTheme = useCanvasTheme();
  const { isDark } = canvasTheme;

  const reactFlowInstance = useReactFlow();
  const { onNodeDrag, onNodeDragStop: onNodeDragStopSnap } = useSnapping();
  useMiddleMousePan();
  const [labelDraft, setLabelDraft] = useState('');
  const labelInputRef = useRef<HTMLInputElement>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  
  // Onboarding state - only show when canvas is empty
  const [isOnboardingVisible, setIsOnboardingVisible] = useState(nodes.length === 0);
  const [isOnboardingFading, setIsOnboardingFading] = useState(false);

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

  // Dismiss onboarding with fade animation - ONLY affects UI state
  const dismissOnboarding = useCallback(() => {
    if (!isOnboardingVisible) return;
    setIsOnboardingFading(true);
    setTimeout(() => {
      setIsOnboardingVisible(false);
      setIsOnboardingFading(false);
    }, 200);
  }, [isOnboardingVisible]);

  const onNodeDragStop: NodeDragHandler = useCallback((_e, node) => {
    onNodeDragStopSnap(_e, node, reactFlowInstance.getNodes());
    useDiagramStore.getState().pushHistory();
    dismissOnboarding();
  }, [onNodeDragStopSnap, reactFlowInstance, dismissOnboarding]);

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
    
    const result = createNode(
      {
        componentId: comp.id,
        label: comp.label,
        category: comp.category,
        color: comp.color,
        icon: comp.icon,
        technology: comp.technology,
        position,
      },
      'drag'
    );
    
    const store = useDiagramStore.getState();
    store.pushHistory();
    store.importDiagram([...store.nodes, result.node], store.edges);
    store.setCanvasMode('editing');
    dismissOnboarding();
  }, [reactFlowInstance, dismissOnboarding]);

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
    dismissOnboarding();
  }, [setSelectedNodeId, setSelectedEdgeId, dismissEdgeLabel, dismissOnboarding]);

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

  const handleStartFromScratch = useCallback(() => {
    useDiagramStore.getState().clearDiagram();
    setCanvasMode('editing');
    dismissOnboarding();
  }, [setCanvasMode, dismissOnboarding]);

  const handleOpenTemplates = useCallback(() => {
    setTemplatesOpen(true);
    setCanvasMode('template');
    dismissOnboarding();
  }, [setCanvasMode, dismissOnboarding]);

  return (
    <div className="flex-1 relative overflow-hidden bg-background">
      {/* Soft canvas background - minimal gradient */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isDark
            ? 'radial-gradient(ellipse at center, rgba(40, 50, 70, 0.2) 0%, transparent 60%)'
            : 'radial-gradient(ellipse at 50% 40%, rgba(255, 255, 255, 0.8) 0%, hsl(var(--canvas-bg)) 70%)',
        }}
      />
      <div className="absolute inset-0">
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
        multiSelectionKeyCode="Shift"
        snapToGrid
        snapGrid={[20, 20]}
        minZoom={0.1}
        maxZoom={2}
        fitView
        elevateNodesOnSelect
        elevateEdgesOnSelect={true}
        selectNodesOnDrag={false}
        panOnScroll
        panOnDrag={[1, 2]}
        zoomOnScroll
        zoomOnPinch
        zoomOnDoubleClick={false}
        proOptions={{ hideAttribution: true }}
        connectionLineType={ConnectionLineType.SmoothStep}
        defaultEdgeOptions={{
          type: 'custom',
          data: { connectionType: 'smooth' },
        }}
      >
        <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
          <defs>
            <marker id="arrow-default" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L6,3 z" fill="#6366f1" />
            </marker>
          </defs>
        </svg>
        {showGrid && (
          <Background
            variant={BackgroundVariant.Dots}
            color={isDark ? 'rgba(100, 120, 150, 0.15)' : 'rgba(180, 190, 200, 0.4)'}
            gap={24}
            size={1}
          />
        )}
        <Controls
          showInteractive={false}
          className="!bg-white !rounded-xl !shadow-lg"
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}
        />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          className="!bg-white !rounded-xl !shadow-lg cursor-move"
          maskColor={isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.04)'}
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}
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
                    background: isDark ? 'hsl(var(--card))' : '#ffffff',
                    border: 'none',
                    borderRadius: 9999,
                    padding: '4px 12px',
                    fontSize: 11,
                    fontFamily: 'Inter, system-ui, sans-serif',
                    color: isDark ? 'hsl(var(--foreground))' : '#374151',
                    outline: 'none',
                    textAlign: 'center',
                    boxShadow: '0 4px 16px hsl(var(--foreground) / 0.15)',
                  }}
                />
              </div>
            </EdgeLabelRenderer>
          );
        })()}
      </ReactFlow>
      </div>

      <GuideLines />

      {contextMenu && (
        <ContextMenu menu={contextMenu} onClose={() => setContextMenu(null)} />
      )}

      {/* Minimal empty state hint - only shows when canvas is completely empty */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-[5]">
          <div className="text-center">
            <p className="text-sm" style={{ color: '#B0B0B0' }}>
              Press <kbd className="px-1.5 py-0.5 rounded text-xs font-medium" style={{ background: '#F2F2F2', color: '#6B6B6B' }}>/</kbd> to add components
            </p>
            <p className="text-xs mt-2" style={{ color: '#B0B0B0' }}>
              or use <kbd className="px-1.5 py-0.5 rounded text-xs font-medium" style={{ background: '#F2F2F2', color: '#6B6B6B' }}>Cmd + K</kbd>
            </p>
          </div>
          <div className="flex items-center gap-3 mt-6 text-[11px] pointer-events-auto">
            <button
              onClick={handleOpenTemplates}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-gray-100"
              style={{ background: 'white', color: '#6B6B6B', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            >
              Browse templates
            </button>
            <span className="text-[10px]" style={{ color: '#B0B0B0' }}>or start from scratch</span>
          </div>
          <p className="text-[10px] mt-4" style={{ color: '#B0B0B0' }}>Press <kbd className="px-1 py-0.5 rounded" style={{ background: '#F2F2F2' }}>?</kbd> for shortcuts</p>
        </div>
      )}

      {/* Status bar with selection info - soft floating pill */}
      {(selectedNodeIds.length > 0 || selectedEdgeId) && (
        <div className="absolute top-4 right-4 z-[5] flex items-center gap-3 px-4 py-2 rounded-full floating-panel">
          <span className="text-[11px] text-foreground/70">
            {selectedNodeIds.length > 0 && `${selectedNodeIds.length} node${selectedNodeIds.length > 1 ? 's' : ''} selected`}
            {selectedNodeIds.length > 0 && selectedEdgeId && ' · '}
            {selectedEdgeId && '1 edge selected'}
          </span>
          <span className="w-px h-3 bg-border/50" />
          <span className="text-[11px] text-muted-foreground">⌘C copy · Del delete</span>
        </div>
      )}

      {showShortcuts && <KeyboardShortcutsModal open={showShortcuts} onOpenChange={setShowShortcuts} />}
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
