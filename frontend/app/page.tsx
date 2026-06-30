'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Outfit, Plus_Jakarta_Sans } from 'next/font/google';
import { 
  ArrowRight, Menu, X, Check, ArrowRightLeft, RefreshCw, Clock, 
  Paintbrush, Layers, MousePointer, ShieldCheck, Mail, Database, 
  Server, Zap, Globe, MessageSquare, BookOpen, User, Sparkles, 
  ChevronDown, CheckCircle2, Send, Lock
} from 'lucide-react';

const outfit = Outfit({ 
  subsets: ['latin'], 
  display: 'swap',
  variable: '--font-outfit'
});

const plusJakarta = Plus_Jakarta_Sans({ 
  subsets: ['latin'], 
  display: 'swap',
  variable: '--font-plus-jakarta'
});

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Docs', href: '/docs' },
];

const TECH_LOGOS = [
  'AWS', 'GCP', 'Kubernetes', 'Node.js', 'PostgreSQL',
  'Redis', 'RabbitMQ', 'React', 'Docker', 'TypeScript',
];

const AGENT_STEPS = [
  'Parsing Mermaid syntax...',
  'Generating 12 nodes...',
  'Detecting edge connections...',
  'Applying Dagre auto-layout...',
  'Rendering React Flow canvas...',
];

const FEATURES_GRID = [
  {
    title: 'AI-generated diagrams',
    desc: 'Describe your architecture in plain English; the pipeline generates structured, validated Mermaid and renders it instantly.',
    icon: <Sparkles className="w-5 h-5 text-[#5e6ad2]" />
  },
  {
    title: 'Mermaid-first pipeline',
    desc: 'Write Mermaid directly or let AI generate it. Same pipeline either way: validated, enriched, and laid out correctly.',
    icon: <CodeIcon className="w-5 h-5 text-[#5e6ad2]" />
  },
  {
    title: 'Smart auto-layout',
    desc: 'Dagre-powered layout with automatic handle selection. Nodes position themselves; you focus on the architecture.',
    icon: <Layers className="w-5 h-5 text-[#5e6ad2]" />
  },
  {
    title: 'Subgraph support',
    desc: 'Group nodes into containers with Mermaid subgraphs. Nested layouts render with correct parent-child positioning.',
    icon: <FolderIcon className="w-5 h-5 text-[#5e6ad2]" />
  },
  {
    title: 'Interactive React Flow canvas',
    desc: 'Every diagram is a live, zoomable, pannable canvas — not a static image until you choose to export one.',
    icon: <MousePointer className="w-5 h-5 text-[#5e6ad2]" />
  },
  {
    title: 'Multiple diagram types',
    desc: 'Flowcharts, sequence diagrams, system architecture, ERDs. Handles the full range of Mermaid specs.',
    icon: <Database className="w-5 h-5 text-[#5e6ad2]" />
  },
  {
    title: 'Export & share',
    desc: 'PNG, SVG, or a live shareable link. Dark theme, clean layout, presentation-ready by default.',
    icon: <Globe className="w-5 h-5 text-[#5e6ad2]" />
  },
];

function CodeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function FolderIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  );
}

const InteractiveLandingDemo = dynamic(
  () => import('@/components/landing/InteractiveLandingDemo'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[780px] rounded-2xl bg-[#0f1011] border border-[#23252a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#5e6ad2]/30 border-t-[#5e6ad2] rounded-full animate-spin" />
          <span className="text-xs text-[#8a8f98] font-medium">Loading interactive canvas...</span>
        </div>
      </div>
    )
  }
);

function TopNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 h-14 transition-all duration-200 ${
        scrolled ? 'bg-[#f7f7f5]/90 backdrop-blur-xl border-b border-[#e4e4df]/50' : 'bg-[#f7f7f5]'
      }`}
    >
      <div className="max-w-[1280px] mx-auto px-6 h-full flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#5e6ad2] flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(94,106,210,0.4)]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f7f8f8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className={`text-sm font-bold text-[#1c1c1a] tracking-tight ${outfit.className}`}>ArchDraw</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 text-sm text-[#575752] hover:text-[#5e6ad2] rounded-md transition-colors duration-150 font-medium"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <a
            href="/dashboard"
            className="text-sm text-[#575752] hover:text-[#1c1c1a] px-4 py-1.5 rounded-lg border border-[#e4e4df] bg-white hover:bg-slate-50 transition-all duration-150 font-medium"
          >
            Sign in
          </a>
          <a
            href="/dashboard"
            className="text-sm font-semibold text-white bg-[#5e6ad2] hover:bg-[#828fff] px-4 py-1.5 rounded-lg transition-all duration-150 shadow-[0_4px_12px_rgba(94,106,210,0.2)] hover:shadow-[0_4px_16px_rgba(94,106,210,0.35)] hover:-translate-y-0.5 active:translate-y-0"
          >
            Get started free
          </a>
        </div>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 text-[#575752] hover:text-[#1c1c1a] transition-colors"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size="20" /> : <Menu size="20" />}
        </button>
      </div>
      {menuOpen && (
        <div className="md:hidden bg-white border-b border-[#e4e4df] animate-in fade-in slide-in-from-top-4 duration-150">
          <div className="px-6 py-4 flex flex-col gap-2">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="text-sm text-[#575752] hover:text-[#1c1c1a] py-2 transition-colors font-medium"
              >
                {link.label}
              </a>
            ))}
            <hr className="border-[#e4e4df] my-2" />
            <a 
              href="/dashboard" 
              onClick={() => setMenuOpen(false)}
              className="text-sm text-[#575752] hover:text-[#1c1c1a] py-2 transition-colors font-medium"
            >
              Sign in
            </a>
            <a
              href="/dashboard"
              onClick={() => setMenuOpen(false)}
              className="text-sm font-semibold text-center text-white bg-[#5e6ad2] hover:bg-[#828fff] px-4 py-2.5 rounded-lg transition-colors"
            >
              Get started free
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

function HeroSection() {
  return (
    <section className="pt-[110px] pb-16 px-6 relative overflow-hidden bg-[#f7f7f5]">
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#5e6ad2]/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-[1280px] mx-auto flex flex-col items-center text-center relative z-10">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#1c1c1a] bg-[#f1f1eb] border border-[#e4e4df] rounded-full px-4 py-1.5 mb-8 shadow-inner animate-fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-[#27a644]" />
          AI-powered diagramming <span className="text-[#575752]">· Now in beta</span>
        </div>
        <h1
          className={`text-[#1c1c1a] font-bold leading-[1.05] tracking-tight max-w-[950px] ${outfit.className}`}
          style={{ fontSize: 'clamp(2.5rem, 5.5vw, 4.5rem)' }}
        >
          From idea to architecture diagram in one prompt — not one hour.
        </h1>
        <p className="mt-6 max-w-[650px] text-base md:text-lg text-[#575752] leading-relaxed font-normal">
          Describe your system in plain English or Mermaid. ArchDraw's AI pipeline handles structure, layout, and styling — so you get a clean, presentation-ready diagram in seconds, not after an hour of dragging boxes in draw.io.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-10">
          <a
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-[#5e6ad2] hover:bg-[#828fff] px-6 py-3 rounded-lg transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 shadow-[0_4px_20px_rgba(94,106,210,0.3)] hover:shadow-[0_4px_25px_rgba(94,106,210,0.45)]"
          >
            Generate my diagram free <ArrowRight size="15" />
          </a>
          <a
            href="/dashboard/templates"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm font-semibold text-[#1c1c1a] bg-white border border-[#e4e4df] hover:bg-slate-50 px-6 py-3 rounded-lg transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0"
          >
            See example diagrams
          </a>
        </div>
        
        <span className="mt-4 text-xs text-[#8a8f98] font-medium tracking-wide">
          Free during beta. No credit card, no account needed to try.
        </span>
      </div>
    </section>
  );
}

function ProblemSection() {
  const painPoints = [
    {
      title: 'Untangling crossing lines',
      desc: 'Dragging boxes and untangling messy layout routing manually in draw.io or Lucidchart.',
      icon: <ArrowRightLeft className="w-5 h-5 text-[#eb534b]" />
    },
    {
      title: 'Redoing diagrams on code change',
      desc: 'Losing diagram state and having to redo the layout completely every time your service contracts shift.',
      icon: <RefreshCw className="w-5 h-5 text-[#d4a04a]" />
    },
    {
      title: 'Losing 30 minutes in formatting',
      desc: 'Wasting precious minutes tweaking alignments, colors, and line nodes to make it look decent enough to share.',
      icon: <Clock className="w-5 h-5 text-[#5e6ad2]" />
    },
    {
      title: 'Design is not your day job',
      desc: 'You are an engineer, not a professional designer — and it shows in the generic, unaligned results.',
      icon: <Paintbrush className="w-5 h-5 text-[#1c1c1a]" />
    }
  ];

  return (
    <section className="py-24 px-6 border-t border-[#e4e4df] bg-[#f1f1eb]/30 relative">
      <div className="max-w-[1280px] mx-auto">
        <div className="max-w-[800px] mb-16">
          <span className={`text-[13px] font-bold tracking-[1.5px] uppercase text-[#8a8f98] block mb-3 ${outfit.className}`}>The Friction</span>
          <h2
            className={`text-[#1c1c1a] font-bold leading-[1.10] tracking-tight ${outfit.className}`}
            style={{ fontSize: 'clamp(2rem, 4.5vw, 3rem)' }}
          >
            Diagramming takes longer than building the thing it diagrams.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {painPoints.map((item, i) => (
            <div 
              key={i} 
              className="bg-white border border-[#e4e4df] hover:border-slate-300 p-6 rounded-xl transition-all duration-150 hover:-translate-y-1 shadow-sm"
            >
              <div className="w-10 h-10 rounded-lg bg-[#f1f1eb] border border-[#e4e4df] flex items-center justify-center mb-5">
                {item.icon}
              </div>
              <h3 className={`text-base font-bold text-[#1c1c1a] mb-2 tracking-tight ${outfit.className}`}>{item.title}</h3>
              <p className="text-sm text-[#575752] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center text-center p-8 border border-[#e4e4df] bg-white rounded-xl max-w-4xl mx-auto shadow-sm">
          <p className="text-base md:text-lg text-[#1c1c1a] font-medium italic">
            "ArchDraw skips all of that. Describe the system once. The AI handles the rest."
          </p>
          <a
            href="/dashboard"
            className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-[#5e6ad2] hover:text-[#828fff] transition-colors"
          >
            Get started now <ArrowRight size="14" className="ml-1" />
          </a>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);
  const autoRotateRef = useRef<boolean>(true);

  const steps = [
    {
      number: '01',
      title: 'Describe',
      subtitle: 'Type your system or paste Mermaid',
      desc: 'Type your architecture in plain English, upload code structures, or paste standard Mermaid code directly into the workspace.'
    },
    {
      number: '02',
      title: 'Generate',
      subtitle: 'ArchDraw builds & layouts nodes',
      desc: "Our multi-stage AI pipeline parses your intent, extracts core database dependencies, models edge flows, and layouts nodes with Dagre automatically."
    },
    {
      number: '03',
      title: 'Export',
      subtitle: 'Download PNG, SVG or share live link',
      desc: 'Get highly interactive, presentation-ready diagrams instantly. Export in vector SVG/PNG format or share private live edit links with teammates.'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      if (autoRotateRef.current) {
        setActiveStep((prev) => (prev + 1) % steps.length);
      }
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleStepClick = (index: number) => {
    autoRotateRef.current = false;
    setActiveStep(index);
  };

  return (
    <section id="how-it-works" className="py-24 px-6 border-t border-[#e4e4df] bg-[#f7f7f5] relative">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className={`text-[13px] font-bold tracking-[1.5px] uppercase text-[#8a8f98] block mb-3 ${outfit.className}`}>Workflow</span>
          <h2
            className={`text-[#1c1c1a] font-bold leading-[1.10] tracking-tight ${outfit.className}`}
            style={{ fontSize: 'clamp(2rem, 4.5vw, 3rem)' }}
          >
            From description to diagram in 3 steps
          </h2>
        </div>

        <div className="grid lg:grid-cols-5 gap-12 items-center">
          <div className="lg:col-span-2 flex flex-col gap-4">
            {steps.map((step, index) => {
              const isActive = activeStep === index;
              return (
                <button
                  key={index}
                  onClick={() => handleStepClick(index)}
                  className={`text-left p-6 rounded-xl border transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? 'bg-white border-[#5e6ad2] shadow-[0_4px_20px_rgba(94,106,210,0.05)]' 
                      : 'bg-transparent border-transparent hover:bg-white/40 hover:border-[#e4e4df]'
                  }`}
                >
                  <div className="flex gap-4 items-start">
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                      isActive ? 'bg-[#5e6ad2] text-white' : 'bg-[#f1f1eb] text-[#575752]'
                    }`}>
                      {step.number}
                    </span>
                    <div>
                      <h3 className={`text-lg font-bold text-[#1c1c1a] mb-1 ${outfit.className}`}>{step.title}</h3>
                      <h4 className={`text-xs text-[#575752] font-semibold mb-2`}>{step.subtitle}</h4>
                      {isActive && (
                        <p className="text-sm text-[#575752] leading-relaxed mt-2 animate-fade-in">
                          {step.desc}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-3 bg-white border border-[#e4e4df] rounded-xl overflow-hidden shadow-md min-h-[380px] flex flex-col">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#e4e4df] bg-[#f1f1eb]/50">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#eb534b]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#d4a04a]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#27a644]" />
                <span className="ml-2 text-[11px] text-[#575752] font-mono">console // step_{activeStep + 1}_preview</span>
              </div>
              <span className="text-[10px] font-mono text-[#5e6ad2]">
                {activeStep === 0 ? 'INPUT' : activeStep === 1 ? 'AI PIPELINE' : 'READY TO SHARE'}
              </span>
            </div>

            <div className="flex-1 p-6 flex flex-col justify-center bg-[#f9f9f7] relative min-h-[320px]">
              {activeStep === 0 && (
                <div className="w-full max-w-md mx-auto space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="text-[11px] font-mono text-[#575752]">Enter system architecture context:</div>
                  <div className="bg-white border border-[#e4e4df] rounded-lg p-4 font-mono text-xs text-[#1c1c1a] leading-relaxed relative min-h-[120px] shadow-sm">
                    <span className="text-[#5e6ad2] mr-1">Input:</span> 
                    I want to draw a microservice backend. A client sends events to a Gateway, which forwards valid payloads to a RabbitMQ Broker. An Event Consumer parses it and saves outputs into a PostgreSQL database, while caching lookups in Redis.
                    <span className="w-2 h-4 bg-[#5e6ad2] inline-block animate-pulse absolute bottom-4 right-4" />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[#8a8f98] font-mono">
                    <span>Characters: 247</span>
                    <span className="text-[#27a644] flex items-center gap-1">
                      <Check size="10" /> Valid Text Context
                    </span>
                  </div>
                </div>
              )}

              {activeStep === 1 && (
                <div className="w-full max-w-lg mx-auto space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex flex-col gap-4">
                    <div className="rounded-lg bg-white border border-[#e4e4df] p-4 shadow-sm">
                      <div className="grid grid-cols-5 gap-2 items-center justify-center">
                        <div className="border border-[#e4e4df] bg-white p-2 rounded text-center col-span-1 shadow-sm">
                          <span className="text-[10px] font-bold text-[#1c1c1a] block">Client</span>
                        </div>
                        <div className="text-center font-mono text-[#8a8f98] text-xs font-semibold">→</div>
                        <div className="border border-[#5e6ad2]/70 bg-white p-2 rounded text-center col-span-1 shadow-[0_0_10px_rgba(94,106,210,0.1)]">
                          <span className="text-[10px] font-bold text-[#1c1c1a] block">Gateway</span>
                        </div>
                        <div className="text-center font-mono text-[#8a8f98] text-xs font-semibold">→</div>
                        <div className="border border-[#ec4899]/70 bg-white p-2 rounded text-center col-span-1 shadow-[0_0_10px_rgba(236,72,153,0.08)]">
                          <span className="text-[10px] font-bold text-[#1c1c1a] block">RabbitMQ</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-center my-3 text-[#575752] text-[10px] font-mono select-none">
                        ↓ (Processes asynchronously)
                      </div>

                      <div className="grid grid-cols-5 gap-2 items-center justify-center">
                        <div className="col-span-1" />
                        <div className="col-span-1" />
                        <div className="border border-[#8b5cf6]/70 bg-white p-2 rounded text-center col-span-1 shadow-sm">
                          <span className="text-[10px] font-bold text-[#1c1c1a] block">Consumer</span>
                        </div>
                        <div className="text-center font-mono text-[#8a8f98] text-xs font-semibold">⇌</div>
                        <div className="grid grid-rows-2 gap-1.5 col-span-1">
                          <div className="border border-[#10b981]/50 bg-white p-1 rounded text-center shadow-sm">
                            <span className="text-[9px] text-[#1c1c1a]">PostgreSQL</span>
                          </div>
                          <div className="border border-[#f59e0b]/50 bg-white p-1 rounded text-center shadow-sm">
                            <span className="text-[9px] text-[#1c1c1a]">Redis Cache</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#f1f1eb] border border-[#e4e4df] rounded px-3 py-2 flex items-center justify-between">
                      <span className="text-[10px] text-[#575752] font-mono">Dagre engine layouts generated: 5 nodes, 5 edges</span>
                      <span className="text-[10px] text-[#27a644] font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#27a644] animate-ping" />
                        Generating Layout
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 2 && (
                <div className="w-full max-w-sm mx-auto space-y-5 text-center animate-in fade-in zoom-in-95 duration-200">
                  <div className="w-12 h-12 rounded-full bg-[#27a644]/10 border border-[#27a644]/30 flex items-center justify-center mx-auto mb-2 text-[#27a644]">
                    <Check size="24" className="animate-bounce" />
                  </div>
                  <div>
                    <h3 className={`text-base font-bold text-[#1c1c1a] ${outfit.className}`}>Diagram successfully built</h3>
                    <p className="text-xs text-[#575752] mt-1">Ready for document inserts, review slides, or README files</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#1c1c1a] bg-white border border-[#e4e4df] hover:bg-slate-50 p-2.5 rounded-lg cursor-pointer">
                      Export SVG
                    </button>
                    <button className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#1c1c1a] bg-white border border-[#e4e4df] hover:bg-slate-50 p-2.5 rounded-lg cursor-pointer">
                      Export PNG
                    </button>
                    <button className="col-span-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-[#5e6ad2] hover:bg-[#828fff] p-2.5 rounded-lg cursor-pointer shadow-md">
                      Copy Live Shareable Link
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureCardGrid() {
  return (
    <section id="features" className="py-24 px-6 bg-[#f7f7f5]">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center mb-16">
          <span className={`text-[13px] font-bold tracking-[1.5px] uppercase text-[#8a8f98] block mb-3 ${outfit.className}`}>Features</span>
          <h2
            className={`text-[#1c1c1a] font-bold leading-[1.15] tracking-tight text-center max-w-[680px] mx-auto ${outfit.className}`}
            style={{ fontSize: 'clamp(2rem, 4.5vw, 3rem)' }}
          >
            Everything you need to map complex architecture
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#e4e4df] rounded-xl overflow-hidden border border-[#e4e4df] shadow-md">
          {FEATURES_GRID.map((f, i) => (
            <div key={i} className="bg-white hover:bg-slate-50/50 transition-all duration-150 p-8 flex flex-col gap-4">
              <div className="w-9 h-9 rounded bg-[#f1f1eb] border border-[#e4e4df] flex items-center justify-center shrink-0 shadow-sm">
                {f.icon}
              </div>
              <div>
                <h3 className={`text-lg font-bold text-[#1c1c1a] tracking-tight mb-2 ${outfit.className}`}>{f.title}</h3>
                <p className="text-sm text-[#575752] leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function InteractiveDemoSection() {
  return (
    <section className="py-24 px-6 bg-[#f7f7f5] relative border-t border-[#e4e4df]">
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#5e6ad2]/2 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-[1280px] mx-auto flex flex-col items-center relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className={`text-[13px] font-bold tracking-[1.5px] uppercase text-[#8a8f98] block mb-3 ${outfit.className}`}>Try it out</span>
          <h2
            className={`text-[#1c1c1a] font-bold leading-[1.10] tracking-tight ${outfit.className}`}
            style={{ fontSize: 'clamp(2rem, 4.5vw, 3rem)' }}
          >
            Try it right here — no sign-up needed
          </h2>
          <p className="mt-4 text-sm md:text-base text-[#575752] max-w-[550px] mx-auto leading-relaxed">
            This is a real ArchDraw canvas. Drag the nodes, zoom in, or type a prompt below.
          </p>
        </div>
        
        <div className="w-full">
          <InteractiveLandingDemo />
        </div>
      </div>
    </section>
  );
}

function BuiltForStack() {
  return (
    <section className="py-16 px-6 border-t border-b border-[#e4e4df] bg-[#f1f1eb]/30 overflow-hidden">
      <div className="max-w-[1280px] mx-auto text-center">
        <h2 className={`text-base font-bold uppercase tracking-[1.5px] text-[#8a8f98] mb-2 ${outfit.className}`}>
          Speaks the language of your stack
        </h2>
        <p className="text-sm text-[#575752] mb-8 font-medium">
          ArchDraw understands the services and tools you already design around.
        </p>
        <div className="relative overflow-hidden mask-fade-x">
          <div className="flex gap-16 animate-marquee" style={{ width: 'max-content' }}>
            {[...TECH_LOGOS, ...TECH_LOGOS, ...TECH_LOGOS].map((name, i) => (
              <span key={i} className="text-sm text-[#575752] hover:text-[#1c1c1a] whitespace-nowrap font-mono font-semibold transition-colors duration-150 select-none">
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function WhoUsesSection() {
  const personas = [
    {
      title: 'Students',
      desc: 'Practice system design interview diagrams, or finish project docs fast without getting stuck dragging margins.',
      icon: <BookOpen className="w-5 h-5 text-[#5e6ad2]" />
    },
    {
      title: 'Engineers & Teams',
      desc: 'Document real production architecture in seconds for onboarding, architecture reviews, and markdown READMEs.',
      icon: <Layers className="w-5 h-5 text-[#27a644]" />
    },
    {
      title: 'Technical Writers',
      desc: 'Embed accurate, crisp diagrams for user documentation, without spending hours learning complex design tools.',
      icon: <MessageSquare className="w-5 h-5 text-[#d4a04a]" />
    },
    {
      title: 'Researchers & Founders',
      desc: 'Explain highly complex technical systems clearly to stakeholders or cross-functional collaborators in one view.',
      icon: <User className="w-5 h-5 text-[#1c1c1a]" />
    }
  ];

  return (
    <section className="py-24 px-6 bg-[#f7f7f5]">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className={`text-[13px] font-bold tracking-[1.5px] uppercase text-[#8a8f98] block mb-3 ${outfit.className}`}>Audiences</span>
          <h2
            className={`text-[#1c1c1a] font-bold leading-[1.10] tracking-tight ${outfit.className}`}
            style={{ fontSize: 'clamp(2rem, 4.5vw, 3rem)' }}
          >
            Built for anyone who needs to explain systems visually
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {personas.map((persona, i) => (
            <div 
              key={i} 
              className="bg-white border border-[#e4e4df] hover:border-slate-300 p-6 rounded-xl transition-all duration-150 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="w-9 h-9 rounded bg-[#f1f1eb] border border-[#e4e4df] flex items-center justify-center mb-5">
                  {persona.icon}
                </div>
                <h3 className={`text-base font-bold text-[#1c1c1a] mb-2 tracking-tight ${outfit.className}`}>{persona.title}</h3>
                <p className="text-sm text-[#575752] leading-relaxed">{persona.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FounderNote() {
  return (
    <section className="py-24 px-6 border-t border-[#e4e4df] bg-[#f1f1eb]/30 relative">
      <div className="max-w-[760px] mx-auto bg-white border border-[#e4e4df] rounded-xl p-8 md:p-12 relative shadow-md">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
          <div className="flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-[#f1f1eb] border-2 border-[#5e6ad2] flex items-center justify-center overflow-hidden shadow-lg select-none">
              <span className={`text-lg font-bold text-[#1c1c1a] ${outfit.className}`}>AS</span>
            </div>
          </div>
          <div>
            <span className={`text-xs font-bold uppercase tracking-wider text-[#5e6ad2] block mb-2`}>Developer Note</span>
            <h3 className={`text-xl font-bold text-[#1c1c1a] mb-4 ${outfit.className}`}>Hey, I'm Abhishek 👋</h3>
            <div className="space-y-4 text-sm text-[#575752] leading-relaxed font-normal">
              <p>
                I'm a final-year engineering student, and I built ArchDraw because I kept losing more time formatting a diagram than thinking about the architecture itself.
              </p>
              <p>
                Every system design interview, every project doc, every README needed a diagram — and every time, I'd open draw.io, drag the same boxes around, and burn 30 minutes I didn't have.
              </p>
              <p>
                So I built an AI pipeline to handle the part that doesn't need a human: layout, styling, alignment. You focus on the system. ArchDraw handles the diagram.
              </p>
              <p>
                I'm building this in public as a solo developer. If you try it and something's rough, I'd genuinely want to hear about it.
              </p>
            </div>
            
            <div className="mt-6 pt-6 border-t border-[#e4e4df] flex items-center gap-3">
              <div>
                <div className={`text-sm font-semibold text-[#1c1c1a] ${outfit.className}`}>Abhishek Suresh Jamdade</div>
                <div className="text-[11px] text-[#8a8f98]">Founder, ArchDraw</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    try {
      if (localStorage.getItem('archdraw-waitlist-joined') === 'true') {
        setSubmitted(true);
      }
    } catch {}
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      try {
        localStorage.setItem('archdraw-waitlist-joined', 'true');
        localStorage.setItem('archdraw-waitlist-email', email);
      } catch {}
    }, 1000);
  };

  return (
    <section id="pricing" className="py-24 px-6 border-t border-[#e4e4df] bg-[#f7f7f5]">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center max-w-xl mx-auto mb-16">
          <span className={`text-[13px] font-bold tracking-[1.5px] uppercase text-[#8a8f98] block mb-3 ${outfit.className}`}>Pricing</span>
          <h2
            className={`text-[#1c1c1a] font-bold leading-[1.10] tracking-tight ${outfit.className}`}
            style={{ fontSize: 'clamp(2rem, 4.5vw, 3rem)' }}
          >
            Free during beta
          </h2>
          <p className="mt-4 text-sm text-[#575752] max-w-[480px] mx-auto leading-relaxed">
            ArchDraw is free to use while in beta. Paid plans are coming — early users will get a locked-in discount when they launch.
          </p>
        </div>

        <div className="max-w-md mx-auto bg-white border border-[#e4e4df] rounded-xl p-8 shadow-md relative">
          <div className="absolute -top-3 right-6 bg-[#5e6ad2] text-white text-[9px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full shadow-sm">
            Beta Pass
          </div>
          
          <div className="mb-6">
            <h3 className={`text-lg font-bold text-[#1c1c1a] mb-1 ${outfit.className}`}>Beta access</h3>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-3xl font-extrabold text-[#1c1c1a]">$0</span>
              <span className="text-xs text-[#575752]">/ free forever in beta</span>
            </div>
          </div>

          <ul className="space-y-3 mb-8 text-sm text-[#575752]">
            <li className="flex items-center gap-2">
              <Check size="16" className="text-[#27a644] shrink-0" />
              <span>Unlimited diagram generation</span>
            </li>
            <li className="flex items-center gap-2">
              <Check size="16" className="text-[#27a644] shrink-0" />
              <span>Mermaid workspace editor</span>
            </li>
            <li className="flex items-center gap-2">
              <Check size="16" className="text-[#27a644] shrink-0" />
              <span>SVG, PNG, and Live share link export</span>
            </li>
            <li className="flex items-center gap-2">
              <Check size="16" className="text-[#27a644] shrink-0" />
              <span>No credit card required</span>
            </li>
          </ul>

          <div className="border-t border-[#e4e4df] pt-6">
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="text-xs text-[#575752] font-medium block mb-1">
                  Want updates and locked-in launch discount? Join waitlist:
                </div>
                <div className="flex gap-2 bg-[#f9f9f7] border border-[#e4e4df] focus-within:border-[#5e6ad2] rounded-lg p-1.5 transition-colors relative">
                  <div className="flex items-center pl-2 text-[#8a8f98]">
                    <Mail size="14" />
                  </div>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="bg-transparent border-none outline-none text-xs text-[#1c1c1a] placeholder-[#8a8f98] flex-1 py-1.5 px-1 min-w-0"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#5e6ad2] hover:bg-[#828fff] text-white text-xs font-semibold px-4 py-1.5 rounded-md transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Join <Send size="10" />
                      </>
                    )}
                  </button>
                </div>
                {errorMsg && (
                  <p className="text-xs text-[#eb534b] font-medium pl-1 animate-fade-in">{errorMsg}</p>
                )}
              </form>
            ) : (
              <div className="bg-[#27a644]/10 border border-[#27a644]/30 rounded-lg p-4 text-center animate-in fade-in zoom-in-95 duration-150">
                <CheckCircle2 size="24" className="text-[#27a644] mx-auto mb-2" />
                <h4 className={`text-sm font-bold text-[#1c1c1a] ${outfit.className}`}>Waitlist joined!</h4>
                <p className="text-xs text-[#575752] mt-1">We've locked in your early adopter discount. We'll notify you on launch!</p>
              </div>
            )}
          </div>
          
          <a
            href="/dashboard"
            className="mt-6 w-full inline-flex items-center justify-center gap-2 text-xs font-bold text-[#1c1c1a] bg-[#f1f1eb] border border-[#e4e4df] hover:bg-slate-100 p-3 rounded-lg transition-colors cursor-pointer"
          >
            Get started free immediately
          </a>
        </div>
      </div>
    </section>
  );
}

interface FAQItem {
  q: string;
  a: string;
}

function FAQSection() {
  const faqs: FAQItem[] = [
    {
      q: 'Is ArchDraw free?',
      a: 'Yes, ArchDraw is completely free to use while we are in pre-launch beta. Paid subscriptions will be introduced down the line, but early users signing up for the waitlist will get a permanently locked-in launch discount.'
    },
    {
      q: 'Do I need an account to try it?',
      a: 'No. You can try the generator, inspect canvas structures, and design live diagrams in the workspace without signing up or creating an account.'
    },
    {
      q: 'How is this different from draw.io or Lucidchart?',
      a: 'Manual editing systems like draw.io require you to manually drag, connect, align, and restyle every single box. ArchDraw uses automated layouts. You simply type your system architecture in plain text, and the AI lays out the components perfectly, avoiding overlapping lines.'
    },
    {
      q: 'How is this different from Eraser/DiagramGPT or similar AI tools?',
      a: 'ArchDraw is built on a Mermaid-first pipeline that combines full custom Mermaid editing with AI generation. Instead of locked-in proprietary formats or static images, you get fully interactive, zoomable React Flow canvas diagrams. Plus, it exposes a direct Model Context Protocol (MCP) server so you can use it directly inside AI assistants like Claude Desktop.'
    },
    {
      q: 'Can I write my own Mermaid code?',
      a: 'Yes! The workspace features a fully-functional Mermaid syntax code editor with live syntax checking, highlighting, and auto-rendering.'
    },
    {
      q: 'What can I export to?',
      a: 'You can export diagrams in high-definition PNG format, vector SVG for scalable web layouts, or generate a permanent live shareable link to email or Slack teammates.'
    },
    {
      q: 'Is ArchDraw good for system design interview prep?',
      a: 'Yes, absolutely. Students use it to quickly construct clear system schemas during whiteboard interview prep sessions, saving hours of drawing.'
    },
    {
      q: 'Is my data stored or used to train anything?',
      a: 'No. Your prompts, code segments, and schema inputs are processed temporarily to output standard layout coordinates, but they are not stored on our databases or shared with external model trainers. Everything is sandboxed locally in your browser session.'
    }
  ];

  return (
    <section id="faq" className="py-24 px-6 border-t border-[#e4e4df] bg-[#f1f1eb]/20">
      <div className="max-w-[800px] mx-auto">
        <div className="text-center max-w-xl mx-auto mb-16">
          <span className={`text-[13px] font-bold tracking-[1.5px] uppercase text-[#8a8f98] block mb-3 ${outfit.className}`}>FAQ</span>
          <h2
            className={`text-[#1c1c1a] font-bold leading-[1.10] tracking-tight ${outfit.className}`}
            style={{ fontSize: 'clamp(2rem, 4.5vw, 3rem)' }}
          >
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <FAQAccordion key={i} faq={faq} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQAccordion({ faq }: { faq: FAQItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-[#e4e4df] bg-white rounded-xl overflow-hidden transition-colors duration-150 shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left text-sm font-semibold text-[#1c1c1a] hover:text-[#5e6ad2] transition-colors cursor-pointer select-none"
      >
        <span className={`${outfit.className} text-sm md:text-base pr-4`}>{faq.q}</span>
        <ChevronDown 
          size="16" 
          className={`text-[#8a8f98] shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180 text-[#5e6ad2]' : ''
          }`} 
        />
      </button>
      
      <div 
        className={`transition-all duration-300 ease-in-out ${
          open ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
        } overflow-hidden`}
      >
        <div className="p-5 pt-0 border-t border-[#e4e4df]/50 text-xs md:text-sm text-[#575752] leading-relaxed font-normal bg-[#f9f9f7]">
          {faq.a}
        </div>
      </div>
    </div>
  );
}

function CTABanner() {
  return (
    <section className="py-24 px-6 bg-[#f7f7f5] border-t border-[#e4e4df] relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] bg-[#5e6ad2]/2 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="max-w-[960px] mx-auto bg-white border border-[#e4e4df] rounded-xl p-12 text-center relative z-10 shadow-md">
        <h2
          className={`text-[#1c1c1a] font-bold leading-[1.15] tracking-tight ${outfit.className}`}
          style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}
        >
          Stop dragging boxes. Start describing systems.
        </h2>
        <p className="mt-4 text-base text-[#575752] max-w-[500px] mx-auto leading-relaxed font-normal">
          Get clean, structured, presentation-ready diagrams in seconds. Free to use, no credit card required.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
          <a
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-[#5e6ad2] hover:bg-[#828fff] px-6 py-3 rounded-lg transition-colors shadow-md cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
          >
            Generate my diagram free <ArrowRight size="15" />
          </a>
          <a
            href="/dashboard/templates"
            className="w-full sm:w-auto text-sm font-semibold text-[#1c1c1a] bg-[#f1f1eb] border border-[#e4e4df] hover:bg-slate-100 px-6 py-3 rounded-lg transition-colors cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
          >
            See example diagrams
          </a>
        </div>
        <div className="mt-4 text-xs text-[#8a8f98] font-semibold flex items-center justify-center gap-1.5">
          <Lock size="10" /> Free during beta. No account required to try.
        </div>
      </div>
    </section>
  );
}

function FooterSection() {
  const columns = [
    { 
      title: 'Product', 
      links: [
        { label: 'Features', href: '#features' },
        { label: 'Mermaid Editor', href: '/dashboard' },
        { label: 'AI Pipeline', href: '#how-it-works' },
        { label: 'Export', href: '/dashboard' }
      ] 
    },
    { 
      title: 'Resources', 
      links: [
        { label: 'Docs', href: '/docs' },
        { label: 'Examples', href: '/dashboard/templates' },
        { label: 'Changelog', href: '#how-it-works' },
        { label: 'GitHub', href: 'https://github.com' }
      ] 
    },
    { 
      title: 'Company', 
      links: [
        { label: 'About', href: '#founder-note' },
        { label: 'Twitter/X', href: 'https://twitter.com' },
        { label: 'Contact', href: 'mailto:contact@archdraw.app' }
      ] 
    },
  ];

  return (
    <footer className="py-16 px-6 bg-[#f1f1eb] border-t border-[#e4e4df] relative z-10">
      <div className="max-w-[1280px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-md bg-[#5e6ad2] flex items-center justify-center shadow-md">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f7f8f8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className={`text-sm font-bold text-[#1c1c1a] tracking-tight ${outfit.className}`}>ArchDraw</span>
            </Link>
            <p className="text-xs text-[#575752] max-w-[240px] leading-relaxed font-semibold">
              A diagramming tool for engineers who think in systems.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className={`text-xs font-bold uppercase tracking-wider text-[#1c1c1a] mb-3 ${outfit.className}`}>{col.title}</h4>
              <ul className="flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a 
                      href={link.href} 
                      className="text-xs text-[#575752] hover:text-[#1c1c1a] transition-colors duration-150 font-medium"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-6 border-t border-[#e4e4df] text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-xs text-[#8a8f98] font-semibold">&copy; 2026 ArchDraw. Built for engineers.</span>
          <span className="text-xs text-[#8a8f98] font-semibold">Crafted in public by Abhishek.</span>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    try { localStorage.setItem('archdraw-theme', 'light'); } catch {}
  }, []);

  return (
    <div className={`min-h-screen bg-[#f7f7f5] text-[#1c1c1a] antialiased ${plusJakarta.className} ${outfit.variable} ${plusJakarta.variable}`}>
      <TopNav />
      <main>
        <HeroSection />
        <InteractiveDemoSection />
        <BuiltForStack />
        <ProblemSection />
        <HowItWorksSection />
        <FeatureCardGrid />
        <WhoUsesSection />
        <div id="founder-note">
          <FounderNote />
        </div>
        <PricingSection />
        <FAQSection />
        <CTABanner />
      </main>
      <FooterSection />
    </div>
  );
}
