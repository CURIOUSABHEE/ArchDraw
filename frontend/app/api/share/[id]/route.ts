import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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
  createdAt: string;
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
      return new Map(Object.entries(data));
    }
  } catch (e) {
    console.error('Failed to load diagram store:', e);
  }
  return new Map();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userEmail = request.headers.get('x-user-email') || '';
  
  const sessionStore = loadStore();
  const sessionData = sessionStore.get(id);
  
  if (sessionData) {
    const { accessType, linkPermission, users } = sessionData;
    
    // Check access - if restricted, user must be in the list
    if (accessType === 'restricted') {
      const hasAccess = users.some(u => u.email === userEmail);
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Access denied. You need to be invited to view this diagram.' },
          { status: 403 }
        );
      }
    }
    
    // Determine user's role
    const user = users.find(u => u.email === userEmail);
    const role = user?.role || (accessType === 'anyone' ? linkPermission : 'viewer');
    const canEdit = role === 'owner' || role === 'editor';
    
    return NextResponse.json({
      canvas: {
        id,
        canvas_name: sessionData.label || 'Shared Diagram',
        nodes: sessionData.nodes,
        edges: sessionData.edges,
      },
      access: {
        role,
        canEdit,
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