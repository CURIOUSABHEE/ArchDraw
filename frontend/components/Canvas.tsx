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
import { getLayoutedElements } from '@/lib/layoutUtils';
import { TEMPLATES } from '@/data/templates/index';
import { GuideLines } from '@/components/GuideLines';
import { ContextMenu, type ContextMenuState } from '@/components/ContextMenu';
import { useSnapping } from '@/hooks/useSnapping';
import { useMiddleMousePan } from '@/hooks/useCanvasInteractions';
import { useCallback, useEffect, useRef, DragEvent, useState, useMemo } from 'react';
import { EdgeLabelRenderer, type ReactFlowInstance } from 'reactflow';
import { LayoutGrid, LayoutTemplate, MousePointer2 } from 'lucide-react';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';
import SimpleFloatingEdge from '@/components/edges/SimpleFloatingEdge';
import { useCanvasTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { SVGEdgeMarkerDefs } from '@/lib/utils/edgeColorUtils';

import { TemplateModal } from '@/components/TemplateModal';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { isValidConnection, wouldCreateCycle } from '@/lib/config/edgeConfig';
import { DIAGRAM_CONSTANTS } from '@/constants/diagram';
import { CANVAS_CONFIG, DEFAULT_EDGE_OPTIONS, EDGE_CONFIG } from '@/lib/config';

import { useGrouping } from '@/hooks/useGrouping';
import { toast } from 'sonner';
import type { Node } from 'reactflow';
import { resolveNodeCollisions } from '@/src/utils/resolveNodeCollisions';
import { useEdgeColors } from '@/lib/edgeColors';
import { calculateNodeDimensions } from '@/lib/utils/nodeSizing';
import { createNode, createEdge } from '@/lib/factory';

// Module-level ref so the store can call fitView without hooks
export const reactFlowRef: { instance: ReactFlowInstance | null } = { instance: null };

const NODE_TYPES = {
  systemNode:        SystemNode,
  architectureNode:  SystemNode,
  baseNode:          SystemNode,
  databaseNode:      SystemNode,
  cacheNode:         SystemNode,
  shapeNode:         ShapeNode,
  groupNode:         GroupNode,
  group:             GroupNode,
  frameNode:         GroupNode,
  serviceNode:       SystemNode,
  textLabelNode:     TextLabelNode,
  annotationNode:    AnnotationNode,
  messageBrokerNode: SystemNode,
  customNode:        SystemNode,
};

const EDGE_TYPES = {
  custom: SimpleFloatingEdge,
  simpleFloating: SimpleFloatingEdge,
  floating: SimpleFloatingEdge,
  default: SimpleFloatingEdge,
  smoothstep: SimpleFloatingEdge,
  flow: SimpleFloatingEdge,
  async: SimpleFloatingEdge,
  sync: SimpleFloatingEdge,
  stream: SimpleFloatingEdge,
  event: SimpleFloatingEdge,
  dep: SimpleFloatingEdge,
  dotted: SimpleFloatingEdge,
};

function CanvasInner() {

  const {
    nodes, edges, onNodesChange, onEdgesChange, onConnect, onReconnect,
    selectedEdgeId,
    selectedNodeIds,
    setSelectedNodeId, setSelectedNodeIds, setSelectedEdgeId,
    showGrid,
    pendingLabelEdgeId, setPendingLabelEdgeId, updateEdgeData, setCanvasMode,
    setNodes,
  } = useDiagramStore();
  const { isDark } = useCanvasTheme();

  const reactFlowInstance = useReactFlow();
  const { onNodeDrag, onNodeDragStop: onNodeDragStopSnap } = useSnapping();
  useMiddleMousePan();
  useGrouping();

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

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const importDiagram = useDiagramStore((s) => s.importDiagram);
  const addCanvas = useDiagramStore((s) => s.addCanvas);
  const switchCanvas = useDiagramStore((s) => s.switchCanvas);
  const activeCanvasId = useDiagramStore((s) => s.activeCanvasId);
  const saveCanvasToDB = useDiagramStore((s) => s.saveCanvasToDB);

  const renameCanvas = useDiagramStore((s) => s.renameCanvas);

  // Handle template from URL
  useEffect(() => {
    const templateId = searchParams.get('template');
    if (!templateId) return;

    const template = TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      // Create a new canvas for the template
      const newCanvasId = addCanvas(template.name);
      
      // Apply layout to template elements
      const { nodes: ln, edges: le } = getLayoutedElements(template.nodes, template.edges, 'LR');
      
      // Import into diagram store
      importDiagram(ln, le);
      
      // Ensure canvas name is set
      renameCanvas(newCanvasId, template.name);
      
      // Clear template from URL and switch to new canvas
      router.replace(`/editor?canvas=${newCanvasId}`);
      toast.success(`Loaded template: ${template.name}`);
      
      // Fit view after a short delay to allow nodes to mount
      setTimeout(() => {
        if (reactFlowRef.instance) {
          reactFlowRef.instance.fitView({ padding: 0.1, duration: 400 });
        }
      }, 100);
    } else {
      toast.error('Template not found');
      router.replace('/editor');
    }
  }, [searchParams, addCanvas, importDiagram, renameCanvas, router]);
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
      const nodesWithType = (data.nodes as Node[]).map((n) => {
        let nodeWidth = n.data?.nodeWidth;
        let nodeHeight = n.data?.nodeHeight;
        
        if (!nodeWidth || !nodeHeight) {
          const dims = calculateNodeDimensions(n.data?.label || '', n.data?.subtitle || '');
          nodeWidth = nodeWidth || dims.width;
          nodeHeight = nodeHeight || dims.height;
        }

        const { id, type, position, data: extraData, ...rest } = n;
        const mappedType = type === 'architectureNode' ? 'systemNode' : (type || 'systemNode');

        return createNode(
          (extraData?.typeId as string) || mappedType,
          extraData?.label || '',
          position || { x: 0, y: 0 },
          {
            id,
            type: mappedType,
            data: {
              ...extraData,
              nodeWidth,
              nodeHeight,
            },
            ...rest
          }
        );
      });
      const edgesWithType = (data.edges as Edge[]).map((e) => {
        const { id, source, target, label, type, sourceHandle, targetHandle, data: extraData, ...rest } = e;
        return createEdge(
          source,
          target,
          String(extraData?.label || label || ''),
          {
            id,
            type: 'simpleFloating',
            sourceHandle: undefined,
            targetHandle: undefined,
            data: {
              ...extraData,
              pathType: 'Smoothstep',
            },
            ...rest
          }
        );
      });
      
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
  const urlCanvasHandledRef = useRef(false);
  useEffect(() => {
    if (urlCanvasHandledRef.current) return;
    
    const canvasId = searchParams.get('canvas');
    if (!canvasId) {
      urlCanvasHandledRef.current = true;
      return;
    }
    
    // Check if canvas exists in store
    const canvases = useDiagramStore.getState().canvases;
    const exists = canvases.find(c => c.id === canvasId);
    
    if (exists) {
      switchCanvas(canvasId);
      urlCanvasHandledRef.current = true;
    }
  }, [searchParams, switchCanvas]);

  const onNodeDragStop = useCallback(
    (event: React.MouseEvent, node: Node, draggedNodes: Node[]) => {
      onNodeDragStopSnap(event, node, draggedNodes);

      // Collision resolution
      const currentNodes = useDiagramStore.getState().nodes;
      const resolvedNodes = resolveNodeCollisions(currentNodes);

      const hasChanges = currentNodes.some((n, i) =>
        n.position.x !== resolvedNodes[i]?.position.x ||
        n.position.y !== resolvedNodes[i]?.position.y
      );

      if (hasChanges) {
        // setNodes already calls saveCanvasToDB
        setNodes(resolvedNodes);
      } else {
        // Drag finished with no collision fix — persist the final positions.
        // onNodesChange intentionally skips saveCanvasToDB on position changes
        // (to prevent 60fps infinite loops), so we do one save here instead.
        saveCanvasToDB(activeCanvasId);
      }

      // Recalculate connection handles based on the new layout positions
      useDiagramStore.getState().recalculateHandles();
    },
    [onNodeDragStopSnap, setNodes, saveCanvasToDB, activeCanvasId]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNodeIds([]);
    setSelectedEdgeId(null);
    setContextMenu(null);
  }, [setSelectedNodeIds, setSelectedEdgeId]);

  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes, edges: selectedEdges }: OnSelectionChangeParams) => {
      const nodeIds = (selectedNodes || []).map((n) => n.id);
      setSelectedNodeIds(nodeIds);
      setSelectedNodeId(nodeIds.length === 1 ? nodeIds[0] : null);
      setSelectedEdgeId(selectedEdges && selectedEdges.length === 1 ? selectedEdges[0].id : null);
    },
    [setSelectedNodeIds, setSelectedNodeId, setSelectedEdgeId]
  );

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        nodeId: node.id,
      });
    },
    []
  );

  const onPaneContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
      });
    },
    []
  );

  // Label editing logic
  useEffect(() => {
    const handleEditEvent = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const edgeId = customEvent.detail;
      setPendingLabelEdgeId(edgeId);
      const edge = useDiagramStore.getState().edges.find(edge => edge.id === edgeId);
      setLabelDraft(edge?.data?.label || edge?.label || '');
    };
    document.addEventListener('edit-edge-label', handleEditEvent);
    return () => {
      document.removeEventListener('edit-edge-label', handleEditEvent);
    };
  }, [setPendingLabelEdgeId]);

  useEffect(() => {
    if (pendingLabelEdgeId && labelInputRef.current) {
      labelInputRef.current.focus();
    }
  }, [pendingLabelEdgeId]);

  const handleLabelSubmit = () => {
    if (pendingLabelEdgeId) {
      updateEdgeData(pendingLabelEdgeId, { label: labelDraft });
      setPendingLabelEdgeId(null);
    }
  };

  const coloredEdges = useEdgeColors(edges);

  return (
    <div 
      className="w-full h-full relative transition-colors duration-200 bg-[hsl(var(--canvas-bg))]"
      onDragOver={(e) => e.preventDefault()}
    >
      <ReactFlow
        nodes={nodes}
        edges={coloredEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onReconnect={onReconnect}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onPaneClick={onPaneClick}
        onSelectionChange={onSelectionChange}
        onNodeContextMenu={onNodeContextMenu}
        onPaneContextMenu={onPaneContextMenu}
        onEdgeDoubleClick={(e, edge) => {
          e.preventDefault();
          e.stopPropagation();
          setPendingLabelEdgeId(edge.id);
          setLabelDraft(edge.data?.label || edge.label || '');
        }}
        nodeTypes={useMemo(() => NODE_TYPES, [])}
        edgeTypes={useMemo(() => EDGE_TYPES, [])}
        fitView
        selectionMode={SelectionMode.Full}
        // Keep canvas panning on middle/right mouse so left-drag can draw selection box.
        panOnDrag={[1, 2]}
        // Trackpad/touchpad two-finger gesture should move (pan) the canvas.
        panOnScroll={true}
        selectionOnDrag={true}
        // Avoid hijacking two-finger scroll for zoom; zoom still works via controls/pinch.
        zoomOnScroll={false}
        zoomOnPinch={true}
        connectionMode={CANVAS_CONFIG.connectionMode as any}
        connectionLineType={ConnectionLineType.SmoothStep}
        snapToGrid={CANVAS_CONFIG.snapToGrid}
        snapGrid={CANVAS_CONFIG.snapGrid}
        defaultMarkerColor={isDark ? '#1E2130' : EDGE_CONFIG.strokeColor}
        minZoom={CANVAS_CONFIG.minZoom}
        maxZoom={CANVAS_CONFIG.maxZoom}
        defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
      >
        <Background 
          variant={CANVAS_CONFIG.background.variant as any} 
          gap={CANVAS_CONFIG.background.gap} 
          size={CANVAS_CONFIG.background.size}
          color={isDark ? '#475569' : CANVAS_CONFIG.background.color}
          style={{ opacity: isDark ? 0.6 : 0.4 }}
        />
        <Controls showInteractive={false} className={`!shadow-sm ${isDark ? '!bg-[#1E2235] !border-gray-800 !text-white' : '!bg-white !border-gray-200 !text-gray-800'}`} />
        <SVGEdgeMarkerDefs />
        <GuideLines />
        
        <EdgeLabelRenderer>
          {pendingLabelEdgeId && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-auto bg-background/95 backdrop-blur-sm p-4 rounded-xl shadow-xl border border-border flex flex-col gap-3 w-[90vw] max-w-[300px]">
              <div className="text-sm font-medium">Edit Edge Label</div>
              <input
                ref={labelInputRef}
                value={labelDraft}
                onChange={(e) => setLabelDraft(e.target.value)}
                onBlur={handleLabelSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleLabelSubmit();
                  if (e.key === 'Escape') setPendingLabelEdgeId(null);
                  e.stopPropagation();
                }}
                className="w-full px-3 py-2 text-sm bg-secondary rounded-lg outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="e.g. calls API, sends data"
              />
            </div>
          )}
        </EdgeLabelRenderer>
      </ReactFlow>

      {contextMenu && (
        <ContextMenu
          menu={contextMenu}
          onClose={() => setContextMenu(null)}
        />
      )}

      {selectedNodeIds.length >= 1 && (
        <div className="absolute bottom-24 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="px-3 py-1.5 rounded-lg border border-border/40 bg-card/90 backdrop-blur-sm text-xs text-muted-foreground shadow-sm">
            Drag to select • Cmd/Ctrl+G to group
          </div>
        </div>
      )}

      {/* Floating UI Elements */}
      <div className="absolute top-[calc(env(safe-area-inset-top,0px)+64px)] sm:top-4 left-2 sm:left-4 z-10 flex flex-col gap-2">
        <button
          onClick={() => setShowShortcuts(true)}
          className="p-1.5 sm:p-2 bg-white/80 dark:bg-[#1E2235]/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:bg-white dark:hover:bg-[#1E2235] transition-colors"
          title="Keyboard Shortcuts"
        >
          <MousePointer2 className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-gray-600 dark:text-gray-400" />
        </button>
        <button
          onClick={() => setTemplatesOpen(true)}
          className="p-1.5 sm:p-2 bg-white/80 dark:bg-[#1E2235]/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:bg-white dark:hover:bg-[#1E2235] transition-colors"
          title="Templates"
        >
          <LayoutTemplate className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      <KeyboardShortcutsModal open={showShortcuts} onOpenChange={(open) => setShowShortcuts(open)} />
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
