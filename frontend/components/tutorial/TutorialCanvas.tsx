'use client';

import { useCallback, DragEvent, useState, useEffect, useRef } from 'react';
import ReactFlow, {
  Background, BackgroundVariant, Controls,
  ReactFlowProvider, useReactFlow,
  ConnectionLineType,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type NodeProps,
  type Node,
  type Edge,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { addEdge, applyNodeChanges, applyEdgeChanges } from 'reactflow';
import { Search, RotateCcw, SkipForward, BookOpen, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { SystemNode } from '@/components/SystemNode';
import type { NodeData } from '@/store/diagramStore';
import { ShapeNode } from '@/components/ShapeNode';
import { GroupNode } from '@/components/GroupNode';
import { TextLabelNode } from '@/components/TextLabelNode';
import { AnnotationNode } from '@/components/AnnotationNode';
import { MessageBrokerNode } from '@/components/MessageBrokerNode';
import { BaseNode, DatabaseNode, CacheNode } from '@/components/nodes';
import { FlowEdge } from '@/components/edges/FlowEdge';
import { useTutorialStore, sanitizeNode, sanitizeEdge } from '@/store/tutorialStore';

const EDGE_TYPES = {
  custom: FlowEdge,
};
import { ComponentPalette } from '@/components/tutorial/ComponentPalette';
import { NodeTooltip } from '@/components/tutorial/NodeTooltip';
import components from '@/data/components.json';
import { COMPONENT_TOOLTIPS } from '@/data/componentTooltips';
import { TUTORIALS } from '@/data/tutorials';

type ComponentEntry = { id: string; label: string; category: string; color: string; description?: string };
const componentMap = new Map<string, ComponentEntry>(
  (components as ComponentEntry[]).map((c) => [c.label.toLowerCase(), c])
);

function findComponentMeta(label: string): ComponentEntry | undefined {
  const key = label.toLowerCase();
  if (componentMap.has(key)) return componentMap.get(key);
  // fuzzy: find first entry whose label contains the node label or vice versa
  for (const [k, v] of componentMap) {
    if (k.includes(key) || key.includes(k)) return v;
  }
  return undefined;
}

function TutorialSystemNodeWrapper(props: NodeProps<NodeData>) {
  const meta = findComponentMeta(props.data.label ?? '');
  const [isHighlighted, setIsHighlighted] = useState<'source' | 'target' | null>(null);
  
  const nodeLabel = props.data.label ?? '';
  const richTooltip = COMPONENT_TOOLTIPS[nodeLabel];
  
  useEffect(() => {
    const checkHighlight = () => {
      const requiredFrom = (window as Window & { __tutorialRequiredFrom?: string }).__tutorialRequiredFrom;
      const requiredTo = (window as Window & { __tutorialRequiredTo?: string }).__tutorialRequiredTo;
      const nodeLabelLower = (props.data.label ?? '').toLowerCase().trim();
      
      if (requiredFrom && nodeLabelLower.includes(requiredFrom.toLowerCase())) {
        setIsHighlighted('source');
      } else if (requiredTo && nodeLabelLower.includes(requiredTo.toLowerCase())) {
        setIsHighlighted('target');
      } else {
        setIsHighlighted(null);
      }
    };
    
    checkHighlight();
    const interval = setInterval(checkHighlight, 500);
    return () => clearInterval(interval);
  }, [props.data.label]);

  return (
    <NodeTooltip
      label={nodeLabel}
      description={meta?.description}
      category={props.data.category}
      color={props.data.color ?? meta?.color}
      role={richTooltip?.role}
      whyItMatters={richTooltip?.whyItMatters}
      realWorldFact={richTooltip?.realWorldFact}
      tradeoff={richTooltip?.tradeoff}
      interviewTip={richTooltip?.interviewTip}
      concepts={richTooltip?.concepts}
    >
      <div 
        className={`${isHighlighted === 'source' ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-white' : ''} ${isHighlighted === 'target' ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-white' : ''} rounded-lg transition-all duration-300`}
        style={{
          boxShadow: isHighlighted === 'source' ? '0 0 20px rgba(99,102,241,0.4), inset 0 0 15px rgba(99,102,241,0.1)' : 
                     isHighlighted === 'target' ? '0 0 20px rgba(16,185,129,0.4), inset 0 0 15px rgba(16,185,129,0.1)' : 'none',
        }}
      >
        <SystemNode {...props} />
      </div>
    </NodeTooltip>
  );
}

const NODE_TYPES = {
  systemNode:        TutorialSystemNodeWrapper,
  baseNode:          BaseNode,
  databaseNode:     DatabaseNode,
  cacheNode:         CacheNode,
  shapeNode:         ShapeNode,
  groupNode:         GroupNode,
  textLabelNode:     TextLabelNode,
  annotationNode:    AnnotationNode,
  messageBrokerNode: MessageBrokerNode,
};

interface TutorialCanvasInnerProps {
  theme: 'dark' | 'light';
  tutorialId: string;
  tutorialTitle?: string;
  currentStep?: number;
  totalSteps?: number;
  currentLevel?: number;
  totalLevels?: number;
  onRestart?: () => void;
  onSkip?: () => void;
}

function TutorialCanvasInner({ 
  theme, 
  tutorialId, 
  tutorialTitle,
  currentStep = 1,
  totalSteps = 1,
  currentLevel,
  totalLevels,
  onRestart,
  onSkip,
}: TutorialCanvasInnerProps) {
  const isDark = theme === 'dark';
  const canvasBg = isDark ? '#0f172a' : '#f8fafc';
  const dotColor = isDark ? '#334155' : '#cbd5e1';
  const emptyIconBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
  const emptyIconBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const emptyTextPrimary = isDark ? 'text-slate-400' : 'text-slate-500';
  const emptyTextSecondary = isDark ? 'text-slate-600' : 'text-slate-400';
  const kbdStyle = isDark
    ? 'bg-white/[0.08] text-slate-400 border-white/10'
    : 'bg-black/[0.06] text-slate-500 border-black/10';
  const controlsClass = isDark
    ? '!bg-[#0d1117]/90 !backdrop-blur-sm !border !border-white/10 !rounded-lg [&>button]:!border-0 [&>button]:!border-b [&>button]:!border-white/10 [&>button:hover]:!bg-white/5'
    : '!bg-white/90 !backdrop-blur-sm !border !border-black/10 !rounded-lg [&>button]:!border-0 [&>button]:!border-b [&>button]:!border-black/10 [&>button]:hover:!bg-black/5';
  const { nodes, edges, setNodes, setEdges, setTutorialNodes, setTutorialEdges, saveProgress, getProgress, hasHydrated, isSwitchingTutorial, tutorialProgress, completedTutorials } = useTutorialStore();
  const reactFlowInstance = useReactFlow();
  const [isMac, setIsMac] = useState(false);
  const [paletteForceOpen, setPaletteForceOpen] = useState(false);
  const [paletteInitialQuery, setPaletteInitialQuery] = useState('');
  const restoredRef = useRef(false);
  const canvasSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().includes('MAC'));
  }, []);

  // Restore canvas from richProgress on mount and when tutorialId changes.
  // tutorialId comes from the URL — always correct, never stale.
  useEffect(() => {
    if (!hasHydrated) return;
    if (!tutorialId) return;
    restoredRef.current = false;

    const progress = getProgress(tutorialId);
    const savedNodes = progress?.canvasNodes as Node[] | undefined;
    const savedEdges = progress?.canvasEdges as Edge[] | undefined;

    if (savedNodes && savedNodes.length > 0) {
      setNodes(savedNodes as unknown as Node[]);
      setEdges((savedEdges ?? []) as unknown as Edge[]);
      setTutorialNodes(savedNodes as unknown as Node[]);
      setTutorialEdges((savedEdges ?? []) as unknown as Edge[]);
      toast.success('Canvas restored', { duration: 2000, position: 'bottom-center' });
      setTimeout(() => reactFlowInstance.fitView({ maxZoom: 0.7 }), 100);
    }
    restoredRef.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated, tutorialId, getProgress]);

  // Save canvas nodes/edges to richProgress on change (debounced 1s).
  // Uses tutorialId from URL — never the store's activeTutorialId.
  useEffect(() => {
    if (!tutorialId) return;
    if (isSwitchingTutorial) return;
    if (canvasSaveTimerRef.current) clearTimeout(canvasSaveTimerRef.current);
    canvasSaveTimerRef.current = setTimeout(() => {
      saveProgress(tutorialId, {
        canvasNodes: nodes.map(sanitizeNode),
        canvasEdges: edges.map(sanitizeEdge),
      });
    }, 1000);
    return () => {
      if (canvasSaveTimerRef.current) clearTimeout(canvasSaveTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, tutorialId, saveProgress, isSwitchingTutorial]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const updated = applyNodeChanges(changes, nodes);
      setNodes(updated);
      setTutorialNodes(updated);
    },
    [nodes, setNodes, setTutorialNodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const updated = applyEdgeChanges(changes, edges);
      setEdges(updated);
      setTutorialEdges(updated);
    },
    [edges, setEdges, setTutorialEdges]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const newEdges = addEdge(
        {
          ...connection,
          id: `edge-${Date.now()}`,
          type: 'default',
          animated: true,
          style: { stroke: '#94a3b8', strokeWidth: '1.5px' },
        },
        edges
      );
      setEdges(newEdges);
      setTutorialEdges(newEdges);
    },
    [edges, setEdges, setTutorialEdges]
  );

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      const raw = e.dataTransfer.getData('application/archdraw');
      if (!raw) return;
      const comp = JSON.parse(raw);
      const position = reactFlowInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const id = `${comp.id}-${Date.now()}`;
      const updated = [
        {
          id,
          type: 'systemNode',
          position,
          data: {
            label: comp.label,
            componentId: comp.id,
            category: comp.category,
            color: comp.color,
            icon: comp.icon,
            technology: comp.technology,
          },
        },
      ];
      setNodes(updated);
      setTutorialNodes(updated);
      setTutorialEdges([]);
    },
    [setNodes, setTutorialNodes, setTutorialEdges, reactFlowInstance]
  );

  const handleAddComponent = useCallback(
    (component: { id: string; label: string; category: string; color: string; icon?: string }) => {
      const { x, y, zoom } = reactFlowInstance.getViewport();
      const bounds = document.querySelector('.react-flow__renderer')?.getBoundingClientRect();
      const centerX = bounds ? (bounds.width / 2 - x) / zoom : 400;
      const centerY = bounds ? (bounds.height / 2 - y) / zoom : 300;

      const newNode = {
        id: `${component.id}-${Date.now()}`,
        type: 'systemNode' as const,
        position: {
          x: centerX + (Math.random() * 60 - 30),
          y: centerY + (Math.random() * 60 - 30),
        },
        data: {
          label: component.label,
          componentId: component.id,
          category: component.category,
          color: component.color,
          icon: component.icon,
        },
      };

      const updated = [...nodes, newNode];
      setNodes(updated);
      setTutorialNodes(updated);
      toast.success(`Added ${component.label}`, { duration: 1500, position: 'bottom-center' });
    },
    [nodes, setNodes, setTutorialNodes, reactFlowInstance]
  );

  // Exposed so GuidePanel search hint can open palette with a pre-filled query
  const openPaletteWithQuery = useCallback((q: string) => {
    setPaletteInitialQuery(q);
    setPaletteForceOpen(true);
  }, []);

  // Expose to window so GuidePanel (sibling) can call it
  useEffect(() => {
    (window as Window & { __tutorialOpenPalette?: typeof openPaletteWithQuery }).__tutorialOpenPalette = openPaletteWithQuery;
    return () => { delete (window as Window & { __tutorialOpenPalette?: typeof openPaletteWithQuery }).__tutorialOpenPalette; };
  }, [openPaletteWithQuery]);

  const progress = tutorialProgress[tutorialId] ?? 0;
  const isCompleted = completedTutorials.includes(tutorialId);
  const progressPercent = totalSteps > 0 ? Math.round((currentStep / totalSteps) * 100) : 0;

  return (
    <div className="flex-1 relative flex flex-col">
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDragOver={onDragOver}
          onDrop={onDrop}
          nodeTypes={NODE_TYPES}
          edgeTypes={EDGE_TYPES}
          snapToGrid
          snapGrid={[20, 20]}
          minZoom={0.1}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
          fitView
          fitViewOptions={{ maxZoom: 0.7 }}
          proOptions={{ hideAttribution: true }}
          connectionLineType={ConnectionLineType.SmoothStep}
          style={{ background: canvasBg }}
          defaultEdgeOptions={{
            type: 'custom',
            animated: true,
            data: { connectionType: 'smooth', edgeType: 'sync', pathType: 'Smoothstep' },
            style: { stroke: '#94a3b8', strokeWidth: '1.5px' },
          }}
          deleteKeyCode={['Backspace', 'Delete', 'Meta+Backspace']}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} color={dotColor} style={{ backgroundColor: canvasBg }} />
          <Controls
            showInteractive={false}
            className={controlsClass}
          />
        </ReactFlow>

        {nodes.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none z-10">
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: emptyIconBg, border: `1px solid ${emptyIconBorder}` }}
              >
                <Search className={`w-5 h-5 ${emptyTextSecondary}`} />
              </div>
              <div className="text-center">
                <p className={`${emptyTextPrimary} text-sm font-medium mb-1`}>Follow the guide on the left</p>
                <p className={`${emptyTextSecondary} text-xs`}>
                  Press{' '}
                  <kbd className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${kbdStyle}`}>
                    {isMac ? '⌘' : 'Ctrl'}
                  </kbd>
                  {' + '}
                  <kbd className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${kbdStyle}`}>
                    K
                  </kbd>
                  {' '}to search and add components
                </p>
              </div>
            </div>
          </div>
        )}

        <div 
          className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg text-xs z-10"
          style={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(0,0,0,0.08)', color: '#64748b' }}
        >
          <span>Press</span>
          <kbd className="mx-1 px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: 'rgba(0,0,0,0.06)' }}>Delete</kbd>
          <span>or</span>
          <kbd className="mx-1 px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: 'rgba(0,0,0,0.06)' }}>Backspace</kbd>
          <span>to remove nodes</span>
        </div>
      </div>

      <ComponentPalette
        onAddComponent={handleAddComponent}
        initialQuery={paletteInitialQuery}
        forceOpen={paletteForceOpen}
        onClose={() => setPaletteForceOpen(false)}
      />
    </div>
  );
}

interface TutorialCanvasProps {
  theme?: 'dark' | 'light';
  tutorialId: string;
  tutorialTitle?: string;
  currentStep?: number;
  totalSteps?: number;
  currentLevel?: number;
  totalLevels?: number;
  onRestart?: () => void;
  onSkip?: () => void;
}

export function TutorialCanvas({ 
  theme = 'dark', 
  tutorialId,
  tutorialTitle,
  currentStep,
  totalSteps,
  currentLevel,
  totalLevels,
  onRestart,
  onSkip,
}: TutorialCanvasProps) {
  return (
    <ReactFlowProvider>
      <TutorialCanvasInner 
        theme={theme} 
        tutorialId={tutorialId}
        tutorialTitle={tutorialTitle}
        currentStep={currentStep}
        totalSteps={totalSteps}
        currentLevel={currentLevel}
        totalLevels={totalLevels}
        onRestart={onRestart}
        onSkip={onSkip}
      />
    </ReactFlowProvider>
  );
}
