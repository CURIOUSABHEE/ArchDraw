import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  return new Response(JSON.stringify({
    status: 'coming_soon',
    message: 'AI diagram generation is temporarily unavailable. We are working on improvements.',
    estimatedReturn: 'Coming soon',
  }), {
    status: 503,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
  });
}
