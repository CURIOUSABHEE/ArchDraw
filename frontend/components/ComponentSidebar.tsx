'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, PanelLeft, Blocks, Layers, Square, Search } from 'lucide-react';
import { CreateComponentModal, COMPONENT_TYPES, type CreateComponentData, type ComponentToEdit } from './CreateComponentModal';
import { componentRegistry } from '@/lib/componentRegistry';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import componentsData from '@/data/components.json';
import awsData from '@/data/aws-components.json';
import dbData from '@/data/db-components.json';
import servicesData from '@/data/services-components.json';
import { useDiagramStore } from '@/store/diagramStore';
import { createNode } from '@/lib/nodeFactory';
import { getViewportCenter } from '@/lib/utils';

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
  { key: 'general', title: 'General' },
  { key: 'aws', title: 'AWS' },
  { key: 'databases', title: 'Databases' },
  { key: 'devtools', title: 'Tools' },
  { key: 'services', title: 'Services' },
  { key: 'ai', title: 'AI & ML' },
];

interface SidebarButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}

function SidebarButton({ icon, label, active, onClick }: SidebarButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="w-11 h-11 rounded-[12px] flex items-center justify-center transition-all duration-200"
        style={{
          background: active ? '#EDEDED' : 'transparent',
        }}
      >
        {icon}
      </button>
      {isHovered && (
        <div
          className="absolute left-full ml-2 px-3 py-1.5 rounded-[8px] text-xs font-medium whitespace-nowrap pointer-events-none"
          style={{ background: '#1A1A1A', color: 'white' }}
        >
          {label}
        </div>
      )}
    </div>
  );
}

interface ComponentSidebarProps {
  onOpenCreateModal?: () => void;
}

