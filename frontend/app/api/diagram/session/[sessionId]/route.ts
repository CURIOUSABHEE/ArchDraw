import { NextRequest, NextResponse } from 'next/server';
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

const diagramStore = loadStore();

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