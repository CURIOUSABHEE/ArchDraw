import dagre from 'dagre';
import { Node, Edge } from 'reactflow';
import logger from './logger';
import { calculateNodeDimensions } from './utils/nodeSizing';
import { getTierForCategory } from './nodeShapes';

export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: 'LR' | 'TB' = 'LR'
): { nodes: Node[]; edges: Edge[] } {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // Rule 1: Minimum rank separation: 120px between tiers
  // Rule 1: Minimum node separation: 60px within same tier
  dagreGraph.setGraph({ 
    rankdir: direction,
    ranksep: 120,
    nodesep: 60,
    align: 'DL', // Alignment for nodes in same rank
  });

  nodes.forEach((node) => {
    const { label, subtitle, category } = node.data || {};
    const { width, height } = calculateNodeDimensions(label || '', subtitle);
    
    // Rule 3: Group all nodes into explicit tiers before rendering
    const tier = getTierForCategory(category || '');

    dagreGraph.setNode(node.id, { 
      width, 
      height,
      rank: tier // Suggesting rank to dagre based on Tier
    });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  try {
    dagre.layout(dagreGraph);
  } catch (e) {
    logger.error('[Layout] Dagre layout failed:', e);
    return { nodes, edges };
  }

  const layoutedNodes = nodes.map((node) => {
    const dagreNode = dagreGraph.node(node.id);
    const { x, y, width, height } = dagreNode;
    
    return {
      ...node,
      width,
      height,
      position: {
        x: x - width / 2,
        y: y - height / 2,
      },
      // Ensure data reflects the new dimensions for rendering
      data: {
        ...node.data,
        nodeWidth: width,
        nodeHeight: height,
      }
    };
  });

  return { nodes: layoutedNodes, edges };
}
