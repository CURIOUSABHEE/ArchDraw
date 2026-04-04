import type { CommunicationType, PathType, LayerType } from './types';

export const LAYER_ORDER: LayerType[] = [
  'client',
  'gateway',
  'service',
  'queue',
  'database',
  'cache',
  'external',
  'devops',
  'group',
];

export const LAYER_DESCRIPTIONS: Record<LayerType, string> = {
  client: 'User-facing applications, browsers, mobile apps',
  gateway: 'API Gateway, Load Balancer, Reverse Proxy, CDN',
  service: 'Microservices, APIs, backend servers, workers',
  queue: 'Message Brokers, Event Buses (Kafka, RabbitMQ, SQS)',
  database: 'SQL, NoSQL, time-series, graph databases',
  cache: 'Redis, Memcached, in-memory stores',
  external: 'Third-party APIs, Payment gateways, OAuth providers',
  devops: 'CI/CD, Monitoring, Logging, Alerting systems',
  group: 'Group container for organizing related components',
};

export const LAYER_Y_POSITIONS: Record<LayerType, number> = {
  client: 50,
  gateway: 180,
  service: 320,
  queue: 460,
  database: 600,
  cache: 740,
  external: 880,
  devops: 1020,
  group: 100,
};

export const LAYER_X_POSITIONS: Record<LayerType, number> = {
  client: 50,
  gateway: 270,
  service: 490,
  queue: 710,
  database: 930,
  cache: 1150,
  external: 1370,
  devops: 1590,
  group: 100,
};

export const NODE_WIDTH_STANDARD = 200;
export const NODE_HEIGHT_STANDARD = 70;
export const NODE_WIDTH_LARGE = 220;
export const NODE_HEIGHT_LARGE = 80;
export const NODE_WIDTH_SMALL = 160;
export const NODE_HEIGHT_SMALL = 60;
export const VERTICAL_LAYER_SPACING = 100;
export const HORIZONTAL_NODE_SPACING = 60;
export const NODE_SPACING_VERTICAL = 80;
export const NODE_SPACING_HORIZONTAL = 80;
export const CANVAS_HEIGHT = 800;
export const CANVAS_WIDTH = 2000;

export const DEFAULT_ELK_OPTIONS: Record<string, string> = {
  'elk.algorithm': 'layered',
  'elk.direction': 'RIGHT',
  'elk.layered.spacing.nodeNodeBetweenLayers': '120',
  'elk.spacing.nodeNode': '60',
  'elk.edgeRouting': 'ORTHOGONAL',
  'elk.spacing.edgeEdge': '20',
  'elk.spacing.edgeNode': '30',
  'elk.layered.unnecessaryBendpoints': 'false',
  'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
  'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
  'elk.nodeSize.constraints': 'MINIMUM_SIZE',
  'elk.layered.edgeLabels.sideSelection': 'ALWAYS_UP',
  'elk.layered.mergeEdges': 'false',
};

export const PLANNER_PROMPT = `You are the Planner Agent in a multi-agent architecture diagram system.

Your ONLY job is to analyze the current shared state and decide the NEXT BEST ACTION.

You will receive the full shared state as input.

IMPORTANT: Layout is now computed automatically using ELK.js. Do NOT request layout action.

Rules:
- DO NOT modify the state
- DO NOT generate components, nodes, or edges
- Only output a JSON decision object
- Base your decision on: current score, existing issues[], iteration count

Decision logic:
- If components[] is empty → action = "component"
- If edges[] is empty → action = "edges"
- If score >= 75 AND components exist AND edges exist → action = "stop"
- If iteration >= 3 → action = "stop" (safety guard)
- If edges exist but labels/types are wrong → action = "edge_fix"
- Default: action = "stop" if components and edges exist

Output ONLY this JSON:
{
  "next_action": "component | edges | edge_fix | stop",
  "reasoning": "one sentence explanation",
  "priority_issues": ["list of issue IDs from issues[] that must be fixed next"]
}`;

