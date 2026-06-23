import type { Node, Edge } from 'reactflow';

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_\-]/g, '_');
}

function escapeLabel(label: string): string {
  return label.replace(/"/g, '\\"');
}

export function reactFlowToMermaid(nodes: Node[], edges: Edge[]): string {
  const groupNodes = nodes.filter(n => n.type === 'groupNode' || n.data?.isGroup);
  const groupIds = new Set(groupNodes.map(n => n.id));
  const regularNodes = nodes.filter(n => !groupIds.has(n.id));

  const lines: string[] = [];
  lines.push('graph TD');
  lines.push('');

  for (const group of groupNodes) {
    const gid = sanitizeId(group.id);
    const glabel = escapeLabel(String(group.data?.label ?? group.id));
    lines.push(`  subgraph ${gid}["${glabel}"]`);

    const children = regularNodes.filter(n => n.parentNode === group.id || n.data?.parentId === group.id);
    for (const child of children) {
      const cid = sanitizeId(child.id);
      const clabel = escapeLabel(String(child.data?.label ?? child.id));
      lines.push(`    ${cid}["${clabel}"]`);
    }

    lines.push('  end');
    lines.push('');
  }

  const ungrouped = regularNodes.filter(n => !n.parentNode && !n.data?.parentId);
  for (const node of ungrouped) {
    const nid = sanitizeId(node.id);
    const nlabel = escapeLabel(String(node.data?.label ?? node.id));
    lines.push(`  ${nid}["${nlabel}"]`);
  }

  if (ungrouped.length > 0) {
    lines.push('');
  }

  for (const edge of edges) {
    const src = sanitizeId(edge.source);
    const tgt = sanitizeId(edge.target);
    if (edge.label) {
      const elabel = escapeLabel(String(edge.label));
      lines.push(`  ${src} -->|"${elabel}"| ${tgt}`);
    } else {
      lines.push(`  ${src} --> ${tgt}`);
    }
  }

  return lines.join('\n');
}
