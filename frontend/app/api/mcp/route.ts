import { NextRequest } from 'next/server';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { generateDiagram } from '@/mcp-server/dist/tools/generate-diagram.js';
import { fixLayout } from '@/mcp-server/dist/tools/fix-layout.js';
import { listNodeTypes } from '@/mcp-server/dist/tools/list-nodes.js';
import { applyTemplate, getAvailableTemplates } from '@/mcp-server/dist/tools/apply-template.js';
import { getReadMe } from '@/mcp-server/dist/tools/read-me.js';
import logger from '@/lib/logger';

// ── MCP Server Setup ─────────────────────────────────────────────────────────

const server = new Server(
  {
    name: 'archdraw-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const tools: Tool[] = [
    {
      name: 'generate_diagram',
      description: 'Generates an architecture diagram with auto-layout and saving.',
      inputSchema: {
        type: 'object',
        properties: {
          nodes: {
            type: 'array',
            description: 'Array of nodes. RULES: (1) every node needs id+label+tier+subtitle, (2) include at least one isGroup:true node, (3) use parentId to nest nodes inside groups.',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                label: { type: 'string' },
                tier: { type: 'string' },
                layer: { type: 'string' },
                subtitle: { type: 'string' },
                isGroup: { type: 'boolean' },
                parentId: { type: 'string' },
                groupColor: { type: 'string' },
                icon: { type: 'string' },
                tierColor: { type: 'string' },
                accentColor: { type: 'string' },
                status: { type: 'string' },
                width: { type: 'number' },
                height: { type: 'number' },
                shape: { type: 'string' },
              },
              required: ['label'],
            },
          },
          edges: {
            type: 'array',
            description: 'Array of edges.',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                source: { type: 'string' },
                target: { type: 'string' },
                communicationType: { type: 'string', enum: ['sync', 'async', 'stream', 'event', 'dep'] },
                pathType: { type: 'string', enum: ['smooth', 'Smoothstep', 'bezier', 'step', 'straight'] },
                label: { type: 'string' },
              },
              required: ['source', 'target'],
            },
          },
          direction: { type: 'string', enum: ['RIGHT', 'DOWN', 'LEFT', 'UP'], default: 'RIGHT' },
          label: { type: 'string' },
          diagramDescription: { type: 'string' },
        },
        required: ['nodes', 'edges'],
      },
    },
    {
      name: 'fix_layout',
      description: 'Optimizes the layout of an existing diagram.',
      inputSchema: {
        type: 'object',
        properties: {
          nodes: { type: 'array', items: { type: 'object' } },
          edges: { type: 'array', items: { type: 'object' } },
        },
        required: ['nodes', 'edges'],
      },
    },
    {
      name: 'list_node_types',
      description: 'Lists available component types for diagramming.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'get_readme',
      description: 'Returns the documentation for the ArchDraw MCP server.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'list_templates',
      description: 'Lists available architecture templates.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'apply_template',
      description: 'Applies a template to start a diagram.',
      inputSchema: {
        type: 'object',
        properties: {
          templateId: { type: 'string', description: 'ID of the template to apply' },
        },
        required: ['templateId'],
      },
    },
  ];

  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'generate_diagram': {
        const result = await generateDiagram(args as any);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }
      case 'fix_layout': {
        const layoutArgs = args as { nodes: unknown[]; edges: unknown[] };
        const result = await fixLayout(layoutArgs as any);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }
      case 'list_node_types': {
        const result = await listNodeTypes({} as any);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }
      case 'get_readme': {
        const result = await getReadMe();
        return { content: [{ type: 'text', text: result }] };
      }
      case 'list_templates': {
        const result = await getAvailableTemplates();
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }
      case 'apply_template': {
        const templateArgs = args as { templateId: string };
        const result = await applyTemplate(templateArgs);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
      isError: true,
    };
  }
});

// ── HTTP Transport Setup ─────────────────────────────────────────────────────

let transport: WebStandardStreamableHTTPServerTransport | null = null;

async function getTransport() {
  if (!transport) {
    transport = new WebStandardStreamableHTTPServerTransport('/api/mcp' as any);
    await server.connect(transport);
  }
  return transport;
}

export async function GET(request: NextRequest) {
  try {
    const t = await getTransport();
    return t.handleRequest(request);
  } catch (error) {
    logger.error('[MCP] GET error:', error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const t = await getTransport();
    return t.handleRequest(request);
  } catch (error) {
    logger.error('[MCP] POST error:', error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const t = await getTransport();
    // transport doesn't explicitly have handleDelete, use handleRequest which covers all methods
    const webRequest = new Request(request.url, {
      method: 'DELETE',
      headers: request.headers,
    });
    return t.handleRequest(webRequest);
  } catch (error) {
    logger.error('[MCP] DELETE error:', error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
}
