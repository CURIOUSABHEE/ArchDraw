import Link from 'next/link';

export default function BlogPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#080c14' }}>
      <div className="text-center max-w-md mx-auto px-6">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6" style={{ backgroundColor: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <svg className="w-8 h-8" style={{ color: '#6366f1' }} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-6.75 0v2.625m7.5 0v7.5m-7.5-6h7.5m-6.75 0a3.375 3.375 0 01-6.75 0V3.375m0 0a3.375 3.375 0 016.75 0v10.5m-7.5 0h7.5m-7.5 0H3.375m0 0a3.375 3.375 0 016.75 0v2.25m0 0v7.5m-7.5-7.5v7.5m-7.5-7.5H12m0 0v7.5m7.5-7.5v7.5" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-4" style={{ color: '#f1f5f9' }}>
            Coming Soon
          </h1>
          <p className="text-lg mb-8" style={{ color: 'rgba(148,163,184,0.7)', lineHeight: 1.6 }}>
            We&apos;re working on something exciting. Stay tuned for insightful articles about architecture diagrams, system design, and engineering best practices.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
          style={{ backgroundColor: '#6366f1', boxShadow: '0 4px 20px rgba(99,102,241,0.3)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to home
        </Link>
      </div>
    </div>
  );
}
