import ELK from 'elkjs/lib/elk.bundled.js';
import type { ReactFlowNode, ReactFlowEdge, ArchitectureNode, ArchitectureEdge } from '../types';
import type { EdgePath, Point } from './edgeLayout';

const elk = new ELK();

export interface ELKLayoutConfig {
  elkOptions?: Record<string, string>;
  nodeWidth?: number;
  nodeHeight?: number;
}

export const DEFAULT_NODE_WIDTH = 250;
export const DEFAULT_NODE_HEIGHT = 80;

const DEFAULT_ELK_OPTIONS = {
  'elk.algorithm': 'layered',
  'elk.direction': 'RIGHT',
  'elk.edgeRouting': 'SPLINES',
  'elk.portConstraints': 'FIXED_SIDE',
  'elk.layered.spacing.nodeNodeBetweenLayers': '250',
  'elk.spacing.nodeNode': '80',
  'elk.spacing.edgeEdge': '30',
  'elk.spacing.edgeNode': '40',
  'elk.spacing.labelNode': '40',
  'elk.layered.spacing.edgeNodeBetweenLayers': '60',
  'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
  'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
  'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
  'elk.layered.crossingMinimization.forceNodeModelOrder': 'false',
  'elk.layered.separatingEdges.strategy': 'CENTERING',
  'elk.layered.unnecessaryBendpoints': 'false',
  'elk.layered.mergeEdges': 'false',
  'elk.layered.spacing.edgeEdgeBetweenLayers': '50',
  'elk.edgeLabels.inline': 'true',
  'elk.edgeLabels.placement': 'CENTER',
};

interface ELKNode {
  id: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  children?: ELKNode[];
  edges?: ELKEdge[];
  ports?: ELKPort[];
}

interface ELKEdge {
  id: string;
  sources: string[];
  targets: string[];
  labels?: { text: string; width?: number; height?: number }[];
}

interface ELKPort {
  id: string;
  width?: number;
  height?: number;
  properties?: {
    'org.eclipse.elk.port.side': 'EAST' | 'WEST' | 'NORTH' | 'SOUTH';
    'org.eclipse.elk.port.anchor': 'CENTER' | 'LEFT' | 'RIGHT' | 'TOP' | 'BOTTOM';
  };
}

interface ELKGraph {
  id: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  children?: ELKNode[];
  edges?: ELKEdge[];
  ports?: ELKPort[];
}

interface ELKLayoutEdge {
  id: string;
  sections?: {
    startPoint?: { x: number; y: number };
    endPoint?: { x: number; y: number };
    bendPoints?: { x: number; y: number }[];
    incomingShape?: string;
    outgoingShape?: string;
  }[];
}

const LAYER_ORDER = ['client', 'gateway', 'service', 'queue', 'database', 'cache', 'external', 'devops'];
const MAX_LAYER_DISTANCE_FOR_BEZIER = 3;
const EDGE_ROUTING_COLLISION_THRESHOLD = 2;

export interface LayoutResult {
  nodes: ReactFlowNode[];
  edgePaths: EdgePath[];
  elkGraph: { id: string; x?: number; y?: number; width?: number; height?: number }[];
}

