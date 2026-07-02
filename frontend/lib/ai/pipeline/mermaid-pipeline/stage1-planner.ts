import { apiKeyManager, requestContext } from '../../utils/apiKeyManager';
import { groqJsonCompletion } from '../../utils/groqJsonCompletion';
import logger from '@/lib/logger';
import type { FormatConfig, StyleConfig, InventoryConfig, EdgeConfig } from './types';

interface PlannerOutput {
  diagramType: 'graph TD' | 'graph LR';
  theme: string;
  nodes: string[];
  groups: string[];
  nodeGroups: Record<string, string>;
  edges: Array<{ from: string; to: string; label: string }>;
}

const THEMES = ['forest-green', 'slate', 'dark-minimal', 'luxury', 'default'] as const;

// ── Node classification for programmatic validation ──

type NodeKind = 'client' | 'gateway' | 'data' | 'queue' | 'observability' | 'service';

function classifyNode(name: string): NodeKind {
  const l = name.toLowerCase();
  if (/^(user|browser|client|mobile|app|developer|end-user)/.test(l)) return 'client';
  if (/(gateway|lb|load\s*balancer|proxy|reverse\s*proxy|api\s*gateway)/.test(l)) return 'gateway';
  if (/(database|db|store|cache|storage|warehouse|s3|bucket|archive)/.test(l)) return 'data';
  if (/(queue|broker|topic|stream|channel|message\s*bus)/.test(l)) return 'queue';
  if (/(log|monitor|observability|metric|tracing|alert)/.test(l)) return 'observability';
  return 'service';
}

function inferGroup(nodeName: string): string {
  const kind = classifyNode(nodeName);
  switch (kind) {
    case 'client': return 'Client Layer';
    case 'gateway': return 'Gateway Layer';
    case 'data': return 'Data Layer';
    case 'queue': return 'Service Layer';
    case 'observability': return 'Observability Layer';
    case 'service': return 'Service Layer';
  }
}

