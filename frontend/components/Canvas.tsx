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
import { useMemo, useCallback, useEffect, useRef, DragEvent, useState } from 'react';

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
  } = useDiagramStore();

  const reactFlowInstance = useReactFlow();
  const nodeTypes = useMemo(() => NODE_TYPES, []);
  const edgeTypes = useMemo(() => EDGE_TYPES, []);
  const { onNodeDrag, onNodeDragStop: onNodeDragStopSnap } = useSnapping();
  const cloneIdRef = useRef<string | null>(null);
  // Store the original position before drag starts (for alt+drag clone)
  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null);

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

  // Register fitView for toolbar button
  const { fitView } = reactFlowInstance;
  useEffect(() => {
    registerFitView(() => fitView({ padding: 0.1, duration: 400 }));
  }, [fitView, registerFitView]);

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
    setSelectedEdgeId(edge.id);
    setSelectedNodeId(null);
  }, [setSelectedEdgeId, setSelectedNodeId]);

  const onEdgeDoubleClick: EdgeMouseHandler = useCallback((e, edge) => {
    e.stopPropagation();
    // Start inline editing without opening the sidebar
    useDiagramStore.getState().setEditingEdgeId(edge.id);
    // Don't select the edge — keeps sidebar closed
    setSelectedEdgeId(null);
  }, [setSelectedEdgeId]);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setContextMenu(null);
  }, [setSelectedNodeId, setSelectedEdgeId]);

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
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onNodeDrag={onNodeDragWithAlt}
        onNodeDragStart={onNodeDragStart}
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
        fitView
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          type: 'custom',
          data: { edgeStyle: 'solid', connectionType: 'smoothstep' },
          style: { stroke: '#94a3b8', strokeWidth: 1.5 },
        }}
      >
        {showGrid && (
          <Background
            variant={BackgroundVariant.Dots}
            color="hsl(var(--border))"
            gap={24}
            size={1.5}
          />
        )}
        <Controls showInteractive={false} />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          className="!bg-card !border !border-border !rounded-lg !shadow-lg"
          maskColor="rgba(0,0,0,0.06)"
        />
      </ReactFlow>

      <GuideLines />

      {contextMenu && (
        <ContextMenu menu={contextMenu} onClose={() => setContextMenu(null)} />
      )}

      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center space-y-1">
            <p className="text-muted-foreground text-sm font-medium">
              Drag a component from the sidebar to start
            </p>
            <p className="text-muted-foreground/60 text-xs">or press ⌘K to search</p>
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