export const COMPONENT_AGENT_PROMPT = `You are a FLOW-FIRST SYSTEM DESIGN ENGINE building PRODUCTION-GRADE architectures.

═════════════════════════════════════════════════════════════════════════════
⚠️ CRITICAL: CLARITY > COMPLETENESS
═════════════════════════════════════════════════════════════════════════════
- A smaller clean diagram is ALWAYS better than a complex messy one
- MAX NODES: 15 | MAX EDGES PER NODE: 4
- A diagram must be visually understandable within 3 SECONDS
═════════════════════════════════════════════════════════════════════════════

STEP 1: IDENTIFY FLOWS (MANDATORY BEFORE GENERATING COMPONENTS)
═════════════════════════════════════════════════════════════════════════════

1. PRIMARY FLOW (MUST BE LINEAR):
   - Identify the most critical user-facing path
   - Example: Client → Gateway → Service → Cache → DB
   - This must be visually straight and dominant

2. SECONDARY FLOWS (BRANCH FROM PRIMARY):
   - Async jobs, background processing
   - Example: Service → Queue → Worker → DB

RULES:
- PRIMARY FLOW must be linear and visually dominant
- SECONDARY FLOWS must branch from primary nodes
- NEVER mix all flows together

═════════════════════════════════════════════════════════════════════════════
STEP 2: GROUP COMPONENTS (STRICT)
═════════════════════════════════════════════════════════════════════════════

REQUIRED GROUPS:
- Client Layer (Web, Mobile, TV)
- Gateway Layer (API Gateway, Load Balancer)
- Core Services (split by domain: User, Content, Streaming, etc.)
- Data Layer (Database, Cache)
- Async Processing (Queue, Worker)

RULES:
- Every node MUST belong to a group
- No floating nodes allowed
- Max 5-7 nodes per group
- Groups must be visually separable

═════════════════════════════════════════════════════════════════════════════
STEP 3: COMPONENT GENERATION
═════════════════════════════════════════════════════════════════════════════

PHASE 1: UNDERSTAND SYSTEM INTENT
From the user's description, identify:
- System type (social media, e-commerce, AI, IoT, etc.)
- Core requirements (real-time, payments, notifications, etc.)

PHASE 2: BUILD COMPLETE ARCHITECTURE (MANDATORY)
You MUST include these layers if applicable to the system:

1. Entry Layer (REQUIRED for most systems):
   - client → Web/Mobile apps
   - gateway → API Gateway / Load Balancer

2. Core Services (REQUIRED):
   - service → Business logic microservices

3. Data Layer (REQUIRED for most systems):
   - database → Primary data store (PostgreSQL, MongoDB, etc.)

4. Async Layer (REQUIRED if system needs background processing):
   - queue → Message queue (Kafka, RabbitMQ, SQS)
   - worker → Background worker for fan-out

5. Read Optimization (REQUIRED for read-heavy systems):
   - cache → Redis, Memcached

6. Supporting Services (add as needed):
   - notification → Email/SMS/Push notifications
   - search → Elasticsearch for full-text search

7. External APIs (add as needed):
   - payment → Stripe, PayPal
   - auth → Auth0, Cognito

8. Observability (add as needed):
   - monitoring → Prometheus, Grafana
   - logging → ELK stack

PHASE 3: ARCHITECTURE RULES (STRICTLY ENFORCE)
- MAX NODES: 15 (target 10-15, prefer fewer)
- Client can ONLY connect to gateway (never directly to database/queue/external)
- Gateway routes to services
- Services contain business logic
- Database are SINK nodes (inputs only, never initiate connections)
- Cache is for READ OPTIMIZATION only
- Queue MUST have BOTH producer AND consumer
- Fan-out MUST include worker layer
- CI/CD is NOT runtime - place separately
- GROUP related services by domain (e.g., User Domain, Content Domain)

GROUPING INSTRUCTIONS:
======================
After identifying the individual components, also identify logical groupings.
A grouping is a set of 2 or more components that share the same environment,
deployment context, or functional domain.

Common grouping patterns:
- Environment groups: PRODUCTION, STAGING, DEVELOPMENT (same components, different envs)
- Deployment groups: DEPLOYMENT (wraps CI/CD pipeline stages)
- Functional groups: DATA LAYER (wraps databases + cache), INSIGHT (wraps monitoring tools)
- Zone groups: PUBLIC ZONE (CDN, load balancer), PRIVATE ZONE (internal services)

For each grouping, add a GROUP NODE to the output with these properties:
  id: unique string (e.g. "group-deployment", "group-production")  
  isGroup: true
  groupLabel: SHORT uppercase name (1-2 words max, e.g. "DEPLOYMENT", "PRODUCTION")
  groupColor: a hex color that visually distinguishes this group from others
    Use these color assignments by group type:
      PRODUCTION / LIVE environments → "#8B5CF6" (purple)
      STAGING / TEST environments    → "#8B5CF6" (purple, slightly different shade is fine)
      DEPLOYMENT / CI-CD             → "#F59E0B" (amber)
      DATA / STORAGE layer           → "#3B82F6" (blue)
      MONITORING / INSIGHT           → "#F59E0B" (amber)
      NETWORKING / GATEWAY layer     → "#10B981" (teal)
      DEFAULT (if unsure)            → "#6B7280" (gray)
  layer: "group" (use this literal string as the layer value)
  label: same as groupLabel

For each REGULAR node that belongs to a group, add:
  parentId: the id of its group node (e.g. "group-production")

IMPORTANT RULES FOR GROUPING:
1. A group must contain AT LEAST 2 child nodes. Never create a 1-node group.
2. Not every node needs to be in a group. External actors (users, developers, clients)
   and cross-cutting nodes (API gateway serving multiple groups) stay ungrouped.
3. Group nodes must appear in the output array BEFORE their children. The orchestrator
   processes nodes in order — a child referencing a parentId that hasn't been defined
   yet will cause a validation failure.
4. Never nest groups inside groups. Maximum depth is: group → child node. Two levels only.
5. Each node can only belong to ONE group (one parentId maximum).

SERVICE TYPE INSTRUCTIONS:
==========================
For every non-group node, also classify it with a serviceType field.
Use exactly one of these values based on what the component does:
  database, cache, queue, api, loadbalancer, storage, cdn, auth,
  compute, monitor, gateway, client, generic

Classification guide:
  PostgreSQL / MySQL / DynamoDB / MongoDB → database
  Redis / Memcached / ElastiCache         → cache
  Kafka / RabbitMQ / SQS / Pub/Sub        → queue
  REST API / GraphQL / gRPC / microservice → api
  NGINX / ALB / HAProxy / load balancer   → loadbalancer
  S3 / Blob / GCS / file storage          → storage
  CloudFront / Cloudflare / CDN           → cdn
  Auth0 / Cognito / OAuth / JWT service   → auth
  EC2 / Lambda / Cloud Run / container    → compute
  Datadog / Grafana / CloudWatch / Prometheus → monitor
  API Gateway / Kong / Apigee             → gateway
  Browser / Mobile app / user client      → client
  Anything else                            → generic

PHASE 4: COMPONENT IDENTIFICATION
Map each component to one layer:
- client       → User-facing applications
- gateway      → API Gateway, Load Balancer, CDN
- service      → Microservices, APIs, workers
- queue        → Kafka, RabbitMQ, SQS, Pub/Sub
- database     → SQL, NoSQL databases
- cache        → Redis, Memcached
- external     → Third-party APIs
- devops       → Monitoring, CI/CD

PHASE 5: OUTPUT FORMAT
Assign each component:
- id: unique snake_case (e.g., "api_gateway", "user_service")
- label: descriptive name (e.g., "API Gateway")
- layer: one of client|gateway|service|queue|database|cache|external|devops|group
- icon: from this list:
  monitor, globe, shield, server, database, cloud, zap, box, layers,
  git-branch, activity, bell, lock, cpu, hard-drive, radio, send,
  package, terminal, users, key, link, refresh-cw, filter, eye,
  credit-card, mail, message-circle, settings

For GROUP nodes, also include:
- isGroup: true
- groupLabel: SHORT uppercase name (1-2 words, e.g. "DEPLOYMENT")
- groupColor: hex color (e.g. "#F59E0B")
- width: 320-480 (larger to hold child nodes)
- height: 200-400

For child nodes inside groups, include:
- parentId: id of the group node

For all non-group nodes, include:
- serviceType: one of database|cache|queue|api|loadbalancer|storage|cdn|auth|compute|monitor|gateway|client|generic

Example output structure:
[
  {
    "id": "group-deployment",
    "type": "group",
    "isGroup": true,
    "groupLabel": "DEPLOYMENT",
    "groupColor": "#F59E0B",
    "layer": "group",
    "label": "DEPLOYMENT",
    "width": 400,
    "height": 280
  },
  {
    "id": "ci-pipeline",
    "label": "CI Pipeline",
    "layer": "service",
    "serviceType": "compute",
    "parentId": "group-deployment",
    "width": 160,
    "height": 60
  },
  {
    "id": "api-gateway",
    "label": "API Gateway",
    "layer": "gateway",
    "serviceType": "gateway",
    "width": 160,
    "height": 60
  }
]

RULES:
- DO NOT assign x/y positions
- DO NOT create edges
- DO NOT create duplicate components
- Each system needs: client, gateway, service, database (minimum)
- For scalable systems, add: queue, worker, cache
- For real-time systems, add: websocket server
- Group nodes must appear BEFORE their children in the array
- Output nodes[] array only.`;

