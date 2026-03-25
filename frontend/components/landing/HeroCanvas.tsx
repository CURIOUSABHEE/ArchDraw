'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, {
  Background, BackgroundVariant, useNodesState, useEdgesState, ReactFlowProvider, type NodeTypes,
  type Node, type Edge, applyNodeChanges, type NodeChange,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { HeroNode } from './HeroNode';

const nodeTypes: NodeTypes = { heroNode: HeroNode };

const ES = { stroke: '#6366f1', strokeWidth: 1.5, strokeOpacity: 0.7 };

const initialNodes: Node[] = [
  { id: 'client_web',   type: 'heroNode', position: { x: 0,   y: 140 }, data: { label: 'Web',          category: 'Entry',    icon: 'Monitor',  color: '#6366f1' } },
  { id: 'api-gateway',  type: 'heroNode', position: { x: 160, y: 140 }, data: { label: 'API Gateway',  category: 'Gateway',  icon: 'Webhook',  color: '#6366f1' } },
  { id: 'auth-service', type: 'heroNode', position: { x: 340, y: 60  }, data: { label: 'Auth Service', category: 'Security', icon: 'Shield',   color: '#6366f1' } },
  { id: 'chat-service', type: 'heroNode', position: { x: 340, y: 200 }, data: { label: 'Chat Service', category: 'Compute',  icon: 'Boxes',    color: '#3b82f6' } },
  { id: 'llm-api',      type: 'heroNode', position: { x: 540, y: 50  }, data: { label: 'LLM API',      category: 'AI / ML',  icon: 'Brain',    color: '#ec4899' } },
  { id: 'rag-pipeline', type: 'heroNode', position: { x: 540, y: 200 }, data: { label: 'RAG Pipeline', category: 'AI / ML',  icon: 'GitMerge', color: '#ec4899' } },
  { id: 'vector-db',    type: 'heroNode', position: { x: 740, y: 80  }, data: { label: 'Vector DB',    category: 'Storage',  icon: 'Cpu',      color: '#ec4899' } },
  { id: 'nosql-db',     type: 'heroNode', position: { x: 740, y: 260 }, data: { label: 'NoSQL DB',     category: 'Storage',  icon: 'Leaf',     color: '#334155' } },
];

const initialEdges: Edge[] = [
  { id: 'e1', source: 'client_web',    target: 'api-gateway',  sourceHandle: 'right',  targetHandle: 'left',  type: 'default', animated: true, style: ES },
  { id: 'e2', source: 'api-gateway',  target: 'auth-service', sourceHandle: 'right',  targetHandle: 'left',  type: 'default', animated: true, style: ES },
  { id: 'e3', source: 'api-gateway',  target: 'chat-service', sourceHandle: 'right',  targetHandle: 'left',  type: 'default', animated: true, style: ES },
  { id: 'e4', source: 'chat-service', target: 'llm-api',      sourceHandle: 'right',  targetHandle: 'left',  type: 'default', animated: true, style: ES },
  { id: 'e5', source: 'chat-service', target: 'rag-pipeline', sourceHandle: 'right',  targetHandle: 'left',  type: 'default', animated: true, style: ES },
  { id: 'e6', source: 'rag-pipeline', target: 'vector-db',    sourceHandle: 'right',  targetHandle: 'left',  type: 'default', animated: true, style: ES },
  { id: 'e7', source: 'rag-pipeline', target: 'nosql-db',     sourceHandle: 'bottom', targetHandle: 'top',   type: 'default', animated: true, style: ES },
  { id: 'e8', source: 'llm-api',      target: 'vector-db',    sourceHandle: 'right',  targetHandle: 'left',  type: 'default', animated: true, style: ES },
];

const animatedNodeIds = ['auth-service', 'llm-api', 'rag-pipeline'];

function HeroCanvasContent() {
  const [nodes, setNodes] = useNodesState(initialNodes);
  const [edges] = useEdgesState(initialEdges);
  const gsapCtxRef = useRef<{ revert: () => void } | null>(null);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    [setNodes]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const initAnimations = async () => {
      const { gsap } = await import('gsap');

      timeoutId = setTimeout(() => {
        const nodeEls = document.querySelectorAll('.react-flow__node-heroNode');
        
        if (nodeEls.length === 0) return;

        gsapCtxRef.current = gsap.context(() => {
          nodeEls.forEach((nodeEl) => {
            const nodeId = (nodeEl as HTMLElement).getAttribute('data-id');
            if (nodeId && animatedNodeIds.includes(nodeId)) {
              const nodeIndex = animatedNodeIds.indexOf(nodeId);
              gsap.to(nodeEl, {
                y: -6,
                duration: 2.5,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
                delay: nodeIndex * 0.4,
              });
            }
          });
        });
      }, 100);
    };

    initAnimations();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      gsapCtxRef.current?.revert();
      gsapCtxRef.current = null;
    };
  }, []);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
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
      defaultEdgeOptions={{ type: 'default', animated: true, style: ES }}
      proOptions={{ hideAttribution: true }}
      style={{ width: '100%', height: '100%', background: '#0f172a' }}
      onKeyDown={(e) => {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
        }
      }}
    >
      <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#1e293b" />
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
