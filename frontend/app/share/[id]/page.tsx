import { createClient } from '@supabase/supabase-js';
import { SharedCanvasViewer } from '@/components/SharedCanvasViewer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function SharedCanvasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await supabase
    .from('shared_canvases')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mx-auto">
            <span className="text-2xl">🔍</span>
          </div>
          <div>
            <p className="text-white font-semibold text-lg">Diagram not found</p>
            <p className="text-white/50 text-sm mt-1">This link may have expired or doesn't exist.</p>
          </div>
          <a
            href="/"
            className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            Create your own diagram →
          </a>
        </div>
      </div>
    );
  }

  return <SharedCanvasViewer canvas={data} />;
}
