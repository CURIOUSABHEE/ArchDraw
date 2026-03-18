'use client';

import { useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import ReactFlow, {
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  type NodeTypes,
  type NodeProps,
  Handle,
  Position,
  ConnectionLineType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { NodeIcon } from '@/components/NodeIcon';

// ── Lightweight hero node — same visual design as SystemNode, no store dependency ──

interface HeroNodeData {
  label: string;
  icon: string;
  color: string;
  category: string;
}

const HeroNode = memo(function HeroNode({ data }: NodeProps<HeroNodeData>) {
  return (
    <div className="relative group" style={{
      width: 120,
      borderRadius: 12,
      background: 'hsl(215 28% 17%)',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 1px 3px -1px rgba(0,0,0,0.4)',
      cursor: 'grab',
    }}>
      {/* Shine overlay — required by rules */}
      <div className="absolute inset-0 rounded-[inherit] pointer-events-none z-10 bg-gradient-to-br from-white/10 via-white/[0.03] to-transparent group-hover:from-white/[0.15] group-hover:via-white/[0.06] transition-all duration-300" />
      <Handle type="target" position={Position.Left} style={{ width: 7, height: 7, background: 'hsl(215 28% 17%)', border: '2px solid rgba(255,255,255,0.2)', borderRadius: '50%' }} />
      <Handle type="source" position={Position.Right} style={{ width: 7, height: 7, background: 'hsl(215 28% 17%)', border: '2px solid rgba(255,255,255,0.2)', borderRadius: '50%' }} />
      <div className="flex flex-col items-center gap-1.5 px-3 py-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: data.color + '20' }}>
          <NodeIcon fallbackIcon={data.icon} fallbackColor={data.color} size={18} />
        </div>
        <span className="text-[11px] font-medium text-slate-200 text-center leading-tight max-w-[100px] truncate">{data.label}</span>
        <span className="text-[9px] text-slate-500">{data.category}</span>
      </div>
    </div>
  );
});

const nodeTypes: NodeTypes = { heroNode: HeroNode };

// ── Curated 8-node subset of ChatGPT architecture ──

const HERO_NODES = [
  { id: 'h_client',  type: 'heroNode', position: { x: 0,   y: 80  }, data: { label: 'Client',         icon: 'Monitor',      color: '#6366f1', category: 'Entry'     } },
  { id: 'h_apigw',   type: 'heroNode', position: { x: 160, y: 80  }, data: { label: 'API Gateway',    icon: 'Webhook',      color: '#6366f1', category: 'Gateway'   } },
  { id: 'h_auth',    type: 'heroNode', position: { x: 320, y: 0   }, data: { label: 'Auth Service',   icon: 'Shield',       color: '#8b5cf6', category: 'Security'  } },
  { id: 'h_chat',    type: 'heroNode', position: { x: 320, y: 160 }, data: { label: 'Chat Service',   icon: 'Boxes',        color: '#3b82f6', category: 'Compute'   } },
  { id: 'h_llm',     type: 'heroNode', position: { x: 480, y: 80  }, data: { label: 'LLM API',        icon: 'Brain',        color: '#ec4899', category: 'AI / ML'   } },
  { id: 'h_rag',     type: 'heroNode', position: { x: 480, y: 240 }, data: { label: 'RAG Pipeline',   icon: 'GitMerge',     color: '#ec4899', category: 'AI / ML'   } },
  { id: 'h_vector',  type: 'heroNode', position: { x: 640, y: 160 }, data: { label: 'Vector DB',      icon: 'Cpu',          color: '#ec4899', category: 'Storage'   } },
  { id: 'h_nosql',   type: 'heroNode', position: { x: 640, y: 320 }, data: { label: 'NoSQL DB',       icon: 'Leaf',         color: '#334155', category: 'Storage'   } },
];

const HERO_EDGES = [
  { id: 'he1', source: 'h_client', target: 'h_apigw',  type: 'default', animated: true, style: { strokeWidth: 1.5, stroke: '#94a3b8' } },
  { id: 'he2', source: 'h_apigw',  target: 'h_auth',   type: 'default', animated: true, style: { strokeWidth: 1.5, stroke: '#94a3b8' } },
  { id: 'he3', source: 'h_apigw',  target: 'h_chat',   type: 'default', animated: true, style: { strokeWidth: 1.5, stroke: '#94a3b8' } },
  { id: 'he4', source: 'h_chat',   target: 'h_llm',    type: 'default', animated: true, style: { strokeWidth: 1.5, stroke: '#94a3b8' } },
  { id: 'he5', source: 'h_chat',   target: 'h_rag',    type: 'default', animated: true, style: { strokeWidth: 1.5, stroke: '#94a3b8' } },
  { id: 'he6', source: 'h_rag',    target: 'h_llm',    type: 'default', animated: true, style: { strokeWidth: 1.5, stroke: '#94a3b8' } },
  { id: 'he7', source: 'h_rag',    target: 'h_vector', type: 'default', animated: true, style: { strokeWidth: 1.5, stroke: '#94a3b8' } },
  { id: 'he8', source: 'h_chat',   target: 'h_nosql',  type: 'default', animated: true, style: { strokeWidth: 1.5, stroke: '#94a3b8' } },
];

// ── Hero ──────────────────────────────────────────────────────────────────────

export function Hero() {
  const router = useRouter();
  const [nodes, , onNodesChange] = useNodesState(HERO_NODES);
  const [edges, , onEdgesChange] = useEdgesState(HERO_EDGES);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden py-20 lg:py-0 bg-white">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left: copy */}
          <div className="space-y-8">
            {/* Beta badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs font-bold text-indigo-600 tracking-wide uppercase">Now in Beta · Free to use</span>
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-[3.5rem] leading-[1.1] font-extrabold text-slate-900 tracking-tight">
                Design Systems,{' '}
                <br />
                <span className="text-indigo-600">Not Documents</span>
              </h1>
              <p className="text-lg lg:text-xl text-slate-600 max-w-xl leading-relaxed">
                ArchFlow is a visual canvas for building production-ready system architecture diagrams. Drag, connect, and think in systems.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 items-center">
              <button
                onClick={() => router.push('/editor')}
                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-lg shadow-indigo-200 transition-all duration-200 hover:-translate-y-0.5"
              >
                Start designing free →
              </button>
              <button
                onClick={() => document.getElementById('templates')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 bg-transparent hover:bg-slate-100 text-slate-700 font-semibold rounded-lg transition-colors duration-200"
              >
                View templates
              </button>
            </div>

            <p className="text-sm text-slate-400 font-medium">No account needed · 150+ components · Free forever</p>

            {/* Stats */}
            <div className="pt-8 border-t border-slate-200">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {[['150+', 'Components'], ['10+', 'Templates'], ['∞', 'Canvas Size'], ['Ready', 'Export']].map(([val, label]) => (
                  <div key={label} className="flex flex-col">
                    <span className="text-2xl font-bold text-slate-900">{val}</span>
                    <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: interactive canvas mockup */}
          <div className="relative lg:h-[520px] flex items-center justify-center">
            {/* Glow */}
            <div className="absolute -z-10 w-2/3 h-2/3 bg-indigo-500/10 blur-[100px] rounded-full" />

            {/* Browser chrome */}
            <div className="w-full h-[460px] rounded-xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col bg-slate-900">
              {/* macOS title bar */}
              <div className="h-9 bg-slate-800 flex items-center px-4 gap-2 border-b border-slate-700 shrink-0">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                </div>
                <div className="mx-auto text-[10px] text-slate-400 font-medium tracking-wide">Archflow — ChatGPT Architecture</div>
                <div className="text-[9px] text-indigo-400 font-medium px-2 py-0.5 bg-indigo-500/10 rounded-full border border-indigo-500/20">Interactive</div>
              </div>

              {/* ReactFlow canvas */}
              <div className="flex-1 relative">
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  nodeTypes={nodeTypes}
                  fitView
                  fitViewOptions={{ padding: 0.2 }}
                  nodesDraggable={true}
                  nodesConnectable={false}
                  elementsSelectable={true}
                  deleteKeyCode={null}
                  panOnDrag={true}
                  zoomOnScroll={true}
                  zoomOnPinch={true}
                  zoomOnDoubleClick={false}
                  minZoom={0.4}
                  maxZoom={1.5}
                  snapToGrid={true}
                  snapGrid={[20, 20]}
                  connectionLineType={ConnectionLineType.Bezier}
                  defaultEdgeOptions={{ type: 'default', animated: true, style: { strokeWidth: 1.5, stroke: '#94a3b8' } }}
                  proOptions={{ hideAttribution: true }}
                  style={{ background: 'transparent' }}
                >
                  <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#334155" />
                </ReactFlow>

                {/* Hint overlay */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700 pointer-events-none">
                  Drag nodes to rearrange · Scroll to zoom
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