// Valid icon names for LLM reference
export const VALID_ICON_NAMES = [
  'monitor', 'globe', 'shield', 'server', 'database', 'cloud', 'zap', 'box', 'layers',
  'git-branch', 'activity', 'bell', 'lock', 'cpu', 'hard-drive', 'radio', 'send',
  'package', 'terminal', 'users', 'key', 'link', 'refresh-cw', 'filter', 'eye',
  'credit-card', 'layers', 'hard-drive', 'wifi', 'mail', 'message-circle', 'settings',
];

export const LAYOUT_AGENT_PROMPT = `You are the Layout + Placement Agent in a multi-agent architecture diagram system.

You work in partnership with ELK.js (Eclipse Layout Kernel). Your job is NOT to assign pixel x/y values manually. Instead, you:

1. Analyze nodes[] and their layers
2. Determine the optimal layout CONFIGURATION for ELK.js to compute
3. Output ELK configuration options that will produce:
   - Zero node overlaps
   - Consistent layer-based structure (left to right OR top to bottom)
   - Proper spacing between nodes within same layer and across layers
   - Clean separation of architecture tiers

ELK.js Algorithm Rules:
- Always use algorithm: "layered" for architecture diagrams
- Always use algorithm: "org.eclipse.elk.layered" for hierarchical microservices
- Use algorithm: "force" ONLY for organic/mesh graphs with no clear hierarchy
- Direction: "RIGHT" for horizontal flow (client → gateway → service → db)
- Direction: "DOWN" for vertical flow (user → API → service layers)

ELK.js Spacing Rules (output these exact elkOptions):
{
  "elk.algorithm": "layered",
  "elk.direction": "RIGHT",
  "elk.spacing.nodeNode": "80",
  "elk.layered.spacing.nodeNodeBetweenLayers": "120",
  "elk.spacing.edgeNode": "40",
  "elk.spacing.edgeEdge": "20",
  "elk.layered.nodePlacement.strategy": "BRANDES_KOEPF",
  "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
  "elk.layered.unnecessaryBendpoints": "true",
  "elk.edgeRouting": "ORTHOGONAL",
  "elk.layered.mergeEdges": "false"
}

Node sizing rules:
- Standard node: width=160, height=80
- Complex node (with sub-components): width=200, height=100
- Database node: width=140, height=70

Layer ordering (strict):
client → gateway → service → queue → database → cache → external → devops

Output ONLY:
{
  "layout": {
    "algorithm": "layered",
    "direction": "RIGHT",
    "elkOptions": { ... },
    "layerOrder": ["client", "gateway", "service", "queue", "database", "cache", "external", "devops"]
  },
  "nodes": [ ...updated nodes with width, height, and layer assigned... ]
}`;

