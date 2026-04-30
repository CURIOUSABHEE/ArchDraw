import { Node, Edge } from 'reactflow';
import type { DiagramScore } from './types';

/**
 * STAGE 8 — QUALITY SCORING
 * 
 * Score based on:
 * 1. completeness (node/edge count)
 * 2. structural hierarchy (layers present)
 * 3. flow clarity (left-to-right readability)
 * 4. semantic labeling (edges meaningful)
 * 5. preservation (no unnecessary deletions)
 * 
 * Penalize:
 * - node loss
 * - missing layers
 * - broken hierarchy
 * - preservation failures
 */

const MIN_NODES = 10;
const TARGET_NODES = 15;
const MIN_EDGES = 10;
const TARGET_EDGES = 15;

const REQUIRED_LAYERS = ['presentation', 'gateway', 'application', 'async', 'data'];

export function scoreDiagram(
  nodes: Node[],
  edges: Edge[],
  options?: {
    originalNodeCount?: number;
    originalEdgeCount?: number;
    nodesRemoved?: number;
    edgesRemoved?: number;
    groupsRemoved?: number;
  }
): DiagramScore {
  // Count nodes
  const nonGroupNodes = nodes.filter(n => n.type !== 'groupNode');
  const groups = nodes.filter(n => n.type === 'groupNode');
  const hasGroupsWithChildren = groups.some(g => 
    nodes.some(c => (c.data as { parentId?: string })?.parentId === g.id)
  );

  // Count edges
  const edgeCount = edges.length;

  // Count orphans
  const connected = new Set<string>();
  for (const edge of edges) {
    connected.add(edge.source);
    connected.add(edge.target);
  }
  const orphanCount = nonGroupNodes.filter(n => !connected.has(n.id)).length;

  // Check layers present
  const layersPresent = new Set<string>();
  for (const node of nonGroupNodes) {
    const layer = (node.data as { layer?: string })?.layer;
    if (layer) layersPresent.add(layer);
  }
  const requiredLayersPresent = REQUIRED_LAYERS.filter(l => layersPresent.has(l)).length;

  // Check edge label quality
  const edgesWithLabels = edges.filter(e => {
    const label = (e.data as { label?: string })?.label;
    return label && label.trim().length > 0;
  }).length;
  const labelQuality = edgeCount > 0 ? edgesWithLabels / edgeCount : 0;

  // Calculate score (0-100)
  let score = 0;

  // 1. Node count scoring (30 points max)
  if (nonGroupNodes.length >= TARGET_NODES) score += 30;
  else if (nonGroupNodes.length >= MIN_NODES) score += 20;
  else if (nonGroupNodes.length >= 8) score += 10;

  // 2. Edge count scoring (25 points max)
  if (edgeCount >= TARGET_EDGES) score += 25;
  else if (edgeCount >= MIN_EDGES) score += 15;
  else if (edgeCount >= 5) score += 5;

  // 3. Orphan scoring (25 points max)
  if (orphanCount === 0) score += 25;
  else if (orphanCount <= 2) score += 15;
  else if (orphanCount <= 5) score += 5;

  // 4. Group scoring (10 points)
  if (hasGroupsWithChildren) score += 10;

  // 5. Layer coverage (5 points)
  score += Math.min(5, requiredLayersPresent);

  // 6. Edge label quality (5 points)
  score += Math.round(labelQuality * 5);

  // PRESERVATION PENALTIES
  let preservationPenalty = 0;

  if (options) {
    // Penalize node loss
    if (options.nodesRemoved && options.nodesRemoved > 0) {
      const penalty = Math.min(30, options.nodesRemoved * 5);
      preservationPenalty += penalty;
      console.log(`[Score] Penalty: -${penalty} for ${options.nodesRemoved} nodes removed`);
    }

    // Penalize edge loss
    if (options.edgesRemoved && options.edgesRemoved > 0) {
      const penalty = Math.min(20, options.edgesRemoved * 3);
      preservationPenalty += penalty;
      console.log(`[Score] Penalty: -${penalty} for ${options.edgesRemoved} edges removed`);
    }

    // Penalize group loss
    if (options.groupsRemoved && options.groupsRemoved > 0) {
      const penalty = options.groupsRemoved * 10;
      preservationPenalty += penalty;
      console.log(`[Score] Penalty: -${penalty} for ${options.groupsRemoved} groups removed`);
    }
  }

  score = Math.max(0, score - preservationPenalty);

  // Determine grade
  let grade: 'A' | 'B' | 'C' | 'F';
  if (score >= 85) grade = 'A';
  else if (score >= 65) grade = 'B';
  else if (score >= 40) grade = 'C';
  else grade = 'F';

  return {
    grade,
    nodeCount: nonGroupNodes.length,
    edgeCount,
    orphanCount,
    hasGroups: hasGroupsWithChildren,
    score,
    nodesRemoved: options?.nodesRemoved || 0,
    edgesRemoved: options?.edgesRemoved || 0,
    groupsRemoved: options?.groupsRemoved || 0,
    preservationPenalty,
  };
}
