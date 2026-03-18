'use client';

import { useRouter } from 'next/navigation';

export function Hero() {
  const router = useRouter();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden py-20 lg:py-0 bg-white">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left: copy */}
          <div className="space-y-8">
            {/* Beta badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs font-bold text-indigo-600 tracking-wide uppercase">Now in Beta · Free to use</span>
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-[3.5rem] leading-[1.1] font-extrabold text-slate-900 tracking-tight">
                Design Systems,{' '}
                <br />
                <span className="text-indigo-600">Not Documents</span>
              </h1>
              <p className="text-lg lg:text-xl text-slate-600 max-w-xl leading-relaxed">
                ArchFlow is a visual canvas for building production-ready system architecture diagrams. Drag, connect, and think in systems.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 items-center">
              <button
                onClick={() => router.push('/editor')}
                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-lg shadow-indigo-200 transition-all duration-200 hover:-translate-y-0.5"
              >
                Start designing free →
              </button>
              <button
                onClick={() => document.getElementById('templates')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 bg-transparent hover:bg-slate-100 text-slate-700 font-semibold rounded-lg transition-colors duration-200"
              >
                View templates
              </button>
            </div>

            <p className="text-sm text-slate-400 font-medium">No account needed · 150+ components · Free forever</p>

            {/* Stats */}
            <div className="pt-8 border-t border-slate-200">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {[['150+', 'Components'], ['10+', 'Templates'], ['∞', 'Canvas Size'], ['Ready', 'Export']].map(([val, label]) => (
                  <div key={label} className="flex flex-col">
                    <span className="text-2xl font-bold text-slate-900">{val}</span>
                    <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: canvas mockup */}
          <div className="relative lg:h-[600px] flex items-center justify-center">
            <div className="absolute -z-10 w-2/3 h-2/3 bg-indigo-500/10 blur-[120px] rounded-full" />
            <div
              className="w-full max-w-[640px] aspect-[4/3] bg-slate-900 rounded-xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col"
              style={{ animation: 'float 6s ease-in-out infinite' }}
            >
              {/* macOS title bar */}
              <div className="h-10 bg-slate-800 flex items-center px-4 gap-2 border-b border-slate-700">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                </div>
                <div className="mx-auto text-[10px] text-slate-400 font-medium tracking-wide">Archflow — system-design.af</div>
              </div>

              {/* Canvas area */}
              <div
                className="flex-1 relative bg-[#0f172a] overflow-hidden"
                style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '20px 20px' }}
              >
                {/* SVG edges */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M 120 120 C 180 120, 180 180, 240 180" fill="none" stroke="#6366f1" strokeWidth="2" opacity="0.8" />
                  <path d="M 360 180 C 400 180, 420 120, 480 120" fill="none" stroke="#0ea5e9" strokeWidth="2" opacity="0.6" />
                  <path d="M 360 180 C 400 180, 420 240, 480 240" fill="none" stroke="#10b981" strokeWidth="2" opacity="0.6" />
                  <path d="M 520 260 C 520 280, 400 320, 360 320" fill="none" stroke="#f59e0b" strokeWidth="2" opacity="0.4" />
                </svg>

                {/* Node cards */}
                {[
                  { top: 80, left: 40, color: '#6366f1', label: 'Web App', sub: 'Client Side', icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z' },
                  { top: 144, left: 192, color: '#3b82f6', label: 'Kong Gateway', sub: 'API Layer', icon: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
                  { top: 80, left: 320, color: '#06b6d4', label: 'Nginx LB', sub: 'Networking', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
                  { top: 208, left: 320, color: '#10b981', label: 'PostgreSQL', sub: 'Primary DB', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4' },
                  { top: 288, left: 192, color: '#f59e0b', label: 'Redis', sub: 'Caching', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
                ].map((node) => (
                  <div
                    key={node.label}
                    className="absolute w-32 bg-slate-800 border border-white/10 rounded-xl p-3 shadow-xl"
                    style={{ top: node.top, left: node.left }}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center mb-2" style={{ backgroundColor: node.color + '33' }}>
                      <svg className="w-4 h-4" fill="none" stroke={node.color} viewBox="0 0 24 24">
                        <path d={node.icon} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                    </div>
                    <div className="text-[11px] font-bold text-white">{node.label}</div>
                    <div className="text-[9px] text-slate-400">{node.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
    </section>
  );
}
