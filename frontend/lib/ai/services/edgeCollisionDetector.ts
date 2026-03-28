import type { ReactFlowNode, ReactFlowEdge } from '../types';
import type { EdgePath, Point } from './edgeLayout';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Collision {
  type: 'edge-node' | 'edge-edge' | 'label-node' | 'label-label';
  edgeId1: string;
  edgeId2?: string;
  nodeId?: string;
  severity: 'critical' | 'warning' | 'info';
  description: string;
  resolution: string;
}

export interface CollisionReport {
  hasCollisions: boolean;
  collisions: Collision[];
  edgeCollisions: Collision[];
  nodeCollisions: Collision[];
  labelCollisions: Collision[];
  totalCollisions: number;
  criticalCount: number;
  warningCount: number;
}

const DEFAULT_THRESHOLDS = {
  edgeNodeMargin: 10,
  edgeEdgeMargin: 5,
  labelNodeMargin: 15,
  labelLabelMargin: 30,
  labelWidth: 80,
  labelHeight: 20,
};

export function detectEdgeCollisions(
  nodes: ReactFlowNode[],
  edges: ReactFlowEdge[],
  edgePaths: EdgePath[],
  thresholds: Partial<typeof DEFAULT_THRESHOLDS> = {}
): CollisionReport {
  const t = { ...DEFAULT_THRESHOLDS, ...thresholds };
  
  const nodeBoxes = new Map<string, BoundingBox>();
  for (const node of nodes) {
    nodeBoxes.set(node.id, {
      x: node.position.x,
      y: node.position.y,
      width: node.width ?? 160,
      height: node.height ?? 80,
    });
  }
  
  const collisions: Collision[] = [];
  
  for (const edgePath of edgePaths) {
    const edge = edges.find(e => e.id === edgePath.id);
    if (!edge) continue;
    
    for (const [nodeId, nodeBox] of nodeBoxes) {
      if (nodeId === edge.source || nodeId === edge.target) continue;
      
      if (edgeIntersectsNode(edgePath.waypoints, nodeBox, t.edgeNodeMargin)) {
        collisions.push({
          type: 'edge-node',
          edgeId1: edge.id,
          nodeId,
          severity: 'critical',
          description: `Edge ${edge.id} passes through node ${nodeId}`,
          resolution: `Reroute edge ${edge.id} around node ${nodeId}`,
        });
      }
      
      if (labelIntersectsNode(edgePath.labelPosition, nodeBox, t.labelNodeMargin, t.labelWidth, t.labelHeight)) {
        collisions.push({
          type: 'label-node',
          edgeId1: edge.id,
          nodeId,
          severity: 'warning',
          description: `Edge label for ${edge.id} overlaps with node ${nodeId}`,
          resolution: `Reposition label for edge ${edge.id}`,
        });
      }
    }
  }
  
  for (let i = 0; i < edgePaths.length; i++) {
    for (let j = i + 1; j < edgePaths.length; j++) {
      const ep1 = edgePaths[i];
      const ep2 = edgePaths[j];
      
      if (pathsIntersect(ep1.waypoints, ep2.waypoints, t.edgeEdgeMargin)) {
        const isParallel = ep1.source === ep2.source && ep1.target === ep2.target;
        
        collisions.push({
          type: 'edge-edge',
          edgeId1: ep1.id,
          edgeId2: ep2.id,
          severity: isParallel ? 'warning' : 'info',
          description: isParallel
            ? `Parallel edges ${ep1.id} and ${ep2.id} overlap`
            : `Edges ${ep1.id} and ${ep2.id} cross each other`,
          resolution: isParallel
            ? `Add separation offset between ${ep1.id} and ${ep2.id}`
            : `Reroute one of ${ep1.id} or ${ep2.id}`,
        });
      }
      
      if (labelsOverlap(ep1.labelPosition, ep2.labelPosition, t.labelLabelMargin, t.labelWidth, t.labelHeight)) {
        collisions.push({
          type: 'label-label',
          edgeId1: ep1.id,
          edgeId2: ep2.id,
          severity: 'warning',
          description: `Labels for edges ${ep1.id} and ${ep2.id} overlap`,
          resolution: `Reposition labels for edges ${ep1.id} and ${ep2.id}`,
        });
      }
    }
  }
  
  const edgeCollisions = collisions.filter(c => c.type === 'edge-node' || c.type === 'edge-edge');
  const nodeCollisions = collisions.filter(c => c.type === 'label-node');
  const labelCollisions = collisions.filter(c => c.type === 'label-label');
  
  return {
    hasCollisions: collisions.length > 0,
    collisions,
    edgeCollisions,
    nodeCollisions,
    labelCollisions,
    totalCollisions: collisions.length,
    criticalCount: collisions.filter(c => c.severity === 'critical').length,
    warningCount: collisions.filter(c => c.severity === 'warning').length,
  };
}

