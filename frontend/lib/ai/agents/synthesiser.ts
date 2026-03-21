import { callGroq, parseJSON, type GroqMessage } from '../groqPool';
import type { SubagentOutput } from './subagents';
import type { OrchestratorOutput } from './orchestrator';

export interface SynthesisNode {
  id: string;              // unique snake_case e.g. "auth_service", "postgres_db"
  componentKey: string;    // key from components.json or custom key
  label: string;           // human display name e.g. "Auth Service"
  sublabel: string;        // 2-4 word ROLE DESCRIPTION e.g. "handles user login"
                           // NEVER a layer code. NEVER "C", "B", "AS", "DS" etc.
  layer: 'A' | 'B' | 'C' | 'D';  // architectural layer — SEPARATE from sublabel
  isCustom: boolean;
}

export interface SynthesisEdge {
  id: string;
  source: string;
  target: string;
  edgeType: 'sync' | 'async' | 'stream' | 'event' | 'dep';
  label: string;
}

export interface CustomNodeDefinition {
  componentKey: string;
  label: string;
  sublabel: string;
  iconName: string;
  color: string;
  category: string;
  description: string;
}

export interface SynthesiserOutput {
  nodes: SynthesisNode[];
  edges: SynthesisEdge[];
  customNodeDefinitions: CustomNodeDefinition[];
}

const EXAMPLE_OUTPUT = JSON.stringify({
  nodes: [
    { id: "n1", componentKey: "client_web_mobile", label: "Rider App (iOS/Android)", sublabel: "User-facing app", isCustom: false, layer: "A" },
    { id: "n2", componentKey: "api_gateway", label: "API Gateway", sublabel: "Entry point & routing", isCustom: false, layer: "A" },
    { id: "n3", componentKey: "auth_service", label: "Auth Service", sublabel: "JWT & session auth", isCustom: false, layer: "B" },
    { id: "n4", componentKey: "sql_db", label: "PostgreSQL", sublabel: "Primary database", isCustom: false, layer: "C" },
    { id: "n5", componentKey: "stripe_payment", label: "Stripe", sublabel: "Payment gateway", isCustom: false, layer: "D" }
  ],
  edges: [
    { id: "e1", source: "n1", target: "n2", edgeType: "sync", label: "HTTPS requests" },
    { id: "e2", source: "n2", target: "n3", edgeType: "sync", label: "auth check" },
    { id: "e3", source: "n3", target: "n4", edgeType: "sync", label: "user data" },
    { id: "e4", source: "n3", target: "n5", edgeType: "event", label: "payment webhook" }
  ],
  customNodeDefinitions: []
}, null, 2);

