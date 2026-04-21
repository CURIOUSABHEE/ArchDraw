import { z } from 'zod';

export const NodeInputSchema = z.object({
  id: z.string().optional().describe('Unique node identifier. If not provided, auto-generated.'),
  label: z.string().describe('Display name of the node (e.g., "API Gateway", "PostgreSQL", "Redis Cache")'),
  tier: z.string().optional().describe('Tier placement: client, edge, compute, async, data, observe, external'),
  layer: z.string().optional().describe('Alternative to tier - same values accepted'),
  subtitle: z.string().optional().describe('Short description shown under the label'),
  icon: z.string().optional().describe('Icon name from the icon set'),
  tierColor: z.string().optional().describe('Hex color for the node (e.g., "#3b82f6")'),
  width: z.number().optional().default(180).describe('Node width in pixels'),
  height: z.number().optional().default(70).describe('Node height in pixels'),
  serviceType: z.string().optional().describe('Service type or category'),
  isGroup: z.boolean().optional().describe('Whether this is a group container'),
  parentId: z.string().optional().describe('Parent node ID if this is a child node'),
});

export const EdgeInputSchema = z.object({
  id: z.string().optional().describe('Unique edge identifier'),
  source: z.string().describe('Source node ID (the node where the edge starts)'),
  target: z.string().describe('Target node ID (the node where the edge ends)'),
  communicationType: z.enum(['sync', 'async', 'stream', 'event', 'dep']).default('sync').describe('Communication pattern: sync (solid), async (dashed animated), stream (streaming), event (event-driven), dep (dependency/gray)'),
  pathType: z.enum(['smooth', 'Smoothstep', 'bezier', 'step', 'straight']).default('Smoothstep').describe('Edge path style'),
  label: z.string().optional().describe('Optional label shown on the edge'),
});

export const GenerateDiagramInputSchema = z.object({
  nodes: z.array(NodeInputSchema).min(1).describe('Array of nodes to position. Each node must have a label. The AI model should have generated these nodes based on the user description.'),
  edges: z.array(EdgeInputSchema).optional().describe('Array of edges connecting nodes. If not provided, no edges will be created.'),
  direction: z.enum(['RIGHT', 'DOWN', 'LEFT', 'UP']).default('RIGHT').describe('Layout direction: RIGHT (left-to-right/LR), DOWN (top-to-bottom/TB), LEFT, or UP'),
  label: z.string().optional().describe('Optional diagram title/label'),
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

// New schemas for additional tools
export const UpdateDiagramInputSchema = z.object({
  addNodes: z.array(z.object({
    id: z.string(),
    label: z.string(),
    tier: z.string(),
    subtitle: z.string().optional(),
    icon: z.string().optional(),
  })).optional(),
  removeNodeIds: z.array(z.string()).optional(),
  addEdges: z.array(z.object({
    source: z.string(),
    target: z.string(),
    communicationType: z.enum(['sync', 'async', 'stream', 'event', 'dep']).optional(),
    label: z.string().optional(),
  })).optional(),
  removeEdgeIds: z.array(z.string()).optional(),
  updateNodes: z.array(z.object({
    id: z.string(),
    label: z.string().optional(),
    subtitle: z.string().optional(),
    tier: z.string().optional(),
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
      subtitle: z.string().optional(),
    }),
    width: z.number().optional(),
    height: z.number().optional(),
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
