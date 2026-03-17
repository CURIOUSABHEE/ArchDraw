'use client';

import ReactFlow, {
  Background, BackgroundVariant, Controls, MiniMap,
  useReactFlow, ReactFlowProvider,
  NodeMouseHandler, EdgeMouseHandler, NodeDragHandler,
  SelectionMode,
  type OnSelectionChangeParams,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useDiagramStore } from '@/store/diagramStore';
import { SystemNode } from '@/components/SystemNode';
import { ShapeNode } from '@/components/ShapeNode';
import { GroupNode } from '@/components/GroupNode';
import { TextLabelNode } from '@/components/TextLabelNode';
import { AnnotationNode } from '@/components/AnnotationNode';
import { CustomEdge } from '@/components/CustomEdge';
import { GuideLines } from '@/components/GuideLines';
import { ContextMenu, type ContextMenuState } from '@/components/ContextMenu';
import { useSnapping } from '@/hooks/useSnapping';
import { useCallback, useEffect, useRef, DragEvent, useState } from 'react';
import { EdgeLabelRenderer } from 'reactflow';

const NODE_TYPES = {
  systemNode:     SystemNode,
  shapeNode:      ShapeNode,
  groupNode:      GroupNode,
  textLabelNode:  TextLabelNode,
  annotationNode: AnnotationNode,
};

const EDGE_TYPES = {
  custom: CustomEdge,
};

function CanvasInner() {
  const {
    nodes, edges, onNodesChange, onEdgesChange, onConnect,
    setSelectedNodeId, setSelectedNodeIds, setSelectedEdgeId,
    showGrid, registerFitView,
    pendingLabelEdgeId, setPendingLabelEdgeId, updateEdgeData,
  } = useDiagramStore();

  const reactFlowInstance = useReactFlow();
  const { onNodeDrag, onNodeDragStop: onNodeDragStopSnap } = useSnapping();
  const cloneIdRef = useRef<string | null>(null);
  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const [labelDraft, setLabelDraft] = useState('');
  const labelInputRef = useRef<HTMLInputElement>(null);

  // State
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [altHeld, setAltHeld] = useState(false);

  // Alt key tracking for copy cursor
  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.key === 'Alt') setAltHeld(true); };
    const up   = (e: KeyboardEvent) => { if (e.key === 'Alt') setAltHeld(false); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  // Focus label input when a new edge is drawn
  useEffect(() => {
    if (pendingLabelEdgeId) {
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
  useEffect(() => {
    registerFitView(() => reactFlowInstance.fitView({ padding: 0.1, duration: 400 }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registerFitView]);

  // Push history after drag ends
  const onNodeDragStop: NodeDragHandler = useCallback((...args) => {
    onNodeDragStopSnap(...args);
    cloneIdRef.current = null;
    dragStartPosRef.current = null;
    useDiagramStore.getState().pushHistory();
  }, [onNodeDragStopSnap]);

  // Option+drag: on drag start, freeze original and spawn clone at same spot
  const onNodeDragStart: NodeDragHandler = useCallback((e, node) => {
    if (!e.altKey) return;
    // Save where the original was
    dragStartPosRef.current = { x: node.position.x, y: node.position.y };
    const cloneId = `${node.id}-copy-${Date.now()}`;
    cloneIdRef.current = cloneId;
    useDiagramStore.getState().pushHistory();
    useDiagramStore.setState((s) => ({
      nodes: s.nodes
        // freeze original back to its start position, deselect it
        .map((n) =>
          n.id === node.id
            ? { ...n, selected: false, dragging: false, position: dragStartPosRef.current! }
            : n
        )
        // add clone at the dragged position so it follows the cursor
        .concat({
          ...node,
          id: cloneId,
          selected: true,
          dragging: true,
          data: { ...node.data },
        }),
    }));
    setSelectedNodeId(cloneId);
  }, [setSelectedNodeId]);

  // While dragging with alt: keep original frozen, only move the clone
  const onNodeDragWithAlt: NodeDragHandler = useCallback((e, node, nodes) => {
    onNodeDrag(e, node, nodes);
    if (!cloneIdRef.current) return;
    // If somehow the original is moving instead of the clone, freeze it
    if (node.id !== cloneIdRef.current && dragStartPosRef.current) {
      useDiagramStore.setState((s) => ({
        nodes: s.nodes.map((n) =>
          n.id === node.id ? { ...n, position: dragStartPosRef.current! } : n
        ),
      }));
    }
  }, [onNodeDrag]);


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
    useDiagramStore.setState((s) => ({
      nodes: [...s.nodes, {
        id, type: 'systemNode', position,
        data: { label: comp.label, category: comp.category, color: comp.color, icon: comp.icon, technology: comp.technology },
      }],
    }));
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
    <div className="flex-1 relative bg-background" style={{ cursor: altHeld ? 'copy' : undefined }}>
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
        onNodeDrag={onNodeDragWithAlt}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
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
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          type: 'custom',
          animated: true,
          data: { edgeStyle: 'solid', connectionType: 'smoothstep', color: '#94a3b8' },
          style: { stroke: '#94a3b8', strokeWidth: 1.5 },
        }}
      >
        {showGrid && (
          <Background
            variant={BackgroundVariant.Dots}
            color="#334155"
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

        {/* Floating label prompt after drawing a new edge */}
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
                <div style={{
                  background: 'hsl(var(--card))',
                  border: '1.5px solid #6366f1',
                  borderRadius: 8,
                  padding: '6px 10px',
                  boxShadow: '0 0 0 3px rgba(99,102,241,0.15), 0 4px 16px rgba(0,0,0,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  minWidth: 180,
                }}>
                  <input
                    ref={labelInputRef}
                    value={labelDraft}
                    onChange={(e) => setLabelDraft(e.target.value)}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === 'Enter') { e.preventDefault(); commitEdgeLabel(); }
                      if (e.key === 'Escape') dismissEdgeLabel();
                    }}
                    placeholder="Add label (optional)"
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontSize: 11,
                      fontFamily: 'Inter, system-ui, sans-serif',
                      color: 'hsl(var(--foreground))',
                    }}
                  />
                  <button
                    onMouseDown={(e) => { e.preventDefault(); commitEdgeLabel(); }}
                    style={{
                      background: '#6366f1',
                      border: 'none',
                      borderRadius: 4,
                      padding: '2px 8px',
                      fontSize: 10,
                      fontWeight: 600,
                      color: '#fff',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    ↵
                  </button>
                </div>
              </div>
            </EdgeLabelRenderer>
          );
        })()}
      </ReactFlow>

      <GuideLines />

      {contextMenu && (
        <ContextMenu menu={contextMenu} onClose={() => setContextMenu(null)} />
      )}

      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center space-y-1">
            <p className="text-muted-foreground/70 text-sm font-medium">
              Drag a component from the sidebar to start
            </p>
            <p className="text-muted-foreground/40 text-xs">or press ⌘K to search</p>
          </div>
        </div>
      )}
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
