import fs from 'fs/promises';
import path from 'path';
import type { CustomNodeDefinition } from './agents/synthesiser';

export async function fetchExistingCustomNodes(): Promise<{
  component_key: string;
  label: string;
  icon_name: string;
  color: string;
  category: string;
}[]> {
  try {
    const filePath = path.join(process.cwd(), 'data', 'services-components.json');
    const content = await fs.readFile(filePath, 'utf-8');
    const nodes = JSON.parse(content);
    
    return nodes.map((n: any) => ({
      component_key: n.id,
      label: n.label,
      icon_name: n.icon || 'Box',
      color: n.color || '#6366f1',
      category: n.category || 'Custom'
    }));
  } catch (e) {
    console.error('[CustomNodeRegistry] Fetch error:', e);
    return [];
  }
}

export async function saveNewCustomNodes(
  nodes: CustomNodeDefinition[],
  sourceDescription: string
): Promise<void> {
  if (!nodes || nodes.length === 0) return;

  try {
    const filePath = path.join(process.cwd(), 'data', 'services-components.json');
    let existingNodes: any[] = [];
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      existingNodes = JSON.parse(content);
    } catch {
      // File missing or unparseable, start fresh
    }
    
    const existingKeys = new Set(existingNodes.map((n: any) => n.id));
    let added = false;
    
    for (const node of nodes) {
      if (!existingKeys.has(node.componentKey)) {
        existingNodes.push({
          id: node.componentKey,
          label: node.label,
          category: node.category || 'AI Generated',
          color: node.color,
          icon: node.iconName,
          description: node.description || sourceDescription.slice(0, 500)
        });
        added = true;
      }
    }

    if (added) {
      // Write back the updated JSON
      await fs.writeFile(filePath, JSON.stringify(existingNodes, null, 2), 'utf-8');
    }
  } catch (e) {
    console.error('[CustomNodeRegistry] Save error:', e);
  }
}
