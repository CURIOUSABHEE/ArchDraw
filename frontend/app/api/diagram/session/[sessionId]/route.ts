import { NextRequest, NextResponse } from 'next/server';
import { diagramStore } from '../../load/route';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  const diagram = diagramStore.get(sessionId);

  if (!diagram) {
    return NextResponse.json(
      { error: 'Session not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(diagram);
}
