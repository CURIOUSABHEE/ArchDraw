import type { Node, Edge } from 'reactflow';
import type { SynthesiserOutput, CustomNodeDefinition } from './agents/synthesiser';

import componentsData from '@/data/components.json';
import awsData from '@/data/aws-components.json';
import servicesData from '@/data/services-components.json';

type ComponentEntry = { id: string; label: string; icon?: string; color?: string; category?: string };

const allComponents = [
  ...componentsData,
  ...awsData,
  ...servicesData
] as ComponentEntry[];

const componentMap = new Map<string, ComponentEntry>(
  allComponents.map((c) => [c.id, c])
);

const VALID_LAYERS = new Set(['A', 'B', 'C', 'D']);

// Layer codes that should NEVER appear as sublabel text
const LAYER_CODES = new Set([
  'A', 'B', 'C', 'D',
  'AS', 'DS', 'CE', 'ME', 'ES', 'O', 'P', 'SMS',
  'a', 'b', 'c', 'd',
]);

// Edge labels that are raw JS values or meaningless
const FORBIDDEN_LABELS = new Set([
  // Raw JS / empty values
  'not', 'undefined', 'null', 'true', 'false', '', 'data', 'request', 'response',
  // Short pronouns / partial LLM outputs
  'me', 'it', 'he', 'she', 'we', 'my', 'no', 'ok', 'yes', 'to', 'or', 'and', 'the',
  'a', 'an', 'is', 'in', 'on', 'at',
  // Generic non-descriptive terms
  'n/a', 'na', 'none', 'unknown', 'default', 'value', 'type', 'edge', 'node',
  'connection', 'link', 'call', 'service', 'api', 'http', 'https',
]);

/**
 * Sanitise synthesiser output BEFORE building React Flow nodes.
 * Catches: layer code leaking into sublabel, forbidden edge labels,
 * invalid layer values, self-referential edges, edges to non-existent nodes.
 */
export function sanitiseSynthesiserOutput(output: SynthesiserOutput): SynthesiserOutput {
  const sanitisedNodes = output.nodes.map((node) => {
    // Fix: If sublabel is a layer code, replace with empty string
    const rawSublabel = node.sublabel?.trim() ?? '';
    const cleanSublabel = LAYER_CODES.has(rawSublabel) ? '' : rawSublabel;

    // Cap at 48 characters so nodes never grow beyond predictable height
    const cappedSublabel = cleanSublabel.length > 48
      ? cleanSublabel.slice(0, 45).trimEnd() + '...'
      : cleanSublabel;

    // Fix: Validate layer field  default to 'B' if invalid
    const cleanLayer = VALID_LAYERS.has(node.layer) ? node.layer : 'B';

    // Fix: Ensure id is snake_case with no spaces
    const cleanId = node.id.replace(/\s+/g, '_').toLowerCase();

    return { ...node, id: cleanId, sublabel: cappedSublabel, layer: cleanLayer };
  });

  // Build ID map for edge source/target remapping
  const idMap = new Map(
    output.nodes.map((n, i) => [n.id, sanitisedNodes[i].id])
  );

  const nodeIdSet = new Set(sanitisedNodes.map((n) => n.id));

  const sanitisedEdges = output.edges
    .map((edge) => ({
      ...edge,
      id: edge.id.replace(/\s+/g, '_').toLowerCase(),
      source: idMap.get(edge.source) ?? edge.source.replace(/\s+/g, '_').toLowerCase(),
      target: idMap.get(edge.target) ?? edge.target.replace(/\s+/g, '_').toLowerCase(),
      // Sanitise edge labels  replace forbidden values with 'data flow'
      label: FORBIDDEN_LABELS.has(edge.label?.trim()?.toLowerCase() ?? '')
        ? 'data flow'
        : (edge.label?.trim() ?? 'data flow'),
    }))
    // Remove self-referential edges
    .filter((e) => e.source !== e.target)
    // Remove edges referencing non-existent nodes
    .filter((e) => nodeIdSet.has(e.source) && nodeIdSet.has(e.target));

  // Remove nodes with zero edges (disconnected orphans)  structural validator will handle reconnection
  const connectedIds = new Set(sanitisedEdges.flatMap((e) => [e.source, e.target]));
  // Only remove orphans if we have enough nodes to spare (keep all if small diagram)
  const connectedNodes = sanitisedNodes.length > 4
    ? sanitisedNodes.filter((n) => connectedIds.has(n.id))
    : sanitisedNodes;

  return {
    ...output,
    nodes: connectedNodes,
    edges: sanitisedEdges,
  };
}


