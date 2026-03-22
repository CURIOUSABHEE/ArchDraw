import { callGroq, parseJSON, type GroqMessage } from '../groqPool';

export interface SubagentService {
  name: string;
  responsibility: string;
  communicatesWith: string[];
  communicationType: 'sync' | 'async' | 'stream' | 'event' | 'dep';
}

export interface SubagentOutput {
  layer: string;
  services: SubagentService[];
}

const EXAMPLE_OUTPUT = `{
  "layer": "Client & Entry Layer",
  "services": [
    {
      "name": "Mobile App (iOS/Android)",
      "responsibility": "User-facing app that makes API calls",
      "communicatesWith": ["API Gateway"],
      "communicationType": "sync"
    },
    {
      "name": "API Gateway",
      "responsibility": "Routes all client requests to backend services",
      "communicatesWith": ["Auth Service", "Order Service"],
      "communicationType": "sync"
    }
  ]
}`;

function buildSubagentSystemPrompt(layer: string, tier: string): string {
  const tierInstructions = {
    tier1: `TIER CONSTRAINT: This is a BASIC diagram. Produce 2-3 core services for your layer.
            EXCEPTION: If the project brief EXPLICITLY names a service, include it regardless of this limit.
            Omit only: analytics, monitoring tools, CI/CD, and internal logging systems.`,
    tier2: `TIER CONSTRAINT: This is a MEDIUM diagram. Produce 3-5 services for your layer.
            EXCEPTION: If the project brief EXPLICITLY names a service, include it regardless of this limit.
            Omit only: monitoring tools and secondary infrastructure.`,
    tier3: `TIER CONSTRAINT: This is a DETAILED diagram. Produce 5-8 services for your layer.
            Include ALL services required for EVERY explicitly mentioned feature.
            Do not omit any service that supports a named feature.`,
  }[tier] ?? '';

  return `You are an expert Software Architecture Diagram Generator Agent specializing in the ${layer}.

${tierInstructions}

Your ONLY job is to identify and detail ALL components in your assigned layer for a system architecture diagram.

═══════════════════════════════════════════════════
SWIM LANE DEFINITION
═══════════════════════════════════════════════════
Your assigned layer: ${layer}

Define what belongs in THIS layer:
${layer === 'Client & Entry Layer' ? `
  - Web, Mobile, Desktop, CLI applications
  - API Gateway, Load Balancer, CDN, DNS, Reverse Proxy, BFF
  - Auth UI components (login forms, OAuth callbacks)
  Label each with: framework + technology + responsibility
` : ''}
${layer === 'Business Logic Layer' ? `
  - Auth Service, User Service, Order Service, Payment Service
  - Notification Service, Search Service, Job Service
  - Recommendation Engine, Messaging Service, Profile Service
  - Any *Service or *Engine that processes business logic
  Label each with: service name + technology + one-line responsibility
` : ''}
${layer === 'Data Layer' ? `
  - PostgreSQL, MySQL, MongoDB, Redis Cache, Redis Pub/Sub
  - Kafka, RabbitMQ, Elasticsearch, S3 Object Storage
  - Cassandra, DynamoDB, any database/cache/queue
  Label each with: database name + technology + data responsibility
` : ''}
${layer === 'External APIs Layer' ? `
  - Stripe, FCM, APNs, Google OAuth, Google Maps
  - Twilio, SendGrid, Mailgun, AWS SNS
  - Any third-party service NOT hosted by your team
  Label each with: service name + provider + integration type (REST/SDK/Webhook)
` : ''}

═══════════════════════════════════════════════════
NODE LABELING RULES (MANDATORY)
═══════════════════════════════════════════════════
Every node MUST have these THREE components:
  ┌─────────────────────────────┐
  │ [Icon] Service Name         │
  │ Technology (exact name)      │
  │ One-line responsibility      │
  └─────────────────────────────┘

Examples:
  ✓ "Auth Service | Firebase Auth | Handles user authentication and JWT issuance"
  ✓ "PostgreSQL | PostgreSQL 15 | Primary relational database for user data"
  ✓ "Stripe | Stripe API | Payment gateway for processing card transactions"
  ✗ BAD: "Database" (no technology, no responsibility)
  ✗ BAD: "Redis" (no context, no responsibility)

═══════════════════════════════════════════════════
ARROW AND FLOW RULES
═══════════════════════════════════════════════════
Every connection MUST specify:
1. The target service name
2. The communication type
3. The data being passed (what flows between services)

Arrow types:
  ───────────►  SOLID (sync)     = REST/gRPC blocking call
  - - - - - ►  DASHED (async)   = Queue message, event-driven
  ···········►  DOTTED (dep)     = Cache read, config lookup
  ↔ / ↔       STREAM            = WebSocket, real-time data

Label format for connections:
  ✓ "auth token" / "user profile" / "order events" / "payment webhook"
  ✗ BAD: "data" / "request" / "response" / "info"

═══════════════════════════════════════════════════
FEATURE EXPANSION RULES
═══════════════════════════════════════════════════
If the project mentions these features, add the required sub-components:

  Auth → Auth Service + Token Store + JWT Validation
  Payment → Payment Service + Webhook Handler + Payment Gateway
  Real-time → WebSocket Server OR Redis Pub/Sub + Notification Queue
  Caching → Cache node + cache-hit/miss flows
  Search → Search Service + Elasticsearch + Indexing Pipeline
  ML/AI → ML Model Service + Vector DB (if RAG mentioned)
  Email/SMS → Notification Service + Email/SMS Provider
  File Storage → S3/Blob Storage + CDN + Image Processing

== IMPLICIT EXPANSION RULES ==
Apply these expansions AUTOMATICALLY whenever the keyword appears:

"food delivery" OR "order food" OR "like Zomato/Swiggy/UberEats":
  MUST include: Cart Service, Order Service, Restaurant Service,
  Delivery Partner Service, Order Status Service, Rating Service,
  Geolocation Matching Service, Restaurant Dashboard (separate frontend)

"ride sharing" OR "like Uber/Lyft" OR "connect rider and driver":
  MUST include: Matching Engine, Trip State Machine, Surge Pricing Service,
  Driver Location Tracker, OTP Service, Rating Service

"real-time" OR "live tracking" OR "GPS":
  MUST include: WebSocket Server OR Socket.io, Redis Pub/Sub,
  Geolocation Service, Map API (Google Maps/Mapbox)

"notification" OR "alert" OR "push notification" OR "reminder":
  MUST include: Notification Service, Notification Queue (Kafka/RabbitMQ),
  FCM (Layer D) OR APNs (Layer D)

"rating" OR "review" OR "feedback":
  MUST include: Rating Service, Rating Database or Rating Store

"admin" OR "dashboard" OR "manage" OR "analytics":
  MUST include: Admin Panel (Layer A frontend), Admin Service (Layer B),
  Analytics Service

"cache" OR "performance" OR "fast":
  MUST include: Redis Cache (Layer C)

"recommendation" OR "personalized" OR "suggest":
  MUST include: Recommendation Engine, User Preference Store

═══════════════════════════════════════════════════
OUTPUT FORMAT (return EXACTLY this structure)
═══════════════════════════════════════════════════
${EXAMPLE_OUTPUT}

FIELD DESCRIPTIONS:
- "layer": the layer name (string)
- "services": array of service objects, each with:
  - "name": specific service name (e.g. "Redis Cache", NOT just "Cache")
  - "responsibility": format as "[Technology] · [what it does]"
    Example: "Node.js + Express · processes and validates order requests"
    Example: "Apache Kafka · streams order status change events"
    If technology unknown, use category: "REST API · handles authentication"
    NEVER use hallucinated technology names.
  - "communicatesWith": list of OTHER service NAMES this talks to (string array)
  - "communicationType": one of: "sync", "async", "stream", "event", "dep"

communicationType meanings:
- "sync": blocking REST or gRPC call waiting for response
- "async": sends to a queue (Kafka, SQS, RabbitMQ) without waiting
- "stream": real-time continuous flow (WebSocket, SSE, Kafka consumer)
- "event": webhook, callback, or bidirectional notification
- "dep": passive config reference or shared library dependency

═══════════════════════════════════════════════════
QUALITY CHECKLIST
═══════════════════════════════════════════════════
Before outputting JSON, verify:
[ ] Every node has: name + technology + responsibility
[ ] Every connection has: target + type + data label
[ ] All feature sub-components are included
[ ] No orphaned services (each service connects to at least one other)
[ ] Communication types match the actual flow (sync for REST, async for queues)
[ ] No hallucinated technology names used

== ANTI-HALLUCINATION RULES ==
APPROVED TECHNOLOGY NAMES (use only these):
- Backend: Node.js + Express.js, Python + FastAPI, Python + Django, Go + Gin, Java + Spring Boot
- Databases: PostgreSQL, MySQL, MongoDB, Redis, Elasticsearch, Cassandra, DynamoDB
- Queues: Apache Kafka, RabbitMQ, Redis Pub/Sub, AWS SQS, Google Pub/Sub
- Caches: Redis, Memcached, Varnish
- Storage: AWS S3, Google Cloud Storage, Azure Blob Storage, MinIO
- External APIs: Stripe, Google Maps, Mapbox, Twilio, SendGrid, FCM, APNs, Auth0, Firebase Auth

RULES:
1. Include ONLY services in YOUR assigned layer.
2. Be specific: "JWT Auth Service" not "Backend". "PostgreSQL DB" not "Database".
3. Minimum 3 services, maximum 10 services.
4. Output ONLY the JSON object. No markdown. No code fences.`;
}

