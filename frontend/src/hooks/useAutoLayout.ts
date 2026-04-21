import { useCallback, useRef, useState } from 'react';
import { useReactFlow } from 'reactflow';
import ELK from 'elkjs/lib/elk.bundled.js';

const elk = new ELK();

const elkOptions: Record<string, string> = {
  'elk.algorithm': 'layered',
  'elk.direction': 'DOWN',
  'elk.layered.spacing.nodeNodeBetweenLayers': '100',
  'elk.spacing.nodeNode': '80',
  'elk.spacing.edgeNode': '40',
  'elk.edgeRouting': 'ORTHOGONAL',
  'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
  'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
};

function hasCollisions(nodes: any[], margin = 20): boolean {
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const A = nodes[i];
      const B = nodes[j];
      if (A.parentId || B.parentId) continue;

      const aw = A.measured?.width ?? A.width ?? 150;
      const ah = A.measured?.height ?? A.height ?? 50;
      const bw = B.measured?.width ?? B.width ?? 150;
      const bh = B.measured?.height ?? B.height ?? 50;

      const overlapX =
        Math.min(A.position.x + aw + margin, B.position.x + bw + margin) -
        Math.max(A.position.x - margin, B.position.x - margin);
      const overlapY =
        Math.min(A.position.y + ah + margin, B.position.y + bh + margin) -
        Math.max(A.position.y - margin, B.position.y - margin);

      if (overlapX > 0 && overlapY > 0) return true;
    }
  }
  return false;
}

async function runELKLayout(nodes: any[], edges: any[]) {
  const measurableNodes = nodes.filter(
    (n) => !n.parentId && (n.measured?.width || n.width)
  );

  const graph = {
    id: 'root',
    layoutOptions: elkOptions,
    children: measurableNodes.map((node) => ({
      id: node.id,
      width: node.measured?.width ?? node.width ?? 150,
      height: node.measured?.height ?? node.height ?? 50,
    })),
    edges: edges
      .filter(
        (e) =>
          measurableNodes.some((n) => n.id === e.source) &&
          measurableNodes.some((n) => n.id === e.target)
      )
      .map((edge) => ({
        id: edge.id,
        sources: [edge.source],
        targets: [edge.target],
      })),
  };

  const layouted = await elk.layout(graph);

  return nodes.map((node) => {
    const elkNode = layouted.children?.find((n) => n.id === node.id);
    if (!elkNode) return node;
    return {
      ...node,
      position: { x: elkNode.x ?? node.position.x, y: elkNode.y ?? node.position.y },
    };
  });
}

export function useAutoLayout() {
  const { getNodes, getEdges, setNodes, fitView } = useReactFlow();
  const [isLayouting, setIsLayouting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerLayout = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      const currentNodes = getNodes();
      const currentEdges = getEdges();

      if (!hasCollisions(currentNodes)) return;

      setIsLayouting(true);
      try {
        const layoutedNodes = await runELKLayout(currentNodes, currentEdges);
        setNodes(layoutedNodes);
        requestAnimationFrame(() => fitView({ duration: 400, padding: 0.1 }));
      } catch (err) {
        console.error('[useAutoLayout] ELK layout failed:', err);
      } finally {
        setIsLayouting(false);
      }
    }, 300);
  }, [getNodes, getEdges, setNodes, fitView]);

  return { triggerLayout, isLayouting };
}
