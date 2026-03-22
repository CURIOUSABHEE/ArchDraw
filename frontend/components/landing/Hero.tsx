'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  ArrowRight, Download, Brain,
  Webhook, Scale, RadioTower, Cpu, GitMerge,
  Database, Layers, MessageSquare, Boxes, Shield,
  Activity, Zap, CreditCard, HardDrive, Network, Box,
} from 'lucide-react';

const HeroCanvas = dynamic(() => import('./HeroCanvas'), {
  ssr: false,
  loading: () => <div className="w-full h-[560px] bg-[#0f172a]" />,
});


// ── Ghost background nodes ────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  Webhook, Scale, RadioTower, Brain, Cpu, GitMerge,
  Database, Layers, MessageSquare, Boxes, Shield,
  Activity, Zap, CreditCard, HardDrive, Network, Box,
};

const BG_NODES = [
  { id: 'bg1',  label: 'API Gateway',    icon: 'Webhook',       color: '#6366f1', x: '3%',   y: '18%', opacity: 0.65, size: 'md', delay: 0,   anim: 1, depth: 1.5 },
  { id: 'bg2',  label: 'Load Balancer',  icon: 'Scale',         color: '#6366f1', x: '12%',  y: '22%', opacity: 0.55, size: 'sm', delay: 0.8, anim: 2, depth: 1.0 },
  { id: 'bg3',  label: 'CDN',            icon: 'RadioTower',    color: '#6366f1', x: '-2%',  y: '42%', opacity: 0.50, size: 'sm', delay: 1.6, anim: 3, depth: 0.5 },
  { id: 'bg4',  label: 'LLM API',        icon: 'Brain',         color: '#ec4899', x: '82%',  y: '15%', opacity: 0.70, size: 'md', delay: 0.4, anim: 2, depth: 1.5 },
  { id: 'bg5',  label: 'Vector DB',      icon: 'Cpu',           color: '#ec4899', x: '91%',  y: '22%', opacity: 0.60, size: 'sm', delay: 1.2, anim: 1, depth: 1.0 },
  { id: 'bg6',  label: 'RAG Pipeline',   icon: 'GitMerge',      color: '#ec4899', x: '76%',  y: '38%', opacity: 0.55, size: 'sm', delay: 2.0, anim: 3, depth: 0.5 },
  { id: 'bg7',  label: 'SQL Database',   icon: 'Database',      color: '#64748b', x: '5%',   y: '65%', opacity: 0.60, size: 'md', delay: 0.6, anim: 3, depth: 1.0 },
  { id: 'bg8',  label: 'Redis Cache',    icon: 'Layers',        color: '#ef4444', x: '15%',  y: '80%', opacity: 0.55, size: 'sm', delay: 1.4, anim: 1, depth: 0.8 },
  { id: 'bg9',  label: 'Message Queue',  icon: 'MessageSquare', color: '#f59e0b', x: '-3%',  y: '88%', opacity: 0.50, size: 'sm', delay: 2.2, anim: 2, depth: 0.5 },
  { id: 'bg10', label: 'Microservice',   icon: 'Boxes',         color: '#3b82f6', x: '80%',  y: '62%', opacity: 0.65, size: 'md', delay: 0.2, anim: 1, depth: 1.2 },
  { id: 'bg11', label: 'Auth Service',   icon: 'Shield',        color: '#6366f1', x: '90%',  y: '78%', opacity: 0.55, size: 'sm', delay: 1.0, anim: 3, depth: 0.8 },
  { id: 'bg12', label: 'Kafka',          icon: 'Activity',      color: '#f59e0b', x: '72%',  y: '88%', opacity: 0.50, size: 'sm', delay: 1.8, anim: 2, depth: 0.5 },
  { id: 'bg13', label: 'Serverless',     icon: 'Zap',           color: '#3b82f6', x: '28%',  y: '20%', opacity: 0.50, size: 'sm', delay: 1.1, anim: 2, depth: 0.4 },
  { id: 'bg14', label: 'Stripe',         icon: 'CreditCard',    color: '#10b981', x: '62%',  y: '22%', opacity: 0.50, size: 'sm', delay: 0.9, anim: 3, depth: 0.4 },
  { id: 'bg15', label: 'Object Storage', icon: 'HardDrive',     color: '#64748b', x: '35%',  y: '82%', opacity: 0.50, size: 'sm', delay: 1.5, anim: 1, depth: 0.4 },
  { id: 'bg16', label: 'Embedding Svc',  icon: 'Network',       color: '#ec4899', x: '58%',  y: '78%', opacity: 0.50, size: 'sm', delay: 0.7, anim: 2, depth: 0.4 },
];

