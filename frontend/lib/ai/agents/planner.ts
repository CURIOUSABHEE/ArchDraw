import { apiKeyManager } from '../utils/apiKeyManager';
import type { PlannerDecision, SharedState, AgentAction } from '../types';
import { PLANNER_PROMPT, MAX_ITERATIONS, SCORE_THRESHOLD } from '../constants';

export async function runPlannerAgent(state: SharedState): Promise<PlannerDecision> {
  const stateJson = JSON.stringify(state, null, 2);

  const prompt = `${PLANNER_PROMPT}

Current State:
${stateJson}

Output your decision as JSON only.`;

  try {
    const result = await apiKeyManager.executeWithRetry(async (groq) => {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a JSON-only output system. Always respond with valid JSON. Do NOT wrap the response in markdown code blocks. Output ONLY the raw JSON.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 500,
      });

      const content = completion.choices[0]?.message?.content ?? '';
      return content;
    });

    // Strip markdown code blocks if present
    const cleanedResult = result
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/gi, '')
      .trim();

    const decision = JSON.parse(cleanedResult) as PlannerDecision;
    return decision;
  } catch (error) {
    console.error('Planner Agent error:', error);
    return {
      next_action: determineFallbackAction(state),
      reasoning: 'Fallback due to planner error',
      priority_issues: [],
    };
  }
}

function determineFallbackAction(state: SharedState): AgentAction {
  if (state.iteration >= MAX_ITERATIONS) {
    return 'stop';
  }

  if (state.score >= SCORE_THRESHOLD && state.components.length > 0 && state.edges.length > 0) {
    return 'stop';
  }

  if (state.components.length === 0) {
    return 'component';
  }

  if (state.edges.length === 0) {
    return 'edges';
  }

  if (state.issues.length > 0) {
    return 'edge_fix';
  }

  return 'stop';
}

function hasValidPositions(state: SharedState): boolean {
  return state.nodes.some(node => node.position?.x !== 0 || node.position?.y !== 0);
}