export function buildReactFlowDiagramRaw(
  synthesiserOutput: SynthesiserOutput,
  customNodeDefs: CustomNodeDefinition[]
): { nodes: Node[]; edges: Edge[] } {
  const customDefMap = new Map(customNodeDefs.map((d) => [d.componentKey, d]));

  const rfNodes: Node[] = synthesiserOutput.nodes.map((n) => {
    const builtin = componentMap.get(n.componentKey);
    const custom = customDefMap.get(n.componentKey);

    return {
      id: n.id,
      type: 'systemNode',
      position: { x: 0, y: 0 },
      data: {
        label: n.label,
        sublabel: n.sublabel,
        componentKey: n.componentKey,
        icon: builtin?.icon ?? custom?.iconName ?? 'box',
        color: builtin?.color ?? custom?.color ?? '#6366f1',
        category: builtin?.category ?? custom?.category ?? 'Custom AI',
        isCustom: n.isCustom,
        layer: n.layer,
      },
    };
  });

  //  Edge bundling logic 
  // Group edges by source
  const edgesBySource = new Map<string, typeof synthesiserOutput.edges>();
  synthesiserOutput.edges.forEach(e => {
    const group = edgesBySource.get(e.source) ?? [];
    group.push(e);
    edgesBySource.set(e.source, group);
  });

  // Helper: get the layer of a target node
  const getTargetLayer = (targetId: string): string =>
    synthesiserOutput.nodes.find(n => n.id === targetId)?.layer ?? 'B';

  const rfEdges: Edge[] = [];

  synthesiserOutput.edges.forEach((e) => {
    const sourceEdges   = edgesBySource.get(e.source) ?? [];
    const targetLayer   = getTargetLayer(e.target);

    // Edges from same source going to same target layer form a bundle
    const bundleEdges   = sourceEdges.filter(se => getTargetLayer(se.target) === targetLayer);
    const indexInBundle = bundleEdges.findIndex(se => se.id === e.id);
    const bundleSize    = bundleEdges.length;

    // Bundle when 3+ edges of the SAME type go to the same layer
    const uniqueTypes   = [...new Set(bundleEdges.map(se => se.edgeType))];
    const shouldBundle  = bundleSize >= 3 && uniqueTypes.length === 1;

    // Suppress non-primary edges in a bundle
    if (shouldBundle && indexInBundle > 0) return;

    // Build label  bundle primary shows combined target names
    let edgeLabel = e.label ?? '';
    if (shouldBundle && indexInBundle === 0) {
      const names = bundleEdges
        .map(se => synthesiserOutput.nodes.find(n => n.id === se.target)?.label ?? se.target)
        .map(name => name.split(' ').slice(0, 2).join(' '));
      const joined = names.join(', ');
      edgeLabel = joined.length > 40 ? joined.slice(0, 37) + '...' : joined;
    }

    // Spread offset: center parallel edges around 0 so they fan symmetrically
    const spreadOffset = bundleSize > 1
      ? (indexInBundle - (bundleSize - 1) / 2) * 28
      : 0;

    rfEdges.push({
      id: e.id,
      source: e.source,
      target: e.target,
      type: 'custom',
      data: {
        edgeType: e.edgeType,
        label: edgeLabel,
        edgeIndex: indexInBundle,
        edgeTotal: bundleSize,
        spreadOffset,
        hideLabel: spreadOffset !== 0,
        isBundle: shouldBundle && indexInBundle === 0,
      },
    });
  });

  return { nodes: rfNodes, edges: rfEdges };
}
