'use client';

import { Node, Edge, getSmoothStepPath, getBezierPath, Position } from 'reactflow';
import { NodeData } from '@/store/diagramStore';
import { resolveNodeColor } from '@/components/NodeIcon';
import { getEdgeConfig, getEffectivePathType, type EdgeData, type EdgeType, type PathType } from '@/data/edgeTypes';
import { 
  NODE_WIDTH, NODE_HEIGHT, BORDER_RADIUS, 
  LIGHT_NODE_STYLES, DARK_NODE_STYLES, STATUS_COLORS, 
  getTierColorNormalized, FONTS 
} from '@/lib/theme/stylingConstants';

function escapeXml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

interface SystemNodeRenderData {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  data: NodeData;
  selected?: boolean;
}

interface EdgeRenderData {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
  data: EdgeData | undefined;
  selected?: boolean;
}

function getPath(
  pathType: PathType,
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  sourcePosition: Position,
  targetPosition: Position
): string {

  if (pathType === 'bezier') {
    const [path] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
    return path;
  }
  
  if (pathType === 'Smoothstep' || pathType === 'smooth') {
    const [path] = getSmoothStepPath({ 
      sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition,
      borderRadius: pathType === 'smooth' ? 24 : 50
    });
    return path;
  }
  
  return `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
}

function getMarkerPath(config: { id: string; color: string }): string {
  return `<marker id="${config.id}" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
    <path d="M 0 0 L 0 6 L 6 3 z" fill="${config.color}"/>
  </marker>`;
}

function renderSystemNode(node: SystemNodeRenderData, isDark: boolean): string {
  const { x, y, width, height, data, selected } = node;
  const styles = isDark ? DARK_NODE_STYLES : LIGHT_NODE_STYLES;
  
  const tierColor = getTierColorNormalized(data.layer);
  const accentColor = data.accentColor || data.color || tierColor || '#0D9488';
  
  const borderColor = selected ? accentColor : styles.border;
  const borderWidth = selected ? 2 : 1.5;
  
  // Render backplates
  const backplateElements = styles.backplates.map((bp) => `
    <rect
      x="${bp.offset}" y="${bp.offset}"
      width="${width}" height="${height}"
      fill="${bp.color}"
      rx="${BORDER_RADIUS}" ry="${BORDER_RADIUS}"
    />
  `).join('');

  const statusColor = STATUS_COLORS[data.status || 'healthy'];
  const showStatus = data.status && data.status !== 'healthy';

  return `
    <g transform="translate(${x}, ${y})">
      ${backplateElements}
      <rect
        x="0" y="0"
        width="${width}" height="${height}"
        fill="${styles.background}"
        stroke="${borderColor}"
        stroke-width="${borderWidth}"
        rx="${BORDER_RADIUS}" ry="${BORDER_RADIUS}"
      />
      <!-- Header Icon Box -->
      <g transform="translate(10, 8)">
        <rect x="0" y="0" width="24" height="24" rx="6" fill="${accentColor}12" />
        <rect x="7" y="7" width="10" height="10" rx="2.5" fill="${accentColor}" />
      </g>
      <!-- Title -->
      <text
        x="40" y="24"
        fill="${styles.titleColor}"
        font-family="${FONTS.body}"
        font-size="12"
        font-weight="600"
      >${escapeXml(data.label)}</text>
      <!-- Subtitle -->
      ${data.subtitle ? `
      <text
        x="10" y="${height - 12}"
        fill="${styles.subtitleColor}"
        font-family="${FONTS.body}"
        font-size="10"
      >${escapeXml(data.subtitle)}</text>` : ''}
      <!-- Status Indicator -->
      ${showStatus ? `
      <circle cx="${width - 15}" cy="${height - 15}" r="3" fill="${statusColor}" />
      ` : ''}
    </g>
  `.trim();
}

function renderTextLabel(node: SystemNodeRenderData, isDark: boolean): string {
  const { x, y, data } = node;
  const styles = isDark ? DARK_NODE_STYLES : LIGHT_NODE_STYLES;
  
  return `
    <text
      x="${x}" y="${y}"
      fill="${styles.subtitleColor}"
      font-family="${FONTS.body}"
      font-size="12"
      text-anchor="start"
    >${escapeXml(data.label)}</text>
  `.trim();
}

function renderEdge(edge: EdgeRenderData, isDark: boolean): string {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, selected } = edge;
  
  const edgeType: EdgeType | undefined = data?.edgeType;
  const customPathType: PathType | undefined = data?.pathType;
  const pathType = getEffectivePathType(edgeType, customPathType);
  const connectionType = data?.connectionType || edgeType || 'sync';
  const config = getEdgeConfig(connectionType);
  
  const strokeColor = selected 
    ? (isDark ? '#9CA3AF' : '#374151')
    : data?.color || config.color;

  const strokeWidth = selected ? 2 : 1.5;
  const opacity = selected ? 1 : 0.85;
  
  const d = getPath(pathType, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition);
  
  const markerId = `arrow-${id}`;
  const marker = getMarkerPath({ id: markerId, color: strokeColor });
  
  let labelSVG = '';
  if (data?.label && !data?.hideLabel) {
    const labelX = (sourceX + targetX) / 2;
    const labelY = (sourceY + targetY) / 2 - 12;
    const styles = isDark ? DARK_NODE_STYLES : LIGHT_NODE_STYLES;
    
    labelSVG = `
      <g transform="translate(${labelX}, ${labelY})">
        <rect
          x="-${Math.max(40, data.label.length * 4)}"
          y="-8"
          width="${Math.max(80, data.label.length * 8)}"
          height="16"
          fill="${styles.background}"
          stroke="${styles.border}"
          stroke-width="0.5"
          rx="8"
        />
        <text
          x="0" y="4"
          fill="${styles.subtitleColor}"
          font-family="${FONTS.body}"
          font-size="10"
          text-anchor="middle"
        >${escapeXml(data.label)}</text>
      </g>
    `.trim();
  }
  
  return `
    <path
      d="${d}"
      fill="none"
      stroke="${strokeColor}"
      stroke-width="${strokeWidth}"
      stroke-opacity="${opacity}"
      stroke-dasharray="${config.dash || 'none'}"
      marker-end="url(#${markerId})"
    />
    ${marker}
    ${labelSVG}
  `.trim();
}

function getHandlePosition(node: Node, position: string): { x: number; y: number; pos: Position } {
  const width = node.data?.nodeWidth || NODE_WIDTH;
  const height = NODE_HEIGHT;
  
  switch (position) {
    case 'left': return { x: node.position.x, y: node.position.y + height / 2, pos: Position.Left };
    case 'right': return { x: node.position.x + width, y: node.position.y + height / 2, pos: Position.Right };
    case 'top': return { x: node.position.x + width / 2, y: node.position.y, pos: Position.Top };
    case 'bottom': return { x: node.position.x + width / 2, y: node.position.y + height, pos: Position.Bottom };
    default: return { x: node.position.x + width, y: node.position.y + height / 2, pos: Position.Right };
  }
}

function calculateBounds(nodes: Node[], edges: Edge[]): { minX: number; minY: number; maxX: number; maxY: number } {
  if (nodes.length === 0) {
    return { minX: 0, minY: 0, maxX: 800, maxY: 600 };
  }
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  for (const node of nodes) {
    const width = node.data?.nodeWidth || NODE_WIDTH;
    const height = NODE_HEIGHT;
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + width + 20); // include backplates
    maxY = Math.max(maxY, node.position.y + height + 20);
  }
  
  const padding = 50;
  return {
    minX: minX - padding,
    minY: minY - padding,
    maxX: maxX + padding,
    maxY: maxY + padding,
  };
}

export function generatePureSVG(
  nodes: Node[],
  edges: Edge[],
  isDark: boolean = true,
  backgroundColor: string = '#0f172a'
): string {
  const bounds = calculateBounds(nodes, edges);
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  
  const nodeElements: string[] = [];
  const edgeElements: string[] = [];
  
  for (const node of nodes) {
    const w = node.data?.nodeWidth || NODE_WIDTH;
    const h = NODE_HEIGHT;
    
    const nodeData: SystemNodeRenderData = {
      id: node.id,
      type: node.type || 'systemNode',
      x: node.position.x - bounds.minX,
      y: node.position.y - bounds.minY,
      width: w,
      height: h,
      data: node.data as NodeData,
      selected: node.selected,
    };
    
    if (node.type === 'textLabelNode' || node.type === 'annotationNode') {
      nodeElements.push(renderTextLabel(nodeData, isDark));
    } else {
      nodeElements.push(renderSystemNode(nodeData, isDark));
    }
  }
  
  for (const edge of edges) {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    
    if (!sourceNode || !targetNode) continue;
    
    const sourcePosStr = edge.sourceHandle || 'right';
    const targetPosStr = edge.targetHandle || 'left';
    
    const source = getHandlePosition(sourceNode, sourcePosStr);
    const target = getHandlePosition(targetNode, targetPosStr);
    
    const edgeData: EdgeRenderData = {
      id: edge.id,
      sourceX: source.x - bounds.minX,
      sourceY: source.y - bounds.minY,
      targetX: target.x - bounds.minX,
      targetY: target.y - bounds.minY,
      sourcePosition: source.pos,
      targetPosition: target.pos,
      data: edge.data as EdgeData | undefined,
      selected: edge.selected,
    };
    
    edgeElements.push(renderEdge(edgeData, isDark));
  }
  
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect x="0" y="0" width="${width}" height="${height}" fill="${backgroundColor}"/>
  <g id="edges">
${edgeElements.map(e => '    ' + e.replace(/\n/g, '\n    ')).join('\n')}
  </g>
  <g id="nodes">
${nodeElements.map(n => '    ' + n.replace(/\n/g, '\n    ')).join('\n')}
  </g>
</svg>`.trim();
  
  return svg;
}
