'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Pencil, Trash2, Server, PanelLeft, Blocks, Database, Cpu, Brain, ChevronDown, ChevronRight } from 'lucide-react';
import { CreateComponentModal, COMPONENT_TYPES, type CreateComponentData, type ComponentToEdit } from './CreateComponentModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { componentRegistry } from '@/lib/componentRegistry';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Monitor, Boxes, Database as DbIcon, Cpu as CpuIcon, Brain as BrainIcon,
  type LucideIcon,
} from 'lucide-react';
import componentsData from '@/data/components.json';
import awsData from '@/data/aws-components.json';
import dbData from '@/data/db-components.json';
import servicesData from '@/data/services-components.json';
import { useDiagramStore } from '@/store/diagramStore';
import { createNode } from '@/lib/nodeFactory';
import { NodeIcon } from '@/components/NodeIcon';
import { iconRegistry } from '@/lib/iconRegistry';
import { getViewportCenter } from '@/lib/utils';

const ICON_MAP: Record<string, LucideIcon> = {
  Monitor, Boxes, DbIcon, CpuIcon, BrainIcon,
};

const AI_CATEGORIES = [
  'AI Agents', 'LLM Models', 'RAG', 'Vector Databases',
  'ML Infrastructure', 'ML Serving', 'MLOps', 'LLM Ops',
  'AI Frameworks', 'AI Data Pipeline', 'Speech & Audio', 'Vision AI',
];

interface ComponentEntry {
  id: string;
  label: string;
  category: string;
  color: string;
  icon?: string;
  technology?: string;
  description?: string;
  isCustom?: boolean;
}

function makeDragGhost(label: string, color: string) {
  const ghost = document.createElement('div');
  ghost.style.cssText = `position:fixed;top:-100px;left:-100px;background:white;border-radius:10px;padding:8px 14px;font-size:12px;font-weight:500;color:#374151;white-space:nowrap;box-shadow:0 8px 24px rgba(0,0,0,0.12);pointer-events:none;`;
  ghost.textContent = label;
  return ghost;
}

const TOP_SECTIONS = [
  { key: 'general', title: 'General', icon: Monitor },
  { key: 'aws', title: 'AWS', icon: Boxes },
  { key: 'databases', title: 'Databases', icon: Database },
  { key: 'devtools', title: 'Tools', icon: Cpu },
  { key: 'services', title: 'Services', icon: Boxes },
  { key: 'ai', title: 'AI & ML', icon: Brain },
];

interface ComponentSidebarProps {
  onOpenCreateModal?: () => void;
}

