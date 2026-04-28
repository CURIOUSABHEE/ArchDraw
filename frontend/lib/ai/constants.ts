export const LAYER_ORDER = ['presentation', 'gateway', 'application', 'async', 'data', 'observability', 'external'];

export const MAX_ITERATIONS = 3;
export const SCORE_THRESHOLD = 75;

export const DIAGRAM_SYSTEM_MESSAGE = 'Output NDJSON only. One JSON object per line. No markdown. No arrays. No prose.';

export const COMMUNICATION_STYLES: Record<string, { color: string; dash: string | undefined; animated: boolean; pathType?: string; strokeDasharray: string; markerEnd: string; markerId: string }> = {
  sync: { color: '#94a3b8', dash: '', animated: false, pathType: 'Smoothstep', strokeDasharray: '', markerEnd: 'arrowclosed', markerId: 'arrow-sync' },
  async: { color: '#94a3b8', dash: '8,4', animated: true, pathType: 'Smoothstep', strokeDasharray: '8,4', markerEnd: 'arrowclosed', markerId: 'arrow-async' },
  stream: { color: '#94a3b8', dash: '10,4', animated: true, pathType: 'Smoothstep', strokeDasharray: '10,4', markerEnd: 'arrowclosed', markerId: 'arrow-stream' },
  event: { color: '#94a3b8', dash: '4,4', animated: true, pathType: 'Smoothstep', strokeDasharray: '4,4', markerEnd: 'arrowclosed', markerId: 'arrow-event' },
  dep: { color: '#94a3b8', dash: '6,6', animated: false, pathType: 'Smoothstep', strokeDasharray: '6,6', markerEnd: 'arrowclosed', markerId: 'arrow-dep' },
};

export const EDGE_COLORS: Record<string, string> = {
  sync: '#94a3b8',
  async: '#94a3b8',
  stream: '#94a3b8',
  event: '#94a3b8',
  dep: '#94a3b8',
};

export const EDGE_MARKER_IDS: Record<string, string> = {
  sync: 'arrow-sync',
  async: 'arrow-async',
  stream: 'arrow-stream',
  event: 'arrow-event',
  dep: 'arrow-dep',
};

