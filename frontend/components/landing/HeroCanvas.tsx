'use client';

import ReactFlow, {
  Background, BackgroundVariant, useNodesState, useEdgesState, type NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { HeroNode } from './HeroNode';

const nodeTypes: NodeTypes = { heroNode: HeroNode };

const ES = { stroke: '#6366f1', strokeWidth: 1.5, strokeOpacity: 0.7 };

const HERO_NODES = [
  { id: 'client',       type: 'heroNode', position: { x: 0,   y: 220 }, draggable: false, data: { label: 'Client',       category: 'Entry',    icon: 'Monitor',  color: '#6366f1' } },
  { id: 'api-gateway',  type: 'heroNode', position: { x: 200, y: 220 }, draggable: false, data: { label: 'API Gateway',  category: 'Gateway',  icon: 'Webhook',  color: '#6366f1' } },
  { id: 'auth-service', type: 'heroNode', position: { x: 420, y: 80  }, draggable: false, data: { label: 'Auth Service', category: 'Security', icon: 'Shield',   color: '#6366f1' } },
  { id: 'chat-service', type: 'heroNode', position: { x: 420, y: 280 }, draggable: false, data: { label: 'Chat Service', category: 'Compute',  icon: 'Boxes',    color: '#3b82f6' } },
  { id: 'llm-api',      type: 'heroNode', position: { x: 660, y: 60  }, draggable: false, data: { label: 'LLM API',      category: 'AI / ML',  icon: 'Brain',    color: '#ec4899' } },
  { id: 'rag-pipeline', type: 'heroNode', position: { x: 660, y: 280 }, draggable: false, data: { label: 'RAG Pipeline', category: 'AI / ML',  icon: 'GitMerge', color: '#ec4899' } },
  { id: 'vector-db',    type: 'heroNode', position: { x: 900, y: 100 }, draggable: false, data: { label: 'Vector DB',    category: 'Storage',  icon: 'Cpu',      color: '#ec4899' } },
  { id: 'nosql-db',     type: 'heroNode', position: { x: 900, y: 340 }, draggable: false, data: { label: 'NoSQL DB',     category: 'Storage',  icon: 'Leaf',     color: '#334155' } },
];

const HERO_EDGES = [
  { id: 'e1', source: 'client',       target: 'api-gateway',  sourceHandle: 'right',  targetHandle: 'left',  type: 'default', animated: true, style: ES },
  { id: 'e2', source: 'api-gateway',  target: 'auth-service', sourceHandle: 'right',  targetHandle: 'left',  type: 'default', animated: true, style: ES },
  { id: 'e3', source: 'api-gateway',  target: 'chat-service', sourceHandle: 'right',  targetHandle: 'left',  type: 'default', animated: true, style: ES },
  { id: 'e4', source: 'chat-service', target: 'llm-api',      sourceHandle: 'right',  targetHandle: 'left',  type: 'default', animated: true, style: ES },
  { id: 'e5', source: 'chat-service', target: 'rag-pipeline', sourceHandle: 'right',  targetHandle: 'left',  type: 'default', animated: true, style: ES },
  { id: 'e6', source: 'rag-pipeline', target: 'vector-db',    sourceHandle: 'right',  targetHandle: 'left',  type: 'default', animated: true, style: ES },
  { id: 'e7', source: 'rag-pipeline', target: 'nosql-db',     sourceHandle: 'bottom', targetHandle: 'top',   type: 'default', animated: true, style: ES },
  { id: 'e8', source: 'llm-api',      target: 'vector-db',    sourceHandle: 'right',  targetHandle: 'left',  type: 'default', animated: true, style: ES },
];

export default function HeroCanvas() {
  const [nodes, , onNodesChange] = useNodesState(HERO_NODES);
  const [edges, , onEdgesChange] = useEdgesState(HERO_EDGES);

  return (
    <ReactFlow
      nodes={nodes} edges={edges}
      onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      fitView fitViewOptions={{ padding: 0.3 }}
      nodesDraggable={false} nodesConnectable={false} elementsSelectable={false}
      panOnDrag={false} zoomOnScroll={false} zoomOnPinch={false}
      zoomOnDoubleClick={false} preventScrolling={false}
      elevateNodesOnSelect={false} onlyRenderVisibleElements={true}
      defaultEdgeOptions={{ type: 'default', animated: true, style: ES }}
      proOptions={{ hideAttribution: true }}
      style={{ background: '#0f172a', pointerEvents: 'none' }}
    >
      <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1e293b" />
    </ReactFlow>
  );
}
