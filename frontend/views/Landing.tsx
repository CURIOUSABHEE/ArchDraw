'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight, GitBranch, Sparkles, MousePointer2, AlignCenter,
  Layers, Zap, Move, Download, Globe, Shield, Server,
  Database, Activity,
} from 'lucide-react';

// ── Intersection observer ─────────────────────────────────────────────────────
function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ── Canvas preview nodes ──────────────────────────────────────────────────────
const NODES = [
  { id: 'client',   label: 'Web Client',    icon: Globe,    color: '#6366f1', x: 40,  y: 60  },
  { id: 'gateway',  label: 'API Gateway',   icon: Zap,      color: '#f59e0b', x: 240, y: 60  },
  { id: 'auth',     label: 'Auth Service',  icon: Shield,   color: '#8b5cf6', x: 240, y: 180 },
  { id: 'svc',      label: 'Microservice',  icon: Server,   color: '#3b82f6', x: 440, y: 60  },
  { id: 'db',       label: 'PostgreSQL',    icon: Database, color: '#336791', x: 440, y: 180 },
  { id: 'cache',    label: 'Redis',         icon: Activity, color: '#DC382D', x: 620, y: 120 },
];

const EDGES = [
  { from: 'client',  to: 'gateway', animated: true  },
  { from: 'gateway', to: 'auth',    animated: false },
  { from: 'gateway', to: 'svc',     animated: true  },
  { from: 'svc',     to: 'db',      animated: false },
  { from: 'svc',     to: 'cache',   animated: true  },
];

const NODE_W = 150;
const NODE_H = 52;

function nodeCenter(id: string) {
  const n = NODES.find((n) => n.id === id)!;
  return { x: n.x + NODE_W / 2, y: n.y + NODE_H / 2 };
}

function DiagramEdge({ from, to, animated, delay }: { from: string; to: string; animated: boolean; delay: number }) {
  const a = nodeCenter(from);
  const b = nodeCenter(to);
  const mx = (a.x + b.x) / 2;
  const d = `M${a.x},${a.y} C${mx},${a.y} ${mx},${b.y} ${b.x},${b.y}`;
  return (
    <g>
      <path d={d} fill="none" stroke="rgba(99,102,241,0.2)" strokeWidth={1.5} />
      {animated && (
        <path d={d} fill="none" stroke="#6366f1" strokeWidth={1.5}
          strokeDasharray="5 10"
          style={{ animation: `dash 1.6s linear infinite`, animationDelay: `${delay}s` }}
        />
      )}
      <circle cx={b.x} cy={b.y} r={2.5} fill="#6366f1" opacity={0.7} />
    </g>
  );
}