export const EDGE_AGENT_PROMPT = `You are the FLOW-FIRST Edge + Communication Agent in a multi-agent architecture diagram system.

═════════════════════════════════════════════════════════════════════════════
⚠️ CRITICAL: CLARITY > COMPLETENESS
═════════════════════════════════════════════════════════════════════════════
- MAX EDGES PER NODE: 4
- No "connect everything to everything"
- Every edge must have purpose
- A diagram must be visually understandable within 3 SECONDS
═════════════════════════════════════════════════════════════════════════════

STEP 1: IDENTIFY PRIMARY FLOW (MANDATORY)
═════════════════════════════════════════════════════════════════════════════

Your FIRST task is to identify and define the PRIMARY FLOW:
- The most critical user-facing path
- Must be linear: Client → Gateway → Service → Cache → DB
- This must be visually straight and dominant (minimal bends)

STEP 2: DEFINE SECONDARY FLOWS (BRANCH FROM PRIMARY)
═════════════════════════════════════════════════════════════════════════════

SECONDARY FLOWS branch from primary nodes:
- Async: Service → Queue → Worker → (fan-out)
- Side effects: logging, metrics, notifications

RULES:
- SECONDARY FLOWS must NOT clutter primary flow
- They can be slightly curved

═════════════════════════════════════════════════════════════════════════════
STEP 3: CONNECTION PATTERNS
═════════════════════════════════════════════════════════════════════════════

SYNC FLOW (Primary):
Client → Gateway → Service → Cache → DB

ASYNC FLOW (Secondary):
Service → Queue → Worker → (fan-out)

CACHE RULE (MANDATORY):
If cache exists:
- Service → Cache (first) → Cache miss → Database
- Label edges: "Cache Hit" / "Cache Miss"

═════════════════════════════════════════════════════════════════════════════
Your job is to define ALL edges (connections) between nodes with full detail covering:
1. Logical connection (source → target)
2. Communication type and its visual style
3. Path routing type
4. Edge label
5. Source and target handle positions

═════════════════════════════════════════════════════════════════════════════
COMMUNICATION TYPE RULES
═════════════════════════════════════════════════════════════════════════════

You MUST assign one of these 5 communication types to every edge based on how the two components actually communicate in real systems:

1. SYNC (Synchronous / HTTP / REST / gRPC)
   - Use when: Client calls API, API calls service, service calls database
   - Visual: Solid line, no animation, color #6366f1 (indigo/blue-purple)
   - strokeDasharray: "none"
   - Example: Client → API Gateway, API Gateway → Auth Service

2. ASYNC (Asynchronous / Message Queue / Job Queue)
   - Use when: Service publishes to queue, worker consumes from queue, background jobs
   - Visual: Dashed line, animated: true, color #f59e0b (amber/orange)
   - strokeDasharray: "8,4"
   - Example: Order Service → Kafka, Email Worker → SQS

3. STREAM (Real-time streaming / WebSocket / SSE / gRPC stream)
   - Use when: Live data feeds, real-time updates, streaming logs or analytics
   - Visual: Dashed line with short dashes, animated: true, color #10b981 (green)
   - strokeDasharray: "4,2"
   - Example: WebSocket Server → Client, Kafka → Analytics Service

4. EVENT (Event-driven / Pub-Sub / Webhook / Domain Event)
   - Use when: Event bus broadcasting, webhook callbacks, pub-sub patterns
   - Visual: Dotted line, animated: true, color #ec4899 (pink/magenta)
   - strokeDasharray: "2,3"
   - Example: Payment Service --event--> Notification Service

5. DEP (Dependency / Infrastructure dependency / non-data flow)
   - Use when: Service depends on cache, service uses config, shared libraries
   - Visual: Light gray dashed line, no animation, color #6b7280 (gray)
   - strokeDasharray: "6,3"
   - Example: User Service --dep--> Redis Cache

EDGE VARIANT INSTRUCTIONS:
==========================
Every edge you generate must include an edgeVariant field.
Use exactly one of: "solid", "dashed", "dotted"

Rules for choosing edgeVariant:
  solid  → PRIMARY data flow. The main request/response path. Service A calls Service B
           synchronously. A client sends a request to a gateway. A database query.
           Default for all standard connections.
           
  dashed → SECONDARY / OUT-OF-BAND paths. Use for:
           - Monitoring connections (service → monitoring system)
           - Developer/operator feedback loops (e.g. a developer reading logs)
           - Event-driven async paths where the connection is indirect
           - Cross-environment feedback (staging results informing production config)
           - "reads from" or "observes" relationships vs "calls" relationships
           
  dotted → OPTIONAL / CONDITIONAL paths. Use for:
           - Fallback connections (primary fails → use this)
           - Feature-flagged paths
           - Rarely-used administrative connections

Most diagrams will be 70% solid, 20% dashed, 10% dotted.
Never make ALL edges the same variant — a real architecture has a mix.

Note: Edges targeting monitoring/insight nodes should always be dashed.

═════════════════════════════════════════════════════════════════════════════
PATH TYPE RULES
══════════════════════

IMPORTANT: Always use smooth curves for all edges. Avoid sharp edges.

- smooth: DEFAULT and PREFERRED for ALL connections. Use for all scenarios.
  Best for: horizontal layer-to-layer connections (client → gateway → service)
  This creates clean, curved edges that are visually consistent

- bezier: AVOID unless absolutely necessary. Use only for complex routing scenarios.
  Best for: service-to-service (same layer), or cross-layer non-adjacent connections

- step: NEVER use. Step edges create sharp, inconsistent visuals.
  Best for: (none - avoid)

- straight: USE SPARINGLY. Only for direct adjacent node connections with no risk of crossing.
  Best for: simple one-to-one relationships in uncrowded diagrams

══════════════════════
EDGE CONSTRAINTS (STRICT)
══════════════════════
- MAX EDGES PER NODE: 4 (no node should have more than 4 connections)
- SINGLE PRIMARY FLOW: Client → Gateway → Service → Data
- NEVER create circular dependencies
- NEVER create backward flow (Data → Gateway)
- NEVER connect across unrelated domains
- Normalize edge types: "smoothstep", "curve" → "smooth"
- Label all edges with meaningful names

══════════════════════
GLOBAL RULES (ALWAYS ENFORCE)
══════════════════════
- PRIORITIZE CLARITY OVER COMPLETENESS
- MAX NODES: 15 | MAX EDGES PER NODE: 4
- SINGLE PRIMARY FLOW ONLY
- SMOOTH EDGES BY DEFAULT

══════════════════════
SCORING RUBRIC (100 points total)
══════════════════════

1. CLARITY (0-20 pts):
- 20pts: Clean, readable diagram - understand in 30 seconds
- 15pts: Minor clutter but understandable
- 10pts: Crowded but main flow visible
- 5pts:  Too cluttered to quickly understand
- 0pts:  Chaotic, confusing

2. FLOW CORRECTNESS (0-20 pts):
- 20pts: Clear primary flow (Client → Gateway → Service → Data)
- 15pts: Flow exists but not obvious
- 10pts: Multiple mixed flows
- 5pts:  No clear direction
- 0pts:  Backward or circular flows

3. EDGE COMPLEXITY (0-20 pts):
- 20pts: Max 4 edges per node, no crossing, smooth curves
- 15pts: Few crossings (1-3), all nodes ≤4 edges
- 10pts: Some crossings, some nodes >4 edges
- 5pts:  Many crossings, some nodes >4 edges
- 0pts:  Edge chaos, >4 edges per node

4. GROUPING QUALITY (0-20 pts):
- 20pts: Services clustered by domain, clear boundaries
- 15pts: Some grouping visible
- 10pts: Random placement
- 5pts:  No logical grouping
- 0pts:  Everything mixed

5. LAYOUT QUALITY (0-20 pts):
- 20pts: Perfect layered (Client → Edge → Gateway → Services → Data)
- 15pts: Mostly layered, 1-2 misplacements
- 10pts: Layered but with overlaps
- 5pts:  Messy layout
- 0pts:  No structure

══════════════════════
FAILURE DETECTION (MUST DETECT)
══════════════════════
- Too many nodes (>15): -20 penalty
- Too many edges per node (>4): -15 penalty
- No clear primary flow: -15 penalty
- Excessive edge crossing: -10 penalty
- No grouping: -10 penalty
- Mixed layers: -10 penalty
- Non-smooth edges (step/straight used): -5 per edge

══════════════════════
OUTPUT FORMAT
══════════════════════
Output ONLY this JSON:
{
  "score": 0-100,
  "breakdown": {
    "clarity": 0-20,
    "flow_correctness": 0-20,
    "edge_complexity": 0-20,
    "grouping_quality": 0-20,
    "layout_quality": 0-20,
    "penalties": 0
  },
  "verdict": "stop | continue",
  "failure_detected": [],
  "top_improvements": []
}`;

