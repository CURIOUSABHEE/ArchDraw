'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Search, Boxes, Share2, Download, LayoutGrid, Monitor,
  Database, Zap, Shield, Brain, Check, ArrowRight,
} from 'lucide-react';

if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger);

// ── Sub-components ────────────────────────────────────────────────────────────

function SidebarMockup() {
  const [activeCategory, setActiveCategory] = useState(0);

  const categories = [
    { name: 'Client & Entry', color: '#6366f1', Icon: Monitor,  items: ['Client (Web/Mobile)', 'API Gateway', 'Load Balancer', 'CDN'] },
    { name: 'Compute',        color: '#3b82f6', Icon: Zap,      items: ['Microservice', 'Serverless Fn', 'Container', 'Worker Job'] },
    { name: 'AI / ML',        color: '#ec4899', Icon: Brain,    items: ['LLM API', 'Vector DB', 'RAG Pipeline', 'Embeddings'] },
    { name: 'Data Storage',   color: '#64748b', Icon: Database, items: ['SQL Database', 'NoSQL DB', 'Object Storage', 'Redis Cache'] },
  ];

  return (
    <div className="p-5 h-full relative" style={{ minHeight: 380 }}>
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <Search style={{ width: 13, height: 13, color: '#475569' }} />
        <span className="text-sm" style={{ color: '#475569' }}>Search components...</span>
      </div>

      <div className="space-y-0.5">
        {categories.map((cat, i) => {
          const isOpen = activeCategory === i;
          return (
            <div key={cat.name}>
              <button
                onClick={() => setActiveCategory(isOpen ? -1 : i)}
                className="w-full flex items-center justify-between px-2 py-2 rounded-lg transition-colors"
                style={{ backgroundColor: isOpen ? 'rgba(255,255,255,0.05)' : 'transparent' }}
                onMouseEnter={e => { if (!isOpen) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'; }}
                onMouseLeave={e => { if (!isOpen) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <div className="flex items-center gap-2">
                  <cat.Icon style={{ width: 13, height: 13, color: cat.color }} />
                  <span className="text-xs font-medium" style={{ color: '#cbd5e1' }}>{cat.name}</span>
                </div>
                <span className="text-[10px]" style={{ color: '#334155' }}>{cat.items.length}</span>
              </button>
              {isOpen && (
                <div className="ml-5 mt-0.5 space-y-0.5 mb-1">
                  {cat.items.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors"
                      style={{ color: '#64748b' }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; (e.currentTarget.querySelector('span') as HTMLElement).style.color = '#e2e8f0'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; (e.currentTarget.querySelector('span') as HTMLElement).style.color = '#64748b'; }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color + '80' }} />
                      <span className="text-xs transition-colors">{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="absolute bottom-4 left-0 right-0 text-center text-[10px]" style={{ color: '#334155' }}>
        Click or drag to add to canvas
      </p>
    </div>
  );
}

function CanvasMockup() {
  const [laid, setLaid] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLaid(true), 900);
    return () => clearTimeout(t);
  }, []);

  const messyNodes = [
    { label: 'Client',      color: '#6366f1', Icon: Monitor,  x: 160, y: 130 },
    { label: 'API Gateway', color: '#6366f1', Icon: Zap,      x: 40,  y: 240 },
    { label: 'Auth',        color: '#6366f1', Icon: Shield,   x: 240, y: 40  },
    { label: 'Database',    color: '#64748b', Icon: Database, x: 280, y: 260 },
    { label: 'LLM API',     color: '#ec4899', Icon: Brain,    x: 80,  y: 50  },
  ];
  const cleanNodes = [
    { label: 'Client',      color: '#6366f1', Icon: Monitor,  x: 10,  y: 140 },
    { label: 'API Gateway', color: '#6366f1', Icon: Zap,      x: 140, y: 140 },
    { label: 'Auth',        color: '#6366f1', Icon: Shield,   x: 270, y: 60  },
    { label: 'LLM API',     color: '#ec4899', Icon: Brain,    x: 270, y: 220 },
    { label: 'Database',    color: '#64748b', Icon: Database, x: 400, y: 140 },
  ];
  const nodes = laid ? cleanNodes : messyNodes;

  return (
    <div className="relative" style={{ minHeight: 380 }}>
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => setLaid(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{ backgroundColor: laid ? '#6366f1' : 'rgba(255,255,255,0.1)', color: laid ? '#fff' : '#cbd5e1', boxShadow: laid ? '0 0 16px rgba(99,102,241,0.3)' : 'none' }}
        >
          <LayoutGrid style={{ width: 12, height: 12 }} />
          Auto Layout
        </button>
      </div>
      <div className="absolute inset-0">
        {nodes.map((node, i) => (
          <div
            key={node.label}
            className="absolute"
            style={{ left: node.x + 16, top: node.y + 16, transition: `all 700ms cubic-bezier(0.34, 1.56, 0.64, 1)`, transitionDelay: `${i * 60}ms` }}
          >
            <div className="w-20 rounded-xl flex flex-col items-center gap-1.5 p-2.5" style={{ backgroundColor: '#1a2235', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: node.color + '20' }}>
                <node.Icon style={{ width: 15, height: 15, color: node.color }} />
              </div>
              <span className="text-[9px] font-medium text-center leading-tight" style={{ color: '#cbd5e1' }}>{node.label}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="absolute bottom-4 left-4">
        <div className="flex items-center gap-1.5 text-[10px]" style={{ color: laid ? '#4ade80' : '#475569', transition: 'color 500ms' }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: laid ? '#4ade80' : '#334155', transition: 'background-color 500ms' }} />
          {laid ? '5 nodes arranged' : 'Arranging...'}
        </div>
      </div>
    </div>
  );
}

function ShareMockup() {
  const [copied, setCopied] = useState(false);
  const [exported, setExported] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('Dark');

  return (
    <div className="p-5" style={{ minHeight: 380 }}>
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Share2 style={{ width: 14, height: 14, color: '#818cf8' }} />
          <span className="text-sm font-medium text-white">Share diagram</span>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="text-xs truncate" style={{ color: '#475569' }}>archflow.app/share/abc123xyz</span>
          </div>
          <button
            onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1"
            style={{ backgroundColor: copied ? '#16a34a' : '#6366f1', color: '#fff' }}
          >
            {copied ? <><Check style={{ width: 12, height: 12 }} /> Copied</> : 'Copy'}
          </button>
        </div>
        <p className="text-[10px] mt-2" style={{ color: '#334155' }}>Anyone with this link can view and interact</p>
      </div>

      <div className="h-px mb-5" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }} />

      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Download style={{ width: 14, height: 14, color: '#818cf8' }} />
          <span className="text-sm font-medium text-white">Export as PNG</span>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {['Dark', 'Light', 'Transparent'].map((opt) => (
            <button
              key={opt}
              onClick={() => setSelectedTheme(opt)}
              className="px-2 py-2 rounded-lg text-xs transition-colors"
              style={{
                border: `1px solid ${selectedTheme === opt ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)'}`,
                backgroundColor: selectedTheme === opt ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)',
                color: selectedTheme === opt ? '#818cf8' : '#64748b',
              }}
            >
              {opt}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setExported(true); setTimeout(() => setExported(false), 2000); }}
          className="w-full py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
          style={{ backgroundColor: exported ? '#16a34a' : '#6366f1', color: '#fff' }}
        >
          {exported ? <><Check style={{ width: 15, height: 15 }} /> Downloaded!</> : <><Download style={{ width: 15, height: 15 }} /> Export PNG — 3x resolution</>}
        </button>
      </div>

      <div className="rounded-xl flex items-center justify-center gap-4 py-4 px-3" style={{ backgroundColor: '#080c14', border: '1px solid rgba(255,255,255,0.06)' }}>
        {[Monitor, Zap, Brain].map((Icon, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(99,102,241,0.15)' }}>
              <Icon style={{ width: 15, height: 15, color: '#818cf8' }} />
            </div>
            {i < 2 && <div style={{ width: 20, height: 1, backgroundColor: 'rgba(99,102,241,0.35)' }} />}
          </div>
        ))}
        <span className="text-[10px] ml-1" style={{ color: '#334155' }}>architecture.png</span>
      </div>
    </div>
  );
}

// ── Steps data ────────────────────────────────────────────────────────────────

const steps = [
  { id: 'pick',    number: '01', title: 'Pick your components',    description: 'Browse 150+ pre-built architecture components organized by category. Click or drag to add to your canvas.', tab: 'Browse Components', Icon: Boxes },
  { id: 'connect', number: '02', title: 'Connect and auto-layout', description: 'Draw connections between components. One click auto-layout arranges everything into a clean hierarchy.',    tab: 'Build Diagram',      Icon: LayoutGrid },
  { id: 'share',   number: '03', title: 'Share or export',         description: 'Generate a shareable link or export as high-resolution PNG. Ready for docs, decks, and presentations.',       tab: 'Share & Export',     Icon: Share2 },
];

// ── Main component ────────────────────────────────────────────────────────────

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const mockupRef   = useRef<HTMLDivElement>(null);
  const scrollRef   = useRef<HTMLDivElement>(null); // tall scroll container
  const stickyRef   = useRef<HTMLDivElement>(null); // sticky inner panel
  const prevStep    = useRef(0);

  // Subtle mockup transition on step change — translate only, no opacity
  const animateMockup = useCallback(() => {
    if (!mockupRef.current) return;
    gsap.fromTo(mockupRef.current,
      { y: 8, scale: 0.99 },
      { y: 0, scale: 1, duration: 0.35, ease: 'power2.out' }
    );
  }, []);

  useEffect(() => {
    animateMockup();
  }, [activeStep, animateMockup]);

  // Scroll-driven step progression — NO opacity manipulation
  useEffect(() => {
    if (!scrollRef.current || !stickyRef.current) return;

    // Scroll-driven step change only
    const st = ScrollTrigger.create({
      trigger: scrollRef.current,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate(self) {
        const step = Math.min(2, Math.floor(self.progress * 3));
        if (step !== prevStep.current) {
          prevStep.current = step;
          setActiveStep(step);
        }
      },
    });

    return () => {
      st.kill();
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <section style={{ backgroundColor: '#0d1117' }} id="how-it-works">
      {/* Section divider */}
      <div className="max-w-6xl mx-auto h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(99,102,241,0.3), transparent)' }} />

      {/* Headline — outside the scroll container so it scrolls away normally */}
      <div className="max-w-6xl mx-auto px-6 lg:px-8 pt-28 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6 text-xs font-medium tracking-wide uppercase" style={{ border: '1px solid rgba(99,102,241,0.2)', backgroundColor: 'rgba(99,102,241,0.08)', color: '#818cf8' }}>
          <ArrowRight style={{ width: 12, height: 12 }} />
          How it works
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
          From blank canvas to{' '}
          <span className="bg-gradient-to-r from-indigo-300 to-indigo-500 bg-clip-text text-transparent">
            production diagram
          </span>
          {' '}in minutes
        </h2>
        <p className="text-lg max-w-md mx-auto" style={{ color: '#64748b' }}>Three steps. Scroll to explore.</p>
      </div>

      {/*
        Tall scroll container — 300vh gives ~1 viewport per step.
        The sticky child pins inside it while the user scrolls.
      */}
      <div ref={scrollRef} style={{ height: '300vh', position: 'relative' }}>
        <div
          ref={stickyRef}
          style={{ position: 'sticky', top: 0, height: '100vh', display: 'flex', alignItems: 'center' }}
        >
          <div className="w-full max-w-6xl mx-auto px-6 lg:px-8">
            {/* Tab bar */}
            <div className="flex justify-center mb-10">
              <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {steps.map((step, i) => (
                  <button
                    key={step.id}
                    onClick={() => setActiveStep(i)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                    style={{
                      backgroundColor: activeStep === i ? '#6366f1' : 'transparent',
                      color: activeStep === i ? '#fff' : '#64748b',
                      boxShadow: activeStep === i ? '0 4px 16px rgba(99,102,241,0.25)' : 'none',
                    }}
                    onMouseEnter={e => { if (activeStep !== i) { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; } }}
                    onMouseLeave={e => { if (activeStep !== i) { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.backgroundColor = 'transparent'; } }}
                  >
                    <span className="text-xs opacity-60">{step.number}</span>
                    {step.tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* Left: step text */}
              <div>
                <div className="text-8xl font-bold leading-none mb-6 select-none transition-all duration-500" style={{ color: 'rgba(99,102,241,0.07)' }}>
                  {steps[activeStep].number}
                </div>
                <h3
                  className="text-2xl font-bold text-white mb-4 transition-all duration-300"
                  key={`title-${activeStep}`}
                  style={{ animation: 'fadeSlideUp 0.35s ease forwards' }}
                >
                  {steps[activeStep].title}
                </h3>
                <p
                  className="leading-relaxed mb-8 transition-all duration-300"
                  key={`desc-${activeStep}`}
                  style={{ color: '#64748b', animation: 'fadeSlideUp 0.4s ease forwards' }}
                >
                  {steps[activeStep].description}
                </p>

                {/* Progress bar */}
                <div className="flex gap-2 items-center">
                  {steps.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveStep(i)}
                      className="h-1 rounded-full transition-all duration-500"
                      style={{
                        width: activeStep === i ? 32 : 16,
                        backgroundColor: activeStep === i ? '#6366f1' : 'rgba(255,255,255,0.1)',
                      }}
                    />
                  ))}
                  <span className="ml-2 text-xs" style={{ color: '#334155' }}>
                    {activeStep + 1} / {steps.length}
                  </span>
                </div>
              </div>

              {/* Right: mockup panel */}
              <div
                ref={mockupRef}
                className="rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: '#0d1117',
                  border: '1px solid rgba(255,255,255,0.06)',
                  boxShadow: '0 24px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
                }}
              >
                {/* Browser chrome */}
                <div className="flex items-center gap-1.5 px-4 py-3" style={{ backgroundColor: '#161b22', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#ff5f57' }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#ffbd2e' }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#28ca41' }} />
                  <div className="flex-1 mx-3">
                    <div className="rounded px-3 py-0.5 text-xs text-center max-w-[180px] mx-auto" style={{ backgroundColor: 'rgba(255,255,255,0.04)', color: '#334155' }}>
                      archflow.app/editor
                    </div>
                  </div>
                </div>

                {activeStep === 0 && <SidebarMockup />}
                {activeStep === 1 && <CanvasMockup />}
                {activeStep === 2 && <ShareMockup />}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Keyframe for text transitions */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
