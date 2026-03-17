'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export interface TextLabelNodeData {
  text: string;
  fontSize?: 'small' | 'medium' | 'large';
  color?: string;
}

const FONT_SIZE_MAP = { small: 12, medium: 16, large: 22 };

function TextLabelNodeComponent({ data }: NodeProps<TextLabelNodeData>) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(data.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fontSize = FONT_SIZE_MAP[data.fontSize ?? 'medium'];
  const color = data.color ?? 'hsl(var(--foreground))';

  const startEdit = useCallback(() => {
    setEditing(true);
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    }, 0);
  }, []);

  const commitEdit = useCallback(() => {
    setEditing(false);
    data.text = text;
  }, [data, text]);

  // Auto-resize textarea
  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text, editing]);

  // Invisible handles — allow connections but don't show dots
  const handleStyle = { opacity: 0, width: 6, height: 6, pointerEvents: 'none' as const };

  return (
    <div
      style={{ position: 'relative', minWidth: 60 }}
      onDoubleClick={startEdit}
    >
      <Handle type="target" position={Position.Left}   style={handleStyle} />
      <Handle type="source" position={Position.Right}  style={handleStyle} />
      <Handle type="target" position={Position.Top}    style={handleStyle} />
      <Handle type="source" position={Position.Bottom} style={handleStyle} />

      {editing ? (
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Escape') commitEdit();
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitEdit(); }
          }}
          style={{
            fontSize,
            color,
            background: 'transparent',
            border: 'none',
            outline: '1px dashed hsl(var(--border))',
            borderRadius: 4,
            resize: 'none',
            padding: '2px 4px',
            fontFamily: 'inherit',
            fontWeight: 500,
            lineHeight: 1.4,
            minWidth: 60,
            width: '100%',
          }}
          rows={1}
        />
      ) : (
        <span
          style={{
            fontSize,
            color,
            fontWeight: 500,
            lineHeight: 1.4,
            whiteSpace: 'pre-wrap',
            cursor: 'default',
            display: 'block',
            padding: '2px 4px',
            userSelect: 'none',
          }}
        >
          {text || <span style={{ opacity: 0.3 }}>Double-click to edit</span>}
        </span>
      )}
    </div>
  );
}

export const TextLabelNode = memo(TextLabelNodeComponent);
