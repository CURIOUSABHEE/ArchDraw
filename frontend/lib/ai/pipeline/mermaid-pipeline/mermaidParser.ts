import logger from '@/lib/logger';

export interface ParsedMermaidNode {
  id: string;
  label: string;
  subtitle: string;
  isDb: boolean;
  parentId?: string;
}

export interface ParsedMermaidEdge {
  source: string;
  target: string;
  label: string;
  bidirectional: boolean;
}

export interface ParsedMermaidSubgraph {
  id: string;
  label: string;
  nodeIds: string[];
}

export interface ParsedMermaid {
  subgraphs: ParsedMermaidSubgraph[];
  nodes: ParsedMermaidNode[];
  edges: ParsedMermaidEdge[];
}

export function normalizeMermaidNewlines(text: string): string {
  return text.replace(/"([^"]*)"/g, (match, content) => {
    return `"${content.replace(/\r?\n/g, '\\n')}"`;
  });
}

/**
 * Normalize label references to node IDs in Mermaid edge lines only.
 * When an edge uses a quoted label like "Message Queue" instead of the bare ID MessageQueue,
 * replace it before parsing so the Mermaid parser can match it.
 * Only affects lines containing arrow syntax (-->, <-->), never node declarations.
 */
export function normalizeEdgeReferences(
  mermaidText: string,
  nodeIdMap: { label: string; id: string }[]
): string {
  const lines = mermaidText.split('\n');
  const resultLines = lines.map(line => {
    const trimmed = line.trim();
    // Only normalize edge lines: contain arrow syntax AND are not subgraph/node declarations
    const hasArrow = /-->|<-->|-\.-\>/.test(trimmed);
    const isDeclaration = /^subgraph\s|^graph\s|^flowchart\s|^end\s*$/.test(trimmed) || /\[/.test(trimmed);
    if (!hasArrow || isDeclaration) return line;

    let normalized = line;
    for (const { label, id } of nodeIdMap) {
      if (!label || !id) continue;
      const quotedLabel = `"${label}"`;
      const escaped = quotedLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      normalized = normalized.replace(new RegExp(escaped, 'g'), id);
    }
    return normalized;
  });

  return resultLines.join('\n');
}

function normalizeDiamondSyntax(text: string): string {
  return text.replace(/\{([^}]+)\}/g, '["$1"]');
}

function normalizeEdgeLabels(text: string): string {
  return text.split('\n').map(line => {
    return line.replace(/--\s+([^>]+?)\s*-->/g, '-->|$1|');
  }).join('\n');
}

