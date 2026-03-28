import type { ReactFlowNode, ReactFlowEdge } from '../types';
import type { EdgePath, Point } from './edgeLayout';

export interface PathOptimizationResult {
  optimizedPaths: EdgePath[];
  score: number;
  metrics: {
    totalLength: number;
    totalBends: number;
    edgeCrossings: number;
    parallelSeparation: number;
  };
}

export interface MultiEdgeGroup {
  source: string;
  target: string;
  edges: ReactFlowEdge[];
  optimalOffset: number;
}

export interface PathConstraint {
  sourceNode: ReactFlowNode;
  targetNode: ReactFlowNode;
  sourceHandle: string;
  targetHandle: string;
  preferredPath?: 'top' | 'bottom' | 'left' | 'right';
  avoidNodes?: string[];
  requiredWaypoints?: Point[];
}

export function optimizeEdgePaths(
  nodes: ReactFlowNode[],
  edges: ReactFlowEdge[],
  existingPaths: EdgePath[]
): PathOptimizationResult {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  
  const multiEdgeGroups = groupParallelEdges(edges);
  const optimizedPaths = [...existingPaths];
  
  let totalLength = 0;
  let totalBends = 0;
  let edgeCrossings = 0;
  let parallelSeparation = 0;
  
  for (const group of multiEdgeGroups) {
    if (group.edges.length > 1) {
      const separation = calculateOptimalSeparation(group.edges.length);
      parallelSeparation += separation;
      
      for (let i = 0; i < group.edges.length; i++) {
        const edge = group.edges[i];
        const pathIndex = optimizedPaths.findIndex(p => p.id === edge.id);
        
        if (pathIndex !== -1) {
          const offset = (i - (group.edges.length - 1) / 2) * separation;
          const path = optimizedPaths[pathIndex];
          const offsetWaypoints = applyParallelOffset(path.waypoints, offset, edge.sourceHandle);
          
          optimizedPaths[pathIndex] = {
            ...path,
            waypoints: offsetWaypoints,
            labelPosition: recalculateLabelPosition(offsetWaypoints),
          };
        }
      }
    }
  }
  
  for (const path of optimizedPaths) {
    totalLength += calculatePathLength(path.waypoints);
    totalBends += countBends(path.waypoints);
  }
  
  edgeCrossings = countEdgeCrossings(optimizedPaths);
  
  const score = calculateOptimizationScore({
    totalLength,
    totalBends,
    edgeCrossings,
    parallelSeparation,
    edgeCount: edges.length,
  });
  
  return {
    optimizedPaths,
    score,
    metrics: {
      totalLength,
      totalBends,
      edgeCrossings,
      parallelSeparation,
    },
  };
}

