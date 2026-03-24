import type { Node, Edge } from 'reactflow';

const CHAR_WIDTH_PX   = 7.8;
const NODE_PADDING_H  = 48;
const NODE_MIN_WIDTH  = 180;
const NODE_MAX_WIDTH  = 220;
const NODE_HEIGHT     = 130;
const COLUMN_GAP      = 420;
const ROW_GAP         = 140;
const CANVAS_MARGIN_X = 120;
const CANVAS_MARGIN_Y = 100;

const LAYER_COLUMN_ORDER = ['A', 'B', 'C', 'D'];

export const LAYER_COLORS: Record<string, { bg: string; border: string; text: string; label: string }> = {
  A: { bg: '#6366f1', border: '#818cf8', text: '#e0e7ff', label: 'Client / Edge' },
  B: { bg: '#0891b2', border: '#22d3ee', text: '#cffafe', label: 'Services' },
  C: { bg: '#059669', border: '#34d399', text: '#d1fae5', label: 'Data Layer' },
  D: { bg: '#7c3aed', border: '#a78bfa', text: '#ede9fe', label: 'External' },
};

export const COMPONENT_CATEGORY_COLORS: Record<string, string> = {
  'AI Agents': '#8b5cf6',
  'LLM Models': '#7c3aed',
  'RAG': '#6d28d9',
  'Vector Databases': '#5b21b6',
  'ML Infrastructure': '#4c1d95',
  'AI Frameworks': '#8b5cf6',
  observability: '#64748b',
  monitoring: '#64748b',
  logging: '#64748b',
  metrics: '#64748b',
  auth: '#f59e0b',
  security: '#f59e0b',
  database: '#10b981',
  cache: '#10b981',
  queue: '#10b981',
  storage: '#10b981',
  default: '#6366f1',
};

export function getCategoryColor(category: string): string {
  const lower = category?.toLowerCase() ?? '';
  for (const [key, color] of Object.entries(COMPONENT_CATEGORY_COLORS)) {
    if (lower.includes(key.toLowerCase())) return color;
  }
  return COMPONENT_CATEGORY_COLORS.default;
}

export function computeNodeWidth(label: string): number {
  return Math.min(NODE_MAX_WIDTH,
    Math.max(NODE_MIN_WIDTH, label.length * CHAR_WIDTH_PX + NODE_PADDING_H * 2));
}

function getNodeLayer(node: Node): string {
  const layer = (node.data?.layer as string) || '';
  if (['A', 'B', 'C', 'D'].includes(layer)) return layer;
  const key   = ((node.data?.componentKey as string) ?? '').toLowerCase();
  const label = ((node.data?.label        as string) ?? '').toLowerCase();

  if (key.includes('api_gateway') || key.includes('load_balancer') || key.includes('cdn') ||
      key.includes('client') || key.includes('mobile') || key.includes('web_app') ||
      label.includes('gateway') || label.includes('mobile app') || label.includes('web app') ||
      label.includes('admin panel') || label.includes('cdn') || label.includes('dns') ||
      label.includes('load balancer') || label.includes('reverse proxy') || label.includes('bff'))
    return 'A';

  if (key.includes('postgres') || key.includes('mysql') || key.includes('mongo') ||
      key.includes('redis') || key.includes('kafka') || key.includes('elasticsearch') ||
      key.includes('s3') || key.includes('storage') || key.includes('cache') ||
      key.includes('database') || key.includes('db') ||
      label.includes('database') || label.includes('cache') || label.includes('storage') ||
      label.includes('kafka') || label.includes('redis') || label.includes('elasticsearch') ||
      label.includes('postgres') || label.includes('rabbitmq') || label.includes('queue') ||
      label.includes('cassandra') || label.includes('dynamodb') || label.includes('mongodb') ||
      label.includes('mysql'))
    return 'C';

  if (key.includes('stripe') || key.includes('fcm') || key.includes('twilio') ||
      key.includes('sendgrid') || key.includes('mailgun') || key.includes('oauth') ||
      key.includes('google_maps') || key.includes('aws_sns') || key.includes('apns') ||
      label.includes('stripe') || label.includes('google oauth') || label.includes('sendgrid') ||
      label.includes('twilio') || label.includes('mailgun') || label.includes('fcm') ||
      label.includes('firebase') || label.includes('push notification') ||
      label.includes('google maps') || label.includes('apple push'))
    return 'D';

  return 'B';
}

