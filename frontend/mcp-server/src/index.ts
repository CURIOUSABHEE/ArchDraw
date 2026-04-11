import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
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

**IMPORTANT**: When this tool returns a 'diagramUrl', you MUST tell the user to open that URL in their browser to view the diagram. The URL format is: http://localhost:3000/editor?session=<sessionId>

**YOUR RESPONSIBILITY**: You are the AI model that generates the architecture diagram. Based on the user's description:
1. Decide which components/nodes to include (use list_node_types to browse available components)
2. Assign each node to the correct tier (client, edge, compute, async, data, observe, external)
3. Create edges between nodes based on data flow
4. Call this tool with your generated nodes and edges

**INPUT FORMAT**:
- nodes: Array of node objects you create. Each node needs:
  - label: Display name (e.g., "API Gateway", "PostgreSQL")
  - tier: Which tier it belongs to
  - subtitle: Optional short description
  - icon: Optional icon name
  - tierColor: Optional hex color
   
- edges: Array of connections between nodes:
  - source: Node ID that data flows FROM
  - target: Node ID that data flows TO
  - communicationType: sync (normal), async (queue), stream (streaming), event (events), dep (dependency)

**OUTPUT**: Returns React Flow nodes with x,y positions from ELK layout algorithm, ready to render. IMPORTANT: Check the 'message' and 'diagramUrl' fields in the response and tell the user to open the diagramUrl in their browser.

**TIER SYSTEM**:
- client (purple): Browser, Mobile App, Web Client
- edge (indigo): CDN, Load Balancer, API Gateway, WAF
- compute (teal): API Server, Auth Service, Business Logic, Workers
- async (amber): Message Queue, Event Bus, Task Queue
- data (blue): Database, Cache, Object Storage
- observe (gray): Monitoring, Logging, Tracing
- external (gray): Third-party APIs, Payment gateways`,
    inputSchema: {
      type: 'object',
      properties: {
        nodes: {
          type: 'array',
          description: 'Array of nodes to position. YOU generate these based on the user request. Each node must have: label (required), tier (required), and optionally: subtitle, icon, tierColor, width, height.',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Unique node identifier' },
              label: { type: 'string', description: 'Display name (e.g., "API Gateway", "PostgreSQL")' },
              tier: { type: 'string', description: 'Tier: client, edge, compute, async, data, observe, external' },
              layer: { type: 'string', description: 'Alternative to tier' },
              subtitle: { type: 'string', description: 'Short description under label' },
              icon: { type: 'string', description: 'Icon name' },
              tierColor: { type: 'string', description: 'Hex color like #3b82f6' },
              width: { type: 'number', default: 180, description: 'Node width' },
              height: { type: 'number', default: 70, description: 'Node height' },
            },
            required: ['label'],
          },
        },
        edges: {
          type: 'array',
          description: 'Array of edges connecting nodes. YOU decide these based on data flow.',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Unique edge identifier' },
              source: { type: 'string', description: 'Source node ID (data flows from)' },
              target: { type: 'string', description: 'Target node ID (data flows to)' },
              communicationType: {
                type: 'string',
                enum: ['sync', 'async', 'stream', 'event', 'dep'],
                default: 'sync',
                description: 'Communication pattern',
              },
              pathType: {
                type: 'string',
                enum: ['smooth', 'bezier', 'step', 'straight'],
                default: 'smooth',
                description: 'Edge path style',
              },
              label: { type: 'string', description: 'Optional edge label' },
            },
            required: ['source', 'target'],
          },
        },
        direction: {
          type: 'string',
          enum: ['RIGHT', 'DOWN', 'LEFT', 'UP'],
          default: 'RIGHT',
          description: 'Layout direction: RIGHT (LR), DOWN (TB), LEFT, UP',
        },
      },
      required: ['nodes'],
    },
  },
  {
    name: 'fix_layout',
    description: `Apply ELK auto-layout algorithm to existing nodes and edges.

**USE WHEN**: User provides nodes/edges that need automatic positioning
**INPUT**: Nodes with their tier assignments, plus edges between them
**OUTPUT**: Returns nodes with x,y positions computed by ELK layered algorithm

This tool does NOT generate or modify nodes/edges - it only computes optimal positions.

**INPUT**:
- nodes: Array of nodes (id, label, layer/tier required)
- edges: Array of connections between nodes
- direction: Layout direction (RIGHT is default, means left-to-right)`,
    inputSchema: {
      type: 'object',
      properties: {
        nodes: {
          type: 'array',
          description: 'Array of nodes with layer assignments',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Unique node identifier' },
              label: { type: 'string', description: 'Node label/name' },
              layer: { type: 'string', description: 'Tier layer: client, edge, compute, async, data, observe, external' },
              width: { type: 'number', default: 180, description: 'Node width' },
              height: { type: 'number', default: 70, description: 'Node height' },
            },
            required: ['id', 'label', 'layer'],
          },
        },
        edges: {
          type: 'array',
          description: 'Array of edges connecting the nodes',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Unique edge identifier' },
              source: { type: 'string', description: 'Source node ID' },
              target: { type: 'string', description: 'Target node ID' },
              communicationType: {
                type: 'string',
                enum: ['sync', 'async', 'stream', 'event', 'dep'],
                default: 'sync',
                description: 'Communication type between nodes',
              },
            },
            required: ['source', 'target'],
          },
        },
        direction: {
          type: 'string',
          enum: ['RIGHT', 'DOWN', 'LEFT', 'UP'],
          default: 'RIGHT',
          description: 'Layout direction',
        },
      },
      required: ['nodes'],
    },
  },
  {
    name: 'list_node_types',
    description: `List all available pre-made component types from the ArchDraw component library.

