import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { diagramStore } from '../load/route';

const ExportSchema = z.object({
  sessionId: z.string().uuid(),
  format: z.enum(['json', 'png', 'svg']),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = ExportSchema.parse(body);

    const diagram = diagramStore.get(validated.sessionId);
    if (!diagram) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const { format } = validated;

    if (format === 'json') {
      return NextResponse.json({
        nodes: diagram.nodes,
        edges: diagram.edges,
        label: diagram.label,
      });
    }

    if (format === 'png' || format === 'svg') {
      return NextResponse.json({
        nodes: diagram.nodes,
        edges: diagram.edges,
        format,
        message: `For ${format.toUpperCase()} export, open the editor URL and use the export button.`,
        editorUrl: `/editor?session=${validated.sessionId}`,
      });
    }

    return NextResponse.json(
      { error: 'Unsupported format' },
      { status: 400 }
    );
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