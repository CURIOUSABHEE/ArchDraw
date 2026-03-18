'use client';

import { useState } from 'react';

const faqs = [
  {
    q: 'Is ArchFlow really free?',
    a: 'Yes. ArchFlow is completely free during beta. You can create unlimited diagrams, use all templates, and export without any limits.',
  },
  {
    q: 'Do I need an account to use it?',
    a: 'No. You can start designing immediately without signing up. Create an account only when you want to save, share, or download your diagrams.',
  },
  {
    q: 'How is this different from Lucidchart or draw.io?',
    a: 'ArchFlow is purpose-built for software architecture — not general diagrams. Every component, template, and feature is designed for engineers thinking about systems.',
  },
  {
    q: 'Can I share my diagrams with teammates?',
    a: 'Yes. Click Share to generate a public link. Anyone with the link can view and interact with your diagram without needing an account.',
  },
  {
    q: 'What export formats are supported?',
    a: 'Currently PNG at 3x resolution (print-ready quality). PDF and SVG exports are on the roadmap.',
  },
  {
    q: 'Is my data secure?',
    a: 'Your diagrams are stored securely in Supabase (PostgreSQL). Guest diagrams are stored locally in your browser. We never sell your data.',
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50" id="faq">
      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 tracking-tight">Frequently asked questions</h2>
        </header>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-6 py-4 text-left"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-medium text-slate-900">{faq.q}</span>
                <svg
                  className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {open === i && (
                <div className="px-6 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
