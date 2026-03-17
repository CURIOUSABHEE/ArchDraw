import { getSupabaseClient } from './supabase';

export type Diagram = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  nodes: any[];
  edges: any[];
  settings: {
    showGrid: boolean;
    edgeAnimations: boolean;
    darkMode: boolean;
  };
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

export type DiagramVersion = {
  id: string;
  diagram_id: string;
  nodes: any[];
  edges: any[];
  created_at: string;
};

export type ComponentCategory = {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  display_order: number;
  created_at: string;
};

export type ComponentTemplate = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  technology: string | null;
  created_at: string;
};

export type ActivityLogEntry = {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, any>;
  created_at: string;
};

export const db = {
  // Diagram operations
  async getDiagrams(userId: string): Promise<Diagram[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('diagrams')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getDiagram(id: string): Promise<Diagram | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('diagrams')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async createDiagram(userId: string, name: string = 'Untitled Diagram'): Promise<Diagram> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('diagrams')
      .insert({
        user_id: userId,
        name,
        nodes: [],
        edges: [],
        settings: { showGrid: true, edgeAnimations: true, darkMode: false },
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateDiagram(id: string, updates: Partial<Diagram>): Promise<Diagram> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('diagrams')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async saveDiagram(id: string, nodes: any[], edges: any[]): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('diagrams')
      .update({ nodes, edges, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw error;
  },

  async deleteDiagram(id: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('diagrams')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Diagram versions (history)
  async saveDiagramVersion(diagramId: string, nodes: any[], edges: any[]): Promise<DiagramVersion> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('diagram_versions')
      .insert({ diagram_id: diagramId, nodes, edges })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getDiagramVersions(diagramId: string): Promise<DiagramVersion[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('diagram_versions')
      .select('*')
      .eq('diagram_id', diagramId)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    return data || [];
  },

  // Component categories
  async getComponentCategories(): Promise<ComponentCategory[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('component_categories')
      .select('*')
      .order('display_order', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  // Component templates
  async getComponentTemplates(): Promise<ComponentTemplate[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('component_templates')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async getComponentTemplatesByCategory(categoryId: string): Promise<ComponentTemplate[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('component_templates')
      .select('*')
      .eq('category_id', categoryId)
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  // Activity logging
  async logActivity(
    action: string,
    entityType: string,
    entityId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('activity_log')
      .insert({
        action,
        entity_type: entityType,
        entity_id: entityId,
        details: details || {},
      });
    
    if (error) console.error('Failed to log activity:', error);
  },

  async getActivityLog(userId: string, limit: number = 50): Promise<ActivityLogEntry[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  },
};
