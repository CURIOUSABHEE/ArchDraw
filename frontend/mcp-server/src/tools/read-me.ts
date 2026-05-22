export function getReadMe(): string {
  return `# ArchDraw MCP Reference Guide

## ⚡ DIAGRAM GENERATION RULES (MANDATORY - ALWAYS FOLLOW THESE)

1. **LAYOUT ALGORITHM**: ALWAYS use a ranked/layered layout (Dagre, ELK, or Graphviz dot engine). Direction: LEFT TO RIGHT (rankdir=LR) or TOP TO BOTTOM (rankdir=TB). Never place nodes with random/arbitrary x,y coordinates. Minimum rank separation: 120px between tiers. Minimum node separation: 60px within same tier.
2. **NODE SIZING — NO TRUNCATION EVER**: Node width = auto-fit to longest text line + 40px padding on each side. Node height = auto-fit to number of text lines + 20px padding top/bottom. NEVER hardcode a fixed width smaller than the label. If subtitle exists, calculate width based on whichever line is longer. Minimum node width: 180px. No maximum.
3. **TIERED STRUCTURE — MANDATORY**: Group all nodes into explicit tiers before rendering: Tier 1 → Entry points (Client, Browser, Mobile). Tier 2 → Infrastructure (Load Balancer, CDN, API Gateway). Tier 3 → Services (Auth, Business Logic, Workers). Tier 4 → Data Layer (Databases, Cache, Queue). Nodes in the same tier must be vertically aligned. No node from Tier N should visually overlap with Tier N+1.
4. **EDGE ROUTING — NO CROSSING OR OVERLAPPING**: Use orthogonal (right-angle) or curved (bezier) routing — never straight diagonal lines that cross nodes. Edges must never pass through a node bounding box. If two edges share a path, offset them by at least 8px. Sync connections (REST, HTTPS, SQL, gRPC) → solid lines. Async connections (AMQP, Kafka, Queue, Pub/Sub) → dashed lines. Always label edges with protocol name (REST, HTTPS, SQL, AMQP, etc.). Arrow direction must clearly show data/request flow.
5. **COLLISION DETECTION — NO OVERLAPPING NODES**: After placing all nodes, run a bounding box collision check. If any two nodes overlap, increase node separation and re-layout. Nodes must have a minimum margin of 40px between each other on all sides. If a tier has too many nodes, split into sub-tiers or increase canvas height.
6. **COLOR & VISUAL GROUPING**: Color-code nodes by category, not randomly: Infrastructure → Gray (#6B7280). Auth/Security → Purple (#7C3AED). Services → Blue (#2563EB). Async/Queue → Orange (#D97706). Databases → Green (#059669). Cache → Teal (#0891B2). Use same color for border and icon; light tint for fill (10% opacity). Group related nodes inside a labeled bounding box/container (isGroup).
7. **TYPOGRAPHY**: Primary label: Bold, 13-14px, full name (NO ellipsis, NO truncation). Subtitle: Regular, 11px, tech stack (e.g., "MySQL, PostgreSQL"). Edge labels: 10px, italic, placed at midpoint of edge. Font: Inter, Roboto, or any clean sans-serif.
8. **CANVAS & OUTPUT**: Auto-size the canvas to fit all nodes + 80px padding on all sides. Never clip any node or label at canvas boundary. Export/render at minimum 1400px wide for complex diagrams. Background: White (#FFFFFF) or Off-white (#F9FAFB).

---

## TIER SYSTEM
7 layers in order (left→right in LR layout, top→bottom in DOWN layout):

| Tier | Color | Hex | What belongs here |
|------|-------|-----|-------------------|
| client | slate | #64748b | Browser, Mobile App, Web Client, CLI |
| edge | indigo | #6366f1 | CDN, Load Balancer, API Gateway, WAF, Nginx |
| compute | teal | #0d9488 | API Server, Auth Service, Business Logic, Workers |
| async | amber | #d97706 | Message Queue, Event Bus, Task Queue, Kafka, SQS |
| data | blue | #3b82f6 | PostgreSQL, Redis, MongoDB, S3, Elasticsearch |
| external | violet | #8b5cf6 | Stripe, Twilio, SendGrid, Maps API, OAuth providers |
| observe | gray | #6b7280 | Prometheus, Grafana, Jaeger, Datadog, ELK Stack |

---

## GROUPS (REQUIRED)
Groups are visual containers that cluster related nodes. **Every diagram must have at least one.**

### Group node fields:
\`\`\`json
{
  "id": "backend_group",
  "label": "Backend Services",
  "tier": "compute",
  "subtitle": "Core application API layer",
  "isGroup": true,
  "groupColor": "#0f172a",
  "width": 560,
  "height": 300,
  "icon": "layers"
}
\`\`\`

### Child node (placed inside a group):
\`\`\`json
{
  "id": "user_api",
  "label": "User API",
  "tier": "compute",
  "subtitle": "CRUD for user accounts",
  "parentId": "backend_group",
  "icon": "user",
  "accentColor": "#0d9488"
}
\`\`\`

### Group sizing guide:
- 2 children → 400×200
- 3-4 children → 550×280
- 5-6 children → 700×350
- Groups do NOT connect to edges — only leaf nodes do

---

## NODE PROPERTIES (full reference)

| Field | Required | Description |
|-------|----------|-------------|
| id | YES | Snake_case unique identifier |
| label | YES | 1-3 word display name |
| tier | YES | One of 7 tier values |
| subtitle | YES | Specific description (e.g. "PostgreSQL 15, handles orders table") |
| isGroup | when grouping | true = renders as swimlane container |
| parentId | when child | ID of parent group node |
| groupColor | for groups | Background tint hex (e.g. "#0f172a") |
| icon | recommended | Lucide icon name (use list_node_types) |
| accentColor | optional | Override color for visual diff within same tier |
| status | optional | healthy / warning / error / unknown |
| width/height | for groups | Set larger than content |

**Available accentColors**: #3b82f6 #0ea5e9 #06b6d4 #14b8a6 #22c55e #f59e0b #f97316 #ef4444 #ec4899 #6b7280 #f43f5e #a855f7 #84cc16 #fb923c #0ea5e9

---

## COMMUNICATION TYPES

| Type | Use Case | Visual |
|------|----------|--------|
| sync | REST, gRPC, HTTP request-response | Solid slate gray |
| async | Kafka, SQS, background jobs | Dashed amber, animated |
| stream | WebSocket, SSE, real-time feeds | Dashed green, animated |
| event | Pub/sub, domain events | Dashed pink, animated |
| dep | Build-time / config dependency | Dotted gray |

**Edge label rules:**
- sync: label optional (e.g. "GET /users", "JWT auth")
- async/event/stream: label REQUIRED (e.g. "order.created", "payment.processed")
- dep: label optional (e.g. "config", "env vars")

---

## LAYOUT DIRECTION
- **RIGHT** (default): Left-to-right tiers. Best for microservices, API architectures
- **DOWN**: Top-to-bottom. Best for pipelines, mobile-first, CI/CD flows

---

## BEST PRACTICES
1. Client tier: 1-2 nodes max
2. Data tier NEVER connects directly to client tier
3. Observability nodes use \`dep\` edges FROM them (not TO them)
4. Use \`accentColor\` to differentiate services within the same compute tier
5. Add \`status: "warning"\` or \`"error"\` to highlight problem areas
6. Groups should use their tier's color as \`groupColor\` tinted darker
7. External tier only for third-party services (not your own microservices)
8. Prefer \`pathType: "Smoothstep"\` for most edges; \`"step"\` for right-angle flows

---

## CANONICAL FULL EXAMPLE
A well-structured 12-node diagram with groups:

\`\`\`json
{
  "label": "E-Commerce Platform",
  "direction": "RIGHT",
  "nodes": [
    { "id": "web_client", "label": "Web App", "tier": "client", "subtitle": "React SPA, Next.js", "icon": "globe" },
    { "id": "mobile_client", "label": "Mobile App", "tier": "client", "subtitle": "React Native iOS/Android", "icon": "smartphone" },
    { "id": "api_gateway", "label": "API Gateway", "tier": "edge", "subtitle": "Rate limiting, auth routing, SSL termination", "icon": "shield" },

    { "id": "backend_group", "label": "Core Services", "tier": "compute", "subtitle": "Business logic layer", "isGroup": true, "groupColor": "#042f2e", "width": 600, "height": 320 },
    { "id": "order_svc", "label": "Order Service", "tier": "compute", "subtitle": "Create & manage orders, inventory check", "parentId": "backend_group", "icon": "shopping-cart", "accentColor": "#0d9488" },
    { "id": "user_svc", "label": "User Service", "tier": "compute", "subtitle": "Auth, profiles, sessions", "parentId": "backend_group", "icon": "user", "accentColor": "#6366f1" },
    { "id": "payment_svc", "label": "Payment Service", "tier": "compute", "subtitle": "Stripe integration, refund logic", "parentId": "backend_group", "icon": "credit-card", "accentColor": "#8b5cf6" },

    { "id": "order_queue", "label": "Order Queue", "tier": "async", "subtitle": "Kafka topic: orders.created", "icon": "zap" },

    { "id": "data_group", "label": "Data Layer", "tier": "data", "subtitle": "Persistent storage", "isGroup": true, "groupColor": "#0c1a2e", "width": 440, "height": 240 },
    { "id": "postgres", "label": "PostgreSQL", "tier": "data", "subtitle": "Primary DB — users, orders, products", "parentId": "data_group", "icon": "database" },
    { "id": "redis", "label": "Redis Cache", "tier": "data", "subtitle": "Session store, rate limit counters", "parentId": "data_group", "icon": "zap" },

    { "id": "stripe", "label": "Stripe", "tier": "external", "subtitle": "Payment gateway, webhooks", "icon": "credit-card" },
    { "id": "monitoring", "label": "Grafana", "tier": "observe", "subtitle": "Metrics, dashboards, alerting", "icon": "activity" }
  ],
  "edges": [
    { "id": "e1", "source": "web_client", "target": "api_gateway", "communicationType": "sync", "label": "HTTPS" },
    { "id": "e2", "source": "mobile_client", "target": "api_gateway", "communicationType": "sync", "label": "REST API" },
    { "id": "e3", "source": "api_gateway", "target": "order_svc", "communicationType": "sync", "label": "POST /orders" },
    { "id": "e4", "source": "api_gateway", "target": "user_svc", "communicationType": "sync", "label": "GET /users" },
    { "id": "e5", "source": "order_svc", "target": "order_queue", "communicationType": "async", "label": "order.created" },
    { "id": "e6", "source": "order_queue", "target": "payment_svc", "communicationType": "async", "label": "process payment" },
    { "id": "e7", "source": "payment_svc", "target": "stripe", "communicationType": "sync", "label": "charge API" },
    { "id": "e8", "source": "order_svc", "target": "postgres", "communicationType": "sync" },
    { "id": "e9", "source": "user_svc", "target": "redis", "communicationType": "sync", "label": "session cache" },
    { "id": "e10", "source": "monitoring", "target": "order_svc", "communicationType": "dep" },
    { "id": "e11", "source": "monitoring", "target": "postgres", "communicationType": "dep" }
  ]
}
\`\`\`
`;
}
