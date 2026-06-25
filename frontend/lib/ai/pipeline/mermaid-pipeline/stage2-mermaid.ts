import { apiKeyManager } from '../../utils/apiKeyManager';
import logger from '@/lib/logger';
import type { FormatConfig, InventoryConfig, EdgeConfig } from './stage1-pregen';
import { parseMermaid, normalizeEdgeReferences } from './mermaidParser';

function buildNodeGenerationPrompt(
  formatConfig: FormatConfig,
  inventoryConfig: InventoryConfig,
  groupAssignments: Record<string, string>,
  diagramSize: 'small' | 'medium' | 'large' = 'medium',
  repairInstructions?: string
): string {
  const sizeGuide: Record<string, string> = {
    small: 'Keep the diagram concise and focused — aim for clean grouping with exactly the listed nodes (5-7 nodes). Ensure every node is represented correctly and no database/storage nodes are missing cylinder styling.',
    medium: 'Standard architecture diagram with balanced detail (8-12 nodes). Focus on main services, caches, queues, and databases.',
    large: 'Detailed system diagram — include all listed nodes (13-20 nodes) with comprehensive grouping, caching, and workers.',
  };

  const referenceExample = `  subgraph Client["Client Tier"]
    MobileApp["Spotify Mobile App"]
    WebApp["Spotify Web App"]
  end
  subgraph Edge["Edge / Gateway Tier"]
    LoadBalancer["Load Balancer"]
    APIGateway["API Gateway"]
  end
  subgraph Compute["Compute Tier"]
    AuthService["Auth & Session Service"]
    PlaybackService["Playback Orchestrator"]
    PlaylistService["Playlist Microservice"]
  end
  subgraph Data["Data Tier"]
    UserDatabase[("User & Playlist DB")]
    MusicStore[("Music Object Storage")]
  end`;

  let prompt = `You are a Mermaid Node Generator.
Your job is to generate ONLY the node declarations and subgraph blocks for a Mermaid diagram.
Do NOT write any edges. Output only node and subgraph syntax.

DIAGRAM SIZE: ${diagramSize} (${sizeGuide[diagramSize]})
DIAGRAM TYPE: ${formatConfig.diagramType} (e.g. graph TD)

GROUPS (subgraphs) — Every node MUST be placed inside exactly one of these subgraphs:
${inventoryConfig.groups.map(g => `  - "${g}"`).join('\n')}

NODES — Every node MUST appear exactly once, nested inside a subgraph:
${inventoryConfig.nodes.map(n => `  - "${n}"`).join('\n')}

GROUP ASSIGNMENTS (Node Name -> Group Name mapping):
${Object.entries(groupAssignments).map(([node, group]) => `  - "${node}" MUST be inside group "${group}"`).join('\n')}

═══ HIGH-FIDELITY REFERENCE EXAMPLE (NODE DECLARATIONS) ═══
Use this example to understand the level of structural hierarchy and syntax styling expected of you:
graph TD
${referenceExample}

CRITICAL RULES:
1. YOU MUST DECLARE EVERY GROUP AS A SUBGRAPH. Every node MUST live inside a subgraph.
2. Subgraph syntax: subgraph ID["Group Name"] ... end
3. Node ID naming — use PascalCase of the FULL label with no spaces:
   - "Message Queue"   → ID: MessageQueue  (NOT MQ)
   - "Payment Processing" → ID: PaymentProcessing  (NOT PP)
   - "Order Database"  → ID: OrderDatabase  (NOT ODB)
   - "Client Application" → ID: ClientApplication  (NOT CA)
   NEVER use short abbreviations. The ID must be recognizable as the node it represents.
4. Node labels MUST NOT include any programming language or technology stack subtitle in brackets (e.g. do NOT append '<br>[React]', '<br>[Go]', etc. to node labels). Keep node labels clean, containing only the name of the component itself (e.g. WebApp["Spotify Web App"]).
5. Cylinder Shapes: Every database, cache, or object storage node (e.g., any node representing PostgreSQL, MySQL, Redis, MongoDB, S3, GCS, database, cache, storage, bucket, or store) MUST use cylinder syntax: e.g., NodeId[("Label")]. Do NOT include any technology/programming language subtitles inside the cylinder shape label.
6. Do NOT output any edge declarations. ONLY output node declarations and subgraph blocks.
7. Output RAW Mermaid code ONLY. No markdown code blocks, no introductory text, no JSON.
   Start output with "${formatConfig.diagramType}" on the first line.
`;

  if (repairInstructions) {
    prompt += `
════════════════════════════════════════
REPAIR INSTRUCTIONS FROM PREVIOUS RUN:
${repairInstructions}
Please correct the diagram so it satisfies all rules and incorporates these fixes!
════════════════════════════════════════
`;
  }

  return prompt;
}

