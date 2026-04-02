'use client';

import { Node, Edge } from 'reactflow';
import { NodeData } from '@/store/diagramStore';
import { resolveNodeColor } from '@/components/NodeIcon';
import { getEdgeConfig, getEffectivePathType, type EdgeData, type EdgeType, type PathType } from '@/data/edgeTypes';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Helper functions are available if needed in future
// function hexToRgb(hex: string): string { ... }

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
  sourcePosition: string;
  targetPosition: string;
  data: EdgeData | undefined;
  selected?: boolean;
}

function getPath(
  pathType: PathType,
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  sourcePosition: string,
  targetPosition: string
): string {
  const sx = sourceX;
  const sy = sourceY;
  const tx = targetX;
  const ty = targetY;
  
  const sourceRight = sourcePosition === 'right';
  const targetLeft = targetPosition === 'left';

  if (pathType === 'bezier') {
    const dist = Math.abs(tx - sx);
    const offset = Math.min(dist * 0.5, 150);
    const cp1x = sourceRight ? sx + offset : sx - offset;
    const cp2x = targetLeft ? tx - offset : tx + offset;
    return `M ${sx} ${sy} C ${cp1x} ${sy} ${cp2x} ${ty} ${tx} ${ty}`;
  }
  
  if (pathType === 'smooth') {
    const midX = (sx + tx) / 2;
    return `M ${sx} ${sy} L ${midX} ${sy} L ${midX} ${ty} L ${tx} ${ty}`;
  }
  
  if (pathType === 'step') {
    const midX = (sx + tx) / 2;
    return `M ${sx} ${sy} L ${midX} ${sy} L ${midX} ${ty} L ${tx} ${ty}`;
  }
  
  return `M ${sx} ${sy} L ${tx} ${ty}`;
}

function getMarkerPath(config: { id: string; color: string }): string {
  return `<marker id="${config.id}" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
    <path d="M 0 0 L 0 6 L 6 3 z" fill="${config.color}"/>
  </marker>`;
}

function getNodeIconSVG(technology?: string, icon?: string, color?: string): string {
  const iconMap: Record<string, string> = {
    'Server': 'M4 4h16v2H4zm0 4h16v2H4zm0 4h16v2H4z',
    'Database': 'M12 2C6.48 2 2 4.24 2 7v10c0 2.76 4.48 5 10 5s10-2.24 10-5V7c0-2.76-4.48-5-10-5z',
    'Cloud': 'M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z',
    'Cache': 'M12 2L2 7l10 5 10-5-10-5z',
    'Message': 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
    'CacheNode': 'M12 2L2 7l10 5 10-5-10-5z',
  };
  
  const pathData = iconMap[technology || icon || 'Server'] || iconMap['Server'];
  const fillColor = color || '#6366f1';
  return `<g transform="translate(8, 8) scale(0.8)">
    <path d="${pathData}" fill="${fillColor}" stroke="none"/>
  </g>`;
}

function renderSystemNode(node: SystemNodeRenderData, isDark: boolean): string {
  const { x, y, width, height, data, selected } = node;
  const resolvedColor = resolveNodeColor(data.technology, data.color);
  const bgColor = isDark ? '#1e2235' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#1e293b';
  
  const borderColor = selected ? resolvedColor : isDark ? `${resolvedColor}50` : `${resolvedColor}25`;
  const borderWidth = selected ? 2 : 1;
  const shadow = selected 
    ? `drop-shadow(0 0 4px ${resolvedColor}40)`
    : isDark ? 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))' : 'drop-shadow(0 2px 8px rgba(0,0,0,0.1))';
  
  return `
    <g transform="translate(${x}, ${y})" filter="${shadow}">
      <rect
        x="0" y="0"
        width="${width}" height="${height}"
        fill="${bgColor}"
        stroke="${borderColor}"
        stroke-width="${borderWidth}"
        rx="8" ry="8"
      />
      <g transform="translate(16, ${(height - 36) / 2})">
        <rect x="0" y="0" width="36" height="36" rx="8" fill="${resolvedColor}15" stroke="${resolvedColor}30" stroke-width="1"/>
        ${getNodeIconSVG(data.technology, data.icon, resolvedColor)}
      </g>
      <text
        x="60" y="${height / 2 + 4}"
        fill="${textColor}"
        font-family="system-ui, sans-serif"
        font-size="13"
        font-weight="700"
      >${escapeXml(data.label)}</text>
    </g>
  `.trim();
}

function renderBaseNode(node: SystemNodeRenderData, isDark: boolean): string {
  const { x, y, width, height, data, selected } = node;
  const resolvedColor = resolveNodeColor(data.technology, data.color);
  const bgColor = isDark ? '#1e2235' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#1e293b';
  const borderColor = selected ? resolvedColor : `${resolvedColor}30`;
  const borderWidth = selected ? 2 : 1;
  
  return `
    <g transform="translate(${x}, ${y})">
      <rect
        x="0" y="0"
        width="${width}" height="${height}"
        fill="${bgColor}"
        stroke="${borderColor}"
        stroke-width="${borderWidth}"
        rx="8" ry="8"
      />
      <text
        x="${width / 2}" y="${height / 2 + 4}"
        fill="${textColor}"
        font-family="system-ui, sans-serif"
        font-size="13"
        font-weight="600"
        text-anchor="middle"
      >${escapeXml(data.label)}</text>
    </g>
  `.trim();
}

