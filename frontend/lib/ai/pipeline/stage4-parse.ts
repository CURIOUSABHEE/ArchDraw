import type { ParsedDiagram, RawFlow, RawNode, PipelineLayer as LayerType } from './types';

function parseNode(obj: Record<string, unknown>): RawNode | null {
  if (!obj.id || !obj.label) return null;

  const node: RawNode = {
    id: String(obj.id),
    label: String(obj.label),
    subtitle: obj.subtitle ? String(obj.subtitle) : '',
    layer: (obj.layer as LayerType) || 'application',
    icon: obj.icon ? String(obj.icon) : 'box',
    serviceType: obj.serviceType ? String(obj.serviceType) : '',
    ...(obj.isGroup ? {
      isGroup: true,
      groupLabel: String(obj.groupLabel || obj.label),
      groupColor: String(obj.groupColor || '#e2e8f0'),
    } : {}),
    ...(obj.parentId ? {
      parentId: String(obj.parentId),
    } : {}),
  };

  return node;
}

function parseFlow(obj: Record<string, unknown>): RawFlow | null {
  if (!Array.isArray(obj.path) || obj.path.length < 2) return null;

  const flow: RawFlow = {
    path: obj.path.map(String),
    label: obj.label ? String(obj.label) : undefined,
    async: obj.async === true,
  };

  return flow;
}

export function parseNDJSON(rawText: string): ParsedDiagram {
  const nodes: RawNode[] = [];
  const flows: RawFlow[] = [];

  const lines = rawText.split('\n').filter(l => l.trim());
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('```') || trimmed.startsWith('//')) continue;

    try {
      const obj = JSON.parse(trimmed) as Record<string, unknown>;
      if (obj.type === 'flow' || obj.path) {
        const flow = parseFlow(obj);
        if (flow) flows.push(flow);
        continue;
      }

      const node = parseNode(obj);
      if (node) nodes.push(node);
    } catch (e) {
      console.log(`[Parse] Skipped - JSON parse failed: ${trimmed.slice(0, 50)}...`);
      continue;
    }
  }

  console.log(`[Parse] Parsed ${nodes.length} nodes, ${flows.length} flows`);
  return { nodes, flows };
}