export async function computeELKLayout(
  nodes: ArchitectureNode[],
  edges: ArchitectureEdge[],
  config: ELKLayoutConfig = {}
): Promise<LayoutResult> {
  const nodeWidth = config.nodeWidth ?? DEFAULT_NODE_WIDTH;
  const nodeHeight = config.nodeHeight ?? DEFAULT_NODE_HEIGHT;
  const elkOptions = { ...DEFAULT_ELK_OPTIONS, ...config.elkOptions };

  const nodeLayerMap = new Map<string, number>();
  nodes.forEach((node, index) => {
    const layerIndex = LAYER_ORDER.indexOf(node.layer || 'service');
    nodeLayerMap.set(node.id, layerIndex >= 0 ? layerIndex : 4);
  });

  const incomingEdgeCount = new Map<string, number>();
  const outgoingEdgeCount = new Map<string, number>();
  edges.forEach(edge => {
    incomingEdgeCount.set(edge.target, (incomingEdgeCount.get(edge.target) || 0) + 1);
    outgoingEdgeCount.set(edge.source, (outgoingEdgeCount.get(edge.source) || 0) + 1);
  });

  function validateAndFixOrphanNodes(
    nodes: ArchitectureNode[],
    edges: ArchitectureEdge[]
  ): ArchitectureEdge[] {
    const connectedNodes = new Set<string>();
    
    edges.forEach(edge => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });

    const orphanNodes = nodes.filter(node => !connectedNodes.has(node.id));
    
    if (orphanNodes.length > 0) {
      console.log(`[ELK Layout] Found ${orphanNodes.length} orphan nodes: ${orphanNodes.map(n => n.id).join(', ')}`);
    }

    const fixedEdges = [...edges];
    const nodeMap = new Map(nodes.map(n => [n.layer || 'service', n]));
    const nodesByLayer = new Map<string, ArchitectureNode[]>();
    
    nodes.forEach(node => {
      const layer = node.layer || 'service';
      if (!nodesByLayer.has(layer)) {
        nodesByLayer.set(layer, []);
      }
      nodesByLayer.get(layer)!.push(node);
    });

    const layerOrder = ['client', 'gateway', 'service', 'queue', 'database', 'cache', 'external', 'devops'];

    for (const orphan of orphanNodes) {
      const orphanLayer = orphan.layer || 'service';
      const orphanLayerIndex = layerOrder.indexOf(orphanLayer);
      
      let targetNode: ArchitectureNode | undefined;
      let sourceNode: ArchitectureNode | undefined;
      
      for (let i = orphanLayerIndex + 1; i < layerOrder.length; i++) {
        const layerNodes = nodesByLayer.get(layerOrder[i]) || [];
        const connected = layerNodes.find(n => connectedNodes.has(n.id));
        if (connected) {
          targetNode = connected;
          break;
        }
      }
      
      if (!targetNode) {
        for (let i = orphanLayerIndex - 1; i >= 0; i--) {
          const layerNodes = nodesByLayer.get(layerOrder[i]) || [];
          const connected = layerNodes.find(n => connectedNodes.has(n.id));
          if (connected) {
            sourceNode = connected;
            break;
          }
        }
      }

      const defaultEdgeProps = {
        sourceHandle: 'right' as const,
        targetHandle: 'left' as const,
        communicationType: 'sync' as const,
        pathType: 'smooth' as const,
        labelPosition: 'center' as const,
        animated: false,
        style: {
          stroke: '#6366f1',
          strokeDasharray: '',
          strokeWidth: 2,
        },
        markerEnd: 'arrowclosed' as const,
        markerStart: 'none' as const,
      };

      if (targetNode) {
        fixedEdges.push({
          id: `auto-edge-${orphan.id}-to-${targetNode.id}`,
          source: orphan.id,
          target: targetNode.id,
          label: `${orphan.label} → ${targetNode.label}`,
          ...defaultEdgeProps,
        });
        console.log(`[ELK Layout] Connected orphan ${orphan.id} → ${targetNode.id}`);
      } else if (sourceNode) {
        fixedEdges.push({
          id: `auto-edge-${sourceNode.id}-to-${orphan.id}`,
          source: sourceNode.id,
          target: orphan.id,
          label: `${sourceNode.label} → ${orphan.label}`,
          ...defaultEdgeProps,
        });
        console.log(`[ELK Layout] Connected orphan ${sourceNode.id} → ${orphan.id}`);
      } else {
        const firstConnectedNode = nodes.find(n => n.id !== orphan.id && connectedNodes.has(n.id));
        if (firstConnectedNode) {
          fixedEdges.push({
            id: `auto-edge-${orphan.id}-to-${firstConnectedNode.id}`,
            source: orphan.id,
            target: firstConnectedNode.id,
            label: `${orphan.label} → ${firstConnectedNode.label}`,
            ...defaultEdgeProps,
          });
          console.log(`[ELK Layout] Connected orphan ${orphan.id} → ${firstConnectedNode.id}`);
        }
      }
    }

    return fixedEdges;
  }

  const validatedEdges = validateAndFixOrphanNodes(nodes, edges);

  console.log(`[ELK Layout] Validated edges: ${edges.length} → ${validatedEdges.length}`);

  function createDistributedPorts(nodeId: string, side: 'EAST' | 'WEST', count: number): ELKPort[] {
    const ports: ELKPort[] = [];
    const positions = getDistributedPositions(count);

    positions.forEach((pos, index) => {
      const anchor = pos === 0.5 ? 'CENTER' : pos < 0.5 ? 'TOP' : 'BOTTOM';
      ports.push({
        id: `${nodeId}-port-${side.toLowerCase()}-${index}`,
        width: 8,
        height: 8,
        properties: {
          'org.eclipse.elk.port.side': side,
          'org.eclipse.elk.port.anchor': anchor as 'CENTER' | 'TOP' | 'BOTTOM',
        },
      });
    });

    return ports;
  }

  function getDistributedPositions(count: number): number[] {
    if (count === 1) return [0.5];
    if (count === 2) return [0.3, 0.7];
    if (count === 3) return [0.25, 0.5, 0.75];
    const positions: number[] = [];
    for (let i = 0; i < count; i++) {
      positions.push((i + 1) / (count + 1));
    }
    return positions;
  }

  const elkNodes = nodes.map(node => {
    const width = node.width ?? nodeWidth;
    const height = node.height ?? nodeHeight;
    const inCount = validatedEdges.filter(e => e.target === node.id).length || incomingEdgeCount.get(node.id) || 0;
    const outCount = validatedEdges.filter(e => e.source === node.id).length || outgoingEdgeCount.get(node.id) || 0;

    const ports: ELKPort[] = [];

    if (inCount > 0) {
      ports.push(...createDistributedPorts(node.id, 'WEST', inCount));
    }
    if (outCount > 0) {
      ports.push(...createDistributedPorts(node.id, 'EAST', outCount));
    }

    if (inCount === 0 && outCount === 0) {
      ports.push({
        id: `${node.id}-port-west-default`,
        width: 10,
        height: 10,
        properties: {
          'org.eclipse.elk.port.side': 'WEST' as const,
          'org.eclipse.elk.port.anchor': 'CENTER' as const,
        },
      });
      ports.push({
        id: `${node.id}-port-east-default`,
        width: 10,
        height: 10,
        properties: {
          'org.eclipse.elk.port.side': 'EAST' as const,
          'org.eclipse.elk.port.anchor': 'CENTER' as const,
        },
      });
    }

    return {
      id: node.id,
      width,
      height,
      ports,
      layoutOptions: {
        'elk.nodeSize.constraints': 'MINIMUM_SIZE',
        'elk.nodeSize.minimum': `${width}, ${height}`,
        'elk.portConstraints': 'FIXED_SIDE',
      },
    };
  });

  function calculateLayerDistance(sourceId: string, targetId: string): number {
    const sourceLayer = nodeLayerMap.get(sourceId) ?? 0;
    const targetLayer = nodeLayerMap.get(targetId) ?? 0;
    return Math.abs(targetLayer - sourceLayer);
  }

  function getPortId(nodeId: string, side: 'source' | 'target', index: number, total: number): string {
    const portSide = side === 'source' ? 'EAST' : 'WEST';
    if (total <= 1) {
      return `${nodeId}-port-${portSide.toLowerCase()}-default`;
    }
    return `${nodeId}-port-${portSide.toLowerCase()}-${index}`;
  }

  function detectEdgeCollisionsInPaths(edgePaths: EdgePath[], nodes: ReactFlowNode[]): { collisionCount: number; collidingEdgeIds: Set<string> } {
    const collidingEdgeIds = new Set<string>();
    const nodeBoxes = new Map<string, { x: number; y: number; width: number; height: number }>();
    
    for (const node of nodes) {
      nodeBoxes.set(node.id, {
        x: node.position.x,
        y: node.position.y,
        width: node.width ?? nodeWidth,
        height: node.height ?? nodeHeight,
      });
    }

    for (let i = 0; i < edgePaths.length; i++) {
      const path1 = edgePaths[i];
      
      for (const wp of path1.waypoints) {
        for (const [nodeId, box] of nodeBoxes) {
          if (nodeId === path1.source || nodeId === path1.target) continue;
          
          if (wp.x >= box.x && wp.x <= box.x + box.width &&
              wp.y >= box.y && wp.y <= box.y + box.height) {
            collidingEdgeIds.add(path1.id);
            break;
          }
        }
      }

      for (let j = i + 1; j < edgePaths.length; j++) {
        const path2 = edgePaths[j];
        
        for (let k = 0; k < path1.waypoints.length - 1; k++) {
          for (let l = 0; l < path2.waypoints.length - 1; l++) {
            if (segmentsIntersect(
              path1.waypoints[k], path1.waypoints[k + 1],
              path2.waypoints[l], path2.waypoints[l + 1]
            )) {
              collidingEdgeIds.add(path1.id);
              collidingEdgeIds.add(path2.id);
            }
          }
        }
      }
    }

    return { collisionCount: collidingEdgeIds.size, collidingEdgeIds };
  }

  function segmentsIntersect(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
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

  const edgeSourceIndex = new Map<string, number>();
  const edgeTargetIndex = new Map<string, number>();

  const elkEdges = validatedEdges.map((edge, edgeIdx) => {
    const layerDistance = calculateLayerDistance(edge.source, edge.target);
    const useOrthogonal = layerDistance > MAX_LAYER_DISTANCE_FOR_BEZIER;
    const edgeRouting = useOrthogonal ? 'ORTHOGONAL' : 'SPLINES';

    const sourceIdx = edgeSourceIndex.get(edge.source) || 0;
    const targetIdx = edgeTargetIndex.get(edge.target) || 0;

    edgeSourceIndex.set(edge.source, sourceIdx + 1);
    edgeTargetIndex.set(edge.target, targetIdx + 1);

    const outCount = outgoingEdgeCount.get(edge.source) || 1;
    const inCount = incomingEdgeCount.get(edge.target) || 1;

    const sourcePortId = getPortId(edge.source, 'source', sourceIdx, outCount);
    const targetPortId = getPortId(edge.target, 'target', targetIdx, inCount);

    const edgeDef: {
      id: string;
      sources: string[];
      targets: string[];
      sourcePort?: string;
      targetPort?: string;
      labels?: { text: string; width: number; height: number }[];
      layoutOptions?: Record<string, string>;
    } = {
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
      sourcePort: sourcePortId,
      targetPort: targetPortId,
    };

    if (edge.label) {
      const labelLength = edge.label.length * 8;
      edgeDef.labels = [
        {
          text: edge.label,
          width: Math.min(Math.max(labelLength, 80), 150),
          height: 20,
        },
      ];
    }

    if (useOrthogonal) {
      edgeDef.layoutOptions = {
        'elk.edgeRouting': edgeRouting,
        'elk.layered.separatingEdges.strategy': 'CENTERING',
      };
    }

    console.log(`[ELK Layout] Edge ${edgeIdx}: ${edge.source} → ${edge.target}, sourcePort=${sourcePortId}, targetPort=${targetPortId}, distance=${layerDistance}, routing=${edgeRouting}`);

    return edgeDef;
  });

  try {
    const layoutStartTime = Date.now();
    console.log('[ELK Layout] Starting layout computation...');
    console.log(`[ELK Layout] Input nodes: ${nodes.length}, edges: ${edges.length}`);

    const elkGraph = await elk.layout({
      id: 'root',
      layoutOptions: {
        'elk.algorithm': elkOptions['elk.algorithm'],
        'elk.direction': elkOptions['elk.direction'],
        'elk.edgeRouting': elkOptions['elk.edgeRouting'],
        'elk.portConstraints': elkOptions['elk.portConstraints'],
        'elk.layered.spacing.nodeNodeBetweenLayers': elkOptions['elk.layered.spacing.nodeNodeBetweenLayers'],
        'elk.spacing.nodeNode': elkOptions['elk.spacing.nodeNode'],
        'elk.spacing.edgeEdge': elkOptions['elk.spacing.edgeEdge'],
        'elk.spacing.edgeNode': elkOptions['elk.spacing.edgeNode'],
        'elk.spacing.labelNode': elkOptions['elk.spacing.labelNode'],
        'elk.layered.spacing.edgeNodeBetweenLayers': elkOptions['elk.layered.spacing.edgeNodeBetweenLayers'],
        'elk.layered.considerModelOrder.strategy': elkOptions['elk.layered.considerModelOrder.strategy'],
        'elk.layered.nodePlacement.strategy': elkOptions['elk.layered.nodePlacement.strategy'],
        'elk.layered.crossingMinimization.strategy': elkOptions['elk.layered.crossingMinimization.strategy'],
        'elk.layered.crossingMinimization.forceNodeModelOrder': elkOptions['elk.layered.crossingMinimization.forceNodeModelOrder'],
        'elk.layered.separatingEdges.strategy': elkOptions['elk.layered.separatingEdges.strategy'],
        'elk.layered.unnecessaryBendpoints': elkOptions['elk.layered.unnecessaryBendpoints'],
        'elk.layered.mergeEdges': elkOptions['elk.layered.mergeEdges'],
        'elk.layered.spacing.edgeEdgeBetweenLayers': elkOptions['elk.layered.spacing.edgeEdgeBetweenLayers'],
        'elk.edgeLabels.inline': elkOptions['elk.edgeLabels.inline'],
        'elk.edgeLabels.placement': elkOptions['elk.edgeLabels.placement'],
      },
      children: elkNodes,
      edges: elkEdges,
    }) as ELKGraph;

    const layoutTime = Date.now() - layoutStartTime;
    console.log(`[ELK Layout] Completed in ${layoutTime}ms`);
    console.log(`[ELK Layout] Graph bounds: ${elkGraph.width ?? 0}x${elkGraph.height ?? 0}`);
    console.log(`[ELK Layout] ELK children count: ${elkGraph.children?.length ?? 0}`);

    const nodeMap = new Map<string, ArchitectureNode>();
    for (const node of nodes) {
      nodeMap.set(node.id, node);
    }

    const reactFlowNodes: ReactFlowNode[] = [];
    const allELKNodes = extractAllNodes(elkGraph);
    console.log(`[ELK Layout] Extracted nodes: ${allELKNodes.length}`);

    for (const elkNode of allELKNodes) {
      const originalNode = nodeMap.get(elkNode.id);
      if (!originalNode) {
        console.log(`[ELK Layout] No original node for: ${elkNode.id}`);
        continue;
      }

      reactFlowNodes.push({
        id: elkNode.id,
        type: 'systemNode',
        position: {
          x: elkNode.x ?? 0,
          y: elkNode.y ?? 0,
        },
        data: {
          label: originalNode.label,
          icon: originalNode.icon ?? 'box',
          layer: originalNode.layer,
        },
        width: originalNode.width ?? nodeWidth,
        height: originalNode.height ?? nodeHeight,
      });
    }

    console.log(`[ELK Layout] Final reactFlowNodes: ${reactFlowNodes.length}`);

    let edgePaths = extractEdgePathsFromELK(elkGraph, nodes);

    const collisionCheck = detectEdgeCollisionsInPaths(edgePaths, reactFlowNodes);
    if (collisionCheck.collisionCount > 0) {
      console.log(`[ELK Layout] Detected ${collisionCheck.collisionCount} edge collisions - rerunning with ORTHOGONAL routing for colliding edges`);

      const collidingEdgeIds = collisionCheck.collidingEdgeIds;
      const reroutedEdges = edges.map(edge => {
        const edgeDef: {
          id: string;
          sources: string[];
          targets: string[];
          sourcePort?: string;
          targetPort?: string;
          labels?: { text: string; width: number; height: number }[];
          layoutOptions?: Record<string, string>;
        } = {
          id: edge.id,
          sources: [edge.source],
          targets: [edge.target],
        };

        const sourceIdx = edgeSourceIndex.get(edge.source) || 0;
        const targetIdx = edgeTargetIndex.get(edge.target) || 0;
        edgeSourceIndex.set(edge.source, sourceIdx + 1);
        edgeTargetIndex.set(edge.target, targetIdx + 1);

        const outCount = outgoingEdgeCount.get(edge.source) || 1;
        const inCount = incomingEdgeCount.get(edge.target) || 1;

        edgeDef.sourcePort = getPortId(edge.source, 'source', sourceIdx, outCount);
        edgeDef.targetPort = getPortId(edge.target, 'target', targetIdx, inCount);

        if (edge.label) {
          const labelLength = edge.label.length * 8;
          edgeDef.labels = [
            {
              text: edge.label,
              width: Math.min(Math.max(labelLength, 80), 150),
              height: 20,
            },
          ];
        }

        if (collidingEdgeIds.has(edge.id)) {
          edgeDef.layoutOptions = {
            'elk.edgeRouting': 'ORTHOGONAL',
            'elk.layered.separatingEdges.strategy': 'CENTERING',
          };
          console.log(`[ELK Layout] Edge ${edge.id} -> ORTHOGONAL (collision detected)`);
        }

        return edgeDef;
      });

      const elkGraphRerouted = await elk.layout({
        id: 'root',
        layoutOptions: {
          'elk.algorithm': 'layered',
          'elk.direction': 'RIGHT',
          'elk.edgeRouting': 'SPLINES',
          'elk.portConstraints': 'FIXED_SIDE',
          'elk.layered.spacing.nodeNodeBetweenLayers': '300',
          'elk.spacing.nodeNode': '150',
          'elk.spacing.edgeEdge': '30',
          'elk.spacing.edgeNode': '60',
          'elk.spacing.labelNode': '40',
          'elk.layered.spacing.edgeNodeBetweenLayers': '60',
          'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
          'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
          'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
          'elk.layered.separatingEdges.strategy': 'CENTERING',
          'elk.edgeLabels.placement': 'CENTER',
        },
        children: elkNodes,
        edges: reroutedEdges,
      }) as ELKGraph;

      edgePaths = extractEdgePathsFromELK(elkGraphRerouted, nodes);
      console.log(`[ELK Layout] Rerouted layout completed`);
    }

    return {
      nodes: reactFlowNodes,
      edgePaths,
      elkGraph: allELKNodes,
    };
  } catch (error) {
    console.error('[ELK Layout] Error:', error);
    return computeFallbackLayout(nodes, edges, nodeWidth, nodeHeight);
  }
}

