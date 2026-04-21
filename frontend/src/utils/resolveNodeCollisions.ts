import type { Node } from 'reactflow';

export function resolveNodeCollisions(nodes: Node[], margin: number = 20): Node[] {
  const clonedNodes = nodes.map((n) => ({
    ...n,
    position: { ...n.position },
  }));

  let overlapFound = true;
  let iterations = 0;
  const maxIterations = 100;

  while (overlapFound && iterations < maxIterations) {
    overlapFound = false;
    iterations++;

    for (let i = 0; i < clonedNodes.length; i++) {
      for (let j = i + 1; j < clonedNodes.length; j++) {
        const A = clonedNodes[i];
        const B = clonedNodes[j];

        if ((A as Node & { dragging?: boolean }).dragging || (B as Node & { dragging?: boolean }).dragging) {
          continue;
        }

        if (A.parentId || B.parentId) {
          continue;
        }

        const aWidth = (A as Node & { measured?: { width: number; height: number } }).measured?.width ?? A.width ?? 150;
        const aHeight = (A as Node & { measured?: { width: number; height: number } }).measured?.height ?? A.height ?? 50;
        const bWidth = (B as Node & { measured?: { width: number; height: number } }).measured?.width ?? B.width ?? 150;
        const bHeight = (B as Node & { measured?: { width: number; height: number } }).measured?.height ?? B.height ?? 50;

        const aLeft = A.position.x - margin / 2;
        const aRight = A.position.x + aWidth + margin / 2;
        const aTop = A.position.y - margin / 2;
        const aBottom = A.position.y + aHeight + margin / 2;

        const bLeft = B.position.x - margin / 2;
        const bRight = B.position.x + bWidth + margin / 2;
        const bTop = B.position.y - margin / 2;
        const bBottom = B.position.y + bHeight + margin / 2;

        const overlapX = Math.min(aRight, bRight) - Math.max(aLeft, bLeft);
        const overlapY = Math.min(aBottom, bBottom) - Math.max(aTop, bTop);

        if (overlapX > 0 && overlapY > 0) {
          overlapFound = true;

          if (overlapX < overlapY) {
            const moveX = overlapX / 2;
            if (A.position.x < B.position.x) {
              A.position.x -= moveX;
              B.position.x += moveX;
            } else {
              A.position.x += moveX;
              B.position.x -= moveX;
            }
          } else {
            const moveY = overlapY / 2;
            if (A.position.y < B.position.y) {
              A.position.y -= moveY;
              B.position.y += moveY;
            } else {
              A.position.y += moveY;
              B.position.y -= moveY;
            }
          }
        }
      }
    }
  }

  return clonedNodes;
}
