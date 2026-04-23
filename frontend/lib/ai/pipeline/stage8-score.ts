import { Node, Edge } from 'reactflow';
import type { DiagramScore } from './types';

export function scoreDiagram(
  nodes: Node[],
  edges: Edge[]
): DiagramScore {
  // Count nodes
  const nonGroupNodes = nodes.filter(n => n.type !== 'groupNode');
  const groups = nodes.filter(n => n.type === 'groupNode');
  const hasGroupsWithChildren = groups.some(g => 
    nodes.some(c => (c.data as any)?.parentId === g.id)
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

  // Calculate score
  let score = 0;

  // Node count scoring
  if (nonGroupNodes.length >= 15) score += 30;
  else if (nonGroupNodes.length >= 12) score += 20;
  else score += 10;

  // Edge count scoring
  if (edgeCount >= 12) score += 25;
  else if (edgeCount >= 8) score += 15;

  // Orphan scoring
  if (orphanCount === 0) score += 25;
  else if (orphanCount <= 2) score += 10;

  // Group scoring
  if (hasGroupsWithChildren) score += 20;

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
  };
}