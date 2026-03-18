export function SocialProof() {
  const techs = ['Next.js', 'Supabase', 'AWS', 'Vercel', 'Docker', 'Kubernetes', 'Redis', 'PostgreSQL', 'React', 'TypeScript', 'Tailwind', 'Dagre'];

  return (
    <section className="py-16 bg-white overflow-hidden" id="social-proof">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Built for engineers who think in systems
          </p>
        </div>

        <div
          className="relative"
          style={{
            maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
          }}
        >
          <div className="flex items-center gap-4 py-2" style={{ animation: 'marquee 30s linear infinite', width: 'max-content' }}>
            {[...techs, ...techs].map((tech, i) => (
              <span
                key={i}
                className="px-4 py-2 rounded-full border border-slate-200 bg-slate-100 text-slate-600 text-sm whitespace-nowrap font-mono"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}