function buildEdgeGenerationPrompt(
  formatConfig: FormatConfig,
  edgeConfig: EdgeConfig,
  validatedNodeIds: string[],
  lockedNodeIdMap: { label: string; id: string }[],
  diagramSize: 'small' | 'medium' | 'large' = 'medium',
  repairInstructions?: string
): string {
  // Build a direct name→ID lookup table
  const nameToIdLines = lockedNodeIdMap.map(n => `  "${n.label}" (id: ${n.id})`).join('\n');

  // Map edge config names to actual node IDs
  const nameToId = new Map(lockedNodeIdMap.map(n => [n.label.toLowerCase().trim(), n.id]));
  const resolvedEdges = edgeConfig.edges.map(e => {
    const fromId = nameToId.get(e.from.toLowerCase().trim()) || e.from;
    const toId = nameToId.get(e.to.toLowerCase().trim()) || e.to;
    return `  ${fromId} --> ${toId} (${e.label || 'no label'})`;
  }).join('\n');

  let prompt = `You are a Mermaid Edge Generator.
Your job is to generate ONLY the edge connections between already-declared nodes in a Mermaid diagram.
Do NOT write any node declarations or subgraph blocks. Output only edge lines.

DIAGRAM SIZE: ${diagramSize}
DIAGRAM TYPE: ${formatConfig.diagramType} (e.g. graph TD)

═══ NODE ID MAPPING (inventory name → exact node ID to use) ═══
${nameToIdLines}

═══ AVAILABLE NODE IDs (use these as source/target) ═══
${validatedNodeIds.map(id => `  ${id}`).join('\n')}

═══ REQUIRED CONNECTIONS (resolved to actual node IDs) ═══
${resolvedEdges}

═══ HIGH-FIDELITY REFERENCE EXAMPLE (EDGE ROUTING) ═══
Use this example to understand the flow directions, arrow styles, and labeling expected of you:
  MobileApp -->|"HTTPS GET"| CDN
  MobileApp -->|"HTTPS POST /login"| APIGateway
  WebApp -->|"HTTPS POST /login"| APIGateway
  APIGateway -->|"gRPC auth"| AuthService
  APIGateway -->|"gRPC stream"| PlaybackService
  PlaylistService -->|"SQL select/write"| UserDatabase
  PlaybackService -->|"gRPC read"| PlaylistService
  PlaybackService -->|"HTTPS GET"| MusicStore
  MusicStore -->|"Origin Pull"| CDN
  PlaybackService -.->|"publish play event"| EventBroker
  EventBroker -.->|"consume events"| AnalyticsProcessor

CRITICAL RULES:
1. Use ONLY the exact node IDs from the AVAILABLE NODE IDs list above.
   CORRECT:  UserProfileService --> PostService
   WRONG:    "User Profile Service" --> "Post Service"
   WRONG:    "UserProfileService" --> PostService
2. Do not use label text as a node reference.
3. Do not use quoted strings as node identifiers.
4. Do not declare new nodes.
5. Output ONLY edge lines — do NOT include diagram type headers, subgraph declarations, or node declarations.
6. Connection Style:
   - For synchronous requests (HTTP, REST, gRPC, direct SQL), use solid arrows \`-->\`.
   - For asynchronous, decoupled, or event-driven communication (message queues, event broker publishing/consuming, WebSockets, push notifications), use dashed arrows \`-.->\`.
7. Descriptive Protocol Labels: Every single edge connection MUST have a label specifying the protocol or action, enclosed in quotes (e.g., -->|"HTTPS REST"| or -.->|"Kafka event"|). Never leave an edge connection unlabeled.
8. Left-to-Right Flow & Forward Direction: Edges must strictly flow forward through tiers: Client -> API Gateway / Load Balancer -> Compute / Microservices -> Databases / Caches / Queues. Client nodes are sources, never sinks (no incoming arrows to Client nodes from internal backend services).
9. No Gateway Bypass: Clients must never bypass the API Gateway or Load Balancer. All client requests must route through the gateway first. Client must never connect directly to internal services, analytics servers, databases, or caches.
10. Auth Routing: The API Gateway routes auth requests (login, register, token refresh) directly to the Auth Service. For all other business operations, the Gateway validates tokens internally and routes them directly to the destination microservice. Do NOT route general API queries through the Auth Service to other microservices.
11. CDN Origins: A CDN node must pull data to an Object Storage origin (e.g., ObjectStorage -->|"Origin Pull"| CDN).
12. Replica Load Balancing: If there are replica servers (e.g., Server 1, Server 2, Server 3), the Load Balancer/Gateway MUST have independent outgoing edges to EACH replica server. Do NOT connect to only one server.
13. No Horizontal Replica Chaining: Do NOT create horizontal connections between replica servers in a pool (e.g., "Server1 --> Server2" is incorrect). Replica servers must be independent and connect to downstream databases/caches/queues individually.
14. Each line MUST follow the exact syntax:
    - Solid edge: sourceId -->|"Protocol Label"| targetId
    - Dashed edge: sourceId -.->|"Protocol Label"| targetId
15. Generate ONLY the connections specified in the 'REQUIRED CONNECTIONS' list. Do NOT invent, add, or generate any other edge connections. The final generated edge count must exactly match the number of required connections.
16. Output RAW Mermaid edge lines ONLY. No markdown code blocks.
`;

  if (repairInstructions) {
    prompt += `
════════════════════════════════════════
REPAIR INSTRUCTIONS FROM PREVIOUS RUN:
${repairInstructions}
Please correct the edges so they satisfy all rules!
════════════════════════════════════════
`;
  }

  return prompt;
}