function extractAllNodes(elkNode: ELKGraph): { id: string; x?: number; y?: number; width?: number; height?: number }[] {
  const result: { id: string; x?: number; y?: number; width?: number; height?: number }[] = [];

  if (elkNode.id && elkNode.id !== 'root' && elkNode.x !== undefined && elkNode.y !== undefined) {
    result.push({
      id: elkNode.id,
      x: elkNode.x,
      y: elkNode.y,
      width: elkNode.width,
      height: elkNode.height,
    });
  }

  if (elkNode.children) {
    for (const child of elkNode.children) {
      result.push(...extractAllNodes(child));
    }
  }

  return result;
}

function extractEdgePathsFromELK(elkGraph: ELKGraph, nodes: ArchitectureNode[]): EdgePath[] {
  const edgePaths: EdgePath[] = [];
  const nodeMap = new Map<string, { x: number; y: number; width: number; height: number }>();

  const allNodes = extractAllNodes(elkGraph);
  for (const elkNode of allNodes) {
    const originalNode = nodes.find(n => n.id === elkNode.id);
    if (!originalNode) continue;

    nodeMap.set(elkNode.id, {
      x: elkNode.x ?? 0,
      y: elkNode.y ?? 0,
      width: originalNode.width ?? DEFAULT_NODE_WIDTH,
      height: originalNode.height ?? DEFAULT_NODE_HEIGHT,
    });
  }

  function extractEdges(graph: ELKGraph): void {
    if (graph.edges) {
      for (const elkEdge of graph.edges as ELKLayoutEdge[]) {
        if (!elkEdge.sections || elkEdge.sections.length === 0) continue;

        const waypoints: Point[] = [];
        const section = elkEdge.sections[0];

        if (section.startPoint) {
          waypoints.push({ x: section.startPoint.x, y: section.startPoint.y });
        }

        if (section.bendPoints) {
          for (const bend of section.bendPoints) {
            waypoints.push({ x: bend.x, y: bend.y });
          }
        }

        if (section.endPoint) {
          waypoints.push({ x: section.endPoint.x, y: section.endPoint.y });
        }

        if (waypoints.length >= 2) {
          edgePaths.push({
            id: elkEdge.id,
            source: elkEdge.sections[0]?.incomingShape ?? '',
            target: elkEdge.sections[0]?.outgoingShape ?? '',
            sourceHandle: 'right',
            targetHandle: 'left',
            waypoints,
            labelPosition: computeLabelPositionFromWaypoints(waypoints),
            pathType: 'orthogonal',
          });
        }
      }
    }

    if (graph.children) {
      for (const child of graph.children) {
        extractEdges(child);
      }
    }
  }

  extractEdges(elkGraph);

  return edgePaths;
}

