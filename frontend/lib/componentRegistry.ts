import componentsData from '@/data/components.json';
import awsData from '@/data/aws-components.json';
import dbData from '@/data/db-components.json';
import servicesData from '@/data/services-components.json';
import logger from '@/lib/logger';

export interface ComponentDefinition {
  id: string;
  label: string;
  category: string;
  color: string;
  icon?: string;
  technology?: string;
  description?: string;
  isCustom?: boolean;
}

const ALL_COMPONENTS: ComponentDefinition[] = [
  ...(componentsData as ComponentDefinition[]),
  ...(awsData as ComponentDefinition[]),
  ...(dbData as ComponentDefinition[]),
  ...(servicesData as ComponentDefinition[]),
];

class ComponentRegistry {
  private components = new Map<string, ComponentDefinition>();
  private customComponents = new Map<string, ComponentDefinition>();

  constructor() {
    ALL_COMPONENTS.forEach(comp => this.components.set(comp.id, comp));
    this.loadCustomComponents();
  }

  private loadCustomComponents() {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('archdraw_custom_components');
      if (saved) {
        const custom = JSON.parse(saved) as ComponentDefinition[];
        custom.forEach(comp => this.customComponents.set(comp.id, { ...comp, isCustom: true }));
      }
    } catch (e) {
      logger.error('Failed to load custom components:', e);
    }
  }

  private saveCustomComponents() {
    if (typeof window === 'undefined') return;
    try {
      const custom = Array.from(this.customComponents.values());
      localStorage.setItem('archdraw_custom_components', JSON.stringify(custom));
    } catch (e) {
      logger.error('Failed to save custom components:', e);
    }
  }

  get(id: string): ComponentDefinition | undefined {
    return this.customComponents.get(id) || this.components.get(id);
  }

  getAll(): ComponentDefinition[] {
    return [...Array.from(this.customComponents.values()), ...Array.from(this.components.values())];
  }

  getCustomComponents(): ComponentDefinition[] {
    return Array.from(this.customComponents.values());
  }

  addCustomComponent(comp: ComponentDefinition) {
    this.customComponents.set(comp.id, { ...comp, isCustom: true });
    this.saveCustomComponents();
  }

  updateCustomComponent(id: string, updates: Partial<ComponentDefinition>) {
    const existing = this.customComponents.get(id);
    if (existing) {
      this.customComponents.set(id, { ...existing, ...updates });
      this.saveCustomComponents();
    }
  }

  deleteCustomComponent(id: string) {
    this.customComponents.delete(id);
    this.saveCustomComponents();
  }

  search(query: string): ComponentDefinition[] {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    
    return this.getAll().filter(comp => 
      comp.label.toLowerCase().includes(q) || 
      comp.category.toLowerCase().includes(q) ||
      comp.technology?.toLowerCase().includes(q)
    );
  }
}

export const componentRegistry = new ComponentRegistry();

export function getTierFromLayer(layer: string): string {
  const l = layer.toLowerCase();
  if (l.includes('client') || l.includes('presentation')) return 'client';
  if (l.includes('gateway') || l.includes('edge')) return 'edge';
  if (l.includes('service') || l.includes('compute') || l.includes('application')) return 'compute';
  if (l.includes('async') || l.includes('queue') || l.includes('broker')) return 'async';
  if (l.includes('data') || l.includes('db') || l.includes('cache')) return 'data';
  if (l.includes('observe') || l.includes('monitor') || l.includes('log')) return 'observe';
  if (l.includes('external')) return 'external';
  return 'compute';
}

export function getLayerColor(layer: 'A' | 'B' | 'C' | 'D'): string {
  const colors: Record<string, string> = {
    A: '#5A5A5A',
    B: '#6FA8DC',
    C: '#D8AA59',
    D: '#9A8575',
  };
  return colors[layer] || '#5A5A5A';
}
