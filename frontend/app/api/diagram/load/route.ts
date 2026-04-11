import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

export interface ShareUser {
  email: string;
  name: string;
  role: 'owner' | 'editor' | 'viewer';
  addedAt: number;
}

export interface DiagramData {
  nodes: unknown[];
  edges: unknown[];
  label?: string;
  createdAt: Date;
  source?: 'mcp' | 'manual';
  accessType: 'restricted' | 'anyone';
  linkPermission: 'viewer' | 'editor';
  users: ShareUser[];
  ownerEmail?: string;
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
          accessType: value.accessType || 'anyone',
          linkPermission: value.linkPermission || 'viewer',
          users: value.users || [],
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
  accessType: z.enum(['restricted', 'anyone']).optional().default('anyone'),
  linkPermission: z.enum(['viewer', 'editor']).optional().default('viewer'),
  users: z.array(z.object({
    email: z.string(),
    name: z.string(),
    role: z.enum(['owner', 'editor', 'viewer']),
    addedAt: z.number(),
  })).optional().default([]),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = LoadDiagramSchema.parse(body);

    const sessionId = validated.sessionId || crypto.randomUUID();
    const label = validated.label || 'Untitled Diagram';

    // Check if updating existing or creating new
    const existing = diagramStore.get(sessionId);
    
    diagramStore.set(sessionId, {
      nodes: validated.nodes,
      edges: validated.edges,
      label,
      createdAt: new Date(),
      source: validated.source,
      accessType: validated.accessType,
      linkPermission: validated.linkPermission,
      users: validated.users,
      ownerEmail: existing?.ownerEmail,
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

const ShareAccessSchema = z.object({
  accessType: z.enum(['restricted', 'anyone']),
  linkPermission: z.enum(['viewer', 'editor']),
});

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, ...accessData } = body;
    const validated = ShareAccessSchema.parse(accessData);

    const diagram = diagramStore.get(sessionId);
    if (!diagram) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    diagramStore.set(sessionId, {
      ...diagram,
      accessType: validated.accessType,
      linkPermission: validated.linkPermission,
    });
    saveStore(diagramStore);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const AddUserSchema = z.object({
  sessionId: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['editor', 'viewer']),
});

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = AddUserSchema.parse(body);

    const diagram = diagramStore.get(validated.sessionId);
    if (!diagram) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const existingUser = diagram.users.find(u => u.email === validated.email);
    const newUser: ShareUser = {
      email: validated.email,
      name: validated.name,
      role: validated.role,
      addedAt: Date.now(),
    };

    const users = existingUser
      ? diagram.users.map(u => u.email === validated.email ? newUser : u)
      : [...diagram.users, newUser];

    diagramStore.set(validated.sessionId, { ...diagram, users });
    saveStore(diagramStore);

    return NextResponse.json({ success: true, users });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const RemoveUserSchema = z.object({
  sessionId: z.string().uuid(),
  email: z.string().email(),
});

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = RemoveUserSchema.parse(body);

    const diagram = diagramStore.get(validated.sessionId);
    if (!diagram) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Can't remove owner
    const user = diagram.users.find(u => u.email === validated.email);
    if (user?.role === 'owner') {
      return NextResponse.json({ error: 'Cannot remove owner' }, { status: 400 });
    }

    const users = diagram.users.filter(u => u.email !== validated.email);
    diagramStore.set(validated.sessionId, { ...diagram, users });
    saveStore(diagramStore);

    return NextResponse.json({ success: true, users });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}