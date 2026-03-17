import { create } from 'zustand';
import { db, ComponentCategory, ComponentTemplate } from '@/lib/database';

interface ComponentsState {
  categories: ComponentCategory[];
  templates: ComponentTemplate[];
  loading: boolean;
  
  loadComponents: () => Promise<void>;
}

export const useComponentsStore = create<ComponentsState>((set) => ({
  categories: [],
  templates: [],
  loading: false,

  loadComponents: async () => {
    set({ loading: true });
    try {
      const [categories, templates] = await Promise.all([
        db.getComponentCategories(),
        db.getComponentTemplates(),
      ]);
      set({ categories, templates, loading: false });
    } catch (error) {
      console.error('Failed to load components:', error);
      set({ loading: false });
    }
  },
}));
