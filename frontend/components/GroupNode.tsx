'use client';

import { useState, useRef, useEffect } from 'react';
import { NodeProps } from 'reactflow';
import { useDiagramStore } from '@/store/diagramStore';

export default function GroupNode({ id, data, selected }: NodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  const color = (data as { groupColor?: string })?.groupColor || '#e2e8f0';

  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const bg = hexToRgba(color, 0.04);
  const borderColor = selected ? hexToRgba('#8b5cf6', 0.7) : hexToRgba(color, 0.35);
  const tagBorder = hexToRgba(color, 0.5);
  const tagText = hexToRgba(color, 0.9);
  const tagBg = hexToRgba(color, 0.08);

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
        border: `2px ${selected ? 'solid' : 'dashed'} ${borderColor}`,
        borderRadius: 16,
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
          top: -12,
          left: 16,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '3px 10px',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: tagText,
          background: tagBg,
          border: `1px solid ${tagBorder}`,
          borderRadius: 6,
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          lineHeight: 1.4,
          whiteSpace: 'nowrap',
          cursor: 'pointer',
          minWidth: 40,
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