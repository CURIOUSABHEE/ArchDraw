const cases = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
      </svg>
    ),
    iconBg: 'bg-indigo-100 text-indigo-600',
    title: 'System Design Interviews',
    desc: 'Practice drawing architectures for FAANG interviews. Use real templates as study guides.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    iconBg: 'bg-blue-100 text-blue-600',
    title: 'Engineering Documentation',
    desc: 'Replace Confluence diagrams with interactive, shareable architecture docs.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    ),
    iconBg: 'bg-purple-100 text-purple-600',
    title: 'Technical Presentations',
    desc: 'Export clean diagrams for pitch decks, RFCs, and engineering all-hands.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    iconBg: 'bg-green-100 text-green-600',
    title: 'Team Onboarding',
    desc: 'Help new engineers understand your system architecture from day one.',
  },
];

export function UseCases() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50" id="use-cases">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 tracking-tight">
            Built for every kind of systems thinker
          </h2>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cases.map((c) => (
            <article key={c.title} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col items-start gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${c.iconBg}`}>
                {c.icon}
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-lg text-slate-900">{c.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{c.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
