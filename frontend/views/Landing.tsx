'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactFlow, {
  Background,
  BackgroundVariant,
  type NodeTypes,
  type Node,
  type Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';

// ── Demo nodes ──────────────────────────────────────────────────────────────

const ICON: Record<string, string> = {
  Client:         '🖥️',
  'API Gateway':  '🔀',
  'Auth Service': '🔐',
  'Backend':      '⚙️',
  'Database':     '🗄️',
  'Cache':        '⚡',
  'Queue':        '📨',
  'Worker':       '🔧',
};

function DemoNode({ data }: { data: { label: string; sub?: string } }) {
  return (
    <div style={{
      background: '#fff',
      border: '1.5px solid #e2e8f0',
      borderRadius: 10,
      padding: '10px 16px',
      minWidth: 130,
      boxShadow: '0 2px 12px rgba(59,130,246,0.08)',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <span style={{ fontSize: 18 }}>{ICON[data.label] ?? '📦'}</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', lineHeight: 1.2 }}>{data.label}</div>
        {data.sub && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{data.sub}</div>}
      </div>
    </div>
  );
}

const nodeTypes: NodeTypes = { demo: DemoNode };

const DEMO_NODES: Node[] = [
  { id: 'client',   type: 'demo', position: { x: 0,   y: 120 }, data: { label: 'Client',        sub: 'Browser / Mobile' } },
  { id: 'apigw',    type: 'demo', position: { x: 200, y: 120 }, data: { label: 'API Gateway',   sub: 'Rate limiting' } },
  { id: 'auth',     type: 'demo', position: { x: 400, y: 20  }, data: { label: 'Auth Service',  sub: 'JWT / OAuth' } },
  { id: 'backend',  type: 'demo', position: { x: 400, y: 160 }, data: { label: 'Backend',       sub: 'Node.js' } },
  { id: 'db',       type: 'demo', position: { x: 620, y: 60  }, data: { label: 'Database',      sub: 'PostgreSQL' } },
  { id: 'cache',    type: 'demo', position: { x: 620, y: 200 }, data: { label: 'Cache',         sub: 'Redis' } },
  { id: 'queue',    type: 'demo', position: { x: 620, y: 320 }, data: { label: 'Queue',         sub: 'RabbitMQ' } },
  { id: 'worker',   type: 'demo', position: { x: 820, y: 320 }, data: { label: 'Worker',        sub: 'Background jobs' } },
];

const DEMO_EDGES: Edge[] = [
  { id: 'e1', source: 'client',  target: 'apigw',   type: 'smoothstep', animated: true,  style: { stroke: '#3b82f6', strokeWidth: 1.5 } },
  { id: 'e2', source: 'apigw',   target: 'auth',    type: 'smoothstep', animated: false, style: { stroke: '#6366f1', strokeWidth: 1.5 } },
  { id: 'e3', source: 'apigw',   target: 'backend', type: 'smoothstep', animated: true,  style: { stroke: '#3b82f6', strokeWidth: 1.5 } },
  { id: 'e4', source: 'backend', target: 'db',      type: 'smoothstep', animated: false, style: { stroke: '#6366f1', strokeWidth: 1.5 } },
  { id: 'e5', source: 'backend', target: 'cache',   type: 'smoothstep', animated: false, style: { stroke: '#6366f1', strokeWidth: 1.5 } },
  { id: 'e6', source: 'backend', target: 'queue',   type: 'smoothstep', animated: true,  style: { stroke: '#3b82f6', strokeWidth: 1.5 } },
  { id: 'e7', source: 'queue',   target: 'worker',  type: 'smoothstep', animated: true,  style: { stroke: '#3b82f6', strokeWidth: 1.5 } },
];

// ── Canvas preview ───────────────────────────────────────────────────────────

function CanvasPreview() {
  return (
    <div style={{ width: '100%', height: '100%', borderRadius: 16, overflow: 'hidden' }}>
      <ReactFlow
        nodes={DEMO_NODES}
        edges={DEMO_EDGES}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        proOptions={{ hideAttribution: true }}
        style={{ background: 'transparent' }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#cbd5e1" />
      </ReactFlow>
    </div>
  );
}

// ── Landing page ─────────────────────────────────────────────────────────────

export default function LandingPage() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8f9fb',
      fontFamily: 'Inter, system-ui, sans-serif',
      overflow: 'hidden',
      position: 'relative',
    }}>

      {/* dot-grid texture overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
        backgroundSize: '28px 28px',
        opacity: 0.45,
      }} />

      {/* ── Navbar ── */}
      <nav style={{
        position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 48px',
        borderBottom: '1px solid #e2e8f0',
        background: 'rgba(248,249,251,0.85)',
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16,
          }}>⬡</div>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>Archflow</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => router.push('/editor')}
            style={{
              padding: '8px 20px', borderRadius: 8, border: '1.5px solid #e2e8f0',
              background: 'transparent', color: '#0f172a', fontSize: 14, fontWeight: 500,
              cursor: 'pointer',
            }}
          >Sign in</button>
          <button
            onClick={() => router.push('/editor')}
            style={{
              padding: '8px 20px', borderRadius: 8, border: 'none',
              background: '#3b82f6', color: '#fff', fontSize: 14, fontWeight: 600,
              cursor: 'pointer',
            }}
          >Start designing</button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <main style={{
        position: 'relative', zIndex: 5,
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        alignItems: 'center',
        minHeight: 'calc(100vh - 73px)',
        padding: '0 48px',
        gap: 48,
        maxWidth: 1280, margin: '0 auto',
      }}>

        {/* Left — text */}
        <div style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(28px)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#eff6ff', border: '1px solid #bfdbfe',
            borderRadius: 999, padding: '4px 12px', marginBottom: 24,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#3b82f6', letterSpacing: '0.04em' }}>NOW IN BETA</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2.4rem, 4vw, 3.6rem)',
            fontWeight: 800,
            color: '#0f172a',
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            margin: '0 0 20px',
          }}>
            Design{' '}
            <span style={{
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>Systems,</span>
            <br />Not Documents
          </h1>

          <p style={{
            fontSize: 18, color: '#475569', lineHeight: 1.7,
            maxWidth: 460, margin: '0 0 36px',
          }}>
            A visual canvas for building production-ready system architecture diagrams.
            Drag, connect, and think in systems.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
            <button
              onClick={() => router.push('/editor')}
              style={{
                padding: '14px 28px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                color: '#fff', fontSize: 15, fontWeight: 700,
                cursor: 'pointer', letterSpacing: '-0.01em',
                boxShadow: '0 4px 20px rgba(59,130,246,0.35)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 28px rgba(59,130,246,0.45)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 20px rgba(59,130,246,0.35)';
              }}
            >
              Try it free — no signup →
            </button>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>No account needed to start</span>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 32, marginTop: 48 }}>
            {[['150+', 'Components'], ['38', 'AWS Services'], ['∞', 'Canvas size']].map(([val, label]) => (
              <div key={label}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>{val}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — canvas preview */}
        <div style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(28px)',
          transition: 'opacity 0.7s ease 0.2s, transform 0.7s ease 0.2s',
          position: 'relative',
          height: 480,
        }}>
          {/* glow blob */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 420, height: 320,
            background: 'radial-gradient(ellipse, rgba(99,102,241,0.18) 0%, rgba(59,130,246,0.10) 50%, transparent 75%)',
            borderRadius: '50%',
            filter: 'blur(32px)',
            pointerEvents: 'none',
            zIndex: 0,
          }} />

          {/* canvas card */}
          <div style={{
            position: 'relative', zIndex: 1,
            width: '100%', height: '100%',
            borderRadius: 16,
            border: '1.5px solid #e2e8f0',
            background: '#f8f9fb',
            boxShadow: '0 8px 40px rgba(15,23,42,0.10), 0 1px 0 rgba(255,255,255,0.8) inset',
            overflow: 'hidden',
          }}>
            {/* fake toolbar strip */}
            <div style={{
              height: 36, background: '#fff',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex', alignItems: 'center',
              padding: '0 14px', gap: 6,
            }}>
              {['#f87171','#fbbf24','#34d399'].map(c => (
                <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
              ))}
              <span style={{ marginLeft: 8, fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>archflow — system-design.af</span>
            </div>
            <div style={{ height: 'calc(100% - 36px)' }}>
              <CanvasPreview />
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
        .react-flow__node { animation: float 4s ease-in-out infinite; }
        .react-flow__node:nth-child(2) { animation-delay: 0.4s; }
        .react-flow__node:nth-child(3) { animation-delay: 0.8s; }
        .react-flow__node:nth-child(4) { animation-delay: 1.2s; }
        .react-flow__node:nth-child(5) { animation-delay: 1.6s; }
        .react-flow__node:nth-child(6) { animation-delay: 2.0s; }
        .react-flow__node:nth-child(7) { animation-delay: 2.4s; }
        .react-flow__node:nth-child(8) { animation-delay: 2.8s; }
        .react-flow__node:focus,
        .react-flow__node:focus-visible,
        .react-flow__node.selected,
        .react-flow__node:hover { outline: none !important; box-shadow: none !important; }
      `}</style>
    </div>
  );
}
