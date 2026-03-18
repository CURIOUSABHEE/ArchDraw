const categories = [
  { label: 'Client & Entry', chips: ['Client', 'DNS', 'CDN', 'API Gateway', 'Load Balancer', 'Reverse Proxy'], bg: 'bg-indigo-100 text-indigo-700' },
  { label: 'Compute', chips: ['Server', 'Microservice', 'Serverless', 'Worker', 'Container', 'VM'], bg: 'bg-blue-100 text-blue-700' },
  { label: 'Data Storage', chips: ['SQL Database', 'NoSQL', 'Redis Cache', 'Object Storage', 'Data Warehouse', 'Time Series DB'], bg: 'bg-slate-100 text-slate-700' },
  { label: 'Messaging', chips: ['Kafka', 'Message Queue', 'Event Bus', 'Pub/Sub', 'Webhook', 'Stream'], bg: 'bg-amber-100 text-amber-700' },
  { label: 'AI / ML', chips: ['LLM API', 'Vector Database', 'RAG Pipeline', 'ML Model', 'Embeddings', 'Fine-tuning'], bg: 'bg-pink-100 text-pink-700' },
  { label: 'External Services', chips: ['Stripe', 'Resend', 'Twilio', 'OpenAI', 'GitHub', 'Slack'], bg: 'bg-green-100 text-green-700' },
];

export function ComponentsShowcase() {
  return (
    <section className="py-24 px-6 lg:px-8 bg-white" id="components">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 tracking-tight">
            150+ components. Every layer covered.
          </h2>
        </header>

        <div className="space-y-6">
          {categories.map((cat) => (
            <div key={cat.label} className="flex items-start gap-4">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider w-28 shrink-0 pt-2">{cat.label}</span>
              <div className="flex flex-wrap gap-2">
                {cat.chips.map((chip) => (
                  <span key={chip} className={`px-3 py-1.5 rounded-full text-xs font-medium ${cat.bg}`}>
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a href="/editor" className="text-indigo-600 font-semibold text-sm hover:underline">
            View all components →
          </a>
        </div>
      </div>
    </section>
  );
}
