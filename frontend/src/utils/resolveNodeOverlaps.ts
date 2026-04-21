import type { Node } from 'reactflow';

function getNodeBounds(node: Node): { x: number; y: number; width: number; height: number } {
  const anyNode = node as Node & { measured?: { width: number; height: number }; width?: number; height?: number };
  const width = anyNode.measured?.width ?? anyNode.width ?? 150;
  const height = anyNode.measured?.height ?? anyNode.height ?? 150;
  return {
    x: node.position.x,
    y: node.position.y,
    width,
    height,
  };
}

function boxesOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
  margin: number
): boolean {
  return !(
    a.x + a.width + margin <= b.x ||
    a.x >= b.x + b.width + margin ||
    a.y + a.height + margin <= b.y ||
    a.y >= b.y + b.height + margin
  );
}

function getOverlapAmounts(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
): { overlapX: number; overlapY: number } {
  const left = Math.max(a.x, b.x);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const top = Math.max(a.y, b.y);
  const bottom = Math.min(a.y + a.height, b.y + b.height);

  const overlapX = right - left;
  const overlapY = bottom - top;

  return { overlapX: Math.max(0, overlapX), overlapY: Math.max(0, overlapY) };
}

export function resolveNodeOverlaps(nodes: Node[], margin: number = 20): Node[] {
  if (!nodes || nodes.length === 0) {
    return nodes;
  }

  const movableNodes = nodes.filter(
    n => !(n as Node & { dragging?: boolean }).dragging && !n.parentId
  );

  if (movableNodes.length === 0) {
    return nodes;
  }

  const nodeMap = new Map<string, Node>();
  movableNodes.forEach(n => nodeMap.set(n.id, n));

  let overlapFound = true;
  let iterations = 0;
  const maxIterations = 10;

  while (overlapFound && iterations < maxIterations) {
    overlapFound = false;
    iterations++;

    for (let i = 0; i < movableNodes.length; i++) {
      for (let j = i + 1; j < movableNodes.length; j++) {
        const nodeA = movableNodes[i] as Node & { measured?: { width: number; height: number }; width?: number; height?: number };
        const nodeB = movableNodes[j] as Node & { measured?: { width: number; height: number }; width?: number; height?: number };

        const boundsA = getNodeBounds(nodeA);
        const boundsB = getNodeBounds(nodeB);

        if (!boxesOverlap(boundsA, boundsB, margin)) {
          continue;
        }

        overlapFound = true;

        const { overlapX, overlapY } = getOverlapAmounts(boundsA, boundsB);

        const moveX = overlapX / 2;
        const moveY = overlapY / 2;

        if (overlapX < overlapY) {
          if (boundsA.x < boundsB.x) {
            nodeA.position.x -= moveX;
            nodeB.position.x += moveX;
          } else {
            nodeA.position.x += moveX;
            nodeB.position.x -= moveX;
          }
        } else {
          if (boundsA.y < boundsB.y) {
            nodeA.position.y -= moveY;
            nodeB.position.y += moveY;
          } else {
            nodeA.position.y += moveY;
            nodeB.position.y -= moveY;
          }
        }
      }
    }
  }

  const result: Node[] = [];
  for (const node of nodes) {
    if (nodeMap.has(node.id)) {
      const updated = nodeMap.get(node.id)!;
      result.push({ ...node, position: { ...updated.position } });
    } else {
      result.push(node);
    }
  }

  return result;
}