import { useState, useRef, useEffect } from 'react';
import { NodeProps } from 'reactflow';
import { useDiagramStore } from '@/store/diagramStore';
import { NodeResizer } from '@reactflow/node-resizer';
import { useCanvasTheme } from '@/lib/theme';
import '@reactflow/node-resizer/dist/style.css';

export default function GroupNode({ id, data, selected }: NodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { isDark } = useCanvasTheme();
  
  const color = (data as { groupColor?: string })?.groupColor || '#3b82f6';

  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const bg = isDark ? 'rgba(255,255,255,0.02)' : hexToRgba(color, 0.12);
  const borderColor = isDark 
    ? (selected ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)')
    : (selected ? hexToRgba(color, 0.8) : hexToRgba(color, 0.35));

  const borderStyle = isDark ? 'dashed' : (selected ? 'solid' : 'dashed');
  const borderWidth = isDark ? 1 : 1.5;

  const tagText = isDark ? '#475569' : hexToRgba(color, 0.9);
  const tagBg = isDark ? 'rgba(15, 17, 23, 0.9)' : 'rgba(255,255,255,0.9)';
  const tagBorder = isDark ? 'rgba(255,255,255,0.08)' : hexToRgba(color, 0.5);

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

  const handleContainerClick = (_e: React.MouseEvent) => {
    // Don't stop propagation — let ReactFlow's onNodeClick handle selection.
    // ReactFlow natively supports shift+click multi-select.
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
        border: `${borderWidth}px ${borderStyle} ${borderColor}`,
        borderRadius: 20,
        position: 'relative',
        boxSizing: 'border-box',
        cursor: 'pointer',
        boxShadow: isDark ? 'inset 0 4px 12px rgba(0,0,0,0.5)' : 'none',
      }}
      onClick={handleContainerClick}
    >
      <NodeResizer 
        color="#3b82f6" 
        isVisible={selected} 
        minWidth={100} 
        minHeight={100}
      />
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
          fontSize: isDark ? 12 : 9,
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: tagText,
          background: tagBg,
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
              fontSize: isDark ? 12 : 10,
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