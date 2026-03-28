'use client';

import { useRouter } from 'next/navigation';

const freeFeatures = [
  'Unlimited canvases',
  '150+ components',
  'All templates',
  'Export as PNG',
  'Share with link',
  'No account needed to start',
];

const proFeatures = [
  'Everything in Free',
  'Team collaboration (real-time)',
  'Custom component library',
  'Password-protected shares',
  'Version history',
  'Priority support',
];

function Check() {
  return (
    <svg className="w-4 h-4 text-indigo-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.1" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function Pricing() {
  const router = useRouter();

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white" id="pricing">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 tracking-tight">
            Free while in beta. Forever generous after.
          </h2>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Free */}
          <div className="relative rounded-2xl border border-indigo-500/30 bg-indigo-50/30 p-8 flex flex-col">
            <span className="absolute top-4 right-4 bg-indigo-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">Current plan</span>
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-slate-900 mb-1">Free</h3>
              <p className="text-4xl font-extrabold text-slate-900">$0<span className="text-base font-normal text-slate-500">/month</span></p>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {freeFeatures.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-slate-700">
                  <Check />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => router.push('/editor')}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
            >
              Start for free →
            </button>
          </div>

          {/* Pro */}
          <div className="relative rounded-2xl border border-border/20 bg-white p-8 flex flex-col">
            <span className="absolute top-4 right-4 bg-slate-100 text-slate-600 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">Coming soon</span>
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-slate-900 mb-1">Pro</h3>
              <p className="text-4xl font-extrabold text-slate-400">TBD</p>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {proFeatures.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-slate-500">
                  <svg className="w-4 h-4 text-slate-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <button               className="w-full py-3 border border-border/20 text-slate-600 font-semibold rounded-lg hover:bg-slate-50 transition-colors">
              Join waitlist
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-slate-400 mt-8">No credit card ever required for free plan</p>
      </div>
    </section>
  );
}
