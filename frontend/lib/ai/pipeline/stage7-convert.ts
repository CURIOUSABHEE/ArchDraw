import { Node, Edge } from 'reactflow';
import type { LayoutedNode, DiagramEdge, ValidatedDiagram } from './types';

function normalizeLabel(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, ' ');
}

function stripLayerNodes(nodes: LayoutedNode[]): LayoutedNode[] {
  // Build lookup: group ID → set of normalized labels for that group
  const groupLabelSets = new Map<string, Set<string>>();
  const allGroupLabels = new Set<string>();
  for (const n of nodes) {
    if (!n.isGroup) continue;
    const labels = new Set<string>();
    for (const raw of [n.label, n.groupLabel || '']) {
      const norm = normalizeLabel(raw);
      if (norm) {
        labels.add(norm);
        allGroupLabels.add(norm);
      }
    }
    groupLabelSets.set(n.id, labels);
  }

  const reservedLayerLabels = new Set([
    'presentation', 'presentation layer',
    'gateway', 'gateway layer',
    'application', 'application layer',
    'data', 'data layer',
    'async', 'async layer',
    'observability', 'observability layer',
  ]);

  return nodes.filter(node => {
    // Always keep group nodes themselves
    if (node.isGroup) return true;

    const key = normalizeLabel(node.label || '');
    if (!key) return true;

    // Child node whose label matches its parent group's label → remove
    if (node.parentId) {
      const parentLabels = groupLabelSets.get(node.parentId);
      if (parentLabels && (parentLabels.has(key) || [...parentLabels].some(pl => key.includes(pl) || pl.includes(key)))) {
        console.log(`[Convert] Stripped child "${node.label}" matching parent group ${node.parentId}`);
        return false;
      }
      return true;
    }

    // Standalone node whose label matches any group label → remove
    if (allGroupLabels.has(key)) return false;
    if (reservedLayerLabels.has(key)) return false;
    return true;
  });
}

/**
 * sanitizeParentRelationships must run BEFORE sorting.
 * Strips parentId from any node whose group does not exist.
 */
function sanitizeParentRelationships(
  nodes: LayoutedNode[]
): LayoutedNode[] {
  const groupIds = new Set(
    nodes.filter(n => n.isGroup).map(n => n.id)
  );
  return nodes.map(node => {
    if (node.parentId && !groupIds.has(node.parentId)) {
      console.warn(
        `[Convert] Node ${node.id} has parentId ${node.parentId} but group not found — stripping`
      );
      return { ...node, parentId: undefined };
    }
    return node;
  });
}

export function convertToReactFlow(
  layouted: LayoutedNode[],
  validated: ValidatedDiagram
): { nodes: Node[]; edges: Edge[] } {
  const { edges: diagramEdges } = validated;

  // 1. sanitizeParentRelationships runs BEFORE sorting
  const safeLayouted = sanitizeParentRelationships(stripLayerNodes(layouted));
  const groupIds = new Set(safeLayouted.filter(n => n.isGroup).map(n => n.id));

  // 2. Sort: groups first → root nodes second → children last
  const sortedNodes = [...safeLayouted].sort((a, b) => {
    if (a.isGroup && !b.isGroup) return -1;
    if (!a.isGroup && b.isGroup) return 1;
    if (!a.parentId && b.parentId) return -1;
    if (a.parentId && !b.parentId) return 1;
    return 0;
  });

  // 3. Convert to React Flow nodes
  const rfNodes: Node[] = sortedNodes.map(node => {
    const isGroup = node.isGroup;
    const hasVerifiedParent = Boolean(node.parentId) && groupIds.has(node.parentId!);

    const result: Node = {
      id: node.id,
      type: isGroup ? 'groupNode' : 'architectureNode',
      position: { x: node.x, y: node.y },
      // parentId at top level of Node — never only inside data{}
      parentId: node.parentId || undefined,
      data: {
        label: node.label,
        subtitle: node.subtitle || '',
        layer: node.layer,
        icon: node.icon || 'box',
        serviceType: node.serviceType || '',
        isGroup: node.isGroup || false,
        groupLabel: node.groupLabel || '',
        groupColor: node.groupColor || '',
        // parentId is NOT duplicated inside data — only at top level
      },
      width: node.width,
      height: node.height,
      // Group nodes get zIndex: 1, child and root nodes get zIndex: 1000
      zIndex: isGroup ? 1 : 1000,
      // extent: 'parent' only when parentId points to a verified group
      extent: hasVerifiedParent ? 'parent' : undefined,
      style: isGroup ? { width: node.width, height: node.height } : undefined,
    };
    return result;
  });

  // 4. Final label deduplication — runs as the LAST step before returning nodes
  const dedupByLabel: Node[] = [];
  const labelMap = new Map<string, Node>();
  for (const node of rfNodes) {
    const rawLabel = (node.data as Record<string, unknown>)?.label;
    const label = typeof rawLabel === 'string' ? rawLabel.trim().toLowerCase() : '';
    if (!label) {
      dedupByLabel.push(node);
      continue;
    }

    const existing = labelMap.get(label);
    if (!existing) {
      labelMap.set(label, node);
      dedupByLabel.push(node);
      continue;
    }

    // Keep child (has parentId) over root (no parentId)
    const existingHasParent = typeof existing.parentId === 'string' && existing.parentId.length > 0;
    const incomingHasParent = typeof node.parentId === 'string' && node.parentId.length > 0;
    if (!existingHasParent && incomingHasParent) {
      const idx = dedupByLabel.findIndex(n => n.id === existing.id);
      if (idx >= 0) dedupByLabel[idx] = node;
      labelMap.set(label, node);
    }
  }

  const dedupNodeIds = new Set(dedupByLabel.map(n => n.id));

  // Build ID mapping for when child replaces root
  const idMapping = new Map<string, string>();
  for (const node of rfNodes) {
    const rawLabel = (node.data as Record<string, unknown>)?.label;
    const label = typeof rawLabel === 'string' ? rawLabel.trim().toLowerCase() : '';
    if (!label) continue;
    const existing = labelMap.get(label);
    if (existing && existing.id !== node.id) {
      idMapping.set(node.id, existing.id);
    }
  }

  // Map edge IDs through dedup mapping
  const mappedEdges = diagramEdges.map(edge => {
    const sourceId = idMapping.get(edge.source) || edge.source;
    const targetId = idMapping.get(edge.target) || edge.target;
    return { ...edge, source: sourceId, target: targetId };
  });

  // 5. Edges whose source or target no longer exists after dedup are removed
  const rfEdges: Edge[] = mappedEdges
    .filter(edge => dedupNodeIds.has(edge.source) && dedupNodeIds.has(edge.target))
    .map((edge, idx) => {
    const connectionType = edge.async ? 'async' : 'sync';
    const strokeColor = connectionType === 'async' ? '#f59e0b' : '#64748b';
    const strokeDash = connectionType === 'async' ? '8 6' : '';

    return {
      id: edge.id || `rf-${idx}`,
      source: edge.source,
      target: edge.target,
      type: 'simpleFloating',
      animated: edge.async,
      style: { stroke: strokeColor, strokeWidth: 2, strokeDasharray: strokeDash },
      markerEnd: 'arrowclosed' as const,
      data: {
        connectionType,
        pathType: 'smooth',
        label: undefined,
      },
    };
  });

  return { nodes: dedupByLabel, edges: rfEdges };
}
