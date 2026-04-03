'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Search, Boxes, Share2, Download, LayoutGrid, Monitor,
  Database, Zap, Shield, Brain, Check, ArrowRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger);

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
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-4 bg-secondary">
        <Search className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Search components...</span>
      </div>

      <div className="space-y-1">
        {categories.map((cat, i) => {
          const isOpen = activeCategory === i;
          return (
            <div key={cat.name}>
              <button
                onClick={() => setActiveCategory(isOpen ? -1 : i)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors ${isOpen ? 'bg-accent' : 'hover:bg-accent/50'}`}
              >
                <div className="flex items-center gap-2">
                  <cat.Icon className="w-4 h-4" style={{ color: cat.color }} />
                  <span className="text-xs font-medium text-foreground">{cat.name}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{cat.items.length}</span>
              </button>
              {isOpen && (
                <div className="ml-3 mt-1 space-y-0.5 mb-2">
                  {cat.items.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-muted-foreground hover:bg-accent transition-colors"
                    >
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-xs">{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="absolute bottom-4 left-0 right-0 text-center text-[10px] text-muted-foreground">
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
    { label: 'LLM API',    color: '#ec4899', Icon: Brain,    x: 80,  y: 50  },
  ];
  const cleanNodes = [
    { label: 'Client',      color: '#6366f1', Icon: Monitor,  x: 10,  y: 140 },
    { label: 'API Gateway', color: '#6366f1', Icon: Zap,      x: 140, y: 140 },
    { label: 'Auth',        color: '#6366f1', Icon: Shield,   x: 270, y: 60  },
    { label: 'LLM API',    color: '#ec4899', Icon: Brain,    x: 270, y: 220 },
    { label: 'Database',    color: '#64748b', Icon: Database, x: 400, y: 140 },
  ];
  const nodes = laid ? cleanNodes : messyNodes;

  return (
    <div className="relative" style={{ minHeight: 380 }}>
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle,_hsl(var(--border))_1px,_transparent_1px)] bg-[size:20px_20px]" />
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => setLaid(v => !v)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${laid ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground hover:bg-accent'}`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          Auto Layout
        </button>
      </div>
      <div className="absolute inset-0">
        {nodes.map((node) => (
          <div
            key={node.label}
            className="absolute"
            style={{ left: node.x + 16, top: node.y + 16, transition: `all 700ms cubic-bezier(0.34, 1.56, 0.64, 1)` }}
          >
            <div className="w-20 rounded-xl flex flex-col items-center gap-1.5 p-2.5 bg-card">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: node.color + '20' }}>
                <node.Icon className="w-4 h-4" style={{ color: node.color }} />
              </div>
              <span className="text-[9px] font-medium text-center leading-tight text-foreground">{node.label}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="absolute bottom-4 left-4">
        <div className={`flex items-center gap-1.5 text-[10px] transition-colors ${laid ? 'text-emerald-500' : 'text-muted-foreground'}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${laid ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
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
    <div className="p-5 space-y-5" style={{ minHeight: 380 }}>
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Share2 className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Share diagram</span>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center px-3 py-2 rounded-xl bg-secondary">
            <span className="text-xs truncate text-muted-foreground">archdraw.app/share/abc123xyz</span>
          </div>
          <button
            onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${copied ? 'bg-secondary text-foreground' : 'bg-primary text-primary-foreground'}`}
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <p className="text-[10px] mt-2 text-muted-foreground">Anyone with this link can view and interact</p>
      </div>

      <div className="h-px bg-foreground/10" />

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Download className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Export as PNG</span>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {['Dark', 'Light', 'Transparent'].map((opt) => (
            <button
              key={opt}
              onClick={() => setSelectedTheme(opt)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${selectedTheme === opt ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground hover:bg-accent'}`}
            >
              {opt}
            </button>
          ))}
        </div>
        <button
          className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${exported ? 'bg-secondary text-foreground' : 'bg-primary text-primary-foreground'}`}
          onClick={() => { setExported(true); setTimeout(() => setExported(false), 2000); }}
        >
          {exported ? <><Check className="w-4 h-4" /> Downloaded!</> : <><Download className="w-4 h-4" /> Export PNG — 3x resolution</>}
        </button>
      </div>

      <div className="rounded-xl flex items-center justify-center gap-4 py-4 px-3 bg-secondary">
        {[Monitor, Zap, Brain].map((Icon, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            {i < 2 && <div className="w-5 h-px bg-primary/30" />}
          </div>
        ))}
        <span className="text-[10px] ml-1 text-muted-foreground">architecture.png</span>
      </div>
    </div>
  );
}

const steps = [
  { id: 'pick',    number: '01', title: 'Pick your components',    description: 'Browse 150+ pre-built architecture components organized by category. Click or drag to add to your canvas.', tab: 'Browse Components', Icon: Boxes },
  { id: 'connect', number: '02', title: 'Connect and auto-layout', description: 'Draw connections between components. One click auto-layout arranges everything into a clean hierarchy.',    tab: 'Build Diagram',      Icon: LayoutGrid },
  { id: 'share',   number: '03', title: 'Share or export',         description: 'Generate a shareable link or export as high-resolution PNG. Ready for docs, decks, and presentations.',       tab: 'Share & Export',     Icon: Share2 },
];

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const mockupRef   = useRef<HTMLDivElement>(null);
  const scrollRef   = useRef<HTMLDivElement>(null);
  const stickyRef   = useRef<HTMLDivElement>(null);
  const prevStep    = useRef(0);

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

  useEffect(() => {
    const scrollEl = scrollRef.current;
    const stickyEl = stickyRef.current;
    if (!scrollEl || !stickyEl) return;

    const st = ScrollTrigger.create({
      trigger: scrollEl,
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
    <section className="bg-secondary/50" id="how-it-works">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 pt-28 pb-16 text-center">
        <Badge variant="secondary" className="mb-6 gap-2">
          <ArrowRight className="w-3 h-3" />
          How it works
        </Badge>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-4">
          From blank canvas to{' '}
          <span className="text-primary">
            production diagram
          </span>
          {' '}in minutes
        </h2>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">Three steps. Scroll to explore.</p>
      </div>

      <div ref={scrollRef} style={{ height: '300vh', position: 'relative' }}>
        <div
          ref={stickyRef}
          className="sticky top-0 h-screen flex items-center"
        >
          <div className="w-full max-w-6xl mx-auto px-6 lg:px-8">
            <div className="flex justify-center mb-10">
              <div className="flex gap-1 p-1 rounded-xl bg-secondary">
                {steps.map((step, i) => (
                  <button
                    key={step.id}
                    onClick={() => setActiveStep(i)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${activeStep === i ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}
                  >
                    <span className="opacity-60">{step.number}</span>
                    {step.tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="text-8xl font-bold leading-none mb-6 select-none text-primary/10">
                  {steps[activeStep].number}
                </div>
                <h3
                  className="text-2xl font-bold text-foreground mb-4"
                  key={`title-${activeStep}`}
                >
                  {steps[activeStep].title}
                </h3>
                <p
                  className="text-muted-foreground leading-relaxed mb-8"
                  key={`desc-${activeStep}`}
                >
                  {steps[activeStep].description}
                </p>

                <div className="flex gap-2 items-center">
                  {steps.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveStep(i)}
                      className={`h-1 rounded-full transition-all duration-500 ${activeStep === i ? 'w-8 bg-primary' : 'w-4 bg-muted'}`}
                    />
                  ))}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {activeStep + 1} / {steps.length}
                  </span>
                </div>
              </div>

              <div
                ref={mockupRef}
                className="rounded-2xl overflow-hidden bg-card"
                style={{ boxShadow: '0 20px 60px hsl(var(--foreground) / 0.15)' }}
              >
                <div className="flex items-center gap-1.5 px-4 py-3 bg-secondary">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary/30" />
                  <div className="w-2.5 h-2.5 rounded-full bg-primary/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-primary/15" />
                  <div className="flex-1 mx-3">
                    <div className="rounded px-3 py-0.5 text-xs text-center max-w-[180px] mx-auto bg-card text-muted-foreground">
                      archdraw.app/editor
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
    </section>
  );
}
