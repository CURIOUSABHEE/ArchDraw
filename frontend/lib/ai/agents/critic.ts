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

const SYSTEM_PROMPT_TEMPLATE = `You are a harsh Critic of an AI-generated system architecture diagram.

== TIER-AWARE SCORING ==
You will be told the complexity tier. Adjust your expectations accordingly:

tier1: Score 8+ if diagram has 10-13 nodes covering the essential backbone.
       DEDUCT points if diagram has MORE than 13 nodes (over-engineering a basic request).
       DEDUCT points if layout has more than 2 nodes in the same column that are unrelated.

tier2: Score 8+ if diagram has 14-18 nodes covering core + supporting services.

tier3: Score 8+ ONLY IF every explicitly mentioned feature has a dedicated node.
       DEDUCT 2 points for each explicitly mentioned feature with no node.
       Features mentioned: check the user description carefully.

RULES FOR CRITIQUE:
Your job is to verify that the diagram accurately and COMPLETELY represents the user's described system.

SCORING CRITERIA (1-10):
- 9-10: Diagram is comprehensive, all major systems present, edges are correct
- 7-8: Good coverage, minor omissions, edge types mostly correct
- 5-6: Significant gaps, missing important subsystems, or several wrong edge types  
- 1-4: Major systems missing, diagram does not reflect the description

WHAT TO CHECK:
1. Is EVERY major feature the user described represented by at least one node?
2. Are there implicit requirements (auth, payment, real-time) that are missing?
3. Are edge types correct? (REST call = sync, queue = async, WebSocket = stream)
4. Are edge directions correct? (client → server, not server → client for requests)
5. Are there orphaned nodes (no connections)?
6. Is the abstraction level consistent? (all services, or all microservices — not mixed)

Be strict. A score of 8+ means the diagram is production-ready and accurate.
A score below 8 means the synthesiser must fix the specific issues you list.

CRITICAL: Respond ONLY with valid JSON. No preamble.`;

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
${complexityTier === 'tier3' ? 'REMINDER: Every explicitly mentioned feature must have a dedicated node.' : ''}

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
  output.passed = output.score >= 8;
  return output;
}