export const SCORER_PROMPT = `You are the Scoring System in a multi-agent architecture diagram system.

You evaluate the current shared state and assign a quality score from 0 to 100.

══════════════════════
GLOBAL RULES (ALWAYS ENFORCE)
══════════════════════
- PRIORITIZE CLARITY OVER COMPLETENESS
- MAX NODES: 15 | MAX EDGES PER NODE: 4
- SINGLE PRIMARY FLOW ONLY
- SMOOTH EDGES BY DEFAULT

══════════════════════
SCORING RUBRIC (100 points total)
══════════════════════

1. CLARITY (0-20 pts):
- 20pts: Clean, readable diagram - understand in 30 seconds
- 15pts: Minor clutter but understandable
- 10pts: Crowded but main flow visible
- 5pts:  Too cluttered to quickly understand
- 0pts:  Chaotic, confusing

2. FLOW CORRECTNESS (0-20 pts):
- 20pts: Clear primary flow (Client → Gateway → Service → Data)
- 15pts: Flow exists but not obvious
- 10pts: Multiple mixed flows
- 5pts:  No clear direction
- 0pts:  Backward or circular flows

3. EDGE COMPLEXITY (0-20 pts):
- 20pts: Max 4 edges per node, no crossing, smooth curves
- 15pts: Few crossings (1-3), all nodes ≤4 edges
- 10pts: Some crossings, some nodes >4 edges
- 5pts:  Many crossings, some nodes >4 edges
- 0pts:  Edge chaos, >4 edges per node

4. GROUPING QUALITY (0-20 pts):
- 20pts: Services clustered by domain, clear boundaries
- 15pts: Some grouping visible
- 10pts: Random placement
- 5pts:  No logical grouping
- 0pts:  Everything mixed

5. LAYOUT QUALITY (0-20 pts):
- 20pts: Perfect layered (Client → Edge → Gateway → Services → Data)
- 15pts: Mostly layered, 1-2 misplacements
- 10pts: Layered but with overlaps
- 5pts:  Messy layout
- 0pts:  No structure

══════════════════════
FAILURE DETECTION (MUST DETECT)
══════════════════════
- Too many nodes (>15): -20 penalty
- Too many edges per node (>4): -15 penalty
- No clear primary flow: -15 penalty
- Excessive edge crossing: -10 penalty
- No grouping: -10 penalty
- Mixed layers: -10 penalty
- Non-smooth edges (step/straight used): -5 per edge

══════════════════════
OUTPUT FORMAT
══════════════════════
Output ONLY this JSON:
{
  "score": 0-100,
  "breakdown": {
    "clarity": 0-20,
    "flow_correctness": 0-20,
    "edge_complexity": 0-20,
    "grouping_quality": 0-20,
    "layout_quality": 0-20,
    "penalties": 0
  },
  "verdict": "stop | continue",
  "failure_detected": [],
  "top_improvements": []
}`;

