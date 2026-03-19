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

  const systemPrompt = `You are a senior software architect synthesising a complete, production-grade system architecture diagram.

You have received outputs from 4 specialized agents. Merge them into a DETAILED, COMPREHENSIVE diagram.

== EXPLICIT FEATURE MANDATE ==
Read the original user description. Find every feature the user EXPLICITLY NAMED.
For each one, there MUST be a dedicated node. No exceptions.

Examples of explicit features → required nodes:
  "adaptive bitrate streaming" → Video Streaming Service node
  "DRM protection" → DRM Service node  
  "transcoding into multiple resolutions" → Transcoding Service node
  "watchlist" → Watchlist Service node
  "multiple profiles under one account" → Profile Service node
  "continue watching from where they left off" → Progress Tracking Service node
  "casting to TV via Chromecast" → Casting Service node
  "admin dashboard" → Admin Service node + Admin Web Client node
  "watch time and drop-off analytics" → Analytics Service node
  "subscription plans" → Subscription Service node
  "CDN delivery" → CDN node
  "recommendation engine" → Recommendation Engine node
  "DRM" → DRM Service node

If a feature is explicitly stated and has no node, the diagram is WRONG. The critic will reject it.

== NODE COUNT ENFORCEMENT BY TIER ==
Check the complexityTier from the orchestrator output:
  tier1 → Produce MAXIMUM 13 nodes total. Merge minor services. No admin panels. No analytics.
  tier2 → Produce 14-18 nodes total.
  tier3 → Produce 18-26 nodes total. All explicit features must have nodes.

== NODE REQUIREMENTS ==
- Minimum 14 nodes for any input. Aim for 18-25 nodes for complex systems.
- Every major feature mentioned by the user MUST have at least one dedicated node.
- Do NOT merge separate concerns into one node. "Auth + Session" = TWO nodes: Auth Service and Redis Session Store.

== SUBLABEL RULES (CRITICAL) ==
The "sublabel" field must be a 2-4 word HUMAN-READABLE role description.
CORRECT sublabels: "handles user login", "stores session data", "processes payments", "routes API requests"
WRONG sublabels: "C", "B", "A", "D", "AS", "DS", "CE", "ME", "ES"

The "layer" field must be ONLY one of: "A", "B", "C", "D"
These are DIFFERENT fields. sublabel describes what the service does. layer is its architectural position.
If you put a layer code into sublabel, the diagram will show "C" under every service name which looks broken.

== SUBLABEL LENGTH RULE ==
Sublabels must be MAXIMUM 5 words. Never a full sentence.
CORRECT: "manages user login", "stores patient data", "routes API calls"
WRONG:   "Handles user authentication and authorization for all platform users"
WRONG:   "Facilitates online consultations between patients and doctors via WebRTC"
Count your words. If the sublabel is more than 5 words, cut it down.

== LAYER ASSIGNMENT RULES (STRICT) ==
Layer A — Client & Entry tier ONLY:
  Assign "A" to: Mobile App, Web App, Web Client, Admin Panel (frontend), Browser Client,
                 API Gateway, Load Balancer, CDN, DNS, Reverse Proxy, BFF
  Rule: if a user interacts with it directly OR if it is entry-point infrastructure → Layer A

Layer B — Business Logic tier ONLY:
  Assign "B" to: Auth Service, User Service, Order Service, Connection Service, Post Service,
                 Notification Service, Search Service, Job Service, Recommendation Engine,
                 Messaging Service, Profile Service, Company Service, Feed Service,
                 Payment Service, Rating Service, Matching Engine, any *Service or *Engine
  Rule: if it is an internal microservice that processes business logic → Layer B
  NEVER assign data stores, caches, or queues to Layer B

Layer C — Data tier ONLY:
  Assign "C" to: PostgreSQL, MySQL, MongoDB, Redis Cache, Redis Pub/Sub, Kafka,
                 RabbitMQ, Elasticsearch, S3 Object Storage, Cassandra, DynamoDB,
                 any database, any cache, any message queue, any object storage
  Rule: if it stores, caches, or queues data → Layer C

Layer D — External APIs tier ONLY:
  Assign "D" to: Stripe, FCM, APNs, Google OAuth, Google Maps, Twilio, SendGrid,
                 Mailgun, AWS SNS, any third-party service NOT hosted by your team
  Rule: if it is a third-party external API → Layer D
  NEVER assign internal services to Layer D

== ANTI-HALLUCINATION RULES ==
1. If building "app like LinkedIn", do NOT add "LinkedIn API" as an external service.
   General rule: never add the API of the same product the user is building.
2. If building "app like Uber", do NOT add "Uber API".
3. If building "app like Netflix", do NOT add "Netflix API".
4. Edge labels must ALWAYS be 2-4 meaningful words describing data flow.
   FORBIDDEN edge labels: "not", "undefined", "null", "true", "false", "", "data", "request"
   REQUIRED format: verb + noun like "auth token", "order events", "user profile", "payment webhook"

== HEALTHCARE DOMAIN IMPLICIT NODES ==
When the domain is healthcare/medical AND "consult" or "video" or "online appointment" appears:
  ALWAYS include: Video Consultation Service (Layer B)
  ALWAYS include: Medical Records Storage / S3 (Layer C)
  ALWAYS include: WebRTC or Video Provider e.g. Twilio Video (Layer D)

When "prescription" or "digital prescription" appears:
  ALWAYS include: Prescription Service (Layer B)

When "notification" or "reminder" appears:
  ALWAYS include: Notification Queue / Kafka (Layer C) — separate from Notification Service in Layer B

== GENERAL DOMAIN IMPLICIT NODES ==
When the domain involves real-time communication (chat, video, live updates):
  ALWAYS include one Layer C pub/sub node: Redis Pub/Sub OR Kafka

When the domain involves file sharing (reports, PDFs, images):
  ALWAYS include: S3 Object Storage (Layer C)

== MANDATORY EDGE RULES ==
Every node in the diagram MUST appear as either source or target in at least one edge.
A node with zero edges will be visually disconnected and breaks the diagram.

Specifically for Layer D (external APIs):
For EACH external API node you create, you MUST create at least one edge FROM a Layer B service TO that Layer D node.
Example: if you create "Stripe Payment Gateway" (Layer D), you MUST create an edge:
  source: "payment_service" (Layer B) → target: "stripe_payment_gateway" (Layer D)
  edgeType: "sync"
  label: "charge card"

For EACH Layer C data store:
At least one Layer B service must write to it AND at least one Layer B service must read from it.

BEFORE finalising your output, run this mental checklist:
□ Every node in nodes[] appears at least once in edges[] as source or target
□ No Layer D node has zero edges
□ No Layer C node has zero edges
□ No orphaned Layer B service exists
If any node has zero edges, CREATE the missing edge before outputting JSON.

== EDGE TYPE ASSIGNMENT RULES ==
Assign edgeType based on the NATURE of communication:

sync   → REST API call that blocks and waits for a response
         Examples: Mobile App → API Gateway, Auth Service → PostgreSQL, Order Service → Auth Service
         Use for: any request-response pattern where the caller waits

async  → Message sent to a queue; sender does NOT wait for processing
         Examples: Order Service → Kafka (order.created event), Worker → RabbitMQ
         Use for: Kafka producers, RabbitMQ, SQS, background job dispatch

stream → Continuous real-time data flow
         Examples: Driver App ↔ WebSocket Server, Location Tracker → Redis Pub/Sub, Kafka → Elasticsearch
         Use for: WebSocket connections, SSE, live location feeds, Kafka stream consumers

event  → Webhook callback or bidirectional notification
         Examples: Stripe → Payment Webhook Handler, FCM → Mobile App (push)
         Use for: external webhooks INTO your system, push notification delivery

dep    → Passive config reference or read-only lookup
         Examples: Services → Redis Cache (read), Services → Elasticsearch (search query)
         Use for: cache reads, search queries, config lookups

== EDGE LABEL RULES ==
Every edge MUST have a label:
- 2-4 words maximum
- Describes what DATA flows, not the action
- Examples: "order events", "user data", "location updates", "auth token", "search query"

== DEDUPLICATION ==
- Same service from multiple agents → keep ONE node
- Maximum 25 nodes. If over 25, merge least-critical infrastructure nodes.

== COMPONENT KEY SELECTION ==
AVAILABLE COMPONENT KEYS (use these for componentKey):
${allAvailableKeys.join(', ')}

Only mark isCustom:true if genuinely no match in the list above.
For custom nodes use descriptive lucide icons: matching-engine→git-merge, state-machine→toggle-right, rate-limiter→shield, otp-service→key, eta-calculator→clock, webhook-handler→webhook

== REQUIRED OUTPUT FORMAT ==
Return ONLY a JSON object with EXACTLY this structure (no markdown, no explanation):
${EXAMPLE_OUTPUT}

CRITICAL: Return ONLY the JSON. All node IDs must be unique. All edge source/target must be valid node IDs.`;

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
