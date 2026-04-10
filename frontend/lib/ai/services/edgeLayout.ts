import type { ReactFlowNode, ReactFlowEdge } from '../types';

export interface EdgePath {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
  waypoints: Point[];
  labelPosition: Point;
  pathType: 'bezier' | 'straight' | 'orthogonal';
}

export interface Point {
  x: number;
  y: number;
}

export interface EdgeLayoutConfig {
  nodeMargin: number;
  edgeMargin: number;
  labelMargin: number;
  bendPointSpacing: number;
  routingMode: 'orthogonal' | 'straight' | 'auto';
}

const DEFAULT_CONFIG: EdgeLayoutConfig = {
  nodeMargin: 30,
  edgeMargin: 20,
  labelMargin: 15,
  bendPointSpacing: 40,
  routingMode: 'orthogonal',
};

// ============================================================================
// BIDIRECTIONAL EDGE DETECTION
// ============================================================================

export interface BidirectionalEdgeResult {
  bidirectionalPairs: Array<{ forward: string; reverse: string }>;
  hasBidirectionalEdges: boolean;
}

export function detectBidirectionalEdges(edges: ReactFlowEdge[]): BidirectionalEdgeResult {
  const bidirectionalPairs: Array<{ forward: string; reverse: string }> = [];
  const forwardEdges = new Map<string, string>();
  const reverseLookup = new Map<string, string>();

  for (const edge of edges) {
    const key = `${edge.source}→${edge.target}`;
    forwardEdges.set(key, edge.id);
    reverseLookup.set(edge.id, key);
  }

  for (const edge of edges) {
    const reverseKey = `${edge.target}→${edge.source}`;
    if (forwardEdges.has(reverseKey)) {
      const forwardId = forwardEdges.get(reverseKey)!;
      if (!bidirectionalPairs.some(p => p.forward === forwardId || p.reverse === forwardId)) {
        bidirectionalPairs.push({ forward: forwardId, reverse: edge.id });
      }
    }
  }

  return {
    bidirectionalPairs,
    hasBidirectionalEdges: bidirectionalPairs.length > 0,
  };
}

export function filterBidirectionalEdges(
  edges: ReactFlowEdge[],
  strategy: 'keep-forward' | 'keep-reverse' | 'keep-sync' | 'keep-async' = 'keep-forward'
): ReactFlowEdge[] {
  const { bidirectionalPairs } = detectBidirectionalEdges(edges);
  
  if (bidirectionalPairs.length === 0) return edges;

  const bidirectionalSet = new Set<string>();
  for (const pair of bidirectionalPairs) {
    if (strategy === 'keep-forward') {
      bidirectionalSet.add(pair.reverse);
    } else if (strategy === 'keep-reverse') {
      bidirectionalSet.add(pair.forward);
    } else if (strategy === 'keep-sync') {
      const forwardEdge = edges.find(e => e.id === pair.forward);
      const reverseEdge = edges.find(e => e.id === pair.reverse);
      const forwardIsSync = forwardEdge?.data?.communicationType === 'sync';
      const reverseIsSync = reverseEdge?.data?.communicationType === 'sync';
      if (forwardIsSync && !reverseIsSync) {
        bidirectionalSet.add(pair.reverse);
      } else if (reverseIsSync && !forwardIsSync) {
        bidirectionalSet.add(pair.forward);
      } else {
        bidirectionalSet.add(pair.reverse);
      }
    } else if (strategy === 'keep-async') {
      const forwardEdge = edges.find(e => e.id === pair.forward);
      const reverseEdge = edges.find(e => e.id === pair.reverse);
      const forwardIsAsync = forwardEdge?.data?.communicationType === 'async';
      const reverseIsAsync = reverseEdge?.data?.communicationType === 'async';
      if (forwardIsAsync && !reverseIsAsync) {
        bidirectionalSet.add(pair.reverse);
      } else if (reverseIsAsync && !forwardIsAsync) {
        bidirectionalSet.add(pair.forward);
      } else {
        bidirectionalSet.add(pair.reverse);
      }
    }
  }

  return edges.filter(edge => !bidirectionalSet.has(edge.id));
}

export function computeEdgeLayout(
  nodes: ReactFlowNode[],
  edges: ReactFlowEdge[],
  config: Partial<EdgeLayoutConfig> = {}
): EdgePath[] {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  
  const edgePaths: EdgePath[] = [];
  
  for (const edge of edges) {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);
    
    if (!sourceNode || !targetNode) continue;
    
    const sourceHandlePos = getHandlePosition(sourceNode, edge.sourceHandle);
    const targetHandlePos = getHandlePosition(targetNode, edge.targetHandle);
    
    const waypoints = computeWaypoints(
      sourceHandlePos,
      targetHandlePos,
      sourceNode,
      targetNode,
      edge,
      cfg
    );
    
    const labelPosition = computeLabelPosition(waypoints);
    
    edgePaths.push({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      waypoints,
      labelPosition,
      pathType: cfg.routingMode === 'orthogonal' ? 'orthogonal' : 'straight',
    });
  }
  
  return edgePaths;
}