function buildSystemPrompt(maxNodes: number): string {
  return `You are an Architecture Planner for a diagram generation system.

Your job: Given the user's description, design a complete, practical architecture diagram plan.
Stay close to what the prompt explicitly describes — do not invent application-specific details (e.g., "stores chat history") unless the prompt names that application.
Output JSON ONLY — no markdown, no code fences, no prose.

══════════════════════════════════════════════════════════
REAL-WORLD ARCHITECTURE RULES
══════════════════════════════════════════════════════════

 1. TOPOLOGY MUST BE CORRECT:
    - Client nodes (User, Browser, Mobile App) are always SOURCES, never sinks
    - Load Balancers / API Gateways route traffic to backend services
    - Services connect to databases, caches, queues — not the other way around
    - Each node must have at least one connection (no orphans)
    - Edge direction MUST match the actual flow: initiator → responder (Browser → Server, Server → Database, NOT reversed)

 2. COMPLETE FLOWS:
    - Every diagram must show a complete request/response cycle
    - Forward path example: Client → Load Balancer → Web Server → Database
    - Response path example: Database → Web Server → Client
    - The response path is the return leg of the same request/response pair — do NOT add an extra "maintains connection" edge on top of it
    - Do NOT leave backend servers disconnected (they should connect to DB/cache)

 3. GROUPING:
    - Group nodes into logical tiers: Client Layer, Gateway/LB Layer, Service Layer, Data Layer
    - Each group must contain at least one node
    - Do NOT create empty groups

 4. NODE LABELS:
    - Use clean, descriptive names: "Load Balancer", not "LB" or "load-balancer-01"
    - NO technology stack brackets: write "Auth Service" not "AuthService [Express]"
    - NO abbreviations: "Message Queue" not "MQ"

 5. EDGE LABELS:
    - Every edge label MUST describe the semantic relationship between the two nodes, not the protocol/transport
    - Examples: "routes user request", "reads/writes user data", "queues media processing task", "fetches cached response", "loads model weights for inference", "proxies API call"
    - Do NOT use protocol names: "HTTPS", "gRPC", "SQL query", "HTTP request" — instead describe what the connection does
    - Keep labels short (2-5 words), action-oriented, lowercase
    - Each label must be a SINGLE action. Do NOT join multiple actions with "/", "&", or "or"
    - Do NOT use generic labels like "connects", "sends", "calls"
    - The label must accurately reflect what the SOURCE node does. Browser/Client "sends request" or "submits form", not "routes request" (routing is the gateway's job). Gateway/LB "routes request" or "proxies request". Server "processes request" or "queries data".
    - The label should reflect the relationship from the "from" node's perspective to the "to" node

 6. PRODUCTION PATTERNS:
    - Use standard, real-world topologies (not academic/idealized ones)
    - Load Balancers are for HTTP traffic (browsers, APIs). Do NOT put LBs in front of databases, message queues, caches, or internal services that clients don't call directly.
    - Load Balancers route to server pools with individual server nodes
    - Databases have caches in front when appropriate
    - Include necessary infrastructure: databases, caches for stateful services

 7. NODE COUNT:
    - Minimum 4 nodes, maximum ${maxNodes} nodes
    - More nodes is NOT better — include only what the prompt describes or directly implies

══════════════════════════════════════════════════════════
OUTPUT SCHEMA
══════════════════════════════════════════════════════════

{
  "diagramType": "graph TD" | "graph LR",
  "theme": "forest-green" | "slate" | "dark-minimal" | "luxury" | "default",
  "nodes": ["Node Name 1", "Node Name 2", ...],
  "groups": ["Group Name 1", "Group Name 2", ...],
  "nodeGroups": {
    "Node Name 1": "Group Name 1",
    "Node Name 2": "Group Name 2"
  },
  "edges": [
    { "from": "Node Name 1", "to": "Node Name 2", "label": "routes user request" },
    { "from": "Node Name 2", "to": "Node Name 3", "label": "reads/writes data" }
  ]
}

Every node must appear in nodeGroups. Every edge from/to must reference a node in the "nodes" array. Every group must have at least one node assigned.`;
}

function getMaxNodes(size: 'small' | 'medium' | 'large'): number {
  if (size === 'small') return 7;
  if (size === 'medium') return 12;
  return 15;
}

// ── Parse repair helpers ──

function stripJsonFences(raw: string): string {
  return raw.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
}

function repairTruncatedJson(raw: string): string {
  // Fix trailing commas before } or ]
  let fixed = raw.replace(/,\s*([}\]])/g, '$1');
  // If the string ends in the middle of an object/array, close it
  const openObjects = (fixed.match(/\{/g) || []).length;
  const closeObjects = (fixed.match(/\}/g) || []).length;
  const openArrays = (fixed.match(/\[/g) || []).length;
  const closeArrays = (fixed.match(/\]/g) || []).length;
  for (let i = 0; i < openObjects - closeObjects; i++) fixed += '}';
  for (let i = 0; i < openArrays - closeArrays; i++) fixed += ']';
  return fixed;
}

// ── Topology validation ──

interface ValidationWarning {
  message: string;
}

function validateTopology(
  nodes: string[],
  edges: Array<{ from: string; to: string; label: string }>,
  groupAssignments: Record<string, string>,
): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  const nodeKinds = new Map<string, NodeKind>();
  for (const n of nodes) nodeKinds.set(n, classifyNode(n));

  const edgeSet = new Set<string>();
  for (const e of edges) {
    edgeSet.add(e.from);
    edgeSet.add(e.to);

    // Client should never be a target
    if (nodeKinds.get(e.to) === 'client') {
      warnings.push({ message: `Client node "${e.to}" is a target of "${e.from}" — clients should be sources only` });
    }

    // LB should never connect directly to data/queue nodes
    if (nodeKinds.get(e.from) === 'gateway' && (nodeKinds.get(e.to) === 'data' || nodeKinds.get(e.to) === 'queue')) {
      warnings.push({ message: `Gateway/LB "${e.from}" connects directly to "${e.to}" — LBs should only route to services, not data stores or queues` });
    }
  }

  // Orphan check
  for (const n of nodes) {
    if (!edgeSet.has(n)) {
      warnings.push({ message: `Node "${n}" has no edges (orphan)` });
    }
  }

  return warnings;
}

