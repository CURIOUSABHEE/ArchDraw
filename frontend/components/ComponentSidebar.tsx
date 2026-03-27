'use client';

import { useState, useEffect } from 'react';
import { Search, ChevronDown, Plus, Pencil, Trash2, Server } from 'lucide-react';
import { CreateComponentModal, COMPONENT_TYPES, type CreateComponentData, type ComponentToEdit } from './CreateComponentModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { componentRegistry } from '@/lib/componentRegistry';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Monitor, Boxes, Database, Cpu, Brain,
  type LucideIcon,
} from 'lucide-react';
import componentsData from '@/data/components.json';
import awsData from '@/data/aws-components.json';
import dbData from '@/data/db-components.json';
import servicesData from '@/data/services-components.json';
import { useDiagramStore } from '@/store/diagramStore';
import { NodeIcon } from '@/components/NodeIcon';
import { iconRegistry } from '@/lib/iconRegistry';

function getViewportCenter(): { x: number; y: number } {
  const el = document.querySelector('.react-flow__viewport') as HTMLElement | null;
  const vp = el ? (() => {
    const style = el.style.transform;
    const match = style.match(/translate\(([^,]+)px,\s*([^)]+)px\)\s*scale\(([^)]+)\)/);
    if (!match) return null;
    return { x: parseFloat(match[1]), y: parseFloat(match[2]), zoom: parseFloat(match[3]) };
  })() : null;

  const bounds = document.querySelector('.react-flow__renderer')?.getBoundingClientRect();
  if (!vp || !bounds) return { x: 400 + Math.random() * 40 - 20, y: 300 + Math.random() * 40 - 20 };

  return {
    x: (bounds.width / 2 - vp.x) / vp.zoom + Math.random() * 40 - 20,
    y: (bounds.height / 2 - vp.y) / vp.zoom + Math.random() * 40 - 20,
  };
}

const ICON_MAP: Record<string, LucideIcon> = {
  Monitor, Boxes, Database, Cpu, Brain,
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

const COMPONENT_DESCRIPTIONS: Record<string, string> = {
  client_web: 'Browser-based web app that initiates requests',
  client_mobile: 'iOS or Android app that initiates requests',
  dns: 'Resolves domain names to IP addresses',
  cdn: 'Distributes static assets globally for low latency',
  api_gateway: 'Single entry point that routes and authenticates API calls',
  load_balancer: 'Distributes traffic across multiple backend instances',
  server_monolith: 'Single deployable unit containing all application logic',
  microservice: 'Small, independently deployable service',
  serverless_fn: 'Event-driven function that scales to zero',
  worker_job: 'Background process for async or scheduled tasks',
  sql_db: 'Relational database with ACID guarantees',
  nosql_db: 'Schema-flexible database for unstructured data',
  object_storage: 'Scalable blob storage for files and backups',
  llm_api: 'Large language model API for text generation',
  vector_db: 'Stores and queries high-dimensional embeddings',
  rag_pipeline: 'Retrieval-augmented generation pipeline',
};

function getDescription(comp: ComponentEntry): string {
  if (COMPONENT_DESCRIPTIONS[comp.id]) return COMPONENT_DESCRIPTIONS[comp.id];
  if (comp.technology && iconRegistry[comp.technology]) return iconRegistry[comp.technology].description;
  return comp.label;
}

function makeDragGhost(label: string, color: string) {
  const ghost = document.createElement('div');
  ghost.style.cssText = `position:fixed;top:-100px;left:-100px;background:white;border:1px solid #e2e8f0;border-left:3px solid ${color};border-radius:8px;padding:6px 10px;font-size:11px;font-weight:600;color:#1e293b;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,0.15);pointer-events:none;`;
  ghost.textContent = label;
  return ghost;
}

interface CategorySection {
  key: string;
  title: string;
  icon: LucideIcon;
  data: ComponentEntry[];
}

const TOP_SECTIONS: CategorySection[] = [
  { key: 'general',   title: 'General',               icon: Monitor,    data: (componentsData as ComponentEntry[]).filter(c => !AI_CATEGORIES.includes(c.category)) },
  { key: 'aws',       title: 'AWS Services',           icon: Boxes,      data: awsData as ComponentEntry[] },
  { key: 'databases', title: 'Databases & Storage',   icon: Database,   data: (dbData as ComponentEntry[]).filter(c => ['Databases','ORMs & Tools','Search'].includes(c.category)) },
  { key: 'devtools',  title: 'Developer Tools',        icon: Cpu,       data: (dbData as ComponentEntry[]).filter(c => !['Databases','ORMs & Tools','Search'].includes(c.category)) },
  { key: 'services',  title: 'Services',               icon: Boxes,     data: servicesData as ComponentEntry[] },
  { key: 'ai',        title: 'AI & ML',               icon: Brain,     data: (componentsData as ComponentEntry[]).filter(c => AI_CATEGORIES.includes(c.category)) },
];

interface ComponentItemProps {
  comp: ComponentEntry;
  onAdd: (comp: ComponentEntry) => void;
}

function ComponentItem({ comp, onAdd }: ComponentItemProps) {
  const FallbackIcon: LucideIcon = (comp.icon ? ICON_MAP[comp.icon] : undefined) ?? Server;
  const displayColor = comp.technology
    ? (iconRegistry[comp.technology]?.color ?? comp.color)
    : comp.color;

  return (
    <button
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/archdraw', JSON.stringify(comp));
        e.dataTransfer.effectAllowed = 'move';
        const ghost = makeDragGhost(comp.label, displayColor);
        document.body.appendChild(ghost);
        e.dataTransfer.setDragImage(ghost, 0, 0);
        setTimeout(() => document.body.removeChild(ghost), 0);
      }}
      onClick={() => onAdd(comp)}
      title={getDescription(comp)}
      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors cursor-grab active:cursor-grabbing"
    >
      <div
        className="flex items-center justify-center rounded shrink-0"
        style={{ width: 28, height: 28, background: `${displayColor}15`, border: `1px solid ${displayColor}30` }}
      >
        {comp.technology ? (
          <NodeIcon technology={comp.technology} size={12} />
        ) : (
          <FallbackIcon size={12} style={{ color: displayColor }} strokeWidth={1.75} />
        )}
      </div>
      <span className="flex-1 text-left truncate">{comp.label}</span>
    </button>
  );
}

