export interface MCPResponse {
  success: boolean;
  nodes?: unknown[];
  edges?: unknown[];
  message?: string;
  diagramUrl?: string;
}

export interface MCPToolResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}

export async function generateDiagram(input: {
  nodes?: Array<{
    id?: string;
    label: string;
    tier?: string;
    layer?: string;
    subtitle?: string;
    icon?: string;
    tierColor?: string;
    width?: number;
    height?: number;
  }>;
  edges?: Array<{
    id?: string;
    source: string;
    target: string;
    communicationType?: string;
    pathType?: string;
    label?: string;
  }>;
  direction?: string;
}): Promise<MCPResponse> {
  const nodes = input.nodes ?? [];
  const edges = input.edges ?? [];
  
  const mappedNodes = nodes.map((n, i) => ({
    id: n.id ?? `node-${i}`,
    label: n.label,
    tier: n.tier ?? n.layer ?? 'compute',
    subtitle: n.subtitle,
    icon: n.icon,
    tierColor: n.tierColor,
    width: n.width ?? 180,
    height: n.height ?? 70,
  }));
  
  const mappedEdges = edges.map((e, i) => ({
    id: e.id ?? `edge-${i}`,
    source: e.source,
    target: e.target,
    communicationType: e.communicationType ?? 'sync',
    pathType: e.pathType ?? 'smooth',
    label: e.label,
  }));
  
  return {
    success: true,
    nodes: mappedNodes,
    edges: mappedEdges,
    message: 'Diagram generated. Use ELK layout to position nodes.',
    diagramUrl: '/editor?session=demo',
  };
}

export async function fixLayout(input: {
  nodes: Array<{
    id: string;
    label: string;
    layer?: string;
    width?: number;
    height?: number;
  }>;
  edges?: Array<{
    id?: string;
    source: string;
    target: string;
    communicationType?: string;
  }>;
  direction?: string;
}): Promise<unknown> {
  return {
    success: true,
    nodes: input.nodes,
    edges: input.edges,
    message: 'Layout applied.',
  };
}

export async function listNodeTypes(input?: {
  category?: string;
  search?: string;
  limit?: number;
}): Promise<unknown> {
  return {
    categories: ['Client & Entry', 'Compute', 'AI / ML', 'Data Storage', 'Messaging & Events', 'Observability', 'External'],
    nodes: [],
  };
}

export async function applyTemplate(input: {
  templateId: string;
  customizations?: {
    renameNodes?: Record<string, string>;
    addNodes?: Array<{
      id: string;
      label: string;
      category?: string;
      color?: string;
      icon?: string;
    }>;
  };
}): Promise<MCPResponse> {
  return {
    success: true,
    message: `Template "${input.templateId}" applied.`,
    diagramUrl: '/editor?session=template',
  };
}

export function getAvailableTemplates(): Array<{ id: string; name: string; description: string }> {
  return [
    { id: 'archflow', name: 'ArchDraw Architecture', description: 'Modern SaaS architecture' },
    { id: 'chatgpt', name: 'LLM Chat App', description: 'Chat with RAG and vector DB' },
    { id: 'instagram', name: 'Social Platform', description: 'Media sharing platform' },
    { id: 'rideshare', name: 'Rideshare', description: 'Uber-like app with real-time tracking' },
    { id: 'ecommerce', name: 'E-commerce', description: 'Full shopping platform' },
  ];
}

export function getReadMe(): string {
  return `# ArchDraw Reference

## Tiers
- client (purple): Browser, Mobile
- edge (indigo): CDN, Load Balancer, API Gateway
- compute (teal): API Server, Auth, Workers
- async (amber): Message Queue, Event Bus
- data (blue): Database, Cache, Storage
- observe (gray): Monitoring, Logging

## Edge Types
- sync: Solid line, REST/HTTPS
- async: Dashed amber, message queues
- stream: Streaming connections
- event: Event-driven

## Layout
Use ELK layered algorithm for auto-layout.`;
}

export function getDiagramState(): { nodes: unknown[]; edges: unknown[] } {
  return { nodes: [], edges: [] };
}

export async function updateDiagram(input: {
  addNodes?: Array<{ id: string; label: string; tier?: string; subtitle?: string; icon?: string }>;
  removeNodeIds?: string[];
  addEdges?: Array<{ source: string; target: string; communicationType?: string; label?: string }>;
  removeEdgeIds?: string[];
  updateNodes?: Array<{ id: string; label?: string; subtitle?: string; tier?: string }>;
}): Promise<unknown> {
  return { success: true, message: 'Diagram updated.' };
}

export async function validateDiagram(): Promise<unknown> {
  return { valid: true, issues: [] };
}

export async function saveCheckpoint(input: { name: string; description?: string }): Promise<unknown> {
  return { success: true, name: input.name };
}

export async function loadCheckpoint(input: { name: string; listAvailable?: boolean }): Promise<unknown> {
  return { success: true, checkpoint: null };
}

export async function exportDiagram(input: { sessionId: string; format?: string }): Promise<unknown> {
  return { format: input.format ?? 'json', data: null };
}
