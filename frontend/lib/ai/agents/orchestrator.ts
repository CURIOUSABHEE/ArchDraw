import { callGroq, parseJSON, type GroqMessage } from '../groqPool';

export interface OrchestratorOutput {
  projectName: string;
  domain: string;
  actors: string[];
  scale: string;
  implicitNeeds: string[];
  complexityScore: number;
  complexityTier: 'tier1' | 'tier2' | 'tier3';
  tierReason: string;
  needsClarification: boolean;
  clarificationQuestion: string | null;
  briefA: string;
  briefB: string;
  briefC: string;
  briefD: string;
}

const SYSTEM_PROMPT = `You are a senior software architect and requirements analyst designing large-scale distributed systems.

Your job: given ANY project description (even vague ones), produce a COMPREHENSIVE analysis that covers explicit and implied needs.

== IMPLICIT EXPANSION RULES ==
Apply AUTOMATICALLY:
"real-time/tracking" → WebSocket, Redis pub/sub, location queue
"payments" → payment gateway, webhook handler, ledger
"notifications" → FCM/APNs, notification queue
"food delivery" → order state machine, restaurant service, dispatch engine
"login/auth" → auth service, JWT service, rate limiter
"search" → Elasticsearch, indexing pipeline
"dashboard" → admin BFF, analytics service
"media" → CDN, S3, image processing

== COMPLEXITY SCALING RULES (STRICT — DO NOT VIOLATE) ==
Calculate description word count. Apply the matching tier:

TIER 1 — BASIC (under 15 words, e.g. "app like Netflix", "food delivery app"):
  - Target: 12 to 14 nodes. Never fewer than 12.
  - Exception: if the description mentions TWO distinct user-facing features
    (e.g. "book appointments AND consult online"), treat as TIER 2 floor.
    Add ONE additional service per extra explicit feature (e.g. Video Consultation Service).
  - Layer A: 2 nodes (1 client + 1 API Gateway)
  - Layer B: 4-5 nodes (auth + core services for each explicit feature)
  - Layer C: 2-3 nodes (primary DB + cache + optional queue)
  - Layer D: 2-3 nodes (payment + notification + video provider if real-time mentioned)
  - Do NOT include: analytics, monitoring, CI/CD, multiple DB types
  - Each subagent brief for tier1 MUST end with this exact sentence:
    "HARD STOP: Produce exactly 3 services maximum. Stop after 3."

TIER 2 — MEDIUM (15 to 40 words):
  - Target node count: 14 to 18 nodes
  - Include core services plus one layer of supporting services (notifications, search, auth)
  - Limit data layer to 2-3 stores maximum
  - Each subagent brief must say: "This is a MEDIUM tier diagram. Produce 3-5 services."

TIER 3 — DETAILED (40+ words with specific features mentioned):
  - Target node count: 18 to 26 nodes
  - Every EXPLICITLY MENTIONED feature must have a dedicated node
  - Include full supporting infrastructure
  - Each subagent brief must say: "This is a DETAILED tier diagram. Produce 5-7 services."

== HARD NODE COUNT CAPS ==
tier1: MAXIMUM 14 nodes. If you instruct subagents to produce more, the diagram will be rejected.
       Each subagent brief for tier1 must end with: "HARD STOP: Produce exactly 3 services maximum. Stop after 3."
tier2: MAXIMUM 18 nodes total.
tier3: MAXIMUM 24 nodes total.

== ANTI-HALLUCINATION NODE RULES ==
NEVER instruct subagents to add:
1. The API of the product being built (building Uber → no "Uber API", building LinkedIn → no "LinkedIn API")
2. Monitoring/observability tools (Prometheus, Grafana, Datadog) unless explicitly mentioned
3. CI/CD tools (Jenkins, GitHub Actions) unless explicitly mentioned
4. Multiple variants of the same service (do not add both "FCM" and "APNs" and "AWS SNS" for tier1 — pick ONE)
5. Edge labels that are not meaningful data descriptions

For tier1, Layer D (external APIs) should have MAXIMUM 2 nodes — pick only the most critical ones.

== SUBAGENT BRIEF REQUIREMENTS ==
Each brief must:
1. List EVERY specific service the subagent must produce
2. Give sublabel (2-4 word description)
3. Specify communicationType for each connection
4. Tell the subagent the tier constraint.

== LAYERS ==
Layer A (Client): Mobile, Web, DNS, CDN, API Gateway, BFF
Layer B (Logic): Auth, Order, Matching, Notification, Search, Trip state (NO databases/caches)
Layer C (Data): Postgres, Redis, Kafka, S3, Mongo
Layer D (External): Stripe, Maps, Twilio, FCM, AWS SNS

EXAMPLE OUTPUT:
{
  "projectName": "Netflix Clone",
  "domain": "video streaming",
  "actors": ["users"],
  "scale": "medium",
  "implicitNeeds": ["video delivery", "auth"],
  "complexityScore": 4,
  "complexityTier": "tier1",
  "tierReason": "The prompt was 'app like netflix' (3 words), mapping to TIER 1 basic structure.",
  "needsClarification": false,
  "briefA": "This is a BASIC tier diagram. Produce maximum 3 services. You are analyzing Client Layer...",
  "briefB": "This is a BASIC tier diagram. Produce maximum 3 services. You are analyzing Logic Layer...",
  "briefC": "This is a BASIC tier diagram. Produce maximum 3 services. You are analyzing Data Layer...",
  "briefD": "This is a BASIC tier diagram. Produce maximum 3 services. You are analyzing External Layer..."
}
Respond ONLY with valid JSON. No Markdown block.`;

export async function runOrchestrator(description: string): Promise<OrchestratorOutput> {
  const messages: GroqMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Analyze this project and return the comprehensive JSON:\n\n"${description}"`,
    },
  ];

  const raw = await callGroq({
    agentRole: 'orchestrator',
    model: 'llama-3.3-70b-versatile',
    messages,
    maxTokens: 4000,
    temperature: 0.05,
  });

  const parsed = parseJSON<any>(raw, 'Orchestrator');
  const normalized: Partial<OrchestratorOutput> = { ...parsed };

  if (!normalized.briefA) normalized.briefA = parsed.brief_a ?? parsed.layer_a_brief ?? '';
  if (!normalized.briefB) normalized.briefB = parsed.brief_b ?? parsed.layer_b_brief ?? '';
  if (!normalized.briefC) normalized.briefC = parsed.brief_c ?? parsed.layer_c_brief ?? '';
  if (!normalized.briefD) normalized.briefD = parsed.brief_d ?? parsed.layer_d_brief ?? '';

  if (!normalized.briefA && Array.isArray(parsed.briefs)) {
    normalized.briefA = parsed.briefs[0] ?? '';
    normalized.briefB = parsed.briefs[1] ?? '';
    normalized.briefC = parsed.briefs[2] ?? '';
    normalized.briefD = parsed.briefs[3] ?? '';
  }

  const output = normalized as OrchestratorOutput;

  if (!output.complexityTier || !['tier1', 'tier2', 'tier3'].includes(output.complexityTier)) {
    output.complexityTier = 'tier2';
    output.tierReason = 'Defaulted to tier 2 fallback parsing.';
  }

  if (!output.briefA || !output.briefB || !output.briefC || !output.briefD) {
    throw new Error(`Orchestrator briefs missing. Keys: ${Object.keys(parsed).join(', ')}`);
  }

  return output;
}
