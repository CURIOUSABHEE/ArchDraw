import type { TierType } from '../domain/tiers';
import { TIER_ORDER, getTierFromLayer } from '../domain/tiers';
import { TIER_THEMES } from '../domain/designSystem';

export interface PromptModule {
  name: string;
  content: string;
  priority: number;
}

export interface PromptContext {
  useAWS: boolean;
  complexity: 'low' | 'medium' | 'high';
  minNodes: number;
  maxNodes: number;
}

const DEFAULT_CONTEXT: PromptContext = {
  useAWS: false,
  complexity: 'medium',
  minNodes: 12,
  maxNodes: 20,
};

const BASE_RULES: PromptModule = {
  name: 'base_rules',
  priority: 1,
  content: `CRITICAL RULES:
1. Use GENERIC/CLOUD-NEUTRAL components unless the user explicitly mentions a cloud provider (AWS, Azure, GCP)
2. Every node must belong to exactly ONE tier
3. Async components (queues, event bus) MUST have their own column - never share with compute tier
4. All edges flow LEFT-TO-RIGHT only - no backward or diagonal arrows
5. NO edge labels - encode meaning as node subtitles instead
6. Color encodes tier, not brand
7. Group containers are dashed rectangles with tier labels`,
};

const TIER_MODULE: PromptModule = {
  name: 'tiers',
  priority: 2,
  content: `TIER SYSTEM:
Client (PURPLE): Browser, Mobile App, Web App
Edge (PURPLE #8b5cf6): CDN, Load Balancer, API Gateway, WAF, DNS
Compute (TEAL #14b8a6): API Server, Auth Service, Business Logic, Workers, Functions
Async (AMBER #f59e0b): Message Queue, Event Bus, Task Queue (own column!)
Data (BLUE #3b82f6): Database, Cache, Object Storage, File System
Observe (GRAY #6b7280): Monitoring, Logging, Tracing
External: Third-party APIs, Payment gateways`,
};

const AWS_ADDENDUM: PromptModule = {
  name: 'aws_addendum',
  priority: 3,
  content: `AWS SERVICES (use only if mentioned or explicitly required):
Edge: CloudFront, API Gateway, ALB, Route53, WAF
Compute: Lambda, ECS, EKS, EC2, Fargate
Data: RDS, DynamoDB, Aurora, ElastiCache, S3
Async: SQS, SNS, EventBridge, Kinesis
Observe: CloudWatch, X-Ray, CloudTrail`,
};

const GENERIC_SERVICES: PromptModule = {
  name: 'generic_services',
  priority: 3,
  content: `GENERIC SERVICES (use these by default):
Edge: CDN, Load Balancer, API Gateway, WAF, DNS
Compute: API Server, Auth Service, Business Logic, Worker, Container
Data: PostgreSQL, MongoDB, Redis, S3, Blob Storage
Async: RabbitMQ, Kafka, Redis Queue, Event Bus
Observe: Prometheus, Grafana, ELK Stack`,
};

const OUTPUT_FORMAT: PromptModule = {
  name: 'output_format',
  priority: 4,
  content: `OUTPUT FORMAT (JSON only, no markdown):
[
  {
    "id": "unique-id",
    "label": "Service Name",
    "subtitle": "role description",
    "tier": "tier-name",
    "tierColor": "#hexcolor",
    "serviceType": "service-type",
    "technology": "generic-service or aws-service",
    "tech": "specific-technology",
    "width": 180,
    "height": 70
  },
  {
    "id": "tier-edge",
    "label": "EDGE",
    "isGroup": true,
    "groupLabel": "Edge / Routing",
    "groupColor": "#8b5cf6",
    "tier": "edge",
    "width": 400,
    "height": 200
  }
]

TECH FIELD INSTRUCTION:
For each node, include a 'tech' field with the specific technology name in lowercase.
Examples: a PostgreSQL database node gets tech: 'postgres'. A Kafka queue gets tech: 'kafka'.
A Next.js service gets tech: 'nextjs'. A Redis cache gets tech: 'redis'.
A generic service with no specific technology gets tech: 'service'.
Use only these exact tech strings: postgres, mysql, mongodb, redis, kafka, rabbitmq, sqs,
nodejs, python, golang, typescript, javascript, react, nextjs, vue, angular, django, fastapi,
nginx, docker, kubernetes, aws, gcp, azure, prometheus, grafana, datadog, service, database,
queue, cache, worker, user, external, gateway, loadbalancer, auth, firewall, monitoring.
If none match, use 'service' as the default.`,
};

const MIN_NODES: PromptModule = {
  name: 'min_nodes',
  priority: 5,
  content: `MINIMUM REQUIREMENTS:
- Generate 12-20 nodes minimum
- Include all tiers that make sense for the architecture
- Every tier container must have at least 1 child node
- No empty groups or orphaned nodes`,
};

const EXAMPLES: PromptModule = {
  name: 'examples',
  priority: 6,
  content: `EXAMPLES: 

User: "e-commerce website"
Output: Client → CDN → Load Balancer → API Gateway → [Auth, Product, Order] → Message Queue → [Email Worker, Notification Worker] → [PostgreSQL, Redis] → Monitoring

User: "real-time chat app"
Output: Client → CDN → Load Balancer → WebSocket Server → [Auth, Chat, Presence] → Redis Pub/Sub → [Notification, Analytics] → [PostgreSQL, Redis, S3]`,
};

