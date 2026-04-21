import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import type { ReactFlowNode, ReactFlowEdge } from './types/index.js';
import { generateDiagram } from './tools/generate-diagram.js';
import { fixLayout } from './tools/fix-layout.js';
import { listNodeTypes } from './tools/list-nodes.js';
import { applyTemplate, getAvailableTemplates } from './tools/apply-template.js';
import { getReadMe } from './tools/read-me.js';
import { getDiagramState } from './lib/diagram-state.js';
import { validateDiagram } from './tools/validate-diagram.js';
import { updateDiagram } from './tools/update-diagram.js';
import { saveCheckpoint } from './tools/save-checkpoint.js';
import { loadCheckpoint } from './tools/load-checkpoint.js';
import { exportDiagram } from './tools/export-diagram.js';
import {
  GenerateDiagramInputSchema,
  FixLayoutInputSchema,
  ListNodeTypesInputSchema,
  ApplyTemplateInputSchema,
  UpdateDiagramInputSchema,
  SaveCheckpointInputSchema,
  LoadCheckpointInputSchema,
  ExportDiagramInputSchema,
} from './lib/schema.js';

const TOOLS: Tool[] = [
  {
    name: 'generate_diagram',
    description: `Generate React Flow nodes and edges with ELK auto-layout positions.

**IMPORTANT**: When this tool returns a 'diagramUrl', you MUST tell the user to open that URL in their browser.`,
    inputSchema: {
      type: 'object',
      properties: {
        nodes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              label: { type: 'string' },
              tier: { type: 'string' },
              layer: { type: 'string' },
              subtitle: { type: 'string' },
              icon: { type: 'string' },
              tierColor: { type: 'string' },
              width: { type: 'number' },
              height: { type: 'number' },
            },
            required: ['label'],
          },
        },
        edges: {
          type: 'array',
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
        direction: { type: 'string', enum: ['RIGHT', 'DOWN', 'LEFT', 'UP'] },
      },
    },
  },
  {
    name: 'fix_layout',
    description: 'Apply ELK auto-layout algorithm to existing nodes and edges.',
    inputSchema: {
      type: 'object',
      properties: {
        nodes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              label: { type: 'string' },
              layer: { type: 'string' },
              width: { type: 'number' },
              height: { type: 'number' },
            },
            required: ['id', 'label', 'layer'],
          },
        },
        edges: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              source: { type: 'string' },
              target: { type: 'string' },
              communicationType: { type: 'string' },
            },
            required: ['source', 'target'],
          },
        },
        direction: { type: 'string', enum: ['RIGHT', 'DOWN', 'LEFT', 'UP'] },
      },
      required: ['nodes'],
    },
  },
  {
    name: 'list_node_types',
    description: 'List all available pre-made component types from the ArchDraw component library.',
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string' },
        search: { type: 'string' },
        limit: { type: 'number', default: 50 },
      },
    },
  },
  {
    name: 'apply_template',
    description: 'Apply a pre-built architecture template.',
    inputSchema: {
      type: 'object',
      properties: {
        templateId: { type: 'string' },
        customizations: { type: 'object' },
      },
      required: ['templateId'],
    },
  },
  {
    name: 'list_templates',
    description: 'List all available architecture templates.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'read_me',
    description: 'Returns ArchDraw reference guide.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_diagram_state',
    description: 'Returns the current diagram nodes and edges.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'update_diagram',
    description: 'Surgically modifies an existing diagram.',
    inputSchema: {
      type: 'object',
      properties: {
        addNodes: { type: 'array' },
        removeNodeIds: { type: 'array' },
        addEdges: { type: 'array' },
        removeEdgeIds: { type: 'array' },
        updateNodes: { type: 'array' },
      },
    },
  },
  {
    name: 'validate_diagram',
    description: 'Analyses the current diagram and returns issues.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'save_checkpoint',
    description: 'Saves the current diagram state.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
      },
      required: ['name'],
    },
  },
  {
    name: 'load_checkpoint',
    description: 'Restores a previously saved diagram state.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        listAvailable: { type: 'boolean' },
      },
      required: ['name'],
    },
  },
  {
    name: 'export_diagram',
    description: 'Export the current diagram in various formats.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string' },
        format: { type: 'string', enum: ['json', 'png', 'svg'] },
      },
      required: ['sessionId'],
    },
  },
];

export function createMCPServer() {
  const server = new Server(
    { name: 'archdraw-mcp-server', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
      let result: unknown;
      switch (name) {
        case 'generate_diagram': {
          const input = GenerateDiagramInputSchema.parse(args);
          result = await generateDiagram(input);
          if (result && typeof result === 'object' && 'success' in result && result.success) {
            const { setDiagramState } = await import('./lib/diagram-state.js');
            setDiagramState({ nodes: (result as unknown as { nodes: ReactFlowNode[] }).nodes, edges: (result as unknown as { edges: ReactFlowEdge[] }).edges });
          }
          break;
        }
        case 'fix_layout': {
          const input = FixLayoutInputSchema.parse(args);
          result = await fixLayout(input);
          break;
        }
        case 'list_node_types': {
          const input = ListNodeTypesInputSchema.parse(args ?? {});
          result = await listNodeTypes(input);
          break;
        }
        case 'apply_template': {
          const input = ApplyTemplateInputSchema.parse(args);
          result = await applyTemplate(input);
          if (result && typeof result === 'object' && 'success' in result && result.success) {
            const { setDiagramState } = await import('./lib/diagram-state.js');
            setDiagramState({ nodes: (result as unknown as { nodes: ReactFlowNode[] }).nodes, edges: (result as unknown as { edges: ReactFlowEdge[] }).edges });
          }
          break;
        }
        case 'list_templates':
          result = { templates: getAvailableTemplates() };
          break;
        case 'read_me':
          result = getReadMe();
          break;
        case 'get_diagram_state':
          result = getDiagramState();
          break;
        case 'update_diagram': {
          const input = UpdateDiagramInputSchema.parse(args);
          result = await updateDiagram(input);
          break;
        }
        case 'validate_diagram':
          result = await validateDiagram();
          break;
        case 'save_checkpoint': {
          const input = SaveCheckpointInputSchema.parse(args);
          result = await saveCheckpoint(input);
          break;
        }
        case 'load_checkpoint': {
          const input = LoadCheckpointInputSchema.parse(args);
          result = await loadCheckpoint(input);
          break;
        }
        case 'export_diagram': {
          const input = ExportDiagramInputSchema.parse(args);
          result = await exportDiagram(input);
          break;
        }
        default:
          return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
      }
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      return {
        content: [{ type: 'text', text: error instanceof Error ? error.message : String(error) }],
        isError: true,
      };
    }
  });

  return server;
}