function edgeIntersectsNode(waypoints: Point[], nodeBox: BoundingBox, margin: number): boolean {
  const expandedBox = {
    x: nodeBox.x - margin,
    y: nodeBox.y - margin,
    width: nodeBox.width + margin * 2,
    height: nodeBox.height + margin * 2,
  };
  
  for (let i = 0; i < waypoints.length - 1; i++) {
    const p1 = waypoints[i];
    const p2 = waypoints[i + 1];
    
    if (lineIntersectsRect(p1, p2, expandedBox)) {
      return true;
    }
  }
  
  return false;
}

function lineIntersectsRect(p1: Point, p2: Point, rect: BoundingBox): boolean {
  const minX = Math.min(p1.x, p2.x);
  const maxX = Math.max(p1.x, p2.x);
  const minY = Math.min(p1.y, p2.y);
  const maxY = Math.max(p1.y, p2.y);
  
  if (maxX < rect.x || minX > rect.x + rect.width) return false;
  if (maxY < rect.y || minY > rect.y + rect.height) return false;
  
  if (p1.x >= rect.x && p1.x <= rect.x + rect.width &&
      p1.y >= rect.y && p1.y <= rect.y + rect.height) {
    return true;
  }
  if (p2.x >= rect.x && p2.x <= rect.x + rect.width &&
      p2.y >= rect.y && p2.y <= rect.y + rect.height) {
    return true;
  }
  
  const left = { x: rect.x, y: rect.y };
  const right = { x: rect.x + rect.width, y: rect.y };
  const bottomLeft = { x: rect.x, y: rect.y + rect.height };
  const bottomRight = { x: rect.x + rect.width, y: rect.y + rect.height };
  
  return (
    linesIntersect(p1, p2, left, right) ||
    linesIntersect(p1, p2, right, bottomRight) ||
    linesIntersect(p1, p2, bottomRight, bottomLeft) ||
    linesIntersect(p1, p2, bottomLeft, left)
  );
}

function linesIntersect(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
  const d1 = direction(p3, p4, p1);
  const d2 = direction(p3, p4, p2);
  const d3 = direction(p1, p2, p3);
  const d4 = direction(p1, p2, p4);
  
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }
  
  if (d1 === 0 && onSegment(p3, p4, p1)) return true;
  if (d2 === 0 && onSegment(p3, p4, p2)) return true;
  if (d3 === 0 && onSegment(p1, p2, p3)) return true;
  if (d4 === 0 && onSegment(p1, p2, p4)) return true;
  
  return false;
}

function direction(p1: Point, p2: Point, p3: Point): number {
  return (p3.x - p1.x) * (p2.y - p1.y) - (p2.x - p1.x) * (p3.y - p1.y);
}

function onSegment(p1: Point, p2: Point, p: Point): boolean {
  return (
    Math.min(p1.x, p2.x) <= p.x && p.x <= Math.max(p1.x, p2.x) &&
    Math.min(p1.y, p2.y) <= p.y && p.y <= Math.max(p1.y, p2.y)
  );
}