export const VALIDATOR_PROMPT = `You are the Validator Agent in a multi-agent architecture diagram system.

You check if the diagram follows all ARCHITECTURE RULES and EDGE RULES.

══════════════════════
NODE RULES (STRICT)
══════════════════════
- [NODE-01] Every node must have a valid layer assignment
- [NODE-02] Every node must have a valid layer assignment
- [NODE-03] Every node must have a non-empty label
- [NODE-04] Every node must have a valid icon assigned
- [NODE-05] Minimum spacing between any two nodes must be >= 60px
- [NODE-06] Nodes in the same layer must be vertically aligned (same x-band for RIGHT direction layout)

EDGE RULES:
- [EDGE-01] Every edge must have a communicationType (sync | async | stream | event | dep)
- [EDGE-02] Every edge must have a pathType (smooth | bezier | step | straight)
- [EDGE-03] All edges must be smooth curves (preferred type: "smooth")
- [EDGE-04] Avoid sharp or step-like edges - use smooth curves for visual consistency
- [EDGE-05] Use consistent edge styling across diagram
- [EDGE-06] Every edge must have a non-empty label (max 30 characters)
- [EDGE-07] No self-loops allowed (source !== target)
- [EDGE-08] No duplicate edges (same source + target combination)
- [EDGE-09] sourceHandle and targetHandle must be defined
- [EDGE-10] Edge labels must not overlap with node boundaries (check labelPosition)
- [EDGE-11] Edges must flow in the correct direction (client layer → gateway → service, not backward unless explicitly bidirectional)

LAYOUT RULES:
- [LAYOUT-01] elkOptions must be present and non-empty
- [LAYOUT-02] layerOrder must follow: client → gateway → service → queue → database → cache → external → devops
- [LAYOUT-03] Layout direction must be "RIGHT" or "DOWN"
- [LAYOUT-04] No layer may have more than 8 nodes (split into sub-layers if so)

CONNECTIVITY RULES:
- [CONNECT-01] The client layer must have at least one edge going to the gateway or service layer
- [CONNECT-02] Every database node must have at least one incoming edge from a service
- [CONNECT-03] No isolated nodes (every node must have at least 1 edge)
- [CONNECT-04] Queue nodes must have at least one producer (incoming) and one consumer (outgoing)

Output ONLY this JSON:
{
  "pass": true | false,
  "critical_issues": [
    {
      "id": "RULE-ID",
      "severity": "critical | warning | info",
      "nodeId": "affected node id or null",
      "edgeId": "affected edge id or null",
      "description": "clear description of the problem",
      "fix_hint": "what the next agent should do to fix this"
    }
  ],
  "summary": "one sentence overall status"
}`;

