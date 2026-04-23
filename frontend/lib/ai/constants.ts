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

OUTPUT (strict JSON). Example for "e-commerce platform":
{
  "systemType": "E-commerce Platform",
  "nfrs": {"scale":"100k req/day","latency":"200ms","consistency":"eventual","availability":"99.9%","faultTolerance":"high"},
  "capPosition": "AP",
  "actors": ["shopper","admin","3rd-party"],
  "boundaries": {"entryPoints":["Web App"],"exitPoints":["Payment Gateway","Shipping API"],"trustZones":["user-zone"]},
  "layerAssignment": {"Web App":"presentation","API Gateway":"gateway","Product Service":"application","Cache":"data"},
  "patterns": [{"pattern":"microservices","justification":"independent scaling"},{"pattern":"cache-aside","justification":"reduce DB load"}],
  "stressTests": [{"scenario":"DB down","outcome":"fallback to cache","safe":false,"mitigation":"cqrs pattern"},{"scenario":"10x traffic","outcome":"auto-scale","safe":false,"mitigation":"queue with backpressure"}],
  "keyDecisions": ["Use CDN for static assets","Async processing for orders"]
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
"async" field rules — follow exactly:
- Queue node connections: async: true
- Message broker connections: async: true  
- ALL OTHER connections: async: false
  This includes: HTTP, REST, gRPC, DB reads, DB writes, 
  cache reads, cache writes, auth calls, API calls.
  When in doubt: async: false

LAYER ORDER (left to right in diagram):
1. presentation — Web/Mobile clients (entry points, leftmost)
2. gateway — API Gateway, Load Balancer
3. application — Business logic services  
4. data — Databases, Cache, Storage (rightmost)
5. observability — Monitoring (optional)

The presentation layer MUST contain the user-facing clients.
The data layer MUST be the final destination of flows.
Never put a client node in the application or data layer.

FLOW RULES:
- Each flow path must use exact node IDs that exist in the nodes array
- Never reference a group node in a flow — only reference leaf nodes (non-group nodes)
- Generate at least 12 distinct flows
- Flows NEVER include group IDs — only leaf node IDs

RULES:
- One JSON object per line. No arrays, no wrappers, no prose.
- NEVER output [array] brackets - always use {"key": "value"} format
- NEVER wrap objects in [...] arrays
- NAME BY RESPONSIBILITY: "Cache" not "Redis"

EXAMPLE (e-commerce with 3 nodes, 2 flows):
{"id":"web-app","label":"Web Application","layer":"presentation"}
{"id":"api-gateway","label":"API Gateway","layer":"gateway"}
{"id":"product-db","label":"Product Database","layer":"data","parentId":"data-group"}
{"id":"data-group","label":"Data Layer","layer":"data","isGroup":true,"groupColor":"#3b82f6"}
{"type":"flow","path":["web-app","api-gateway","product-db"],"label":"fetch products","async":false}
{"type":"flow","path":["web-app","api-gateway"],"label":"submit order","async":true}

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
    timeout: 2500,
    maxTokens: 800,
    temperature: 0.1,
  },
  diagram: {
    primary: 'llama-3.3-70b-versatile',
    timeout: 6000,
    maxTokens: 2500,
    temperature: 0.15,
  },
};

export function getComposedPrompt(
  description: string,
  intent: string = 'generic-web-app'
): { systemPrompt: string; userPrompt: string } {
  const MAX_DESCRIPTION_LENGTH = 2000;
  const truncated = description.length > MAX_DESCRIPTION_LENGTH 
    ? description.slice(0, MAX_DESCRIPTION_LENGTH) + '...'
    : description;
  
  const systemPrompt = REASONING_PROMPT
    .replace('{description}', truncated)
    .replace('{intent}', intent);

  return {
    systemPrompt,
    userPrompt: truncated,
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