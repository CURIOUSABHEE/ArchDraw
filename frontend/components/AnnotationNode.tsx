'use client';

import { memo, useCallback, useRef, useState } from 'react';
import { Handle, Position, NodeProps, NodeResizer, useReactFlow } from 'reactflow';

export interface AnnotationNodeData {
  title?: string;
  body?: string;
}

function AnnotationNodeComponent({ id, data, selected }: NodeProps<AnnotationNodeData>) {
  const { setNodes } = useReactFlow();
  const [title, setTitle] = useState(data.title ?? '');
  const [body, setBody] = useState(data.body ?? '');
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingBody, setEditingBody] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const commitTitle = useCallback(() => {
    setEditingTitle(false);
    setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, title } } : n));
  }, [id, title, setNodes]);

  const commitBody = useCallback(() => {
    setEditingBody(false);
    setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, body } } : n));
  }, [id, body, setNodes]);

  const handleStyle = { opacity: 0, width: 6, height: 6, pointerEvents: 'none' as const };

  return (
    <>
      <NodeResizer
        minWidth={160}
        minHeight={80}
        isVisible={!!selected}
        lineStyle={{ borderColor: 'hsl(var(--border))', borderWidth: 1 }}
        handleStyle={{ width: 8, height: 8, background: 'hsl(var(--muted-foreground))', borderRadius: 2 }}
      />

      <div
        style={{
          width: '100%',
          height: '100%',
          border: `1px solid hsl(var(--border))`,
          borderRadius: 8,
          background: 'hsl(var(--card))',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          padding: '10px 12px',
          gap: 6,
          boxShadow: selected ? '0 0 0 2px hsl(var(--ring)/0.3)' : undefined,
        }}
      >
        <Handle type="target" position={Position.Left}   style={handleStyle} />
        <Handle type="source" position={Position.Right}  style={handleStyle} />
        <Handle type="target" position={Position.Top}    style={handleStyle} />
        <Handle type="source" position={Position.Bottom} style={handleStyle} />

        {/* Title */}
        {editingTitle ? (
          <input
            ref={titleRef}
            value={title}
            autoFocus
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => e.key === 'Enter' && commitTitle()}
            placeholder="Title..."
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'hsl(var(--foreground))',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              width: '100%',
            }}
          />
        ) : (
          <div
            onDoubleClick={() => { setEditingTitle(true); setTimeout(() => titleRef.current?.focus(), 0); }}
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: title ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
              cursor: 'text',
              userSelect: 'none',
              minHeight: 18,
            }}
          >
            {title || 'Double-click to add title'}
          </div>
        )}

        {/* Divider */}
        <div style={{ height: 1, background: 'hsl(var(--border))', flexShrink: 0 }} />

        {/* Body */}
        {editingBody ? (
          <textarea
            ref={bodyRef}
            value={body}
            autoFocus
            onChange={(e) => setBody(e.target.value)}
            onBlur={commitBody}
            onKeyDown={(e) => e.key === 'Escape' && commitBody()}
            placeholder="Add notes..."
            style={{
              fontSize: 11,
              color: 'hsl(var(--foreground))',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              flex: 1,
              fontFamily: 'inherit',
              lineHeight: 1.5,
              width: '100%',
            }}
          />
        ) : (
          <div
            onDoubleClick={() => { setEditingBody(true); setTimeout(() => bodyRef.current?.focus(), 0); }}
            style={{
              fontSize: 11,
              color: body ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
              cursor: 'text',
              userSelect: 'none',
              flex: 1,
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              minHeight: 40,
            }}
          >
            {body || 'Double-click to add notes...'}
          </div>
        )}
      </div>
    </>
  );
}

export const AnnotationNode = memo(AnnotationNodeComponent);
