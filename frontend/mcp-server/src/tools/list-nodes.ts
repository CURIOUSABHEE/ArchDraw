import type { ListNodeTypesInput } from '../lib/schema.js';
import { getComponentsByCategory, searchComponents } from '../lib/node-catalog.js';
import type { ComponentDefinition } from '../types/index.js';

interface SearchResult {
  id: string;
  label: string;
  icon: string;
  description: string;
}

interface CategoryResult {
  name: string;
  count: number;
  nodes: SearchResult[];
}

export async function listNodeTypes(input: ListNodeTypesInput): Promise<{
  categories: CategoryResult[];
  totalCount: number;
}> {
  const { category, search, limit } = input;

  if (search && search.trim()) {
    const results = searchComponents(search, limit);
    
    const categoryMap = new Map<string, ComponentDefinition[]>();
    for (const component of results) {
      if (!categoryMap.has(component.category)) {
        categoryMap.set(component.category, []);
      }
      categoryMap.get(component.category)!.push(component);
    }

    const categories: CategoryResult[] = Array.from(categoryMap.entries())
      .map(([name, comps]) => ({
        name,
        count: comps.length,
        nodes: comps.map((n: ComponentDefinition) => ({
          id: n.id,
          label: n.label,
          icon: n.icon,
          description: n.description,
        })),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      categories,
      totalCount: results.length,
    };
  }

  if (category && category.trim()) {
    const summary = getComponentsByCategory();
    const filteredCategories = summary.categories.filter(c =>
      c.name.toLowerCase().includes(category.toLowerCase())
    );

    return {
      categories: filteredCategories,
      totalCount: filteredCategories.reduce((sum: number, c: CategoryResult) => sum + c.count, 0),
    };
  }

  const summary = getComponentsByCategory();
  
  const limitedCategories: CategoryResult[] = summary.categories.map((cat: CategoryResult) => ({
    ...cat,
    nodes: cat.nodes.slice(0, Math.ceil(limit / summary.categories.length)),
  }));

  return {
    categories: limitedCategories,
    totalCount: summary.totalCount,
  };
}
