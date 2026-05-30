'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import ReactFlow, {
  Background, BackgroundVariant, useNodesState, useEdgesState, ReactFlowProvider, type NodeTypes,
  type Node, type Edge, applyNodeChanges, type NodeChange,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { HeroNode } from './HeroNode';
import { assignEdgeColors } from '@/lib/edgeColors';

const nodeTypes: NodeTypes = { heroNode: HeroNode };

const ES = { 
  stroke: '#6B7280', 
  strokeWidth: '1.5px', 
  strokeOpacity: 0.7,
  strokeDasharray: '6 4',
  style: { animation: 'dash 0.8s linear infinite' },
};

import { createNode, createEdge } from '@/lib/factory';

const initialNodes: Node[] = [
  createNode('heroNode', 'Web', { x: 0, y: 140 }, { id: 'client_web', data: { category: 'Entry', icon: 'Monitor', color: '#5A5A5A' } }),
  createNode('heroNode', 'API Gateway', { x: 160, y: 140 }, { id: 'api-gateway', data: { category: 'Gateway', icon: 'Webhook', color: '#5A5A5A' } }),
  createNode('heroNode', 'Auth Service', { x: 340, y: 60 }, { id: 'auth-service', data: { category: 'Security', icon: 'Shield', color: '#5A5A5A' } }),
  createNode('heroNode', 'Chat Service', { x: 340, y: 200 }, { id: 'chat-service', data: { category: 'Compute', icon: 'Boxes', color: '#3b82f6' } }),
  createNode('heroNode', 'LLM API', { x: 540, y: 50 }, { id: 'llm-api', data: { category: 'AI / ML', icon: 'Brain', color: '#ec4899' } }),
  createNode('heroNode', 'RAG Pipeline', { x: 540, y: 200 }, { id: 'rag-pipeline', data: { category: 'AI / ML', icon: 'GitMerge', color: '#ec4899' } }),
  createNode('heroNode', 'Vector DB', { x: 740, y: 80 }, { id: 'vector-db', data: { category: 'Storage', icon: 'Cpu', color: '#ec4899' } }),
  createNode('heroNode', 'NoSQL DB', { x: 740, y: 260 }, { id: 'nosql-db', data: { category: 'Storage', icon: 'Leaf', color: '#334155' } }),
];

const initialEdges: Edge[] = [
  createEdge('client_web', 'api-gateway', '', { id: 'e1', sourceHandle: 'right', targetHandle: 'left', type: 'default', animated: true, style: ES }),
  createEdge('api-gateway', 'auth-service', '', { id: 'e2', sourceHandle: 'right', targetHandle: 'left', type: 'default', animated: true, style: ES }),
  createEdge('api-gateway', 'chat-service', '', { id: 'e3', sourceHandle: 'right', targetHandle: 'left', type: 'default', animated: true, style: ES }),
  createEdge('chat-service', 'llm-api', '', { id: 'e4', sourceHandle: 'right', targetHandle: 'left', type: 'default', animated: true, style: ES }),
  createEdge('chat-service', 'rag-pipeline', '', { id: 'e5', sourceHandle: 'right', targetHandle: 'left', type: 'default', animated: true, style: ES }),
  createEdge('rag-pipeline', 'vector-db', '', { id: 'e6', sourceHandle: 'right', targetHandle: 'left', type: 'default', animated: true, style: ES }),
  createEdge('rag-pipeline', 'nosql-db', '', { id: 'e7', sourceHandle: 'bottom', targetHandle: 'top', type: 'default', animated: true, style: ES }),
  createEdge('llm-api', 'vector-db', '', { id: 'e8', sourceHandle: 'right', targetHandle: 'left', type: 'default', animated: true, style: ES }),
];

const animatedNodeIds = ['auth-service', 'llm-api', 'rag-pipeline'];

function HeroCanvasContent() {
  const [nodes, setNodes] = useNodesState(initialNodes);
  const [edges] = useEdgesState(initialEdges);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    [setNodes]
  );

  const coloredEdges = useMemo(() => assignEdgeColors(edges), [edges]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={coloredEdges}
      onNodesChange={onNodesChange}
      onEdgesChange={() => {}}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.15 }}
      nodesDraggable={true}
      nodesConnectable={false}
      elementsSelectable={true}
      panOnDrag={true}
      zoomOnScroll={false}
      zoomOnPinch={false}
      zoomOnDoubleClick={false}
      preventScrolling={false}
      elevateNodesOnSelect={false}
      onlyRenderVisibleElements={true}
      defaultEdgeOptions={{ type: 'default', style: ES }}
      proOptions={{ hideAttribution: true }}
      style={{ width: '100%', height: '100%', background: '#0f172a' }}
      onKeyDown={(e) => {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
        }
      }}
    >
      <Background variant={BackgroundVariant.Dots} gap={16} size={1.5} color="#475569" style={{ opacity: 0.6 }} />
    </ReactFlow>
  );
}

export default function HeroCanvas() {
  const [canvasKey, setCanvasKey] = useState(0);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setCanvasKey(k => k + 1);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return (
    <ReactFlowProvider>
      <div 
        style={{ 
          width: '100%', 
          height: '100%',
          background: '#0f172a',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        <HeroCanvasContent key={canvasKey} />
      </div>
    </ReactFlowProvider>
  );
}
