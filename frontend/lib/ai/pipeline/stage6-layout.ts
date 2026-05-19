import type { LayoutedNode, ValidatedDiagram, PipelineLayer, RawNode, DiagramEdge } from './types';

const NODE_WIDTH = 180;
const NODE_HEIGHT = 70;
const COLUMN_SPACING = 20; // Horizontal spacing between columns
const MIN_VERTICAL_SPACING = 5; // Minimum vertical spacing between nodes
const LABEL_SPACING = 12; // Spacing when edge label is present
const START_X = 100;
const START_Y = 100;

const COLUMN_ORDER = ['presentation', 'application', 'data'] as const;
type ColumnType = typeof COLUMN_ORDER[number];

// Map PipelineLayer to 3 columns
function getNodeColumn(node: RawNode): ColumnType {
  const layer = node.layer as PipelineLayer;
  switch (layer) {
    case 'presentation':
      return 'presentation';
    case 'application':
      return 'application';
    case 'data':
      return 'data';
    default:
      return 'application';
  }
}

export async function applyLayout(validated: ValidatedDiagram): Promise<LayoutedNode[]> {
  const { nodes, edges } = validated;
  console.log(`[Layout] Processing ${nodes.length} nodes, ${edges.length} edges`);
  return applyThreeColumnLayout(nodes, edges);
}

function applyThreeColumnLayout(nodes: RawNode[], edges: DiagramEdge[]): LayoutedNode[] {
  // Build adjacency map
  const adjacencyMap = new Map<string, Set<string>>();
  for (const node of nodes) {
    adjacencyMap.set(node.id, new Set());
  }
  for (const edge of edges) {
    adjacencyMap.get(edge.source)?.add(edge.target);
    adjacencyMap.get(edge.target)?.add(edge.source);
  }

  // Group nodes by column
  const columnGroups = new Map<ColumnType, RawNode[]>();
  for (const node of nodes) {
    const col = getNodeColumn(node);
    if (!columnGroups.has(col)) {
      columnGroups.set(col, []);
    }
    columnGroups.get(col)!.push(node);
  }

  // Sort nodes within each column by connectivity
  for (const [, nodesInCol] of columnGroups.entries()) {
    nodesInCol.sort((a, b) => {
      const aConnections = adjacencyMap.get(a.id)?.size || 0;
      const bConnections = adjacencyMap.get(b.id)?.size || 0;
      return bConnections - aConnections;
    });
  }

  // Calculate x positions for each column
  const columnX: Record<ColumnType, number> = {
    presentation: START_X,
    application: START_X + NODE_WIDTH + COLUMN_SPACING,
    data: START_X + 2 * (NODE_WIDTH + COLUMN_SPACING),
  };

  // Calculate total height for each column
  const columnTotalHeights = new Map<ColumnType, number>();
  let maxTotalHeight = 0;
  for (const col of COLUMN_ORDER) {
    const nodesInCol = columnGroups.get(col) || [];
    const totalH = nodesInCol.length * NODE_HEIGHT + (nodesInCol.length - 1) * MIN_VERTICAL_SPACING;
    columnTotalHeights.set(col, totalH);
    maxTotalHeight = Math.max(maxTotalHeight, totalH);
  }

  const result: LayoutedNode[] = [];

  // Position nodes column by column
  COLUMN_ORDER.forEach((col) => {
    const nodesInCol = columnGroups.get(col) || [];
    if (nodesInCol.length === 0) return;

    const x = columnX[col];
    const totalHeight = columnTotalHeights.get(col) || 0;
    const startY = START_Y + (maxTotalHeight - totalHeight) / 2;
    let currentY = startY;

    nodesInCol.forEach((node, nodeIdx) => {
      result.push({
        ...node,
        x,
        y: currentY,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      });

      // Determine vertical spacing for next node
      const nextNode = nodesInCol[nodeIdx + 1];
      if (nextNode) {
        let spacing = MIN_VERTICAL_SPACING;
        const hasEdgeLabel = edges.some(edge => {
          return edge.label && edge.label.trim() !== '' && 
            (edge.source === node.id || edge.target === node.id ||
             edge.source === nextNode.id || edge.target === nextNode.id);
        });
        if (hasEdgeLabel) {
          spacing = LABEL_SPACING;
        }
        currentY += NODE_HEIGHT + spacing;
      } else {
        currentY += NODE_HEIGHT;
      }
    });
  });

  // Handle orphan nodes
  const orphanNodes = result.filter(node => {
    const connections = adjacencyMap.get(node.id);
    return !connections || connections.size === 0;
  });

  if (orphanNodes.length > 0) {
    console.log(`[Layout] Found ${orphanNodes.length} orphan nodes`);
  }

  console.log(`[Layout] Positioned ${result.length} nodes in 3 columns`);
  return result;
}
