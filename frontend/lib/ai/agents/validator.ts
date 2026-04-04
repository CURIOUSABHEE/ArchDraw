import { apiKeyManager } from '../utils/apiKeyManager';
import type { SharedState, ValidationResult, ValidationIssue } from '../types';
import { VALIDATOR_PROMPT, LAYER_ORDER } from '../constants';
import logger from '@/lib/logger';

export async function runValidatorAgent(state: SharedState): Promise<ValidationResult> {
  const stateJson = JSON.stringify(state, null, 2);

  const prompt = `${VALIDATOR_PROMPT}

Current State:
${stateJson}

Output your validation report as JSON only.`;

  try {
    const result = await apiKeyManager.executeWithRetry(async (groq) => {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a JSON-only output system. Always respond with valid JSON. Do NOT wrap in markdown code blocks. Output ONLY raw JSON.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 2048,
      });

      const content = completion.choices[0]?.message?.content ?? '';
      return content;
    });

    // Strip markdown code blocks if present
    const cleanedResult = result
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/gi, '')
      .trim();

    const parsed = JSON.parse(cleanedResult);

    return {
      pass: parsed.pass ?? false,
      critical_issues: (parsed.critical_issues ?? []).map((issue: Record<string, unknown>) => ({
        id: (issue.id as string) ?? 'UNKNOWN',
        severity: (issue.severity as 'critical' | 'warning' | 'info') ?? 'info',
        nodeId: (issue.nodeId as string) ?? null,
        edgeId: (issue.edgeId as string) ?? null,
        description: (issue.description as string) ?? 'Unknown issue',
        fixHint: (issue.fix_hint as string) ?? 'No fix hint provided',
      })),
      summary: parsed.summary ?? 'Validation complete',
    };
  } catch (error) {
    logger.error('Validator Agent error:', error);
    return runLocalValidation(state);
  }
}

function runLocalValidation(state: SharedState): ValidationResult {
  const issues: ValidationIssue[] = [];

  const nodeIds = new Set<string>();
  for (const node of state.nodes) {
    if (nodeIds.has(node.id)) {
      issues.push({
        id: 'NODE-DUP',
        severity: 'critical',
        nodeId: node.id,
        edgeId: null,
        description: `Duplicate node ID: ${node.id}`,
        fixHint: 'Remove duplicate nodes',
      });
    }
    nodeIds.add(node.id);

    if (!node.label) {
      issues.push({
        id: 'NODE-03',
        severity: 'critical',
        nodeId: node.id,
        edgeId: null,
        description: 'Node missing label',
        fixHint: 'Add a label to the node',
      });
    }

    if (!node.position || (node.position.x === 0 && node.position.y === 0)) {
      issues.push({
        id: 'LAYOUT-01',
        severity: 'warning',
        nodeId: node.id,
        edgeId: null,
        description: 'Node has no position assigned',
        fixHint: 'Run layout agent to assign positions',
      });
    }
  }

  const edgePairs = new Set<string>();
  for (const edge of state.edges) {
    if (edge.source === edge.target) {
      issues.push({
        id: 'EDGE-04',
        severity: 'critical',
        nodeId: null,
        edgeId: edge.id,
        description: 'Self-loop edge detected',
        fixHint: 'Remove the self-loop edge',
      });
    }

    const pairKey = `${edge.source}-${edge.target}`;
    if (edgePairs.has(pairKey)) {
      issues.push({
        id: 'EDGE-05',
        severity: 'warning',
        nodeId: null,
        edgeId: edge.id,
        description: 'Duplicate edge detected',
        fixHint: 'Remove duplicate edges',
      });
    }
    edgePairs.add(pairKey);

    if (!edge.label) {
      issues.push({
        id: 'EDGE-03',
        severity: 'warning',
        nodeId: null,
        edgeId: edge.id,
        description: 'Edge missing label',
        fixHint: 'Add a descriptive label to the edge',
      });
    }

    const pathType = (edge as { pathType?: string }).pathType;
    if (pathType && !['smooth'].includes(pathType)) {
      issues.push({
        id: 'EDGE-SMOOTH',
        severity: 'warning',
        nodeId: null,
        edgeId: edge.id,
        description: `Edge uses non-smooth path type: "${pathType}". Use smooth curves for consistency.`,
        fixHint: 'Change pathType to "smooth"',
      });
    }
  }

  const nodesWithEdges = new Set<string>();
  for (const edge of state.edges) {
    nodesWithEdges.add(edge.source);
    nodesWithEdges.add(edge.target);
  }

  for (const nodeId of nodeIds) {
    if (!nodesWithEdges.has(nodeId)) {
      issues.push({
        id: 'CONNECT-03',
        severity: 'warning',
        nodeId,
        edgeId: null,
        description: `Isolated node: ${nodeId} has no connections`,
        fixHint: 'Add edges to connect this node to others',
      });
    }
  }

  if (state.layout) {
    if (!state.layout.layerOrder || state.layout.layerOrder.length === 0) {
      issues.push({
        id: 'LAYOUT-02',
        severity: 'critical',
        nodeId: null,
        edgeId: null,
        description: 'Missing layer order configuration',
        fixHint: 'Define the layer order in layout configuration',
      });
    }

    const validLayers = LAYER_ORDER;
    const layoutLayers = state.layout.layerOrder ?? [];
    for (const layer of layoutLayers) {
      if (!validLayers.includes(layer as typeof validLayers[number])) {
        issues.push({
          id: 'LAYOUT-02',
          severity: 'warning',
          nodeId: null,
          edgeId: null,
          description: `Invalid layer in layerOrder: ${layer}`,
          fixHint: 'Use only valid layer types',
        });
      }
    }
  }

  const hasCritical = issues.some(i => i.severity === 'critical');

  return {
    pass: !hasCritical,
    critical_issues: issues,
    summary: hasCritical
      ? `Found ${issues.filter(i => i.severity === 'critical').length} critical issues`
      : issues.length === 0
        ? 'All validation checks passed'
        : `Found ${issues.length} warnings`,
  };
}