export const DEFAULT_ELK_OPTIONS: Record<string, string> = {
  'elk.algorithm': 'layered',
  'elk.direction': 'RIGHT',
  'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
  'elk.spacing.nodeNode': '20',
  'elk.spacing.edgeNode': '20',
  'elk.spacing.edgeEdge': '20',
  'elk.layered.spacing.nodeNodeBetweenLayers': '200',
  'elk.layered.spacing.edgeNodeBetweenLayers': '40',
  'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
  'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
  'elk.layered.nodeSize.constraints': 'MINIMUM_SIZE',
  'elk.edgeRouting': 'ORTHOGONAL',
  'elk.portConstraints': 'FIXED_SIDE',
  'elk.padding': '[top=40, left=40, bottom=40, right=40]',
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
2. LAYERS: {ComponentName: LayerName} — Valid: presentation|gateway|application|data|observability
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

export const DIAGRAM_PROMPT = `ROLE: Architecture diagram generator.
OUTPUT: Line-delimited JSON (NDJSON). One object per line.
No markdown. No prose. No code fences. No arrays. No wrappers.

INPUT:
{reasoning}

════════════════════════════
OUTPUT STRUCTURE — FOLLOW EXACTLY
════════════════════════════

Step 1: Generate 3-5 GROUP nodes (zone containers)
Step 2: Generate 2-4 CHILD nodes inside each group
Step 3: Generate 4-8 FLOW lines connecting child/standalone nodes

TOTAL: 12-15 nodes including groups. 4-8 flows with 3-5 nodes each.

GROUP NODE format:
{"id":"clients-group","label":"Clients","layer":"presentation","isGroup":true,"groupLabel":"CLIENTS","groupColor":"#dbeafe"}

CHILD NODE format (must reference a group via parentId):
{"id":"web-app","label":"Web App","subtitle":"React SPA","layer":"presentation","icon":"monitor","parentId":"clients-group"}

STANDALONE NODE format (no group, used sparingly for queues/workers):
{"id":"message-queue","label":"Message Queue","subtitle":"Async job queue","layer":"async","icon":"queue"}

FLOW format (after ALL nodes — connect leaf nodes only):
{"type":"flow","path":["web-app","api-gateway","user-service","user-db"],"label":"user request","async":false}

════════════════════════════
CRITICAL RULES
════════════════════════════

GROUP NAMING:
- groupLabel must be short ALL CAPS zone name: "CLIENTS", "GATEWAY", "SERVICES", "STORAGE", "WORKERS", "MONITORING"
- NEVER use "Data Layer", "Application Layer", "Presentation Layer" as groupLabel
- Group IDs always end in "-group": clients-group, gateway-group, services-group, storage-group
- Child IDs must NOT contain the group name: use "web-app" not "clients-web-app"
- All IDs must be simple kebab-case with no prefixes: "user-service" not "as-user-service"

DUPLICATE PREVENTION (MOST IMPORTANT):
- Each service LABEL appears EXACTLY ONCE in the entire output
- Each service ID appears EXACTLY ONCE - NO DUPLICATE IDs ALLOWED
- If "API Gateway" is a child inside gateway-group, do NOT also output a standalone "API Gateway"
- A group container is NOT a visible node — do NOT create a child with the same name as its group
- WRONG: group groupLabel="GATEWAY" + child label="Gateway" — this is a duplicate
- CORRECT: group groupLabel="GATEWAY" + child label="API Gateway" + child label="Load Balancer"

VERIFY BEFORE OUTPUT:
- Check your generated node IDs — each must be UNIQUE
- Check your generated node labels — each must be UNIQUE  
- If duplicates exist, remove the extras before outputting

GROUP CHILDREN:
- Every group must have exactly 2-4 children (never 0, never 1, never 5+)
- Every child must have parentId matching an existing group id

FLOW RULES:
- Flow paths must be 3-5 node IDs long
- Flow paths NEVER reference a group ID — only child/standalone node IDs
- async: false is the DEFAULT for all HTTP, REST, gRPC, DB, cache connections
- async: true ONLY for message queue / event bus connections
- Each source→target pair appears at most once across ALL flows
- Every non-group node must appear in at least one flow

LAYER ORDER (left → right in final diagram):
1. presentation — Web/Mobile clients (leftmost)
2. gateway — API Gateway, Load Balancer, CDN
3. application — Business logic services
4. async — Message queues, event bus, workers (optional)
5. data — Databases, Cache, Object Storage (rightmost)
6. observability — Monitoring, Logging (optional, standalone ok)

OUTPUT ORDER:
1. All group nodes first
2. All child nodes second
3. All standalone nodes third
4. All flow lines last

════════════════════════════
EXAMPLE OUTPUT (for e-commerce)
════════════════════════════
{"id":"clients-group","label":"Clients","layer":"presentation","isGroup":true,"groupLabel":"CLIENTS","groupColor":"#dbeafe"}
{"id":"gateway-group","label":"Gateway","layer":"gateway","isGroup":true,"groupLabel":"GATEWAY","groupColor":"#dcfce7"}
{"id":"services-group","label":"Services","layer":"application","isGroup":true,"groupLabel":"SERVICES","groupColor":"#fef3c7"}
{"id":"storage-group","label":"Storage","layer":"data","isGroup":true,"groupLabel":"STORAGE","groupColor":"#fce7f3"}
{"id":"web-app","label":"Web App","subtitle":"React SPA","layer":"presentation","icon":"monitor","parentId":"clients-group"}
{"id":"mobile-app","label":"Mobile App","subtitle":"iOS/Android","layer":"presentation","icon":"smartphone","parentId":"clients-group"}
{"id":"api-gateway","label":"API Gateway","subtitle":"REST/GraphQL entry","layer":"gateway","icon":"webhook","parentId":"gateway-group"}
{"id":"load-balancer","label":"Load Balancer","subtitle":"Traffic distribution","layer":"gateway","icon":"shuffle","parentId":"gateway-group"}
{"id":"product-service","label":"Product Service","subtitle":"Catalog management","layer":"application","icon":"server","parentId":"services-group"}
{"id":"order-service","label":"Order Service","subtitle":"Order processing","layer":"application","icon":"server","parentId":"services-group"}
{"id":"payment-service","label":"Payment Service","subtitle":"Stripe integration","layer":"application","icon":"credit-card","parentId":"services-group"}
{"id":"product-db","label":"Product Database","subtitle":"PostgreSQL","layer":"data","icon":"database","parentId":"storage-group"}
{"id":"cache","label":"Redis Cache","subtitle":"Session + product cache","layer":"data","icon":"gauge","parentId":"storage-group"}
{"id":"order-db","label":"Order Database","subtitle":"PostgreSQL","layer":"data","icon":"database","parentId":"storage-group"}
{"type":"flow","path":["web-app","api-gateway","product-service","product-db"],"label":"browse products","async":false}
{"type":"flow","path":["mobile-app","load-balancer","order-service","order-db"],"label":"place order","async":false}
{"type":"flow","path":["web-app","api-gateway","payment-service","order-db"],"label":"process payment","async":false}
{"type":"flow","path":["web-app","load-balancer","product-service","cache"],"label":"cached product lookup","async":false}
{"type":"flow","path":["order-service","payment-service","order-db"],"label":"order fulfillment","async":false}

First character must be {`;

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
    maxTokens: 3000,
    temperature: 0.3,
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
