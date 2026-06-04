import type { LayoutedNode, PipelineLayer } from './types';
import { normalizeLayer } from './stage6-layout';

export interface SemanticGroupMeta {
  label: string;
  color: string;
  layer: PipelineLayer;
}

/** Canonical layer buckets used for auto-grouping in both pipelines. */
export const SEMANTIC_GROUP_META: Record<string, SemanticGroupMeta> = {
  client: { label: 'Client / Frontend', color: '#3b82f6', layer: 'client' },
  edge: { label: 'Edge / CDN', color: '#f59e0b', layer: 'edge' },
  gateway: { label: 'Gateway', color: '#d97706', layer: 'gateway' },
  application: { label: 'API / Services', color: '#6366f1', layer: 'application' },
  queue: { label: 'Async / Messaging', color: '#a855f7', layer: 'queue' },
  data: { label: 'Data Stores', color: '#10b981', layer: 'data' },
  observability: { label: 'Observability', color: '#64748b', layer: 'observability' },
  external: { label: 'External Services', color: '#f97316', layer: 'external' },
};

export interface ApplySemanticLayerGroupsOptions {
  /** Minimum leaf nodes required to create a group (default 2). */
  minNodesPerGroup?: number;
  /** Padding around grouped children in px (default 40). */
  padding?: number;
}

export function getSemanticGroupKey(node: Pick<LayoutedNode, 'layer' | 'label'>): string {
  return normalizeLayer(node.layer);
}

/**
 * Wraps leaf nodes that share a semantic layer into groupNode containers.
 * Children are repositioned parent-relative (React Flow convention).
 */
export function applySemanticLayerGroups(
  nodes: LayoutedNode[],
  options: ApplySemanticLayerGroupsOptions = {}
): LayoutedNode[] {
  const minNodesPerGroup = options.minNodesPerGroup ?? 2;
  const padding = options.padding ?? 40;

  const existingGroups = nodes.filter((n) => n.isGroup);
  const alreadyGrouped = nodes.filter((n) => !n.isGroup && n.parentId);
  const ungroupedLeaves = nodes.filter((n) => !n.isGroup && !n.parentId);

  const buckets = new Map<string, LayoutedNode[]>();
  for (const node of ungroupedLeaves) {
    const key = getSemanticGroupKey(node);
    const list = buckets.get(key) ?? [];
    list.push(node);
    buckets.set(key, list);
  }

  const newGroups: LayoutedNode[] = [];
  const resultLeaves: LayoutedNode[] = [...alreadyGrouped];
  let groupSeq = 0;

  for (const [key, members] of buckets) {
    if (members.length < minNodesPerGroup) {
      resultLeaves.push(...members);
      continue;
    }

    const meta = SEMANTIC_GROUP_META[key] ?? SEMANTIC_GROUP_META.application;
    const groupId = `group-${key}-${groupSeq++}`;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const child of members) {
      minX = Math.min(minX, child.x);
      minY = Math.min(minY, child.y);
      maxX = Math.max(maxX, child.x + child.width);
      maxY = Math.max(maxY, child.y + child.height);
    }

    const groupX = minX - padding;
    const groupY = minY - padding;
    const groupWidth = maxX - minX + 2 * padding;
    const groupHeight = maxY - minY + 2 * padding;

    newGroups.push({
      id: groupId,
      label: meta.label,
      layer: meta.layer,
      isGroup: true,
      groupLabel: meta.label,
      groupColor: meta.color,
      x: groupX,
      y: groupY,
      width: groupWidth,
      height: groupHeight,
    });

    for (const child of members) {
      resultLeaves.push({
        ...child,
        parentId: groupId,
        x: child.x - groupX,
        y: child.y - groupY,
      });
    }
  }

  return sortGroupsBeforeChildren([...existingGroups, ...newGroups, ...resultLeaves]);
}

/** Groups must precede children for React Flow and NDJSON import. */
export function sortGroupsBeforeChildren(nodes: LayoutedNode[]): LayoutedNode[] {
  return [...nodes].sort((a, b) => {
    if (a.isGroup && !b.isGroup) return -1;
    if (!a.isGroup && b.isGroup) return 1;
    return 0;
  });
}

export function layoutedNodeToNdjsonRecord(node: LayoutedNode): Record<string, unknown> {
  const record: Record<string, unknown> = {
    id: node.id,
    label: node.label,
    layer: node.layer,
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
  };

  if (node.subtitle) record.subtitle = node.subtitle;
  if (node.icon) record.icon = node.icon;
  if (node.serviceType) record.serviceType = node.serviceType;
  if (node.isGroup) {
    record.isGroup = true;
    record.groupLabel = node.groupLabel ?? node.label;
    if (node.groupColor) record.groupColor = node.groupColor;
  }
  if (node.parentId) record.parentId = node.parentId;

  return record;
}
