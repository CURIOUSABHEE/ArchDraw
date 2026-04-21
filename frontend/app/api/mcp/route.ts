import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const GenerateDiagramInputSchema = z.object({
  nodes: z.array(z.object({
    id: z.string().optional(),
    label: z.string(),
    tier: z.string().optional(),
    layer: z.string().optional(),
    subtitle: z.string().optional(),
    icon: z.string().optional(),
    tierColor: z.string().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
  })).optional(),
  edges: z.array(z.object({
    id: z.string().optional(),
    source: z.string(),
    target: z.string(),
    communicationType: z.enum(['sync', 'async', 'stream', 'event', 'dep']).optional(),
    pathType: z.enum(['smooth', 'bezier', 'step', 'straight']).optional(),
    label: z.string().optional(),
  })).optional(),
  direction: z.enum(['RIGHT', 'DOWN', 'LEFT', 'UP']).optional(),
});

const FixLayoutInputSchema = z.object({
  nodes: z.array(z.object({
    id: z.string(),
    label: z.string(),
    layer: z.string().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
  })),
  edges: z.array(z.object({
    id: z.string().optional(),
    source: z.string(),
    target: z.string(),
    communicationType: z.enum(['sync', 'async', 'stream', 'event', 'dep']).optional(),
  })).optional(),
  direction: z.enum(['RIGHT', 'DOWN', 'LEFT', 'UP']).optional(),
});

const ListNodeTypesInputSchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  limit: z.number().min(1).max(200).optional(),
});

const ApplyTemplateInputSchema = z.object({
  templateId: z.string(),
  customizations: z.object({
    renameNodes: z.record(z.string(), z.string()).optional(),
    addNodes: z.array(z.object({
      id: z.string(),
      label: z.string(),
      category: z.string().optional(),
      color: z.string().optional(),
      icon: z.string().optional(),
    })).optional(),
  }).optional(),
});

const UpdateDiagramInputSchema = z.object({
  addNodes: z.array(z.object({
    id: z.string(),
    label: z.string(),
    tier: z.string().optional(),
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

const SaveCheckpointInputSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
});

const LoadCheckpointInputSchema = z.object({
  name: z.string(),
  listAvailable: z.boolean().optional(),
});

const ExportDiagramInputSchema = z.object({
  sessionId: z.string(),
  format: z.enum(['json', 'png', 'svg']).optional(),
});

const MCPToolRequestSchema = z.object({
  name: z.string(),
  arguments: z.record(z.string(), z.unknown()).optional(),
});

interface MCPResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}

async function handleToolCall(name: string, args: Record<string, unknown>): Promise<MCPResponse> {
  try {
    const mcp = await import('@/lib/ai/services/mcp');
    
    switch (name) {
      case 'generate_diagram': {
        const input = GenerateDiagramInputSchema.parse(args);
        const result = await mcp.generateDiagram(input);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'fix_layout': {
        const input = FixLayoutInputSchema.parse(args);
        const result = await mcp.fixLayout(input);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'list_node_types': {
        const input = ListNodeTypesInputSchema.parse(args ?? {});
        const result = await mcp.listNodeTypes(input);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'apply_template': {
        const input = ApplyTemplateInputSchema.parse(args);
        const result = await mcp.applyTemplate(input);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'list_templates': {
        const templates = mcp.getAvailableTemplates();
        return {
          content: [{ type: 'text', text: JSON.stringify({ templates }, null, 2) }],
        };
      }

      case 'read_me': {
        const readmeContent = mcp.getReadMe();
        return {
          content: [{ type: 'text', text: readmeContent }],
        };
      }

      case 'get_diagram_state': {
        const state = mcp.getDiagramState();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(
              state.nodes.length === 0 && state.edges.length === 0
                ? { nodes: [], edges: [], message: 'No diagram loaded yet.' }
                : state,
              null,
              2
            ),
          }],
        };
      }

      case 'update_diagram': {
        const input = UpdateDiagramInputSchema.parse(args);
        const result = await mcp.updateDiagram(input);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'validate_diagram': {
        const result = await mcp.validateDiagram();
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'save_checkpoint': {
        const input = SaveCheckpointInputSchema.parse(args);
        const result = await mcp.saveCheckpoint(input);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'load_checkpoint': {
        const input = LoadCheckpointInputSchema.parse(args);
        const result = await mcp.loadCheckpoint(input);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'export_diagram': {
        const input = ExportDiagramInputSchema.parse(args);
        const result = await mcp.exportDiagram(input);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      default:
        return {
          content: [{ type: 'text', text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [{ type: 'text', text: error instanceof Error ? error.message : String(error) }],
      isError: true,
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, arguments: args } = MCPToolRequestSchema.parse(body);

    const result = await handleToolCall(name, args ?? {});
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        content: [{ type: 'text', text: error instanceof Error ? error.message : String(error) }],
        isError: true,
      },
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    tools: [
      'generate_diagram',
      'fix_layout',
      'list_node_types',
      'apply_template',
      'list_templates',
      'read_me',
      'get_diagram_state',
      'update_diagram',
      'validate_diagram',
      'save_checkpoint',
      'load_checkpoint',
      'export_diagram',
    ],
  });
}
