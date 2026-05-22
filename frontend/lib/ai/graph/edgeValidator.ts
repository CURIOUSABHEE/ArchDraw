import type { ArchitectureNode, ArchitectureEdge } from '../types';
import type { TierType } from '../domain/tiers';
import { TIER_ORDER } from '../domain/tiers';
import logger from '@/lib/logger';

export interface EdgeValidationResult {
  valid: boolean;
  errors: EdgeValidationError[];
  warnings: EdgeValidationError[];
}

export interface EdgeValidationError {
  edgeId: string;
  type: 'invalid-tier' | 'cycle' | 'orphan-node' | 'missing-essential';
  severity: 'error' | 'warning';
  message: string;
}

/**
 * Validates generated edges against architectural best practices.
 */
export function validateEdges(
  edges: ArchitectureEdge[],
  nodes: ArchitectureNode[]
): EdgeValidationResult {
  const errors: EdgeValidationError[] = [];
  const warnings: EdgeValidationError[] = [];
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  // Check 1: No cycles in primary flow
  // (Simplified for now)

  // Check 2: Tier violations (e.g., Data → Client)
  for (const edge of edges) {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);

    if (!source || !target) continue;

    const sourceTier = source.layer as TierType;
    const targetTier = target.layer as TierType;

    const sourceIdx = TIER_ORDER.indexOf(sourceTier);
    const targetIdx = TIER_ORDER.indexOf(targetTier);

    // Allowing some backward edges for async feedback/replies
    if (sourceIdx > targetIdx && edge.communicationType !== 'async') {
      warnings.push({
        edgeId: edge.id,
        type: 'invalid-tier',
        severity: 'warning',
        message: `Backward edge "${source.label}" → "${target.label}" should ideally be async`,
      });
    }
  }

  // Check 3: Essential components are connected
  const essentialViolations = checkEssentialConnections(nodes, edges);
  errors.push(...essentialViolations);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

function checkEssentialConnections(
  nodes: ArchitectureNode[],
  edges: ArchitectureEdge[]
): EdgeValidationError[] {
  const errors: EdgeValidationError[] = [];
  
  // Rule: Async nodes (Queues/Streams) must have a consumer
  const asyncNodes = nodes.filter(n => n.layer === 'async');
  for (const asyncNode of asyncNodes) {
    const outgoing = edges.filter(e => e.source === asyncNode.id);
    if (outgoing.length === 0) {
      errors.push({
        edgeId: '',
        type: 'invalid-tier',
        severity: 'warning',
        message: `Async node "${asyncNode.label}" has no consumer`,
      });
    }
  }

  if (errors.length > 0) {
    logger.log(`[EdgeValidator] Found ${errors.length} validation issues`);
  }

  return errors;
}

/**
 * Enforces minimum connections per node.
 */
export function enforceMinimumConnections(
  nodes: ArchitectureNode[],
  edges: ArchitectureEdge[]
): { edges: ArchitectureEdge[]; fixes: string[] } {
  const resultEdges = [...edges];
  const fixes: string[] = [];
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  for (const node of nodes) {
    if (node.isGroup) continue;

    const connections = resultEdges.filter(
      e => e.source === node.id || e.target === node.id
    );

    if (connections.length === 0) {
      const candidate = nodes.find(n => !n.isGroup && n.id !== node.id && n.layer === 'application');
      if (candidate) {
        const newEdge: ArchitectureEdge = {
          id: `auto-fix-${node.id}`,
          source: node.id,
          target: candidate.id,
          sourceHandle: 'right',
          targetHandle: 'left',
          communicationType: 'sync',
          pathType: 'smooth',
          label: '',
          animated: false,
          style: { stroke: '#94a3b8', strokeWidth: 2 },
          markerEnd: 'arrowclosed',
        } as ArchitectureEdge;

        resultEdges.push(newEdge);
        fixes.push(`Connected orphan node: ${node.label}`);
        logger.log(`[EdgeValidator] Adding missing edge: ${node.label} → ${candidate.label}`);
      }
    }
  }

  return { edges: resultEdges, fixes };
}