export function extractMermaidCode(text: string): string {
  const match = text.match(/```(?:mermaid)?\s*([\s\S]*?)\s*```/i);
  if (match && match[1]) {
    return match[1].trim();
  }
  return text.trim();
}

function parseNodeIdsFromMermaid(mermaidText: string): string[] {
  const parsed = parseMermaid(mermaidText);
  return parsed.nodes.map(n => n.id);
}

function parseLockedNodeIdMap(mermaidText: string): { label: string; id: string }[] {
  const parsed = parseMermaid(mermaidText);
  const map: { label: string; id: string }[] = [];
  for (const node of parsed.nodes) {
    map.push({ label: node.label, id: node.id });
  }
  return map;
}

function mergeNodesAndEdges(nodesMermaid: string, edgesMermaid: string, diagramType: string): string {
  const nodesCleaned = nodesMermaid
    .replace(/```mermaid/gi, '')
    .replace(/```/g, '')
    .trim();

  const edgesCleaned = edgesMermaid
    .replace(/```mermaid/gi, '')
    .replace(/```/g, '')
    .trim();

  // If edges already include the diagram type header, strip it
  const edgesWithoutHeader = edgesCleaned
    .replace(new RegExp(`^${diagramType}\\s*`, 'i'), '')
    .trim();

  // Remove the diagram type header from nodes too
  const nodesWithoutHeader = nodesCleaned
    .replace(new RegExp(`^${diagramType}\\s*`, 'i'), '')
    .trim();

  // Reconstruct: diagram type header, then nodes, then edges
  const result = `${diagramType}\n${nodesWithoutHeader}\n${edgesWithoutHeader}`.trim();
  return result;
}

