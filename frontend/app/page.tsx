'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthModal } from '@/components/AuthModal';
import { 
  Sparkles, 
  Layout, 
  Users, 
  History, 
  Download, 
  GitBranch, 
  Check, 
  ArrowRight,
  Terminal,
  MousePointer2,
  Lock,
  Menu,
  X
} from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [isAnnual, setIsAnnual] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <div className="min-h-screen bg-[#0c0d0f] text-[#f0f2f7] antialiased selection:bg-[#6b74e8]/30 selection:text-[#f0f2f7]">
        
        {/* ── Top Nav ────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-50 w-full h-[60px] bg-[#0c0d0f]/80 backdrop-blur-md border-b border-[#2a2d38]">
          <div className="max-w-[1200px] h-full mx-auto px-4 flex items-center justify-between">
            {/* Left: Brand logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <svg className="w-5 h-5 text-[#6b74e8] transition-transform group-hover:scale-105" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="6" cy="6" r="3" />
                <circle cx="18" cy="6" r="3" />
                <circle cx="12" cy="18" r="3" />
                <line x1="9" y1="6" x2="15" y2="6" />
                <line x1="6" y1="9" x2="12" y2="15" />
                <line x1="18" y1="9" x2="12" y2="15" />
              </svg>
              <span className="text-xl font-bold tracking-tight text-[#6b74e8]">Archdraw</span>
            </Link>

            {/* Center: nav links */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-[#9099b0] hover:text-[#f0f2f7] transition-colors">Features</a>
              <a href="#pricing" className="text-sm font-medium text-[#9099b0] hover:text-[#f0f2f7] transition-colors">Pricing</a>
              <Link href="/docs" className="text-sm font-medium text-[#9099b0] hover:text-[#f0f2f7] transition-colors">Docs</Link>
              <a href="#changelog" className="text-sm font-medium text-[#9099b0] hover:text-[#f0f2f7] transition-colors">Changelog</a>
            </nav>

            {/* Right: CTAs */}
            <div className="hidden md:flex items-center gap-3">
              <button 
                onClick={() => setAuthModalOpen(true)}
                className="px-4 py-1.5 text-sm font-medium text-[#f0f2f7] bg-transparent border border-[#2a2d38] rounded-[8px] hover:bg-[#13151a] transition-all"
              >
                Sign in
              </button>
              <button 
                onClick={() => router.push('/editor')}
                className="px-4 py-1.5 text-sm font-medium text-white bg-[#6b74e8] rounded-[8px] hover:bg-[#8990ff] transition-all"
              >
                Try for free
              </button>
            </div>

            {/* Mobile menu toggle */}
            <button 
              className="md:hidden p-1 text-[#9099b0] hover:text-[#f0f2f7]"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Mobile menu dropdown */}
          {mobileMenuOpen && (
            <div className="absolute top-[60px] left-0 w-full bg-[#0c0d0f] border-b border-[#2a2d38] py-4 px-6 flex flex-col gap-4 md:hidden">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-[#9099b0] hover:text-[#f0f2f7]">Features</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-[#9099b0] hover:text-[#f0f2f7]">Pricing</a>
              <Link href="/docs" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-[#9099b0] hover:text-[#f0f2f7]">Docs</Link>
              <a href="#changelog" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-[#9099b0] hover:text-[#f0f2f7]">Changelog</a>
              <div className="w-full h-px bg-[#2a2d38] my-1" />
              <button 
                onClick={() => { setMobileMenuOpen(false); setAuthModalOpen(true); }}
                className="w-full py-2 text-center text-sm font-medium border border-[#2a2d38] rounded-[8px] hover:bg-[#13151a]"
              >
                Sign in
              </button>
              <button 
                onClick={() => { setMobileMenuOpen(false); router.push('/editor'); }}
                className="w-full py-2 text-center text-sm font-medium bg-[#6b74e8] text-white rounded-[8px] hover:bg-[#8990ff]"
              >
                Try for free
              </button>
            </div>
          )}
        </header>

        {/* ── Hero ───────────────────────────────────────────────────── */}
        <section className="pt-20 pb-24 px-4 max-w-[1200px] mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#6b74e8] text-xs font-semibold tracking-wide text-[#6b74e8] mb-8 bg-[#6b74e8]/5">
            ✦ AI-powered architecture diagrams
          </div>

          {/* Headline */}
          <h1 className="text-[44px] md:text-[72px] font-bold tracking-[-2.5px] leading-tight max-w-[900px] mx-auto mb-6 text-[#f0f2f7]">
            Describe your system. Get the diagram.
          </h1>

          {/* Subhead */}
          <p className="text-lg md:text-[18px] font-normal leading-[1.6] text-[#9099b0] max-w-[650px] mx-auto mb-10">
            Archdraw turns a plain-English description or GitHub repo into a clean, interactive architecture diagram — in seconds.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-20">
            <button 
              onClick={() => router.push('/editor')}
              className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-white bg-[#6b74e8] rounded-[8px] hover:bg-[#8990ff] transition-all"
            >
              Start building free
            </button>
            <a 
              href="#example"
              className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-[#6b74e8] border border-[#2a2d38] rounded-[8px] hover:bg-[#13151a] transition-all"
            >
              See an example →
            </a>
          </div>

          {/* Product Editor Mockup */}
          <div id="example" className="relative w-full aspect-[16/10] max-w-[950px] mx-auto rounded-xl border border-[#2a2d38] bg-[#13151a] overflow-hidden select-none">
            {/* Grid Canvas Background */}
            <div 
              className="absolute inset-0 z-0" 
              style={{
                backgroundImage: 'radial-gradient(#1e2130 1.5px, transparent 1.5px)',
                backgroundSize: '24px 24px'
              }}
            />

            {/* Left Toolbar */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-11 rounded-lg bg-[#1a1d24] border border-[#2a2d38] py-4 flex flex-col items-center gap-5 shadow-lg">
              <div className="p-1.5 rounded bg-[#6b74e8]/10 text-[#6b74e8]">
                <MousePointer2 size={16} />
              </div>
              <div className="p-1.5 rounded text-[#9099b0] hover:text-[#f0f2f7] hover:bg-[#21242d] cursor-pointer">
                <Layout size={16} />
              </div>
              <div className="p-1.5 rounded text-[#9099b0] hover:text-[#f0f2f7] hover:bg-[#21242d] cursor-pointer">
                <Users size={16} />
              </div>
              <div className="p-1.5 rounded text-[#9099b0] hover:text-[#f0f2f7] hover:bg-[#21242d] cursor-pointer">
                <Terminal size={16} />
              </div>
              <div className="w-6 h-px bg-[#2a2d38]" />
              <div className="p-1.5 rounded text-[#9099b0] hover:text-[#f0f2f7] hover:bg-[#21242d] cursor-pointer">
                <History size={16} />
              </div>
            </div>

            {/* Editor Canvas Nodes */}
            <div className="absolute inset-0 z-10 p-8 flex items-center justify-center">
              
              {/* SVG Edges connecting nodes */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 2 L 10 5 L 0 8 z" fill="#3a3d50" />
                  </marker>
                </defs>
                {/* Web App -> API Gateway */}
                <path d="M 210 240 Q 280 240 310 240" stroke="#3a3d50" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
                {/* API Gateway -> Auth Service */}
                <path d="M 470 220 Q 520 180 570 140" stroke="#3a3d50" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
                {/* API Gateway -> Order Service */}
                <path d="M 470 260 Q 520 300 570 340" stroke="#3a3d50" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
                {/* Auth Service -> Database */}
                <path d="M 730 140 Q 770 180 810 220" stroke="#3a3d50" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
                {/* Order Service -> Database */}
                <path d="M 730 340 Q 770 300 810 260" stroke="#3a3d50" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
              </svg>

              {/* Node 1: Web App */}
              <div className="absolute left-[8%] top-[38%] w-40 rounded-lg bg-[#1a1d24] border border-[#2a2d38] border-l-[4px] border-l-[#6b74e8] p-3 text-left shadow-lg">
                <span className="text-[10px] font-bold tracking-wider text-[#6b74e8] block mb-1">COMPUTE</span>
                <span className="text-[13px] font-bold text-[#f0f2f7] block leading-tight">Web App</span>
                <span className="text-[11px] font-medium text-[#9099b0]">React, Next.js</span>
              </div>

              {/* Node 2: API Gateway */}
              <div className="absolute left-[34%] top-[38%] w-40 rounded-lg bg-[#1a1d24] border border-[#2a2d38] border-l-[4px] border-l-[#6b74e8] p-3 text-left shadow-lg">
                <span className="text-[10px] font-bold tracking-wider text-[#6b74e8] block mb-1">GATEWAY</span>
                <span className="text-[13px] font-bold text-[#f0f2f7] block leading-tight">API Gateway</span>
                <span className="text-[11px] font-medium text-[#9099b0]">AWS API Gateway</span>
              </div>

              {/* Node 3: Auth Service */}
              <div className="absolute left-[60%] top-[18%] w-40 rounded-lg bg-[#1a1d24] border border-[#2a2d38] border-l-[4px] border-l-[#6b74e8] p-3 text-left shadow-lg">
                <span className="text-[10px] font-bold tracking-wider text-[#6b74e8] block mb-1">SECURITY</span>
                <span className="text-[13px] font-bold text-[#f0f2f7] block leading-tight">Auth Service</span>
                <span className="text-[11px] font-medium text-[#9099b0]">JWT / OAuth2</span>
              </div>

              {/* Node 4: Order Service */}
              <div className="absolute left-[60%] top-[58%] w-40 rounded-lg bg-[#1a1d24] border border-[#2a2d38] border-l-[4px] border-l-[#6b74e8] p-3 text-left shadow-lg">
                <span className="text-[10px] font-bold tracking-wider text-[#6b74e8] block mb-1">SERVICE</span>
                <span className="text-[13px] font-bold text-[#f0f2f7] block leading-tight">Order Service</span>
                <span className="text-[11px] font-medium text-[#9099b0]">Go, gRPC</span>
              </div>

              {/* Node 5: Database */}
              <div className="absolute left-[83%] top-[38%] w-36 rounded-lg bg-[#1a1d24] border border-[#2a2d38] border-l-[4px] border-l-[#1a9e75] p-3 text-left shadow-lg">
                <span className="text-[10px] font-bold tracking-wider text-[#1a9e75] block mb-1">DATABASE</span>
                <span className="text-[13px] font-bold text-[#f0f2f7] block leading-tight">PostgreSQL</span>
                <span className="text-[11px] font-medium text-[#9099b0]">Primary DB</span>
              </div>

            </div>

            {/* Bottom: AI Prompt Bar */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-xl rounded-lg bg-[#21242d] border border-[#2a2d38] px-4 py-2.5 flex items-center justify-between shadow-2xl z-20">
              <div className="flex items-center gap-2 text-left min-w-0">
                <span className="text-[#6b74e8] shrink-0 font-bold">✦</span>
                <span className="text-xs text-[#9099b0] truncate">Describe your architecture, or paste a GitHub repo link...</span>
              </div>
              <button className="bg-[#6b74e8] hover:bg-[#8990ff] text-white p-1 rounded transition-colors shrink-0">
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </section>

        {/* ── Social Proof Strip ─────────────────────────────────────── */}
        <section className="py-12 border-t border-b border-[#2a2d38] px-4 bg-[#13151a]/30">
          <div className="max-w-[1200px] mx-auto text-center">
            <span className="text-xs font-semibold tracking-wider text-[#5a6278] uppercase block mb-6">
              Used by engineers at
            </span>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-6 items-center justify-center">
              {['Vercel', 'Stripe', 'Supabase', 'Neon', 'Railway', 'Linear'].map((company, i) => (
                <span key={i} className="text-[15px] font-bold text-[#9099b0] tracking-wide select-none">
                  {company}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── How It Works ───────────────────────────────────────────── */}
        <section className="py-24 px-4 max-w-[1200px] mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold tracking-wider text-[#6b74e8] uppercase block mb-3">HOW IT WORKS</span>
            <h2 className="text-[32px] md:text-[42px] font-bold tracking-[-1.2px] text-[#f0f2f7] mb-4">
              From idea to diagram in three steps.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                num: '01',
                title: 'Describe your architecture',
                body: 'Type a plain-text prompt explaining your system flow, or simply paste a public GitHub repository URL.'
              },
              {
                num: '02',
                title: 'AI generates the diagram',
                body: 'Our pipeline structures components into logical architectural tiers (Client, Compute, Databases) with valid orthogonal edges.'
              },
              {
                num: '03',
                title: 'Edit and export',
                body: 'Refine node positions, customize names/labels, add text notes, and export high-resolution PNG or vector SVG files.'
              }
            ].map((step, i) => (
              <div key={i} className="bg-[#13151a] border border-[#2a2d38] rounded-xl p-7 flex flex-col justify-between">
                <div>
                  <span className="text-[48px] font-bold text-[#6b74e8] leading-none block mb-6 select-none">{step.num}</span>
                  <h3 className="text-[20px] font-semibold text-[#f0f2f7] mb-3 leading-tight">{step.title}</h3>
                </div>
                <p className="text-[14px] text-[#9099b0] leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features Grid ──────────────────────────────────────────── */}
        <section id="features" className="py-24 px-4 max-w-[1200px] mx-auto border-t border-[#2a2d38]">
          <div className="text-center mb-16">
            <h2 className="text-[32px] md:text-[42px] font-bold tracking-[-1.2px] text-[#f0f2f7] mb-4">
              Everything you need to document your system.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Sparkles className="text-[#6b74e8]" size={24} />,
                title: 'AI Generation',
                body: 'Describe systems in conversational English or let our analyzer extract structure directly from GitHub codebase repositories.'
              },
              {
                icon: <Layout className="text-[#6b74e8]" size={24} />,
                title: 'Smart Layouts',
                body: 'Our automatic layout runner arranges service blocks cleanly without node overlapping or crossed edge connector intersections.'
              },
              {
                icon: <Users className="text-[#6b74e8]" size={24} />,
                title: 'Real-time Collaboration',
                body: 'Collaborate with your product engineering team simultaneously via multi-cursor workspace sessions and comments.'
              },
              {
                icon: <History className="text-[#6b74e8]" size={24} />,
                title: 'Version History',
                body: 'Keep track of all modification steps. Revert formatting tweaks, design changes, and connection resets with one-click restore.'
              },
              {
                icon: <Download className="text-[#6b74e8]" size={24} />,
                title: 'Export Anywhere',
                body: 'Save your diagram state as pure pixel-perfect SVGs, raster PNGs, Markdown formatting strings, or raw script structures.'
              },
              {
                icon: <GitBranch className="text-[#6b74e8]" size={24} />,
                title: 'GitHub Sync',
                body: 'Direct synchronization updates diagrams automatically when structural code changes are pushed to your remote repository.'
              }
            ].map((feature, i) => (
              <div key={i} className="bg-[#13151a] border border-[#2a2d38] rounded-xl p-6 flex flex-col gap-4">
                <div className="p-2 w-10 h-10 rounded bg-[#6b74e8]/10 flex items-center justify-center">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-[20px] font-semibold text-[#f0f2f7] mb-2 leading-tight">{feature.title}</h3>
                  <p className="text-[14px] text-[#9099b0] leading-relaxed">{feature.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Product Deep-dive ──────────────────────────────────────── */}
        <section className="py-24 px-4 max-w-[1200px] mx-auto border-t border-[#2a2d38] flex flex-col gap-24">
          
          {/* Row 1: Image Left / Text Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Image side */}
            <div className="lg:col-span-7 bg-[#13151a] border border-[#2a2d38] rounded-xl p-8 aspect-[16/10] flex items-center justify-center relative">
              <div className="w-full max-w-md rounded-lg bg-[#21242d] border border-[#2a2d38] p-5 shadow-2xl">
                <div className="flex items-center justify-between mb-4 border-b border-[#2a2d38] pb-3">
                  <span className="text-xs font-bold text-[#6b74e8]">✦ ARCHDRAW PROMPT BUILDER</span>
                  <span className="text-[10px] bg-[#6b74e8]/10 text-[#6b74e8] px-2 py-0.5 rounded font-mono">READY</span>
                </div>
                <p className="text-[13px] text-[#f0f2f7] leading-relaxed mb-4 bg-[#13151a] p-3 rounded border border-[#2a2d38] font-mono">
                  "Create a real-time chat application with WebSockets, a Redis cache layer for active session management, and a PostgreSQL database for message history. Route all traffic through an API Gateway."
                </p>
                <div className="flex justify-end gap-2">
                  <span className="text-xs text-[#9099b0] self-center">AI understands your routing details</span>
                  <button className="bg-[#6b74e8] text-white px-3 py-1 text-xs font-semibold rounded hover:bg-[#8990ff]">
                    Generate
                  </button>
                </div>
              </div>
            </div>
            
            {/* Text side */}
            <div className="lg:col-span-5 flex flex-col justify-center">
              <span className="text-xs font-bold tracking-wider text-[#6b74e8] uppercase block mb-3">INPUT AGNOSTIC</span>
              <h3 className="text-[32px] font-bold text-[#f0f2f7] tracking-tight mb-4 leading-tight">
                Generate from any input.
              </h3>
              <p className="text-base text-[#9099b0] leading-[1.6] mb-6">
                Whether you prefer typing simple plain-English architecture outlines or linking directly to a complex software development repository on GitHub, our engine processes the connections correctly.
              </p>
              <ul className="flex flex-col gap-3">
                {[
                  'Automatic extraction of service structures and frameworks',
                  'Support for standard plain text prompts or repo URLs',
                  'Instant tier allocations based on component roles'
                ].map((bullet, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-[#f0f2f7]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#6b74e8] shrink-0" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Row 2: Text Left / Image Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Text side (order-last or first depending on screen) */}
            <div className="lg:col-span-5 order-2 lg:order-1 flex flex-col justify-center">
              <span className="text-xs font-bold tracking-wider text-[#6b74e8] uppercase block mb-3">SYNCHRONIZED CANVAS</span>
              <h3 className="text-[32px] font-bold text-[#f0f2f7] tracking-tight mb-4 leading-tight">
                Collaborate like a team.
              </h3>
              <p className="text-base text-[#9099b0] leading-[1.6] mb-6">
                Design diagrams as a unit. Our synchronized canvas supports live multi-cursor coordination and inline comments so you can draft scalable systems during team meetings.
              </p>
              <ul className="flex flex-col gap-3">
                {[
                  'Real-time position editing and handle alignment sync',
                  'Inline comments directly anchored to service nodes',
                  'Multi-cursor presence with custom color labels'
                ].map((bullet, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-[#f0f2f7]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#6b74e8] shrink-0" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Image side */}
            <div className="lg:col-span-7 order-1 lg:order-2 bg-[#13151a] border border-[#2a2d38] rounded-xl p-8 aspect-[16/10] flex items-center justify-center relative overflow-hidden">
              <div 
                className="absolute inset-0 z-0" 
                style={{
                  backgroundImage: 'radial-gradient(#1e2130 1px, transparent 1px)',
                  backgroundSize: '16px 16px',
                  opacity: 0.5
                }}
              />
              <div className="relative z-10 w-full max-w-sm rounded-lg bg-[#1a1d24] border border-[#2a2d38] p-5 shadow-2xl text-left">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-2 h-2 rounded-full bg-[#2db563]" />
                  <span className="text-xs font-bold text-[#f0f2f7]">Auth Service (edited)</span>
                </div>
                <div className="h-2 w-full bg-[#2a2d38] rounded-full mb-3 overflow-hidden">
                  <div className="w-2/3 h-full bg-[#6b74e8]" />
                </div>
                <p className="text-[11px] text-[#9099b0] leading-normal mb-2 bg-[#13151a] p-2.5 rounded border border-[#2a2d38]">
                  "Should we add a replica or cache layer in front of this database?"
                  <span className="block mt-1 font-bold text-[#6b74e8]">— Alex (DevOps)</span>
                </p>

                {/* Simulated Cursors */}
                <div className="absolute right-12 top-4 flex items-center gap-1.5 z-20 pointer-events-none">
                  <MousePointer2 size={12} className="text-[#6b74e8] fill-[#6b74e8]" />
                  <span className="text-[9px] bg-[#6b74e8] text-white px-1.5 py-0.5 rounded font-semibold shadow-md">Abhishek</span>
                </div>
                <div className="absolute left-1/3 bottom-2 flex items-center gap-1.5 z-20 pointer-events-none">
                  <MousePointer2 size={12} className="text-[#1a9e75] fill-[#1a9e75]" />
                  <span className="text-[9px] bg-[#1a9e75] text-white px-1.5 py-0.5 rounded font-semibold shadow-md">Sarah</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Pricing ────────────────────────────────────────────────── */}
        <section id="pricing" className="py-24 px-4 max-w-[1200px] mx-auto border-t border-[#2a2d38]">
          <div className="text-center mb-16">
            <h2 className="text-[32px] md:text-[42px] font-bold tracking-[-1.2px] text-[#f0f2f7] mb-4">
              Start free. Scale as you grow.
            </h2>
            
            {/* Toggle */}
            <div className="inline-flex items-center gap-3 bg-[#13151a] border border-[#2a2d38] p-1.5 rounded-lg select-none">
              <button 
                onClick={() => setIsAnnual(false)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-[8px] transition-all ${!isAnnual ? 'bg-[#6b74e8] text-white' : 'text-[#9099b0] hover:text-[#f0f2f7]'}`}
              >
                Monthly
              </button>
              <button 
                onClick={() => setIsAnnual(true)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-[8px] transition-all ${isAnnual ? 'bg-[#6b74e8] text-white' : 'text-[#9099b0] hover:text-[#f0f2f7]'}`}
              >
                Annual (-20%)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1000px] mx-auto">
            {/* Free */}
            <div className="bg-[#13151a] border border-[#2a2d38] rounded-xl p-8 flex flex-col justify-between">
              <div>
                <span className="text-sm font-bold text-[#9099b0] uppercase block mb-2">Free</span>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-[36px] font-bold text-[#f0f2f7]">$0</span>
                  <span className="text-sm text-[#9099b0]">/forever</span>
                </div>
                <div className="w-full h-px bg-[#2a2d38] mb-6" />
                <ul className="flex flex-col gap-4">
                  <li className="flex items-center gap-2.5 text-sm text-[#f0f2f7]">
                    <Check size={16} className="text-[#2db563] shrink-0" />
                    <span>5 active diagrams</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-sm text-[#f0f2f7]">
                    <Check size={16} className="text-[#2db563] shrink-0" />
                    <span>Basic AI generation</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-sm text-[#f0f2f7]">
                    <Check size={16} className="text-[#2db563] shrink-0" />
                    <span>PNG export</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-sm text-[#5a6278]">
                    <span className="text-xs shrink-0">—</span>
                    <span className="line-through">GitHub auto-sync</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-sm text-[#5a6278]">
                    <span className="text-xs shrink-0">—</span>
                    <span className="line-through">All vector export formats</span>
                  </li>
                </ul>
              </div>
              <button 
                onClick={() => router.push('/editor')}
                className="w-full py-2.5 mt-8 text-sm font-semibold border border-[#2a2d38] rounded-[8px] hover:bg-[#21242d] transition-all"
              >
                Start free
              </button>
            </div>

            {/* Pro (Featured) */}
            <div className="bg-[#1a1d24] border-[2px] border-[#6b74e8] rounded-xl p-8 flex flex-col justify-between relative">
              <span className="absolute -top-3 right-6 bg-[#6b74e8] text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full select-none">
                Most popular
              </span>
              <div>
                <span className="text-sm font-bold text-[#6b74e8] uppercase block mb-2">Pro</span>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-[36px] font-bold text-[#f0f2f7]">${isAnnual ? '15' : '19'}</span>
                  <span className="text-sm text-[#9099b0]">/month</span>
                </div>
                <div className="w-full h-px bg-[#2a2d38] mb-6" />
                <ul className="flex flex-col gap-4">
                  <li className="flex items-center gap-2.5 text-sm text-[#f0f2f7]">
                    <Check size={16} className="text-[#2db563] shrink-0" />
                    <span>Unlimited active diagrams</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-sm text-[#f0f2f7]">
                    <Check size={16} className="text-[#2db563] shrink-0" />
                    <span>Advanced AI generation</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-sm text-[#f0f2f7]">
                    <Check size={16} className="text-[#2db563] shrink-0" />
                    <span>All exports (PNG, SVG, Mermaid)</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-sm text-[#f0f2f7]">
                    <Check size={16} className="text-[#2db563] shrink-0" />
                    <span>GitHub Auto-sync</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-sm text-[#f0f2f7]">
                    <Check size={16} className="text-[#2db563] shrink-0" />
                    <span>30-day version history history</span>
                  </li>
                </ul>
              </div>
              <button 
                onClick={() => setAuthModalOpen(true)}
                className="w-full py-2.5 mt-8 text-sm font-semibold bg-[#6b74e8] text-white rounded-[8px] hover:bg-[#8990ff] transition-all"
              >
                Go Pro
              </button>
            </div>

            {/* Team */}
            <div className="bg-[#13151a] border border-[#2a2d38] rounded-xl p-8 flex flex-col justify-between">
              <div>
                <span className="text-sm font-bold text-[#9099b0] uppercase block mb-2">Team</span>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-[36px] font-bold text-[#f0f2f7]">${isAnnual ? '39' : '49'}</span>
                  <span className="text-sm text-[#9099b0]">/user /mo</span>
                </div>
                <div className="w-full h-px bg-[#2a2d38] mb-6" />
                <ul className="flex flex-col gap-4">
                  <li className="flex items-center gap-2.5 text-sm text-[#f0f2f7]">
                    <Check size={16} className="text-[#2db563] shrink-0" />
                    <span>SSO / SAML authentication</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-sm text-[#f0f2f7]">
                    <Check size={16} className="text-[#2db563] shrink-0" />
                    <span>Admin control panels</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-sm text-[#f0f2f7]">
                    <Check size={16} className="text-[#2db563] shrink-0" />
                    <span>Team collaborative workspaces</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-sm text-[#f0f2f7]">
                    <Check size={16} className="text-[#2db563] shrink-0" />
                    <span>Priority technical support</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-sm text-[#f0f2f7]">
                    <Check size={16} className="text-[#2db563] shrink-0" />
                    <span>Unlimited version history</span>
                  </li>
                </ul>
              </div>
              <button 
                onClick={() => setAuthModalOpen(true)}
                className="w-full py-2.5 mt-8 text-sm font-semibold border border-[#2a2d38] rounded-[8px] hover:bg-[#21242d] transition-all"
              >
                Contact Sales
              </button>
            </div>
          </div>
        </section>

        {/* ── Testimonials ───────────────────────────────────────────── */}
        <section className="py-24 px-4 max-w-[1200px] mx-auto border-t border-[#2a2d38]">
          <div className="text-center mb-16">
            <span className="text-xs font-bold tracking-wider text-[#6b74e8] uppercase block mb-3">TESTIMONIALS</span>
            <h2 className="text-[32px] md:text-[42px] font-bold tracking-[-1.2px] text-[#f0f2f7] mb-4">
              Loved by software engineers.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: "We went from blank whiteboards to complete diagrams in minutes. Archdraw has completely automated our system architecture documentation.",
                initials: "AB",
                name: "Alex Brooks",
                role: "Senior Backend Engineer at Vercel"
              },
              {
                quote: "The GitHub integration is magic. Having our diagrams auto-update on every main branch push saves us hours of manual updates.",
                initials: "ML",
                name: "Marcus Lin",
                role: "Principal Architect at Stripe"
              },
              {
                quote: "Real-time sync and easy export. It's the first diagramming tool that actually keeps pace with our deployment velocity.",
                initials: "TK",
                name: "Tanya Kovak",
                role: "DevOps Lead at Linear"
              }
            ].map((t, i) => (
              <div key={i} className="bg-[#13151a] border border-[#2a2d38] rounded-xl p-7 flex flex-col justify-between gap-6">
                <p className="text-[16px] font-normal leading-[1.6] text-[#f0f2f7] italic">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#6b74e8] text-[#f0f2f7] flex items-center justify-center text-sm font-bold">
                    {t.initials}
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-[#f0f2f7]">{t.name}</span>
                    <span className="block text-xs text-[#9099b0]">{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA Banner ─────────────────────────────────────────────── */}
        <section className="pb-24 px-4 max-w-[1000px] mx-auto">
          <div className="bg-[#13151a] border border-[#2a2d38] rounded-2xl p-14 text-center">
            <h2 className="text-[32px] md:text-[40px] font-bold tracking-tight text-[#f0f2f7] mb-4">
              Your architecture, visualised.
            </h2>
            <p className="text-base text-[#9099b0] max-w-[500px] mx-auto mb-8">
              Start building interactive design diagrams in seconds. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <button 
                onClick={() => router.push('/editor')}
                className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-white bg-[#6b74e8] rounded-[8px] hover:bg-[#8990ff] transition-all"
              >
                Get started free
              </button>
              <button 
                onClick={() => setAuthModalOpen(true)}
                className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-[#6b74e8] border border-[#2a2d38] rounded-[8px] hover:bg-[#1a1d24] transition-all"
              >
                Book a demo
              </button>
            </div>
          </div>
        </section>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <footer className="bg-[#0c0d0f] border-t border-[#2a2d38] py-16 px-6">
          <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-6 gap-10">
            {/* Logo/Tagline column */}
            <div className="md:col-span-2 flex flex-col gap-4">
              <Link href="/" className="flex items-center gap-2 group">
                <svg className="w-5 h-5 text-[#6b74e8] transition-transform group-hover:scale-105" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="6" cy="6" r="3" />
                  <circle cx="18" cy="6" r="3" />
                  <circle cx="12" cy="18" r="3" />
                  <line x1="9" y1="6" x2="15" y2="6" />
                  <line x1="6" y1="9" x2="12" y2="15" />
                  <line x1="18" y1="9" x2="12" y2="15" />
                </svg>
                <span className="text-xl font-bold tracking-tight text-[#6b74e8]">Archdraw</span>
              </Link>
              <p className="text-sm text-[#9099b0] leading-relaxed max-w-[240px]">
                Generate design diagrams instantly from natural language prompts or code repositories.
              </p>
            </div>

            {/* Link columns */}
            {[
              {
                title: 'Product',
                links: ['Features', 'Templates', 'Integration', 'Changelog']
              },
              {
                title: 'Developers',
                links: ['Documentation', 'API Access', 'CLI Tool', 'System Status']
              },
              {
                title: 'Company',
                links: ['About Us', 'Careers', 'Blog', 'Contact']
              },
              {
                title: 'Legal',
                links: ['Privacy Policy', 'Terms of Service', 'Security Policy', 'GDPR']
              }
            ].map((col, i) => (
              <div key={i} className="flex flex-col gap-4">
                <span className="text-xs font-bold text-[#f0f2f7] uppercase tracking-wider">{col.title}</span>
                <ul className="flex flex-col gap-2.5">
                  {col.links.map((link, j) => (
                    <li key={j}>
                      <a href="#" className="text-sm text-[#9099b0] hover:text-[#f0f2f7] transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="max-w-[1200px] mx-auto border-t border-[#2a2d38] mt-16 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="text-xs text-[#5a6278]">
              &copy; {new Date().getFullYear()} Archdraw, Inc. All rights reserved.
            </span>
            <div className="flex gap-6">
              <a href="#" className="text-xs text-[#5a6278] hover:text-[#9099b0]">Security</a>
              <a href="#" className="text-xs text-[#5a6278] hover:text-[#9099b0]">Privacy</a>
              <a href="#" className="text-xs text-[#5a6278] hover:text-[#9099b0]">Status</a>
            </div>
          </div>
        </footer>

      </div>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </>
  );
}
