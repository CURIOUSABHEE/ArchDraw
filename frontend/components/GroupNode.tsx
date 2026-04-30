'use client';

import { useState, useRef, useEffect } from 'react';
import { NodeProps } from 'reactflow';
import { useDiagramStore } from '@/store/diagramStore';

export default function GroupNode({ id, data, selected }: NodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  const color = (data as { groupColor?: string })?.groupColor || '#3b82f6';

  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const bg = hexToRgba(color, 0.12);
  const borderColor = selected ? hexToRgba(color, 0.8) : hexToRgba(color, 0.35);
  const tagBorder = hexToRgba(color, 0.5);
  const tagText = hexToRgba(color, 0.9);
  const tagBg = hexToRgba(color, 0.15);

  const label =
    (data as { groupLabel?: string; label?: string })?.groupLabel ||
    (data as { label?: string })?.label ||
    '';

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // If shift is held, add to multi-select
    if (e.shiftKey) {
      const currentSelected = useDiagramStore.getState().selectedNodeIds;
      if (currentSelected.includes(id)) {
        useDiagramStore.getState().setSelectedNodeIds(currentSelected.filter(nid => nid !== id));
      } else {
        useDiagramStore.getState().setSelectedNodeIds([...currentSelected, id]);
      }
    } else {
      // Otherwise select just this group
      useDiagramStore.getState().setSelectedNodeId(id);
      useDiagramStore.getState().setSelectedNodeIds([id]);
    }
  };

  const handleLabelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditValue(label || 'Group');
  };

  const handleSave = () => {
    if (editValue.trim()) {
      useDiagramStore.getState().updateNodeData(id, { groupLabel: editValue.trim() });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: bg,
        border: `1.5px ${selected ? 'solid' : 'dashed'} ${borderColor}`,
        borderRadius: 20,
        position: 'relative',
        boxSizing: 'border-box',
        cursor: 'pointer',
      }}
      onClick={handleContainerClick}
    >
      {/* Text tag - editable */}
      <div
        style={{
          position: 'absolute',
          top: -14,
          left: 20,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 12px',
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: tagText,
          background: 'rgba(255,255,255,0.9)',
          border: `1px solid ${tagBorder}`,
          borderRadius: 999,
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          lineHeight: 1.4,
          whiteSpace: 'nowrap',
          cursor: 'pointer',
          minWidth: 50,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}
        onClick={handleLabelClick}
        title="Click to edit group name"
      >
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: tagText,
              width: '100%',
              cursor: 'text',
              padding: 0,
            }}
          />
        ) : (
          <span>{label || 'Group'}</span>
        )}
      </div>
    </div>
  );
}

export { GroupNode };