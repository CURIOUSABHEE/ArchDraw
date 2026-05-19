'use client';

import ReactFlow, {
  Background, BackgroundVariant, Controls, MiniMap,
  useReactFlow, ReactFlowProvider,
  NodeMouseHandler, EdgeMouseHandler, NodeDragHandler,
  SelectionMode, ConnectionLineType,
  ConnectionMode, MarkerType,
  type OnSelectionChangeParams,
  type Connection,
  type Edge,
  type NodeChange,
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
import { useCallback, useEffect, useRef, DragEvent, useState, useMemo } from 'react';
import { EdgeLabelRenderer, type ReactFlowInstance } from 'reactflow';
import { LayoutGrid, LayoutTemplate, MousePointer2 } from 'lucide-react';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';
import { FlowEdge } from '@/components/edges/FlowEdge';
import SimpleFloatingEdge from '@/components/edges/SimpleFloatingEdge';
import { useCanvasTheme } from '@/lib/theme';
import { TemplateModal } from '@/components/TemplateModal';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { isValidConnection, wouldCreateCycle } from '@/lib/config/edgeConfig';

import { useGrouping } from '@/hooks/useGrouping';
import { toast } from 'sonner';
import type { Node } from 'reactflow';
import { resolveNodeCollisions } from '@/src/utils/resolveNodeCollisions';
import CustomNode from '@/components/nodes/CustomNode';

// Module-level ref so the store can call fitView without hooks
export const reactFlowRef: { instance: ReactFlowInstance | null } = { instance: null };

const NODE_TYPES = {
  systemNode:        SystemNode,
  architectureNode:  SystemNode,
  baseNode:          BaseNode,
  databaseNode:     DatabaseNode,
  cacheNode:         CacheNode,
  shapeNode:         ShapeNode,
  groupNode:         GroupNode,
  group:             GroupNode,
  textLabelNode:     TextLabelNode,
  annotationNode:    AnnotationNode,
  messageBrokerNode: MessageBrokerNode,
  customNode:        CustomNode,
};

const EDGE_TYPES = {
  custom: FlowEdge,
  simpleFloating: SimpleFloatingEdge,
  default: FlowEdge,
};

function CanvasInner() {
  const nodeTypes = useMemo(() => NODE_TYPES, []);
  const edgeTypes = useMemo(() => EDGE_TYPES, []);

  const {
    nodes, edges, onNodesChange, onEdgesChange, onConnect, onReconnect,
    selectedNodeIds, selectedEdgeId,
    setSelectedNodeId, setSelectedNodeIds, setSelectedEdgeId,
    showGrid,
    pendingLabelEdgeId, setPendingLabelEdgeId, updateEdgeData, setCanvasMode,
    canvasDarkMode,
    setNodes,
  } = useDiagramStore();
  const canvasTheme = useCanvasTheme();
  const { isDark: appIsDark } = canvasTheme;
  const isDark = canvasDarkMode;

  const reactFlowInstance = useReactFlow();
  const { onNodeDrag, onNodeDragStop: onNodeDragStopSnap } = useSnapping();
  useMiddleMousePan();
  const { selectionRect } = useGrouping();

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

  // Load diagram from session URL on mount
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const importDiagram = useDiagramStore((s) => s.importDiagram);
  const addCanvas = useDiagramStore((s) => s.addCanvas);
  const switchCanvas = useDiagramStore((s) => s.switchCanvas);
  const activeCanvasId = useDiagramStore((s) => s.activeCanvasId);
  const loadSession = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/api/diagram/session/${sessionId}`);
      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Failed to load diagram');
        return;
      }

      const data = await response.json();
      const isMCP = data.source === 'mcp';
      const nodesWithType = (data.nodes as Node[]).map((n) => ({
        ...n,
        type: n.type === 'architectureNode' ? 'systemNode' : (n.type || 'systemNode'),
      }));
      const edgesWithType = (data.edges as Edge[]).map((e) => ({
        ...e,
        // Always use simpleFloating for MCP sessions — SystemNode doesn't mount
        // named Handle components, so FlowEdge (custom) can't resolve handle positions
        type: 'simpleFloating',
        sourceHandle: undefined,
        targetHandle: undefined,
        data: {
          ...e.data,
          pathType: e.data?.pathType || e.type || 'smooth',
        },
      }));
      
      const canvasName = isMCP ? `MCP: ${data.label || 'Diagram'}` : (data.label || 'Session Diagram');
      const canvasId = addCanvas(canvasName, sessionId);
      importDiagram(nodesWithType, edgesWithType);
      router.replace(`/editor?canvas=${canvasId}`);
      toast.success(`Diagram loaded: ${data.label || 'Untitled'}`);
    } catch {
      toast.error('Failed to load diagram');
    }
  }, [importDiagram, addCanvas, router]);

  useEffect(() => {
    const sessionId = searchParams.get('session');
    if (!sessionId) return;
    loadSession(sessionId);
  }, [searchParams, loadSession]);

  // Handle canvas ID from URL - only on initial load or external navigation
  const [urlCanvasHandled, setUrlCanvasHandled] = useState(false);
  useEffect(() => {
    if (urlCanvasHandled) return;
    
    const canvasId = searchParams.get('canvas');
    if (!canvasId) {
      setUrlCanvasHandled(true);
      return;
    }
    
    // Check if canvas exists in store
    const canvases = useDiagramStore.getState().canvases;
    const exists = canvases.find(c => c.id === canvasId);
    
    if (exists) {
      const currentCanvasId = activeCanvasId;
      if (currentCanvasId !== canvasId) {
        switchCanvas(canvasId);
      }
    }
    setUrlCanvasHandled(true);
  }, [searchParams, switchCanvas, activeCanvasId, urlCanvasHandled]);

  // Sync active canvas ID to URL - only update if not just handled URL
  useEffect(() => {
    if (!urlCanvasHandled) return;
    
    const currentCanvasId = activeCanvasId;
    const urlCanvasId = searchParams.get('canvas');
    if (currentCanvasId && currentCanvasId !== urlCanvasId) {
      router.replace(`/editor?canvas=${currentCanvasId}`, { scroll: false });
    }
  }, [activeCanvasId, searchParams, router, urlCanvasHandled]);

  // Load default architecture when canvas is empty (no session)
  const loadDefaultArchitecture = useDiagramStore((s) => s.loadDefaultArchitecture);
  useEffect(() => {
    const sessionId = searchParams.get('session');
    const canvasId = searchParams.get('canvas');
    if (!sessionId && !canvasId && nodes.length === 0) {
      loadDefaultArchitecture();
    }
  }, []); // Only run on mount

  // Cmd+D / Ctrl+D — duplicate selected nodes
  // Cmd+0 / Ctrl+0 — fit view
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Escape — deselect all
      if (e.key === 'Escape') {
        const active = document.activeElement;
        if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return;
        e.preventDefault();
        setSelectedNodeIds([]);
        setSelectedEdgeId(null);
        // Clear node and edge selections in store
        const store = useDiagramStore.getState();
        store.setNodes(store.nodes.map(n => ({ ...n, selected: false })));
        store.setEdges(store.edges.map(edge => ({ ...edge, selected: false })));
        return;
      }
      
      // ? key — toggle shortcuts modal
      if (e.key === '?' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        setShowShortcuts((v) => !v);
        return;
      }
      
      // Cmd+0 / Ctrl+0 — fit view to all nodes
      if ((e.metaKey || e.ctrlKey) && e.key === '0') {
        e.preventDefault();
        const fitOpts = { padding: 0.2, duration: 400, maxZoom: 1.0, minZoom: 0.3 };
        if (reactFlowInstance?.fitView) {
          reactFlowInstance.fitView(fitOpts);
        }
        if (reactFlowRef.instance?.fitView) {
          reactFlowRef.instance.fitView(fitOpts);
        }
        return;
      }
      
      // f key — fit view
      if (e.key === 'f' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        const fitOpts = { padding: 0.2, duration: 200, maxZoom: 1.0, minZoom: 0.3 };
        if (reactFlowInstance?.fitView) {
          reactFlowInstance.fitView(fitOpts);
        }
        if (reactFlowRef.instance?.fitView) {
          reactFlowRef.instance.fitView(fitOpts);
        }
        return;
      }
      
      // Cmd+G / Ctrl+G — group selected nodes
      if ((e.metaKey || e.ctrlKey) && e.key === 'g' && !e.shiftKey) {
        const active = document.activeElement;
        if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return;
        e.preventDefault();
        useDiagramStore.getState().createGroup();
        return;
      }
      
      // Cmd+Shift+G / Ctrl+Shift+G — ungroup selected group
      if ((e.metaKey || e.ctrlKey) && e.key === 'G') {
        const active = document.activeElement;
        if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return;
        e.preventDefault();
        const selectedNodeId = useDiagramStore.getState().selectedNodeId;
        if (selectedNodeId) {
          useDiagramStore.getState().ungroupNodes(selectedNodeId);
        }
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
  }, [setSelectedNodeIds, reactFlowInstance]);

  // Auto-fit viewport when nodes change
  const prevNodeCountRef = useRef(0);
  useEffect(() => {
    if (nodes.length === 0) return;
    
    const isNewDiagram = prevNodeCountRef.current === 0 && nodes.length > 0;
    prevNodeCountRef.current = nodes.length;
    
    const fitOpts = { padding: 0.2, duration: isNewDiagram ? 0 : 500, maxZoom: 1.0, minZoom: 0.1 };
    // Wait for ReactFlow to MEASURE node dimensions in the DOM (not just stored width/height)
    let attempts = 0;
    let rafId: number;
    const timer = setTimeout(() => {
      const tryFit = () => {
        attempts++;
        const currentNodes = reactFlowInstance?.getNodes?.() ?? [];
        // Check for `measured` dimensions — these are set by ReactFlow after DOM layout
        const hasMeasured = currentNodes.length > 0 && currentNodes.some(
          (n: Node & { measured?: { width?: number; height?: number } }) => (n.measured?.width ?? 0) > 0
        );
        if (hasMeasured || attempts > 60) {
          reactFlowInstance?.fitView?.(fitOpts);
          // Safety double-tap with animation after initial fit
          setTimeout(() => {
            reactFlowInstance?.fitView?.({ ...fitOpts, duration: 400 });
          }, 50);
        } else {
          rafId = requestAnimationFrame(tryFit);
        }
      };
      tryFit();
    }, 50);
    
    return () => {
      clearTimeout(timer);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [nodes.length, edges.length]);

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
    
    const currentNodes = reactFlowInstance.getNodes();
    setNodes(resolveNodeCollisions(currentNodes));
    
    useDiagramStore.getState().pushHistory();
    dismissOnboarding();
  }, [onNodeDragStopSnap, reactFlowInstance, setNodes, dismissOnboarding]);

  const handleOnConnect = useCallback((connection: Connection) => {
    onConnect(connection);
  }, [onConnect]);

  const validateConnection = useCallback((connection: Connection & { data?: { connectionType?: string } }) => {
    if (connection.source === connection.target) {
      toast.error('Cannot connect a node to itself');
      return false;
    }

    const sourceNode = nodes.find(n => n.id === connection.source);
    const targetNode = nodes.find(n => n.id === connection.target);

    if (!sourceNode || !targetNode) {
      return false;
    }

    const connectionType = connection.data?.connectionType || 'sync';
    const isValid = isValidConnection(
      sourceNode.data?.category,
      targetNode.data?.category,
      connectionType
    );

    if (!isValid) {
      toast.error(`Cannot connect ${sourceNode.data?.category} to ${targetNode.data?.category}`);
      return false;
    }

    if (wouldCreateCycle(edges, { source: connection.source as string, target: connection.target as string })) {
      toast.error('Cannot create circular dependency');
      return false;
    }

    return true;
  }, [nodes, edges]);

  const handleOnReconnect = useCallback((oldEdge: Edge, newConnection: Connection) => {
    const currentEdges = useDiagramStore.getState().edges;
    
    const updatedEdge: Edge = {
      ...oldEdge,
      source: newConnection.source as string,
      target: newConnection.target as string,
      sourceHandle: newConnection.sourceHandle,
      targetHandle: newConnection.targetHandle,
    };

    const newEdges = currentEdges.map((edge: Edge) => 
      edge.id === oldEdge.id ? updatedEdge : edge
    );

    useDiagramStore.getState().setEdges(newEdges);
    toast.success('Connection updated');
  }, []);

  const handleOnNodesChange = useCallback((changes: NodeChange[]) => {
    onNodesChange(changes);
  }, [onNodesChange]);

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
    setSelectedNodeIds([node.id]);
  }, [setSelectedNodeId, setSelectedEdgeId, setSelectedNodeIds]);

  const onEdgeClick: EdgeMouseHandler = useCallback((_e, edge) => {
    const { editingEdgeId, pendingEditEdgeId } = useDiagramStore.getState();
    if (editingEdgeId === edge.id || pendingEditEdgeId === edge.id) return;
    useDiagramStore.getState().setSelectedEdgeId(edge.id);
    setSelectedNodeId(null);
    setSelectedNodeIds([]);
  }, [setSelectedNodeId, setSelectedNodeIds]);

  const onEdgeDoubleClick: EdgeMouseHandler = useCallback((_e, edge) => {
    setPendingLabelEdgeId(edge.id);
  }, [setPendingLabelEdgeId]);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedNodeIds([]);
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

  const onEdgeContextMenu: EdgeMouseHandler = useCallback((e, edge) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, edgeId: edge.id });
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
    <div className="fixed inset-0 drafting-canvas-bg">
      <div className="absolute inset-0" style={{ width: '100%', height: '100%', top: 0, zIndex: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleOnNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleOnConnect}
          onReconnect={handleOnReconnect}
          isValidConnection={validateConnection}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
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
          onEdgeContextMenu={onEdgeContextMenu}
          onSelectionChange={onSelectionChange}
          selectionOnDrag
          selectionKeyCode={null}
          selectionMode={SelectionMode.Partial}
          multiSelectionKeyCode="Shift"
          snapToGrid
          snapGrid={[20, 20]}
          minZoom={0.1}
          maxZoom={2}
          fitView
          elevateNodesOnSelect
          style={{ background: 'transparent' }}
          elevateEdgesOnSelect={false}
          selectNodesOnDrag={false}
          panOnScroll
          panOnDrag={[1, 2]}
          zoomOnScroll
          zoomOnPinch
          zoomOnDoubleClick={false}
          nodesDraggable={true}
          connectionMode={ConnectionMode.Loose}
          proOptions={{ hideAttribution: true }}
          connectionLineType={ConnectionLineType.SmoothStep}
          connectionLineStyle={{ stroke: '#9CA3AF', strokeWidth: 2 }}
          defaultEdgeOptions={{
            type: 'simpleFloating',
            markerEnd: { type: MarkerType.ArrowClosed, color: '#6B7280' },
            style: { stroke: '#6B7280', strokeWidth: 2 },
            data: { connectionType: 'sync', pathType: 'Smoothstep' },
          }}
        >
          <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
          <defs>
            {/* Arrow markers — consistent neutral gray with gap before node */}
            <marker id="arrow-sync" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L6,3 z" fill="#3B82F6" />
            </marker>
            <marker id="arrow-async" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L6,3 z" fill="#F59E0B" />
            </marker>
            <marker id="arrow-stream" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L6,3 z" fill="#10B981" />
            </marker>
            <marker id="arrow-event" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L6,3 z" fill="#8B5CF6" />
            </marker>
            <marker id="arrow-dep" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L6,3 z" fill="#6B7280" />
            </marker>
            <marker id="arrow-default" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L6,3 z" fill="#6B7280" />
            </marker>
            <marker id="arrow-error" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L6,3 z" fill="#EF4444" />
            </marker>
          </defs>
        </svg>
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color={isDark ? '#3d3d3d' : '#d2d2cb'}
          style={{ opacity: isDark ? 0.35 : 0.4, zIndex: 0 }}
        />
        <Controls
          showInteractive={false}
          style={{
            background: 'transparent',
            border: 'none',
            borderRadius: '12px',
            boxShadow: 'none',
          }}
        />
        <MiniMap
          nodeStrokeWidth={1.5}
          zoomable
          pannable
          style={{
            background: 'transparent',
            borderRadius: '14px',
            boxShadow: 'none',
          }}
          nodeColor={(node) => {
            const serviceType = (node.data as { serviceType?: string })?.serviceType;
            const colors: Record<string, string> = {
              client: '#5A5A5A',
              gateway: '#6B7B8D',
              service: '#6FA8DC',
              queue: '#C4A86C',
              database: '#D8AA59',
              cache: '#D8AA59',
              auth: '#8A8A8A',
              monitoring: '#8A8A8A',
            };
            return colors[serviceType ?? ''] ?? '#6B7280';
          }}
          maskColor="rgba(248, 248, 244, 0.5)"
          maskStrokeColor="transparent"
          maskStrokeWidth={0}
        />

        {/* Floating label prompt after double-clicking an edge */}
        {pendingLabelEdgeId && (() => {
          const edge = edges.find((e) => e.id === pendingLabelEdgeId);
          const srcNode = edge ? nodes.find((n) => n.id === edge.source) : null;
          const tgtNode = edge ? nodes.find((n) => n.id === edge.target) : null;
          const midX = srcNode && tgtNode && typeof srcNode.position?.x === 'number' && typeof tgtNode.position?.x === 'number'
            ? (srcNode.position.x + (srcNode.width ?? 140) / 2 + tgtNode.position.x + (tgtNode.width ?? 140) / 2) / 2
            : 400;
          const midY = srcNode && tgtNode && typeof srcNode.position?.y === 'number' && typeof tgtNode.position?.y === 'number'
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
                    background: isDark ? 'hsl(var(--card))' : 'hsl(60 33% 98%)',
                    border: '1px solid hsl(40 20% 88% / 0.6)',
                    borderRadius: 9999,
                    padding: '4px 12px',
                    fontSize: 11,
                    fontFamily: 'Inter, system-ui, sans-serif',
                    color: isDark ? 'hsl(var(--foreground))' : '#374151',
                    outline: 'none',
                    textAlign: 'center',
                    boxShadow: '0 1px 3px hsl(40 15% 20% / 0.04), 0 2px 8px hsl(40 15% 20% / 0.03)',
                  }}
                />
              </div>
            </EdgeLabelRenderer>
          );
        })()}
      </ReactFlow>
      </div>

      {selectionRect && (
        <div
          style={{
            position: 'absolute',
            left: !isNaN(selectionRect.x) ? selectionRect.x : 0,
            top: !isNaN(selectionRect.y) ? selectionRect.y : 0,
            width: !isNaN(selectionRect.width) && selectionRect.width > 0 ? selectionRect.width : 0,
            height: !isNaN(selectionRect.height) && selectionRect.height > 0 ? selectionRect.height : 0,
            backgroundColor: 'hsl(40 6% 25% / 0.04)',
            border: '1.5px dashed hsl(40 6% 25% / 0.3)',
            borderRadius: '8px',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        />
      )}
      
      <GuideLines />

      {contextMenu && (
        <ContextMenu menu={contextMenu} onClose={() => setContextMenu(null)} />
      )}

       {/* Minimal empty state hint - only shows when canvas is completely empty */}
       {nodes.length === 0 && (
         <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-[5]">
           <div className="text-center">
             <p className="text-sm" style={{ color: '#9a9a8e' }}>
               Press <kbd className="px-1.5 py-0.5 rounded text-xs font-medium" style={{ background: 'hsl(40 20% 94%)', color: '#6b6b5e' }}>/</kbd> to add components
             </p>
             <p className="text-xs mt-2" style={{ color: '#9a9a8e' }}>
               or use <kbd className="px-1.5 py-0.5 rounded text-xs font-medium" style={{ background: 'hsl(40 20% 94%)', color: '#6b6b5e' }}>Cmd + K</kbd>
             </p>
           </div>
           <div className="flex items-center gap-3 mt-6 text-[11px] pointer-events-auto">
             <button
               onClick={handleOpenTemplates}
               className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-white/60"
               style={{ background: 'hsl(60 33% 98%)', color: '#6b6b5e', boxShadow: '0 1px 3px hsl(40 15% 20% / 0.04), 0 2px 8px hsl(40 15% 20% / 0.03)' }}
             >
               Browse templates
             </button>
             <span className="text-[10px]" style={{ color: '#9a9a8e' }}>or start from scratch</span>
           </div>
           <p className="text-[10px] mt-4" style={{ color: '#9a9a8e' }}>Press <kbd className="px-1 py-0.5 rounded" style={{ background: 'hsl(40 20% 94%)' }}>?</kbd> for shortcuts</p>
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
