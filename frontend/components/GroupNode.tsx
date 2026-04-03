'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Handle, Position, NodeProps, NodeResizer, useReactFlow } from 'reactflow';

export interface GroupNodeData {
  label: string;
  color?: string;
}

function GroupNodeComponent({ id, data, selected }: NodeProps<GroupNodeData>) {
  const { setNodes } = useReactFlow();
  const color = data.color ?? '#6366f1';
  const [label, setLabel] = useState(data.label);
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLabel(data.label);
  }, [data.label]);

  const startEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const commitEdit = useCallback(() => {
    setEditing(false);
    setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, label } } : n));
  }, [id, label, setNodes]);

  return (
    <>
      {/* Resizer — only visible when selected */}
      <NodeResizer
        minWidth={160}
        minHeight={100}
        isVisible={!!selected}
        lineStyle={{ borderColor: color, borderWidth: 2, borderStyle: 'dashed', borderRadius: 16 }}
        handleStyle={{ width: 12, height: 12, background: color, borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
      />

      {/* Container */}
      <div
        style={{
          width: '100%',
          height: '100%',
          minWidth: 0,
          border: `2px dashed ${selected ? color : `${color}40`}`,
          borderRadius: 16,
          background: `${color}06`,
          position: 'relative',
          boxSizing: 'border-box',
          boxShadow: selected ? `0 0 0 2px ${color}30, inset 0 0 30px ${color}08` : 'none',
          transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
        }}
      >
        {/* Label at top-left */}
        <div
          style={{ position: 'absolute', top: 10, left: 14 }}
          onDoubleClick={startEdit}
        >
          {editing ? (
            <input
              ref={inputRef}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') commitEdit(); }}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                fontSize: 11,
                fontWeight: 600,
                color,
                background: 'hsl(var(--card))',
                border: 'none',
                borderRadius: 6,
                outline: 'none',
                width: 120,
                minWidth: 60,
                maxWidth: 150,
                padding: '4px 8px',
                boxSizing: 'border-box',
                boxShadow: '0 2px 8px hsl(var(--foreground) / 0.1)',
              }}
            />
          ) : (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                cursor: 'text',
                userSelect: 'none',
                padding: '4px 8px',
                background: 'hsl(var(--card))',
                borderRadius: 6,
                boxShadow: '0 2px 6px hsl(var(--foreground) / 0.08)',
              }}
            >
              {label}
            </span>
          )}
        </div>

        {/* Invisible handles so groups can be connected */}
        <Handle type="target" position={Position.Left}   style={{ opacity: 0, width: 8, height: 8 }} />
        <Handle type="source" position={Position.Right}  style={{ opacity: 0, width: 8, height: 8 }} />
        <Handle type="target" position={Position.Top}    style={{ opacity: 0, width: 8, height: 8 }} />
        <Handle type="source" position={Position.Bottom} style={{ opacity: 0, width: 8, height: 8 }} />
      </div>
    </>
  );
}

export const GroupNode = memo(GroupNodeComponent);