// IMPORTANT: Prevent abstract layer nodes - add after EXAMPLES
const ABSTRACT_LAYER_RULE: PromptModule = {
  name: 'no_abstract_layers',
  priority: 7,
  content: `IMPORTANT - DO NOT GENERATE ABSTRACT LAYERS:
- DO NOT create nodes like "Application Layer", "Data Layer", "Gateway Layer", "Service Layer"
- DO NOT create nodes ending in "Layer" or "Tier" (e.g., "Presentation Tier")
- DO NOT create abstract organizational concepts like "Backend Services", "Infrastructure", "System"
- Each node must be a CONCRETE, DEPLOYABLE service or infrastructure component
- Acceptable: "API Gateway", "PostgreSQL Database", "Redis Cache", "React Web App"
- NOT acceptable: "Application Layer", "Data Tier", "Service Mesh Layer"`,
};

export function buildComponentPrompt(
  userDescription: string,
  context: Partial<PromptContext> = {}
): string {
  const ctx = { ...DEFAULT_CONTEXT, ...context };
  
  const modules: PromptModule[] = [BASE_RULES, TIER_MODULE];
  
  if (ctx.useAWS) {
    modules.push(AWS_ADDENDUM);
  } else {
    modules.push(GENERIC_SERVICES);
  }
  
  modules.push(OUTPUT_FORMAT, MIN_NODES, EXAMPLES, ABSTRACT_LAYER_RULE);
  
  modules.sort((a, b) => a.priority - b.priority);
  
  const prompt = `You are an ARCHITECT creating architecture diagrams.

${modules.map(m => m.content).join('\n\n')}

USER REQUEST:
${userDescription}

Generate components matching the user's request exactly. Output ONLY JSON.`;
  
  return prompt;
}

export function buildEdgePrompt(
  userDescription: string,
  nodes: { id: string; label: string; tier: string }[],
  context: Partial<PromptContext> = {}
): string {
  const ctx = { ...DEFAULT_CONTEXT, ...context };
  const nodeCount = nodes.length;
  const minRequiredEdges = Math.max(8, Math.floor(nodeCount * 0.8));
  
  return `Create edges for this architecture based on the user's description.

${BASE_RULES.content}

CRITICAL MINIMUM EDGE REQUIREMENT:
- You MUST generate AT LEAST ${minRequiredEdges} edges
- Every node must have at least 1 connection (incoming OR outgoing)
- Missing edges are a CRITICAL FAILURE
- Every single node ID listed below MUST appear as a source or target in at least one edge
- Nodes frequently missed (gateway, storage, clients, cdn, monitoring) MUST still be connected

EDGES MUST:
- Connect tiers in correct order: client → edge → compute → async → data
- Async tier connects to compute tier (producers) and other tiers (consumers)
- Observe tier only receives connections, never initiates
- Use communication types: sync, async, stream, event, dep

AVAILABLE NODES (${nodeCount} nodes):
${nodes.map(n => `- ${n.id} (${n.tier}): ${n.label}`).join('\n')}

USER FLOW DESCRIPTION:
${userDescription}

OUTPUT FORMAT (JSON only):
{
  "edges": [
    {
      "id": "edge-1",
      "source": "node-id",
      "target": "node-id",
      "communicationType": "sync|async|stream|event|dep"
    }
  ]
}

FINAL SELF-CHECK BEFORE OUTPUT:
1) Verify each node id from the AVAILABLE NODES list appears in at least one edge.
2) If any are missing, add edges for them before returning.

REMEMBER: At least ${minRequiredEdges} edges required!`;
}

export function buildLayoutPrompt(
  nodes: { id: string; tier: string; width: number; height: number }[]
): string {
  return `Configure layout for these architecture components.

TIER POSITIONS (left-to-right):
1. Client: x=50
2. Edge: x=320
3. Compute: x=650
4. Async: x=1000 (own column!)
5. Data: x=1350
6. Observe: x=1700

NODES TO LAYOUT:
${nodes.map(n => `- ${n.id} (${n.tier}): ${n.width}x${n.height}`).join('\n')}

OUTPUT FORMAT (JSON only):
{
  "layout": {
    "algorithm": "layered",
    "direction": "RIGHT",
    "elkOptions": { ... },
    "tierOrder": ["client", "edge", "compute", "async", "data", "observe"]
  },
  "nodes": [ ... nodes with tier assigned ... ]
}`;
}

export function buildScorerPrompt(
  nodes: unknown[],
  edges: unknown[],
  userDescription: string
): string {
  return `Score this architecture diagram (0-100).

EVALUATION CRITERIA:
1. Layout Quality (25pts): Nodes arranged by tier, no overlaps
2. Containment (25pts): Proper VPC/grouping for related components
3. Edge Quality (20pts): Sparse edges, no clutter
4. Intent Match (20pts): Matches user description
5. Simplicity (10pts): 8-15 nodes preferred

CURRENT DIAGRAM:
Nodes: ${nodes.length}
Edges: ${edges.length}

USER DESCRIPTION:
${userDescription}

OUTPUT FORMAT (JSON only):
{
  "score": 0-100,
  "breakdown": {
    "layout": 0-25,
    "containment": 0-25,
    "edges": 0-20,
    "intent": 0-20,
    "simplicity": 0-10
  },
  "verdict": "stop|continue",
  "issues": ["list of issues"]
}`;
}
