import ReactFlow, { Background, Controls, MiniMap, useReactFlow, ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import { useDiagramStore } from '@/store/diagramStore';
import { SystemNode } from '@/components/SystemNode';
import { useMemo, useCallback, DragEvent } from 'react';

/** Inner canvas with access to useReactFlow for coordinate conversion */
function CanvasInner() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useDiagramStore();
  const reactFlowInstance = useReactFlow();
  const nodeTypes = useMemo(() => ({ systemNode: SystemNode }), []);

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  /** Handle drop from sidebar — place node at exact cursor position */
  const onDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('application/archdraw');
    if (!raw) return;

    const comp = JSON.parse(raw);
    const position = reactFlowInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY });
    const id = `${comp.id}-${Date.now()}`;

    useDiagramStore.setState((state) => ({
      nodes: [
        ...state.nodes,
        { id, type: 'systemNode', position, data: { label: comp.label, category: comp.category } },
      ],
    }));
  }, [reactFlowInstance]);

  return (
    <div className="flex-1 relative bg-muted">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        onDragOver={onDragOver}
        onDrop={onDrop}
        fitView
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          animated: true,
          type: 'smoothstep',
          style: { stroke: '#94a3b8', strokeWidth: 2 },
        }}
      >
        <Background color="#cbd5e1" gap={20} size={1} />
        <Controls />
        <MiniMap
          nodeStrokeWidth={3}
          className="!bg-card !border-none !rounded-lg !shadow-lg"
          maskColor="rgba(0,0,0,0.08)"
        />
      </ReactFlow>

      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-muted-foreground text-sm font-medium">
              Drag or click a component from the sidebar to start building
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/** Wrapped with ReactFlowProvider so useReactFlow is available */
export function Canvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}
