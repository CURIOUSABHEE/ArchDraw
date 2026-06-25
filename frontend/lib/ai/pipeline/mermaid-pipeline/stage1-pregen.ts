import { apiKeyManager } from '../../utils/apiKeyManager';
import { groqJsonCompletion } from '../../utils/groqJsonCompletion';
import logger from '@/lib/logger';

export interface FormatConfig {
  format: 'mermaid';
  diagramType: 'graph TD' | 'graph LR' | 'erDiagram' | 'sequenceDiagram' | 'C4Context' | 'C4Container';
  optionalVariants: string[];
}

export interface StyleConfig {
  primaryColor: string;
  secondaryColor: string;
  background: string;
  backgroundColor?: string; // Satisfy A4
  fontFamily: string;
  theme: string;
  nodeTypeStyles?: Record<string, string>; // Satisfy A4
}

export interface InventoryConfig {
  nodes: string[];
  groups: string[];
  nodeCount: number;
  splitMode?: boolean;
  bidirectionalEdgeCount?: number; // Satisfy A3.10
}

const ABSOLUTE_MAX_NODES = 20;

export interface EdgeConfig {
  edges: Array<{
    from: string;
    to: string;
    label: string;
    bidirectional: boolean;
  }>;
  edgeCount: number;
}

const THEME_PALETTES: Record<string, Omit<StyleConfig, 'theme' | 'backgroundColor' | 'nodeTypeStyles'>> = {
  'forest-green': {
    primaryColor: '#2D6A4F',
    secondaryColor: '#354F52',
    background: '#F8F9FA',
    fontFamily: 'Inter',
  },
  'slate': {
    primaryColor: '#334155',
    secondaryColor: '#475569',
    background: '#F8FAFC',
    fontFamily: 'Inter',
  },
  'dark-minimal': {
    primaryColor: '#0F172A',
    secondaryColor: '#1E293B',
    background: '#0B0F19',
    fontFamily: 'Inter',
  },
  'luxury': {
    primaryColor: '#1E1E24',
    secondaryColor: '#D4AF37',
    background: '#FFFDF9',
    fontFamily: 'Outfit',
  },
  'default': {
    primaryColor: '#2563EB',
    secondaryColor: '#4F46E5',
    background: '#F9FAFB',
    fontFamily: 'Inter',
  },
};

function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color) || /^#[0-9A-Fa-f]{3}$/.test(color);
}