function computeLabelPositionFromWaypoints(waypoints: Point[]): Point {
  if (waypoints.length < 2) return waypoints[0] ?? { x: 0, y: 0 };

  const midIndex = Math.floor(waypoints.length / 2);
  const p1 = waypoints[midIndex - 1] ?? waypoints[0];
  const p2 = waypoints[midIndex] ?? waypoints[waypoints.length - 1];

  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
}

function computeFallbackLayout(
  nodes: ArchitectureNode[],
  _edges: ArchitectureEdge[],
  nodeWidth: number,
  nodeHeight: number
): LayoutResult {
  console.warn('[ELK Layout] Using fallback layout');

  const LAYER_X_POSITIONS: Record<string, number> = {
    client: 50,
    gateway: 350,
    service: 650,
    queue: 950,
    database: 1250,
    cache: 1550,
    external: 1850,
    devops: 2150,
  };

  const LAYER_ORDER = ['client', 'gateway', 'service', 'queue', 'database', 'cache', 'external', 'devops'];

  const nodesByLayer: Record<string, ArchitectureNode[]> = {};
  for (const node of nodes) {
    const layer = node.layer || 'service';
    if (!nodesByLayer[layer]) {
      nodesByLayer[layer] = [];
    }
    nodesByLayer[layer].push(node);
  }

  const reactFlowNodes: ReactFlowNode[] = [];
  const verticalSpacing = nodeHeight + 60;

  for (const layer of LAYER_ORDER) {
    const layerNodes = nodesByLayer[layer] || [];
    if (layerNodes.length === 0) continue;

    const layerX = LAYER_X_POSITIONS[layer] ?? 400;

    const totalHeight = layerNodes.length * verticalSpacing - 60;
    const startY = Math.max(50, (800 - totalHeight) / 2);

    layerNodes.forEach((node, index) => {
      const y = startY + index * verticalSpacing;

      reactFlowNodes.push({
        id: node.id,
        type: 'systemNode',
        position: { x: layerX, y },
        data: {
          label: node.label,
          icon: node.icon ?? 'box',
          layer: node.layer,
        },
        width: node.width ?? nodeWidth,
        height: node.height ?? nodeHeight,
      });
    });
  }

  for (const node of nodes) {
    if (!reactFlowNodes.find(n => n.id === node.id)) {
      reactFlowNodes.push({
        id: node.id,
        type: 'systemNode',
        position: { x: 400, y: 50 + reactFlowNodes.length * verticalSpacing },
        data: {
          label: node.label,
          icon: node.icon ?? 'box',
          layer: node.layer,
        },
        width: node.width ?? nodeWidth,
        height: node.height ?? nodeHeight,
      });
    }
  }

  return {
    nodes: reactFlowNodes,
    edgePaths: [],
    elkGraph: [],
  };
}

