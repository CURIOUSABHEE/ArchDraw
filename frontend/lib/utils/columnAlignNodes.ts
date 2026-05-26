export function groupNodesByColumn<T extends { id: string }>(
  nodes: T[],
  getX: (node: T) => number,
  threshold = 60
): { x: number; nodes: T[] }[] {
  const columns: { x: number; nodes: T[] }[] = [];

  for (const node of nodes) {
    const xn = getX(node);
    let col = columns.find(c => Math.abs(c.x - xn) <= threshold);

    if (col) {
      col.nodes.push(node);
      col.x = col.nodes.reduce((sum, n) => sum + getX(n), 0) / col.nodes.length;
    } else {
      columns.push({ x: xn, nodes: [node] });
    }
  }

  return columns;
}

export function snapNodesToColumns<T extends { id: string }>(
  nodes: T[],
  getX: (node: T) => number,
  setX: (node: T, x: number) => T,
  threshold = 60
): T[] {
  const columns = groupNodesByColumn(nodes, getX, threshold);
  const columnMap = new Map<string, number>();

  for (const col of columns) {
    if (col.nodes.length < 2) continue;
    const snappedX = Math.round(col.x);
    for (const node of col.nodes) {
      columnMap.set(node.id, snappedX);
    }
  }

  return nodes.map(node => {
    const newX = columnMap.get(node.id);
    if (newX === undefined) return node;
    return setX(node, newX);
  });
}
