'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Handle, Position, NodeProps, NodeResizer, useReactFlow } from 'reactflow';
import type { Node } from 'reactflow';
import { useDiagramStore } from '@/store/diagramStore';
import { FRAME_COLORS } from './nodeDesignTokens';

interface FrameNodeData {
  label?: string;
  frameColor?: 'default' | 'red' | 'blue' | 'amber' | 'green' | 'purple';
}

function FrameNodeComponent({ id, data, selected }: NodeProps<FrameNodeData>) {
  const { setNodes } = useReactFlow();
  const canvasDarkMode = useDiagramStore((s) => s.canvasDarkMode);
  const [label, setLabel] = useState(data.label || 'Group');
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const frameColorKey = data.frameColor || 'default';
  const frameColor = FRAME_COLORS[frameColorKey] || FRAME_COLORS.default;

  useEffect(() => {
    if (data.label) {
      setLabel(data.label);
    }
  }, [data.label]);

  const startEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const commitEdit = useCallback(() => {
    setEditing(false);
    setNodes((nds: Node[]) => nds.map((n: Node) => n.id === id ? { ...n, data: { ...n.data, label } } : n));
  }, [id, label, setNodes]);

  return (
    <>
      <NodeResizer
        minWidth={160}
        minHeight={120}
        isVisible={selected}
        lineStyle={{ 
          borderColor: frameColor, 
          borderWidth: 1.5, 
          borderStyle: 'dashed', 
          borderRadius: 16 
        }}
        handleStyle={{ 
          width: 12, 
          height: 12, 
          background: frameColor, 
          borderRadius: 4, 
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)' 
        }}
      />

      <div
        style={{
          width: '100%',
          height: '100%',
          border: `1.5px dashed ${frameColor}`,
          borderRadius: 16,
          background: 'transparent',
          position: 'relative',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -10,
            left: 16,
            background: canvasDarkMode ? '#1a1a1a' : '#FFFFFF',
            padding: '4px 8px',
            borderRadius: 4,
            zIndex: 10,
          }}
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
                color: frameColor,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                width: 100,
              }}
            />
          ) : (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: frameColor,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              {label}
            </span>
          )}
        </div>

        <Handle type="target" position={Position.Left} style={{ width: 12, height: 12 }} />
        <Handle type="source" position={Position.Right} style={{ width: 12, height: 12 }} />
        <Handle type="target" position={Position.Top} style={{ width: 12, height: 12 }} />
        <Handle type="source" position={Position.Bottom} style={{ width: 12, height: 12 }} />
      </div>
    </>
  );
}

export const FrameNode = memo(FrameNodeComponent);
