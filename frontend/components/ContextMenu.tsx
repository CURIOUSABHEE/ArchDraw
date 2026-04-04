'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useReactFlow } from 'reactflow';
import { useDiagramStore } from '@/store/diagramStore';
import { 
  Copy, Clipboard, Scissors, Trash2, Group, Type, 
  MessageSquare, CheckSquare, Layers, ZoomIn, ZoomOut,
  Maximize2, ChevronRight
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export interface ContextMenuState {
  x: number;
  y: number;
  nodeId?: string;
  flowX?: number;
  flowY?: number;
}

interface Props {
  menu: ContextMenuState;
  onClose: () => void;
}

export function ContextMenu({ menu, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { screenToFlowPosition, fitView } = useReactFlow();
  const {
    nodes, removeNode, setSelectedNodeId,
    selectedNodeIds, createGroup,
    pushHistory, fitView: storeFitView,
  } = useDiagramStore();

  useEffect(() => {
    const handler = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent && e.key === 'Escape') { onClose(); return; }
      if (e instanceof MouseEvent && ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', handler);
    };
  }, [onClose]);

  const addAtPosition = useCallback((type: string, data: Record<string, unknown>) => {
    const pos = screenToFlowPosition({ x: menu.x, y: menu.y });
    pushHistory();
    useDiagramStore.setState((s) => ({
      nodes: [
        ...s.nodes,
        { id: `${type}-${Date.now()}`, type, position: pos, data },
      ],
    }));
    onClose();
  }, [menu.x, menu.y, screenToFlowPosition, pushHistory, onClose]);

  const addTextLabel = useCallback((fontSize: 'small' | 'medium' | 'large' | 'heading') => {
    addAtPosition('textLabelNode', { text: 'Label', fontSize });
  }, [addAtPosition]);

  const duplicateNode = useCallback(() => {
    if (!menu.nodeId) return;
    const node = nodes.find((n) => n.id === menu.nodeId);
    if (!node) return;
    pushHistory();
    const newId = `${node.type}-${Date.now()}`;
    useDiagramStore.setState((s) => ({
      nodes: [
        ...s.nodes,
        { ...node, id: newId, position: { x: node.position.x + 24, y: node.position.y + 24 }, selected: false },
      ],
    }));
    onClose();
  }, [menu.nodeId, nodes, pushHistory, onClose]);

  const deleteNode = useCallback(() => {
    if (menu.nodeId) { setConfirmDelete(true); }
  }, [menu.nodeId]);

  const handleDeleteConfirm = useCallback(() => {
    if (menu.nodeId) { removeNode(menu.nodeId); onClose(); }
    setConfirmDelete(false);
  }, [menu.nodeId, removeNode, onClose]);

  const handleDeleteCancel = useCallback(() => {
    setConfirmDelete(false);
  }, []);

  const addToGroup = useCallback(() => {
    if (!menu.nodeId) return;
    const ids = selectedNodeIds.length > 0 ? selectedNodeIds : [menu.nodeId];
    useDiagramStore.setState({ selectedNodeIds: ids });
    createGroup();
    onClose();
  }, [menu.nodeId, selectedNodeIds, createGroup, onClose]);

  const selectAll = useCallback(() => {
    const allIds = nodes.map((n) => n.id);
    useDiagramStore.setState({ selectedNodeIds: allIds });
    onClose();
  }, [nodes, onClose]);

  const resetZoom = useCallback(() => {
    fitView({ padding: 0.1, duration: 300 });
    onClose();
  }, [fitView, onClose]);

  const zoomIn = useCallback(() => {
    const viewport = document.querySelector('.react-flow__viewport') as HTMLElement | null;
    if (viewport) {
      const transform = viewport.style.transform;
      const match = transform.match(/scale\(([^)]+)\)/);
      const currentZoom = match ? parseFloat(match[1]) : 1;
      const newZoom = Math.min(currentZoom * 1.2, 2);
      viewport.style.transform = viewport.style.transform.replace(
        /scale\([^)]+\)/,
        `scale(${newZoom})`
      );
    }
    onClose();
  }, [onClose]);

  const zoomOut = useCallback(() => {
    const viewport = document.querySelector('.react-flow__viewport') as HTMLElement | null;
    if (viewport) {
      const transform = viewport.style.transform;
      const match = transform.match(/scale\(([^)]+)\)/);
      const currentZoom = match ? parseFloat(match[1]) : 1;
      const newZoom = Math.max(currentZoom / 1.2, 0.1);
      viewport.style.transform = viewport.style.transform.replace(
        /scale\([^)]+\)/,
        `scale(${newZoom})`
      );
    }
    onClose();
  }, [onClose]);

  const isNodeMenu = !!menu.nodeId;

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top: menu.y,
        left: menu.x,
        zIndex: 1000,
        minWidth: 200,
      }}
      className="bg-card rounded-2xl shadow-soft-4 overflow-hidden py-2 animate-in fade-in-0 zoom-in-95 duration-150"
    >
      {isNodeMenu ? (
        <>
          <MenuItem icon={<Copy size={14} />} onClick={duplicateNode}>
            Duplicate
            <Shortcut>kbd ⌘D</Shortcut>
          </MenuItem>
          <MenuItem icon={<Scissors size={14} />} onClick={deleteNode} danger>
            Delete
            <Shortcut>kbd Del</Shortcut>
          </MenuItem>
          <Separator />
          <MenuItem icon={<Group size={14} />} onClick={addToGroup}>
            Add to Group
          </MenuItem>
          <Separator />
          <MenuItemWithSubmenu 
            icon={<Type size={14} />} 
            label="Add Text Label"
            submenuOpen={openSubmenu === 'textLabel'} 
            onMouseEnter={() => setOpenSubmenu('textLabel')}
            onMouseLeave={() => setOpenSubmenu(null)}
            onClick={() => addTextLabel('medium')}
          >
            <SubmenuItem onClick={() => addTextLabel('small')}>Small</SubmenuItem>
            <SubmenuItem onClick={() => addTextLabel('medium')}>Medium</SubmenuItem>
            <SubmenuItem onClick={() => addTextLabel('large')}>Large</SubmenuItem>
            <SubmenuItem onClick={() => addTextLabel('heading')}>Heading</SubmenuItem>
          </MenuItemWithSubmenu>
          <MenuItem icon={<MessageSquare size={14} />} onClick={() => addAtPosition('annotationNode', { title: 'Note', body: '' })}>
            Add Note
          </MenuItem>
        </>
      ) : (
        <>
          <MenuItemWithSubmenu 
            icon={<Type size={14} />} 
            label="Add Text Label"
            submenuOpen={openSubmenu === 'textLabel'} 
            onMouseEnter={() => setOpenSubmenu('textLabel')}
            onMouseLeave={() => setOpenSubmenu(null)}
            onClick={() => addTextLabel('medium')}
          >
            <SubmenuItem onClick={() => addTextLabel('small')}>Small</SubmenuItem>
            <SubmenuItem onClick={() => addTextLabel('medium')}>Medium</SubmenuItem>
            <SubmenuItem onClick={() => addTextLabel('large')}>Large</SubmenuItem>
            <SubmenuItem onClick={() => addTextLabel('heading')}>Heading</SubmenuItem>
          </MenuItemWithSubmenu>
          <MenuItem icon={<MessageSquare size={14} />} onClick={() => addAtPosition('annotationNode', { title: 'Note', body: '' })}>
            Add Note
          </MenuItem>
          <Separator />
          <MenuItem icon={<ZoomIn size={14} />} onClick={zoomIn}>
            Zoom In
            <Shortcut>kbd ⌘+</Shortcut>
          </MenuItem>
          <MenuItem icon={<ZoomOut size={14} />} onClick={zoomOut}>
            Zoom Out
            <Shortcut>kbd ⌘-</Shortcut>
          </MenuItem>
          <MenuItem icon={<Maximize2 size={14} />} onClick={resetZoom}>
            Fit to Screen
            <Shortcut>kbd ⌘0</Shortcut>
          </MenuItem>
          <Separator />
          <MenuItem icon={<CheckSquare size={14} />} onClick={selectAll}>
            Select All
            <Shortcut>kbd ⌘A</Shortcut>
          </MenuItem>
        </>
      )}

      <ConfirmDialog
        isOpen={confirmDelete}
        title="Delete node?"
        description="This action cannot be undone."
        confirmText="Delete"
        destructive
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
}