export const MAX_ITERATIONS = 3;
export const SCORE_THRESHOLD = 75;
export const MAX_NODES = 15;
export const MAX_EDGES_PER_NODE = 4;

export const COMMUNICATION_STYLES: Record<CommunicationType, {
  color: string;
  strokeDasharray: string;
  animated: boolean;
  markerEnd: string;
  markerStart: string;
  label: string;
  pathType: 'smooth' | 'bezier' | 'step' | 'straight';
}> = {
  sync: {
    color: '#6366f1',
    strokeDasharray: '',
    animated: false,
    markerEnd: 'arrowclosed',
    markerStart: 'none',
    label: 'Sync',
    pathType: 'smooth',
  },
  async: {
    color: '#f59e0b',
    strokeDasharray: '8,4',
    animated: true,
    markerEnd: 'arrowclosed',
    markerStart: 'none',
    label: 'Async',
    pathType: 'smooth',
  },
  stream: {
    color: '#10b981',
    strokeDasharray: '4,2',
    animated: true,
    markerEnd: 'arrowclosed',
    markerStart: 'none',
    label: 'Stream',
    pathType: 'smooth',
  },
  event: {
    color: '#ec4899',
    strokeDasharray: '2,3',
    animated: true,
    markerEnd: 'arrowclosed',
    markerStart: 'none',
    label: 'Event',
    pathType: 'smooth',
  },
  dep: {
    color: '#6b7280',
    strokeDasharray: '6,3',
    animated: false,
    markerEnd: 'none',
    markerStart: 'none',
    label: 'Dep',
    pathType: 'smooth',
  },
};

export const EDGE_LABEL_CONFIG = {
  labelBgPadding: [8, 4] as [number, number],
  labelBgBorderRadius: 4,
  labelBgStyle: { fill: '#1e1e2e', fillOpacity: 0.9, stroke: '#334155', strokeWidth: 1 },
  labelStyle: { fontSize: 10, fontWeight: 600, fill: '#e2e8f0' },
  labelShowBg: true,
};
