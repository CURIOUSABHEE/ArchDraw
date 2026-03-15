'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useReactFlow } from 'reactflow';
import { useDiagramStore } from '@/store/diagramStore';

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
  const { screenToFlowPosition } = useReactFlow();
  const {
    nodes, removeNode, selectedNodeId, setSelectedNodeId,
    selectedNodeIds, createGroup,
    pushHistory,
  } = useDiagramStore();

  // Close on outside click or Escape
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
    if (menu.nodeId) { removeNode(menu.nodeId); onClose(); }
  }, [menu.nodeId, removeNode, onClose]);

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

  const isNodeMenu = !!menu.nodeId;

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top: menu.y,
        left: menu.x,
        zIndex: 1000,
        minWidth: 180,
      }}
      className="bg-card border border-border rounded-lg shadow-lg overflow-hidden py-1"
    >
      {isNodeMenu ? (
        <>
          <MenuItem onClick={duplicateNode}>Duplicate</MenuItem>
          <MenuItem onClick={deleteNode} danger>Delete</MenuItem>
          <Separator />
          <MenuItem onClick={addToGroup}>Add to Group</MenuItem>
        </>
      ) : (
        <>
          <MenuItem onClick={() => addAtPosition('textLabelNode', { text: 'Label', fontSize: 'medium' })}>
            Add Text Label
          </MenuItem>
          <MenuItem onClick={() => addAtPosition('annotationNode', { title: 'Note', body: '' })}>
            Add Note
          </MenuItem>
          <Separator />
          <MenuItem onClick={selectAll}>Select All</MenuItem>
        </>
      )}
    </div>
  );
}

function MenuItem({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors hover:bg-muted ${
        danger ? 'text-destructive hover:bg-destructive/10' : 'text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

function Separator() {
  return <div className="my-1 h-px bg-border mx-2" />;
}
