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
    tier1: `TIER CONSTRAINT: This is a BASIC diagram. Produce MAXIMUM 3 services for your layer.
            Focus only on the absolute essentials. Omit analytics, monitoring, admin, and secondary infrastructure.`,
    tier2: `TIER CONSTRAINT: This is a MEDIUM diagram. Produce 3-5 services for your layer.
            Include core services and essential supporting services. Omit internal monitoring tools.`,
    tier3: `TIER CONSTRAINT: This is a DETAILED diagram. Produce 5-7 services for your layer.
            Include all services required to support every explicitly mentioned feature.`,
  }[tier] ?? '';

  return `You are a software architect analyzing the ${layer} of a software system.

${tierInstructions}

Your task: Identify ALL services/components in your assigned layer and output ONLY a JSON object.

OUTPUT FORMAT - return EXACTLY this structure:
${EXAMPLE_OUTPUT}

FIELD DESCRIPTIONS:
- "layer": the layer name (string)
- "services": array of service objects, each with:
  - "name": specific service name (e.g. "Redis Cache", NOT just "Cache")
  - "responsibility": what this service does (1 sentence)
  - "communicatesWith": list of OTHER service NAMES this talks to (string array)
  - "communicationType": one of: "sync", "async", "stream", "event", "dep"

communicationType meanings:
- "sync": blocking REST or gRPC call waiting for response
- "async": sends to a queue (Kafka, SQS, RabbitMQ) without waiting
- "stream": real-time continuous flow (WebSocket, SSE, Kafka consumer)
- "event": webhook, callback, or bidirectional notification
- "dep": passive config reference or shared library dependency

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
