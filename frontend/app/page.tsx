'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
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
  X,
  Laptop,
  Network,
  Database
} from 'lucide-react';

interface MockupNodeProps {
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
  title: string;
  subtitle: string;
  accentColor: string;
  hasLeftHandle?: boolean;
  hasRightHandle?: boolean;
  icon: React.ReactNode;
  isDragging?: boolean;
  onDragStart?: (id: string, clientX: number, clientY: number, e: React.MouseEvent | React.TouchEvent) => void;
}

function MockupNode({ 
  id,
  left, 
  top, 
  width, 
  height, 
  title, 
  subtitle, 
  accentColor, 
  hasLeftHandle = true, 
  hasRightHandle = true, 
  icon,
  isDragging = false,
  onDragStart
}: MockupNodeProps) {
  const handleMouseDown = (e: React.MouseEvent) => {
    if (onDragStart) {
      onDragStart(id, e.clientX, e.clientY, e);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches && e.touches[0] && onDragStart) {
      onDragStart(id, e.touches[0].clientX, e.touches[0].clientY, e);
    }
  };

  return (
    <div 
      className="absolute z-10 select-none"
      style={{ 
        left: `${left}px`, 
        top: `${top}px`, 
        width: `${width}px`, 
        height: `${height}px`,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
    >
      {/* Stacked Backplates (plate design) */}
      <div 
        className="absolute inset-0 rounded-[16px] bg-[#0d0f1b] translate-x-[10px] translate-y-[10px] z-0 border border-[#2a2d38]/20 transition-all duration-75"
        style={{
          transform: isDragging ? 'translate(6px, 6px)' : 'translate(10px, 10px)'
        }}
      />
      <div 
        className="absolute inset-0 rounded-[16px] bg-[#151828] translate-x-[5px] translate-y-[5px] z-10 border border-[#2a2d38]/40 transition-all duration-75"
        style={{
          transform: isDragging ? 'translate(3px, 3px)' : 'translate(5px, 5px)'
        }}
      />
      
      {/* Main Node Card */}
      <div 
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className={`absolute inset-0 rounded-[16px] bg-[#1e2235] border p-3.5 flex items-center gap-3 z-20 shadow-lg select-none transition-all duration-75 ${
          isDragging 
            ? 'border-[#6b74e8] shadow-[0_0_15px_rgba(107,116,232,0.3)] scale-[1.02]' 
            : 'border-[#2a2d38] hover:border-[#6b74e8]/50'
        }`}
      >
        {/* Left handle */}
        {hasLeftHandle && (
          <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 border-[#6b74e8] z-30" />
        )}
        
        {/* Icon Box */}
        <div 
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${accentColor}12`, color: accentColor }}
        >
          {icon}
        </div>
        
        {/* Text Details */}
        <div className="flex flex-col min-w-0 flex-grow text-left pointer-events-none">
          <span className="text-[12px] font-bold text-[#f0f2f7] truncate leading-tight">{title}</span>
          <span className="text-[10px] text-[#9099b0] truncate mt-0.5">{subtitle}</span>
        </div>
        
        {/* Status Dot */}
        <div className="w-1.5 h-1.5 rounded-full bg-[#2db563] shrink-0 self-end mb-0.5" />
        
        {/* Right handle */}
        {hasRightHandle && (
          <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 border-[#6b74e8] z-30" />
        )}
      </div>
    </div>
  );
}

const getIcon = (type: string) => {
  switch (type) {
    case 'laptop': return <Laptop size={14} />;
    case 'network': return <Network size={14} />;
    case 'lock': return <Lock size={14} />;
    case 'terminal': return <Terminal size={14} />;
    case 'database': return <Database size={14} />;
    default: return null;
  }
};

function getRoundedStepPath(x1: number, y1: number, x2: number, y2: number, r = 8) {
  if (Math.abs(y1 - y2) < 4) {
    return `M ${x1} ${y1} L ${x2} ${y2}`;
  }
  const mx = (x1 + x2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  
  const signX = Math.sign(dx) || 1;
  const signY = Math.sign(dy) || 1;
  
  const radius = Math.min(r, Math.abs(mx - x1), Math.abs(dy) / 2);
  
  if (radius < 2) {
    return `M ${x1} ${y1} L ${mx} ${y1} L ${mx} ${y2} L ${x2} ${y2}`;
  }
  
  const turn1Start = mx - signX * radius;
  const turn1End = y1 + signY * radius;
  const turn2Start = y2 - signY * radius;
  const turn2End = mx + signX * radius;
  
  return `M ${x1} ${y1} ` +
         `L ${turn1Start} ${y1} ` +
         `Q ${mx} ${y1} ${mx} ${turn1End} ` +
         `L ${mx} ${turn2Start} ` +
         `Q ${mx} ${y2} ${turn2End} ${y2} ` +
         `L ${x2} ${y2}`;
}

export default function Home() {
  const router = useRouter();
  const [isAnnual, setIsAnnual] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Responsive scaling for mockup canvas
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        if (width < 1200) {
          setScale(width / 1200);
        } else {
          setScale(1);
        }
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mockup Node coordinates and attributes state
  const [mockupNodes, setMockupNodes] = useState([
    { id: 'web-app', title: 'Web App', subtitle: 'React, Next.js', x: 80, y: 265, width: 160, height: 70, accentColor: '#6b74e8', iconType: 'laptop', hasLeftHandle: false, hasRightHandle: true },
    { id: 'api-gateway', title: 'API Gateway', subtitle: 'AWS API Gateway', x: 440, y: 265, width: 160, height: 70, accentColor: '#6b74e8', iconType: 'network', hasLeftHandle: true, hasRightHandle: true },
    { id: 'auth-service', title: 'Auth Service', subtitle: 'JWT / OAuth2', x: 760, y: 155, width: 160, height: 70, accentColor: '#6b74e8', iconType: 'lock', hasLeftHandle: true, hasRightHandle: true },
    { id: 'order-service', title: 'Order Service', subtitle: 'Go, gRPC', x: 760, y: 375, width: 160, height: 70, accentColor: '#6b74e8', iconType: 'terminal', hasLeftHandle: true, hasRightHandle: true },
    { id: 'postgresql', title: 'PostgreSQL', subtitle: 'Primary DB', x: 1000, y: 265, width: 160, height: 70, accentColor: '#1a9e75', iconType: 'database', hasLeftHandle: true, hasRightHandle: false },
  ]);

  // Drag tracking refs
  const dragInfoRef = useRef<{
    nodeId: string;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  } | null>(null);

  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);

  const handleDragStart = useCallback((id: string, clientX: number, clientY: number, e: React.MouseEvent | React.TouchEvent) => {
    // Prevent default behaviour for synthetic mouse/touch events to stop selections
    if (e.cancelable) {
      e.preventDefault();
    }
    const node = mockupNodes.find((n) => n.id === id);
    if (!node) return;

    dragInfoRef.current = {
      nodeId: id,
      startX: clientX,
      startY: clientY,
      initialX: node.x,
      initialY: node.y,
    };
    setDraggingNodeId(id);
  }, [mockupNodes]);

  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      if (!dragInfoRef.current) return;
      const { nodeId, startX, startY, initialX, initialY } = dragInfoRef.current;
      
      const dx = (clientX - startX) / (scale || 1);
      const dy = (clientY - startY) / (scale || 1);

      setMockupNodes((prevNodes) =>
        prevNodes.map((n) => {
          if (n.id !== nodeId) return n;

          // Clamp node coordinates to keep them inside the bounds of the mockup canvas [1200, 600]
          const newX = Math.max(10, Math.min(1200 - n.width - 25, initialX + dx));
          const newY = Math.max(10, Math.min(600 - n.height - 25, initialY + dy));

          return { ...n, x: newX, y: newY };
        })
      );
    };

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches[0]) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleEnd = () => {
      if (dragInfoRef.current) {
        dragInfoRef.current = null;
        setDraggingNodeId(null);
      }
    };

    if (draggingNodeId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [draggingNodeId]);

  const getNodeCenterOrHandle = (id: string, handleSide: 'left' | 'right') => {
    const node = mockupNodes.find((n) => n.id === id);
    if (!node) return { x: 0, y: 0 };
    const x = handleSide === 'left' ? node.x : node.x + node.width;
    const y = node.y + node.height / 2;
    return { x, y };
  };

  const edgesData = [
    { source: 'web-app', target: 'api-gateway', label: 'HTTPS' },
    { source: 'api-gateway', target: 'auth-service', label: 'REST' },
    { source: 'api-gateway', target: 'order-service', label: 'gRPC' },
    { source: 'auth-service', target: 'postgresql', label: '' },
    { source: 'order-service', target: 'postgresql', label: 'SQL' },
  ];

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
          <div ref={containerRef} className="w-full flex justify-center py-4 overflow-hidden">
            <div 
              style={{ 
                width: `${1200 * scale}px`, 
                height: `${600 * scale}px`,
                position: 'relative'
              }}
              className="shrink-0 transition-all duration-150"
            >
              <div 
                style={{ 
                  transform: `scale(${scale})`, 
                  transformOrigin: 'top left',
                  width: '1200px',
                  height: '600px',
                  position: 'absolute',
                  top: 0,
                  left: 0
                }}
                className="shrink-0"
              >
                <div id="example" className="relative w-[1200px] h-[600px] mx-auto rounded-xl border border-[#2a2d38] bg-[#0c0d0f] overflow-hidden select-none shrink-0 shadow-2xl">
              {/* Grid Canvas Background */}
              <div 
                className="absolute inset-0 z-0" 
                style={{
                  backgroundImage: 'radial-gradient(#1e2130 1.5px, transparent 1.5px)',
                  backgroundSize: '24px 24px'
                }}
              />

              {/* Top Editor Header Panel */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 bg-[#1a1d24] border border-[#2a2d38] rounded-full px-5 py-2.5 text-xs text-[#9099b0] shadow-lg select-none">
                <div className="flex items-center gap-2 border-r border-[#2a2d38] pr-4">
                  <span className="font-bold text-[#f0f2f7]">Dashboard</span>
                  <span className="text-[#5a6278]">/</span>
                  <span className="text-[#f0f2f7]">Real-time chat application</span>
                </div>
                <div className="flex items-center gap-4">
                  <span>6 nodes</span>
                  <span>8 edges</span>
                </div>
              </div>

              {/* Left Toolbar */}
              <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 rounded-lg bg-[#1a1d24] border border-[#2a2d38] py-4 flex flex-col items-center gap-5 shadow-lg">
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

              {/* SVG Edges connecting nodes */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 2 L 10 5 L 0 8 z" fill="#3a3d50" />
                  </marker>
                </defs>
                
                {edgesData.map((edge, index) => {
                  const p1 = getNodeCenterOrHandle(edge.source, 'right');
                  const p2 = getNodeCenterOrHandle(edge.target, 'left');
                  const path = getRoundedStepPath(p1.x, p1.y, p2.x, p2.y);
                  return (
                    <path 
                      key={index}
                      d={path} 
                      stroke="#3a3d50" 
                      strokeWidth="2" 
                      fill="none" 
                      strokeLinejoin="round" 
                      markerEnd="url(#arrow)" 
                    />
                  );
                })}
              </svg>

              {/* Edge labels overlay */}
              <div className="absolute inset-0 pointer-events-none z-30">
                {edgesData.map((edge, index) => {
                  if (!edge.label) return null;
                  const p1 = getNodeCenterOrHandle(edge.source, 'right');
                  const p2 = getNodeCenterOrHandle(edge.target, 'left');
                  
                  const labelX = (p1.x + p2.x) / 2;
                  const labelY = Math.abs(p1.y - p2.y) < 5 ? p1.y : (p1.y + p2.y) / 2;
                  
                  return (
                    <div 
                      key={index}
                      className="absolute bg-[#1a1d24] border border-[#2a2d38]/80 rounded px-1.5 py-0.5 text-[9px] font-bold text-[#9099b0] -translate-x-1/2 -translate-y-1/2 select-none shadow-md"
                      style={{ left: `${labelX}px`, top: `${labelY}px` }}
                    >
                      {edge.label}
                    </div>
                  );
                })}
              </div>

              {/* Editor Canvas Nodes with Stacked Plates & Handles */}
              {mockupNodes.map((node) => (
                <MockupNode
                  key={node.id}
                  id={node.id}
                  left={node.x}
                  top={node.y}
                  width={node.width}
                  height={node.height}
                  title={node.title}
                  subtitle={node.subtitle}
                  accentColor={node.accentColor}
                  hasLeftHandle={node.hasLeftHandle}
                  hasRightHandle={node.hasRightHandle}
                  icon={getIcon(node.iconType)}
                  isDragging={draggingNodeId === node.id}
                  onDragStart={handleDragStart}
                />
              ))}

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
              </div>
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