export function isPrimaryFlowNode(node: Node): boolean {
  const key   = ((node.data?.componentKey as string) ?? '').toLowerCase();
  const label = ((node.data?.label        as string) ?? '').toLowerCase();
  return (
    key.includes('api_gateway') || key.includes('load_balancer') ||
    key.includes('service') || key.includes('server') ||
    label.includes('api gateway') || label.includes('load balancer') ||
    label.includes('service') || label.includes('server') ||
    label.includes('backend') || label.includes('microservice')
  );
}

export function isSecondaryNode(node: Node): boolean {
  const key   = ((node.data?.componentKey as string) ?? '').toLowerCase();
  const label = ((node.data?.label        as string) ?? '').toLowerCase();
  return (
    key.includes('logger') || key.includes('metrics') || key.includes('monitoring') ||
    key.includes('tracing') || key.includes('alert') || key.includes('dashboard') ||
    key.includes('prometheus') || key.includes('grafana') || key.includes('datadog') ||
    label.includes('logger') || label.includes('metrics') || label.includes('monitoring') ||
    label.includes('tracing') || label.includes('alert') || label.includes('dashboard') ||
    label.includes('prometheus') || label.includes('grafana')
  );
}

export function isAuthNode(node: Node): boolean {
  const key   = ((node.data?.componentKey as string) ?? '').toLowerCase();
  const label = ((node.data?.label        as string) ?? '').toLowerCase();
  return (
    key.includes('auth') || key.includes('oauth') || key.includes('jwt') ||
    key.includes('cognito') || key.includes('clerk') || key.includes('auth0') ||
    label.includes('auth') || label.includes('oauth') || label.includes('jwt') ||
    label.includes('authentication')
  );
}

export function isDataNode(node: Node): boolean {
  const key   = ((node.data?.componentKey as string) ?? '').toLowerCase();
  const label = ((node.data?.label        as string) ?? '').toLowerCase();
  return (
    key.includes('postgres') || key.includes('mysql') || key.includes('mongo') ||
    key.includes('redis') || key.includes('cache') || key.includes('database') ||
    key.includes('dynamodb') || key.includes('cassandra') ||
    label.includes('database') || label.includes('cache') || label.includes('postgres') ||
    label.includes('mysql') || label.includes('mongodb') || label.includes('redis')
  );
}

export function isAINode(node: Node): boolean {
  const key   = ((node.data?.componentKey as string) ?? '').toLowerCase();
  const label = ((node.data?.label        as string) ?? '').toLowerCase();
  const category = ((node.data?.category as string) ?? '').toLowerCase();
  return (
    key.includes('llm') || key.includes('ai') || key.includes('openai') ||
    key.includes('anthropic') || key.includes('vertex') || key.includes('bedrock') ||
    key.includes('vector') || key.includes('embedding') || key.includes('rag') ||
    label.includes('llm') || label.includes('ai') || label.includes('openai') ||
    label.includes('claude') || label.includes('gpt') || label.includes('vector') ||
    label.includes('embedding') || label.includes('rag') ||
    category.includes('ai') || category.includes('llm') || category.includes('rag')
  );
}

function isGatewayNode(node: Node): boolean {
  const key   = ((node.data?.componentKey as string) ?? '').toLowerCase();
  const label = ((node.data?.label        as string) ?? '').toLowerCase();
  return key.includes('api_gateway') || label.includes('api gateway') ||
         label.includes('load balancer') || label.includes('reverse proxy');
}

function isClientNode(node: Node): boolean {
  const label = ((node.data?.label as string) ?? '').toLowerCase();
  return label.includes('mobile app') || label.includes('web app') ||
         label.includes('web client') || label.includes('patient web') ||
         label.includes('doctor app') || label.includes('rider app') ||
         label.includes('user app') || label.includes('browser');
}