function DiagramNode({ label, icon: Icon, color, x, y, delay }: typeof NODES[0] & { delay: number }) {
  return (
    <foreignObject x={x} y={y} width={NODE_W} height={NODE_H}>
      <div style={{
        width: NODE_W, height: NODE_H,
        background: 'rgba(14,14,26,0.95)',
        borderLeft: `3px solid ${color}`,
        border: `1px solid rgba(255,255,255,0.07)`,
        borderRadius: 10,
        display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px',
        boxShadow: `0 0 20px ${color}18`,
        animation: `float 3s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          background: `${color}20`, border: `1px solid ${color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={13} style={{ color }} strokeWidth={1.8} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#e2e8f0', lineHeight: 1.2 }}>{label}</span>
      </div>
    </foreignObject>
  );
}

function CanvasPreview() {
  return (
    <div style={{
      borderRadius: 16, overflow: 'hidden',
      border: '1px solid rgba(99,102,241,0.18)',
      background: 'rgba(10,10,18,0.95)',
      boxShadow: '0 0 0 1px rgba(99,102,241,0.08), 0 40px 80px -20px rgba(0,0,0,0.9), 0 0 60px rgba(99,102,241,0.06)',
    }}>
      {/* Window chrome */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px',
        borderBottom: '1px solid rgba(99,102,241,0.1)',
        background: 'rgba(8,8,16,0.8)',
      }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
        <span style={{ marginLeft: 10, fontSize: 11, color: 'rgba(148,163,184,0.5)', fontFamily: 'monospace' }}>
          archdraw — untitled diagram
        </span>
      </div>
      {/* Canvas area */}
      <div style={{ position: 'relative', height: 300 }}>
        {/* Dot grid */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.25 }}>
          <defs>
            <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="rgba(99,102,241,0.5)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
        {/* Diagram */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          viewBox="0 0 820 300" preserveAspectRatio="xMidYMid meet">
          {EDGES.map((e, i) => (
            <DiagramEdge key={`${e.from}-${e.to}`} {...e} delay={i * 0.25} />
          ))}
          {NODES.map((n, i) => (
            <DiagramNode key={n.id} {...n} delay={i * 0.35} />
          ))}
        </svg>
      </div>
    </div>
  );
}

// ── Features ──────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: MousePointer2, color: '#6366f1', title: 'Drag & Drop Canvas',      desc: 'Build diagrams by dragging 150+ components onto an infinite canvas.' },
  { icon: AlignCenter,   color: '#f59e0b', title: 'Smart Snapping',          desc: 'Magnetic alignment guides snap nodes to grids and other nodes as you drag.' },
  { icon: Layers,        color: '#3b82f6', title: 'Rich Component Library',  desc: 'AWS services with official icons, databases, auth providers, and dev tools.' },
  { icon: GitBranch,     color: '#8b5cf6', title: 'Custom Edges',            desc: 'Animated flows, labels, bidirectional arrows, and multiple line styles.' },
  { icon: Move,          color: '#10b981', title: 'Groups & Annotations',    desc: 'Group nodes into containers. Add sticky notes and text labels anywhere.' },
  { icon: Download,      color: '#ec4899', title: 'Export & Share',          desc: 'Export to PNG, SVG, or PDF. Full undo/redo with keyboard shortcuts.' },
];

// ── Landing page ──────────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter();
  const { ref: featRef, inView: featInView } = useInView();
  const { ref: statsRef, inView: statsInView } = useInView();
  const { ref: ctaRef, inView: ctaInView } = useInView();

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a12', color: '#f1f5f9', fontFamily: 'Inter, system-ui, sans-serif', overflowX: 'hidden' }}>

      {/* ── Nav ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', height: 56,
        background: 'rgba(10,10,18,0.85)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(99,102,241,0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <GitBranch size={13} color="white" strokeWidth={2.5} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em' }}>ArchDraw</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => router.push('/editor')}
            style={{ fontSize: 13, color: 'rgba(148,163,184,0.8)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 14px', borderRadius: 8, transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f1f5f9')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(148,163,184,0.8)')}>
            Open Editor
          </button>
          <button onClick={() => router.push('/editor')}
            style={{
              fontSize: 13, fontWeight: 600, padding: '7px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white', boxShadow: '0 0 20px rgba(99,102,241,0.3)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}>
            Start Free
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ paddingTop: 140, paddingBottom: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '140px 24px 80px' }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 14px', borderRadius: 999, marginBottom: 28,
          background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
          fontSize: 12, fontWeight: 600, color: '#a5b4fc',
          animation: 'fadeUp 0.5s ease forwards',
        }}>
          <Sparkles size={11} />
          Visual architecture diagramming — built for engineers
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 'clamp(2.6rem, 6vw, 5rem)', fontWeight: 800,
          lineHeight: 1.08, letterSpacing: '-0.03em', marginBottom: 20, maxWidth: 800,
          animation: 'fadeUp 0.5s 0.08s ease forwards', opacity: 0,
        }}>
          <span style={{ color: '#f1f5f9' }}>Design systems</span><br />
          <span style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a78bfa 50%, #ec4899 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            that think with you
          </span>
        </h1>

        {/* Subtext */}
        <p style={{
          fontSize: '1.05rem', color: 'rgba(148,163,184,0.85)', maxWidth: 520,
          lineHeight: 1.7, marginBottom: 36,
          animation: 'fadeUp 0.5s 0.16s ease forwards', opacity: 0,
        }}>
          A canvas-first tool with 150+ components, AWS service icons, smart snapping, and animated edges — so your architecture docs stay as sharp as your code.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 64, animation: 'fadeUp 0.5s 0.24s ease forwards', opacity: 0 }}>
          <button onClick={() => router.push('/editor')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 28px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white', fontSize: 14, fontWeight: 600,
              boxShadow: '0 0 30px rgba(99,102,241,0.35)',
              transition: 'transform 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
            Open the canvas <ArrowRight size={15} />
          </button>
          <button
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            style={{
              padding: '12px 28px', borderRadius: 12, cursor: 'pointer',
              background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(203,213,225,0.85)', fontSize: 14, fontWeight: 500,
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#f1f5f9'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(203,213,225,0.85)'; }}>
            See features
          </button>
        </div>

        {/* Canvas preview */}
        <div style={{ width: '100%', maxWidth: 860, animation: 'fadeUp 0.7s 0.32s ease forwards', opacity: 0, position: 'relative' }}>
          <CanvasPreview />
          {/* Glow under */}
          <div style={{ position: 'absolute', bottom: -30, left: '15%', right: '15%', height: 60, background: 'radial-gradient(ellipse, rgba(99,102,241,0.2) 0%, transparent 70%)', filter: 'blur(16px)', pointerEvents: 'none' }} />
        </div>
      </section>

      {/* ── Stats ── */}
      <div ref={statsRef} style={{
        borderTop: '1px solid rgba(99,102,241,0.08)',
        borderBottom: '1px solid rgba(99,102,241,0.08)',
        padding: '40px 24px',
      }}>
        <div style={{
          maxWidth: 600, margin: '0 auto',
          display: 'grid', gridTemplateColumns: '1fr 1px 1fr 1px 1fr',
          alignItems: 'center', gap: 0,
          transition: 'opacity 0.6s, transform 0.6s',
          opacity: statsInView ? 1 : 0,
          transform: statsInView ? 'translateY(0)' : 'translateY(20px)',
        }}>
          {[['150+', 'Components'], ['38', 'AWS Services'], ['∞', 'Canvas size']].map(([val, label], i) => (
            <>
              {i > 0 && <div key={`div-${i}`} style={{ width: 1, height: 40, background: 'rgba(99,102,241,0.15)', margin: '0 auto' }} />}
              <div key={label} style={{ textAlign: 'center', padding: '0 16px' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{val}</div>
                <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.7)', marginTop: 4 }}>{label}</div>
              </div>
            </>
          ))}
        </div>
      </div>

      {/* ── Features ── */}
      <section id="features" style={{ padding: '96px 24px' }}>
        <div ref={featRef} style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{
            textAlign: 'center', marginBottom: 56,
            transition: 'opacity 0.6s, transform 0.6s',
            opacity: featInView ? 1 : 0,
            transform: featInView ? 'translateY(0)' : 'translateY(20px)',
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6366f1', marginBottom: 12 }}>Everything you need</p>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>Built for real architecture work</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {FEATURES.map((f, i) => (
              <div key={f.title} style={{
                padding: '24px', borderRadius: 16,
                background: 'rgba(14,14,26,0.8)',
                border: '1px solid rgba(255,255,255,0.05)',
                transition: `opacity 0.6s ${i * 70}ms, transform 0.6s ${i * 70}ms`,
                opacity: featInView ? 1 : 0,
                transform: featInView ? 'translateY(0)' : 'translateY(24px)',
                cursor: 'default',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.border = `1px solid ${f.color}30`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(255,255,255,0.05)'; }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10, marginBottom: 16,
                  background: `${f.color}18`, border: `1px solid ${f.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <f.icon size={18} style={{ color: f.color }} strokeWidth={1.8} />
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: 'rgba(148,163,184,0.75)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '96px 24px', borderTop: '1px solid rgba(99,102,241,0.08)' }}>
        <div ref={ctaRef} style={{
          maxWidth: 560, margin: '0 auto', textAlign: 'center',
          transition: 'opacity 0.6s, transform 0.6s',
          opacity: ctaInView ? 1 : 0,
          transform: ctaInView ? 'translateY(0)' : 'translateY(24px)',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 24px',
            background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={24} style={{ color: '#a78bfa' }} />
          </div>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 16 }}>
            Start diagramming<br />
            <span style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              right now
            </span>
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(148,163,184,0.75)', marginBottom: 36 }}>No sign-up. No install. Just open the canvas and build.</p>
          <button onClick={() => router.push('/editor')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '14px 36px', borderRadius: 14, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white', fontSize: 15, fontWeight: 700,
              boxShadow: '0 0 50px rgba(99,102,241,0.35), 0 20px 40px rgba(0,0,0,0.4)',
              transition: 'transform 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
            Open ArchDraw <ArrowRight size={17} />
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: 12, color: 'rgba(100,116,139,0.7)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 20, height: 20, borderRadius: 6, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GitBranch size={10} color="white" strokeWidth={2.5} />
          </div>
          ArchDraw
        </div>
        <span>Built for engineers who care about clarity</span>
      </footer>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes dash {
          from { stroke-dashoffset: 0; }
          to   { stroke-dashoffset: -30; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