function extractInlineNodes(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];
  const implicitNodes = new Map<string, string>();
  const inlineNodePattern = /\b([a-zA-Z0-9_][a-zA-Z0-9_\-]*)\s*(?:\[\(\(|\(\(\(|\(\(|\[\(|\(\[|\[\[|\{\{|\{|\(|\[\/|\[\\|\[|>)\"?([^\"]+?)\"?(?:[\/\\\)\}\]>\"]*[\]\)\}]+)/g;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('%%') || line.startsWith('graph') || line.startsWith('flowchart') || line.startsWith('subgraph') || line.toLowerCase() === 'end') {
      result.push(rawLine);
      continue;
    }

    const hasArrow = /-->|<-->|-\.-\>/.test(line);

    if (!hasArrow) {
      result.push(rawLine);
      continue;
    }

    const normalizedLine = line.replace(inlineNodePattern, (match, id, label) => {
      if (!implicitNodes.has(id)) {
        const isDb = match.includes('[(') || match.includes('((');
        const decl = isDb ? `  ${id}[("${label}")]` : `  ${id}["${label}"]`;
        implicitNodes.set(id, decl);
      }
      return id;
    });

    result.push(normalizedLine);
  }

  for (const decl of implicitNodes.values()) {
    result.push(decl);
  }

  return result.join('\n');
}

function sanitizeNodeLabel(label: string): string {
  let cleaned = label;
  // Strip arrow syntax
  cleaned = cleaned.replace(/-->\s*/g, '').replace(/---?\s*/g, '').replace(/->\s*/g, '');
  // Strip edge label wrappers: |text|, ["text"] when part of edge definition
  cleaned = cleaned.replace(/\|([^|]*)\|/g, '').replace(/\["([^"]*)"\]/g, '');
  // Strip node ID prefix ONLY when followed by -- or --> separator
  cleaned = cleaned.replace(/^[a-zA-Z0-9_\-]+\s*-->\s+(.+)$/, '$1');
  cleaned = cleaned.replace(/^[a-zA-Z0-9_\-]+\s+--\s+(.+)$/, '$1');
  // Strip Mermaid bracket artifacts (standalone brackets without content)
  cleaned = cleaned.replace(/\["\s*\]/g, '').replace(/\{\s*\}/g, '').replace(/\(\s*\)/g, '');
  return cleaned.trim();
}

export function parseMermaid(mermaidText: string): ParsedMermaid {
  const subgraphs: ParsedMermaidSubgraph[] = [];
  const nodes: ParsedMermaidNode[] = [];
  const edges: ParsedMermaidEdge[] = [];

  // Normalize -- text --> edge syntax to -->|text| BEFORE any other processing
  const edgeLabelNormalized = normalizeEdgeLabels(mermaidText);
  const mermaidWithInline = extractInlineNodes(edgeLabelNormalized);
  const normalizedText = normalizeMermaidNewlines(mermaidWithInline);
  let currentSubgraphId: string | null = null;
  const lines = normalizedText.split('\n');

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('%%') || line.startsWith('graph') || line.startsWith('flowchart')) {
      continue;
    }

    // 1. Subgraph start: subgraph CLIENT["Client Container"] or subgraph CLIENT ["Client Container"]
    const subgraphMatch = line.match(/^subgraph\s+([a-zA-Z0-9_\-]+)(?:\s*\[\"?([^\"]+)\"?\])?/i);
    if (subgraphMatch) {
      const id = subgraphMatch[1];
      const label = subgraphMatch[2] || id;
      currentSubgraphId = id;
      subgraphs.push({ id, label, nodeIds: [] });
      continue;
    }

    // 2. Subgraph end: end
    if (line.toLowerCase() === 'end') {
      currentSubgraphId = null;
      continue;
    }

    // 3. Edge check (supports chained edges: A --> B --> C)
    const hasArrow = /-->|<-->|-\.-\>/.test(line);
    if (hasArrow) {
      const arrowRegex = /\s*(<-->|-->|-\.-\>)\s*(?:\|\"?([^\"]*)\"?\|)?\s*/g;
      const nodeIds = line.split(arrowRegex).filter((_, idx) => idx % 3 === 0).map(id => id.trim());
      
      const arrows: { type: string; label: string }[] = [];
      let arrowMatch;
      while ((arrowMatch = arrowRegex.exec(line)) !== null) {
        arrows.push({
          type: arrowMatch[1],
          label: arrowMatch[2] || '',
        });
      }
      
      for (let i = 0; i < nodeIds.length - 1; i++) {
        const source = nodeIds[i];
        const target = nodeIds[i + 1];
        const arrow = arrows[i];
        if (source && target && arrow) {
          edges.push({
            source,
            target,
            label: arrow.label,
            bidirectional: arrow.type === '<-->',
          });
        }
      }
      continue;
    }

    // 4. Node check: supports all shapes (stadium, circle, cylinder, decision, flag, etc.)
    const nodeMatch = line.match(/^([a-zA-Z0-9_][a-zA-Z0-9_\-]*)\s*(?:\[\(\(|\(\(\(|\(\(|\[\(|\(\[|\[\[|\{\{|\{|\(|\[\/|\[\\|\[|>)\"?([^\"]+?)\"?(?:[\/\\\)\}\]>\"]*[\]\)\}]+)$/);
    if (nodeMatch) {
      const id = nodeMatch[1];
      const rawLabel = nodeMatch[2] || '';
      
      const isDb = line.includes('[(') || line.includes('((');

      // Handle literal '\n' and actual newline
      const labelParts = rawLabel.split(/\\n|\n/);
      const label = labelParts[0].trim();
      const subtitle = labelParts.slice(1).join(' ').trim();

      const parsedNode: ParsedMermaidNode = {
        id,
        label: sanitizeNodeLabel(label),
        subtitle,
        isDb,
      };

      if (currentSubgraphId) {
        parsedNode.parentId = currentSubgraphId;
        const sub = subgraphs.find(s => s.id === currentSubgraphId);
        if (sub) {
          sub.nodeIds.push(id);
        }
      }

      nodes.push(parsedNode);
      continue;
    }
  }

  return {
    subgraphs,
    nodes,
    edges,
  };
}
