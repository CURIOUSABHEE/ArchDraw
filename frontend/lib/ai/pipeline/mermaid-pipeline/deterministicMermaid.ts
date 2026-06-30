import type { FormatConfig, InventoryConfig, EdgeConfig } from './stage1-pregen';

function toNodeId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    || 'node';
}

function detectShape(name: string): string {
  const lower = name.toLowerCase();

  // Database / Cache → cylinder [("Label")]
  if (
    lower.includes('database') || lower.includes('db') ||
    lower.includes('cache') || lower.includes('redis') ||
    lower.includes('postgres') || lower.includes('mysql') ||
    lower.includes('mongodb') || lower.includes('dynamodb') ||
    lower.includes('cassandra') || lower.includes('elasticsearch') ||
    lower.includes('data store') || lower.includes('data warehouse') ||
    lower.includes('lake') || lower.includes('data warehouse')
  ) {
    return '[(${name})]';
  }

  // Load Balancer / Gateway → diamond {Label}
  if (
    lower.includes('load balancer') || lower.includes('lb') ||
    lower.includes('gateway') || lower.includes('api gateway') ||
    lower.includes('proxy') || lower.includes('reverse proxy') ||
    lower.includes('ingress') || lower.includes('traff')
  ) {
    return '{${name}}';
  }

  // Queue / Broker → circle ((Label))
  if (
    lower.includes('queue') || lower.includes('broker') ||
    lower.includes('kafka') || lower.includes('rabbitmq') ||
    lower.includes('pub/sub') || lower.includes('message bus') ||
    lower.includes('event bus') || lower.includes('pub sub') ||
    lower.includes('stream') || lower.includes('pubsub') ||
    lower.includes('event')
  ) {
    return '((${name}))';
  }

  // External / Third-party → parallelogram [/Label/]
  if (
    lower.includes('external') || lower.includes('third party') ||
    lower.includes('third-party') || lower.includes('saas') ||
    lower.includes('cdn') || lower.includes('cloud') ||
    lower.includes('vpc')
  ) {
    return '[/${name}/]';
  }

  // User / Client → default rounded rect ["Label"]
  if (
    lower === 'user' || lower === 'client' ||
    lower.includes('browser') || lower.includes('mobile app') ||
    lower.includes('mobile') || lower.includes('desktop')
  ) {
    return '["${name}"]';
  }

  // Default → rounded rectangle ["Label"]
  return '["${name}"]';
}

function detectShapeType(name: string): 'data' | 'gateway' | 'queue' | 'external' | 'client' | 'application' {
  const lower = name.toLowerCase();
  if (lower.includes('database') || lower.includes('db') || lower.includes('cache') ||
      lower.includes('redis') || lower.includes('data store')) return 'data';
  if (lower.includes('load balancer') || lower.includes('gateway') ||
      lower.includes('proxy') || lower.includes('ingress')) return 'gateway';
  if (lower.includes('queue') || lower.includes('broker') || lower.includes('kafka')) return 'queue';
  if (lower.includes('external') || lower.includes('third') || lower.includes('cdn')) return 'external';
  if (lower === 'user' || lower.includes('client') || lower.includes('browser') ||
      lower.includes('mobile')) return 'client';
  return 'application';
}

function escapeMermaidLabel(label: string): string {
  if (!label) return '';
  return label
    .replace(/"/g, '#quot;')
    .replace(/\(/g, '#40;')
    .replace(/\)/g, '#41;')
    .replace(/\[/g, '#91;')
    .replace(/\]/g, '#93;')
    .replace(/{/g, '#123;')
    .replace(/}/g, '#125;');
}

export interface DeterministicMermaidResult {
  mermaidText: string;
  nodeShapeMap: Record<string, 'data' | 'gateway' | 'queue' | 'external' | 'client' | 'application'>;
}

export function generateDeterministicMermaid(
  formatConfig: FormatConfig,
  inventoryConfig: InventoryConfig,
  edgeConfig: EdgeConfig,
  groupAssignments: Record<string, string>,
): DeterministicMermaidResult {
  const { nodes, groups } = inventoryConfig;
  const { edges } = edgeConfig;
  const diagramType = formatConfig.diagramType;
  const lines: string[] = [];

  lines.push(diagramType);
  lines.push('');

  // Build reverse group → nodes map
  const groupNodes: Record<string, string[]> = {};
  for (const node of nodes) {
    const group = groupAssignments[node] || 'Default Layer';
    if (!groupNodes[group]) groupNodes[group] = [];
    groupNodes[group].push(node);
  }

  // Emit subgraphs
  for (const group of groups) {
    const gNodes = groupNodes[group];
    if (!gNodes || gNodes.length === 0) continue;

    lines.push(`subgraph ${group}`);
    lines.push('');
    for (const node of gNodes) {
      const sanitizedId = toNodeId(node);
      const shapeTemplate = detectShape(node);
      const label = escapeMermaidLabel(node);
      const shape = shapeTemplate.replace(/\$\{name\}/g, label);
      lines.push(`  ${sanitizedId}${shape}`);
    }
    lines.push('');
    lines.push('end');
    lines.push('');
  }

  // Emit nodes not in any group (shouldn't happen, but guard)
  const assignedNodes = new Set(Object.values(groupAssignments).flatMap(g => groupNodes[g] || []));
  for (const node of nodes) {
    if (!assignedNodes.has(node)) {
      const sanitizedId = toNodeId(node);
      const shapeTemplate = detectShape(node);
      const label = escapeMermaidLabel(node);
      const shape = shapeTemplate.replace(/\$\{name\}/g, label);
      lines.push(`${sanitizedId}${shape}`);
    }
  }

  if (nodes.length > 0) lines.push('');

  // Emit edges
  for (const edge of edges) {
    const fromId = toNodeId(edge.from);
    const toId = toNodeId(edge.to);
    const label = escapeMermaidLabel(edge.label || '');
    if (label) {
      lines.push(`${fromId} -- "${label}" --> ${toId}`);
    } else {
      lines.push(`${fromId} --> ${toId}`);
    }
  }

  const mermaidText = lines.join('\n');

  // Build shape type map
  const nodeShapeMap: Record<string, 'data' | 'gateway' | 'queue' | 'external' | 'client' | 'application'> = {};
  for (const node of nodes) {
    nodeShapeMap[node] = detectShapeType(node);
  }

  return { mermaidText, nodeShapeMap };
}