export async function runMermaidNodeGenerator(
  formatConfig: FormatConfig,
  inventoryConfig: InventoryConfig,
  groupAssignments: Record<string, string>,
  diagramSize: 'small' | 'medium' | 'large' = 'medium',
  repairInstructions?: string,
  model?: string
): Promise<string> {
  const prompt = buildNodeGenerationPrompt(
    formatConfig,
    inventoryConfig,
    groupAssignments,
    diagramSize,
    repairInstructions
  );

  logger.log('[Stage 2] Invoking Mermaid Node Generator Agent...');

  const result = await apiKeyManager.executeWithRetry(async (groq) => {
    const res = await groq.chat.completions.create({
      model: model || 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: `You generate Mermaid architecture diagrams. Keep it simple and correct.

Rules:
- Every node in a subgraph
- PascalCase IDs (e.g. UserService)
- No tech stack in labels (no "[React]")
- DB/cache nodes use cylinder: NodeId[("Label")]
- No edges yet` },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
    });
    return res.choices[0]?.message?.content ?? '';
  });

  const extracted = extractMermaidCode(result);
  const cleaned = extracted
    .replace(/```mermaid/gi, '')
    .replace(/```/g, '')
    .trim();

  logger.log('[Stage 2] Generated Nodes Mermaid length:', cleaned.length);
  return cleaned;
}

export async function runMermaidEdgeGenerator(
  formatConfig: FormatConfig,
  edgeConfig: EdgeConfig,
  nodesMermaid: string,
  diagramSize: 'small' | 'medium' | 'large' = 'medium',
  repairInstructions?: string,
  model?: string
): Promise<string> {
  const validatedNodeIds = parseNodeIdsFromMermaid(nodesMermaid);
  const lockedNodeIdMap = parseLockedNodeIdMap(nodesMermaid);

  const prompt = buildEdgeGenerationPrompt(
    formatConfig,
    edgeConfig,
    validatedNodeIds,
    lockedNodeIdMap,
    diagramSize,
    repairInstructions
  );

  logger.log('[Stage 2] Invoking Mermaid Edge Generator Agent...');

  const result = await apiKeyManager.executeWithRetry(async (groq) => {
    const res = await groq.chat.completions.create({
      model: model || 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: `You generate edges for Mermaid diagrams. Keep it simple and correct.

Rules:
- Solid arrows (-->) for sync (HTTP, REST, gRPC)
- Dashed arrows (-.->) for async (queues, events)
- Every edge MUST be labeled: src -->|"HTTPS"| tgt
- Flow forward: Client -> Gateway -> Services -> DB/Cache
- Client never receives incoming connections
- Only use specified node IDs exactly` },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
    });
    return res.choices[0]?.message?.content ?? '';
  });

  const extracted = extractMermaidCode(result);
  const cleaned = extracted
    .replace(/```mermaid/gi, '')
    .replace(/```/g, '')
    .trim();

  logger.log('[Stage 2] Generated Edges Mermaid length:', cleaned.length);
  return cleaned;
}

