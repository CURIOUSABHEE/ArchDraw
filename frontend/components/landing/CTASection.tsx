'use client';

import { useRouter } from 'next/navigation';

export function CTASection() {
  const router = useRouter();

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-600 to-indigo-700">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
          Start building your architecture today
        </h2>
        <p className="text-indigo-200 text-xl mb-10">
          No account needed. No credit card. Just your ideas.
        </p>
        <button
          onClick={() => router.push('/editor')}
          className="inline-flex items-center px-10 py-4 bg-white text-indigo-600 font-bold text-lg rounded-xl hover:bg-indigo-50 transition-colors shadow-xl"
        >
          Open the canvas →
        </button>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {['Next.js', 'Supabase', 'Vercel', 'React'].map((t) => (
            <span key={t} className="px-3 py-1.5 bg-white/10 text-white/80 text-xs font-medium rounded-full border border-white/20">
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
