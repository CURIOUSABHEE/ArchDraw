'use client';

import { useCallback, DragEvent, useState, useEffect } from 'react';
import ReactFlow, {
  Background, BackgroundVariant, Controls,
  ReactFlowProvider, useReactFlow,
  ConnectionLineType,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type NodeProps,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { addEdge, applyNodeChanges, applyEdgeChanges } from 'reactflow';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { SystemNode } from '@/components/SystemNode';
import type { NodeData } from '@/store/diagramStore';
import { ShapeNode } from '@/components/ShapeNode';
import { GroupNode } from '@/components/GroupNode';
import { TextLabelNode } from '@/components/TextLabelNode';
import { AnnotationNode } from '@/components/AnnotationNode';
import { useTutorialStore } from '@/store/tutorialStore';
import { ComponentPalette } from '@/components/tutorial/ComponentPalette';
import { NodeTooltip } from '@/components/tutorial/NodeTooltip';
import components from '@/data/components.json';

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
  return (
    <NodeTooltip
      label={props.data.label ?? ''}
      description={meta?.description}
      category={props.data.category}
      color={props.data.color ?? meta?.color}
    >
      <SystemNode {...props} />
    </NodeTooltip>
  );
}

const NODE_TYPES = {
  systemNode: TutorialSystemNodeWrapper,
  shapeNode: ShapeNode,
  groupNode: GroupNode,
  textLabelNode: TextLabelNode,
  annotationNode: AnnotationNode,
};

function TutorialCanvasInner({ theme }: { theme: 'dark' | 'light' }) {
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
    : '!bg-white/90 !backdrop-blur-sm !border !border-black/10 !rounded-lg [&>button]:!border-0 [&>button]:!border-b [&>button]:!border-black/10 [&>button:hover]:!bg-black/5';
  const { nodes, edges, setNodes, setEdges } = useTutorialStore();
  const reactFlowInstance = useReactFlow();
  const [isMac, setIsMac] = useState(false);
  const [paletteForceOpen, setPaletteForceOpen] = useState(false);
  const [paletteInitialQuery, setPaletteInitialQuery] = useState('');

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().includes('MAC'));
  }, []);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const filtered = changes.filter((c) => c.type !== 'remove');
      setNodes(applyNodeChanges(filtered, nodes));
    },
    [nodes, setNodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges(applyEdgeChanges(changes, edges));
    },
    [edges, setEdges]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const newEdges = addEdge(
        {
          ...connection,
          id: `edge-${Date.now()}`,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#94a3b8', strokeWidth: 1.5 },
        },
        edges
      );
      setEdges(newEdges);
    },
    [edges, setEdges]
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
      setNodes([
        ...nodes,
        {
          id,
          type: 'systemNode',
          position,
          data: {
            label: comp.label,
            category: comp.category,
            color: comp.color,
            icon: comp.icon,
            technology: comp.technology,
          },
        },
      ]);
    },
    [nodes, setNodes, reactFlowInstance]
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
          category: component.category,
          color: component.color,
          icon: component.icon,
        },
      };

      setNodes([...nodes, newNode]);
      toast.success(`Added ${component.label}`, { duration: 1500, position: 'bottom-center' });
    },
    [nodes, setNodes, reactFlowInstance]
  );

  // Exposed so GuidePanel search hint can open palette with a pre-filled query
  const openPaletteWithQuery = useCallback((q: string) => {
    setPaletteInitialQuery(q);
    setPaletteForceOpen(true);
  }, []);

  // Expose to window so GuidePanel (sibling) can call it
  useEffect(() => {
    (window as any).__tutorialOpenPalette = openPaletteWithQuery;
    return () => { delete (window as any).__tutorialOpenPalette; };
  }, [openPaletteWithQuery]);

  return (
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
        snapToGrid
        snapGrid={[20, 20]}
        minZoom={0.1}
        maxZoom={2}
        fitView
        proOptions={{ hideAttribution: true }}
        connectionLineType={ConnectionLineType.SmoothStep}
        style={{ background: canvasBg }}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#94a3b8', strokeWidth: 1.5 },
        }}
        deleteKeyCode={null}
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

      <ComponentPalette
        onAddComponent={handleAddComponent}
        initialQuery={paletteInitialQuery}
        forceOpen={paletteForceOpen}
        onClose={() => setPaletteForceOpen(false)}
      />
    </div>
  );
}

export function TutorialCanvas({ theme = 'dark' }: { theme?: 'dark' | 'light' }) {
  return (
    <ReactFlowProvider>
      <TutorialCanvasInner theme={theme} />
    </ReactFlowProvider>
  );
}
