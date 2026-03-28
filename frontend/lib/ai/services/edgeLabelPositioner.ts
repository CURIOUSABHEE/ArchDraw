import type { ReactFlowNode, ReactFlowEdge } from '../types';
import type { EdgePath, Point } from './edgeLayout';

export interface LabelPosition {
  x: number;
  y: number;
  angle: number;
  alignment: 'center' | 'left' | 'right';
}

export interface LabelPositioningResult {
  positions: Map<string, LabelPosition>;
  collisions: LabelPositionCollision[];
  score: number;
}

export interface LabelPositionCollision {
  edgeId1: string;
  edgeId2?: string;
  type: 'overlap' | 'node-proximity' | 'edge-proximity';
  distance: number;
}

export interface LabelPositioningConfig {
  labelWidth: number;
  labelHeight: number;
  margin: number;
  avoidNodeMargin: number;
  avoidEdgeMargin: number;
  preferredPositions: LabelPositionPreference[];
}

export type LabelPositionPreference = 
  | 'center'
  | 'above'
  | 'below'
  | 'along-path';

const DEFAULT_CONFIG: LabelPositioningConfig = {
  labelWidth: 80,
  labelHeight: 20,
  margin: 15,
  avoidNodeMargin: 20,
  avoidEdgeMargin: 10,
  preferredPositions: ['center', 'above', 'below'],
};

export function computeOptimalLabelPositions(
  nodes: ReactFlowNode[],
  edges: ReactFlowEdge[],
  edgePaths: EdgePath[],
  config: Partial<LabelPositioningConfig> = {}
): LabelPositioningResult {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  
  const positions = new Map<string, LabelPosition>();
  const collisions: LabelPositionCollision[] = [];
  
  const nodeBoxes = nodes.map(n => ({
    id: n.id,
    box: {
      x: n.position.x,
      y: n.position.y,
      width: n.width ?? 160,
      height: n.height ?? 80,
    },
  }));
  
  const sortedPaths = [...edgePaths].sort((a, b) => {
    const aLen = calculatePathLength(a.waypoints);
    const bLen = calculatePathLength(b.waypoints);
    return bLen - aLen;
  });
  
  for (const path of sortedPaths) {
    const edge = edges.find(e => e.id === path.id);
    if (!edge) continue;
    
    const bestPosition = findBestLabelPosition(
      path,
      positions,
      nodeBoxes,
      cfg
    );
    
    positions.set(path.id, bestPosition);
    
    for (const [otherId, otherPos] of positions) {
      if (otherId === path.id) continue;
      
      const dist = Math.hypot(
        bestPosition.x - otherPos.x,
        bestPosition.y - otherPos.y
      );
      
      if (dist < cfg.margin * 2) {
        collisions.push({
          edgeId1: path.id,
          edgeId2: otherId,
          type: 'overlap',
          distance: dist,
        });
      }
    }
  }
  
  resolveCollisions(positions, collisions, nodeBoxes, cfg);
  
  let score = 100;
  score -= collisions.length * 10;
  
  for (const collision of collisions) {
    if (collision.type === 'overlap') {
      score -= 15;
    } else if (collision.type === 'node-proximity') {
      score -= 5;
    }
  }
  
  return {
    positions,
    collisions,
    score: Math.max(0, score),
  };
}

function findBestLabelPosition(
  path: EdgePath,
  existingPositions: Map<string, LabelPosition>,
  nodeBoxes: { id: string; box: Box }[],
  config: LabelPositioningConfig
): LabelPosition {
  const candidates = generateLabelCandidates(path, config);
  
  let bestCandidate = candidates[0];
  let bestScore = -Infinity;
  
  for (const candidate of candidates) {
    let score = 100;
    
    score -= calculateNodeProximityPenalty(candidate, nodeBoxes, config.avoidNodeMargin);
    score -= calculateEdgeProximityPenalty(candidate, existingPositions, config.avoidEdgeMargin);
    score -= calculateOverlapPenalty(candidate, existingPositions, config.margin);
    
    if (candidate.alignment === 'center') {
      score += 10;
    }
    
    const isOnPath = isPositionOnPath(candidate, path.waypoints);
    if (isOnPath) {
      score += 5;
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestCandidate = candidate;
    }
  }
  
  return bestCandidate;
}

function generateLabelCandidates(
  path: EdgePath,
  config: LabelPositioningConfig
): LabelPosition[] {
  const candidates: LabelPosition[] = [];
  const waypoints = path.waypoints;
  
  if (waypoints.length < 2) {
    return [{
      x: waypoints[0]?.x ?? 0,
      y: waypoints[0]?.y ?? 0,
      angle: 0,
      alignment: 'center',
    }];
  }
  
  const midIndex = Math.floor(waypoints.length / 2);
  const p1 = waypoints[midIndex - 1] ?? waypoints[0];
  const p2 = waypoints[midIndex] ?? waypoints[waypoints.length - 1];
  
  const centerX = (p1.x + p2.x) / 2;
  const centerY = (p1.y + p2.y) / 2;
  
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  
  candidates.push({
    x: centerX,
    y: centerY,
    angle,
    alignment: 'center',
  });
  
  candidates.push({
    x: centerX,
    y: centerY - config.labelHeight - 5,
    angle,
    alignment: 'center',
  });
  
  candidates.push({
    x: centerX,
    y: centerY + config.labelHeight + 5,
    angle,
    alignment: 'center',
  });
  
  if (waypoints.length >= 3) {
    const q1Index = Math.floor(waypoints.length / 4);
    const q3Index = Math.floor((waypoints.length * 3) / 4);
    
    const q1 = waypoints[q1Index];
    const q3 = waypoints[q3Index];
    
    if (q1) {
      candidates.push({
        x: q1.x,
        y: q1.y - config.labelHeight - 5,
        angle: 0,
        alignment: 'center',
      });
    }
    
    if (q3) {
      candidates.push({
        x: q3.x,
        y: q3.y - config.labelHeight - 5,
        angle: 0,
        alignment: 'center',
      });
    }
  }
  
  for (const pref of config.preferredPositions) {
    if (pref === 'center') continue;
    
    const offset = pref === 'above' ? -config.labelHeight - 8 : config.labelHeight + 8;
    
    candidates.push({
      x: centerX,
      y: centerY + offset,
      angle,
      alignment: 'center',
    });
  }
  
  return candidates;
}

