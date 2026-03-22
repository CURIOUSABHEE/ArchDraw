import fs from 'fs/promises';
import path from 'path';
import type { CustomNodeDefinition } from './agents/synthesiser';

const inMemoryCache: Map<string, {
  component_key: string;
  label: string;
  icon_name: string;
  color: string;
  category: string;
}> = new Map();

let cacheInitialized = false;

interface StoredNode {
  id: string;
  label: string;
  icon?: string;
  color?: string;
  category?: string;
  description?: string;
}

async function loadFromFile(): Promise<StoredNode[]> {
  try {
    const filePath = path.join(process.cwd(), 'data', 'services-components.json');
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

async function initializeCache(): Promise<void> {
  if (cacheInitialized) return;
  try {
    const nodes = await loadFromFile();
    for (const n of nodes) {
      inMemoryCache.set(n.id, {
        component_key: n.id,
        label: n.label,
        icon_name: n.icon || 'Box',
        color: n.color || '#6366f1',
        category: n.category || 'Custom'
      });
    }
    cacheInitialized = true;
  } catch (e) {
    console.error('[CustomNodeRegistry] Cache init error:', e);
  }
}

export async function fetchExistingCustomNodes(): Promise<{
  component_key: string;
  label: string;
  icon_name: string;
  color: string;
  category: string;
}[]> {
  try {
    await initializeCache();
    return Array.from(inMemoryCache.values());
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
    await initializeCache();
    
    let added = false;
    
    for (const node of nodes) {
      if (!inMemoryCache.has(node.componentKey)) {
        const newNode = {
          id: node.componentKey,
          label: node.label,
          category: node.category || 'AI Generated',
          color: node.color,
          icon: node.iconName,
          description: node.description || sourceDescription.slice(0, 500)
        };
        inMemoryCache.set(node.componentKey, {
          component_key: newNode.id,
          label: newNode.label,
          icon_name: newNode.icon || 'Box',
          color: newNode.color || '#6366f1',
          category: newNode.category
        });
        added = true;
      }
    }

    if (added) {
      try {
        const filePath = path.join(process.cwd(), 'data', 'services-components.json');
        const existingNodes = await loadFromFile();
        const existingKeys = new Set(existingNodes.map((n) => n.id));
        
        for (const [key, cached] of inMemoryCache) {
          if (!existingKeys.has(key)) {
            existingNodes.push({
              id: key,
              label: cached.label,
              category: cached.category,
              color: cached.color,
              icon: cached.icon_name,
              description: sourceDescription.slice(0, 500)
            });
          }
        }

        const tempPath = `${filePath}.tmp`;
        await fs.writeFile(tempPath, JSON.stringify(existingNodes, null, 2), 'utf-8');
        await fs.rename(tempPath, filePath);
      } catch (writeError) {
        console.error('[CustomNodeRegistry] File write failed (in-memory cache preserved):', writeError);
      }
    }
  } catch (e) {
    console.error('[CustomNodeRegistry] Save error:', e);
  }
}
