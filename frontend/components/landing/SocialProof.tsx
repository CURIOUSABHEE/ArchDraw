'use client';

import { Badge } from '@/components/ui/badge';

const techs = ['Next.js', 'Supabase', 'AWS', 'Vercel', 'Docker', 'Kubernetes', 'Redis', 'PostgreSQL', 'React', 'TypeScript', 'Tailwind', 'Dagre', 'OpenAI', 'Kafka', 'GraphQL'];

export function SocialProof() {
  return (
    <section className="bg-secondary/30 border-t border-border/30 pt-2 pb-12 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <p className="mb-6 text-center text-xs font-medium text-muted-foreground tracking-wide">
          Built for engineers who think in systems
        </p>

        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-secondary/30 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-secondary/30 to-transparent z-10 pointer-events-none" />
          <div className="flex items-center gap-3 py-2" style={{ animation: 'marquee 30s linear infinite', width: 'max-content' }}>
            {[...techs, ...techs].map((tech, i) => (
              <Badge key={i} variant="secondary" className="text-sm whitespace-nowrap font-mono px-4 py-2">
                {tech}
              </Badge>
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