function labelIntersectsNode(labelPos: Point, nodeBox: BoundingBox, margin: number, labelWidth: number, labelHeight: number): boolean {
  const labelBox: BoundingBox = {
    x: labelPos.x - labelWidth / 2,
    y: labelPos.y - labelHeight / 2,
    width: labelWidth,
    height: labelHeight,
  };
  
  const expandedNode = {
    x: nodeBox.x - margin,
    y: nodeBox.y - margin,
    width: nodeBox.width + margin * 2,
    height: nodeBox.height + margin * 2,
  };
  
  return boxesIntersect(labelBox, expandedNode);
}

function labelsOverlap(pos1: Point, pos2: Point, margin: number, labelWidth: number, labelHeight: number): boolean {
  const box1: BoundingBox = {
    x: pos1.x - labelWidth / 2 - margin,
    y: pos1.y - labelHeight / 2 - margin,
    width: labelWidth + margin * 2,
    height: labelHeight + margin * 2,
  };
  
  const box2: BoundingBox = {
    x: pos2.x - labelWidth / 2 - margin,
    y: pos2.y - labelHeight / 2 - margin,
    width: labelWidth + margin * 2,
    height: labelHeight + margin * 2,
  };
  
  return boxesIntersect(box1, box2);
}

function boxesIntersect(a: BoundingBox, b: BoundingBox): boolean {
  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  );
}

function pathsIntersect(path1: Point[], path2: Point[], margin: number): boolean {
  for (let i = 0; i < path1.length - 1; i++) {
    for (let j = 0; j < path2.length - 1; j++) {
      const p1 = path1[i];
      const p2 = path1[i + 1];
      const p3 = path2[j];
      const p4 = path2[j + 1];
      
      if (linesIntersect(p1, p2, p3, p4)) {
        return true;
      }
      
      const dist = segmentDistance(p1, p2, p3, p4);
      if (dist < margin) {
        return true;
      }
    }
  }
  return false;
}

function segmentDistance(p1: Point, p2: Point, p3: Point, p4: Point): number {
  const minDist = Math.min(
    pointToSegmentDistance(p1, p3, p4),
    pointToSegmentDistance(p2, p3, p4),
    pointToSegmentDistance(p3, p1, p2),
    pointToSegmentDistance(p4, p1, p2)
  );
  return minDist;
}

function pointToSegmentDistance(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  
  if (len2 === 0) {
    return Math.hypot(p.x - a.x, p.y - a.y);
  }
  
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  
  const proj = {
    x: a.x + t * dx,
    y: a.y + t * dy,
  };
  
  return Math.hypot(p.x - proj.x, p.y - proj.y);
}

export function resolveCollisions(
  nodes: ReactFlowNode[],
  edges: ReactFlowEdge[],
  edgePaths: EdgePath[],
  collisions: Collision[]
): { resolvedPaths: EdgePath[]; resolution: string[] } {
  const resolutions: string[] = [];
  const updatedPaths = [...edgePaths];
  
  const edgeNodeCollisions = collisions.filter(c => c.type === 'edge-node');
  for (const collision of edgeNodeCollisions) {
    const pathIndex = updatedPaths.findIndex(p => p.id === collision.edgeId1);
    if (pathIndex === -1) continue;
    
    const path = updatedPaths[pathIndex];
    const newWaypoints = avoidNodeCollision(path.waypoints, collision.nodeId!, nodes);
    
    updatedPaths[pathIndex] = {
      ...path,
      waypoints: newWaypoints,
      labelPosition: computeNewLabelPosition(newWaypoints),
    };
    
    resolutions.push(`Rerouted ${collision.edgeId1} around node ${collision.nodeId}`);
  }
  
  const labelCollisions = collisions.filter(c => c.type === 'label-label' || c.type === 'label-node');
  const labelMap = new Map<string, Point>();
  
  for (const collision of labelCollisions) {
    const pathIndex = updatedPaths.findIndex(p => p.id === collision.edgeId1);
    if (pathIndex === -1) continue;
    
    const path = updatedPaths[pathIndex];
    const newLabelPos = findSafeLabelPosition(path.labelPosition, path.waypoints, labelMap, nodes);
    labelMap.set(path.id, newLabelPos);
    
    updatedPaths[pathIndex] = {
      ...path,
      labelPosition: newLabelPos,
    };
    
    resolutions.push(`Repositioned label for ${collision.edgeId1}`);
  }
  
  return { resolvedPaths: updatedPaths, resolution: resolutions };
}