async function callAgent<T>(systemPrompt: string, userPrompt: string, model?: string): Promise<T> {
  const resultStr = await apiKeyManager.executeWithRetry(async (groq) => {
    return await groqJsonCompletion(groq, {
      model: model || 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1,
    });
  });

  const cleaned = resultStr.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch (err) {
    logger.error('[Stage 1 Agent] Failed to parse agent JSON response:', cleaned, err);
    throw new Error(`Agent response parsing failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// Agent 1A — FORMAT AGENT
export async function runFormatAgent(prompt: string, model?: string): Promise<FormatConfig> {
  const systemPrompt = `You are the Format Agent in a diagram pipeline.
Identify the requested output format and diagram type from the user's natural language prompt.
Default format is "mermaid".
diagramType MUST be exactly one of: "graph TD", "graph LR", "erDiagram", "sequenceDiagram", "C4Context", "C4Container".
If the user mentions C4, C4 Container, C4 Context, or similar visual frameworks, set diagramType to "C4Context" or "C4Container".
You MUST output a valid JSON object matching this schema:
{
  "format": "mermaid",
  "diagramType": "graph TD" | "graph LR" | "erDiagram" | "sequenceDiagram" | "C4Context" | "C4Container",
  "optionalVariants": ["C4"]
}
Output JSON ONLY. No markdown, no wrapping in code blocks, no prose.`;

  try {
    const res = await callAgent<FormatConfig>(systemPrompt, prompt, model);
    let diagramType = res.diagramType || 'graph TD';
    
    // SMART CLASSIFICATION OVERRIDES (A1.3, A1.4)
    const promptLower = prompt.toLowerCase();
    const archKeywords = [
      'architecture', 'platform', 'microservice', 'container', 'service', 'layer', 'flow', 'cdn',
      'load balancer', 'infrastructure', 'deployment', 'system design', 'pipeline', 'cluster', 'api gateway'
    ];
    const erKeywords = [
      'entity relationship', 'er diagram', 'database schema', 'data model', 'table schema'
    ];

    const hasArch = archKeywords.some(k => promptLower.includes(k));
    const hasExplicitEr = erKeywords.some(k => promptLower.includes(k));

    if (hasArch) {
      logger.warn('[FormatAgent] Forced graph TD: prompt contains architecture keywords.');
      diagramType = 'graph TD';
    } else if (diagramType === 'erDiagram' && !hasExplicitEr) {
      logger.warn('[FormatAgent] Override: erDiagram forbidden without explicit database/ER trigger words. Forcing graph TD.');
      diagramType = 'graph TD';
    }

    // Normalize format
    const validTypes = ['graph TD', 'graph LR', 'erDiagram', 'sequenceDiagram', 'C4Context', 'C4Container'];
    const finalType = validTypes.includes(diagramType) ? diagramType : 'graph TD';

    logger.log(`[FormatAgent] Parsed diagramType: ${finalType}`);
    return {
      format: 'mermaid',
      diagramType: finalType as any,
      optionalVariants: res.optionalVariants || [],
    };
  } catch (err) {
    logger.error('[FormatAgent] Failed, using defaults:', err);
    return { format: 'mermaid', diagramType: 'graph TD', optionalVariants: [] };
  }
}

// Agent 1B — STYLE AGENT
export async function runStyleAgent(prompt: string, model?: string): Promise<StyleConfig> {
  const systemPrompt = `You are the Style Agent in a diagram pipeline.
Analyze the user prompt to extract visual styling instructions, color palettes, fonts, or themes.
We support named themes: "forest-green", "slate", "dark-minimal", "luxury", or "default".
If the prompt specifies colors directly, capture them. Otherwise, map the requested visual identity to one of the named themes.
You MUST output a valid JSON object matching this schema:
{
  "primaryColor": "hex code",
  "secondaryColor": "hex code",
  "background": "hex code",
  "fontFamily": "font name string",
  "theme": "forest-green" | "slate" | "dark-minimal" | "luxury" | "default"
}
Output JSON ONLY. No markdown, no wrapping in code blocks, no prose.`;

  try {
    const res = await callAgent<StyleConfig>(systemPrompt, prompt, model);
    const themeName = res.theme || 'default';
    const palette = THEME_PALETTES[themeName] || THEME_PALETTES.default;
    
    const primaryColor = isValidHexColor(res.primaryColor) ? res.primaryColor : palette.primaryColor;
    const secondaryColor = isValidHexColor(res.secondaryColor) ? res.secondaryColor : palette.secondaryColor;
    const background = isValidHexColor(res.background) ? res.background : palette.background;
    const fontFamily = res.fontFamily || palette.fontFamily;

    const styleConfig: StyleConfig = {
      primaryColor,
      secondaryColor,
      background,
      backgroundColor: background,
      fontFamily,
      theme: themeName,
      nodeTypeStyles: {
        client: primaryColor,
        edge: secondaryColor,
        gateway: secondaryColor,
        application: secondaryColor,
        data: '#1e293b',
        queue: '#1e293b',
        observability: '#475569',
        external: '#64748b',
      },
    };

    logger.log(`[StyleAgent] StyleConfig resolved successfully. Theme: ${themeName}`);
    return styleConfig;
  } catch (err) {
    logger.error('[StyleAgent] Failed, using defaults:', err);
    const palette = THEME_PALETTES.default;
    return {
      primaryColor: palette.primaryColor,
      secondaryColor: palette.secondaryColor,
      background: palette.background,
      backgroundColor: palette.background,
      fontFamily: palette.fontFamily,
      theme: 'default',
      nodeTypeStyles: {
        client: palette.primaryColor,
        edge: palette.secondaryColor,
        gateway: palette.secondaryColor,
        application: palette.secondaryColor,
        data: '#1e293b',
        queue: '#1e293b',
        observability: '#475569',
        external: '#64748b',
      },
    };
  }
}

// Agent 1C — INVENTORY AGENT
export async function runInventoryAgent(
  prompt: string,
  diagramSize: 'small' | 'medium' | 'large' = 'medium',
  model?: string
): Promise<InventoryConfig> {
  const sizeInstructions = `TARGET SIZE: Focus strictly on the components explicitly requested or directly necessary to describe the system/component in the prompt. Do NOT add unnecessary external components (e.g., do NOT add databases, caches, API gateways, CDNs, or authentication services unless they are explicitly mentioned or directly required for the core function of the requested component/system).
- If the user has given a simple prompt or is describing/asking about a specific component (e.g. "Load Balancer", "Database"), focus ONLY on describing the core idea of that component (e.g. for a Load Balancer, show a request coming in from the client and distributing to multiple servers — do not add databases, caches, or API gateways).
- Do NOT enhance the user's prompt. Keep things very simple. Only if the user is asking for a complex system and has explicitly shared/mentioned a lot of components, then only include them. Otherwise, deliver exactly what the user requested.`;

  const systemPrompt = `You are the Inventory Agent in a diagram pipeline.
Your job is to identify and enumerate EVERY named component, service, user/actor, database, cache, queue, microservice, or logical layer described or implied in the prompt.

${sizeInstructions}

If the prompt describes or implies a load balancing pool or multiple servers, you MUST explicitly output individual server nodes (e.g., "Server 1", "Server 2", "Server 3" or similar replica names) so the load balancer can route to them.

CRITICAL INSTRUCTIONS:
- Deliver EXACTLY what the user requested. If the prompt is simple, the diagram must be simple.
- Do NOT automatically add databases, caches, CDNs, API gateways, queues, or other systems unless they are explicitly asked for.
- Do NOT apply any automatic domain completion rules (e.g. do not add recommendation engines, search indexes, transcoding pipelines, etc. unless explicitly asked).

Also, identify the subgraphs/logical group containers (e.g. "Client Container", "Application Server", "Database Cluster") that these components belong in.
You MUST output a valid JSON object matching this schema:
{
  "nodes": ["Node A", "Node B", ...],
  "groups": ["Group A", "Group B", ...],
  "nodeCount": number
}
Output JSON ONLY. No markdown, no wrapping in code blocks, no prose.`;

  const res = await callAgent<InventoryConfig>(systemPrompt, prompt, model);
  
  // Clean nodes and groups: remove duplicates and empty values, handling objects/other types gracefully
  const uniqueNodes = Array.from(
    new Set(
      (res.nodes || [])
        .map((n: any) => {
          if (typeof n === 'string') return n.trim();
          if (n && typeof n === 'object') {
            const val = (n as any).name || (n as any).label || (n as any).id || JSON.stringify(n);
            return String(val).trim();
          }
          return String(n || '').trim();
        })
        .filter(Boolean)
    )
  );
  const uniqueGroups = Array.from(
    new Set(
      (res.groups || [])
        .map((g: any) => {
          if (typeof g === 'string') return g.trim();
          if (g && typeof g === 'object') {
            const val = (g as any).name || (g as any).label || (g as any).id || JSON.stringify(g);
            return String(val).trim();
          }
          return String(g || '').trim();
        })
        .filter(Boolean)
    )
  );

  return {
    nodes: uniqueNodes,
    groups: uniqueGroups,
    nodeCount: uniqueNodes.length,
  };
}

// Agent 1D — EDGE AGENT
export async function runEdgeAgent(
  prompt: string,
  diagramSize: 'small' | 'medium' | 'large' = 'medium',
  model?: string
): Promise<EdgeConfig> {
  const sizeInstructions = {
    small: 'TARGET SIZE: Connect only the 5-7 core nodes. Keep flow lines clean and consolidated.',
    medium: 'TARGET SIZE: Connect the 8-12 nodes. Focus on main request/response flows.',
    large: 'TARGET SIZE: Connect the 13-20 nodes. Include detailed internal flows, background jobs, and secondary paths.'
  }[diagramSize];

  const systemPrompt = `You are the Edge Agent in a diagram pipeline.
Identify every explicit and implied relationship, request flow, or connection in the prompt.
For each edge, determine a short, action-oriented label (e.g., "submit ticket", "reads user profile").
Avoid generic labels like "connects", "calls", "sends".

${sizeInstructions}

CRITICAL ROUTING & TOPOLOGY RULES:
1. **Flow Direction (Left to Right / Forward Only)**: Edges must only flow forward through tiers: Client -> API Gateway/Load Balancer -> Business Microservices -> Database/Cache/Queue.
2. **Client is a Source, not a Sink**: Client nodes must never receive incoming connections from backend business services. No arrows can point back to client nodes.
3. **No Gateway Bypass**: Clients must NEVER connect directly to internal microservices, databases, or analytics/observability services (e.g. Analytics Service). All client requests must route through the API Gateway or Load Balancer first.
4. **Auth Routing**: The Auth Service receives arrows ONLY from login, registration, or token-refresh endpoints. No business microservices should connect to the Auth Service on the happy path.
5. **CDN Origin**: A CDN node must always pull data from an Object Storage origin (e.g., "Object Storage -> CDN").
6. **No client bypass for security**: Security/DRM/License services must never connect directly to client-tier nodes. All such requests must route through the API Gateway first.
7. **Replica Load Balancing**: If there are replica servers (e.g. Server 1, Server 2, Server 3), the Load Balancer/Gateway MUST have independent outgoing edges to EACH replica server. Do NOT connect only to one server.
8. **No Horizontal Replica Chaining**: Do NOT create horizontal connections between replica servers in a pool (e.g., "Server 1 -> Server 2" is incorrect). Replica servers must be independent and connect to the database/caves/queues individually.

You MUST output a valid JSON object matching this schema:
{
  "edges": [
    { "from": "sourceNodeName", "to": "targetNodeName", "label": "action description" }
  ]
}
Output JSON ONLY. No markdown, no wrapping in code blocks, no prose.`;

  const res = await callAgent<EdgeConfig>(systemPrompt, prompt, model);
  const cleanedEdges = (res.edges || [])
    .filter(e => e.from && e.to)
    .map(e => ({
      ...e,
      from: e.from.trim(),
      to: e.to.trim(),
    }))
    .filter(e => e.from.toLowerCase() !== e.to.toLowerCase());
  return {
    edges: cleanedEdges,
    edgeCount: cleanedEdges.length,
  };
}

// Agent 1E — GROUP AGENT (A5)
export async function runGroupAgent(
  nodes: string[],
  groups: string[],
  prompt: string,
  model?: string
): Promise<Record<string, string>> {
  const systemPrompt = `You are the Group Agent in a diagram pipeline.
Your job is to assign EVERY node in the inventory to exactly one of the groups.
You MUST output a valid JSON object where keys are the exact node names from the inventory, and values are the group names.
Format:
{
  "Node Name A": "Group Name A",
  "Node Name B": "Group Name B"
}
Output JSON ONLY. No markdown, no wrapping in code blocks, no prose.`;

  const userPrompt = `Nodes:\n${nodes.map(n => `- "${n}"`).join('\n')}\n\nGroups:\n${groups.map(g => `- "${g}"`).join('\n')}\n\nUser Prompt: ${prompt}`;

  try {
    const res = await callAgent<Record<string, string>>(systemPrompt, userPrompt, model);
    const assignments: Record<string, string> = {};
    for (const node of nodes) {
      const assignedGroup = res[node];
      if (assignedGroup && groups.includes(assignedGroup)) {
        assignments[node] = assignedGroup;
      } else {
        assignments[node] = groups[0];
      }
    }
    return assignments;
  } catch (err) {
    logger.error('[GroupAgent] Failed to assign groups, using fallback:', err);
    const assignments: Record<string, string> = {};
    for (const node of nodes) {
      assignments[node] = groups[0];
    }
    return assignments;
  }
}

// Node name keyword sanitization (A2.8)
const RESERVED_KEYWORDS = new Set([
  'end', 'subgraph', 'graph', 'flowchart', 'style', 'classdef', 'click', 'linkstyle', 'direction'
]);

function sanitizeNodeName(name: string): string {
  const nameTrim = name.trim();
  const lower = nameTrim.toLowerCase();
  if (RESERVED_KEYWORDS.has(lower)) {
    if (lower === 'end') return 'End Node';
    if (lower === 'subgraph') return 'Subgraph Container';
    if (lower === 'graph') return 'Graph Service';
    if (lower === 'flowchart') return 'Flowchart Service';
    if (lower === 'style') return 'Style Node';
    if (lower === 'classdef') return 'Class Definition Node';
    if (lower === 'click') return 'Click Event Handler';
    if (lower === 'linkstyle') return 'Link Style Node';
    if (lower === 'direction') return 'Direction Specifier';
    return `${nameTrim} Service`;
  }
  return nameTrim;
}

// Group name sanitization (A5.4)
function sanitizeGroupName(name: string): string {
  return name.replace(/[\[\](){}|"']/g, ' ').replace(/\s+/g, ' ').trim();
}

interface PregenEdge {
  from: string;
  to: string;
  label: string;
  bidirectional: boolean;
}

function ensureNoOrphanEdges(
  nodes: string[],
  edges: PregenEdge[]
): PregenEdge[] {
  const isClient = (name: string) => /client|mobile|web.?app|browser|ios|android/i.test(name);
  const isGateway = (name: string) => /gateway|load.?balancer|cdn|proxy|ingress|nginx|kong/i.test(name);
  const dataKeywords = ['db', 'database', 'sql', 'mongo', 'redis', 'cache', 's3', 'bucket', 'storage', 'queue', 'kafka', 'rabbit'];
  const isData = (name: string) => dataKeywords.some(k => name.toLowerCase().includes(k));

  const finalEdges = [...edges];
  const connectedNodes = new Set<string>();
  for (const edge of finalEdges) {
    connectedNodes.add(edge.from);
    connectedNodes.add(edge.to);
  }

  const orphans = nodes.filter(n => !connectedNodes.has(n));
  if (orphans.length === 0) return finalEdges;

  logger.warn(`[Stage 1 Alignment] Found ${orphans.length} orphan nodes: ${orphans.join(', ')}. Connecting them to prevent validation deadlocks.`);

  // Find hubs in connected nodes
  const clientHubs = nodes.filter(n => connectedNodes.has(n) && isClient(n));
  const gatewayHubs = nodes.filter(n => connectedNodes.has(n) && isGateway(n));
  const dataHubs = nodes.filter(n => connectedNodes.has(n) && isData(n));
  const computeHubs = nodes.filter(n => connectedNodes.has(n) && !isClient(n) && !isGateway(n) && !isData(n));

  // Helper to add edge if not exists and avoid self-loop
  const addEdge = (from: string, to: string, label: string) => {
    if (from.toLowerCase() === to.toLowerCase()) return;
    const exists = finalEdges.some(e => e.from.toLowerCase() === from.toLowerCase() && e.to.toLowerCase() === to.toLowerCase());
    if (!exists) {
      finalEdges.push({ from, to, label, bidirectional: false });
      logger.log(`[Stage 1 Alignment] Added edge for orphan node: "${from}" -> "${to}" (${label})`);
    }
  };

  for (const o of orphans) {
    if (isClient(o)) {
      // 1. Client Orphan: Client must connect OUTWARD.
      // Prefer connecting Client -> Gateway or Client -> Compute
      const target = gatewayHubs[0] || computeHubs[0] || nodes.find(n => isGateway(n)) || nodes.find(n => !isClient(n)) || null;
      if (target) {
        addEdge(o, target, 'sends requests');
      }
    } else if (isData(o)) {
      // 2. Data Orphan: Data must receive connections INWARD.
      // Prefer connecting Compute -> Data or Gateway -> Data
      const source = computeHubs[0] || gatewayHubs[0] || nodes.find(n => !isClient(n) && !isData(n)) || null;
      if (source) {
        addEdge(source, o, 'reads / writes');
      }
    } else if (isGateway(o)) {
      // 3. Gateway Orphan: Gateway must receive connections from Client, and route to Compute.
      // Ensure Client -> Gateway exists if any client exists
      const client = clientHubs[0] || nodes.find(isClient) || null;
      if (client) {
        addEdge(client, o, 'sends requests');
      }
      // Ensure Gateway -> Compute exists if any compute exists
      const compute = computeHubs[0] || nodes.find(n => !isClient(n) && !isGateway(n) && !isData(n)) || null;
      if (compute) {
        addEdge(o, compute, 'routes request');
      }
      // If no client and no compute exist, connect to any other node
      if (!client && !compute) {
        const other = nodes.find(n => n !== o) || null;
        if (other) {
          addEdge(o, other, 'routes request');
        }
      }
    } else {
      // 4. Compute/Other Orphan:
      // Prefer connecting Gateway -> Compute or Client -> Compute (if no gateway)
      const source = gatewayHubs[0] || clientHubs[0] || nodes.find(isGateway) || nodes.find(isClient) || null;
      if (source) {
        addEdge(source, o, isGateway(source) ? 'routes request' : 'sends requests');
      } else {
        // Fallback: connect from any non-data node
        const nonData = nodes.find(n => n !== o && !isData(n)) || null;
        if (nonData) {
          addEdge(nonData, o, 'interacts');
        }
      }
    }
  }

  return finalEdges;
}

export function sanitizeAndAlignEdges(
  nodes: string[],
  edges: PregenEdge[]
): PregenEdge[] {
  const isClient = (name: string) => /client|mobile|web.?app|browser|ios|android/i.test(name);
  const isGateway = (name: string) => /gateway|load.?balancer|cdn|proxy|ingress|nginx|kong/i.test(name);
  const isServerReplica = (name: string) => /server\s*[a-z0-9]|replica\s*[a-z0-9]|instance\s*[a-z0-9]/i.test(name);
  const dataKeywords = ['db', 'database', 'sql', 'mongo', 'redis', 'cache', 's3', 'bucket', 'storage', 'queue', 'kafka', 'rabbit'];
  const isData = (name: string) => dataKeywords.some(k => name.toLowerCase().includes(k));

  const resultEdges: PregenEdge[] = [];

  // Helper to check if an edge exists
  const edgeExists = (from: string, to: string) => {
    return resultEdges.some(e => e.from.toLowerCase() === from.toLowerCase() && e.to.toLowerCase() === to.toLowerCase());
  };

  // Helper to add edge
  const addEdge = (from: string, to: string, label: string) => {
    if (from.toLowerCase() === to.toLowerCase()) return;
    if (!edgeExists(from, to)) {
      resultEdges.push({ from, to, label, bidirectional: false });
      logger.log(`[Stage 1 Sanitization] Added edge: "${from}" -> "${to}" (${label})`);
    }
  };

  // Find node classifications
  const gatewayNodes = nodes.filter(isGateway);
  const replicaNodes = nodes.filter(isServerReplica);
  const computeNodes = nodes.filter(n => !isClient(n) && !isGateway(n) && !isData(n));

  // Determine active entry/dispatch gateways
  const isOuterGatewayName = (name: string) => /cdn|load.?balancer|lb/i.test(name);
  const isInnerGatewayName = (name: string) => /gateway|api|kong|proxy|nginx|ingress/i.test(name);

  const outerGateways = gatewayNodes.filter(isOuterGatewayName);
  const innerGateways = gatewayNodes.filter(n => isInnerGatewayName(n) && !isOuterGatewayName(n));

  const entryGateway = outerGateways[0] || innerGateways[0] || gatewayNodes[0] || null;
  const dispatchGateway = innerGateways[0] || outerGateways[0] || gatewayNodes[0] || null;

  // First pass: Process existing edges
  for (const e of edges) {
    const isToClient = isClient(e.to);
    const isFromClient = isClient(e.from);

    // 1. Fix Reverse Client Flow (C9)
    if (isToClient && !isFromClient) {
      if (isGateway(e.from)) {
        const hasForward = edges.some(fe => fe.from.toLowerCase() === e.to.toLowerCase() && fe.to.toLowerCase() === e.from.toLowerCase());
        if (!hasForward) {
          addEdge(e.to, e.from, e.label || 'sends requests');
        }
      }
      logger.warn(`[Stage 1 Sanitization] Deleting reverse edge pointing to client: "${e.from}" -> "${e.to}"`);
      continue;
    }

    // 2. Fix Gateway Bypass (C8)
    if (entryGateway && dispatchGateway && isFromClient && !isClient(e.to) && !isGateway(e.to)) {
      logger.warn(`[Stage 1 Sanitization] Resolving gateway bypass: "${e.from}" -> "${e.to}" via "${entryGateway}" and "${dispatchGateway}"`);
      
      addEdge(e.from, entryGateway, e.label || 'sends requests');
      addEdge(dispatchGateway, e.to, 'routes request');
      continue;
    }

    // 3. Fix Replica Chaining (C11)
    if (isServerReplica(e.from) && isServerReplica(e.to)) {
      logger.warn(`[Stage 1 Sanitization] Deleting horizontal replica chaining edge: "${e.from}" -> "${e.to}"`);
      continue;
    }

    addEdge(e.from, e.to, e.label);
  }

  // 4. Ensure outer -> inner gateway connection if both exist
  if (entryGateway && dispatchGateway && entryGateway !== dispatchGateway) {
    addEdge(entryGateway, dispatchGateway, 'routes request');
  }

  // 5. Ensure Gateway routes to all backend replica servers (C11 Load Balancing)
  if (dispatchGateway && replicaNodes.length > 0) {
    for (const replica of replicaNodes) {
      addEdge(dispatchGateway, replica, 'routes request');
    }
  }

  // 6. Ensure replicas have independent downstream database/cache/queue connections
  if (replicaNodes.length > 0) {
    const replicaTargets = new Map<string, string>();
    for (const e of resultEdges) {
      if (isServerReplica(e.from)) {
        replicaTargets.set(e.to, e.label);
      }
    }

    for (const replica of replicaNodes) {
      for (const [target, label] of replicaTargets.entries()) {
        addEdge(replica, target, label);
      }
    }
  }

  // 7. Fix Disconnected Gateway (C10)
  if (dispatchGateway) {
    const hasOutgoing = resultEdges.some(e => e.from.toLowerCase() === dispatchGateway.toLowerCase() && (!isClient(e.to) || isGateway(e.to)));
    if (!hasOutgoing) {
      logger.warn(`[Stage 1 Sanitization] Disconnected gateway "${dispatchGateway}" detected. Adding outgoing edges.`);
      if (computeNodes.length > 0) {
        for (const compNode of computeNodes) {
          addEdge(dispatchGateway, compNode, 'routes request');
        }
      } else {
        const fallbacks = nodes.filter(n => !isClient(n) && !isGateway(n));
        if (fallbacks.length > 0) {
          addEdge(dispatchGateway, fallbacks[0], 'routes request');
        }
      }
    }
  }

  return resultEdges;
}

function getMaxNodesForSize(size: 'small' | 'medium' | 'large'): number {
  if (size === 'small') return 7;
  if (size === 'medium') return 12;
  return ABSOLUTE_MAX_NODES; // large = 20
}

function getMaxGroupsForNodeCount(count: number): number {
  if (count <= 10) return 3;
  if (count <= 12) return 4;
  return 5;
}

// Parallel runner with strict alignment & self-correcting checks
export async function runStage1PreGeneration(
  prompt: string,
  diagramSize: 'small' | 'medium' | 'large' = 'medium',
  model?: string
): Promise<{
  formatConfig: FormatConfig;
  styleConfig: StyleConfig;
  inventoryConfig: InventoryConfig;
  edgeConfig: EdgeConfig;
  groupAssignments: Record<string, string>;
}> {
  logger.log('[Stage 1] Running Pre-Generation Agents in parallel...');
  
  const [formatConfig, styleConfig, inventoryConfig, edgeConfigResult] = await Promise.all([
    runFormatAgent(prompt, model),
    runStyleAgent(prompt, model),
    runInventoryAgent(prompt, diagramSize, model),
    runEdgeAgent(prompt, diagramSize, model),
  ]);
  const edgeConfig = edgeConfigResult;

  // Sanitize group names (A5.4)
  inventoryConfig.groups = inventoryConfig.groups.map(sanitizeGroupName).filter(Boolean);

  // Sanitize node names (A2.8)
  inventoryConfig.nodes = inventoryConfig.nodes.map(sanitizeNodeName).filter(Boolean);

  // Node count capping per diagram size (A2.6)
  const maxNodes = getMaxNodesForSize(diagramSize);
  if (inventoryConfig.nodes.length > maxNodes) {
    logger.warn(`[InventoryAgent] nodeCount ${inventoryConfig.nodes.length} exceeds max ${maxNodes} for size "${diagramSize}". Capping to first ${maxNodes} nodes.`);
    inventoryConfig.nodes = inventoryConfig.nodes.slice(0, maxNodes);
    if (maxNodes >= ABSOLUTE_MAX_NODES) {
      inventoryConfig.splitMode = true;
    }
  }
  inventoryConfig.nodeCount = inventoryConfig.nodes.length;

  // Checklist A5: Group count is at minimum 2 for any diagram with more than 4 nodes
  if (inventoryConfig.nodeCount > 4 && inventoryConfig.groups.length < 2) {
    logger.warn(`[Stage 1] Group count is too low (${inventoryConfig.groups.length}) for diagram size. Adding default groups.`);
    const extraGroups = ['Frontend Client Tier', 'Backend Core Services', 'Data Storage Layer'];
    inventoryConfig.groups = Array.from(new Set([...inventoryConfig.groups, ...extraGroups])).map(sanitizeGroupName);
  }

  // Ensure groups is not empty
  if (inventoryConfig.groups.length === 0) {
    inventoryConfig.groups = ['Presentation Client Layer', 'Application Compute Tier'].map(sanitizeGroupName);
  }

  // Group count capping based on diagram size
  const groupCap = getMaxGroupsForNodeCount(inventoryConfig.nodeCount);
  if (inventoryConfig.groups.length > groupCap) {
    const origCount = inventoryConfig.groups.length;
    inventoryConfig.groups = inventoryConfig.groups.slice(0, groupCap);
    logger.warn(`[Stage 1] Group count capped. Original: ${origCount}, Capped: ${groupCap} for nodeCount ${inventoryConfig.nodeCount}`);
  }

  // Fix 3: Sanitize edges — block self-loops with explicit logging (normalized comparison) (A3.7)
  function sanitizeEdges(edges: Array<{ from: string; to: string; label: string; bidirectional: boolean }>) {
    const selfLoops = edges.filter(e => {
      const fromNorm = (e.from || '').trim().toLowerCase();
      const toNorm = (e.to || '').trim().toLowerCase();
      return fromNorm && toNorm && fromNorm === toNorm;
    });
    if (selfLoops.length > 0) {
      logger.warn(`[Stage 1] Removing ${selfLoops.length} self-loop edges: ${selfLoops.map(e => `"${e.from}" -> "${e.to}"`).join(', ')}`);
    }
    return edges.filter(e => {
      const fromNorm = (e.from || '').trim().toLowerCase();
      const toNorm = (e.to || '').trim().toLowerCase();
      return fromNorm !== toNorm;
    });
  }

  // Checklist A3: Alignment & self-loops check
  let processedEdges = sanitizeEdges(
    edgeConfig.edges
      .map(e => ({
        from: e.from ? sanitizeNodeName(e.from.trim()) : '',
        to: e.to ? sanitizeNodeName(e.to.trim()) : '',
        label: e.label ? e.label.trim() : '',
        bidirectional: false,
      }))
      .filter(e => e.from && e.to)
  );

  // Ensure every source and target value matches an entry in the inventory nodes array
  // If we can't find a matching inventory node, we align it or append it to inventory nodes
  const alignedNodes = new Set(inventoryConfig.nodes);
  
  processedEdges = processedEdges.map(e => {
    let alignedFrom = e.from;
    let alignedTo = e.to;

    // Helper to find closest case-insensitive match (prioritizing exact matches to prevent collisions)
    const findMatch = (name: string) => {
      const clean = name.toLowerCase().trim();
      
      // Pass 1: Exact matches
      for (const node of alignedNodes) {
        const nodeClean = node.toLowerCase().trim();
        if (nodeClean === clean) {
          return node;
        }
      }
      
      // Pass 2: Loose matches (substrings)
      for (const node of alignedNodes) {
        const nodeClean = node.toLowerCase().trim();
        if (nodeClean.includes(clean) || clean.includes(nodeClean)) {
          return node;
        }
      }
      
      return null;
    };

    const matchFrom = findMatch(e.from);
    if (matchFrom) {
      alignedFrom = matchFrom;
    } else {
      alignedNodes.add(e.from);
    }

    const matchTo = findMatch(e.to);
    if (matchTo) {
      alignedTo = matchTo;
    } else {
      alignedNodes.add(e.to);
    }

    return {
      ...e,
      from: alignedFrom,
      to: alignedTo,
    };
  }).filter(e => e.from.toLowerCase().trim() !== e.to.toLowerCase().trim()); // Filter out any self-loops created during alignment

  // Node count capping again after potential node alignment (A2.6)
  const finalNodes = Array.from(alignedNodes);
  const maxNodesFinal = getMaxNodesForSize(diagramSize);
  if (finalNodes.length > maxNodesFinal) {
    logger.warn(`[InventoryAgent] finalNodes count ${finalNodes.length} exceeds max ${maxNodesFinal} for size "${diagramSize}". Capping to first ${maxNodesFinal}.`);
    inventoryConfig.nodes = finalNodes.slice(0, maxNodesFinal);
    if (maxNodesFinal >= ABSOLUTE_MAX_NODES) {
      inventoryConfig.splitMode = true;
    }
  } else {
    inventoryConfig.nodes = finalNodes;
  }
  inventoryConfig.nodeCount = inventoryConfig.nodes.length;

  // Filter edges to only include capped nodes, programmatically sanitize/align them, and connect any orphan nodes
  const nodesSet = new Set(inventoryConfig.nodes);
  const initialFiltered = processedEdges.filter(e => nodesSet.has(e.from) && nodesSet.has(e.to));
  const sanitizedEdges = sanitizeAndAlignEdges(inventoryConfig.nodes, initialFiltered);
  const finalEdges = ensureNoOrphanEdges(inventoryConfig.nodes, sanitizedEdges);

  edgeConfig.edges = finalEdges;
  edgeConfig.edgeCount = finalEdges.length;

  // Checklist A3: CRITICAL — if edges is empty and diagram has more than 1 node, retry edge agent once
  if (edgeConfig.edges.length === 0 && inventoryConfig.nodeCount > 1) {
    logger.warn('[Stage 1] CRITICAL: Edges array is empty for multi-node diagram. Retrying edge agent...');
    const retryConfig = await runEdgeAgent(prompt);
    if (retryConfig.edges && retryConfig.edges.length > 0) {
      const retryFiltered = sanitizeEdges(
        retryConfig.edges
          .filter(e => e.from && e.to)
          .map(e => ({
            from: sanitizeNodeName(e.from.trim()),
            to: sanitizeNodeName(e.to.trim()),
            label: e.label ? e.label.trim() : '',
            bidirectional: false,
          }))
          .filter(e => nodesSet.has(e.from) && nodesSet.has(e.to))
      );
      const sanitizedRetry = sanitizeAndAlignEdges(inventoryConfig.nodes, retryFiltered);
      edgeConfig.edges = ensureNoOrphanEdges(inventoryConfig.nodes, sanitizedRetry);
      edgeConfig.edgeCount = edgeConfig.edges.length;
      logger.log(`[Stage 1] Retry successful. Generated ${edgeConfig.edges.length} edges.`);
    }
  }


  // If still empty and nodeCount > 1, throw error (A3.2 failure gate)
  if (edgeConfig.edges.length === 0 && inventoryConfig.nodeCount > 1) {
    throw new Error('Stage 1 failed: Edges array is empty for multi-node diagram after retry');
  }

  // Run the Group Agent (A5)
  const groupAssignments = await runGroupAgent(inventoryConfig.nodes, inventoryConfig.groups, prompt, model);

  // Fix data nodes wrongly placed in client groups (e.g. "Database" in "Client Container")
  const isDataNode = (name: string) => /db|database|sql|mongo|redis|cache|s3|bucket|storage|queue|kafka|rabbit/i.test(name);
  const isClientGroup = (name: string) => /client|mobile|web.?app|browser|ios|android/i.test(name);
  const isDataGroup = (name: string) => /data|db|storage|persistence|database|cluster|pool/i.test(name);
  for (const [node, group] of Object.entries(groupAssignments)) {
    if (isDataNode(node) && isClientGroup(group)) {
      const dataGroup = inventoryConfig.groups.find(g => isDataGroup(g)) || inventoryConfig.groups.at(-1);
      if (dataGroup && dataGroup !== group) {
        groupAssignments[node] = dataGroup;
        logger.log(`[Stage 1] Reassigned "${node}" from "${group}" to "${dataGroup}" (data node in client group)`);
      }
    }
  }

  logger.log('[Stage 1] Pre-Generation Agents complete & aligned:', {
    diagramType: formatConfig.diagramType,
    theme: styleConfig.theme,
    nodeCount: inventoryConfig.nodeCount,
    edgeCount: edgeConfig.edges.length,
    groupAssignments,
  });

  return {
    formatConfig,
    styleConfig,
    inventoryConfig,
    edgeConfig,
    groupAssignments,
  };
}