**USE WHEN**: You want to see what components are available before generating a diagram
**OUTPUT**: Categorized list of 150+ component types with their icons and descriptions

**FILTERING**:
- category: Filter by category name (e.g., "AI / ML", "Data Storage", "Compute", "Messaging & Events")
- search: Search by label, description, or category
- limit: Max results (default 50, max 200)

**CATEGORIES INCLUDE**:
- Client & Entry (CDN, Load Balancer, API Gateway)
- Compute (API Server, Auth Service, Workers, Containers)
- AI / ML (LLM Models, Vector DB, Embedding Service, RAG)
- Data Storage (PostgreSQL, MongoDB, Redis, S3)
- Messaging & Events (Kafka, RabbitMQ, SQS)
- Observability (Prometheus, Grafana, ELK Stack)
- External Services (Stripe, Twilio, SendGrid)`,
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Filter by category name (e.g., "AI / ML", "Data Storage", "Compute")',
        },
        search: {
          type: 'string',
          description: 'Search by label, description, or category',
        },
        limit: {
          type: 'number',
          default: 50,
          minimum: 1,
          maximum: 200,
          description: 'Maximum number of results',
        },
      },
    },
  },
  {
    name: 'apply_template',
    description: `Apply a pre-built architecture template with pre-defined nodes and edges.

**IMPORTANT**: When this tool returns a 'diagramUrl', you MUST tell the user to open that URL in their browser to view the diagram. The URL format is: http://localhost:3000/editor?session=<sessionId>

**USE WHEN**: User wants a common architecture pattern (e-commerce, chat app, rideshare, etc.)
**OUTPUT**: Full diagram with positioned nodes and edges from the template. Check the 'message' and 'diagramUrl' fields and tell the user to open the diagramUrl.

**AVAILABLE TEMPLATES**:
- archflow: ArchDraw's own architecture (modern SaaS)
- chatgpt: LLM chat app with RAG, vector DB, streaming
- instagram: Social platform with Kafka, media storage, search
- rideshare: Uber-like with real-time tracking and dynamic pricing
- ecommerce: Full e-commerce with cart, payments, order management

**CUSTOMIZATIONS**:
- renameNodes: Map of node ID to new label
- addNodes: Additional nodes to include`,
    inputSchema: {
      type: 'object',
      properties: {
        templateId: {
          type: 'string',
          description: 'Template identifier: archflow, chatgpt, instagram, rideshare, ecommerce',
        },
        customizations: {
          type: 'object',
          description: 'Optional customizations to apply',
          properties: {
            renameNodes: {
              type: 'object',
              description: 'Map of node ID to new label',
              additionalProperties: { type: 'string' },
            },
            addNodes: {
              type: 'array',
              description: 'Additional nodes to add',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  label: { type: 'string' },
                  category: { type: 'string' },
                  color: { type: 'string' },
                  icon: { type: 'string' },
                },
              },
            },
          },
        },
      },
      required: ['templateId'],
    },
  },
  {
    name: 'list_templates',
    description: 'List all available architecture templates with their descriptions',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'read_me',
    description: `Returns a compact LLM-optimized reference guide for ArchDraw — tiers, node types, 
edge communication types, layout rules, and best practices. Call this FIRST before generating 
any diagram to produce accurate, professional output.`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_diagram_state',
    description: `Returns the current diagram's nodes and edges as structured JSON. 
