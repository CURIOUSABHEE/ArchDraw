import { Node, XYPosition } from 'reactflow';

export interface Point {
  x: number;
  y: number;
}

const GRID_SIZE = 20;
const NODE_PADDING = 30; // buffer around nodes

// Convert world coordinates to grid coordinates
function toGrid(val: number, minBound: number): number {
  return Math.floor((val - minBound) / GRID_SIZE);
}

// Convert grid coordinates to world coordinates
function toWorld(val: number, minBound: number): number {
  return val * GRID_SIZE + minBound + GRID_SIZE / 2;
}

class PriorityQueue<T> {
  private elements: { item: T; priority: number }[] = [];

  enqueue(item: T, priority: number) {
    this.elements.push({ item, priority });
    this.elements.sort((a, b) => a.priority - b.priority);
  }

  dequeue(): T | undefined {
    return this.elements.shift()?.item;
  }

  isEmpty(): boolean {
    return this.elements.length === 0;
  }
}

function manhattan(a: Point, b: Point): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function getSmartOrthogonalPath(
  source: XYPosition,
  target: XYPosition,
  nodes: Node[],
  borderRadius: number = 20,
  offset: number = 40
): { path: string; labelX: number; labelY: number; points: Point[] } {
  // Check if there are any obstacles between source and target
  const obstacles: Array<{ x: number; y: number; w: number; h: number }> = [];
  for (const node of nodes) {
    if (node.position && node.width && node.height) {
      obstacles.push({
        x: node.position.x - NODE_PADDING,
        y: node.position.y - NODE_PADDING,
        w: node.width + NODE_PADDING * 2,
        h: node.height + NODE_PADDING * 2,
      });
    }
  }

  // Check if direct path is blocked by any obstacle
  const sourceX = Math.min(source.x, target.x);
  const sourceY = Math.min(source.y, target.y);
  const targetX = Math.max(source.x, target.x);
  const targetY = Math.max(source.y, target.y);

  let pathBlocked = false;
  for (const obs of obstacles) {
    // Check if obstacle intersects with the bounding box of the connection
    const intersects = !(obs.x + obs.w < sourceX || obs.x > targetX || obs.y + obs.h < sourceY || obs.y > targetY);
    if (intersects) {
      pathBlocked = true;
      break;
    }
  }

  // If path is not blocked, use simple straight/smooth path
  if (!pathBlocked) {
    const midX = (source.x + target.x) / 2;
    const midY = (source.y + target.y) / 2;

    // Simple bezier path for smooth connection
    const cp1x = source.x + offset;
    const cp1y = source.y;
    const cp2x = target.x - offset;
    const cp2y = target.y;

    const dFn = `M ${source.x} ${source.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${target.x} ${target.y}`;

    return {
      path: dFn,
      labelX: midX,
      labelY: midY - 15,
      points: [
        { x: source.x, y: source.y },
        { x: midX, y: midY },
        { x: target.x, y: target.y },
      ],
    };
  }

  // 1. Determine bounds
  let minX = Math.min(source.x, target.x) - 200;
  let maxX = Math.max(source.x, target.x) + 200;
  let minY = Math.min(source.y, target.y) - 200;
  let maxY = Math.max(source.y, target.y) + 200;

  for (const node of nodes) {
    if (node.position) {
      minX = Math.min(minX, node.position.x - NODE_PADDING);
      maxX = Math.max(maxX, node.position.x + (node.width || 200) + NODE_PADDING);
      minY = Math.min(minY, node.position.y - NODE_PADDING);
      maxY = Math.max(maxY, node.position.y + (node.height || 100) + NODE_PADDING);
    }
  }

  // Define grid dimensions
  const cols = Math.ceil((maxX - minX) / GRID_SIZE);
  const rows = Math.ceil((maxY - minY) / GRID_SIZE);

  // Initialize grid obstacles
  const grid: boolean[][] = Array(rows).fill(false).map(() => Array(cols).fill(false));

  for (const node of nodes) {
    if (!node.position || !node.width || !node.height) continue;
    const nx1 = toGrid(node.position.x - NODE_PADDING, minX);
    const nx2 = toGrid(node.position.x + node.width + NODE_PADDING, minX);
    const ny1 = toGrid(node.position.y - NODE_PADDING, minY);
    const ny2 = toGrid(node.position.y + node.height + NODE_PADDING, minY);

    for (let y = Math.max(0, ny1); y <= Math.min(rows - 1, ny2); y++) {
      for (let x = Math.max(0, nx1); x <= Math.min(cols - 1, nx2); x++) {
        grid[y][x] = true;
      }
    }
  }

  // Setup start and end points via offset
  // Start goes right by 'offset', target comes from left by 'offset'
  const startP = { x: source.x + offset, y: source.y };
  const targetP = { x: target.x - offset, y: target.y };

  const startG = { x: toGrid(startP.x, minX), y: toGrid(startP.y, minY) };
  const targetG = { x: toGrid(targetP.x, minX), y: toGrid(targetP.y, minY) };

  // Make sure start and end aren't trapped in grid obstacles
  if (startG.y >= 0 && startG.y < rows && startG.x >= 0 && startG.x < cols) grid[startG.y][startG.x] = false;
  if (targetG.y >= 0 && targetG.y < rows && targetG.x >= 0 && targetG.x < cols) grid[targetG.y][targetG.x] = false;

  const queue = new PriorityQueue<Point>();
  queue.enqueue(startG, 0);

  const cameFrom = new Map<string, Point | null>();
  const costSoFar = new Map<string, number>();

  const startKey = `${startG.x},${startG.y}`;
  cameFrom.set(startKey, null);
  costSoFar.set(startKey, 0);

  const dirs = [
    { x: 0, y: 1 }, { x: 1, y: 0 },
    { x: 0, y: -1 }, { x: -1, y: 0 }
  ];

  let found = false;

  while (!queue.isEmpty()) {
    const current = queue.dequeue()!;

    if (current.x === targetG.x && current.y === targetG.y) {
      found = true;
      break;
    }

    const currKey = `${current.x},${current.y}`;
    const parent = cameFrom.get(currKey);

    for (const d of dirs) {
      const next = { x: current.x + d.x, y: current.y + d.y };

      if (next.x < 0 || next.x >= cols || next.y < 0 || next.y >= rows) continue;
      if (grid[next.y][next.x]) continue;

      let moveCost = 1;
      // Penalty for turning
      if (parent) {
        const dx = current.x - parent.x;
        const dy = current.y - parent.y;
        if (dx !== d.x || dy !== d.y) {
          moveCost += 2; // turning penalty to encourage straight lines
        }
      }

      const newCost = costSoFar.get(currKey)! + moveCost;
      const nextKey = `${next.x},${next.y}`;

      if (!costSoFar.has(nextKey) || newCost < costSoFar.get(nextKey)!) {
        costSoFar.set(nextKey, newCost);
        const priority = newCost + manhattan(next, targetG);
        queue.enqueue(next, priority);
        cameFrom.set(nextKey, current);
      }
    }
  }

  let rawPoints: Point[] = [];
  rawPoints.push(target); // end precisely at target
  rawPoints.push(targetP); // go to target offset point

  if (found) {
    let curr: Point | null = targetG;
    const pathG: Point[] = [];
    while (curr) {
      pathG.push(curr);
      curr = cameFrom.get(`${curr.x},${curr.y}`) || null;
    }
    pathG.reverse();
    rawPoints = rawPoints.concat(pathG.map(p => ({ x: toWorld(p.x, minX), y: toWorld(p.y, minY) })).reverse());
  } else {
    // Fallback if no path found - use simple bezier
    const midX = (source.x + target.x) / 2;
    const midY = (source.y + target.y) / 2;
    rawPoints = [source, { x: midX, y: midY }, target];
    const dFn = `M ${source.x} ${source.y} C ${source.x + offset} ${source.y}, ${target.x - offset} ${target.y}, ${target.x} ${target.y}`;
    return {
      path: dFn,
      labelX: midX,
      labelY: midY,
      points: rawPoints,
    };
  }

  rawPoints.reverse(); // Now from start toward target
  rawPoints.unshift(source); // start exactly at source
  rawPoints[1] = startP; // follow offset exactly

  // 3. Simplify points (remove collinear points)
  const waypoints = [rawPoints[0]];
  for (let i = 1; i < rawPoints.length - 1; i++) {
    const pPrev = rawPoints[i - 1];
    const p = rawPoints[i];
    const pNext = rawPoints[i + 1];

    const dx1 = Math.sign(p.x - pPrev.x);
    const dy1 = Math.sign(p.y - pPrev.y);
    const dx2 = Math.sign(pNext.x - p.x);
    const dy2 = Math.sign(pNext.y - p.y);

    if (dx1 !== dx2 || dy1 !== dy2) {
      waypoints.push(p);
    }
  }
  waypoints.push(rawPoints[rawPoints.length - 1]);

  // 4. Create SVG Path with rounded corners
  let dFn = `M ${waypoints[0].x} ${waypoints[0].y}`;

  for (let i = 1; i < waypoints.length - 1; i++) {
    const p0 = waypoints[i - 1];
    const p1 = waypoints[i];
    const p2 = waypoints[i + 1];

    // Calculate distance to previous and next points
    const distPrev = Math.hypot(p1.x - p0.x, p1.y - p0.y);
    const distNext = Math.hypot(p2.x - p1.x, p2.y - p1.y);

    const r = Math.min(borderRadius, distPrev / 2, distNext / 2);

    // Points for the curve
    const startArcX = p1.x + (p0.x === p1.x ? 0 : Math.sign(p0.x - p1.x) * r);
    const startArcY = p1.y + (p0.y === p1.y ? 0 : Math.sign(p0.y - p1.y) * r);

    const endArcX = p1.x + (p2.x === p1.x ? 0 : Math.sign(p2.x - p1.x) * r);
    const endArcY = p1.y + (p2.y === p1.y ? 0 : Math.sign(p2.y - p1.y) * r);

    dFn += ` L ${startArcX} ${startArcY}`;
    // Draw arc
    dFn += ` Q ${p1.x} ${p1.y} ${endArcX} ${endArcY}`;
  }
  dFn += ` L ${waypoints[waypoints.length - 1].x} ${waypoints[waypoints.length - 1].y}`;

  // 5. Calculate ideal label position
  // Find the longest segment
  let maxLen = 0;
  let labelX = source.x;
  let labelY = source.y - 15;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const p1 = waypoints[i];
    const p2 = waypoints[i + 1];
    const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);

    // We prefer horizontal segments for labels
    const isHorizontal = Math.abs(p1.y - p2.y) < 1;
    const weight = len * (isHorizontal ? 1.5 : 1);

    if (weight > maxLen) {
      maxLen = weight;
      labelX = (p1.x + p2.x) / 2;
      labelY = (p1.y + p2.y) / 2;
    }
  }

  return { path: dFn, labelX, labelY, points: waypoints };
}
