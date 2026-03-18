'use client';

import { useRouter } from 'next/navigation';

const templates = [
  { emoji: '🤖', name: 'ChatGPT Architecture', desc: 'LLM RAG pipeline, vector DB, streaming', nodes: '14', tags: [['AI', 'bg-indigo-50 text-indigo-700'], ['LLM', 'bg-sky-50 text-sky-700'], ['RAG', 'bg-purple-50 text-purple-700']] },
  { emoji: '📸', name: 'Instagram', desc: 'Feed service, media pipeline, Kafka, CDN', nodes: '22', tags: [['Social Media', 'bg-pink-50 text-pink-700'], ['Kafka', 'bg-slate-50 text-slate-700']] },
  { emoji: '🎞️', name: 'Netflix', desc: 'Video transcoding, CDN, recommendation ML', nodes: '18', tags: [['Streaming', 'bg-red-50 text-red-700'], ['CDN', 'bg-blue-50 text-blue-700'], ['ML', 'bg-emerald-50 text-emerald-700']] },
  { emoji: '🚗', name: 'Uber', desc: 'Real-time matching, maps API, location tracking', nodes: '26', tags: [['Real-time', 'bg-orange-50 text-orange-700'], ['Maps', 'bg-green-50 text-green-700']] },
  { emoji: '🏗️', name: 'ArchFlow itself', desc: 'The architecture of this very tool', nodes: '23', tags: [['Next.js', 'bg-zinc-100 text-zinc-900'], ['Supabase', 'bg-emerald-50 text-emerald-700'], ['Vercel', 'bg-slate-100 text-slate-900']] },
  { emoji: '🧠', name: 'RAG Application', desc: 'Vector DB, embeddings, LLM, retrieval pipeline', nodes: '10', tags: [['AI', 'bg-indigo-50 text-indigo-700'], ['Vector', 'bg-cyan-50 text-cyan-700'], ['RAG', 'bg-purple-50 text-purple-700']] },
];

export function Templates() {
  const router = useRouter();

  return (
    <section className="py-20 px-6 sm:px-12 lg:px-24 max-w-7xl mx-auto" id="templates">
      <header className="text-center mb-16">
        <h2 className="text-[2.5rem] font-bold text-slate-900 leading-tight mb-4">
          Start from real-world architectures
        </h2>
        <p className="text-slate-600 text-lg max-w-[600px] mx-auto">
          Learn system design by exploring how the world&apos;s biggest products are built.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {templates.map((t) => (
          <article
            key={t.name}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between hover:border-indigo-500 hover:-translate-y-0.5 transition-all duration-200"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl" role="img">{t.emoji}</span>
                  <h3 className="font-bold text-slate-900">{t.name}</h3>
                </div>
                <span className="bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider">{t.nodes} Nodes</span>
              </div>
              <p className="text-slate-600 text-sm mb-4 leading-relaxed">{t.desc}</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {t.tags.map(([label, cls]) => (
                  <span key={label} className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${cls}`}>{label}</span>
                ))}
              </div>
            </div>
            <button
              onClick={() => router.push('/editor')}
              className="text-indigo-600 font-semibold text-sm flex items-center gap-1 group hover:underline"
            >
              Load template
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </button>
          </article>
        ))}
      </div>

      <div className="mt-16 text-center">
        <button
          onClick={() => router.push('/editor')}
          className="inline-flex items-center px-6 py-3 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-white hover:border-slate-400 transition-colors shadow-sm"
        >
          Browse all templates →
        </button>
      </div>
    </section>
  );
}