Call this before update_diagram to read what's on the canvas.`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'update_diagram',
    description: `Surgically modifies an existing diagram. Add nodes, remove nodes, 
add edges, remove edges, or update node properties — without regenerating the whole diagram.`,
    inputSchema: {
      type: 'object',
      properties: {
        addNodes: {
          type: 'array',
          description: 'Nodes to add',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Unique node identifier' },
              label: { type: 'string', description: 'Display name' },
              tier: { type: 'string', description: 'Tier: client, edge, compute, async, data, observe, external' },
              subtitle: { type: 'string', description: 'Optional short description' },
              icon: { type: 'string', description: 'Optional icon name' },
            },
            required: ['id', 'label', 'tier'],
          },
        },
        removeNodeIds: {
          type: 'array',
          description: 'Node IDs to remove',
          items: { type: 'string' },
        },
        addEdges: {
          type: 'array',
          description: 'Edges to add',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string', description: 'Source node ID' },
              target: { type: 'string', description: 'Target node ID' },
              communicationType: { type: 'string', enum: ['sync', 'async', 'stream', 'event', 'dep'] },
              label: { type: 'string', description: 'Optional edge label' },
            },
            required: ['source', 'target'],
          },
        },
        removeEdgeIds: {
          type: 'array',
          description: 'Edge IDs to remove',
          items: { type: 'string' },
        },
        updateNodes: {
          type: 'array',
          description: 'Nodes to update',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Node ID to update' },
              label: { type: 'string', description: 'New label' },
              subtitle: { type: 'string', description: 'New subtitle' },
              tier: { type: 'string', description: 'New tier' },
            },
            required: ['id'],
          },
        },
      },
    },
  },
  {
    name: 'validate_diagram',
    description: `Analyses the current diagram and returns a list of structural issues 
and improvement suggestions. Use after generating to catch problems before rendering.`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'save_checkpoint',
    description: `Saves the current diagram state with a named label so it can be restored later. 
Useful for multi-turn workflows: save before a major change, restore if needed.`,
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Checkpoint name (e.g. "before-refactor")' },
        description: { type: 'string', description: 'Optional description' },
      },
      required: ['name'],
    },
  },
  {
    name: 'load_checkpoint',
    description: `Restores a previously saved diagram state by name.`,
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Checkpoint name to restore' },
        listAvailable: { type: 'boolean', description: 'If true, list all checkpoints without restoring' },
      },
      required: ['name'],
    },
  },
  {
    name: 'export_diagram',
    description: `Export the current diagram in various formats.

**USE WHEN**: User wants to save or download the diagram
**OUTPUT**: Returns the diagram data or instructions for image export

**FORMATS**:
- json: Returns raw nodes and edges as JSON (recommended for saving)
- png: Returns instructions to export as PNG from the editor
- svg: Returns instructions to export as SVG from the editor

**REQUIREMENT**: You must have a diagram loaded (generate or apply a template first).`,
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Session ID from a previous diagram operation' },
        format: { type: 'string', enum: ['json', 'png', 'svg'], default: 'json', description: 'Export format' },
      },
      required: ['sessionId'],
    },
  },
];

class ArchDrawMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'archdraw-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return { tools: TOOLS };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'generate_diagram': {
            const input = GenerateDiagramInputSchema.parse(args);
            const result = await generateDiagram(input);
            if (result.success) {
              const { setDiagramState } = await import('./lib/diagram-state.js');
              setDiagramState({ nodes: result.nodes, edges: result.edges });
            }
            return {
              content: [
                {
                  type: 'text' as const,
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'fix_layout': {
            const input = FixLayoutInputSchema.parse(args);
            const result = await fixLayout(input);
            return {
              content: [
                {
                  type: 'text' as const,
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'list_node_types': {
            const input = ListNodeTypesInputSchema.parse(args ?? {});
            const result = await listNodeTypes(input);
            return {
              content: [
                {
                  type: 'text' as const,
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'apply_template': {
            const input = ApplyTemplateInputSchema.parse(args);
            const result = await applyTemplate(input);
            if (result.success) {
              const { setDiagramState } = await import('./lib/diagram-state.js');
              setDiagramState({ nodes: result.nodes, edges: result.edges });
            }
            return {
              content: [
                {
                  type: 'text' as const,
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'list_templates': {
            const templates = getAvailableTemplates();
            return {
              content: [
                {
                  type: 'text' as const,
                  text: JSON.stringify({ templates }, null, 2),
                },
              ],
            };
          }

          case 'read_me': {
            const readmeContent = getReadMe();
            return {
              content: [
                {
                  type: 'text' as const,
                  text: readmeContent,
                },
              ],
            };
          }

          case 'get_diagram_state': {
            const state = getDiagramState();
            return {
              content: [
                {
                  type: 'text' as const,
                  text: JSON.stringify(
                    state.nodes.length === 0 && state.edges.length === 0
                      ? { nodes: [], edges: [], message: 'No diagram loaded yet.' }
                      : state,
                    null,
                    2
                  ),
                },
              ],
            };
          }

          case 'update_diagram': {
            const input = UpdateDiagramInputSchema.parse(args);
            const result = await updateDiagram(input);
            return {
              content: [
                {
                  type: 'text' as const,
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'validate_diagram': {
            const result = await validateDiagram();
            return {
              content: [
                {
                  type: 'text' as const,
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'save_checkpoint': {
            const input = SaveCheckpointInputSchema.parse(args);
            const result = await saveCheckpoint(input);
            return {
              content: [
                {
                  type: 'text' as const,
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'load_checkpoint': {
            const input = LoadCheckpointInputSchema.parse(args);
            const result = await loadCheckpoint(input);
            return {
              content: [
                {
                  type: 'text' as const,
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'export_diagram': {
            const input = ExportDiagramInputSchema.parse(args);
            const result = await exportDiagram(input);
            return {
              content: [
                {
                  type: 'text' as const,
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          default:
            return {
              content: [
                {
                  type: 'text' as const,
                  text: `Unknown tool: ${name}`,
                },
              ],
              isError: true,
            };
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text' as const,
              text: error instanceof Error ? error.message : String(error),
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('ArchDraw MCP server running on stdio');
  }
}

const server = new ArchDrawMCPServer();
server.run().catch(console.error);