export function computeEdgePathsWithELK(
  nodes: ReactFlowNode[],
  edges: ReactFlowEdge[],
  elkOptions?: Record<string, string>
): EdgePath[] {
  const edgePaths: EdgePath[] = [];
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  for (const edge of edges) {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);

    if (!sourceNode || !targetNode) continue;

    const sourceHandlePos = getHandlePosition(sourceNode, edge.sourceHandle);
    const targetHandlePos = getHandlePosition(targetNode, edge.targetHandle);

    const waypoints = computeSplineWaypoints(
      sourceHandlePos,
      targetHandlePos,
      sourceNode,
      targetNode,
      edge,
      elkOptions
    );

    edgePaths.push({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      waypoints,
      labelPosition: computeLabelPositionFromWaypoints(waypoints),
      pathType: 'orthogonal',
    });
  }

  return edgePaths;
}

function getHandlePosition(node: ReactFlowNode, handleId: string): Point {
  const width = node.width ?? DEFAULT_NODE_WIDTH;
  const height = node.height ?? DEFAULT_NODE_HEIGHT;
  const x = node.position.x;
  const y = node.position.y;

  switch (handleId) {
    case 'top':
      return { x: x + width / 2, y };
    case 'bottom':
      return { x: x + width / 2, y: y + height };
    case 'left':
    case 'left-mid':
      return { x, y: y + height / 2 };
    case 'right':
    case 'right-mid':
    default:
      return { x: x + width, y: y + height / 2 };
  }
}