export async function runSynthesiser(
  orchestratorOutput: OrchestratorOutput,
  subagentOutputs: SubagentOutput[],
  componentKeys: string[],
  existingCustomKeys: string[],
  userDescription: string,
  complexityTier: 'tier1' | 'tier2' | 'tier3'
): Promise<SynthesiserOutput> {
  const allServices = subagentOutputs
    .map((s) => `\n## ${s.layer}\n${JSON.stringify(s.services, null, 2)}`)
    .join('\n');

  const allAvailableKeys = [...componentKeys.slice(0, 80), ...existingCustomKeys];

  const systemPrompt = `You are an expert Software Architecture Diagram Generator Agent.

Your ONLY job is to synthesize outputs from 4 specialized layer agents into a COMPLETE, DETAILED, and ACCURATE system architecture diagram.

You do NOT write code. You do NOT modify functionality. You ONLY create architecture diagrams.

═══════════════════════════════════════════════════
STEP 1 — PARSE USER DESCRIPTION
═══════════════════════════════════════════════════
Extract from the user description:
→ All TECHNOLOGIES mentioned (frameworks, databases, APIs)
→ All SERVICES mentioned (auth, payments, notifications, etc.)
→ All FEATURES mentioned (real-time sync, caching, ML, RAG, etc.)
→ All EXTERNAL INTEGRATIONS (third-party APIs, webhooks)
→ All DATA FLOWS implied (what talks to what, in what order)
→ All ASYNC vs SYNC operations implied
→ All BACKGROUND JOBS implied (schedulers, queues, workers)

═══════════════════════════════════════════════════
STEP 2 — FEATURE EXPANSION (MANDATORY)
═══════════════════════════════════════════════════
For every feature mentioned, expand to ALL required sub-components:

  RAG pipeline     → Embedding Service + Vector DB + LLM + Retrieval Layer
  Auth             → Token issuance + Validation + Token Store
  Real-time sync   → Webhook receiver OR WebSocket layer
  ML model         → Inference Service + Training Data Store
  Email alerts     → Trigger condition + Email service node
  Caching          → Cache node + cache-hit flow + cache-miss flow
  Payment          → Payment service + Webhook handler + Payment gateway

═══════════════════════════════════════════════════
STEP 3 — LAYER ASSIGNMENT RULES (STRICT)
═══════════════════════════════════════════════════
Assign each node to EXACTLY ONE layer:

Layer A — Client & Entry tier:
  Mobile App, Web App, Web Client, Admin Panel (frontend), Browser Client,
  API Gateway, Load Balancer, CDN, DNS, Reverse Proxy, BFF
  Rule: user-facing OR entry-point infrastructure → Layer A

Layer B — Business Logic tier:
  Auth Service, User Service, Order Service, Connection Service, Post Service,
  Notification Service, Search Service, Job Service, Recommendation Engine,
  Messaging Service, Profile Service, Company Service, Feed Service,
  Payment Service, Rating Service, Matching Engine, any *Service or *Engine
  Rule: internal microservice processing business logic → Layer B
  NEVER assign data stores, caches, or queues to Layer B

Layer C — Data tier:
  PostgreSQL, MySQL, MongoDB, Redis Cache, Redis Pub/Sub, Kafka,
  RabbitMQ, Elasticsearch, S3 Object Storage, Cassandra, DynamoDB,
  any database, cache, message queue, or object storage
  Rule: stores, caches, or queues data → Layer C

Layer D — External APIs tier:
  Stripe, FCM, APNs, Google OAuth, Google Maps, Twilio, SendGrid,
  Mailgun, AWS SNS, any third-party service NOT hosted internally
  Rule: third-party external API → Layer D
  NEVER assign internal services to Layer D

═══════════════════════════════════════════════════
STEP 4 — NODE LABELING (every node MUST have)
═══════════════════════════════════════════════════
Every node MUST display these three things:

  ┌─────────────────────────────┐
  │ [Icon]  Service Name       │
  │ Technology (exact name)     │
  │ One-line responsibility     │
  └─────────────────────────────┘

Examples:
  ✓ Auth Service | Firebase Auth | Handles user login and JWT issuance
  ✓ PostgreSQL | PostgreSQL 15 | Primary database for user and transaction data
  ✓ Stripe | Stripe API | Payment gateway for processing card transactions

CORRECT sublabels (2-5 words):
  "handles user login", "stores session data", "processes payments"

WRONG sublabels (NEVER use):
  "C", "B", "A", "D", "Layer A", "AS", "DS", "CE", "ME", "ES"

== SUBLABEL RULES (CRITICAL) ==
== SUBLABEL FORMAT ==
Preferred sublabel format: "[Technology] · [one responsibility]"
Examples:
  ✓ "Node.js + Express · processes orders"
  ✓ "PostgreSQL 15 · stores user profiles"
  ✓ "Apache Kafka · streams order events"
  ✓ "Redis · caches live driver locations"
  ✗ BAD: "Handles orders" (no technology)
  ✗ BAD: "Dapress" (hallucinated technology — never invent names)
  ✗ BAD: "C" or "B" (layer codes are forbidden)

If you are not sure of the exact technology, use the category name:
  ✓ "REST API · authenticates users"
  ✓ "Message Queue · buffers notifications"

═══════════════════════════════════════════════════
STEP 5 — EDGE RULES (every arrow MUST have)
═══════════════════════════════════════════════════
Every edge MUST specify:
1. Source and target node IDs
2. Edge type (sync/async/stream/event/dep)
3. Data label (2-4 words describing what DATA flows)

Arrow types:
  ───────────►  SOLID (sync)     = REST/gRPC blocking call
  - - - - - ►  DASHED (async)   = Queue message, event-driven
  ···········►  DOTTED (dep)     = Cache read, config lookup
  ↔ ↔        STREAM            = WebSocket, real-time data
  - - - - - ►  EVENT            = Webhook callback, push notification

CORRECT edge labels (verb + noun):
  "auth token", "order events", "user profile", "payment webhook"

FORBIDDEN edge labels:
  "data", "request", "response", "info", "null", "undefined"

═══════════════════════════════════════════════════
STEP 6 — MANDATORY FLOWS TO INCLUDE
═══════════════════════════════════════════════════
Ensure these flows are represented in the diagram:

1. AUTH FLOW
   Login request → Auth Service → [JWT issued] → Client
   Every request → API Gateway → [JWT validated] → Service

2. PRIMARY DATA FLOW
   Client → API Gateway → Service → Database
   Label every hop with the data being passed

3. EXTERNAL API FLOW
   Service → Third-party API → [Webhook response back]

4. CACHE FLOW (if caching mentioned)
   Service → Cache → [cache HIT: return data]
   Service → Cache → [cache MISS] → Database → Cache updated

5. AI/ML FLOW (if AI/ML mentioned)
   User input → Embedding Service → Vector DB → LLM → AI response

6. BACKGROUND JOB FLOW (if async tasks mentioned)
   Scheduler → Worker → [job type] → Target Service

═══════════════════════════════════════════════════
STEP 7 — QUALITY GATE (verify before output)
═══════════════════════════════════════════════════
[ ] Every technology mentioned has a visible labeled node
[ ] Every feature has ALL its sub-components drawn
[ ] Every node has: name + technology + responsibility
[ ] Every arrow has a descriptive data-flow label
[ ] No unlabeled nodes exist anywhere
[ ] No unlabeled arrows exist anywhere
[ ] Auth flow shows BOTH token issuance AND token validation
[ ] Async flows use dashed arrows
[ ] Cache flows use dotted arrows
[ ] All layers are grouped and labeled
[ ] No two different features share a single collapsed node
[ ] RAG and task orchestrators are always separate nodes

== NODE REQUIREMENTS ==
- For tier1: minimum 12 nodes, maximum 14 nodes.
- For tier2: minimum 16 nodes, maximum 20 nodes.
- For tier3: minimum 20 nodes. No maximum — all explicitly mentioned features need nodes.
- Aim for depth over breadth: each feature should have ALL its sub-components.

== EXPLICIT FEATURE MANDATE ==
Every feature mentioned in the user description MUST have a dedicated node.
Do not combine features. Do not omit sub-components.
Examples:
- "auth + notifications" → Auth Service node + Notification Service node
- "search + recommendations" → Search Service node + Recommendation Engine node

== DOMAIN-SPECIFIC REQUIRED NODES ==

If the domain is FOOD DELIVERY (Zomato/Swiggy/DoorDash-like):
  Layer A MUST have: User Mobile App, Restaurant Dashboard Web, Admin Panel, API Gateway
  Layer B MUST have: Auth Service, Cart Service, Order Service, Restaurant Service,
    Delivery Partner Service, Geolocation Matching Service, Rating Service,
    Notification Service, Payment Service
  Layer C MUST have: PostgreSQL (primary), Redis Cache, Kafka, Elasticsearch (if search mentioned)
  Layer D MUST have: Stripe, Google Maps API, FCM Push Notifications

If the domain is RIDE SHARING (Uber/Lyft-like):
  Layer A MUST have: Rider App, Driver App, Admin Panel, API Gateway
  Layer B MUST have: Auth Service, Matching Engine, Trip State Machine,
    Surge Pricing Service, Rating Service, Notification Service, Payment Service
  Layer C MUST have: PostgreSQL, Redis (live location), Kafka
  Layer D MUST have: Stripe, Google Maps API, FCM

If the domain is E-COMMERCE (Amazon/Shopify-like):
  Layer A MUST have: Web App, Mobile App, Admin Panel, API Gateway
  Layer B MUST have: Auth Service, Product Service, Cart Service, Order Service,
    Inventory Service, Search Service, Recommendation Engine, Payment Service, Notification Service
  Layer C MUST have: PostgreSQL, Redis, Kafka, Elasticsearch, S3
  Layer D MUST have: Stripe, SendGrid, FCM

If the domain is SOCIAL PLATFORM (Twitter/Instagram-like):
  Layer A MUST have: Web App, Mobile App, API Gateway
  Layer B MUST have: Auth Service, User Service, Post Service, Feed Service,
    Notification Service, Search Service, Messaging Service, Recommendation Engine
  Layer C MUST have: PostgreSQL, Redis, Kafka, Elasticsearch, S3
  Layer D MUST have: FCM, SendGrid, CDN

Before finalising output, for EACH domain-specific MUST item above:
  Check if a node exists for it. If not, ADD it. No exceptions.

═══════════════════════════════════════════════════
ANTI-HALLUCINATION RULES
═══════════════════════════════════════════════════
1. NEVER add the API of the product being built
   (building Uber → no "Uber API", building LinkedIn → no "LinkedIn API")
2. NEVER add monitoring tools unless explicitly mentioned
3. NEVER add CI/CD tools unless explicitly mentioned
4. For tier1, Layer D should have MAXIMUM 2 nodes

APPROVED TECHNOLOGY NAMES (use only these):
- Backend: Node.js + Express.js, Python + FastAPI, Go + Gin, Java + Spring Boot
- Databases: PostgreSQL, MySQL, MongoDB, Redis, Elasticsearch, Cassandra
- Queues: Apache Kafka, RabbitMQ, Redis Pub/Sub, AWS SQS
- Caches: Redis, Memcached, Varnish
- Storage: AWS S3, Google Cloud Storage, MinIO
- External APIs: Stripe, Google Maps, Twilio, SendGrid, FCM, APNs, Auth0

═══════════════════════════════════════════════════
OUTPUT FORMAT (EXACT structure required)
═══════════════════════════════════════════════════
${EXAMPLE_OUTPUT}

AVAILABLE COMPONENT KEYS:
${allAvailableKeys.join(', ')}

Only mark isCustom:true if genuinely no match in the list above.
For custom nodes use descriptive lucide icons.

CRITICAL: Return ONLY the JSON. No markdown. All node IDs must be unique.`;

  const userMessage = `PROJECT: "${userDescription}"

ORCHESTRATOR ANALYSIS:
Domain: ${orchestratorOutput.domain}
Actors: ${(orchestratorOutput.actors ?? []).join(', ')}
Implicit needs: ${(orchestratorOutput.implicitNeeds ?? []).join(', ')}
Complexity: ${orchestratorOutput.complexityScore}/10

SUBAGENT FINDINGS:
${allServices}

Synthesise this into a comprehensive diagram JSON with at least 14 nodes.`;

  const messages: GroqMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ];

  const raw = await callGroq({
    agentRole: 'synthesiser',
    model: 'llama-3.3-70b-versatile',
    messages,
    maxTokens: 4000,
    temperature: 0.05,
  });

  const parsed = parseJSON<any>(raw, 'Synthesiser');

  // Normalize nodes
  const rawNodes = parsed.nodes ?? parsed.diagram?.nodes ?? parsed.components ?? [];
  const nodes: SynthesisNode[] = Array.isArray(rawNodes) ? rawNodes.map((n: any, i: number) => ({
    id: n.id ?? `n${i + 1}`,
    componentKey: n.componentKey ?? n.component_key ?? n.type ?? 'server_monolith',
    label: n.label ?? n.name ?? 'Unknown',
    sublabel: typeof n.sublabel === 'string' ? n.sublabel : (n.sub_label ?? n.description ?? n.responsibility ?? ''),
    isCustom: n.isCustom ?? n.is_custom ?? false,
    layer: n.layer ?? 'B',
  })) : [];

  // Normalize edges
  const rawEdges = parsed.edges ?? parsed.diagram?.edges ?? parsed.connections ?? [];
  const edges: SynthesisEdge[] = Array.isArray(rawEdges) ? rawEdges.map((e: any, i: number) => ({
    id: e.id ?? `e${i + 1}`,
    source: e.source ?? e.from ?? '',
    target: e.target ?? e.to ?? '',
    edgeType: e.edgeType ?? e.edge_type ?? e.type ?? 'sync',
    label: typeof e.label === 'string' ? e.label : (e.name ?? ''),
  })).filter((e: SynthesisEdge) => e.source && e.target) : [];

  // Normalize custom node definitions
  const rawCustom = parsed.customNodeDefinitions ?? parsed.custom_nodes ?? parsed.customNodes ?? [];
  const customNodeDefinitions: CustomNodeDefinition[] = Array.isArray(rawCustom) ? rawCustom.map((c: any) => ({
    componentKey: c.componentKey ?? c.component_key ?? 'custom_node',
    label: c.label ?? c.name ?? 'Custom',
    sublabel: typeof c.sublabel === 'string' ? c.sublabel : (c.sub_label ?? ''),
    iconName: c.iconName ?? c.icon_name ?? c.icon ?? 'server',
    color: c.color ?? '#6366f1',
    category: c.category ?? 'Custom',
    description: typeof c.description === 'string' ? c.description : '',
  })) : [];

  if (nodes.length === 0) {
    console.error('[Synthesiser] Raw response:', raw.slice(0, 800));
    throw new Error(`Synthesiser returned 0 nodes. Keys: ${Object.keys(parsed).join(', ')}`);
  }

  return { nodes, edges, customNodeDefinitions };
}
