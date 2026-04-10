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
import {
  GenerateDiagramInputSchema,
  FixLayoutInputSchema,
  ListNodeTypesInputSchema,
  ApplyTemplateInputSchema,
} from './lib/schema.js';

const TOOLS: Tool[] = [
  {
    name: 'generate_diagram',
    description: `Generate React Flow nodes and edges with ELK auto-layout positions.

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

**OUTPUT**: Returns React Flow nodes with x,y positions from ELK layout algorithm, ready to render.

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

**USE WHEN**: User wants a common architecture pattern (e-commerce, chat app, rideshare, etc.)
**OUTPUT**: Full diagram with positioned nodes and edges from the template

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