export async function runMermaidGenerator(
  formatConfig: FormatConfig,
  inventoryConfig: InventoryConfig,
  edgeConfig: EdgeConfig,
  groupAssignments: Record<string, string>,
  diagramSize: 'small' | 'medium' | 'large' = 'medium',
  repairInstructions?: string,
  model?: string
): Promise<string> {
  // PHASE 1: Generate nodes and subgraphs only
  let nodesMermaid = await runMermaidNodeGenerator(
    formatConfig,
    inventoryConfig,
    groupAssignments,
    diagramSize,
    repairInstructions,
    model
  );

  // Validate that subgraphs were generated — retry once if missing
  const parsedNodes = parseMermaid(nodesMermaid);
  if (parsedNodes.subgraphs.length === 0 && inventoryConfig.groups.length > 0) {
    logger.warn(`[Stage 2] Node generator produced 0 subgraphs (expected ${inventoryConfig.groups.length}). Retrying with stronger subgraph enforcement...`);
    const retryPrompt = `CRITICAL: The previous attempt produced NO subgraphs. You MUST wrap every node inside a subgraph block.

CORRECT FORMAT:
${formatConfig.diagramType}
  subgraph GROUP_ID["Group Name"]
    NODE_ID["Node Label\\nTechnology"]
  end
  subgraph GROUP2_ID["Another Group"]
    ANOTHER_ID["Another Node\\nTech"]
  end

Groups to use:
${inventoryConfig.groups.map(g => `  "${g}"`).join('\n')}

FAILURE TO INCLUDE SUBGRAPHS WILL CAUSE THE ENTIRE GENERATION TO FAIL.`;

    nodesMermaid = await runMermaidNodeGenerator(
      formatConfig,
      inventoryConfig,
      groupAssignments,
      diagramSize,
      retryPrompt,
      model
    );
  }

  // B13: Node count check & inner repair loop BEFORE edge generation
  let nodeRepairIteration = 0;
  while (nodeRepairIteration < 4) {
    // If inventory returned 0 nodes, trust the generator — skip repair
    if (inventoryConfig.nodeCount === 0) break;
    const reParsed = parseMermaid(nodesMermaid);
    const missingNodes: string[] = [];
    for (const invNode of inventoryConfig.nodes) {
      const matched = reParsed.nodes.some(n => {
        const invNodeClean = invNode.toLowerCase().trim();
        const labelClean = n.label.toLowerCase().trim();
        const idClean = n.id.toLowerCase().trim();
        return labelClean === invNodeClean || idClean === invNodeClean.replace(/[^a-z0-9]/gi, '').toLowerCase();
      });
      if (!matched) {
        missingNodes.push(invNode);
      }
    }

    if (reParsed.nodes.length === inventoryConfig.nodeCount && missingNodes.length === 0) {
      break;
    }

    logger.warn(`[Stage 2 Node Repair] Node count mismatch or missing nodes. Expected: ${inventoryConfig.nodeCount}, Found: ${reParsed.nodes.length}. Missing: ${missingNodes.join(', ')}. Repairing...`);
    
    const nodeRepairPrompt = `NODE_COUNT_MISMATCH: Expected ${inventoryConfig.nodeCount} nodes, found ${reParsed.nodes.length}.\n` +
      (missingNodes.length > 0 ? `MISSING NODES: The following nodes are missing: ${missingNodes.map(n => `"${n}"`).join(', ')}. Please declare them inside their respective subgraphs.` : '') +
      `\n\nEnsure all nodes in groupAssignments are declared. DO NOT output any edges.`;

    nodesMermaid = await runMermaidNodeGenerator(
      formatConfig,
      inventoryConfig,
      groupAssignments,
      diagramSize,
      nodeRepairPrompt,
      model
    );
    nodeRepairIteration++;
  }

  // PHASE 2: Generate edges only, using exact node IDs from Phase 1
  let edgesMermaid = await runMermaidEdgeGenerator(
    formatConfig,
    edgeConfig,
    nodesMermaid,
    diagramSize,
    repairInstructions,
    model
  );

  // C10: ID normalization pass before validation/merge
  const nodeIdMap = parseLockedNodeIdMap(nodesMermaid);
  const normalizedEdges = normalizeEdgeReferences(edgesMermaid, nodeIdMap);
  if (normalizedEdges !== edgesMermaid) {
    logger.log('[Stage 2] Edge label→ID normalization applied');
  }
  edgesMermaid = normalizedEdges;

  // MERGE: Combine nodes + edges into final Mermaid string
  const finalMermaid = mergeNodesAndEdges(
    nodesMermaid,
    edgesMermaid,
    formatConfig.diagramType
  );

  logger.log('[Stage 2] Final merged Mermaid length:', finalMermaid.length);
  return finalMermaid;
}
