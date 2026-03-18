'use client';

import { useEffect, useRef, memo } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
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

const HERO_NODES = [
  { id: 'client',       type: 'heroNode', position: { x: 0,   y: 180 }, data: { label: 'Client',       icon: 'Monitor',  color: '#6366f1', category: 'Entry'    } },
  { id: 'api-gateway',  type: 'heroNode', position: { x: 220, y: 160 }, data: { label: 'API Gateway',  icon: 'Webhook',  color: '#6366f1', category: 'Gateway'  } },
  { id: 'auth-service', type: 'heroNode', position: { x: 460, y: 20  }, data: { label: 'Auth Service', icon: 'Shield',   color: '#8b5cf6', category: 'Security' } },
  { id: 'chat-service', type: 'heroNode', position: { x: 460, y: 240 }, data: { label: 'Chat Service', icon: 'Boxes',    color: '#3b82f6', category: 'Compute'  } },
  { id: 'llm-api',      type: 'heroNode', position: { x: 720, y: 20  }, data: { label: 'LLM API',      icon: 'Brain',    color: '#ec4899', category: 'AI / ML'  } },
  { id: 'rag-pipeline', type: 'heroNode', position: { x: 680, y: 260 }, data: { label: 'RAG Pipeline', icon: 'GitMerge', color: '#ec4899', category: 'AI / ML'  } },
  { id: 'vector-db',    type: 'heroNode', position: { x: 920, y: 130 }, data: { label: 'Vector DB',    icon: 'Cpu',      color: '#ec4899', category: 'Storage'  } },
  { id: 'nosql-db',     type: 'heroNode', position: { x: 920, y: 360 }, data: { label: 'NoSQL DB',     icon: 'Leaf',     color: '#334155', category: 'Storage'  } },
];

const HERO_EDGES = [
  { id: 'e1', source: 'client',       target: 'api-gateway',  type: 'smoothstep', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5, strokeDasharray: '5,5' } },
  { id: 'e2', source: 'api-gateway',  target: 'auth-service', type: 'smoothstep', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5, strokeDasharray: '5,5' } },
  { id: 'e3', source: 'api-gateway',  target: 'chat-service', type: 'smoothstep', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5, strokeDasharray: '5,5' } },
  { id: 'e4', source: 'chat-service', target: 'llm-api',      type: 'smoothstep', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5, strokeDasharray: '5,5' } },
  { id: 'e5', source: 'chat-service', target: 'rag-pipeline', type: 'smoothstep', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5, strokeDasharray: '5,5' } },
  { id: 'e6', source: 'rag-pipeline', target: 'vector-db',    type: 'smoothstep', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5, strokeDasharray: '5,5' } },
  { id: 'e7', source: 'rag-pipeline', target: 'nosql-db',     type: 'smoothstep', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5, strokeDasharray: '5,5' } },
  { id: 'e8', source: 'llm-api',      target: 'vector-db',    type: 'smoothstep', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5, strokeDasharray: '5,5' } },
];

const HEADLINE = ['Design', 'Systems,', 'Not', 'Documents.'];

