import { z } from 'zod';

export const NodeInputSchema = z.object({
  id: z.string().describe('Unique node identifier. REQUIRED — use snake_case, e.g. "api_gateway", "postgres_db"'),
  label: z.string().describe('Display name shown on the node (e.g., "API Gateway", "PostgreSQL"). Keep it short — 1-3 words.'),
  tier: z.string().describe('Tier placement (REQUIRED): client | edge | compute | async | data | observe | external'),
  layer: z.string().optional().describe('Alternative to tier — same values accepted'),
  subtitle: z.string().describe(
    'Short description shown under the label (REQUIRED for all nodes). ' +
    'CRITICAL: If the user specified a tech stack, the subtitle MUST reflect it. ' +
    'Examples: "AWS Lambda, Node.js 20, handles video uploads" NOT "handles uploads". ' +
    '"PostgreSQL 15 on RDS, stores user data" NOT "database". ' +
    '"CloudFront CDN, serves transcoded HLS segments" NOT "CDN". ' +
    'Always encode the actual technology name + version + role in the subtitle.'
  ),
  icon: z.string().optional().describe('Icon name from lucide-react. Examples: "server", "database", "zap", "globe", "shield", "layers", "cpu", "activity", "box", "cloud"'),
  tierColor: z.string().optional().describe('Override hex color for the node accent. Use tier defaults unless you need visual differentiation.'),
  accentColor: z.string().optional().describe('Additional accent/highlight color for the node. 15 options: #3b82f6 #0ea5e9 #06b6d4 #14b8a6 #22c55e #f59e0b #f97316 #ef4444 #ec4899 #6b7280 #f43f5e #a855f7 #84cc16 #fb923c #0ea5e9'),
  width: z.number().optional().default(200).describe('Node width in pixels. Default 200. Groups should be wider (400-800).'),
  height: z.number().optional().default(70).describe('Node height in pixels. Default 70 for regular nodes. Groups should be taller (200-400).'),
  serviceType: z.string().optional().describe('Service type or category for metadata'),
  isGroup: z.boolean().optional().describe('Set true to render this node as a group container/swimlane that visually wraps child nodes'),
  parentId: z.string().optional().describe('ID of the parent group node. Set this on child nodes to place them inside a group.'),
  groupColor: z.string().optional().describe('Background tint color for group containers (hex). E.g. "#1e293b", "#0f172a"'),
  status: z.enum(['healthy', 'warning', 'error', 'unknown']).optional().describe('Status indicator shown as a colored dot on the node. Use "warning"/"error" to highlight problem areas.'),
  shape: z.enum(['rectangle', 'diamond', 'ellipse', 'hexagon']).optional().describe('Node shape. Default rectangle. Use diamond for decision nodes, ellipse for queues/events.'),
});

export const EdgeInputSchema = z.object({
  id: z.string().optional().describe('Unique edge identifier (auto-generated if omitted)'),
  source: z.string().describe('Source node ID — the node where data/control flows FROM'),
  target: z.string().describe('Target node ID — the node where data/control flows TO'),
  communicationType: z.enum(['sync', 'async', 'stream', 'event', 'dep']).default('sync').describe(
    'Communication pattern:\n' +
    '  sync  = REST/gRPC/HTTP request-response (solid line)\n' +
    '  async = Message queue, background job (dashed amber, animated)\n' +
    '  stream = WebSocket, SSE, real-time (dashed green, animated)\n' +
    '  event = Pub/sub, event-driven (dashed pink, animated)\n' +
    '  dep   = Build-time dependency (dotted gray)'
  ),
  pathType: z.enum(['smooth', 'Smoothstep', 'bezier', 'step', 'straight']).default('Smoothstep').describe('Edge path style. Smoothstep for most cases, bezier for curved, step for right-angle bends.'),
  label: z.string().optional().describe('Label shown on the edge. REQUIRED for async/stream/event edges — describe the message/event. E.g. "user.created", "checkout event", "JWT token", "orders queue"'),
  animated: z.boolean().optional().describe('Override animation. Async/stream/event are animated by default.'),
});