function isAdminNode(node: Node): boolean {
  const label = ((node.data?.label as string) ?? '').toLowerCase();
  return label.includes('admin') || label.includes('dashboard') ||
         label.includes('backoffice') || label.includes('back office');
}

export function getNodePriority(node: Node): number {
  if (isPrimaryFlowNode(node)) return 10;
  if (isAuthNode(node)) return 9;
  if (isDataNode(node)) return 8;
  if (isAINode(node)) return 7;
  if (isSecondaryNode(node)) return 2;
  return 5;
}

export function getNodeSize(node: Node): 'large' | 'medium' | 'small' {
  const priority = getNodePriority(node);
  if (priority >= 7) return 'large';
  if (priority >= 4) return 'medium';
  return 'small';
}

export interface LayoutSection {
  id: string;
  label: string;
  color: string;
  layer: string;
  nodes: Node[];
  x: number;
  y: number;
  width: number;
  height: number;
}

export function applyGridLayout(nodes: Node[]): { nodes: Node[]; sections: LayoutSection[] } {
  if (nodes.length === 0) return { nodes: [], sections: [] };

  const resolved = nodes.map(n => ({
    ...n,
    data: { ...n.data, layer: getNodeLayer(n) },
  }));

  const groups: Record<string, Node[]> = { A: [], B: [], C: [], D: [] };
  resolved.forEach(n => groups[n.data.layer as string].push(n));

  groups['A'].sort((a, b) => {
    const score = (n: Node) =>
      isClientNode(n) ? 0 : isGatewayNode(n) ? 1 : isAdminNode(n) ? 3 : 2;
    return score(a) - score(b);
  });

  groups['B'].sort((a, b) => {
    const score = (n: Node) => {
      const priority = getNodePriority(n);
      return -priority;
    };
    return score(a) - score(b);
  });

  groups['C'].sort((a, b) => {
    const score = (n: Node) => {
      const lbl = ((n.data?.label as string) ?? '').toLowerCase();
      if (lbl.includes('postgres') || lbl.includes('mysql') || lbl.includes('mongodb')) return 0;
      if (lbl.includes('redis') || lbl.includes('cache')) return 1;
      if (lbl.includes('elasticsearch') || lbl.includes('search')) return 2;
      if (lbl.includes('kafka') || lbl.includes('rabbitmq') || lbl.includes('queue')) return 3;
      if (lbl.includes('s3') || lbl.includes('storage')) return 4;
      return 5;
    };
    return score(a) - score(b);
  });

  const activeLayers = LAYER_COLUMN_ORDER.filter(l => groups[l].length > 0);
  const colWidths: Record<string, number> = {};
  activeLayers.forEach(l => {
    colWidths[l] = Math.max(NODE_MIN_WIDTH,
      ...groups[l].map(n => computeNodeWidth(n.data?.label ?? '')));
  });

  const colX: Record<string, number> = {};
  let x = CANVAS_MARGIN_X;
  activeLayers.forEach(l => { colX[l] = x; x += colWidths[l] + COLUMN_GAP; });

  const colHeights: Record<string, number> = {};
  activeLayers.forEach(l => {
    const n = groups[l].length;
    colHeights[l] = n * NODE_HEIGHT + Math.max(0, n - 1) * ROW_GAP;
  });
  const maxH = Math.max(...activeLayers.map(l => colHeights[l] ?? 0));

  const positioned = resolved.map(node => {
    const layer  = node.data.layer as string;
    const sorted = groups[layer];
    const idx    = sorted.findIndex(n => n.id === node.id);
    const colH   = colHeights[layer] ?? 0;
    const startY = CANVAS_MARGIN_Y + (maxH - colH) / 2;
    const nWidth = computeNodeWidth(node.data?.label ?? '');
    const colW   = colWidths[layer] ?? NODE_MIN_WIDTH;
    const size   = getNodeSize(node);
    const heightMultiplier = size === 'large' ? 1.1 : size === 'small' ? 0.85 : 1;

    return {
      ...node,
      position: {
        x: (colX[layer] ?? CANVAS_MARGIN_X) + (colW - nWidth) / 2,
        y: startY + idx * (NODE_HEIGHT + ROW_GAP),
      },
      sourcePosition: 'right' as unknown as import('reactflow').Position,
      targetPosition: 'left'  as unknown as import('reactflow').Position,
      style: { 
        ...node.style, 
        width: nWidth,
        minWidth: nWidth,
        opacity: size === 'small' ? 0.8 : 1,
      },
      data: { 
        ...node.data, 
        nodeWidth: nWidth,
        nodeSize: size,
        nodeLayer: layer,
        layerColor: LAYER_COLORS[layer]?.bg,
      },
    };
  });

  const layerANodes = positioned.filter(n => (n.data?.layer as string) === 'A');
  const gatewayNode = layerANodes.find(n => isGatewayNode(n));

  if (gatewayNode && layerANodes.length >= 2) {
    const ys      = layerANodes.map(n => n.position.y);
    const minY    = Math.min(...ys);
    const maxY    = Math.max(...ys);
    const centerY = (minY + maxY) / 2;

    const otherYs = layerANodes
      .filter(n => n.id !== gatewayNode.id)
      .map(n => n.position.y);
    const isClear = (y: number) =>
      otherYs.every(oy => Math.abs(oy - y) >= NODE_HEIGHT + 20);

    const targetY = isClear(centerY) ? centerY : centerY + NODE_HEIGHT + ROW_GAP;

    return {
      nodes: positioned.map(n =>
        n.id === gatewayNode.id ? { ...n, position: { ...n.position, y: targetY } } : n
      ),
      sections: generateSections(positioned, colX, colWidths, activeLayers, groups, colHeights, maxH),
    };
  }

  return {
    nodes: positioned,
    sections: generateSections(positioned, colX, colWidths, activeLayers, groups, colHeights, maxH),
  };
}

