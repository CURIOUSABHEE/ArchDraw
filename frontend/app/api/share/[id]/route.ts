import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import logger from '@/lib/logger';

interface ShareUser {
  email: string;
  name: string;
  role: 'owner' | 'editor' | 'viewer';
  addedAt: number;
}

interface DiagramData {
  nodes: unknown[];
  edges: unknown[];
  label?: string;
  createdAt: number;
  source?: 'mcp' | 'manual';
  accessType?: 'restricted' | 'anyone';
  linkPermission?: 'viewer' | 'editor';
  users: ShareUser[];
}

const STORAGE_FILE = path.join(process.cwd(), '.diagram-sessions.json');

function loadStore(): Map<string, DiagramData> {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf-8'));
      return new Map(Object.entries(data));
    }
  } catch (e) {
    logger.error('Failed to load diagram store:', e);
  }
  return new Map();
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const store = loadStore();
  const sessionData = store.get(id);

  if (sessionData) {
    return NextResponse.json({
      success: true,
      diagram: {
        nodes: sessionData.nodes,
        edges: sessionData.edges,
        label: sessionData.label,
        createdAt: sessionData.createdAt,
        users: sessionData.users,
        accessType: sessionData.accessType,
        linkPermission: sessionData.linkPermission,
      }
    });
  }

  return NextResponse.json(
    { error: 'Diagram not found' },
    { status: 404 }
  );
}
