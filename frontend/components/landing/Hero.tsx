'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ReactFlow, {
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  type NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ArrowRight, Download, Brain } from 'lucide-react';
import { HeroNode } from './HeroNode';

if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger);

const nodeTypes: NodeTypes = { heroNode: HeroNode };

// ── Canvas data ───────────────────────────────────────────────────────────────

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

const ES = { stroke: '#6366f1', strokeWidth: 1.5, strokeOpacity: 0.7 };

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

// ── Hero ──────────────────────────────────────────────────────────────────────

export function Hero() {
  const router = useRouter();
  const [nodes, , onNodesChange] = useNodesState(HERO_NODES);
  const [edges, , onEdgesChange] = useEdgesState(HERO_EDGES);

  const mockupRef = useRef<HTMLDivElement>(null);
  const tiltRef   = useRef<HTMLDivElement>(null);

  // ── Entrance animation (no blur filters) ───────────────────────────────────
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    gsap.set(tiltRef.current, {
      rotateX: 30, rotateY: -4, rotateZ: 1,
      transformOrigin: 'center top',
    });

    const tl = gsap.timeline({ delay: 0.2 });

    tl.fromTo('.hero-badge',
      { opacity: 0, y: -20, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(2)' }
    )
    .fromTo('.hero-word',
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, stagger: 0.15, duration: 0.8, ease: 'power3.out' },
      '-=0.2'
    )
    .fromTo('.hero-sub',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
      '-=0.4'
    )
    .fromTo('.hero-cta',
      { opacity: 0, y: 20, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, stagger: 0.1, duration: 0.5, ease: 'back.out(1.7)' },
      '-=0.3'
    )
    .fromTo('.hero-mockup',
      { opacity: 0, y: 100 },
      { opacity: 1, y: 0, duration: 1.4, ease: 'power4.out' },
      0.4
    )
    .to(tiltRef.current, { rotateX: 18, duration: 1.4, ease: 'power4.out' }, 0.4)
    .fromTo('.float-card',
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, stagger: 0.15, duration: 0.5, ease: 'back.out(2)' },
      '-=0.6'
    );

    return () => { tl.kill(); };
  }, []);

  // ── Scroll flatten — desktop only ──────────────────────────────────────────
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;
    const isMobile = window.innerWidth < 768;
    if (isMobile) return;

    const tilt = tiltRef.current;
    if (!tilt) return;

    gsap.to(tilt, {
      rotateX: 0, rotateY: 0, rotateZ: 0, ease: 'none',
      scrollTrigger: { trigger: '.hero-section', start: 'top top', end: 'bottom 60%', scrub: 2 },
    });
    gsap.to('.hero-mockup', {
      y: -40, ease: 'none',
      scrollTrigger: { trigger: '.hero-section', start: 'top top', end: 'bottom 60%', scrub: 2 },
    });

    return () => { ScrollTrigger.getAll().forEach(t => t.kill()); };
  }, []);

  // ── Mouse tilt — throttled to 60fps, desktop only ──────────────────────────
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;
    const isMobile = window.innerWidth < 768;
    if (isMobile) return;

    const mockup = mockupRef.current;
    const tilt   = tiltRef.current;
    if (!mockup || !tilt) return;

    let lastCall = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastCall < 16) return; // throttle to ~60fps
      lastCall = now;

      const rect    = mockup.getBoundingClientRect();
      const normalX = (e.clientX - (rect.left + rect.width  / 2)) / (rect.width  / 2);
      const normalY = (e.clientY - (rect.top  + rect.height / 2)) / (rect.height / 2);
      gsap.to(tilt, { rotateY: -4 + normalX * 4, rotateX: 18 - normalY * 3, duration: 0.8, ease: 'power2.out' });
      gsap.to('.mockup-glow', { x: normalX * 30, y: normalY * 20, duration: 0.8, ease: 'power2.out' });
    };
    const handleMouseLeave = () => {
      gsap.to(tilt, { rotateX: 18, rotateY: -4, rotateZ: 1, duration: 1, ease: 'power3.out' });
    };

    window.addEventListener('mousemove', handleMouseMove);
    mockup.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      mockup.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <section
      className="hero-section relative flex flex-col items-center justify-start overflow-hidden"
      style={{ backgroundColor: '#080c14', minHeight: '100vh', paddingTop: '7rem' }}
    >
      {/* Background */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full" style={{ border: '1px solid rgba(255,255,255,0.025)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] rounded-full" style={{ border: '1px solid rgba(255,255,255,0.03)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full" style={{ border: '1px solid rgba(255,255,255,0.04)' }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_20%,rgba(99,102,241,0.12),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:80px_80px]" />
      </div>

      {/* ── Text content ── */}
      <div className="text-center max-w-4xl mx-auto px-6 mb-16 relative z-10">
        <div className="hero-badge inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs mb-8 opacity-0" style={{ border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)', color: '#94a3b8' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          Now in Beta — Free to use
        </div>

        <h1 className="font-bold tracking-tight leading-[0.95] mb-6" style={{ fontSize: 'clamp(3rem, 8vw, 5.5rem)' }}>
          <span className="hero-word block bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent opacity-0">
            Design Systems,
          </span>
          <span className="hero-word block bg-gradient-to-r from-indigo-300 to-indigo-500 bg-clip-text text-transparent opacity-0">
            Not Documents.
          </span>
        </h1>

        <p className="hero-sub text-lg max-w-xl mx-auto mb-10 leading-relaxed opacity-0" style={{ color: '#64748b' }}>
          A visual canvas for building production-ready system architecture diagrams. Drag, connect, and think in systems.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <button
            onClick={() => router.push('/editor')}
            className="hero-cta will-change-transform inline-flex items-center gap-2 px-6 py-3 text-white font-medium rounded-full text-sm transition-colors opacity-0"
            style={{ backgroundColor: '#6366f1', boxShadow: '0 0 30px rgba(99,102,241,0.35)' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#4f46e5')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#6366f1')}
          >
            Start designing free <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => document.getElementById('templates')?.scrollIntoView({ behavior: 'smooth' })}
            className="hero-cta will-change-transform inline-flex items-center gap-2 px-6 py-3 font-medium rounded-full text-sm transition-colors opacity-0"
            style={{ color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'transparent' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#f1f5f9'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#94a3b8'; }}
          >
            View templates
          </button>
        </div>

        <p className="hero-sub mt-5 text-xs opacity-0" style={{ color: '#334155' }}>
          No account needed · 150+ components · Free forever
        </p>
      </div>

      {/* ── 3D Canvas Mockup ── */}
      <div className="w-full max-w-6xl mx-auto px-6 relative z-10">
        {/*
          mockupRef  — perspective container (no transform, just establishes 3D space)
          tiltRef    — rotation target for GSAP (rotateX/Y/Z applied here)
          ReactFlow  — sits inside tiltRef with NO transform of its own
        */}
        <div
          ref={mockupRef}
          className="hero-mockup relative opacity-0"
          style={{ perspective: '1200px', perspectiveOrigin: '50% 40%' }}
        >
          {/* Floating cards — outside tiltRef so they don't inherit 3D transform */}
          <div className="float-card animate-float absolute -left-4 top-12 z-20 opacity-0 hidden lg:flex items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', willChange: 'transform' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(99,102,241,0.15)' }}>
              <Brain className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs text-white font-medium">LLM API</p>
              <p className="text-[10px]" style={{ color: '#475569' }}>AI / ML</p>
            </div>
          </div>

          <div className="float-card animate-float animate-float-delay-1 absolute -right-4 top-20 z-20 opacity-0 hidden lg:block p-3 rounded-xl" style={{ backgroundColor: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', willChange: 'transform' }}>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-slate-300">Auto Layout</span>
            </div>
            <p className="text-[10px]" style={{ color: '#475569' }}>8 nodes arranged</p>
          </div>

          <div className="float-card animate-float animate-float-delay-2 absolute -left-2 bottom-20 z-20 opacity-0 hidden lg:flex items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', willChange: 'transform' }}>
            <Download className="w-4 h-4 text-indigo-400" />
            <div>
              <p className="text-xs text-white font-medium">Exported</p>
              <p className="text-[10px]" style={{ color: '#475569' }}>architecture.png · 3×</p>
            </div>
          </div>

          {/* tiltRef: GSAP rotates this. overflow:hidden clips the canvas to rounded corners.
              NO transform: translateZ(0) here — that would break edge coordinate mapping. */}
          <div
            ref={tiltRef}
            style={{
              transformStyle: 'preserve-3d',
              willChange: 'transform',
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 80px 120px rgba(0,0,0,0.6), 0 40px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06), 0 0 80px rgba(99,102,241,0.08)',
            }}
          >
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3" style={{ backgroundColor: '#161b22', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                <div className="w-3 h-3 rounded-full bg-[#28ca41]" />
              </div>
              <div className="flex-1 mx-4">
                <div className="rounded-md px-3 py-1 text-xs text-center max-w-xs mx-auto" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#475569' }}>
                  archflow.app/editor
                </div>
              </div>
              <div className="text-[9px] font-medium px-2 py-0.5 rounded-full" style={{ color: '#818cf8', backgroundColor: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                Live Preview
              </div>
            </div>

            {/* ReactFlow container — NO transform applied here */}
            <div style={{ width: '100%', height: 560, background: '#0f172a', position: 'relative' }}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.3 }}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                panOnDrag={false}
                zoomOnScroll={false}
                zoomOnPinch={false}
                zoomOnDoubleClick={false}
                preventScrolling={false}
                elevateNodesOnSelect={false}
                onlyRenderVisibleElements={true}
                defaultEdgeOptions={{ type: 'default', animated: true, style: ES }}
                proOptions={{ hideAttribution: true }}
                style={{ background: '#0f172a', pointerEvents: 'none' }}
              >
                <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1e293b" />
              </ReactFlow>
            </div>
          </div>

          {/* Glow underneath */}
          <div className="mockup-glow absolute -bottom-16 left-1/2 -translate-x-1/2 w-3/4 h-40 rounded-full pointer-events-none" style={{ backgroundColor: 'rgba(99,102,241,0.12)', filter: 'blur(60px)' }} />
        </div>
      </div>
    </section>
  );
}