export const GenerateDiagramInputSchema = z.object({
  nodes: z.array(NodeInputSchema).min(1).describe(
    'Array of nodes. RULES:\n' +
    '  1. Every node MUST have: id, label, tier, subtitle\n' +
    '  2. Use 8-20 nodes for readable diagrams\n' +
    '  3. ALWAYS include at least one group node (isGroup:true) to cluster related services\n' +
    '  4. Group example: { id:"backend_group", label:"Backend Services", tier:"compute", subtitle:"Core API layer", isGroup:true, width:500, height:300 }\n' +
    '  5. Child nodes use parentId to sit inside a group: { id:"api", parentId:"backend_group", ... }\n' +
    '  6. Assign meaningful icons — use list_node_types to find them\n' +
    '  7. Use accentColor to differentiate nodes within the same tier\n' +
    '  8. MANDATORY: Width must be >= 180px and auto-fit to longest text (NO TRUNCATION)\n' +
    '  9. MANDATORY: Nodes in same tier must vertically align with no overlap (60px min separation)\n' +
    '  10. TECH STACK FIDELITY: If the user specified any tech/service (e.g. "AWS Lambda", "Redis", "Next.js"), ' +
    'the corresponding node label AND subtitle MUST reflect the exact tech. ' +
    'Never use a generic label like "API Server" if the user said "Express.js on EC2".'
  ),
  edges: z.array(EdgeInputSchema).min(1).describe(
    'Array of edges. RULES:\n' +
    '  1. REQUIRED — you must include edges to show data flow\n' +
    '  2. Use correct communicationType for each connection\n' +
    '  3. Add labels to async/event/stream edges describing the message/event name\n' +
    '  4. Do NOT connect data tier directly to client tier\n' +
    '  5. Observability nodes should use "dep" edges FROM them, not TO them\n' +
    '  6. Edges MUST NOT cross nodes and MUST NOT overlap (use orthogonal/bezier routing)'
  ),
  direction: z.enum(['RIGHT', 'DOWN', 'LEFT', 'UP']).default('RIGHT').describe('Layout direction. RIGHT (left-to-right) works for most architectures. DOWN for hierarchical/mobile-first views.'),
  label: z.string().optional().describe('Diagram title shown in the header'),
  diagramDescription: z.string().optional().describe('One-sentence description of what this architecture does. Helps with diagram metadata.'),
  userPrompt: z.string().optional().describe(
    'The original user request/prompt verbatim. CRITICAL: When provided, every node subtitle MUST reflect ' +
    'any tech stack, services, or features the user mentioned. ' +
    'E.g. if user said "use AWS Lambda and DynamoDB", those exact names must appear in node labels/subtitles. ' +
    'If user said "add rate limiting", an explicit node or edge label must show rate limiting.'
  ),
  techStack: z.array(z.string()).optional().describe(
    'Explicit list of technologies/services extracted from the user prompt. ' +
    'E.g. ["AWS Lambda", "DynamoDB", "CloudFront", "Redis", "Next.js"]. ' +
    'Every item here MUST appear verbatim in at least one node label or subtitle.'
  ),
  customFeatures: z.array(z.string()).optional().describe(
    'Custom features or components the user explicitly requested. ' +
    'E.g. ["rate limiting", "push notifications", "real-time chat", "DRM", "A/B testing"]. ' +
    'Each feature MUST have a dedicated node or clearly labeled edge in the diagram.'
  ),
});

export const FixLayoutInputSchema = z.object({
  nodes: z.array(z.object({
    id: z.string(),
    label: z.string(),
    layer: z.string(),
    width: z.number().default(180),
    height: z.number().default(70),
  })).min(1).describe('Array of nodes with their layer assignments'),
  edges: z.array(z.object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
    communicationType: z.enum(['sync', 'async', 'stream', 'event', 'dep']).default('sync'),
  })).describe('Array of edges connecting the nodes'),
  direction: z.enum(['RIGHT', 'DOWN', 'LEFT', 'UP']).default('RIGHT').describe('Layout direction'),
});

export const ListNodeTypesInputSchema = z.object({
  category: z.string().optional().describe('Filter by category name'),
  search: z.string().optional().describe('Search by label or description'),
  limit: z.number().int().min(1).max(200).default(50).describe('Maximum number of results'),
});

export const ApplyTemplateInputSchema = z.object({
  templateId: z.string().min(1).describe('Template identifier'),
  customizations: z.object({
    renameNodes: z.record(z.string(), z.string()).optional().describe('Map of node ID to new label'),
    addNodes: z.array(z.object({
      id: z.string(),
      label: z.string(),
      category: z.string(),
      color: z.string(),
      icon: z.string(),
    })).optional().describe('Additional nodes to add'),
  }).optional().describe('Optional customizations to apply'),
});

export type GenerateDiagramInput = z.infer<typeof GenerateDiagramInputSchema>;
export type FixLayoutInput = z.infer<typeof FixLayoutInputSchema>;
export type ListNodeTypesInput = z.infer<typeof ListNodeTypesInputSchema>;
export type ApplyTemplateInput = z.infer<typeof ApplyTemplateInputSchema>;

