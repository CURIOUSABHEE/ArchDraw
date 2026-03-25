'use client';

const techs = ['Next.js', 'Supabase', 'AWS', 'Vercel', 'Docker', 'Kubernetes', 'Redis', 'PostgreSQL', 'React', 'TypeScript', 'Tailwind', 'Dagre', 'OpenAI', 'Kafka', 'GraphQL'];

export function SocialProof() {
  return (
    <section style={{ backgroundColor: '#0d1117', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 8, paddingBottom: 48 }}>
      <div className="max-w-7xl mx-auto px-4">
        <p className="mb-6 text-center text-xs font-medium" style={{ color: '#475569', letterSpacing: '0.02em' }}>
          Built for engineers who think in systems
        </p>

        <div
          className="relative"
          style={{
            maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
          }}
        >
          <div className="flex items-center gap-3 py-2" style={{ animation: 'marquee 30s linear infinite', width: 'max-content' }}>
            {[...techs, ...techs].map((tech, i) => (
              <span
                key={i}
                className="px-4 py-2 rounded-full text-sm whitespace-nowrap font-mono"
                style={{ color: '#475569', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
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
