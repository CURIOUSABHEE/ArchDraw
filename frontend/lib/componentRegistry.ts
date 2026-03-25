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
  isCustom?: boolean;
}

export interface ComponentCategory {
  name: string;
  components: ComponentDefinition[];
  count: number;
}

const CUSTOM_COMPONENTS_KEY = 'archflow-custom-components';

class ComponentRegistry {
  private components: Map<string, ComponentDefinition> = new Map();
  private categories: Map<string, ComponentDefinition[]> = new Map();
  private allComponents: ComponentDefinition[] = [];
  private customComponents: ComponentDefinition[] = [];

  constructor() {
    this.registerComponents(componentsData, 'Built-in');
    this.registerComponents(awsData, 'AWS');
    this.registerComponents(dbData, 'Database');
    this.registerComponents(servicesData, 'Services');
    this.loadCustomComponents();
  }

  private loadCustomComponents(): void {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(CUSTOM_COMPONENTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ComponentDefinition[];
        this.customComponents = parsed.map(c => ({ ...c, isCustom: true }));
        this.customComponents.forEach(component => {
          this.components.set(component.id, component);
          this.allComponents.push(component);
          const category = component.category || 'Other';
          if (!this.categories.has(category)) {
            this.categories.set(category, []);
          }
          this.categories.get(category)!.push(component);
        });
      }
    } catch (e) {
      console.error('Failed to load custom components:', e);
    }
  }

  private saveCustomComponents(): void {
    if (typeof window === 'undefined') return;
    try {
      const toSave = this.customComponents.map(c => ({
        id: c.id,
        label: c.label,
        category: c.category,
        color: c.color,
        icon: c.icon,
        description: c.description,
        technology: c.technology,
      }));
      localStorage.setItem(CUSTOM_COMPONENTS_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.error('Failed to save custom components:', e);
    }
  }

  private registerComponents(
    data: ComponentDefinition[], 
    _source: string
  ): void {
    for (const component of data) {
      // Skip if ID already exists to prevent duplicates from multiple JSON files
      if (this.components.has(component.id)) {
        continue;
      }
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

  addCustomComponent(component: Omit<ComponentDefinition, 'isCustom'>): ComponentDefinition {
    const newComponent: ComponentDefinition = { ...component, isCustom: true };
    this.customComponents.push(newComponent);
    this.components.set(newComponent.id, newComponent);
    this.allComponents.push(newComponent);
    const category = newComponent.category || 'Other';
    if (!this.categories.has(category)) {
      this.categories.set(category, []);
    }
    this.categories.get(category)!.push(newComponent);
    this.saveCustomComponents();
    return newComponent;
  }

  getCustomComponents(): ComponentDefinition[] {
    return [...this.customComponents];
  }

  updateCustomComponent(id: string, updates: Partial<Omit<ComponentDefinition, 'id' | 'isCustom'>>): ComponentDefinition | null {
    const index = this.customComponents.findIndex(c => c.id === id);
    if (index === -1) return null;
    
    const component = this.customComponents[index];
    const oldCategory = component.category || 'Other';
    
    const updatedComponent: ComponentDefinition = { ...component, ...updates, isCustom: true };
    this.customComponents[index] = updatedComponent;
    this.components.set(id, updatedComponent);
    
    const allIndex = this.allComponents.findIndex(c => c.id === id);
    if (allIndex !== -1) this.allComponents[allIndex] = updatedComponent;
    
    const newCategory = updatedComponent.category || 'Other';
    if (oldCategory !== newCategory) {
      const oldCatComponents = this.categories.get(oldCategory);
      if (oldCatComponents) {
        const idx = oldCatComponents.findIndex(c => c.id === id);
        if (idx !== -1) oldCatComponents.splice(idx, 1);
      }
      if (!this.categories.has(newCategory)) {
        this.categories.set(newCategory, []);
      }
      this.categories.get(newCategory)!.push(updatedComponent);
    } else {
      const catComponents = this.categories.get(newCategory);
      if (catComponents) {
        const idx = catComponents.findIndex(c => c.id === id);
        if (idx !== -1) catComponents[idx] = updatedComponent;
      }
    }
    
    this.saveCustomComponents();
    return updatedComponent;
  }

  deleteCustomComponent(id: string): boolean {
    const index = this.customComponents.findIndex(c => c.id === id);
    if (index === -1) return false;
    const component = this.customComponents[index];
    this.customComponents.splice(index, 1);
    this.components.delete(id);
    this.allComponents = this.allComponents.filter(c => c.id !== id);
    const category = component.category || 'Other';
    const catComponents = this.categories.get(category);
    if (catComponents) {
      const catIndex = catComponents.findIndex(c => c.id === id);
      if (catIndex !== -1) catComponents.splice(catIndex, 1);
    }
    this.saveCustomComponents();
    return true;
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
