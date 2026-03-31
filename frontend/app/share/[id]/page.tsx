import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { SharedCanvasViewer } from '@/components/SharedCanvasViewer';
import { redis, redisKeys } from '@/lib/redis';

interface SharedCanvas {
  id: string;
  canvas_name: string;
  nodes: unknown[];
  edges: unknown[];
}

export default async function SharedCanvasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // ── 1. Redis cache ──────────────────────────────────────────────────────────
  let data: SharedCanvas | null = null;
  try {
    data = await redis.get<SharedCanvas>(redisKeys.sharedCanvas(id));
    if (data) console.log(`[Share] REDIS-HIT canvas:shared:${id}`);
  } catch (err) {
    console.warn('[Share] Redis lookup failed, falling through:', err);
  }

  // ── 2. Supabase fallback ────────────────────────────────────────────────────
  if (!data) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: row, error } = await supabase
      .from('shared_canvases')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !row) {
      return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mx-auto">
              <span className="text-2xl">🔍</span>
            </div>
            <div>
              <p className="text-white font-semibold text-lg">Diagram not found</p>
              <p className="text-white/50 text-sm mt-1">This link may have expired or doesn&apos;t exist.</p>
            </div>
            <Link
              href="/"
              className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              Create your own diagram →
            </Link>
          </div>
        </div>
      );
    }

    data = row as SharedCanvas;
    // Write to Redis with 24-hour TTL (fire-and-forget)
    redis.set(redisKeys.sharedCanvas(id), row, { ex: 86400 }).catch(err =>
      console.warn('[Share] Redis write failed:', err)
    );
  }

  return <SharedCanvasViewer canvas={data} />;
}
