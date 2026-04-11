import { getDiagramState } from '../lib/diagram-state.js';

interface Issue {
  severity: 'error' | 'warning' | 'suggestion';
  nodeId?: string;
  message: string;
}

export async function validateDiagram(): Promise<{
  valid: boolean;
  errorCount: number;
  warningCount: number;
  suggestionCount: number;
  issues: Issue[];
}> {
  const state = getDiagramState();
  
  if (state.nodes.length === 0 && state.edges.length === 0) {
    return {
      valid: false,
      errorCount: 1,
      warningCount: 0,
      suggestionCount: 0,
      issues: [{ severity: 'error', message: 'No diagram loaded. Call generate_diagram or apply_template first.' }],
    };
  }

  const issues: Issue[] = [];
  const nodeIds = new Set(state.nodes.map(n => n.id));
  const nodeIdCounts = new Map<string, number>();
  const nodeEdgeCounts = new Map<string, number>();

  for (const node of state.nodes) {
    const count = nodeIdCounts.get(node.id) || 0;
    nodeIdCounts.set(node.id, count + 1);
    nodeEdgeCounts.set(node.id, 0);
  }

  for (const edge of state.edges) {
    const sourceCount = nodeEdgeCounts.get(edge.source) || 0;
    const targetCount = nodeEdgeCounts.get(edge.target) || 0;
    nodeEdgeCounts.set(edge.source, sourceCount + 1);
    nodeEdgeCounts.set(edge.target, targetCount + 1);
  }

  for (const [id, count] of nodeIdCounts) {
    if (count > 1) {
      issues.push({ severity: 'error', nodeId: id, message: `Duplicate node ID: '${id}'` });
    }
  }

  for (const edge of state.edges) {
    if (!nodeIds.has(edge.source)) {
      issues.push({ severity: 'error', nodeId: edge.source, message: `Edge '${edge.id}' references non-existent source node '${edge.source}'` });
    }
    if (!nodeIds.has(edge.target)) {
      issues.push({ severity: 'error', nodeId: edge.target, message: `Edge '${edge.id}' references non-existent target node '${edge.target}'` });
    }
  }

  for (const node of state.nodes) {
    const edgeCount = nodeEdgeCounts.get(node.id) || 0;
    if (edgeCount === 0) {
      issues.push({ severity: 'error', nodeId: node.id, message: `Orphan node '${node.data.label}' has no connections` });
    }
  }

  const clientNodes = state.nodes.filter(n => n.data.layer === 'client' || n.data.tier === 'client');
  if (clientNodes.length > 3) {
    issues.push({ severity: 'warning', message: `Client tier has ${clientNodes.length} nodes (max recommended: 3)` });
  }

  const dataNodeIds = new Set(state.nodes.filter(n => n.data.layer === 'data' || n.data.tier === 'data').map(n => n.id));
  for (const edge of state.edges) {
    if (dataNodeIds.has(edge.source)) {
      const targetNode = state.nodes.find(n => n.id === edge.target);
      if (targetNode && (targetNode.data.layer === 'client' || targetNode.data.tier === 'client')) {
        issues.push({
          severity: 'warning',
          nodeId: edge.source,
          message: `Data tier node '${edge.source}' has a direct edge TO client tier node '${edge.target}'`,
        });
      }
    }
  }

  if (state.nodes.length > 20) {
    issues.push({ severity: 'warning', message: `Diagram has ${state.nodes.length} nodes (may be unreadable, consider simplifying)` });
  }

  for (const node of state.nodes) {
    if (!node.data.layer && !node.data.tier) {
      issues.push({ severity: 'warning', nodeId: node.id, message: `Node '${node.data.label}' has no tier assigned` });
    }
  }

  const observeNodes = state.nodes.filter(n => n.data.layer === 'observe' || n.data.tier === 'observe');
  if (observeNodes.length === 0) {
    issues.push({ severity: 'suggestion', message: 'No observability nodes present (consider adding monitoring/logging)' });
  }

  const asyncOrEventEdges = state.edges.filter(e => e.data?.communicationType === 'async' || e.data?.communicationType === 'event');
  if (asyncOrEventEdges.length === 0 && state.edges.length > 0) {
    issues.push({ severity: 'suggestion', message: 'No async/event communication used (consider if async patterns would improve architecture)' });
  }

  const externalNodes = state.nodes.filter(n => n.data.layer === 'external' || n.data.tier === 'external');
  for (const extNode of externalNodes) {
    const edgeCount = nodeEdgeCounts.get(extNode.id) || 0;
    if (edgeCount === 0) {
      issues.push({ severity: 'suggestion', nodeId: extNode.id, message: `External tier node '${extNode.data.label}' has no edges` });
    }
  }

  if (state.nodes.length < 3) {
    issues.push({ severity: 'suggestion', message: 'Diagram has fewer than 3 nodes (may be too simple to be useful)' });
  }

  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const suggestionCount = issues.filter(i => i.severity === 'suggestion').length;

  return {
    valid: errorCount === 0,
    errorCount,
    warningCount,
    suggestionCount,
    issues,
  };
}