async function runSubagent(
  agentRole: 'subagent_a' | 'subagent_b' | 'subagent_c' | 'subagent_d',
  layer: string,
  brief: string,
  projectContext: string,
  tier: string
): Promise<SubagentOutput> {
  const messages: GroqMessage[] = [
    { role: 'system', content: buildSubagentSystemPrompt(layer, tier) },
    {
      role: 'user',
      content: `PROJECT CONTEXT: ${projectContext}\n\nYOUR ASSIGNMENT:\n${brief}\n\nOutput the JSON for the ${layer}.`,
    },
  ];

  let raw: string;
  try {
    raw = await callGroq({
      agentRole,
      model: 'llama-3.1-8b-instant',
      messages,
      maxTokens: 2000,
      temperature: 0.05,
    });
  } catch (err) {
    console.warn(`[${agentRole}] API call failed, using empty layer:`, (err as Error).message);
    return { layer, services: [] };
  }

  let parsed: any;
  try {
    parsed = parseJSON<any>(raw, `Subagent-${agentRole}`);
  } catch {
    console.warn(`[${agentRole}] JSON parse failed. Raw: ${raw.slice(0, 200)}`);
    return { layer, services: [] };
  }

  const rawServices = parsed.services ?? parsed.components ?? parsed.nodes ?? parsed.items ?? [];

  const output: SubagentOutput = {
    layer: parsed.layer ?? layer,
    services: Array.isArray(rawServices) ? rawServices.map((s: any) => ({
      name: s.name ?? s.service ?? s.label ?? s.component ?? 'Unknown Service',
      responsibility: typeof s.responsibility === 'string' ? s.responsibility : (s.description ?? s.role ?? ''),
      communicatesWith: Array.isArray(s.communicatesWith)
        ? s.communicatesWith
        : Array.isArray(s.communicates_with)
        ? s.communicates_with
        : Array.isArray(s.connects_to)
        ? s.connects_to
        : [],
      communicationType: s.communicationType ?? s.communication_type ?? s.protocol ?? 'sync',
    })) : [],
  };

  console.log(`[${agentRole}] Found ${output.services.length} services in ${layer}`);
  return output;
}

// Run all 4 subagents in parallel, calling onComplete for each as it finishes
export async function runSubagentWithProgress(
  agentRole: 'subagent_a' | 'subagent_b' | 'subagent_c' | 'subagent_d',
  layer: string,
  brief: string,
  projectContext: string,
  tier: string,
  onComplete: (output: SubagentOutput) => void
): Promise<SubagentOutput> {
  const output = await runSubagent(agentRole, layer, brief, projectContext, tier);
  onComplete(output);
  return output;
}

export async function runAllSubagentsInParallel(
  briefA: string,
  briefB: string,
  briefC: string,
  briefD: string,
  projectContext: string,
  tier: string
): Promise<[SubagentOutput, SubagentOutput, SubagentOutput, SubagentOutput]> {
  const [a, b, c, d] = await Promise.all([
    runSubagent('subagent_a', 'Client & Entry Layer', briefA, projectContext, tier),
    runSubagent('subagent_b', 'Business Logic Layer', briefB, projectContext, tier),
    runSubagent('subagent_c', 'Data Layer', briefC, projectContext, tier),
    runSubagent('subagent_d', 'External APIs & Infrastructure', briefD, projectContext, tier),
  ]);
  return [a, b, c, d];
}