export function ComponentSidebar({ onOpenCreateModal }: ComponentSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editComponent, setEditComponent] = useState<ComponentToEdit | null>(null);
  const [customComponents, setCustomComponents] = useState<ComponentEntry[]>([]);
  const [activeSection, setActiveSection] = useState<string>('general');
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCustomComponents(componentRegistry.getCustomComponents() as ComponentEntry[]);
  }, []);

  const q = search.toLowerCase();

  const getSectionData = (section: string): ComponentEntry[] => {
    switch (section) {
      case 'general': return componentsData as ComponentEntry[];
      case 'aws': return awsData;
      case 'databases': return dbData;
      case 'devtools': return [];
      case 'services': return servicesData;
      case 'custom': return customComponents;
      default: return [];
    }
  };

  const filteredComponents = q 
    ? [...customComponents, ...(componentsData as ComponentEntry[]), ...awsData, ...dbData, ...servicesData]
        .filter(c => c.label.toLowerCase().includes(q) || c.category.toLowerCase().includes(q))
        .slice(0, 30)
    : getSectionData(activeSection).slice(0, 15);

  const handleAdd = (comp: ComponentEntry) => {
    const center = getViewportCenter();
    const result = createNode(
      {
        componentId: comp.id,
        label: comp.label,
        category: comp.category,
        color: comp.color,
        icon: comp.icon,
        technology: comp.technology,
        position: center,
      }
    );
    if (result) {
      const store = useDiagramStore.getState();
      store.pushHistory();
      store.importDiagram([...store.nodes, result.node], store.edges);
    }
  };

  return (
    <>
      {/* Collapsed - Floating Tool Panel */}
      {!isExpanded && (
        <div
          className="fixed z-40 flex flex-col items-center py-3 px-2"
          style={{
            left: 16,
            top: '45%',
            transform: 'translateY(-50%)',
            width: 64,
            background: '#FAFAFA',
            borderRadius: 20,
            boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
            gap: 3,
          }}
        >
          <SidebarButton
            icon={<Blocks className="w-5 h-5" style={{ color: '#1A1A1A' }} />}
            label="Components"
            onClick={() => { setIsExpanded(true); }}
          />
          
          <SidebarButton
            icon={<Layers className="w-5 h-5" style={{ color: '#6B6B6B' }} />}
            label="Layers"
            onClick={() => {}}
          />
          
          <SidebarButton
            icon={<Square className="w-5 h-5" style={{ color: '#6B6B6B' }} />}
            label="Shapes"
            onClick={() => {}}
          />

          <div className="w-8 h-px my-2" style={{ background: '#EAEAEA' }} />

          <SidebarButton
            icon={<Plus className="w-5 h-5" style={{ color: '#6366f1' }} />}
            label="Add"
            onClick={() => onOpenCreateModal?.()}
          />
        </div>
      )}

      {/* Expanded Panel */}
      {isExpanded && (
        <div
          className="fixed z-40 flex flex-col overflow-hidden"
          style={{
            left: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 280,
            maxHeight: 'calc(100vh - 180px)',
            background: '#FAFAFA',
            borderRadius: 20,
            boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#EAEAEA' }}>
            <div className="flex items-center gap-2">
              <Blocks className="w-4 h-4" style={{ color: '#6366f1' }} />
              <span className="text-sm font-semibold text-[#1A1A1A]">Components</span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1.5 rounded-[10px] transition-colors hover:bg-[#F2F2F2]"
            >
              <PanelLeft className="w-4 h-4" style={{ color: '#6B6B6B' }} />
            </button>
          </div>

          {/* Search */}
          <div className="relative px-4 py-3">
            <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#6B6B6B' }} />
            <Input
              type="text"
              placeholder="Search..."
              className="pl-9 h-9 rounded-xl text-sm w-full"
              style={{ background: '#FFFFFF', border: 'none' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Section Tabs */}
          {!q && (
            <div className="flex gap-1 px-4 pb-2 overflow-x-auto">
              {TOP_SECTIONS.slice(0, 4).map((section) => (
                <button
                  key={section.key}
                  onClick={() => setActiveSection(section.key)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] text-xs font-medium whitespace-nowrap transition-all"
                  style={{
                    background: activeSection === section.key ? '#EDEDED' : 'transparent',
                    color: activeSection === section.key ? '#1A1A1A' : '#6B6B6B',
                  }}
                >
                  {section.title}
                </button>
              ))}
            </div>
          )}

          {/* Component List */}
          <div className="flex-1 overflow-y-auto mt-2 px-3 pb-3">
            {customComponents.length > 0 && !q && activeSection !== 'general' && (
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[10px] font-semibold text-[#1A1A1A] uppercase tracking-wider">Custom</span>
                </div>
                {customComponents.map((comp) => (
                  <div
                    key={comp.id}
                    className="group flex items-center gap-2 px-2 py-2 rounded-[10px] text-sm transition-all cursor-grab hover:bg-[#F2F2F2]"
                    style={{ color: '#1A1A1A' }}
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
                      className="w-7 h-7 rounded-[8px] flex items-center justify-center text-white text-xs font-medium"
                      style={{ background: comp.color }}
                    >
                      {comp.label.charAt(0)}
                    </div>
                    <span className="flex-1 truncate">{comp.label}</span>
                  </div>
                ))}
              </div>
            )}

            {filteredComponents.map((comp) => (
              <div
                key={comp.id}
                className="group flex items-center gap-2 px-2 py-2 rounded-[10px] text-sm transition-all cursor-grab hover:bg-[#F2F2F2]"
                style={{ color: '#1A1A1A' }}
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
                  className="w-7 h-7 rounded-[8px] flex items-center justify-center text-white text-xs font-medium"
                  style={{ background: comp.color }}
                >
                  {comp.label.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate">{comp.label}</div>
                  <div className="text-[10px]" style={{ color: '#6B6B6B' }}>{comp.category}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-3 border-t" style={{ borderColor: '#EAEAEA' }}>
            <Button
              className="w-full justify-center gap-2 h-10 rounded-[12px] text-sm font-medium"
              style={{ background: '#F2F2F2', color: '#1A1A1A' }}
              onClick={() => { setEditComponent(null); setShowCreateModal(true); }}
            >
              <Plus className="w-4 h-4" />
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
          setCustomComponents(componentRegistry.getCustomComponents() as ComponentEntry[]);
          setShowCreateModal(false);
          setEditComponent(null);
          window.dispatchEvent(new CustomEvent('custom-component-added'));
        }}
        existingNames={componentRegistry.getAll().map(c => c.label)}
        editComponent={editComponent}
      />
    </>
  );
}