import type { Node } from 'reactflow';

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

export function applyGridLayout(nodes: Node[]): Node[] {
  if (nodes.length === 0) return nodes;

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
      const lbl = ((n.data?.label as string) ?? '').toLowerCase();
      if (lbl.includes('auth'))                                                  return 0;
      if (lbl.includes('user') || lbl.includes('patient') || lbl.includes('doctor')) return 1;
      if (lbl.includes('payment') || lbl.includes('billing'))                   return 99;
      if (lbl.includes('notification') || lbl.includes('email'))                return 98;
      return 50;
    };
    return score(a) - score(b);
  });

  groups['C'].sort((a, b) => {
    const score = (n: Node) => {
      const lbl = ((n.data?.label as string) ?? '').toLowerCase();
      if (lbl.includes('postgres') || lbl.includes('mysql') || lbl.includes('mongodb')) return 0;
      if (lbl.includes('redis') || lbl.includes('cache'))                       return 1;
      if (lbl.includes('elasticsearch') || lbl.includes('search'))              return 2;
      if (lbl.includes('kafka') || lbl.includes('rabbitmq') || lbl.includes('queue')) return 3;
      if (lbl.includes('s3') || lbl.includes('storage'))                        return 4;
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

    return {
      ...node,
      position: {
        x: (colX[layer] ?? CANVAS_MARGIN_X) + (colW - nWidth) / 2,
        y: startY + idx * (NODE_HEIGHT + ROW_GAP),
      },
      sourcePosition: 'right' as unknown as import('reactflow').Position,
      targetPosition: 'left'  as unknown as import('reactflow').Position,
      style: { ...node.style, width: nWidth, minWidth: nWidth },
      data: { ...node.data, nodeWidth: nWidth },
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

    return positioned.map(n =>
      n.id === gatewayNode.id ? { ...n, position: { ...n.position, y: targetY } } : n
    );
  }

  return positioned;
}
