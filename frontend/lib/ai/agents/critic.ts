import { callGroq, parseJSON, type GroqMessage } from '../groqPool';
import type { SynthesiserOutput } from './synthesiser';

export interface CriticOutput {
  score: number;
  passed: boolean;
  issues: string[];
  missingSystems: string[];
  incorrectEdges: string[];
  suggestions: string;
}

const SYSTEM_PROMPT_TEMPLATE = `You are an expert Software Architecture Diagram Critic Agent.

Your ONLY job is to evaluate AI-generated system architecture diagrams for completeness, accuracy, and quality.

You do NOT modify diagrams. You do NOT write code. You ONLY critique and score.

═══════════════════════════════════════════════════
QUALITY CRITERIA — CHECK EVERY ITEM
═══════════════════════════════════════════════════

[ ] NODE LABELING: Every node has name + technology + responsibility
    ✗ FAIL: Node with only a name like "Database" without technology
    ✗ FAIL: Sublabel is just "C", "B", "A", "Layer A" etc.

[ ] TECHNOLOGY LABELS: Every node specifies its exact technology
    ✓ PASS: "Auth Service | Firebase Auth | handles user login"
    ✗ FAIL: "Service" without specifying which technology

[ ] EDGE LABELS: Every arrow has a descriptive data-flow label
    ✓ PASS: "auth token", "order events", "payment webhook"
    ✗ FAIL: "data", "request", "response", "info", "null"

[ ] ARROW TYPES: Communication type matches the actual flow
    ✓ sync: REST/gRPC blocking calls
    ✓ async: Queue messages (Kafka, RabbitMQ, SQS)
    ✓ stream: WebSocket, SSE, real-time data
    ✓ event: Webhooks, push notifications
    ✓ dep: Cache reads, config lookups

[ ] AUTH FLOW: Both token issuance AND token validation shown
    ✗ FAIL: Only shows login but not JWT validation on requests

[ ] DATA FLOW: Primary path client → gateway → service → database labeled
    ✗ FAIL: Missing data labels on critical path hops

[ ] FEATURE EXPANSION: Each mentioned feature has ALL sub-components
    ✓ RAG: Embedding + Vector DB + LLM + Retrieval
    ✓ Auth: Auth Service + Token Store + JWT Validation
    ✓ Payment: Payment Service + Webhook Handler + Gateway
    ✓ Caching: Cache node + hit/miss flows

[ ] NO ORPHANS: Every node connects to at least one other
    ✗ FAIL: Node with zero edges

[ ] EXTERNAL APIS: Each Layer D node has edge from Layer B service
    ✗ FAIL: Third-party API with no incoming connection

[ ] LEGEND PRESENT: Arrow types and layer colors explained

[ ] DOMAIN COMPLETENESS: Cross-reference against known domain requirements

    For FOOD DELIVERY domains, check ALL of these exist:
    - Cart Service (for adding items to cart)
    - Order Service (for placing and managing orders)
    - Geolocation/Matching Service (for finding nearby drivers)
    - Rating Service (for post-delivery ratings)
    - Restaurant Dashboard or Restaurant Frontend (separate from user app)
    - Redis Cache (for live location caching)
    - Kafka or message queue (for order event streaming)
    - Google Maps or equivalent map API
    ✗ FAIL: Any of the above missing from a food delivery diagram

    For RIDE SHARING domains, check ALL of these exist:
    - Matching/Dispatch Engine
    - Trip State Machine
    - Driver App (separate from Rider App)
    - Redis Pub/Sub (for live location)
    - Rating Service
    ✗ FAIL: Any of the above missing from a ride sharing diagram

    For E-COMMERCE domains, check ALL of these exist:
    - Cart Service
    - Inventory Service
    - Order Service
    - Search Service
    ✗ FAIL: Any of the above missing from an e-commerce diagram

═══════════════════════════════════════════════════
TIER-AWARE SCORING
═══════════════════════════════════════════════════
Adjust expectations based on complexity tier:

tier1 (basic, <15 words):
  - EXPECT: 10-13 nodes covering essential backbone
  - DEDUCT: Over 13 nodes (over-engineering)
  - DEDUCT: More than 2 nodes in same column (unrelated)

tier2 (medium, 15-40 words):
  - EXPECT: 14-18 nodes covering core + supporting services
  - ACCEPT: Auth, notification, search, basic caching

tier3 (detailed, 40+ words with features):
  - EXPECT: 18-26 nodes with ALL explicitly mentioned features
  - DEDUCT: 2 points per missing feature node
  - ACCEPT: Full infrastructure, multiple DBs, queues

═══════════════════════════════════════════════════
SCORING RUBRIC (1-10)
═══════════════════════════════════════════════════

BASE SCORE: Start at 10. Deduct for each issue found.

DEDUCTIONS:
- Missing node for explicitly mentioned feature: -2 per feature
- Missing node for domain-implied service (e.g. Cart for food delivery): -1 per service
- Orphaned node (no edges): -1 per node
- Wrong edge type (sync where async required, etc.): -0.5 per edge
- Hallucinated technology name: -1 per node
- Sublabel showing layer code ("C", "B", "AS"): -0.5 per node
- Admin Panel with no edges: -2 (this is a critical structural failure)
- Layer D node with no incoming edge from Layer B: -1 per node

FINAL THRESHOLDS:
9-10: Production-ready. All features present. Edges correct. Pass.
7-8: Minor omissions. Pass only for tier1/tier2.
Below 7: Must regenerate. Always fail.
Below 5: Critical features missing. Always fail.

IMPORTANT: For tier3 descriptions, the passing threshold is 9, not 8.
A tier3 diagram with ANY explicitly mentioned feature missing scores maximum 7
and must FAIL for regeneration.

═══════════════════════════════════════════════════
OUTPUT FORMAT (JSON only)
═══════════════════════════════════════════════════
{
  "score": 0-10,
  "passed": true/false,
  "issues": ["specific problem 1", "specific problem 2"],
  "missingSystems": ["feature that has no node"],
  "incorrectEdges": ["edge with wrong type or direction"],
  "suggestions": "How to fix each issue listed above"
}

Be strict. Score 8+ = production-ready. Below 8 = must fix issues.`;

