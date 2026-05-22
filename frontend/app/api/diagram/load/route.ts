import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import logger from '@/lib/logger';

export interface ShareUser {
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

function saveStore(store: Map<string, DiagramData>) {
  try {
    const data = Object.fromEntries(store.entries());
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    logger.error('Failed to save diagram store:', e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sessionId = crypto.randomUUID();
    
    const diagramData: DiagramData = {
      nodes: body.nodes,
      edges: body.edges,
      label: body.label,
      createdAt: Date.now(),
      source: body.source || 'manual',
      accessType: body.accessType || 'anyone',
      linkPermission: body.linkPermission || 'viewer',
      users: body.users || [],
    };

    const store = loadStore();
    store.set(sessionId, diagramData);
    saveStore(store);

    return NextResponse.json({ sessionId });
  } catch (error) {
    logger.error('POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, accessType, linkPermission } = body;
    
    const store = loadStore();
    const data = store.get(sessionId);
    
    if (!data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    store.set(sessionId, {
      ...data,
      accessType,
      linkPermission,
    });
    saveStore(store);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, email, name, role } = body;
    
    const store = loadStore();
    const data = store.get(sessionId);
    
    if (!data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const users = data.users.filter(u => u.email !== email);
    users.push({
      email,
      name,
      role: role === 'editor' ? 'editor' : 'viewer',
      addedAt: Date.now(),
    });

    store.set(sessionId, { ...data, users });
    saveStore(store);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, email } = body;
    
    const store = loadStore();
    const data = store.get(sessionId);
    
    if (!data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const users = data.users.filter(u => u.email !== email);

    store.set(sessionId, { ...data, users });
    saveStore(store);

    return NextResponse.json({ success: true, users });
  } catch (error) {
    logger.error('DELETE error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
