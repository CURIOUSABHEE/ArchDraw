import componentsData from '@/data/components.json';
import awsData from '@/data/aws-components.json';
import dbData from '@/data/db-components.json';
import servicesData from '@/data/services-components.json';

export interface ComponentDefinition {
  id: string;
  label: string;
  category: string;
  color: string;
  icon?: string;
  description?: string;
  technology?: string;
  sublabel?: string;
  layer?: string;
}

export interface ComponentCategory {
  name: string;
  components: ComponentDefinition[];
  count: number;
}

class ComponentRegistry {
  private components: Map<string, ComponentDefinition> = new Map();
  private categories: Map<string, ComponentDefinition[]> = new Map();
  private allComponents: ComponentDefinition[] = [];

  constructor() {
    this.registerComponents(componentsData, 'Built-in');
    this.registerComponents(awsData, 'AWS');
    this.registerComponents(dbData, 'Database');
    this.registerComponents(servicesData, 'Services');
  }

  private registerComponents(
    data: ComponentDefinition[], 
    _source: string
  ): void {
    for (const component of data) {
      this.components.set(component.id, component);
      this.allComponents.push(component);
      
      const category = component.category || 'Other';
      if (!this.categories.has(category)) {
        this.categories.set(category, []);
      }
      this.categories.get(category)!.push(component);
    }
  }

  get(id: string): ComponentDefinition | undefined {
    return this.components.get(id);
  }

  getAll(): ComponentDefinition[] {
    return this.allComponents;
  }

  getByCategory(category: string): ComponentDefinition[] {
    return this.categories.get(category) || [];
  }

  getCategories(): ComponentCategory[] {
    return Array.from(this.categories.entries())
      .map(([name, components]) => ({
        name,
        components,
        count: components.length,
      }))
      .sort((a, b) => b.count - a.count);
  }

  search(query: string): ComponentDefinition[] {
    const q = query.toLowerCase().trim();
    if (!q) return this.allComponents;
    
    return this.allComponents.filter((c) => {
      const label = c.label.toLowerCase();
      const category = c.category.toLowerCase();
      const id = c.id.toLowerCase();
      const desc = (c.description || '').toLowerCase();
      
      return (
        label.includes(q) ||
        category.includes(q) ||
        id.includes(q) ||
        desc.includes(q)
      );
    });
  }

  matches(componentId: string, query: string): boolean {
    const component = this.components.get(componentId);
    if (!component) return false;
    
    const q = query.toLowerCase();
    return (
      component.label.toLowerCase().includes(q) ||
      component.category.toLowerCase().includes(q) ||
      component.id.toLowerCase().includes(q)
    );
  }

  getIcon(componentId: string): string | undefined {
    return this.components.get(componentId)?.icon;
  }

  getColor(componentId: string): string {
    return this.components.get(componentId)?.color || '#6366f1';
  }

  getCategory(componentId: string): string {
    return this.components.get(componentId)?.category || 'Other';
  }

  has(componentId: string): boolean {
    return this.components.has(componentId);
  }

  count(): number {
    return this.allComponents.length;
  }

  getCategoryCount(): number {
    return this.categories.size;
  }
}

export const componentRegistry = new ComponentRegistry();

export function getComponentsByLayer(layer: 'A' | 'B' | 'C' | 'D'): ComponentDefinition[] {
  const layerCategories: Record<string, string[]> = {
    A: ['Client & Entry', 'CDN & Edge', 'DNS & Network'],
    B: ['Compute', 'AI & ML', 'Analytics'],
    C: ['Database', 'Cache & Storage', 'Messaging'],
    D: ['External Services', 'Authentication'],
  };
  
  const categories = layerCategories[layer] || [];
  return componentRegistry.getAll().filter(c => 
    categories.some(cat => c.category.includes(cat))
  );
}

export function getLayerColor(layer: 'A' | 'B' | 'C' | 'D'): string {
  const colors: Record<string, string> = {
    A: '#6366f1',
    B: '#0891b2',
    C: '#059669',
    D: '#7c3aed',
  };
  return colors[layer] || '#6366f1';
}