function renderTextLabel(node: SystemNodeRenderData, isDark: boolean): string {
  const { x, y, data } = node;
  const textColor = isDark ? '#94a3b8' : '#475569';
  
  return `
    <text
      x="${x}" y="${y}"
      fill="${textColor}"
      font-family="system-ui, sans-serif"
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
  const config = getEdgeConfig(edgeType);
  
  const strokeColor = config.color;
  const strokeWidth = selected ? 2 : 1.5;
  const opacity = selected ? 1 : 0.85;
  
  const d = getPath(pathType, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition);
  
  const markerId = `arrow-${id}`;
  const marker = getMarkerPath({ id: markerId, color: strokeColor });
  
  let labelSVG = '';
  if (data?.label && !data?.hideLabel) {
    const labelX = (sourceX + targetX) / 2;
    const labelY = (sourceY + targetY) / 2 - 12;
    const bgColor = isDark ? '#1e293b' : '#ffffff';
    const textColor = isDark ? '#94a3b8' : '#475569';
    
    labelSVG = `
      <g transform="translate(${labelX}, ${labelY})">
        <rect
          x="-${Math.max(40, data.label.length * 4)}"
          y="-8"
          width="${Math.max(80, data.label.length * 8)}"
          height="16"
          fill="${bgColor}"
          rx="9999"
        />
        <text
          x="0" y="4"
          fill="${textColor}"
          font-family="system-ui, sans-serif"
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

function calculateBounds(nodes: Node[], edges: Edge[]): { minX: number; minY: number; maxX: number; maxY: number } {
  if (nodes.length === 0) {
    return { minX: 0, minY: 0, maxX: 800, maxY: 600 };
  }
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  for (const node of nodes) {
    const width = node.data?.nodeWidth || 200;
    const height = 80;
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + width);
    maxY = Math.max(maxY, node.position.y + height);
  }
  
  for (const edge of edges) {
    if (edge.source && edge.target) {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      if (sourceNode && targetNode) {
        const sPos = edge.sourceHandle || 'right';
        const tPos = edge.targetHandle || 'left';
        const s = getHandlePosition(sourceNode, sPos);
        const t = getHandlePosition(targetNode, tPos);
        minX = Math.min(minX, s.x, t.x);
        minY = Math.min(minY, s.y, t.y);
        maxX = Math.max(maxX, s.x, t.x);
        maxY = Math.max(maxY, s.y, t.y);
      }
    }
  }
  
  const padding = 50;
  return {
    minX: minX - padding,
    minY: minY - padding,
    maxX: maxX + padding,
    maxY: maxY + padding,
  };
}

function getHandlePosition(node: Node, position: string): { x: number; y: number } {
  const width = node.data?.nodeWidth || 200;
  const height = 80;
  
  switch (position) {
    case 'left': return { x: node.position.x, y: node.position.y + height / 2 };
    case 'right': return { x: node.position.x + width, y: node.position.y + height / 2 };
    case 'top': return { x: node.position.x + width / 2, y: node.position.y };
    case 'bottom': return { x: node.position.x + width / 2, y: node.position.y + height };
    default: return { x: node.position.x, y: node.position.y + height / 2 };
  }
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
  
  const edgeMap = new Map<string, string>();
  for (const edge of edges) {
    edgeMap.set(edge.source, edge.target);
  }
  
  for (const node of nodes) {
    const width = node.data?.nodeWidth || 200;
    const height = 80;
    
    const nodeData: SystemNodeRenderData = {
      id: node.id,
      type: node.type || 'systemNode',
      x: node.position.x - bounds.minX,
      y: node.position.y - bounds.minY,
      width,
      height,
      data: node.data as NodeData,
      selected: node.selected,
    };
    
    if (node.type === 'textLabelNode' || node.type === 'annotationNode') {
      nodeElements.push(renderTextLabel(nodeData, isDark));
    } else if (node.type === 'baseNode' || node.type === 'databaseNode' || node.type === 'cacheNode' || node.type === 'shapeNode' || node.type === 'groupNode') {
      nodeElements.push(renderBaseNode(nodeData, isDark));
    } else {
      nodeElements.push(renderSystemNode(nodeData, isDark));
    }
  }
  
  for (const edge of edges) {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    
    if (!sourceNode || !targetNode) continue;
    
    const sourcePos = edge.sourceHandle || 'right';
    const targetPos = edge.targetHandle || 'left';
    
    const source = getHandlePosition(sourceNode, sourcePos);
    const target = getHandlePosition(targetNode, targetPos);
    
    const edgeData: EdgeRenderData = {
      id: edge.id,
      sourceX: source.x - bounds.minX,
      sourceY: source.y - bounds.minY,
      targetX: target.x - bounds.minX,
      targetY: target.y - bounds.minY,
      sourcePosition: sourcePos,
      targetPosition: targetPos,
      data: edge.data as EdgeData | undefined,
      selected: edge.selected,
    };
    
    edgeElements.push(renderEdge(edgeData, isDark));
  }
  
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.3"/>
    </filter>
  </defs>
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