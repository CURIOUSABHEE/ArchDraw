import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export interface DiagramData {
  nodes: unknown[];
  edges: unknown[];
  label?: string;
  createdAt: Date;
}

export const diagramStore = new Map<string, DiagramData>();

const LoadDiagramSchema = z.object({
  sessionId: z.string().uuid().optional(),
  nodes: z.array(z.object({}).passthrough()),
  edges: z.array(z.object({}).passthrough()),
  label: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = LoadDiagramSchema.parse(body);

    const sessionId = validated.sessionId || crypto.randomUUID();
    const label = validated.label || 'Untitled Diagram';

    diagramStore.set(sessionId, {
      nodes: validated.nodes,
      edges: validated.edges,
      label,
      createdAt: new Date(),
    });

    return NextResponse.json({
      sessionId,
      url: `/flow?session=${sessionId}`,
      message: 'Diagram ready. Open this URL to view it.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