function MenuItem({ 
  children, 
  onClick, 
  danger,
  icon 
}: { 
  children: React.ReactNode; 
  onClick: () => void; 
  danger?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-all rounded-xl mx-1 hover:bg-accent group ${
        danger ? 'text-destructive hover:bg-destructive/10' : 'text-foreground'
      }`}
    >
      {icon && <span className="w-4 h-4 opacity-50 group-hover:opacity-80">{icon}</span>}
      <span className="flex-1 text-left">{children}</span>
    </button>
  );
}

function Shortcut({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] text-muted-foreground/50 font-mono ml-2">
      {children}
    </span>
  );
}

function Separator() {
  return <div className="my-1.5 h-px bg-foreground/10 mx-2" />;
}

function MenuItemWithSubmenu({ 
  children, 
  icon, 
  label,
  submenuOpen,
  onMouseEnter,
  onMouseLeave,
  onClick
}: { 
  children: React.ReactNode; 
  icon?: React.ReactNode;
  label: string;
  submenuOpen: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick?: () => void;
}) {
  return (
    <div className="relative" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <button
        onClick={onClick}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-all rounded-xl mx-1 hover:bg-accent group text-foreground"
      >
        {icon && <span className="w-4 h-4 opacity-50 group-hover:opacity-80">{icon}</span>}
        <span className="flex-1 text-left">{label}</span>
        <ChevronRight size={14} className="opacity-50" />
      </button>
      {submenuOpen && (
        <div 
          className="absolute left-full top-0 ml-1 bg-card rounded-xl shadow-soft-4 py-2 min-w-[120px] animate-in fade-in-0 zoom-in-95 duration-150"
        >
          {children}
        </div>
      )}
    </div>
  );
}

function SubmenuItem({ 
  children, 
  onClick 
}: { 
  children: React.ReactNode; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center px-3 py-2.5 text-sm transition-all rounded-xl mx-1 hover:bg-accent text-foreground"
    >
      {children}
    </button>
  );
}