function generateSections(
  positioned: Node[],
  colX: Record<string, number>,
  colWidths: Record<string, number>,
  activeLayers: string[],
  groups: Record<string, Node[]>,
  colHeights: Record<string, number>,
  maxH: number
): LayoutSection[] {
  const sections: LayoutSection[] = [];
  const GROUP_GAP = 20;
  const GROUP_PADDING = 30;
  const LABEL_HEIGHT = 24;

  for (const layer of activeLayers) {
    if (!groups[layer].length) continue;

    const layerColor = LAYER_COLORS[layer];
    const layerNodes = positioned.filter(n => (n.data?.layer as string) === layer);
    const colW = colWidths[layer] ?? NODE_MIN_WIDTH;
    const colH = colHeights[layer] ?? 0;
    const startY = CANVAS_MARGIN_Y + (maxH - colH) / 2;

    sections.push({
      id: `section-${layer}`,
      label: layerColor?.label ?? layer,
      color: layerColor?.bg ?? '#6366f1',
      layer,
      nodes: layerNodes,
      x: colX[layer] - GROUP_PADDING,
      y: startY - GROUP_PADDING - LABEL_HEIGHT,
      width: colW + GROUP_PADDING * 2,
      height: colH + GROUP_PADDING * 2 + LABEL_HEIGHT,
    });
  }

  return sections;
}

export function enhanceEdges(edges: Edge[], nodes: Node[]): Edge[] {
  return edges.map(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    
    const isPrimary = sourceNode && targetNode && 
      isPrimaryFlowNode(sourceNode) && isPrimaryFlowNode(targetNode);
    const isSecondary = sourceNode && targetNode && isSecondaryNode(targetNode);

    return {
      ...edge,
      style: {
        ...edge.style,
        strokeWidth: isPrimary ? 2.5 : isSecondary ? 1 : 1.5,
        opacity: isSecondary ? 0.5 : 1,
      },
      animated: isPrimary ? true : edge.animated,
    };
  });
}