function computeSplineWaypoints(
  sourcePos: Point,
  targetPos: Point,
  sourceNode: ReactFlowNode,
  targetNode: ReactFlowNode,
  _edge: ReactFlowEdge,
  elkOptions?: Record<string, string>
): Point[] {
  const waypoints: Point[] = [sourcePos];

  const dx = targetPos.x - sourcePos.x;
  const dy = targetPos.y - sourcePos.y;

  const edgeNodeMargin = parseInt(elkOptions?.['elk.spacing.edgeNode'] ?? '40', 10);
  const labelMargin = parseInt(elkOptions?.['elk.spacing.labelNode'] ?? '30', 10);

  const sourceWidth = sourceNode.width ?? DEFAULT_NODE_WIDTH;
  const sourceHeight = sourceNode.height ?? DEFAULT_NODE_HEIGHT;
  const targetWidth = targetNode.width ?? DEFAULT_NODE_WIDTH;
  const targetHeight = targetNode.height ?? DEFAULT_NODE_HEIGHT;

  const sourceCenterY = sourceNode.position.y + sourceHeight / 2;
  const targetCenterY = targetNode.position.y + targetHeight / 2;

  if (Math.abs(dx) > Math.abs(dy)) {
    const midX = sourcePos.x + dx / 2;
    waypoints.push({ x: midX, y: sourcePos.y });

    const verticalOffset = Math.abs(dy) > (sourceHeight + targetHeight) / 2
      ? 0
      : Math.sign(dy) * edgeNodeMargin;

    waypoints.push({ x: midX, y: targetCenterY + verticalOffset - labelMargin });
  } else {
    const midY = (sourceCenterY + targetCenterY) / 2;
    const exitX = sourcePos.x + edgeNodeMargin;
    const entryX = targetPos.x - edgeNodeMargin;

    waypoints.push({ x: exitX, y: sourcePos.y });
    waypoints.push({ x: exitX, y: midY });
    waypoints.push({ x: entryX, y: midY });
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

export function generateSVGPath(waypoints: Point[]): string {
  if (waypoints.length === 0) return '';
  if (waypoints.length === 1) return `M ${waypoints[0].x} ${waypoints[0].y}`;

  let path = `M ${waypoints[0].x} ${waypoints[0].y}`;

  for (let i = 1; i < waypoints.length; i++) {
    path += ` L ${waypoints[i].x} ${waypoints[i].y}`;
  }

  return path;
}

export function generateBezierPath(waypoints: Point[]): string {
  if (waypoints.length < 2) return '';
  if (waypoints.length === 2) {
    return `M ${waypoints[0].x} ${waypoints[0].y} C ${waypoints[0].x + 50} ${waypoints[0].y}, ${waypoints[1].x - 50} ${waypoints[1].y}, ${waypoints[1].x} ${waypoints[1].y}`;
  }

  const tension = 0.3;
  const smoothCorner = 40;

  let path = `M ${waypoints[0].x} ${waypoints[0].y}`;

  for (let i = 1; i < waypoints.length; i++) {
    const prev = waypoints[i - 1];
    const curr = waypoints[i];

    const isHorizontal = prev.y === curr.y;
    const isVertical = prev.x === curr.x;

    if (isHorizontal || isVertical) {
      path += ` L ${curr.x} ${curr.y}`;
    } else {
      const cp1x = prev.x + Math.sign(curr.x - prev.x) * smoothCorner;
      const cp1y = prev.y;
      const cp2x = curr.x - Math.sign(curr.x - prev.x) * smoothCorner;
      const cp2y = curr.y;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
    }
  }

  return path;
}

export function generateSmoothstepPath(waypoints: Point[]): string {
  if (waypoints.length < 2) return '';
  if (waypoints.length === 2) {
    return `M ${waypoints[0].x} ${waypoints[0].y} L ${waypoints[1].x} ${waypoints[1].y}`;
  }

  const cornerRadius = 8;
  let path = `M ${waypoints[0].x} ${waypoints[0].y}`;

  for (let i = 1; i < waypoints.length; i++) {
    const prev = waypoints[i - 1];
    const curr = waypoints[i];

    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;

    if (dx === 0 || dy === 0) {
      path += ` L ${curr.x} ${curr.y}`;
    } else {
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      const r = Math.min(cornerRadius, absDx / 2, absDy / 2);

      const midX = prev.x + dx / 2;
      const midY = prev.y + dy / 2;

      if (Math.abs(dx) > Math.abs(dy)) {
        const cornerX = prev.x + Math.sign(dx) * r;
        path += ` L ${cornerX} ${prev.y}`;
        path += ` Q ${prev.x + Math.sign(dx) * r * 2} ${prev.y}, ${prev.x + Math.sign(dx) * r * 2} ${prev.y + Math.sign(dy) * r}`;
        path += ` L ${prev.x + Math.sign(dx) * r * 2} ${curr.y - Math.sign(dy) * r}`;
        path += ` Q ${prev.x + Math.sign(dx) * r * 2} ${curr.y}, ${prev.x + Math.sign(dx) * r * 2 + Math.sign(dx) * r} ${curr.y}`;
        path += ` L ${curr.x} ${curr.y}`;
      } else {
        const cornerY = prev.y + Math.sign(dy) * r;
        path += ` L ${prev.x} ${cornerY}`;
        path += ` Q ${prev.x} ${prev.y + Math.sign(dy) * r * 2}, ${prev.x + Math.sign(dx) * r} ${prev.y + Math.sign(dy) * r * 2}`;
        path += ` L ${curr.x - Math.sign(dx) * r} ${prev.y + Math.sign(dy) * r * 2}`;
        path += ` Q ${curr.x} ${prev.y + Math.sign(dy) * r * 2}, ${curr.x} ${prev.y + Math.sign(dy) * r * 2 + Math.sign(dy) * r}`;
        path += ` L ${curr.x} ${curr.y}`;
      }
    }
  }

  return path;
}
