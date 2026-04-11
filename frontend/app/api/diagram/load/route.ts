import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

export interface DiagramData {
  nodes: unknown[];
  edges: unknown[];
  label?: string;
  createdAt: Date;
  source?: 'mcp' | 'manual';
}

const STORAGE_FILE = path.join(process.cwd(), '.diagram-sessions.json');

function loadStore(): Map<string, DiagramData> {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf-8')) as Record<string, DiagramData>;
      const map = new Map<string, DiagramData>();
      for (const [key, value] of Object.entries(data)) {
        map.set(key, {
          ...value,
          createdAt: new Date(value.createdAt),
        });
      }
      return map;
    }
  } catch (e) {
    console.error('Failed to load diagram store:', e);
  }
  return new Map();
}

function saveStore(store: Map<string, DiagramData>) {
  try {
    const data = Object.fromEntries(store);
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Failed to save diagram store:', e);
  }
}

const diagramStore = loadStore();

const LoadDiagramSchema = z.object({
  sessionId: z.string().uuid().optional(),
  nodes: z.array(z.object({}).passthrough()),
  edges: z.array(z.object({}).passthrough()),
  label: z.string().optional(),
  source: z.enum(['mcp', 'manual']).optional().default('manual'),
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
      source: validated.source,
    });
    saveStore(diagramStore);

    return NextResponse.json({
      sessionId,
      url: `/editor?session=${sessionId}`,
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