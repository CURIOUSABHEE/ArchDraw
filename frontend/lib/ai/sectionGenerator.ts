import type { Node, Edge } from 'reactflow';
import { LAYER_COLORS, getCategoryColor, applyGridLayout, enhanceEdges, type LayoutSection } from './layoutEngine';

export interface SectionRendererData {
  label: string;
  color?: string;
  sectionId: string;
}

export { LAYER_COLORS, getCategoryColor };

export function generateSectionsAndEnhance(nodes: Node[], edges: Edge[]): {
  nodes: Node[];
  edges: Edge[];
  sections: LayoutSection[];
} {
  const { nodes: positionedNodes, sections } = applyGridLayout(nodes);
  const enhancedEdges = enhanceEdges(edges, positionedNodes);
  
  return {
    nodes: positionedNodes,
    edges: enhancedEdges,
    sections,
  };
}

export function getNodeVisualConfig(node: Node): {
  scale: number;
  opacity: number;
  borderWidth: number;
  showLabel: boolean;
} {
  const category = (node.data?.category as string) ?? '';
  const lower = category.toLowerCase();
  
  if (lower.includes('ai') || lower.includes('llm') || lower.includes('rag')) {
    return { scale: 1.05, opacity: 1, borderWidth: 2, showLabel: true };
  }
  if (lower.includes('observability') || lower.includes('monitoring') || lower.includes('logging')) {
    return { scale: 0.9, opacity: 0.7, borderWidth: 1, showLabel: true };
  }
  if (lower.includes('auth') || lower.includes('security')) {
    return { scale: 1, opacity: 1, borderWidth: 1.5, showLabel: true };
  }
  
  return { scale: 1, opacity: 1, borderWidth: 1, showLabel: true };
}

export const EDGE_STYLE_GUIDE = {
  primary: {
    stroke: '#6366f1',
    strokeWidth: '1.5px',
    opacity: 1,
    animated: true,
  },
  secondary: {
    stroke: '#64748b',
    strokeWidth: '1.5px',
    opacity: 0.8,
    animated: false,
  },
  supporting: {
    stroke: '#94a3b8',
    strokeWidth: '1px',
    opacity: 0.5,
    animated: false,
  },
};

export function getEdgeStyle(sourceNode: Node | undefined, targetNode: Node | undefined): {
  stroke: string;
  strokeWidth: number | string;
  opacity: number;
  animated: boolean;
} {
  if (!sourceNode || !targetNode) {
    return { stroke: '#64748b', strokeWidth: '1.5px', opacity: 0.6, animated: false };
  }

  const sourceCategory = (sourceNode.data?.category as string ?? '').toLowerCase();
  const targetCategory = (targetNode.data?.category as string ?? '').toLowerCase();

  if (
    (sourceCategory.includes('service') || sourceCategory.includes('server')) &&
    (targetCategory.includes('service') || targetCategory.includes('server') || targetCategory.includes('database'))
  ) {
    return EDGE_STYLE_GUIDE.primary;
  }

  if (
    targetCategory.includes('observability') || 
    targetCategory.includes('monitoring') ||
    targetCategory.includes('logging')
  ) {
    return EDGE_STYLE_GUIDE.supporting;
  }

  if (
    sourceCategory.includes('auth') ||
    targetCategory.includes('auth') ||
    sourceCategory.includes('cache') ||
    targetCategory.includes('cache')
  ) {
    return { stroke: '#f59e0b', strokeWidth: EDGE_STYLE_GUIDE.secondary.strokeWidth, opacity: EDGE_STYLE_GUIDE.secondary.opacity, animated: false };
  }

  return EDGE_STYLE_GUIDE.secondary;
}