export async function runCritic(
  userDescription: string,
  synthesiserOutput: SynthesiserOutput,
  complexityTier: 'tier1' | 'tier2' | 'tier3',
  issues?: string[]
): Promise<CriticOutput> {
  const retryContext = issues && issues.length > 0
    ? `\n\nNOTE: This is a revised diagram. Previous issues were: ${issues.join('; ')}. Check if they are now fixed.`
    : '';

  const messages: GroqMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT_TEMPLATE },
    {
      role: 'user',
      content: `COMPLEXITY TIER: ${complexityTier}
${complexityTier === 'tier1' ? 'REMINDER: This is a basic diagram. 10-13 nodes is correct. Penalise over-complexity.' : ''}
${complexityTier === 'tier3' ? 'REMINDER: Every explicitly mentioned feature must have a dedicated node. The passing threshold for tier3 is 9, not 8.' : ''}

USER DESCRIPTION: "${userDescription}"${retryContext}

GENERATED DIAGRAM:
Nodes (${synthesiserOutput.nodes.length}):
${synthesiserOutput.nodes.map((n) => `- ${n.label} [${n.layer}]: ${n.sublabel}`).join('\n')}

Edges (${synthesiserOutput.edges.length}):
${synthesiserOutput.edges.map((e) => {
  const src = synthesiserOutput.nodes.find((n) => n.id === e.source)?.label ?? e.source;
  const tgt = synthesiserOutput.nodes.find((n) => n.id === e.target)?.label ?? e.target;
  return `- ${src} →[${e.edgeType}]→ ${tgt}: "${e.label}"`;
}).join('\n')}

Review this diagram and provide your assessment.`,
    },
  ];

  const raw = await callGroq({
    agentRole: 'critic',
    model: 'llama-3.3-70b-versatile',
    messages,
    maxTokens: 1500,
    temperature: 0.1,
  });

  const output = parseJSON<CriticOutput>(raw, 'Critic');
  output.passed = complexityTier === 'tier3'
    ? output.score >= 9
    : output.score >= 8;
  return output;
}