function getHandlePosition(
  node: ReactFlowNode,
  handleId: string
): Point {
  const width = node.width ?? 160;
  const height = node.height ?? 80;
  const x = node.position.x;
  const y = node.position.y;
  
  switch (handleId) {
    case 'top':
      return { x: x + width / 2, y };
    case 'bottom':
      return { x: x + width / 2, y: y + height };
    case 'left':
      return { x, y: y + height / 2 };
    case 'right':
      return { x: x + width, y: y + height / 2 };
    case 'top-left':
      return { x: x + width * 0.25, y };
    case 'top-right':
      return { x: x + width * 0.75, y };
    case 'bottom-left':
      return { x: x + width * 0.25, y: y + height };
    case 'bottom-right':
      return { x: x + width * 0.75, y: y + height };
    case 'left-top':
      return { x, y: y + height * 0.25 };
    case 'left-mid':
      return { x, y: y + height * 0.5 };
    case 'left-bot':
      return { x, y: y + height * 0.75 };
    case 'right-top':
      return { x: x + width, y: y + height * 0.25 };
    case 'right-mid':
      return { x: x + width, y: y + height * 0.5 };
    case 'right-bot':
      return { x: x + width, y: y + height * 0.75 };
    default:
      return { x: x + width, y: y + height / 2 };
  }
}

function computeWaypoints(
  sourcePos: Point,
  targetPos: Point,
  sourceNode: ReactFlowNode,
  targetNode: ReactFlowNode,
  edge: ReactFlowEdge,
  config: EdgeLayoutConfig
): Point[] {
  const waypoints: Point[] = [sourcePos];
  
  const dx = targetPos.x - sourcePos.x;
  const dy = targetPos.y - sourcePos.y;
  
  const isHorizontalSource = sourcePos.x > sourceNode.position.x + (sourceNode.width ?? 160) / 2;
  const isHorizontalTarget = targetPos.x > targetNode.position.x + (targetNode.width ?? 160) / 2;
  
  if (Math.abs(dx) > Math.abs(dy)) {
    if (isHorizontalSource && isHorizontalTarget) {
      const midX = sourcePos.x + dx / 2;
      waypoints.push({ x: midX, y: sourcePos.y });
      waypoints.push({ x: midX, y: targetPos.y });
    } else if (isHorizontalSource) {
      const exitX = sourcePos.x + config.bendPointSpacing;
      waypoints.push({ x: exitX, y: sourcePos.y });
      waypoints.push({ x: exitX, y: targetPos.y });
    } else if (isHorizontalTarget) {
      const entryX = targetPos.x - config.bendPointSpacing;
      waypoints.push({ x: sourcePos.x, y: sourcePos.y + (dy > 0 ? config.bendPointSpacing : -config.bendPointSpacing) });
      waypoints.push({ x: entryX, y: waypoints[waypoints.length - 1].y });
      waypoints.push({ x: entryX, y: targetPos.y });
    } else {
      waypoints.push({ x: sourcePos.x, y: sourcePos.y + (dy > 0 ? config.bendPointSpacing : -config.bendPointSpacing) });
      waypoints.push({ x: targetPos.x, y: waypoints[waypoints.length - 1].y });
    }
  } else {
    if (!isHorizontalSource && !isHorizontalTarget) {
      const midY = sourcePos.y + dy / 2;
      waypoints.push({ x: sourcePos.x, y: midY });
      waypoints.push({ x: targetPos.x, y: midY });
    } else if (!isHorizontalSource) {
      const exitY = sourcePos.y + (dy > 0 ? config.bendPointSpacing : -config.bendPointSpacing);
      waypoints.push({ x: sourcePos.x, y: exitY });
      waypoints.push({ x: targetPos.x, y: exitY });
    } else if (!isHorizontalTarget) {
      const entryY = targetPos.y - (dy > 0 ? config.bendPointSpacing : -config.bendPointSpacing);
      waypoints.push({ x: sourcePos.x + config.bendPointSpacing, y: sourcePos.y });
      waypoints.push({ x: waypoints[waypoints.length - 1].x, y: entryY });
      waypoints.push({ x: targetPos.x, y: entryY });
    } else {
      waypoints.push({ x: sourcePos.x + config.bendPointSpacing, y: sourcePos.y });
      waypoints.push({ x: sourcePos.x + config.bendPointSpacing, y: targetPos.y });
    }
  }
  
  waypoints.push(targetPos);
  
  return simplifyWaypoints(waypoints);
}

function simplifyWaypoints(waypoints: Point[]): Point[] {
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

function computeLabelPosition(waypoints: Point[]): Point {
  if (waypoints.length < 2) return waypoints[0] ?? { x: 0, y: 0 };
  
  const midIndex = Math.floor(waypoints.length / 2);
  const p1 = waypoints[midIndex - 1] ?? waypoints[0];
  const p2 = waypoints[midIndex] ?? waypoints[waypoints.length - 1];
  
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
}

export function generateSvgPath(waypoints: Point[]): string {
  if (waypoints.length === 0) return '';
  if (waypoints.length === 1) return `M ${waypoints[0].x} ${waypoints[0].y}`;
  
  let path = `M ${waypoints[0].x} ${waypoints[0].y}`;
  
  for (let i = 1; i < waypoints.length; i++) {
    path += ` L ${waypoints[i].x} ${waypoints[i].y}`;
  }
  
  return path;
}

export function getOrthogonalPath(waypoints: Point[]): string {
  if (waypoints.length < 2) return '';
  
  let path = `M ${waypoints[0].x} ${waypoints[0].y}`;
  
  for (let i = 1; i < waypoints.length; i++) {
    const prev = waypoints[i - 1];
    const curr = waypoints[i];
    
    if (prev.x === curr.x || prev.y === curr.y) {
      path += ` L ${curr.x} ${curr.y}`;
    } else {
      path += ` L ${curr.x} ${prev.y} L ${curr.x} ${curr.y}`;
    }
  }
  
  return path;
}