function groupParallelEdges(edges: ReactFlowEdge[]): MultiEdgeGroup[] {
  const groups: Map<string, ReactFlowEdge[]> = new Map();
  
  for (const edge of edges) {
    const key = `${edge.source}→${edge.target}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(edge);
  }
  
  const result: MultiEdgeGroup[] = [];
  
  for (const [key, groupEdges] of groups) {
    const [source, target] = key.split('→');
    const optimalOffset = calculateOptimalSeparation(groupEdges.length);
    
    result.push({
      source,
      target,
      edges: groupEdges,
      optimalOffset,
    });
  }
  
  return result;
}

function calculateOptimalSeparation(edgeCount: number): number {
  const baseOffset = 15;
  const scaleFactor = Math.sqrt(edgeCount);
  return Math.max(baseOffset, baseOffset * scaleFactor);
}

function applyParallelOffset(waypoints: Point[], offset: number, sourceHandle: string): Point[] {
  if (Math.abs(offset) < 1) return waypoints;
  
  const isHorizontalHandle = sourceHandle.includes('right') || sourceHandle.includes('left');
  
  return waypoints.map((wp, index) => {
    if (index === 0 || index === waypoints.length - 1) {
      return wp;
    }
    
    const isMidSegment = index < waypoints.length - 1;
    
    if (isHorizontalHandle) {
      return {
        x: wp.x,
        y: wp.y + offset,
      };
    } else {
      return {
        x: wp.x + offset,
        y: wp.y,
      };
    }
  });
}

function calculatePathLength(waypoints: Point[]): number {
  let length = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    length += Math.hypot(
      waypoints[i + 1].x - waypoints[i].x,
      waypoints[i + 1].y - waypoints[i].y
    );
  }
  return length;
}

function countBends(waypoints: Point[]): number {
  if (waypoints.length < 3) return 0;
  
  let bends = 0;
  for (let i = 1; i < waypoints.length - 1; i++) {
    const prev = waypoints[i - 1];
    const curr = waypoints[i];
    const next = waypoints[i + 1];
    
    const isHorizontal1 = prev.y === curr.y;
    const isVertical1 = prev.x === curr.x;
    const isHorizontal2 = curr.y === next.y;
    const isVertical2 = curr.x === next.x;
    
    if ((isHorizontal1 && isVertical2) || (isVertical1 && isHorizontal2)) {
      bends++;
    }
  }
  return bends;
}

function countEdgeCrossings(paths: EdgePath[]): number {
  let crossings = 0;
  
  for (let i = 0; i < paths.length; i++) {
    for (let j = i + 1; j < paths.length; j++) {
      if (areParallelEdges(paths[i], paths[j])) continue;
      
      if (pathsIntersect(paths[i].waypoints, paths[j].waypoints)) {
        crossings++;
      }
    }
  }
  
  return crossings;
}

function areParallelEdges(p1: EdgePath, p2: EdgePath): boolean {
  return p1.source === p2.source && p1.target === p2.target;
}

function pathsIntersect(path1: Point[], path2: Point[]): boolean {
  for (let i = 0; i < path1.length - 1; i++) {
    for (let j = 0; j < path2.length - 1; j++) {
      if (lineSegmentsIntersect(path1[i], path1[i + 1], path2[j], path2[j + 1])) {
        return true;
      }
    }
  }
  return false;
}

function lineSegmentsIntersect(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
  const d1 = direction(p3, p4, p1);
  const d2 = direction(p3, p4, p2);
  const d3 = direction(p1, p2, p3);
  const d4 = direction(p1, p2, p4);
  
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }
  
  return false;
}

function direction(p1: Point, p2: Point, p3: Point): number {
  return (p3.x - p1.x) * (p2.y - p1.y) - (p2.x - p1.x) * (p3.y - p1.y);
}

function calculateOptimizationScore(metrics: {
  totalLength: number;
  totalBends: number;
  edgeCrossings: number;
  parallelSeparation: number;
  edgeCount: number;
}): number {
  const lengthScore = Math.max(0, 100 - metrics.totalLength / 10);
  const bendScore = Math.max(0, 100 - metrics.totalBends * 5);
  const crossingScore = Math.max(0, 100 - metrics.edgeCrossings * 20);
  const separationScore = Math.min(100, metrics.parallelSeparation * 10);
  
  const weightLength = 0.25;
  const weightBend = 0.25;
  const weightCrossing = 0.35;
  const weightSeparation = 0.15;
  
  return Math.round(
    lengthScore * weightLength +
    bendScore * weightBend +
    crossingScore * weightCrossing +
    separationScore * weightSeparation
  );
}

function recalculateLabelPosition(waypoints: Point[]): Point {
  if (waypoints.length < 2) return waypoints[0] ?? { x: 0, y: 0 };
  
  const midIndex = Math.floor(waypoints.length / 2);
  const p1 = waypoints[midIndex - 1] ?? waypoints[0];
  const p2 = waypoints[midIndex] ?? waypoints[waypoints.length - 1];
  
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
}

export function findOptimalHandlePair(
  sourceNode: ReactFlowNode,
  targetNode: ReactFlowNode
): { sourceHandle: string; targetHandle: string } {
  const sourceX = sourceNode.position.x + (sourceNode.width ?? 160) / 2;
  const sourceY = sourceNode.position.y + (sourceNode.height ?? 80) / 2;
  const targetX = targetNode.position.x + (targetNode.width ?? 160) / 2;
  const targetY = targetNode.position.y + (targetNode.height ?? 80) / 2;
  
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  
  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0) {
      return { sourceHandle: 'right', targetHandle: 'left' };
    } else {
      return { sourceHandle: 'left', targetHandle: 'right' };
    }
  } else {
    if (dy > 0) {
      return { sourceHandle: 'bottom', targetHandle: 'top' };
    } else {
      return { sourceHandle: 'top', targetHandle: 'bottom' };
    }
  }
}

export function generateOrthogonalPath(
  sourcePos: Point,
  targetPos: Point,
  sourceHandle: string,
  targetHandle: string
): Point[] {
  const waypoints: Point[] = [sourcePos];
  
  const midX = (sourcePos.x + targetPos.x) / 2;
  const midY = (sourcePos.y + targetPos.y) / 2;
  
  if (sourceHandle === 'right' && targetHandle === 'left') {
    waypoints.push({ x: midX, y: sourcePos.y });
    waypoints.push({ x: midX, y: targetPos.y });
  } else if (sourceHandle === 'left' && targetHandle === 'right') {
    waypoints.push({ x: midX, y: sourcePos.y });
    waypoints.push({ x: midX, y: targetPos.y });
  } else if (sourceHandle === 'bottom' && targetHandle === 'top') {
    waypoints.push({ x: sourcePos.x, y: midY });
    waypoints.push({ x: targetPos.x, y: midY });
  } else if (sourceHandle === 'top' && targetHandle === 'bottom') {
    waypoints.push({ x: sourcePos.x, y: midY });
    waypoints.push({ x: targetPos.x, y: midY });
  } else if (sourceHandle === 'right' && targetHandle === 'top') {
    const exitY = Math.min(sourcePos.y, targetPos.y) - 30;
    waypoints.push({ x: sourcePos.x + 40, y: sourcePos.y });
    waypoints.push({ x: sourcePos.x + 40, y: exitY });
    waypoints.push({ x: targetPos.x, y: exitY });
  } else if (sourceHandle === 'bottom' && targetHandle === 'left') {
    const exitX = Math.min(sourcePos.x, targetPos.x) - 30;
    waypoints.push({ x: sourcePos.x, y: sourcePos.y + 40 });
    waypoints.push({ x: exitX, y: sourcePos.y + 40 });
    waypoints.push({ x: exitX, y: targetPos.y });
  } else {
    waypoints.push({ x: midX, y: sourcePos.y });
    waypoints.push({ x: midX, y: midY });
    waypoints.push({ x: targetPos.x, y: midY });
  }
  
  waypoints.push(targetPos);
  
  return simplifyOrthogonalPath(waypoints);
}

function simplifyOrthogonalPath(waypoints: Point[]): Point[] {
  if (waypoints.length <= 2) return waypoints;
  
  const simplified: Point[] = [waypoints[0]];
  
  for (let i = 1; i < waypoints.length - 1; i++) {
    const prev = simplified[simplified.length - 1];
    const curr = waypoints[i];
    const next = waypoints[i + 1];
    
    const isCollinear = 
      (prev.x === curr.x && curr.x === next.x) ||
      (prev.y === curr.y && curr.y === next.y);
    
    if (!isCollinear) {
      simplified.push(curr);
    }
  }
  
  simplified.push(waypoints[waypoints.length - 1]);
  return simplified;
}

export function selectBestPath(
  paths: Point[][],
  constraints: PathConstraint[],
  nodes: ReactFlowNode[]
): { path: Point[]; score: number } {
  const nodeSet = new Set(nodes.map(n => n.id));
  
  let bestPath = paths[0] ?? [];
  let bestScore = -Infinity;
  
  for (const path of paths) {
    let score = 100;
    
    for (let i = 0; i < path.length - 1; i++) {
      for (const node of nodes) {
        const nodeBox = {
          x: node.position.x - 20,
          y: node.position.y - 20,
          width: (node.width ?? 160) + 40,
          height: (node.height ?? 80) + 40,
        };
        
        if (lineIntersectsBox(path[i], path[i + 1], nodeBox)) {
          score -= 30;
        }
      }
    }
    
    const pathLength = calculatePathLength(path);
    score -= pathLength / 50;
    
    const bends = countBends(path);
    score -= bends * 5;
    
    if (score > bestScore) {
      bestScore = score;
      bestPath = path;
    }
  }
  
  return { path: bestPath, score: bestScore };
}

function lineIntersectsBox(
  p1: Point,
  p2: Point,
  box: { x: number; y: number; width: number; height: number }
): boolean {
  const minX = Math.min(p1.x, p2.x);
  const maxX = Math.max(p1.x, p2.x);
  const minY = Math.min(p1.y, p2.y);
  const maxY = Math.max(p1.y, p2.y);
  
  if (maxX < box.x || minX > box.x + box.width) return false;
  if (maxY < box.y || minY > box.y + box.height) return false;
  
  return true;
}