export function ComponentSidebar({ onOpenCreateModal }: ComponentSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editComponent, setEditComponent] = useState<ComponentToEdit | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [customComponents, setCustomComponents] = useState<ComponentEntry[]>([]);
  const [activeSection, setActiveSection] = useState<string>('general');
  const addNode = useDiagramStore((s) => s.addNode);
  const existingNames = componentRegistry.getAll().map(c => c.label.toLowerCase());
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCustomComponents(componentRegistry.getCustomComponents() as ComponentEntry[]);
  }, []);

  useEffect(() => {
    const handler = () => {
      setCustomComponents(componentRegistry.getCustomComponents());
    };
    window.addEventListener('custom-component-added', handler);
    return () => window.removeEventListener('custom-component-added', handler);
  }, []);

  const handleAdd = (comp: ComponentEntry) => {
    const result = createNode(
      {
        componentId: comp.id,
        label: comp.label,
        category: comp.category,
        color: comp.color,
        icon: comp.icon,
        technology: comp.technology,
        position: getViewportCenter(),
      },
      'sidebar'
    );
    addNode(result.node);
  };

  const handleEdit = (comp: ComponentToEdit) => {
    setEditComponent(comp);
    setShowCreateModal(true);
  };

  const handleDelete = (id: string) => {
    componentRegistry.deleteCustomComponent(id);
    setCustomComponents(componentRegistry.getCustomComponents());
    setDeleteConfirm(null);
    window.dispatchEvent(new CustomEvent('custom-component-added'));
  };

  const handleUpdate = (id: string, data: CreateComponentData) => {
    const typeInfo = COMPONENT_TYPES.find(t => t.id === data.type);
    componentRegistry.updateCustomComponent(id, {
      label: data.name,
      category: typeInfo?.label || 'Other',
      color: typeInfo?.color || '#6366f1',
      description: data.description,
    });
    setCustomComponents(componentRegistry.getCustomComponents());
    setEditComponent(null);
    window.dispatchEvent(new CustomEvent('custom-component-added'));
  };

  const q = search.toLowerCase().trim();

  const getSectionData = (key: string): ComponentEntry[] => {
    switch (key) {
      case 'general':
        return (componentsData as ComponentEntry[]).filter(c => !AI_CATEGORIES.includes(c.category));
      case 'aws':
        return awsData as ComponentEntry[];
      case 'databases':
        return (dbData as ComponentEntry[]).filter(c => ['Databases', 'ORMs & Tools', 'Search'].includes(c.category));
      case 'devtools':
        return (dbData as ComponentEntry[]).filter(c => !['Databases', 'ORMs & Tools', 'Search'].includes(c.category));
      case 'services':
        return servicesData as ComponentEntry[];
      case 'ai':
        return (componentsData as ComponentEntry[]).filter(c => AI_CATEGORIES.includes(c.category));
      default:
        return [];
    }
  };

  const filteredComponents = q 
    ? [...customComponents, ...(componentsData as ComponentEntry[]), ...awsData, ...dbData, ...servicesData]
        .filter(c => c.label.toLowerCase().includes(q) || c.category.toLowerCase().includes(q))
        .slice(0, 30)
    : getSectionData(activeSection).slice(0, 15);

  return (
    <div ref={sidebarRef}>
      {/* Collapsed Icon Toolbar */}
      {!isExpanded && (
        <div className="floating-icon-toolbar">
          <button
            onClick={() => setIsExpanded(true)}
            className="floating-icon-btn active"
            title="Components"
          >
            <Blocks className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => { setIsExpanded(true); setActiveSection('custom'); }}
            className="floating-icon-btn"
            title="Custom Components"
          >
            <Server className="w-5 h-5" />
          </button>

          <div className="w-6 h-px bg-foreground/10 my-1" />

          <button
            onClick={() => onOpenCreateModal?.()}
            className="floating-icon-btn"
            title="New Component"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Expanded Floating Panel */}
      {isExpanded && (
        <div 
          className="floating-panel flex flex-col"
          style={{ width: 340, height: 'calc(100vh - 120px)', maxHeight: 'calc(100vh - 120px)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#F2F2F2' }}>
            <div className="flex items-center gap-2">
              <Blocks className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Components</span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1.5 rounded-lg hover:bg-accent transition-colors"
            >
              <PanelLeft className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Search */}
          <div className="relative px-5 py-4">
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search components..."
              className="pl-9 h-10 bg-secondary border-0 rounded-xl text-sm w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Section Tabs */}
          {!q && (
            <div className="flex gap-2 px-5 pb-3 overflow-x-auto">
              {TOP_SECTIONS.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.key}
                    onClick={() => setActiveSection(section.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      activeSection === section.key
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {section.title}
                  </button>
                );
              })}
            </div>
          )}

          {/* Component List */}
          <div className="flex-1 overflow-y-auto mt-3 space-y-1">
            {/* Custom Components Section */}
            {customComponents.length > 0 && !q && activeSection !== 'general' && (
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold text-foreground uppercase tracking-wider">Custom</span>
                  <span className="text-[10px] text-muted-foreground">{customComponents.length}</span>
                </div>
                {customComponents.map((comp) => (
                  <div
                    key={comp.id}
                    className="group flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/60 rounded-lg transition-all cursor-grab"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/archdraw', JSON.stringify(comp));
                      e.dataTransfer.effectAllowed = 'move';
                      const ghost = makeDragGhost(comp.label, comp.color);
                      document.body.appendChild(ghost);
                      e.dataTransfer.setDragImage(ghost, 0, 0);
                      setTimeout(() => document.body.removeChild(ghost), 0);
                    }}
                    onClick={() => handleAdd(comp)}
                  >
                    <div
                      className="flex items-center justify-center rounded shrink-0"
                      style={{ width: 22, height: 22, background: `${comp.color}15` }}
                    >
                      <Server size={10} style={{ color: comp.color }} />
                    </div>
                    <span className="flex-1 truncate text-xs">{comp.label}</span>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEdit({ id: comp.id, label: comp.label, category: comp.category, description: comp.description }); }}
                        className="p-1 rounded hover:bg-accent"
                      >
                        <Pencil size={10} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm(comp.id); }}
                        className="p-1 rounded hover:bg-destructive/10 text-destructive"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Built-in Components */}
            {filteredComponents.map((comp) => {
              const displayColor = 'technology' in comp && comp.technology
                ? (iconRegistry[comp.technology]?.color ?? comp.color)
                : comp.color;
              
              return (
                <button
                  key={comp.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/archdraw', JSON.stringify(comp));
                    e.dataTransfer.effectAllowed = 'move';
                    const ghost = makeDragGhost(comp.label, displayColor);
                    document.body.appendChild(ghost);
                    e.dataTransfer.setDragImage(ghost, 0, 0);
                    setTimeout(() => document.body.removeChild(ghost), 0);
                  }}
                  onClick={() => handleAdd(comp)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/60 rounded-lg transition-all cursor-grab"
                >
                  <div
                    className="flex items-center justify-center rounded shrink-0"
                    style={{ width: 22, height: 22, background: `${displayColor}15` }}
                  >
                    {'technology' in comp && comp.technology ? (
                      <NodeIcon technology={comp.technology} size={10} />
                    ) : (
                      <span className="text-xs" style={{ color: displayColor }}>●</span>
                    )}
                  </div>
                  <span className="flex-1 truncate text-left text-xs">{comp.label}</span>
                  <span className="text-[9px] text-muted-foreground/50">{comp.category}</span>
                </button>
              );
            })}

            {filteredComponents.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No components found</p>
            )}
          </div>

          {/* Footer */}
          <div className="p-5 mt-auto border-t" style={{ borderColor: '#F2F2F2' }}>
            <Button
              className="w-full justify-start gap-2 h-12 rounded-xl text-sm font-medium bg-gray-100 hover:bg-gray-200 transition-colors border-0"
              onClick={() => { setEditComponent(null); setShowCreateModal(true); setIsExpanded(false); }}
            >
              <Plus className="w-5 h-5" />
              New component
            </Button>
          </div>
        </div>
      )}

      <CreateComponentModal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setEditComponent(null); }}
        onCreate={(data: CreateComponentData) => {
          const typeInfo = COMPONENT_TYPES.find(t => t.id === data.type);
          const id = `custom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          componentRegistry.addCustomComponent({
            id,
            label: data.name,
            category: typeInfo?.label || 'Other',
            color: typeInfo?.color || '#6366f1',
            description: data.description,
            technology: 'custom',
          });
          setShowCreateModal(false);
          setCustomComponents(componentRegistry.getCustomComponents());
          setSearch(data.name);
          window.dispatchEvent(new CustomEvent('custom-component-added'));
        }}
        onUpdate={handleUpdate}
        existingNames={existingNames}
        editComponent={editComponent}
      />

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Delete component?"
        description="This will permanently delete the custom component."
        confirmText="Delete"
        destructive
        onConfirm={() => {
          if (deleteConfirm) {
            handleDelete(deleteConfirm);
          }
        }}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}