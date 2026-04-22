export const LAYER_ORDER = ['client', 'edge', 'compute', 'async', 'data', 'observe', 'external'];

export const MAX_ITERATIONS = 3;
export const SCORE_THRESHOLD = 75;

export const COMMUNICATION_STYLES: Record<string, { color: string; dash: string; animated: boolean; pathType?: string; strokeDasharray?: string; markerEnd?: string }> = {
  sync: { color: '#6366f1', dash: '', animated: false, pathType: 'Smoothstep', strokeDasharray: '', markerEnd: 'arrowclosed' },
  async: { color: '#f59e0b', dash: '8,4', animated: true, pathType: 'Smoothstep', strokeDasharray: '8,4', markerEnd: 'arrowclosed' },
  stream: { color: '#10b981', dash: '4,2', animated: true, pathType: 'Smoothstep', strokeDasharray: '4,2', markerEnd: 'arrowclosed' },
  event: { color: '#ec4899', dash: '2,3', animated: true, pathType: 'Smoothstep', strokeDasharray: '2,3', markerEnd: 'arrowclosed' },
};

export const DEFAULT_ELK_OPTIONS: Record<string, string> = {
  'elk.algorithm': 'layered',
  'elk.direction': 'RIGHT',
  'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
  'elk.spacing.nodeNode': '120',
  'elk.spacing.edgeNode': '80',
  'elk.spacing.edgeEdge': '60',
  'elk.layered.spacing.nodeNodeBetweenLayers': '250',
  'elk.layered.spacing.edgeNodeBetweenLayers': '150',
  'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
  'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
  'elk.layered.nodeSize.constraints': 'MINIMUM_SIZE',
  'elk.edgeRouting': 'ORTHOGONAL',
  'elk.portConstraints': 'FIXED_SIDE',
  'elk.padding': '[top=60, left=40, bottom=60, right=40]',
};

export const REASONING_PROMPT = `ROLE: Software architect. JSON-only. No prose.

System: {description}
Intent: {intent}

RULES:
- ALWAYS use GENERIC components (CDN, Load Balancer, API Server, Database, Cache, Queue, etc.)
- NEVER use cloud-specific services (AWS Lambda, GCP BigQuery, Azure CosmosDB, etc.)
- Name by responsibility, not technology

ANALYZE (5 steps, be concise — output feeds a diagram generator):
1. BOUNDARIES: entryPoints[], exitPoints[], trustZones[]
2. LAYERS: {ComponentName: LayerName} — Valid: Presentation|Gateway|Application|Data|Observability
3. PATTERNS: [monolith|microservices|event-driven|cqrs|circuit-breaker|saga]
4. STRESS TESTS (5 scenarios, mark safe:true/false):
   - DB down → mitigation
   - 10x traffic spike → mitigation
   - 3rd-party failure → mitigation
   - bad actor (10k req/s) → mitigation
   - job fails halfway → mitigation
5. CAP: CP or AP

OUTPUT (strict JSON, first token must be {):
{
  "systemType": "string",
  "nfrs": {"scale":"str","latency":"str","consistency":"strong|eventual","availability":"str","faultTolerance":"str"},
  "capPosition": "CP|AP",
  "actors": ["str"],
  "boundaries": {"entryPoints":["str"],"exitPoints":["str"],"trustZones":["str"]},
  "layerAssignment": {"ComponentName":"LayerName"},
  "patterns": [{"pattern":"slug","justification":"1-line"}],
  "stressTests": [{"scenario":"str","outcome":"str","safe":bool,"mitigation":"str"}],
  "keyDecisions": ["str"]
}`;

export const DIAGRAM_PROMPT = `ROLE: Diagram generator. Line-delimited JSON only.

Pre-computed reasoning: {reasoning}

CRITICAL INSTRUCTIONS:
- Generate MINIMUM 15-20 nodes representing ALL key system components
- Generate MINIMUM 12 flow paths showing data movement between components
- Each flow should show multi-step paths (3-5 nodes per path)
- Use GROUP NODES to organize related services (e.g., compute, data, auth, async groups)
- GROUP nodes: isGroup:true, groupLabel, groupColor
- CHILD nodes: parentId="parent-group-id"

ID RULES:
- All node IDs must be simple kebab-case with no prefixes
  CORRECT: "api-server", "postgres-db", "redis-cache"  
  WRONG: "as-api-server", "db-postgres", "ca-redis"
- Group node IDs must end in "-group": "services-group", "data-group"
- Child node IDs must NOT include their group's name

EDGE STYLE RULES:
- async: true ONLY for queue/event bus connections
- async: false for ALL synchronous calls (HTTP, gRPC, DB queries, cache reads)
- Default is async: false — only set async: true when the connection goes through a message queue

FLOW RULES:
- Each flow path must use exact node IDs that exist in the nodes array
- Never reference a group node in a flow — only reference leaf nodes (non-group nodes)
- Generate at least 12 distinct flows
- Flows NEVER include group IDs — only leaf node IDs

RULES:
- One JSON object per line. No arrays, no wrappers, no prose.
- NAME BY RESPONSIBILITY: "Cache" not "Redis"

GROUP NODE (one per line - acts as container):
{"id":"kebab-id","label":"Name","layer":"Layer","isGroup":true,"groupLabel":"Display Name","groupColor":"#HEX"}

CHILD NODE (one per line - inside a group):
{"id":"kebab-id","label":"Name","subtitle":"description","layer":"Layer","icon":"server","serviceType":"api","parentId":"parent-group-id"}

FLOW (after nodes - generate many):
{"type":"flow","path":["id1","id2","id3","id4"],"label":"what moves","async":bool}

First token must be {`;

export const MODEL_CONFIG = {
  reasoning: {
    primary: 'llama-3.3-70b-versatile',
    timeout: 2000,
    maxTokens: 500,
    temperature: 0.1,
  },
  diagram: {
    primary: 'llama-3.3-70b-versatile',
    timeout: 6000,
    maxTokens: 2000,
    temperature: 0.2,
  },
};

export function getComposedPrompt(
  description: string,
  intent: string = 'generic-web-app'
): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = REASONING_PROMPT
    .replace('{description}', description)
    .replace('{intent}', intent);

  return {
    systemPrompt,
    userPrompt: description,
  };
}

export const COMPONENT_AGENT_PROMPT = REASONING_PROMPT;

export const LAYOUT_AGENT_PROMPT = `You are a Layout Agent.`;
export const EDGE_AGENT_PROMPT = `You are an Edge Agent.`;
export const SCORER_PROMPT = `You are a Scorer.`;
export const VALIDATOR_PROMPT = `You are a Validator.`;
export const PLANNER_PROMPT = `You are a Planner.`;

export const COMPRESSED_REASONING_PROMPT = `ROLE: Software architect. JSON-only. No prose.

INPUT: {description}
intent: {intent}

OUTPUT:
{
  "systemType": "string",
  "patterns": ["str"],
  "keyDecisions": ["str"]
}`;

export const COMPRESSED_DIAGRAM_PROMPT = `ROLE: Diagram generator. Line-delimited JSON only.

First token must be {`;