export const UpdateDiagramInputSchema = z.object({
  addNodes: z.array(z.object({
    id: z.string(),
    label: z.string(),
    tier: z.string(),
    subtitle: z.string().optional(),
    icon: z.string().optional(),
    tierColor: z.string().optional(),
    accentColor: z.string().optional(),
    status: z.enum(['healthy', 'warning', 'error', 'unknown']).optional(),
    isGroup: z.boolean().optional(),
    parentId: z.string().optional(),
    groupColor: z.string().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
  })).optional(),
  removeNodeIds: z.array(z.string()).optional(),
  addEdges: z.array(z.object({
    source: z.string(),
    target: z.string(),
    communicationType: z.enum(['sync', 'async', 'stream', 'event', 'dep']).optional(),
    label: z.string().optional(),
    pathType: z.enum(['smooth', 'Smoothstep', 'bezier', 'step', 'straight']).optional(),
  })).optional(),
  removeEdgeIds: z.array(z.string()).optional(),
  updateNodes: z.array(z.object({
    id: z.string(),
    label: z.string().optional(),
    subtitle: z.string().optional(),
    tier: z.string().optional(),
    tierColor: z.string().optional(),
    accentColor: z.string().optional(),
    icon: z.string().optional(),
    status: z.enum(['healthy', 'warning', 'error', 'unknown']).optional(),
  })).optional(),
});

export const SaveCheckpointInputSchema = z.object({
  name: z.string().min(1).describe('Name for the checkpoint'),
  description: z.string().optional().describe('Optional description'),
});

export const LoadCheckpointInputSchema = z.object({
  name: z.string().min(1).describe('Checkpoint name to restore'),
  listAvailable: z.boolean().optional().default(false).describe('If true, list all checkpoints without restoring'),
});

export type UpdateDiagramInput = z.infer<typeof UpdateDiagramInputSchema>;
export type SaveCheckpointInput = z.infer<typeof SaveCheckpointInputSchema>;
export type LoadCheckpointInput = z.infer<typeof LoadCheckpointInputSchema>;

export const ExportDiagramInputSchema = z.object({
  sessionId: z.string().uuid().describe('Session ID from a previous diagram generation'),
  format: z.enum(['json', 'png', 'svg']).default('json').describe('Export format: json (diagram data), png/svg (export instructions)'),
});

export type ExportDiagramInput = z.infer<typeof ExportDiagramInputSchema>;

export const GenerateDiagramOutputSchema = z.object({
  success: z.boolean(),
  nodes: z.array(z.object({
    id: z.string(),
    type: z.string(),
    position: z.object({ x: z.number(), y: z.number() }),
    data: z.object({
      label: z.string(),
      icon: z.string(),
      layer: z.string(),
      tier: z.string().optional(),
      tierColor: z.string().optional(),
      accentColor: z.string().optional(),
      subtitle: z.string().optional(),
      status: z.string().optional(),
      isGroup: z.boolean().optional(),
    }),
    width: z.number().optional(),
    height: z.number().optional(),
    parentNode: z.string().optional(),
  })),
  edges: z.array(z.object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
    sourceHandle: z.string(),
    targetHandle: z.string(),
    type: z.string(),
    animated: z.boolean(),
    label: z.string(),
    data: z.object({
      communicationType: z.string(),
      pathType: z.string(),
    }),
  })),
  elkPositions: z.array(z.object({
    id: z.string(),
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  })),
  metadata: z.object({
    nodeCount: z.number(),
    edgeCount: z.number(),
    layoutAlgorithm: z.string(),
    direction: z.string(),
  }),
  diagramUrl: z.string().optional(),
  sessionId: z.string().optional(),
  embeddedDiagram: z.object({
    nodes: z.array(z.unknown()),
    edges: z.array(z.unknown()),
  }).optional(),
  message: z.string().optional(),
  errors: z.array(z.string()).optional(),
});

export const FixLayoutOutputSchema = z.object({
  success: z.boolean(),
  elkPositions: z.array(z.object({
    id: z.string(),
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  })),
  metadata: z.object({
    nodeCount: z.number(),
    edgeCount: z.number(),
    layoutAlgorithm: z.string(),
    direction: z.string(),
  }),
  errors: z.array(z.string()).optional(),
});

export const ListNodeTypesOutputSchema = z.object({
  categories: z.array(z.object({
    name: z.string(),
    count: z.number(),
    nodes: z.array(z.object({
      id: z.string(),
      label: z.string(),
      icon: z.string(),
      description: z.string(),
    })),
  })),
  totalCount: z.number(),
});

export const ApplyTemplateOutputSchema = z.object({
  success: z.boolean(),
  nodes: z.array(z.object({
    id: z.string(),
    type: z.string(),
    position: z.object({ x: z.number(), y: z.number() }),
    data: z.object({
      label: z.string(),
      icon: z.string(),
      layer: z.string(),
      tier: z.string().optional(),
      tierColor: z.string().optional(),
      category: z.string().optional(),
    }),
  })),
  edges: z.array(z.object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
    sourceHandle: z.string(),
    targetHandle: z.string(),
    type: z.string(),
    data: z.object({
      communicationType: z.string(),
      pathType: z.string(),
    }),
  })),
  metadata: z.object({
    templateName: z.string(),
    nodeCount: z.number(),
    edgeCount: z.number(),
  }),
  diagramUrl: z.string().optional(),
  sessionId: z.string().optional(),
  message: z.string().optional(),
  errors: z.array(z.string()).optional(),
});
