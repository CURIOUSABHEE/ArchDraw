import { apiKeyManager } from '../utils/apiKeyManager';
import type { SharedState, LayoutConfig, ArchitectureNode } from '../types';
import { LAYOUT_AGENT_PROMPT, DEFAULT_ELK_OPTIONS } from '../constants';

export async function runLayoutAgent(state: SharedState): Promise<{ layout: LayoutConfig; nodes: ArchitectureNode[] }> {
  const componentsJson = JSON.stringify(state.components, null, 2);

  const prompt = `${LAYOUT_AGENT_PROMPT}

Current Components:
${componentsJson}

Output the layout configuration and updated nodes as JSON only.`;

  try {
    const result = await apiKeyManager.executeWithRetry(async (groq) => {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a JSON-only output system. Always respond with valid JSON object. Do NOT wrap in markdown code blocks. Output ONLY raw JSON.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 4096,
      });

      const content = completion.choices[0]?.message?.content ?? '';
      return content;
    });

    // Strip markdown code blocks if present
    const cleanedResult = result
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/gi, '')
      .trim();

    const parsed = JSON.parse(cleanedResult);

    const layout: LayoutConfig = {
      algorithm: parsed.layout?.algorithm ?? 'layered',
      direction: parsed.layout?.direction ?? 'RIGHT',
      elkOptions: parsed.layout?.elkOptions ?? DEFAULT_ELK_OPTIONS,
      layerOrder: parsed.layout?.layerOrder ?? ['client', 'gateway', 'service', 'queue', 'database', 'cache', 'external', 'devops'],
      totalWidth: 0,
      totalHeight: 0,
    };

    const nodes: ArchitectureNode[] = (parsed.nodes ?? state.components).map((node: Partial<ArchitectureNode>) => ({
      id: node.id ?? `node-${Date.now()}`,
      type: 'architectureNode',
      label: node.label ?? 'Unknown',
      layer: node.layer ?? 'service',
      width: node.width ?? 160,
      height: node.height ?? 80,
      icon: node.icon ?? 'box',
      metadata: node.metadata ?? {},
    }));

    return { layout, nodes };
  } catch (error) {
    console.error('Layout Agent error:', error);
    return generateDefaultLayout(state.components);
  }
}

function generateDefaultLayout(components: ArchitectureNode[]): { layout: LayoutConfig; nodes: ArchitectureNode[] } {
  const layerXPositions: Record<string, number> = {
    client: 0,
    gateway: 200,
    service: 400,
    queue: 600,
    database: 800,
    cache: 1000,
    external: 1200,
    devops: 1400,
  };

  const layerCounts: Record<string, number> = {};
  const nodesWithPositions = components.map((node) => {
    const layer = node.layer;
    layerCounts[layer] = (layerCounts[layer] ?? 0) + 1;
    const countInLayer = layerCounts[layer];
    const x = layerXPositions[layer] ?? 400;
    const y = 100 + (countInLayer - 1) * 120;

    return {
      ...node,
      position: { x, y },
    };
  });

  const maxX = Math.max(...nodesWithPositions.map(n => n.position?.x ?? 0)) + 200;
  const maxY = Math.max(...nodesWithPositions.map(n => n.position?.y ?? 0)) + 150;

  const layout: LayoutConfig = {
    algorithm: 'layered',
    direction: 'RIGHT',
    elkOptions: DEFAULT_ELK_OPTIONS,
    layerOrder: ['client', 'gateway', 'service', 'queue', 'database', 'cache', 'external', 'devops'],
    totalWidth: maxX,
    totalHeight: maxY,
  };

  return { layout, nodes: nodesWithPositions };
}