function avoidNodeCollision(waypoints: Point[], nodeId: string, nodes: ReactFlowNode[]): Point[] {
  const node = nodes.find(n => n.id === nodeId);
  if (!node) return waypoints;
  
  const nodeBox: BoundingBox = {
    x: node.position.x,
    y: node.position.y,
    width: node.width ?? 160,
    height: node.height ?? 80,
  };
  
  const margin = 40;
  const expandedBox = {
    x: nodeBox.x - margin,
    y: nodeBox.y - margin,
    width: nodeBox.width + margin * 2,
    height: nodeBox.height + margin * 2,
  };
  
  const newWaypoints: Point[] = [];
  
  for (let i = 0; i < waypoints.length; i++) {
    const wp = waypoints[i];
    const newWp = { ...wp };
    
    if (pointInBox(newWp, expandedBox)) {
      if (wp.x < expandedBox.x + expandedBox.width / 2) {
        newWp.x = expandedBox.x - 5;
      } else {
        newWp.x = expandedBox.x + expandedBox.width + 5;
      }
    }
    
    newWaypoints.push(newWp);
  }
  
  return simplifyPath(newWaypoints);
}

function pointInBox(p: Point, box: BoundingBox): boolean {
  return (
    p.x >= box.x &&
    p.x <= box.x + box.width &&
    p.y >= box.y &&
    p.y <= box.y + box.height
  );
}

function simplifyPath(waypoints: Point[]): Point[] {
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

function computeNewLabelPosition(waypoints: Point[]): Point {
  const midIndex = Math.floor(waypoints.length / 2);
  const p1 = waypoints[midIndex - 1] ?? waypoints[0];
  const p2 = waypoints[midIndex] ?? waypoints[waypoints.length - 1];
  
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2 - 15,
  };
}

function findSafeLabelPosition(
  currentPos: Point,
  waypoints: Point[],
  existingLabels: Map<string, Point>,
  nodes: ReactFlowNode[]
): Point {
  const offsets = [
    { x: 0, y: -15 },
    { x: 0, y: 15 },
    { x: -20, y: 0 },
    { x: 20, y: 0 },
    { x: -15, y: -10 },
    { x: 15, y: -10 },
    { x: -15, y: 10 },
    { x: 15, y: 10 },
  ];
  
  for (const offset of offsets) {
    const testPos = {
      x: currentPos.x + offset.x,
      y: currentPos.y + offset.y,
    };
    
    let safe = true;
    
    for (const [, labelPos] of existingLabels) {
      const dist = Math.hypot(testPos.x - labelPos.x, testPos.y - labelPos.y);
      if (dist < 30) {
        safe = false;
        break;
      }
    }
    
    if (safe) {
      for (const node of nodes) {
        const nodeBox: BoundingBox = {
          x: node.position.x,
          y: node.position.y,
          width: node.width ?? 160,
          height: node.height ?? 80,
        };
        if (labelIntersectsNode(testPos, nodeBox, 10, 80, 20)) {
          safe = false;
          break;
        }
      }
    }
    
    if (safe) return testPos;
  }
  
  return currentPos;
}
