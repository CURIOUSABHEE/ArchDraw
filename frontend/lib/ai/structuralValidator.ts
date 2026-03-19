import levenshtein from 'fast-levenshtein';
import type { SynthesiserOutput, SynthesisNode } from './agents/synthesiser';

const VALID_EDGE_TYPES = new Set(['sync', 'async', 'stream', 'event', 'dep']);

export function validateAndRepair(
  output: SynthesiserOutput,
  knownComponentKeys: string[]
): SynthesiserOutput {
  let { nodes, edges, customNodeDefinitions } = output;

  // Step 1: Remove self-referential edges
  edges = edges.filter((e) => e.source !== e.target);

  // Step 2: Remove edges referencing non-existent node IDs
  const nodeIds = new Set(nodes.map((n) => n.id));
  edges = edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));

  // Step 3: Fix invalid edge types
  edges = edges.map((e) => ({
    ...e,
    edgeType: VALID_EDGE_TYPES.has(e.edgeType) ? e.edgeType : 'sync',
  }));

  // Step 4: Deduplicate edges
  const edgeKeys = new Set<string>();
  edges = edges.filter((e) => {
    const key = `${e.source}->${e.target}`;
    if (edgeKeys.has(key)) return false;
    edgeKeys.add(key);
    return true;
  });

  // Step 5: Fuzzy repair component keys
  nodes = nodes.map((node) => {
    if (node.isCustom) return node;
    if (knownComponentKeys.includes(node.componentKey)) return node;
    let bestKey = node.componentKey;
    let bestDist = Infinity;
    for (const key of knownComponentKeys) {
      const dist = levenshtein.get(node.componentKey.toLowerCase(), key.toLowerCase());
      if (dist < bestDist && dist <= 4) { bestDist = dist; bestKey = key; }
    }
    return { ...node, componentKey: bestKey };
  });

  // Step 6: Find orphaned nodes
  const connectedIds = new Set(edges.flatMap((e) => [e.source, e.target]));
  const orphanedNodes = nodes.filter((n) => !connectedIds.has(n.id));

  // Step 7: For each orphaned node, CREATE a synthetic edge rather than removing the node
  orphanedNodes.forEach((orphan) => {
    const orphanLayer = ((orphan as any).data?.layer as string) ?? (orphan as any).layer ?? 'B';

    // Find the best anchor node to connect to
    let anchorNode: SynthesisNode | undefined;

    if (orphanLayer === 'A') {
      // Layer A orphan → connect TO the first Layer B node
      anchorNode = nodes.find((n) =>
        (((n as any).data?.layer as string) ?? (n as any).layer) === 'B' && connectedIds.has(n.id)
      );
    } else if (orphanLayer === 'B') {
      // Layer B orphan → connect FROM API Gateway or first Layer A node
      anchorNode = nodes.find((n) =>
        n.componentKey?.includes('api_gateway') ||
        (((n as any).data?.layer as string) ?? (n as any).layer) === 'A'
      );
    } else if (orphanLayer === 'C') {
      // Layer C orphan → connect FROM most connected Layer B node
      const layerBNodes = nodes.filter((n) =>
        (((n as any).data?.layer as string) ?? (n as any).layer) === 'B' && connectedIds.has(n.id)
      );
      anchorNode = layerBNodes[0];
    } else if (orphanLayer === 'D') {
      // Layer D orphan → connect FROM most relevant Layer B node
      const layerBNodes2 = nodes.filter((n) =>
        (((n as any).data?.layer as string) ?? (n as any).layer) === 'B' && connectedIds.has(n.id)
      );
      anchorNode = layerBNodes2[0];
    }

    if (anchorNode) {
      const isLayerCOrD = ['C', 'D'].includes(orphanLayer);
      const syntheticEdge = {
        id: `synthetic_${anchorNode.id}_${orphan.id}`,
        source: isLayerCOrD ? anchorNode.id : orphan.id,
        target: isLayerCOrD ? orphan.id : anchorNode.id,
        edgeType: 'dep' as const,
        label: 'data flow',
      };
      edges.push(syntheticEdge);
      connectedIds.add(orphan.id);
    }
  });

  // Step 8: Remove any nodes that STILL have no edges after synthetic edge creation
  const finalConnectedIds = new Set(edges.flatMap((e) => [e.source, e.target]));
  if (nodes.length > 4) {
    nodes = nodes.filter((n) => finalConnectedIds.has(n.id));
  }

  return { nodes, edges, customNodeDefinitions };
}