interface ComponentSidebarProps {
  onOpenCreateModal?: () => void;
}

export function ComponentSidebar({ onOpenCreateModal }: ComponentSidebarProps) {
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editComponent, setEditComponent] = useState<ComponentToEdit | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [customComponents, setCustomComponents] = useState<ComponentEntry[]>([]);
  const addNode = useDiagramStore((s) => s.addNode);
  const existingNames = componentRegistry.getAll().map(c => c.label.toLowerCase());

  useEffect(() => {
    setCustomComponents(componentRegistry.getCustomComponents() as ComponentEntry[]);
  }, []);

  useEffect(() => {
    const handler = () => {
      setCustomComponents(componentRegistry.getCustomComponents() as ComponentEntry[]);
    };
    window.addEventListener('custom-component-added', handler);
    return () => window.removeEventListener('custom-component-added', handler);
  }, []);

  const handleAdd = (comp: ComponentEntry) => {
    addNode(comp.id, comp.label, comp.category, comp.color, comp.icon, comp.technology, getViewportCenter());
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
  const defaultOpen = TOP_SECTIONS[0]?.key;

  return (
    <aside className="w-60 border-r border-border bg-background flex flex-col h-full shrink-0">
      <div className="p-4 border-b border-border/50 sticky top-0 bg-background z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search..."
            className="pl-9 pr-3 h-9 bg-accent border-transparent rounded-lg text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {q ? (
          <SearchResults
            query={q}
            sections={TOP_SECTIONS}
            customComponents={customComponents}
            onAdd={handleAdd}
          />
        ) : (
          <>
            {customComponents.length > 0 && (
              <div className="mb-4 p-3 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">Your Components</span>
                  <span className="text-[10px] text-muted-foreground">{customComponents.length} item{customComponents.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="space-y-1">
                  {customComponents.map((comp) => (
                    <div
                      key={comp.id}
                      className="group flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-background/80 rounded-lg transition-colors cursor-grab active:cursor-grabbing"
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
                      title={comp.description || comp.label}
                    >
                      <div
                        className="flex items-center justify-center rounded shrink-0"
                        style={{ width: 24, height: 24, background: `${comp.color}15`, border: `1px solid ${comp.color}30` }}
                      >
                        <Server size={10} style={{ color: comp.color }} strokeWidth={1.75} />
                      </div>
                      <span className="flex-1 text-left truncate text-xs">{comp.label}</span>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEdit({ id: comp.id, label: comp.label, category: comp.category, description: comp.description }); }}
                          className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                          title="Edit"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirm(comp.id); }}
                          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Accordion type="single" defaultValue={defaultOpen} collapsible className="space-y-2">
              {TOP_SECTIONS.map((section) => {
                const Icon = section.icon;
                return (
                  <AccordionItem key={section.key} value={section.key} className="border-0">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-accent rounded-lg transition-colors">
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">{section.title}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-2">
                      <div className="space-y-1 pl-2">
                        {section.data.slice(0, 20).map((comp) => (
                          <ComponentItem key={comp.id} comp={comp} onAdd={handleAdd} />
                        ))}
                        {section.data.length > 20 && (
                          <p className="px-4 py-2 text-xs text-muted-foreground">
                            +{section.data.length - 20} more items
                          </p>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </>
        )}
      </div>

      <div className="p-4 border-t border-border/50">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 h-11 rounded-xl border-dashed text-muted-foreground hover:text-foreground hover:border-primary"
          onClick={() => { setEditComponent(null); setShowCreateModal(true); }}
        >
          <Plus className="w-4 h-4" />
          New component
        </Button>
      </div>

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
    </aside>
  );
}

interface SearchResultsProps {
  query: string;
  sections: CategorySection[];
  customComponents: ComponentEntry[];
  onAdd: (comp: ComponentEntry) => void;
}

function SearchResults({ query, sections, customComponents, onAdd }: SearchResultsProps) {
  const nativeItems = sections.flatMap((s) => s.data);
  
  const customFiltered = customComponents.filter(
    (c) =>
      c.label.toLowerCase().includes(query) ||
      c.category.toLowerCase().includes(query) ||
      (c.description && c.description.toLowerCase().includes(query))
  );
  
  const nativeFiltered = nativeItems.filter(
    (c) =>
      c.label.toLowerCase().includes(query) ||
      c.category.toLowerCase().includes(query) ||
      (c.technology && c.technology.toLowerCase().includes(query))
  );

  if (nativeFiltered.length === 0 && customFiltered.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">No components found</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {customFiltered.length > 0 && (
        <>
          <div className="px-2 py-1.5">
            <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">Your Components</span>
          </div>
          {customFiltered.map((comp) => (
            <div
              key={comp.id}
              className="flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors cursor-grab active:cursor-grabbing"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/archdraw', JSON.stringify(comp));
                e.dataTransfer.effectAllowed = 'move';
                const ghost = makeDragGhost(comp.label, comp.color);
                document.body.appendChild(ghost);
                e.dataTransfer.setDragImage(ghost, 0, 0);
                setTimeout(() => document.body.removeChild(ghost), 0);
              }}
              onClick={() => onAdd(comp)}
              title={comp.description || comp.label}
            >
              <div
                className="flex items-center justify-center rounded shrink-0"
                style={{ width: 28, height: 28, background: `${comp.color}15`, border: `1px solid ${comp.color}30` }}
              >
                <Server size={12} style={{ color: comp.color }} strokeWidth={1.75} />
              </div>
              <span className="flex-1 text-left truncate">{comp.label}</span>
              <span className="text-[10px] text-muted-foreground">custom</span>
            </div>
          ))}
        </>
      )}
      {nativeFiltered.length > 0 && (
        <>
          {customFiltered.length > 0 && (
            <div className="px-2 py-1.5 mt-2">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Built-in</span>
            </div>
          )}
          {nativeFiltered.map((comp) => (
            <ComponentItem key={comp.id} comp={comp} onAdd={onAdd} />
          ))}
        </>
      )}
    </div>
  );
}
