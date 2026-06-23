'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Inter } from 'next/font/google';
import { ArrowRight, Menu, X } from 'lucide-react';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

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
    title: 'React Flow rendering',
    desc: 'Every diagram renders as a live React Flow canvas — zoomable, pannable, and fully interactive.',
  },
  {
    title: 'Smart auto-layout',
    desc: 'Dagre layout engine positions nodes automatically with correct top-to-bottom flow and smart edge handle selection.',
  },
  {
    title: 'Subgraph support',
    desc: 'Group nodes into containers with Mermaid subgraphs. ArchDraw renders nested layouts with correct parent-child positioning.',
  },
  {
    title: 'AI-generated diagrams',
    desc: 'Describe your architecture in plain English. The AI pipeline generates structured, validated Mermaid and renders it instantly.',
  },
  {
    title: 'Mermaid code editor',
    desc: 'Full Mermaid syntax support with a built-in editor and live preview. Write code, see the diagram — no friction.',
  },
  {
    title: 'Multiple diagram types',
    desc: 'Flowcharts, sequence diagrams, system architecture, ERDs. ArchDraw handles the full range of Mermaid diagram types.',
  },
];

const FOOTER_COLUMNS = [
  { title: 'Product', links: ['Features', 'Mermaid Editor', 'AI Pipeline', 'Export'] },
  { title: 'Resources', links: ['Docs', 'Examples', 'Changelog', 'GitHub'] },
  { title: 'Company', links: ['About', 'Twitter/X', 'Contact'] },
];

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
        scrolled ? 'bg-[#010102]/90 backdrop-blur-xl' : 'bg-[#010102]'
      }`}
    >
      <div className="max-w-[1280px] mx-auto px-6 h-full flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#5e6ad2] flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f7f8f8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-[#f7f8f8] tracking-tight">ArchDraw</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 text-sm text-[#8a8f98] hover:text-[#f7f8f8] rounded-md transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <a
            href="/login"
            className="text-sm text-[#8a8f98] hover:text-[#f7f8f8] px-4 py-1.5 rounded-lg border border-[#23252a] bg-[#0f1011] transition-colors"
          >
            Sign in
          </a>
          <a
            href="/dashboard"
            className="text-sm font-medium text-[#f7f8f8] bg-[#5e6ad2] hover:bg-[#828fff] px-4 py-1.5 rounded-lg transition-colors"
          >
            Get started free
          </a>
        </div>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 text-[#8a8f98] hover:text-[#f7f8f8]"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size="20" /> : <Menu size="20" />}
        </button>
      </div>
      {menuOpen && (
        <div className="md:hidden bg-[#0f1011] border-b border-[#23252a]">
          <div className="px-6 py-4 flex flex-col gap-2">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="text-sm text-[#8a8f98] hover:text-[#f7f8f8] py-2 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <hr className="border-[#23252a] my-2" />
            <a href="/login" className="text-sm text-[#8a8f98] hover:text-[#f7f8f8] py-2 transition-colors">
              Sign in
            </a>
            <a
              href="/dashboard"
              className="text-sm font-medium text-center text-[#f7f8f8] bg-[#5e6ad2] hover:bg-[#828fff] px-4 py-2 rounded-lg transition-colors"
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
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % AGENT_STEPS.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="pt-[120px] pb-20 px-6">
      <div className="max-w-[1280px] mx-auto flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 text-sm text-[#d0d6e0] bg-[#18191a] border border-[#23252a] rounded-full px-4 py-1.5 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#27a644]" />
          AI-powered diagramming <span className="text-[#62666d]">· Now in beta</span>
        </div>
        <h1
          className="text-[#f7f8f8] font-semibold leading-[1.05] tracking-[-3px] max-w-[900px]"
          style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}
        >
          Architecture diagrams,<br />generated by AI.
        </h1>
        <p className="mt-5 max-w-[520px] text-lg text-[#d0d6e0] leading-relaxed tracking-[-0.1px]">
          Describe your system in plain English or Mermaid. ArchDraw generates professional React Flow diagrams in seconds.
        </p>
        <div className="flex items-center gap-3 mt-8">
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#f7f8f8] bg-[#5e6ad2] hover:bg-[#828fff] px-5 py-2.5 rounded-lg transition-colors"
          >
            Start diagramming free <ArrowRight size="14" />
          </a>
          <a
            href="/examples"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#f7f8f8] bg-[#0f1011] border border-[#23252a] hover:bg-[#141516] px-5 py-2.5 rounded-lg transition-colors"
          >
            View examples
          </a>
        </div>
        <div className="mt-12 w-full max-w-[1100px] bg-[#0f1011] border border-[#23252a] rounded-xl overflow-hidden">
          <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-[#23252a]">
            <div className="w-2.5 h-2.5 rounded-full bg-[#eb534b]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#d4a04a]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#27a644]" />
            <span className="ml-2 text-xs text-[#62666d] font-mono">system-architecture — ArchDraw</span>
          </div>
          <div className="p-6 bg-[#010102] min-h-[400px] flex flex-col">
            <div className="flex gap-4 flex-1">
              <div className="flex-1 rounded-lg bg-[#0f1011] border border-[#23252a] p-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-3 flex items-center gap-2 rounded-lg border border-[#23252a] bg-[#141516] p-3">
                    <div className="w-8 h-8 rounded-md bg-[#5e6ad2]/20 border border-[#5e6ad2]/30 flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5e6ad2" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-medium text-[#f7f8f8]">API Gateway</div>
                      <div className="text-[10px] text-[#62666d]">2 replicas · us-east-1</div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-[#23252a] bg-[#141516] p-3 flex flex-col items-center gap-2">
                    <div className="w-9 h-9 rounded-md bg-[#5e6ad2]/20 border border-[#5e6ad2]/30 flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5e6ad2" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                    </div>
                    <span className="text-xs font-medium text-[#f7f8f8]">Auth</span>
                    <span className="text-[10px] text-[#62666d]">Service</span>
                  </div>
                  <div className="rounded-lg border border-[#23252a] bg-[#141516] p-3 flex flex-col items-center gap-2">
                    <div className="w-9 h-9 rounded-md bg-[#27a644]/20 border border-[#27a644]/30 flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#27a644" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>
                    </div>
                    <span className="text-xs font-medium text-[#f7f8f8]">User DB</span>
                    <span className="text-[10px] text-[#62666d]">Primary</span>
                  </div>
                  <div className="rounded-lg border border-[#23252a] bg-[#141516] p-3 flex flex-col items-center gap-2">
                    <div className="w-9 h-9 rounded-md bg-[#d4a04a]/20 border border-[#d4a04a]/30 flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d4a04a" strokeWidth="2"><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></svg>
                    </div>
                    <span className="text-xs font-medium text-[#f7f8f8]">Redis</span>
                    <span className="text-[10px] text-[#62666d]">Cache</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <div className="h-px flex-1 bg-[#23252a]" />
                  <span className="text-[10px] font-mono text-[#5e6ad2]">subgraph: payments</span>
                  <div className="h-px flex-1 bg-[#23252a]" />
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="rounded-lg border border-[#23252a] bg-[#18191a] p-2.5 flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-[#5e6ad2]/15 flex items-center justify-center">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#5e6ad2" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z" /></svg>
                    </div>
                    <span className="text-xs text-[#d0d6e0]">Payment API</span>
                  </div>
                  <div className="rounded-lg border border-[#23252a] bg-[#18191a] p-2.5 flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-[#27a644]/15 flex items-center justify-center">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#27a644" strokeWidth="2.5"><ellipse cx="12" cy="5" rx="9" ry="3" /></svg>
                    </div>
                    <span className="text-xs text-[#d0d6e0]">Payment DB</span>
                  </div>
                </div>
              </div>
              <div className="w-[220px] flex-shrink-0 rounded-lg bg-[#0f1011] border border-[#23252a] p-3 hidden lg:flex flex-col gap-2">
                <div className="text-[10px] font-mono text-[#62666d] uppercase tracking-wider">Mermaid</div>
                <pre className="text-[10px] font-mono text-[#8a8f98] leading-relaxed">
{`graph TD
  Gateway-->Auth
  Gateway-->Payment
  Auth-->UserDB
  Payment-->PayDB
  Gateway-->Redis`}</pre>
                <div className="mt-auto pt-2 border-t border-[#23252a]">
                  <div className="flex items-center gap-1.5 text-[10px] text-[#27a644]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#27a644]" />
                    Valid — 5 nodes, 5 edges
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-3 rounded-full bg-[#18191a] border border-[#23252a] px-4 py-2 flex items-center gap-2.5 max-w-[420px]">
              <span className="text-[10px] text-[#5e6ad2] font-mono shrink-0">✦</span>
              <div className="h-3.5 overflow-hidden relative flex-1">
                <span
                  className="absolute inset-0 text-[11px] font-mono text-[#8a8f98] transition-all duration-500"
                  key={stepIndex}
                  style={{ animation: 'none' }}
                >
                  {AGENT_STEPS[stepIndex]}
                </span>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-[#27a644] animate-pulse shrink-0" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SocialProofMarquee() {
  return (
    <section className="py-12 px-6 overflow-hidden">
      <div className="max-w-[1280px] mx-auto text-center">
        <div className="text-[13px] font-medium tracking-[0.4px] uppercase text-[#62666d] mb-6">Trusted for system design</div>
        <div className="relative overflow-hidden mask-fade-x">
          <div className="flex gap-16 animate-marquee" style={{ width: 'max-content' }}>
            {[...TECH_LOGOS, ...TECH_LOGOS].map((name, i) => (
              <span key={i} className="text-sm text-[#62666d] whitespace-nowrap">
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function StatementSection() {
  return (
    <section className="py-16 px-6">
      <div className="max-w-[1280px] mx-auto grid md:grid-cols-5 gap-12">
        <div className="md:col-span-3">
          <h2
            className="text-[#f7f8f8] font-semibold leading-[1.15] tracking-[-1px]"
            style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}
          >
            A new kind of diagramming tool. Built for engineers who think in systems.
          </h2>
        </div>
        <div className="md:col-span-2 flex flex-col gap-8">
          {[
            {
              label: 'DIAGRAM 01',
              title: 'Natural language to diagram',
              desc: 'Describe your architecture in plain English. ArchDraw\'s AI pipeline converts it to a structured React Flow diagram automatically.',
            },
            {
              label: 'DIAGRAM 02',
              title: 'Mermaid-first pipeline',
              desc: 'Write Mermaid syntax directly or let AI generate it. The multi-stage pipeline validates, enriches, and renders it with correct layout.',
            },
            {
              label: 'DIAGRAM 03',
              title: 'Layout that actually works',
              desc: 'Dagre-powered automatic layout with smart handle selection. Nodes position themselves — you focus on the architecture.',
            },
          ].map((item, i) => (
            <div key={i} className={`flex flex-col gap-2 ${i > 0 ? 'pt-8 border-t border-[#23252a]' : ''}`}>
              <span className="text-[13px] font-medium tracking-[0.4px] uppercase text-[#5e6ad2]">{item.label}</span>
              <h3 className="text-xl font-semibold text-[#f7f8f8] tracking-[-0.4px]">{item.title}</h3>
              <p className="text-sm text-[#8a8f98] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DeepDiveSection({ bg, eyebrow, headline, body, reverse }: {
  bg: 'canvas' | 'surface';
  eyebrow: string;
  headline: string;
  body: string;
  reverse?: boolean;
}) {
  const isSurface = bg === 'surface';
  return (
    <section className={`py-24 px-6 ${isSurface ? 'bg-[#0f1011] border-y border-[#23252a]' : 'bg-[#010102]'}`}>
      <div className={`max-w-[1280px] mx-auto flex flex-col ${reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-16`}>
        <div className="flex-1">
          <span className="text-[13px] font-medium tracking-[0.4px] uppercase text-[#8a8f98]">{eyebrow}</span>
          <h2
            className="mt-3 text-[#f7f8f8] font-semibold leading-[1.10] tracking-[-1.8px]"
            style={{ fontSize: 'clamp(1.75rem, 4.5vw, 3.5rem)' }}
          >
            {headline}
          </h2>
          <p className="mt-4 text-lg text-[#d0d6e0] leading-relaxed max-w-[480px]">{body}</p>
        </div>
        <div className="flex-1 w-full max-w-[560px]">
          <div className="bg-[#0f1011] border border-[#23252a] rounded-xl overflow-hidden">
            <div className="flex items-center gap-1.5 px-4 py-2 border-b border-[#23252a]">
              <div className="w-2 h-2 rounded-full bg-[#eb534b]" />
              <div className="w-2 h-2 rounded-full bg-[#d4a04a]" />
              <div className="w-2 h-2 rounded-full bg-[#27a644]" />
            </div>
            <div className="p-5 bg-[#010102] min-h-[240px] flex items-center justify-center">
              <div className="w-full rounded-lg bg-[#0f1011] border border-[#23252a] p-4">
                <div className="flex gap-3 items-center mb-3 pb-3 border-b border-[#23252a]">
                  <div className="w-6 h-6 rounded bg-[#5e6ad2]/20 flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#5e6ad2" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                  </div>
                  <div className="flex-1 text-xs text-[#d0d6e0]">Live preview · React Flow canvas</div>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#27a644]" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {['Web App', 'API', 'DB'].map((s, i) => (
                    <div key={i} className="rounded border border-[#23252a] bg-[#141516] p-2 flex flex-col items-center gap-1.5">
                      <div className="w-full h-6 rounded bg-[#5e6ad2]/15 flex items-center justify-center">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#5e6ad2" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /></svg>
                      </div>
                      <span className="text-[10px] text-[#d0d6e0]">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureCardGrid() {
  return (
    <section id="features" className="py-24 px-6 bg-[#010102]">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center mb-16">
          <div className="text-[13px] font-medium tracking-[0.4px] uppercase text-[#62666d] mb-4">Built for engineers</div>
          <h2
            className="text-[#f7f8f8] font-semibold leading-[1.15] tracking-[-1px] text-center max-w-[640px] mx-auto"
            style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}
          >
            Everything you need to diagram your system architecture
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#23252a] rounded-xl overflow-hidden border border-[#23252a]">
          {FEATURES_GRID.map((f, i) => (
            <div key={i} className="bg-[#0f1011] hover:bg-[#141516] transition-colors duration-150 p-6 flex flex-col gap-3">
              <h3 className="text-xl font-semibold text-[#f7f8f8] tracking-[-0.4px]">{f.title}</h3>
              <p className="text-sm text-[#8a8f98] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTABanner() {
  return (
    <section className="py-24 px-6 bg-[#010102]">
      <div className="max-w-[960px] mx-auto bg-[#0f1011] border border-[#23252a] rounded-xl p-12 text-center">
        <h2
          className="text-[#f7f8f8] font-semibold leading-[1.15] tracking-[-1px]"
          style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.5rem)' }}
        >
          Start building your first diagram
        </h2>
        <p className="mt-3 text-lg text-[#d0d6e0] max-w-[480px] mx-auto leading-relaxed">
          Free to use. No account required to try. Import Mermaid or describe your system and ArchDraw handles the rest.
        </p>
        <div className="flex items-center justify-center gap-3 mt-8 flex-wrap">
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#f7f8f8] bg-[#5e6ad2] hover:bg-[#828fff] px-6 py-2.5 rounded-lg transition-colors"
          >
            Start diagramming free <ArrowRight size="14" />
          </a>
          <a
            href="/examples"
            className="text-sm font-medium text-[#f7f8f8] bg-[#0f1011] border border-[#23252a] hover:bg-[#141516] px-6 py-2.5 rounded-lg transition-colors"
          >
            See example diagrams
          </a>
        </div>
      </div>
    </section>
  );
}

function FooterSection() {
  return (
    <footer className="py-16 px-6 bg-[#010102] border-t border-[#23252a]">
      <div className="max-w-[1280px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-md bg-[#5e6ad2] flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f7f8f8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-[#f7f8f8] tracking-tight">ArchDraw</span>
            </Link>
            <p className="text-sm text-[#62666d] max-w-[240px] leading-relaxed">
              A diagramming tool for engineers who think in systems.
            </p>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-medium text-[#f7f8f8] mb-3">{col.title}</h4>
              <ul className="flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-[#8a8f98] hover:text-[#f7f8f8] transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-6 border-t border-[#23252a] text-center md:text-left">
          <span className="text-sm text-[#62666d]">&copy; 2025 ArchDraw. Built for engineers.</span>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
    try { localStorage.setItem('archdraw-theme', 'dark'); } catch {}
  }, []);

  return (
    <div className={`min-h-screen bg-[#010102] text-[#f7f8f8] antialiased ${inter.className}`}>
      <TopNav />
      <main>
        <HeroSection />
        <SocialProofMarquee />
        <StatementSection />
        <DeepDiveSection
          bg="canvas"
          eyebrow="AI PIPELINE"
          headline="From prompt to diagram in one step"
          body="Describe your system and ArchDraw's multi-stage AI pipeline handles the rest — parsing intent, generating Mermaid, validating structure, and rendering with automatic layout."
        />
        <DeepDiveSection
          bg="surface"
          eyebrow="MERMAID EDITOR"
          headline="Write Mermaid. See it rendered live."
          body="A built-in Mermaid editor with real-time preview. Edit the code and watch the diagram update instantly — no copy-pasting, no external tools."
          reverse
        />
        <DeepDiveSection
          bg="canvas"
          eyebrow="EXPORT & SHARE"
          headline="Export diagrams your team will actually use."
          body="Export to PNG, SVG, or share a live link. ArchDraw diagrams are presentation-ready out of the box — dark theme, clean layout, professional typography."
        />
        <FeatureCardGrid />
        <CTABanner />
      </main>
      <FooterSection />
    </div>
  );
}
