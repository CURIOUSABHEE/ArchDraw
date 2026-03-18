'use client';

import { useCallback, DragEvent, useState, useEffect } from 'react';
import ReactFlow, {
  Background, BackgroundVariant, Controls,
  ReactFlowProvider, useReactFlow,
  ConnectionLineType,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { addEdge, applyNodeChanges, applyEdgeChanges } from 'reactflow';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { SystemNode } from '@/components/SystemNode';
import { ShapeNode } from '@/components/ShapeNode';
import { GroupNode } from '@/components/GroupNode';
import { TextLabelNode } from '@/components/TextLabelNode';
import { AnnotationNode } from '@/components/AnnotationNode';
import { useTutorialStore } from '@/store/tutorialStore';
import { ComponentPalette } from '@/components/tutorial/ComponentPalette';

const NODE_TYPES = {
  systemNode: SystemNode,
  shapeNode: ShapeNode,
  groupNode: GroupNode,
  textLabelNode: TextLabelNode,
  annotationNode: AnnotationNode,
};

function TutorialCanvasInner() {
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
    <div className="flex-1 relative" style={{ background: '#0f172a' }}>
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
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#94a3b8', strokeWidth: 1.5 },
        }}
        deleteKeyCode={null}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} color="#334155" />
        <Controls
          showInteractive={false}
          className="!bg-[#0d1117]/90 !backdrop-blur-sm !border !border-white/10 !rounded-lg [&>button]:!border-0 [&>button]:!border-b [&>button]:!border-white/10 [&>button:hover]:!bg-white/5"
        />
      </ReactFlow>

      {nodes.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
              <Search className="w-5 h-5 text-slate-500" />
            </div>
            <div className="text-center">
              <p className="text-slate-400 text-sm font-medium mb-1">Follow the guide on the left</p>
              <p className="text-slate-600 text-xs">
                Press{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] text-slate-400 text-[10px] font-mono border border-white/10">
                  {isMac ? '⌘' : 'Ctrl'}
                </kbd>
                {' + '}
                <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] text-slate-400 text-[10px] font-mono border border-white/10">
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

export function TutorialCanvas() {
  return (
    <ReactFlowProvider>
      <TutorialCanvasInner />
    </ReactFlowProvider>
  );
}