export function Hero() {
  const router = useRouter();
  const [nodes, , onNodesChange] = useNodesState(HERO_NODES);
  const [edges, , onEdgesChange] = useEdgesState(HERO_EDGES);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const tl = gsap.timeline({ delay: 0.3 });

    tl.fromTo('.hero-badge',
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
    )
    .fromTo('.hero-word',
      { opacity: 0, y: 80, rotateX: -40 },
      { opacity: 1, y: 0, rotateX: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out', transformOrigin: 'top center' },
      '-=0.2'
    )
    .fromTo('.hero-sub',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
      '-=0.4'
    )
    .fromTo('.hero-cta',
      { opacity: 0, y: 20, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.1, ease: 'back.out(1.4)' },
      '-=0.3'
    )
    .fromTo('.hero-stat',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.08 },
      '-=0.2'
    )
    .fromTo('.hero-canvas',
      { opacity: 0, x: 80, scale: 0.95 },
      { opacity: 1, x: 0, scale: 1, duration: 1.2, ease: 'power3.out' },
      0.3
    );

    // Floating animation on canvas
    gsap.to('.hero-canvas', {
      y: -10,
      duration: 3,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });

    return () => { tl.kill(); gsap.killTweensOf('.hero-canvas'); };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden py-24 lg:py-0"
      style={{ backgroundColor: '#080c14' }}
    >
      {/* Background effects */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.12),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/8 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-violet-500/6 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left: copy */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="hero-badge inline-flex items-center gap-2 px-3 py-1 rounded-full border opacity-0" style={{ borderColor: 'rgba(99,102,241,0.3)', backgroundColor: 'rgba(99,102,241,0.08)' }}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs font-bold text-indigo-400 tracking-wide uppercase">Now in Beta · Free to use</span>
            </div>

            {/* Headline — split into words */}
            <div className="space-y-2" style={{ perspective: '800px' }}>
              <h1 className="text-5xl lg:text-[3.75rem] leading-[1.1] font-extrabold tracking-tight">
                {HEADLINE.map((word, i) => (
                  <span
                    key={i}
                    className={`hero-word inline-block mr-3 opacity-0 ${i >= 2 ? 'bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent' : 'text-white'}`}
                  >
                    {word}
                  </span>
                ))}
              </h1>
              <p className="hero-sub text-lg lg:text-xl leading-relaxed max-w-xl opacity-0" style={{ color: '#64748b' }}>
                ArchFlow is a visual canvas for building production-ready system architecture diagrams. Drag, connect, and think in systems.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 items-center">
              <button
                onClick={() => router.push('/editor')}
                className="hero-cta will-change-transform px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg transition-colors duration-200 opacity-0"
                style={{ boxShadow: '0 0 30px rgba(99,102,241,0.3)' }}
              >
                Start designing free →
              </button>
              <button
                onClick={() => document.getElementById('templates')?.scrollIntoView({ behavior: 'smooth' })}
                className="hero-cta will-change-transform px-8 py-4 font-semibold rounded-xl border transition-colors duration-200 opacity-0"
                style={{ color: '#94a3b8', borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'transparent' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
              >
                View templates
              </button>
            </div>

            <p className="text-sm font-medium" style={{ color: '#475569' }}>No account needed · 150+ components · Free forever</p>

            {/* Stats */}
            <div className="pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {[['150+', 'Components'], ['10+', 'Templates'], ['∞', 'Canvas Size'], ['3×', 'Export Quality']].map(([val, label]) => (
                  <div key={label} className="hero-stat flex flex-col opacity-0">
                    <span className="text-2xl font-bold text-white">{val}</span>
                    <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: '#475569' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: interactive canvas mockup */}
          <div className="relative lg:h-[520px] flex items-center justify-center">
            {/* Glow behind mockup */}
            <div className="absolute -inset-4 bg-indigo-500/10 blur-3xl rounded-full -z-10" />

            {/* Gradient border wrapper */}
            <div className="hero-canvas will-change-transform w-full opacity-0 rounded-2xl p-px" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.4), rgba(139,92,246,0.1) 50%, rgba(99,102,241,0.2))' }}>
              <div className="w-full h-[460px] rounded-2xl overflow-hidden flex flex-col" style={{ backgroundColor: '#0d1117' }}>
                {/* macOS title bar */}
                <div className="h-9 flex items-center px-4 gap-2 shrink-0" style={{ backgroundColor: '#161b22', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                    <div className="w-3 h-3 rounded-full bg-[#28ca41]" />
                  </div>
                  <div className="mx-auto text-[10px] font-medium tracking-wide" style={{ color: '#64748b' }}>Archflow — ChatGPT Architecture</div>
                  <div className="text-[9px] font-medium px-2 py-0.5 rounded-full" style={{ color: '#818cf8', backgroundColor: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>Interactive</div>
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
                    fitViewOptions={{ padding: 0.15 }}
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
                    connectionLineType={ConnectionLineType.SmoothStep}
                    defaultEdgeOptions={{ type: 'smoothstep', animated: true }}
                    proOptions={{ hideAttribution: true }}
                    style={{ background: 'transparent' }}
                  >
                    <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1e293b" />
                  </ReactFlow>

                  {/* Hint overlay */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] px-3 py-1 rounded-full border pointer-events-none" style={{ color: '#475569', backgroundColor: 'rgba(15,23,42,0.8)', borderColor: 'rgba(255,255,255,0.08)' }}>
                    Drag nodes to rearrange · Scroll to zoom
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
