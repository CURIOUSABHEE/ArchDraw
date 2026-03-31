import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { redis, redisKeys } from '@/lib/redis';

interface SharedCanvas {
  id: string;
  canvas_name: string;
  nodes: unknown[];
  edges: unknown[];
}

interface DiagramResponse {
  id: string;
  canvas_name: string;
  nodes: unknown[];
  edges: unknown[];
}

const ALLOWED_ORIGINS = [
  'https://archdraw.abhishekjamdade.xyz',
  'http://localhost:3000',
  'http://localhost:3001',
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const origin = request.headers.get('origin') || '';
  
  // Validate origin
  const corsOrigin = ALLOWED_ORIGINS.includes(origin) 
    ? origin 
    : ALLOWED_ORIGINS[0];

  // Check if ID is valid UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return NextResponse.json(
      { error: 'Invalid ID format' }, 
      { status: 400, headers: { 'Access-Control-Allow-Origin': corsOrigin } }
    );
  }

  // Try Redis cache first
  let data: SharedCanvas | null = null;
  try {
    data = await redis.get<SharedCanvas>(redisKeys.sharedCanvas(id));
  } catch {
    // Redis failed, continue to Supabase
  }

  // Supabase fallback
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
      return NextResponse.json(
        { error: 'Diagram not found' }, 
        { status: 404, headers: { 'Access-Control-Allow-Origin': corsOrigin } }
      );
    }

    data = row as SharedCanvas;

    // Cache to Redis with 24-hour TTL
    try {
      await redis.set(redisKeys.sharedCanvas(id), data, { ex: 86400 });
    } catch {
      // Redis write failed, continue
    }
  }

  const response: DiagramResponse = {
    id: data.id,
    canvas_name: data.canvas_name,
    nodes: data.nodes,
    edges: data.edges,
  };

  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'X-Frame-Options': 'ALLOWALL',
    },
  });
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '';
  const corsOrigin = ALLOWED_ORIGINS.includes(origin) 
    ? origin 
    : ALLOWED_ORIGINS[0];
    
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
