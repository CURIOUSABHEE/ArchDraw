import { apiKeyManager, requestContext } from '../../utils/apiKeyManager';
import { groqJsonCompletion } from '../../utils/groqJsonCompletion';
import logger from '@/lib/logger';
import type { FormatConfig, StyleConfig, InventoryConfig, EdgeConfig } from './stage1-pregen';

interface PlannerOutput {
  diagramType: 'graph TD' | 'graph LR';
  theme: string;
  nodes: string[];
  groups: string[];
  nodeGroups: Record<string, string>;
  edges: Array<{ from: string; to: string; label: string }>;
}

const THEMES = ['forest-green', 'slate', 'dark-minimal', 'luxury', 'default'] as const;

const SYSTEM_PROMPT = `You are an Architecture Planner for a diagram generation system.

Your job: Given the user's description, design a complete, practical architecture diagram plan.
Output JSON ONLY — no markdown, no code fences, no prose.

══════════════════════════════════════════════════════════
REAL-WORLD ARCHITECTURE RULES
══════════════════════════════════════════════════════════

1. TOPOLOGY MUST BE CORRECT:
   - Client nodes (User, Browser, Mobile App) are always SOURCES, never sinks
   - Load Balancers / API Gateways route traffic to backend services
   - Services connect to databases, caches, queues — not the other way around
   - Each node must have at least one connection (no orphans)

2. COMPLETE FLOWS:
   - Every diagram must show a complete request flow from start to end
   - Example: Client → Load Balancer → Web Server → Database
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
   - Every edge MUST have a protocol/action label: "HTTPS", "gRPC", "SQL query", "reads/writes"
   - Labels are short, action-oriented: "routes request", "proxies API call"
   - Do NOT use generic labels like "connects", "sends", "calls"

6. PRODUCTION PATTERNS:
   - Use standard, real-world topologies (not academic/idealized ones)
   - Load Balancers route to server pools with individual server nodes
   - Databases have caches in front when appropriate
   - Include necessary infrastructure: databases, caches for stateful services

7. NODE COUNT:
   - Minimum 4 nodes, maximum 15 nodes
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
    { "from": "Node Name 1", "to": "Node Name 2", "label": "HTTPS" },
    { "from": "Node Name 2", "to": "Node Name 3", "label": "SQL query" }
  ]
}

Every node must appear in nodeGroups. Every edge from/to must reference a node in the "nodes" array. Every group must have at least one node assigned.`;

function getMaxNodes(size: 'small' | 'medium' | 'large'): number {
  if (size === 'small') return 7;
  if (size === 'medium') return 12;
  return 15;
}

export async function runArchitecturePlanner(
  prompt: string,
  diagramSize: 'small' | 'medium' | 'large' = 'medium',
  model?: string
): Promise<{ formatConfig: FormatConfig; styleConfig: StyleConfig; inventoryConfig: InventoryConfig; edgeConfig: EdgeConfig; groupAssignments: Record<string, string> }> {
  const maxNodes = getMaxNodes(diagramSize);

  const userPrompt = `Design a practical architecture diagram for: "${prompt}"

Size constraint: ${diagramSize} diagram (max ${maxNodes} nodes).`;

  let resultStr: string;
  try {
    resultStr = await apiKeyManager.executeWithRetry(async (groq) => {
      return await groqJsonCompletion(groq, {
        model: model || 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1,
      });
    });
  } catch (err) {
    logger.error('[ArchitecturePlanner] LLM call failed:', err);
    throw new Error(`Architecture planner failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Parse JSON with markdown fence recovery
  let parsed: PlannerOutput;
  try {
    parsed = JSON.parse(resultStr.trim()) as PlannerOutput;
  } catch {
    const stripped = resultStr.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
    try {
      parsed = JSON.parse(stripped) as PlannerOutput;
    } catch {
      logger.error('[ArchitecturePlanner] Failed to parse JSON response:', resultStr);
      throw new Error('Architecture planner: failed to parse JSON response');
    }
  }

  // Validate and clean
  const nodes = (parsed.nodes || []).filter((n: unknown) => typeof n === 'string' && n.trim().length > 0);
  const groups = (parsed.groups || []).filter((g: unknown) => typeof g === 'string' && g.trim().length > 0);
  const nodeGroups = parsed.nodeGroups || {};
  const rawEdges = (parsed.edges || []).filter((e: unknown) => e && typeof e === 'object' && (e as any).from && (e as any).to);

  // Cap node count
  const cappedNodes = nodes.slice(0, maxNodes);
  const nodeSet = new Set(cappedNodes);

  // Build group assignments: only keep assignments for valid nodes, fill defaults for missing
  const groupAssignments: Record<string, string> = {};
  for (const node of cappedNodes) {
    if (nodeGroups[node] && groups.includes(nodeGroups[node])) {
      groupAssignments[node] = nodeGroups[node];
    } else {
      groupAssignments[node] = groups[0] || 'Default Layer';
    }
  }

  // Filter edges to only valid nodes
  const validEdges = rawEdges
    .filter((e: any) => nodeSet.has(e.from) && nodeSet.has(e.to) && e.from !== e.to)
    .map((e: any) => ({ from: e.from, to: e.to, label: (e.label || '').trim(), bidirectional: false }));

  // Ensure groups has enough entries
  const usedGroups = new Set(Object.values(groupAssignments));
  if (usedGroups.size === 0 && cappedNodes.length > 0) {
    groups.push('Default Layer');
    for (const node of cappedNodes) {
      groupAssignments[node] = 'Default Layer';
    }
  }

  // Remove unused groups
  const finalGroups = groups.filter(g => usedGroups.has(g) || Object.values(groupAssignments).includes(g));

  // Ensure min 2 groups if > 4 nodes
  if (cappedNodes.length > 4 && finalGroups.length < 2) {
    const extraName = 'Core Services';
    finalGroups.push(extraName);
    // Reassign half the nodes
    const mid = Math.floor(cappedNodes.length / 2);
    for (let i = mid; i < cappedNodes.length; i++) {
      groupAssignments[cappedNodes[i]] = extraName;
    }
  }

  // Build configs in the format expected by the rest of the pipeline
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
    nodes: cappedNodes,
    groups: finalGroups,
    nodeCount: cappedNodes.length,
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
  });

  return { formatConfig, styleConfig, inventoryConfig, edgeConfig, groupAssignments };
}
