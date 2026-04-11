export function getReadMe(): string {
  return `# ArchDraw Reference Guide

## TIER SYSTEM
7 layers in order (left to right in LR layout):

| Tier | Color | Hex | What belongs here |
|------|-------|-----|-------------------|
| client | purple | #a855f7 | Browser, Mobile App, Web Client |
| edge | indigo | #6366f1 | CDN, Load Balancer, API Gateway, WAF |
| compute | teal | #14b8a6 | API Server, Auth Service, Business Logic, Workers |
| async | amber | #f59e0b | Message Queue, Event Bus, Task Queue |
| data | blue | #3b82f6 | Database, Cache, Object Storage |
| external | orange | #f97316 | Third-party APIs, Payment gateways |
| observe | gray | #6b7280 | Monitoring, Logging, Tracing |

## COMMUNICATION TYPES
When to use each:

| Type | Use Case | Style |
|------|----------|-------|
| sync | Request/response (REST, gRPC) | Solid indigo line |
| async | Message queues, background jobs | Dashed amber, animated |
| stream | WebSockets, SSE, real-time data | Dashed green, animated |
| event | Pub/sub, event-driven patterns | Dashed pink, animated |
| dep | Build-time dependency | Dotted gray |

## EDGE STYLES
- sync: solid #6366f1
- async: dashed #f59e0b (animated)
- stream: dashed #10b981 (animated)
- event: dashed #ec4899 (animated)
- dep: dotted #94a3b8

## LAYOUT DIRECTION
- RIGHT (default): Left-to-right, good for most diagrams
- DOWN: Top-to-bottom, better for hierarchical/depth-first systems
- LEFT/RIGHT: Rarely needed

## BEST PRACTICES
1. Always assign every node to a tier
2. Client tier: 1-2 nodes max (keep it minimal)
3. Data tier nodes should NEVER connect directly to client tier
4. Use async/event for Kafka, queues, and pub-sub patterns
5. Observability nodes connect FROM compute/data, not TO them
6. Prefer 8-15 nodes for readable diagrams
7. External tier: third-party services only
8. Keep edge count reasonable - too many edges = messy diagram

## CANONICAL EXAMPLE
Minimal 5-node diagram showing correct structure:

\`\`\`json
{
  "nodes": [
    { "id": "client", "label": "Web Client", "tier": "client" },
    { "id": "api-gateway", "label": "API Gateway", "tier": "edge" },
    { "id": "user-service", "label": "User Service", "tier": "compute" },
    { "id": "postgres", "label": "PostgreSQL", "tier": "data" },
    { "id": "monitoring", "label": "Monitoring", "tier": "observe" }
  ],
  "edges": [
    { "id": "e1", "source": "client", "target": "api-gateway", "communicationType": "sync" },
    { "id": "e2", "source": "api-gateway", "target": "user-service", "communicationType": "sync" },
    { "id": "e3", "source": "user-service", "target": "postgres", "communicationType": "sync" },
    { "id": "e4", "source": "monitoring", "target": "user-service", "communicationType": "dep" }
  ],
  "direction": "RIGHT"
}
\`\`\`
`;
}