// ── Group inference fallback ──

function buildGroupAssignments(
  nodes: string[],
  groups: string[],
  nodeGroups: Record<string, string>,
): Record<string, string> {
  const assignments: Record<string, string> = {};
  const groupSet = new Set(groups);

  for (const node of nodes) {
    const declared = nodeGroups[node];
    if (declared && groupSet.has(declared)) {
      assignments[node] = declared;
    } else {
      assignments[node] = inferGroup(node);
    }
  }
  return assignments;
}

// ── Main function ──

export async function runArchitecturePlanner(
  prompt: string,
  diagramSize: 'small' | 'medium' | 'large' = 'medium',
  model?: string
): Promise<{ formatConfig: FormatConfig; styleConfig: StyleConfig; inventoryConfig: InventoryConfig; edgeConfig: EdgeConfig; groupAssignments: Record<string, string> }> {
  const maxNodes = getMaxNodes(diagramSize);
  const systemPrompt = buildSystemPrompt(maxNodes);

  const userPrompt = `Design a practical architecture diagram for: "${prompt}"

Size constraint: ${diagramSize} diagram (max ${maxNodes} nodes).

IMPORTANT: Edge labels must describe the semantic relationship between nodes (e.g. "sends request", "reads/writes data", "queues task"), NOT the protocol (e.g. not "HTTPS", "gRPC", "HTTP request").

Output must conform to this JSON schema:
{
  "diagramType": "graph TD" | "graph LR",
  "theme": "forest-green" | "slate" | "dark-minimal" | "luxury" | "default",
  "nodes": ["string", ...],
  "groups": ["string", ...],
  "nodeGroups": { "NodeName": "GroupName", ... },
  "edges": [{ "from": "string", "to": "string", "label": "string" }, ...]
}`;

  let resultStr: string;
  try {
    resultStr = await apiKeyManager.executeWithRetry(async (groq) => {
      return await groqJsonCompletion(groq, {
        model: model || 'llama-3.3-70b-versatile',
        reasoning_effort: 'medium',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
      });
    });
  } catch (err) {
    logger.error('[ArchitecturePlanner] LLM call failed:', err);
    throw new Error(`Architecture planner failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Parse JSON with recovery attempts
  let parsed: PlannerOutput | null = null;
  const parseAttempts = [
    () => JSON.parse(resultStr.trim()),
    () => JSON.parse(stripJsonFences(resultStr)),
    () => JSON.parse(repairTruncatedJson(resultStr)),
    () => JSON.parse(repairTruncatedJson(stripJsonFences(resultStr))),
  ];

  for (const attempt of parseAttempts) {
    try {
      parsed = attempt() as PlannerOutput;
      break;
    } catch {
      continue;
    }
  }

  if (!parsed) {
    logger.error('[ArchitecturePlanner] Failed to parse JSON response:', resultStr);
    throw new Error('Architecture planner: failed to parse JSON response');
  }

  // Validate and clean
  const nodes = (parsed.nodes || []).filter((n: unknown) => typeof n === 'string' && n.trim().length > 0);
  const groups = (parsed.groups || []).filter((g: unknown) => typeof g === 'string' && g.trim().length > 0);
  const nodeGroups = parsed.nodeGroups || {};
  const rawEdges = (parsed.edges || []).filter((e: unknown) => e && typeof e === 'object' && (e as any).from && (e as any).to);

  // Cap node count
  const cappedNodes = nodes.slice(0, maxNodes);
  const nodeSet = new Set(cappedNodes);

  // Build group assignments using name-based inference for any unmapped nodes
  const groupAssignments = buildGroupAssignments(cappedNodes, groups, nodeGroups);

  // Filter edges to only valid nodes and reject empty labels
  const validEdges = rawEdges
    .filter((e: any) => nodeSet.has(e.from) && nodeSet.has(e.to) && e.from !== e.to)
    .map((e: any) => ({ from: e.from, to: e.to, label: (e.label || '').trim(), bidirectional: false }))
    .filter((e) => e.label.length > 0);

  // Remove orphaned nodes (nodes with no edges after truncation)
  const connectedNodes = new Set<string>();
  for (const e of validEdges) {
    connectedNodes.add(e.from);
    connectedNodes.add(e.to);
  }
  const finalNodes = cappedNodes.filter(n => connectedNodes.has(n));

  // Rebuild group assignments for surviving nodes
  const finalAssignments: Record<string, string> = {};
  for (const node of finalNodes) {
    finalAssignments[node] = groupAssignments[node] || inferGroup(node);
  }

  // Ensure used group list matches actual assignments
  const usedGroupNames = new Set(Object.values(finalAssignments));
  const finalGroups = groups.filter(g => usedGroupNames.has(g));

  // If no groups are declared, create from inferred values
  if (finalGroups.length === 0 && finalNodes.length > 0) {
    for (const g of usedGroupNames) {
      finalGroups.push(g);
    }
  }

  // Ensure min 2 groups if > 4 nodes (using semantic grouping, not position-based)
  if (finalNodes.length > 4 && usedGroupNames.size < 2) {
    // Split by node kind semantics instead of array position
    const services = finalNodes.filter(n => classifyNode(n) === 'service');
    const nonServices = finalNodes.filter(n => classifyNode(n) !== 'service');
    if (services.length > 0 && nonServices.length > 0) {
      for (const n of nonServices) finalAssignments[n] = inferGroup(n);
      for (const n of services) finalAssignments[n] = inferGroup(n);
      // Ensure we reuse existing group name if possible, or add new one
      const newGroups = new Set(Object.values(finalAssignments));
      for (const g of newGroups) {
        if (!finalGroups.includes(g)) finalGroups.push(g);
      }
    }
  }

  // ── Programmatic topology validation (warnings only, no throws) ──
  const warnings = validateTopology(finalNodes, validEdges, finalAssignments);
  for (const w of warnings) {
    logger.warn('[ArchitecturePlanner] Topology warning:', w.message);
  }

  // Build configs
  const formatConfig: FormatConfig = {
    format: 'mermaid',
    diagramType: parsed.diagramType === 'graph LR' ? 'graph LR' : 'graph TD',
    optionalVariants: [],
  };

  const styleConfig: StyleConfig = {
    primaryColor: '#2563EB',
    secondaryColor: '#4F46E5',
    background: '#F9FAFB',
    backgroundColor: '#F9FAFB',
    fontFamily: 'Inter',
    theme: THEMES.includes(parsed.theme as any) ? parsed.theme : 'default',
    nodeTypeStyles: {
      client: '#2563EB',
      edge: '#4F46E5',
      gateway: '#4F46E5',
      application: '#4F46E5',
      data: '#1e293b',
      queue: '#1e293b',
      observability: '#475569',
      external: '#64748b',
    },
  };

  const inventoryConfig: InventoryConfig = {
    nodes: finalNodes,
    groups: finalGroups,
    nodeCount: finalNodes.length,
  };

  const edgeConfig: EdgeConfig = {
    edges: validEdges,
    edgeCount: validEdges.length,
  };

  logger.log('[ArchitecturePlanner] Complete plan:', {
    diagramType: formatConfig.diagramType,
    theme: styleConfig.theme,
    nodeCount: inventoryConfig.nodeCount,
    edgeCount: edgeConfig.edges.length,
    groups: finalGroups.length,
    warnings: warnings.length,
  });

  return { formatConfig, styleConfig, inventoryConfig, edgeConfig, groupAssignments: finalAssignments };
}
