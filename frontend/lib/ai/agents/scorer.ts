import { apiKeyManager } from '../utils/apiKeyManager';
import type { SharedState, ScoreResult } from '../types';
import { SCORER_PROMPT } from '../constants';
import logger from '@/lib/logger';

const SCORING_GENERIC_LABELS = ['GROUP', 'CONTAINER', 'BOX', 'SECTION', 'AREA'];

function getProviderForModel(modelId: string): 'groq' | 'openrouter' {
  return modelId.includes('/') ? 'openrouter' : 'groq';
}

export async function runScorerAgent(state: SharedState, model?: string): Promise<ScoreResult> {
  const selectedModel = model || 'llama-3.3-70b-versatile';
  const provider = getProviderForModel(selectedModel);
  const stateJson = JSON.stringify(state, null, 2);

  const prompt = `${SCORER_PROMPT}

Current State:
${stateJson}

Output your score report as JSON only.`;

  try {
    const result = await apiKeyManager.executeWithRetry(async (groq) => {
      const completion = await groq.chat.completions.create({
        model: selectedModel,
        messages: [
          { role: 'system', content: 'You are a JSON-only output system. Always respond with valid JSON. Do NOT wrap in markdown code blocks. Output ONLY raw JSON.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 1024,
      });

      const content = completion.choices[0]?.message?.content ?? '';
      return content;
    }, { provider });

    // Strip markdown code blocks if present
    const cleanedResult = result
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/gi, '')
      .trim();

    const parsed = JSON.parse(cleanedResult);

    return {
      score: parsed.score ?? 0,
      breakdown: {
        layout_quality: parsed.breakdown?.layout_quality ?? 0,
        edge_quality: parsed.breakdown?.edge_quality ?? 0,
        intent_match: parsed.breakdown?.intent_match ?? 0,
        communication_accuracy: parsed.breakdown?.communication_accuracy ?? 0,
        penalties: parsed.breakdown?.penalties ?? 0,
      },
      verdict: parsed.verdict ?? 'continue_layout',
      top_improvements: parsed.top_improvements ?? [],
    };
  } catch (error) {
    logger.error('Scorer Agent error:', error);
    return runLocalScoring(state);
  }
}

function runLocalScoring(state: SharedState): ScoreResult {
  let layoutQuality = 0;
  let edgeQuality = 0;
  let intentMatch = 0;
  let communicationAccuracy = 0;
  let penalties = 0;

  const nodes = state.nodes;
  const edges = state.edges;
  const userIntent = state.userIntent;

  const hasValidPositions = nodes.every(
    n => n.position && (n.position.x !== 0 || n.position.y !== 0)
  );

  if (hasValidPositions && nodes.length > 0) {
    const overlaps = checkOverlaps(nodes);
    if (overlaps === 0) {
      layoutQuality = 25;
    } else if (overlaps < 3) {
      layoutQuality = 15;
    } else {
      layoutQuality = 5;
    }
  } else {
    layoutQuality = 5;
  }

  // Containment Quality scoring (25 pts max) - rewards proper nesting
  let containmentScore = 0;
  const groupNodes = nodes.filter(n => n.isGroup === true);
  const level1Containers = groupNodes.filter(n => !n.parentId);
  const level2Containers = groupNodes.filter(n => n.parentId);
  const childNodes = nodes.filter(n => n.parentId !== undefined);
  
  if (level1Containers.length >= 1) containmentScore += 10;
  if (level2Containers.length >= 1) containmentScore += 10;
  
  const goodContainers = groupNodes.filter(g => {
    const children = childNodes.filter(c => c.parentId === g.id);
    return children.length >= 2 && children.length <= 5;
  });
  if (goodContainers.length > 0) containmentScore += 5;
  
  const singleChildGroups = groupNodes.filter(g => 
    childNodes.filter(c => c.parentId === g.id).length === 1
  );
  if (singleChildGroups.length > 0) containmentScore -= 10;
  containmentScore = Math.max(0, Math.min(25, containmentScore));

  // New Edge Quality scoring (20 pts max) - rewards sparse, label-free edges
  const leafNodes = nodes.filter(n => !n.isGroup);
  const edgeCountIsValid = edges.length < leafNodes.length;
  const labeledEdgeCount = edges.filter(e => e.label && e.label.length > 0).length;
  
  if (edgeCountIsValid) {
    edgeQuality += 10;
  }
  
  if (labeledEdgeCount === 0) {
    edgeQuality += 10;
  } else if (labeledEdgeCount <= 2) {
    edgeQuality += 5;
  }
  
  const containerEdgePenalty = edges.filter(e => {
    const sourceNode = nodes.find(n => n.id === e.source);
    const targetNode = nodes.find(n => n.id === e.target);
    return (sourceNode?.isGroup || targetNode?.isGroup);
  }).length;
  edgeQuality -= containerEdgePenalty * 5;
  
  const dashedOrDottedEdges = edges.filter(e => e.edgeVariant && e.edgeVariant !== 'solid').length;
  edgeQuality -= dashedOrDottedEdges * 5;
  
  edgeQuality = Math.max(0, Math.min(20, edgeQuality));

  const intentWords = userIntent.description.toLowerCase().split(/\s+/);
  const intentKeywords = intentWords.filter(w => w.length > 4);
  const componentLabels = nodes.map(n => (n.label ?? '').toLowerCase());

  let matchedKeywords = 0;
  for (const keyword of intentKeywords) {
    for (const label of componentLabels) {
      if (label.includes(keyword)) {
        matchedKeywords++;
        break;
      }
    }
  }

  const matchRatio = intentKeywords.length > 0 ? matchedKeywords / intentKeywords.length : 0;

  if (matchRatio >= 0.8) {
    intentMatch = 20;
  } else if (matchRatio >= 0.5) {
    intentMatch = 15;
  } else if (matchRatio >= 0.3) {
    intentMatch = 10;
  } else {
    intentMatch = 5;
  }

  const edgesWithCommType = edges.filter(e => e.communicationType).length;
  const commTypeRatio = edges.length > 0 ? edgesWithCommType / edges.length : 0;

  if (commTypeRatio === 1) {
    communicationAccuracy = 15;
  } else if (commTypeRatio >= 0.7) {
    communicationAccuracy = 10;
  } else if (commTypeRatio >= 0.5) {
    communicationAccuracy = 5;
  } else {
    communicationAccuracy = 0;
  }

  const nodeIds = new Set<string>();
  const isolatedNodes: string[] = [];
  for (const node of nodes) {
    if (nodeIds.has(node.id)) {
      penalties += 10;
    }
    nodeIds.add(node.id);

    const hasConnection = edges.some(e => e.source === node.id || e.target === node.id);
    if (!hasConnection && nodes.length > 1) {
      isolatedNodes.push(node.id);
      penalties += 10;
    }
  }

  const selfLoops = edges.filter(e => e.source === e.target).length;
  penalties += selfLoops * 15;

  const duplicateEdges = new Set<string>();
  for (const edge of edges) {
    const key = `${edge.source}-${edge.target}`;
    if (duplicateEdges.has(key)) {
      penalties += 10;
    }
    duplicateEdges.add(key);
  }

  const missingLabels = edges.filter(e => !e.label || e.label.length === 0).length;
  penalties += missingLabels * 5;

  const genericLabels = edges.filter(e =>
    e.label && (
      e.label.toLowerCase().includes('connects to') ||
      e.label.toLowerCase().includes('sends data') ||
      e.label.toLowerCase().includes('receives data')
    )
  ).length;
  penalties += genericLabels * 3;

  // Simplicity scoring (10 pts max)
  let simplicityScore = 0;
  if (leafNodes.length <= 12) simplicityScore += 10;
  if (leafNodes.length <= 8) simplicityScore += 5;
  if (leafNodes.length > 12) penalties += 5;

  const totalScore = Math.max(0, Math.min(100,
    layoutQuality + edgeQuality + intentMatch + containmentScore + simplicityScore - penalties
  ));

  let verdict: ScoreResult['verdict'] = 'continue_layout';
  if (totalScore >= 75) {
    verdict = 'stop';
  } else if (totalScore >= 60) {
    verdict = 'continue_edges';
  } else {
    verdict = 'continue_layout';
  }

  const topImprovements: string[] = [];
  if (layoutQuality < 20) {
    topImprovements.push('Improve node positioning and spacing');
  }
  if (edgeQuality < 15) {
    topImprovements.push('Reduce edges - use containment instead of edge labels');
  }
  if (containmentScore < 15) {
    topImprovements.push('Add proper container hierarchy');
  }
  if (intentMatch < 15) {
    topImprovements.push('Add more components matching user intent');
  }
  if (isolatedNodes.length > 0) {
    topImprovements.push('Connect isolated nodes to the diagram');
  }

  return {
    score: totalScore,
    breakdown: {
      layout_quality: layoutQuality,
      edge_quality: edgeQuality,
      intent_match: intentMatch,
      communication_accuracy: communicationAccuracy,
      penalties: penalties,
    },
    verdict,
    top_improvements: topImprovements,
  };
}

function checkOverlaps(nodes: SharedState['nodes']): number {
  let overlaps = 0;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];

      if (!a.position || !b.position) continue;

      const aWidth = a.width ?? 160;
      const aHeight = a.height ?? 80;
      const bWidth = b.width ?? 160;
      const bHeight = b.height ?? 80;

      const aRight = a.position.x + aWidth;
      const aBottom = a.position.y + aHeight;
      const bRight = b.position.x + bWidth;
      const bBottom = b.position.y + bHeight;

      const noOverlap =
        a.position.x >= bRight ||
        aRight <= b.position.x ||
        a.position.y >= bBottom ||
        aBottom <= b.position.y;

      if (!noOverlap) {
        overlaps++;
      }
    }
  }
  return overlaps;
}