function calculateNodeProximityPenalty(
  pos: LabelPosition,
  nodeBoxes: { id: string; box: Box }[],
  threshold: number
): number {
  let penalty = 0;
  
  for (const { box } of nodeBoxes) {
    const dist = distanceToBox(pos, box);
    
    if (dist < threshold) {
      penalty += (threshold - dist) * 2;
    }
    
    if (boxIntersectsLabel(pos, box)) {
      penalty += 100;
    }
  }
  
  return penalty;
}

function calculateEdgeProximityPenalty(
  pos: LabelPosition,
  existingPositions: Map<string, LabelPosition>,
  threshold: number
): number {
  let penalty = 0;
  
  for (const [, otherPos] of existingPositions) {
    const dist = Math.hypot(pos.x - otherPos.x, pos.y - otherPos.y);
    
    if (dist < threshold * 2) {
      penalty += (threshold * 2 - dist);
    }
  }
  
  return penalty;
}

function calculateOverlapPenalty(
  pos: LabelPosition,
  existingPositions: Map<string, LabelPosition>,
  threshold: number
): number {
  let penalty = 0;
  
  for (const [, otherPos] of existingPositions) {
    const dist = Math.hypot(pos.x - otherPos.x, pos.y - otherPos.y);
    
    if (dist < threshold * 1.5) {
      penalty += 50;
    }
  }
  
  return penalty;
}

function isPositionOnPath(pos: LabelPosition, waypoints: Point[]): boolean {
  const margin = 20;
  
  for (let i = 0; i < waypoints.length - 1; i++) {
    const p1 = waypoints[i];
    const p2 = waypoints[i + 1];
    
    const dist = pointToSegmentDistance(pos, p1, p2);
    if (dist < margin) {
      return true;
    }
  }
  
  return false;
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

function distanceToBox(pos: LabelPosition, box: Box): number {
  const closestX = Math.max(box.x, Math.min(pos.x, box.x + box.width));
  const closestY = Math.max(box.y, Math.min(pos.y, box.y + box.height));
  
  return Math.hypot(pos.x - closestX, pos.y - closestY);
}

function boxIntersectsLabel(pos: LabelPosition, box: Box): boolean {
  const halfW = 40;
  const halfH = 10;
  
  return !(
    pos.x + halfW < box.x ||
    pos.x - halfW > box.x + box.width ||
    pos.y + halfH < box.y ||
    pos.y - halfH > box.y + box.height
  );
}

function resolveCollisions(
  positions: Map<string, LabelPosition>,
  collisions: LabelPositionCollision[],
  nodeBoxes: { id: string; box: Box }[],
  config: LabelPositioningConfig
): void {
  const resolvedEdges = new Set<string>();
  
  for (const collision of collisions) {
    if (collision.type !== 'overlap') continue;
    
    const edge1Pos = positions.get(collision.edgeId1);
    const edge2Id = collision.edgeId2;
    
    if (!edge1Pos || !edge2Id) continue;
    
    const edge2Pos = positions.get(edge2Id);
    if (!edge2Pos) continue;
    
    if (!resolvedEdges.has(collision.edgeId1)) {
      const offset = config.margin * 1.5;
      const dx = edge2Pos.x - edge1Pos.x;
      const dy = edge2Pos.y - edge1Pos.y;
      const dist = Math.hypot(dx, dy);
      
      if (dist > 0) {
        const moveX = (dx / dist) * offset;
        const moveY = (dy / dist) * offset;
        
        positions.set(collision.edgeId1, {
          ...edge1Pos,
          x: edge1Pos.x - moveX,
          y: edge1Pos.y - moveY,
        });
        
        resolvedEdges.add(collision.edgeId1);
      }
    }
  }
}

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
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

export function adjustLabelPositionForViewport(
  position: LabelPosition,
  viewportWidth: number,
  viewportHeight: number,
  padding: number = 50
): LabelPosition {
  const halfW = 40;
  const halfH = 10;
  
  let { x, y } = position;
  
  if (x - halfW < padding) {
    x = padding + halfW;
  }
  if (x + halfW > viewportWidth - padding) {
    x = viewportWidth - padding - halfW;
  }
  
  if (y - halfH < padding) {
    y = padding + halfH;
  }
  if (y + halfH > viewportHeight - padding) {
    y = viewportHeight - padding - halfH;
  }
  
  return { ...position, x, y };
}

export function getLabelStyle(position: LabelPosition): React.CSSProperties {
  return {
    position: 'absolute',
    transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px)`,
    transformOrigin: 'center center',
    whiteSpace: 'nowrap',
  };
}
