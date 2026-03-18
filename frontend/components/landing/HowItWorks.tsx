export function HowItWorks() {
  return (
    <section className="py-24 px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden" id="how-it-works">
      <header className="text-center mb-24">
        <h2 className="text-4xl font-bold text-slate-900 tracking-tight">
          From blank canvas to production diagram in minutes
        </h2>
      </header>

      <div className="space-y-32">
        {/* Step 1 */}
        <div className="relative flex flex-col md:flex-row items-center gap-12 lg:gap-24">
          <span className="absolute -top-12 -left-4 text-indigo-50 font-extrabold select-none pointer-events-none" style={{ fontSize: '10rem', lineHeight: 1 }}>01</span>
          <div className="flex-1 relative z-10">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">Pick your components</h3>
            <p className="text-lg text-slate-600 leading-relaxed">Browse 150+ pre-built architecture components organized by category. Search or drag to add.</p>
          </div>
          <div className="flex-1 relative z-10 w-full">
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 shadow-lg min-h-[280px] flex gap-4">
              <div className="w-1/3 bg-white rounded-lg p-3 border border-slate-200 shadow-sm space-y-3">
                <div className="h-2 w-full bg-slate-100 rounded" />
                <div className="space-y-2">
                  {[['bg-indigo-500', 'bg-indigo-200'], ['bg-slate-300', 'bg-slate-200'], ['bg-slate-300', 'bg-slate-200']].map(([dot, bar], i) => (
                    <div key={i} className="h-6 w-full bg-slate-50 border border-slate-100 rounded flex items-center px-2">
                      <div className={`w-2 h-2 ${dot} rounded-full mr-2`} />
                      <div className={`h-2 w-12 ${bar} rounded`} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-1 bg-white rounded-lg border border-slate-200 border-dashed flex items-center justify-center">
                <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-200">
                  <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="relative flex flex-col md:flex-row-reverse items-center gap-12 lg:gap-24">
          <span className="absolute -top-12 -right-4 text-indigo-50 font-extrabold select-none pointer-events-none" style={{ fontSize: '10rem', lineHeight: 1 }}>02</span>
          <div className="flex-1 relative z-10">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">Connect and organize</h3>
            <p className="text-lg text-slate-600 leading-relaxed">Draw connections between components. Auto-layout arranges everything cleanly.</p>
          </div>
          <div className="flex-1 relative z-10 w-full">
            <div className="bg-slate-50 rounded-xl p-8 border border-slate-100 shadow-lg min-h-[280px] relative overflow-hidden">
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#6366f1 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }} />
              <div className="absolute top-12 left-12 w-32 h-20 bg-white rounded-lg border border-indigo-200 shadow-sm flex flex-col p-3 z-10">
                <div className="w-6 h-6 bg-indigo-500 rounded mb-2" />
                <div className="h-2 w-16 bg-slate-200 rounded" />
              </div>
              <div className="absolute bottom-12 right-12 w-32 h-20 bg-white rounded-lg border border-indigo-200 shadow-sm flex flex-col p-3 z-10">
                <div className="w-6 h-6 bg-emerald-500 rounded mb-2" />
                <div className="h-2 w-16 bg-slate-200 rounded" />
              </div>
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 300">
                <path d="M170 80 C 250 80, 250 220, 270 220" fill="none" stroke="#6366f1" strokeDasharray="4" strokeWidth="2" />
                <circle cx="270" cy="220" fill="#6366f1" r="3" />
              </svg>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="relative flex flex-col md:flex-row items-center gap-12 lg:gap-24">
          <span className="absolute -top-12 -left-4 text-indigo-50 font-extrabold select-none pointer-events-none" style={{ fontSize: '10rem', lineHeight: 1 }}>03</span>
          <div className="flex-1 relative z-10">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">Share or export</h3>
            <p className="text-lg text-slate-600 leading-relaxed">Generate a shareable link or export as high-resolution PNG for your docs.</p>
          </div>
          <div className="flex-1 relative z-10 w-full">
            <div className="bg-slate-50 rounded-xl p-12 border border-slate-100 shadow-lg min-h-[280px] flex items-center justify-center">
              <div className="bg-white rounded-xl shadow-xl border border-slate-100 p-6 w-full max-w-sm">
                <div className="flex justify-between items-center mb-6">
                  <span className="font-bold text-slate-900">Share Diagram</span>
                  <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
                  </svg>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-xs text-slate-400 truncate">archflow.app/share/7x9-v2k...</span>
                    <button className="ml-auto bg-indigo-600 text-white text-xs font-semibold px-3 py-1.5 rounded hover:bg-indigo-700 transition-colors">Copy link</button>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 border border-slate-200 text-slate-600 text-xs font-semibold py-2 rounded hover:bg-slate-50 transition-colors">Export PNG</button>
                    <button className="flex-1 border border-slate-200 text-slate-600 text-xs font-semibold py-2 rounded hover:bg-slate-50 transition-colors">Export PDF</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
