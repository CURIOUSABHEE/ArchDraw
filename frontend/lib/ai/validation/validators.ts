import type { ArchitectureNode, ArchitectureEdge } from '../types';
import type { TierType } from '../domain/tiers';
import { TIER_ORDER } from '../domain/tiers';
import { getTierColor } from '../domain/designSystem';

export interface ValidationError {
  type: 'node' | 'edge' | 'layout';
  severity: 'critical' | 'warning' | 'info';
  id: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export class NodeValidationError extends Error {
  constructor(
    message: string,
    public readonly nodeId: string,
    public readonly severity: 'critical' | 'warning' = 'critical'
  ) {
    super(message);
    this.name = 'NodeValidationError';
  }
}

export class EdgeValidationError extends Error {
  constructor(
    message: string,
    public readonly edgeId: string,
    public readonly severity: 'critical' | 'warning' = 'critical'
  ) {
    super(message);
    this.name = 'EdgeValidationError';
  }
}

export function validateNode(node: ArchitectureNode): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!node.id || node.id.trim() === '') {
    errors.push({
      type: 'node',
      severity: 'critical',
      id: 'NODE-001',
      message: 'Node missing ID',
    });
  }
  
  if (!node.label || node.label.trim() === '') {
    errors.push({
      type: 'node',
      severity: 'critical',
      id: 'NODE-002',
      message: `Node "${node.id}" missing label`,
      details: { nodeId: node.id },
    });
  }
  
  const validTiers: TierType[] = ['client', 'edge', 'compute', 'async', 'data', 'observe', 'external'];
  const tier = node.tier || node.layer;
  if (tier && !validTiers.includes(tier as TierType) && tier !== 'group') {
    errors.push({
      type: 'node',
      severity: 'critical',
      id: 'NODE-003',
      message: `Node "${node.id}" has invalid tier: ${tier}`,
      details: { nodeId: node.id, tier },
    });
  }
  
  if (node.width !== undefined && node.width < 60) {
    errors.push({
      type: 'node',
      severity: 'warning',
      id: 'NODE-004',
      message: `Node "${node.id}" has unusually small width: ${node.width}px`,
      details: { nodeId: node.id, width: node.width },
    });
  }
  
  if (node.isGroup && !node.groupLabel) {
    errors.push({
      type: 'node',
      severity: 'warning',
      id: 'NODE-005',
      message: `Group node "${node.id}" missing groupLabel`,
      details: { nodeId: node.id },
    });
  }
  
  if (node.parentId) {
    errors.push({
      type: 'node',
      severity: 'warning',
      id: 'NODE-006',
      message: `Node "${node.id}" has parentId but isGroup is not true`,
      details: { nodeId: node.id, parentId: node.parentId },
    });
  }
  
  return errors;
}

export function validateEdge(edge: ArchitectureEdge, nodes: ArchitectureNode[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const nodeIds = new Set(nodes.map(n => n.id));
  
  if (!edge.source || !nodeIds.has(edge.source)) {
    errors.push({
      type: 'edge',
      severity: 'critical',
      id: 'EDGE-001',
      message: `Edge "${edge.id}" has invalid source: ${edge.source}`,
      details: { edgeId: edge.id, source: edge.source },
    });
  }
  
  if (!edge.target || !nodeIds.has(edge.target)) {
    errors.push({
      type: 'edge',
      severity: 'critical',
      id: 'EDGE-002',
      message: `Edge "${edge.id}" has invalid target: ${edge.target}`,
      details: { edgeId: edge.id, target: edge.target },
    });
  }
  
  if (edge.source === edge.target) {
    errors.push({
      type: 'edge',
      severity: 'critical',
      id: 'EDGE-003',
      message: `Edge "${edge.id}" has same source and target (self-loop)`,
      details: { edgeId: edge.id },
    });
  }
  
  const sourceNode = nodes.find(n => n.id === edge.source);
  const targetNode = nodes.find(n => n.id === edge.target);
  
  if (sourceNode && targetNode) {
    const sourceTier = (sourceNode.tier || sourceNode.layer) as TierType;
    const targetTier = (targetNode.tier || targetNode.layer) as TierType;
    
    const sourceIndex = TIER_ORDER.indexOf(sourceTier);
    const targetIndex = TIER_ORDER.indexOf(targetTier);
    
    if (sourceIndex > targetIndex && sourceTier !== 'external' && targetTier !== 'client') {
      errors.push({
        type: 'edge',
        severity: 'warning',
        id: 'EDGE-004',
        message: `Edge "${edge.id}" flows backward (${sourceTier} → ${targetTier})`,
        details: { edgeId: edge.id, sourceTier, targetTier },
      });
    }
  }
  
  return errors;
}

export function validateArchitectureConstraints(
  nodes: ArchitectureNode[],
  edges: ArchitectureEdge[]
): ValidationResult {
  const allErrors: ValidationError[] = [];
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  
  for (const node of nodes) {
    allErrors.push(...validateNode(node));
  }
  
  for (const edge of edges) {
    allErrors.push(...validateEdge(edge, nodes));
  }
  
  const nodesWithEdges = new Set<string>();
  for (const edge of edges) {
    nodesWithEdges.add(edge.source);
    nodesWithEdges.add(edge.target);
  }
  
  for (const node of nodes) {
    if (!node.isGroup && !nodesWithEdges.has(node.id)) {
      allErrors.push({
        type: 'node',
        severity: 'warning',
        id: 'NODE-007',
        message: `Node "${node.id}" is isolated (no connections)`,
        details: { nodeId: node.id },
      });
    }
  }
  
  const groupNodes = nodes.filter(n => n.isGroup === true);
  const childNodes = nodes.filter(n => n.parentId !== undefined);
  
  for (const child of childNodes) {
    if (child.parentId && !groupNodes.some(g => g.id === child.parentId)) {
      allErrors.push({
        type: 'node',
        severity: 'critical',
        id: 'NODE-008',
        message: `Child node "${child.id}" has invalid parentId: ${child.parentId}`,
        details: { nodeId: child.id, parentId: child.parentId },
      });
    }
  }
  
  const criticals = allErrors.filter(e => e.severity === 'critical');
  const warnings = allErrors.filter(e => e.severity === 'warning' || e.severity === 'info');
  
  return {
    valid: criticals.length === 0,
    errors: criticals,
    warnings,
  };
}

export function validateAndEnrichNode(node: ArchitectureNode): ArchitectureNode {
  const enriched = { ...node };
  
  if (!enriched.tier && enriched.layer) {
    const tier = enriched.layer as TierType;
    if (['client', 'edge', 'compute', 'async', 'data', 'observe', 'external'].includes(tier)) {
      enriched.tier = tier;
    }
  }
  
  if (enriched.tier && !enriched.tierColor) {
    enriched.tierColor = getTierColor(enriched.tier);
  }
  
  if (enriched.isGroup && !enriched.groupColor) {
    enriched.groupColor = enriched.tierColor || '#64748b';
  }
  
  return enriched;
}

export function validateAndFixLayout(nodes: ArchitectureNode[]): ArchitectureNode[] {
  return nodes.map(node => {
    const errors = validateNode(node);
    const hasCriticalError = errors.some(e => e.severity === 'critical');
    
    if (hasCriticalError) {
      return validateAndEnrichNode(node);
    }
    
    return validateAndEnrichNode(node);
  });
}