const GHOST_EDGES = [
  { x1: '8%',  y1: '14%', x2: '16%', y2: '28%' },
  { x1: '16%', y1: '28%', x2: '9%',  y2: '68%' },
  { x1: '87%', y1: '11%', x2: '95%', y2: '26%' },
  { x1: '95%', y1: '28%', x2: '85%', y2: '66%' },
  { x1: '85%', y1: '68%', x2: '94%', y2: '82%' },
  { x1: '9%',  y1: '70%', x2: '19%', y2: '84%' },
];

interface GhostNodeProps {
  node: typeof BG_NODES[0];
  mouseX: number;
  mouseY: number;
}

function GhostNode({ node, mouseX, mouseY }: GhostNodeProps) {
  const Icon = ICON_MAP[node.icon] ?? Box;
  const isSmall = node.size === 'sm';
  const parallaxX = (mouseX - 0.5) * node.depth * 12;
  const parallaxY = (mouseY - 0.5) * node.depth * 8;

  return (
    <div
      className="absolute pointer-events-none select-none"
      style={{
        left: node.x,
        top: node.y,
        opacity: node.opacity,
        transform: `translate(${parallaxX}px, ${parallaxY}px)`,
        transition: 'transform 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        animationName: `bgFloat${node.anim}`,
        animationDuration: `${4.5 + parseInt(node.id.replace('bg', '')) * 0.28}s`,
        animationTimingFunction: 'ease-in-out',
        animationIterationCount: 'infinite',
        animationDelay: `${node.delay}s`,
        willChange: node.opacity > 0.10 ? 'transform' : undefined,
        zIndex: 1,
      }}
    >
      <div style={{
        width: isSmall ? 90 : 110,
        background: 'linear-gradient(145deg, rgba(26,34,53,0.75) 0%, rgba(15,23,42,0.75) 100%)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14,
        padding: isSmall ? '10px 8px' : '14px 10px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: isSmall ? 5 : 7,
        backdropFilter: 'blur(4px)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 'inherit',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          width: isSmall ? 30 : 36, height: isSmall ? 30 : 36,
          borderRadius: isSmall ? 8 : 10,
          background: node.color + '12',
          border: `1px solid ${node.color}20`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon style={{ width: isSmall ? 13 : 15, height: isSmall ? 13 : 15, color: node.color }} />
        </div>
        <span style={{
          fontSize: isSmall ? 9 : 10, fontWeight: 600, color: '#94a3b8',
          textAlign: 'center', lineHeight: 1.3,
        }}>{node.label}</span>
      </div>
    </div>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────

export function Hero() {
  const router = useRouter();
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });
  const [isMobile, setIsMobile] = useState(false);

  const mockupRef = useRef<HTMLDivElement>(null);
  const tiltRef   = useRef<HTMLDivElement>(null);

  // Detect mobile + mouse parallax
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);

    let lastCall = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastCall < 50) return; // 20fps — enough for parallax
      lastCall = now;
      setMouse({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // ── Entrance animation ──────────────────────────────────────────────────────
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let tl: any;
    import('gsap').then(({ gsap }) => {
      gsap.set(tiltRef.current, { rotateX: 30, rotateY: -4, rotateZ: 1, transformOrigin: 'center top' });
      tl = gsap.timeline({ delay: 0.2 });
      tl.fromTo('.hero-badge',  { opacity: 0, y: -20, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(2)' })
        .fromTo('.hero-word',   { opacity: 0, y: 50 },               { opacity: 1, y: 0, stagger: 0.15, duration: 0.8, ease: 'power3.out' }, '-=0.2')
        .fromTo('.hero-sub',    { opacity: 0, y: 20 },               { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '-=0.4')
        .fromTo('.hero-cta',    { opacity: 0, y: 20, scale: 0.95 },  { opacity: 1, y: 0, scale: 1, stagger: 0.1, duration: 0.5, ease: 'back.out(1.7)' }, '-=0.3')
        .fromTo('.hero-mockup', { opacity: 0, y: 100 },              { opacity: 1, y: 0, duration: 1.4, ease: 'power4.out' }, 0.4)
        .to(tiltRef.current,    { rotateX: 18, duration: 1.4, ease: 'power4.out' }, 0.4)
        .fromTo('.float-card',  { opacity: 0, scale: 0.8 },          { opacity: 1, scale: 1, stagger: 0.15, duration: 0.5, ease: 'back.out(2)' }, '-=0.6');
    });

    return () => { tl?.kill(); };
  }, []);

  // ── Scroll flatten — desktop only ──────────────────────────────────────────
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || window.innerWidth < 768) return;
    const tilt = tiltRef.current;
    if (!tilt) return;

    Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([{ gsap }, { ScrollTrigger }]) => {
      gsap.registerPlugin(ScrollTrigger);
      gsap.to(tilt, { rotateX: 0, rotateY: 0, rotateZ: 0, ease: 'none', scrollTrigger: { trigger: '.hero-section', start: 'top top', end: 'bottom 60%', scrub: 2 } });
      gsap.to('.hero-mockup', { y: -40, ease: 'none', scrollTrigger: { trigger: '.hero-section', start: 'top top', end: 'bottom 60%', scrub: 2 } });
    });

    return () => {
      import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
        ScrollTrigger.getAll().forEach((t) => t.kill());
      });
    };
  }, []);

  // ── Mouse tilt — desktop only ───────────────────────────────────────────────
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || window.innerWidth < 768) return;

    const mockup = mockupRef.current;
    const tilt   = tiltRef.current;
    if (!mockup || !tilt) return;

    let lastCall = 0;
    let gsapInstance: any;
    import('gsap').then(({ gsap }) => { gsapInstance = gsap; });

    const handleMouseMove = (e: MouseEvent) => {
      if (!gsapInstance) return;
      const now = Date.now();
      if (now - lastCall < 16) return;
      lastCall = now;
      const rect    = mockup.getBoundingClientRect();
      const normalX = (e.clientX - (rect.left + rect.width  / 2)) / (rect.width  / 2);
      const normalY = (e.clientY - (rect.top  + rect.height / 2)) / (rect.height / 2);
      gsapInstance.to(tilt, { rotateY: -4 + normalX * 4, rotateX: 18 - normalY * 3, duration: 0.8, ease: 'power2.out' });
      gsapInstance.to('.mockup-glow', { x: normalX * 30, y: normalY * 20, duration: 0.8, ease: 'power2.out' });
    };
    const handleMouseLeave = () => gsapInstance?.to(tilt, { rotateX: 18, rotateY: -4, rotateZ: 1, duration: 1, ease: 'power3.out' });

    window.addEventListener('mousemove', handleMouseMove);
    mockup.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      mockup.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const visibleBgNodes = isMobile ? BG_NODES.slice(0, 8) : BG_NODES;

  return (
    <section
      className="hero-section relative flex flex-col items-center justify-start overflow-hidden"
      style={{ backgroundColor: '#080c14', minHeight: '100vh' }}
    >
      {/* ── LAYER 0: Ghost background nodes ── */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        {/* SVG ghost edges */}
        <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.35 }}>
          <defs>
            <marker id="ghost-dot" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
              <circle cx="2" cy="2" r="1.5" fill="#6366f1" opacity="0.5" />
            </marker>
          </defs>
          {GHOST_EDGES.map((edge, i) => (
            <line
              key={i}
              x1={edge.x1} y1={edge.y1} x2={edge.x2} y2={edge.y2}
              stroke="#6366f1" strokeWidth="1"
              strokeDasharray="4 6" strokeOpacity="0.5"
              markerEnd="url(#ghost-dot)"
            />
          ))}
        </svg>

        {/* Ghost node cards */}
        {visibleBgNodes.map((node, i) => (
          <GhostNode
            key={node.id}
            node={node}
            mouseX={isMobile ? 0.5 : mouse.x}
            mouseY={isMobile ? 0.5 : mouse.y}
          />
        ))}
      </div>

      {/* ── LAYER 1: Edge fade vignettes ── */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2 }}>
        <div className="absolute left-0 top-0 bottom-0 w-48" style={{ background: 'linear-gradient(to right, #080c14, transparent)' }} />
        <div className="absolute right-0 top-0 bottom-0 w-48" style={{ background: 'linear-gradient(to left, #080c14, transparent)' }} />
        <div className="absolute top-0 left-0 right-0 h-48 pointer-events-none" style={{ background: 'linear-gradient(to bottom, #080c14 40%, rgba(8,12,20,0.85) 70%, transparent)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-48" style={{ background: 'linear-gradient(to top, #080c14, transparent)' }} />
        {/* Center radial — keeps text area clear */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 65% 55% at 50% 45%, #080c14 25%, transparent 70%)' }} />
      </div>

      {/* ── LAYER 2: Decorative rings + grid ── */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 3 }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full" style={{ border: '1px solid rgba(255,255,255,0.025)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] rounded-full" style={{ border: '1px solid rgba(255,255,255,0.03)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full" style={{ border: '1px solid rgba(255,255,255,0.04)' }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_20%,rgba(99,102,241,0.12),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:80px_80px]" />
      </div>

      {/* ── LAYER 3: Text content ── */}
      <div className="text-center max-w-4xl mx-auto px-6 mb-16 pt-24 md:pt-28" style={{ position: 'relative', zIndex: 10 }}>
        <div className="hero-badge inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs mb-8" style={{ border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)', color: '#94a3b8' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          Now in Beta — Free to use
        </div>

        <h1 className="font-bold tracking-tight leading-[0.95] mb-6" style={{ fontSize: 'clamp(3rem, 8vw, 5.5rem)' }}>
          <span className="hero-word block bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent opacity-0 uppercase">
            Canva for
          </span>
          <span className="hero-word block bg-gradient-to-r from-indigo-300 to-indigo-500 bg-clip-text text-transparent opacity-0 uppercase">
            Architecture Diagram
          </span>
        </h1>

        <p className="hero-sub text-lg max-w-xl mx-auto mb-10 leading-relaxed" style={{ color: '#64748b' }}>
          A visual canvas for building production-ready system architecture diagrams. Drag, connect, and think in systems.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <button
            onClick={() => router.push('/editor')}
            className="hero-cta will-change-transform inline-flex items-center gap-2 px-6 py-3 text-white font-medium rounded-full text-sm transition-colors"
            style={{ backgroundColor: '#6366f1', boxShadow: '0 0 30px rgba(99,102,241,0.35)' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#4f46e5')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#6366f1')}
          >
            Start designing free <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => document.getElementById('templates')?.scrollIntoView({ behavior: 'smooth' })}
            className="hero-cta will-change-transform inline-flex items-center gap-2 px-6 py-3 font-medium rounded-full text-sm transition-colors"
            style={{ color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'transparent' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#f1f5f9'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#94a3b8'; }}
          >
            View templates
          </button>
        </div>

        <p className="hero-sub mt-5 text-xs" style={{ color: '#334155' }}>
          No account needed · 150+ components · Free forever
        </p>
      </div>

      {/* ── LAYER 3: 3D Canvas Mockup ── */}
      <div className="w-full max-w-6xl mx-auto px-6" style={{ position: 'relative', zIndex: 10 }}>
        <div ref={mockupRef} className="hero-mockup relative" style={{ perspective: '1200px', perspectiveOrigin: '50% 40%' }}>
          {/* Floating cards */}
          <div className="float-card animate-float absolute -left-4 top-12 z-20 hidden lg:flex items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', willChange: 'transform' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(99,102,241,0.15)' }}>
              <Brain className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs text-white font-medium">LLM API</p>
              <p className="text-[10px]" style={{ color: '#475569' }}>AI / ML</p>
            </div>
          </div>

          <div className="float-card animate-float animate-float-delay-1 absolute -right-4 top-20 z-20 hidden lg:block p-3 rounded-xl" style={{ backgroundColor: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', willChange: 'transform' }}>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-slate-300">Auto Layout</span>
            </div>
            <p className="text-[10px]" style={{ color: '#475569' }}>8 nodes arranged</p>
          </div>

          <div className="float-card animate-float animate-float-delay-2 absolute -left-2 bottom-20 z-20 hidden lg:flex items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', willChange: 'transform' }}>
            <Download className="w-4 h-4 text-indigo-400" />
            <div>
              <p className="text-xs text-white font-medium">Exported</p>
              <p className="text-[10px]" style={{ color: '#475569' }}>architecture.png · 3×</p>
            </div>
          </div>

          <div ref={tiltRef} style={{ transformStyle: 'preserve-3d', willChange: 'transform', borderRadius: 16, overflow: 'hidden', boxShadow: '0 80px 120px rgba(0,0,0,0.6), 0 40px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06), 0 0 80px rgba(99,102,241,0.08)' }}>
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

            {/* HeroCanvas — lazy loaded, no SSR */}
            <div style={{ width: '100%', height: 560, background: '#0f172a', position: 'relative' }}>
              <HeroCanvas />
            </div>
          </div>

          <div className="mockup-glow absolute -bottom-16 left-1/2 -translate-x-1/2 w-3/4 h-40 rounded-full pointer-events-none" style={{ backgroundColor: 'rgba(99,102,241,0.12)', filter: 'blur(60px)' }} />
        </div>
      </div>
    </section>
  );
}
