'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Handle, Position, NodeProps, useReactFlow, useViewport } from 'reactflow';

export interface TextLabelNodeData {
  text: string;
  fontSize?: 'small' | 'medium' | 'large' | 'heading';
  bold?: boolean;
  color?: string;
}

export type TextSize = 'small' | 'medium' | 'large' | 'heading';

const FONT_SIZE_MAP: Record<TextSize, number> = {
  small: 24,
  medium: 32,
  large: 48,
  heading: 72,
};

const FONT_WEIGHT_MAP: Record<TextSize, number> = {
  small: 400,
  medium: 500,
  large: 600,
  heading: 700,
};

interface SizeButtonProps {
  size: TextSize;
  currentSize: TextSize;
  onClick: () => void;
}

function SizeButton({ size, currentSize, onClick }: SizeButtonProps) {
  const labels = { small: 'S', medium: 'M', large: 'L', heading: 'H' };
  const isActive = currentSize === size;
  
  return (
    <button
      onClick={onClick}
      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
      className={`w-8 h-8 shrink-0 flex items-center justify-center rounded text-xs font-bold select-none ${
        isActive 
          ? 'bg-primary text-primary-foreground shadow-sm' 
          : 'bg-transparent text-muted-foreground hover:bg-muted'
      }`}
      style={{ WebkitTapHighlightColor: 'transparent' }}
      title={size.charAt(0).toUpperCase() + size.slice(1)}
    >
      {labels[size]}
    </button>
  );
}

function TextLabelNodeComponent({ id, data }: NodeProps<TextLabelNodeData>) {
  const { setNodes } = useReactFlow();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(data.text);
  const [currentSize, setCurrentSize] = useState<TextSize>(data.fontSize ?? 'medium');
  const [isBold, setIsBold] = useState(data.bold ?? false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  
  const fontSize = FONT_SIZE_MAP[currentSize];
  const fontWeight = isBold ? 700 : FONT_WEIGHT_MAP[currentSize];
  const color = data.color ?? 'hsl(var(--foreground))';

  const SIZE_ORDER: TextSize[] = ['small', 'medium', 'large', 'heading'];
  
  const updateNodeFontSize = useCallback((size: TextSize) => {
    setNodes((nds) => nds.map((n) => 
      n.id === id ? { ...n, data: { ...n.data, fontSize: size } } : n
    ));
  }, [id, setNodes]);
  
  const updateNodeBold = useCallback((bold: boolean) => {
    setNodes((nds) => nds.map((n) => 
      n.id === id ? { ...n, data: { ...n.data, bold } } : n
    ));
  }, [id, setNodes]);
  
  const increaseSize = useCallback(() => {
    const idx = SIZE_ORDER.indexOf(currentSize);
    if (idx < SIZE_ORDER.length - 1) {
      updateNodeFontSize(SIZE_ORDER[idx + 1]);
    }
  }, [currentSize, updateNodeFontSize]);
  
  const decreaseSize = useCallback(() => {
    const idx = SIZE_ORDER.indexOf(currentSize);
    if (idx > 0) {
      updateNodeFontSize(SIZE_ORDER[idx - 1]);
    }
  }, [currentSize, updateNodeFontSize]);

  const startEdit = useCallback(() => {
    setEditing(true);
    setCurrentSize(data.fontSize ?? 'medium');
    setIsBold(data.bold ?? false);
    setText(data.text);
    setMounted(true);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  }, [data.fontSize, data.bold, data.text]);

  const commitEdit = useCallback(() => {
    setEditing(false);
    setMounted(false);
    setNodes((nds) => nds.map((n) => 
      n.id === id ? { ...n, data: { ...n.data, text, fontSize: currentSize, bold: isBold } } : n
    ));
  }, [id, text, currentSize, isBold, setNodes]);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text, editing, fontSize]);

  useEffect(() => {
    if (!editing) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      
      if (isMod && e.key === 'b') {
        e.preventDefault();
        const newBold = !isBold;
        setIsBold(newBold);
        updateNodeBold(newBold);
        return;
      }
      
      if (isMod && e.shiftKey && (e.key === '.' || e.key === '>')) {
        e.preventDefault();
        increaseSize();
        return;
      }
      
      if (isMod && e.shiftKey && (e.key === ',' || e.key === '<')) {
        e.preventDefault();
        decreaseSize();
        return;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editing, increaseSize, decreaseSize, isBold, updateNodeBold]);

  useEffect(() => {
    if (!editing) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (containerRef.current && !containerRef.current.contains(target)) {
        const popup = document.getElementById(`textlabel-popup-${id}`);
        if (popup && !popup.contains(target)) {
          commitEdit();
        }
      }
    };
    
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);
    
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editing, commitEdit, id]);

  useEffect(() => {
    if (editing && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const viewport = document.querySelector('.react-flow__viewport');
      const viewportRect = viewport?.getBoundingClientRect() || { left: 0, top: 0 };
      
      setPopupPosition({
        x: rect.left - viewportRect.left,
        y: rect.bottom - viewportRect.top + 8,
      });
    }
  }, [editing]);

  const handleStyle = { opacity: 0, width: 6, height: 6, pointerEvents: 'none' as const };

  const renderToolbar = () => (
    <div 
      className="flex items-center gap-0.5 bg-card/95 backdrop-blur-sm border border-border rounded-md px-1.5 py-1 shadow-lg"
      style={{ width: 'fit-content', flexShrink: 0 }}
    >
      <button
        onClick={() => {
          const newBold = !isBold;
          setIsBold(newBold);
          updateNodeBold(newBold);
        }}
        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
        className={`w-8 h-8 shrink-0 flex items-center justify-center rounded text-xs font-bold select-none ${
          isBold 
            ? 'bg-primary text-primary-foreground shadow-sm' 
            : 'bg-transparent text-muted-foreground hover:bg-muted'
        }`}
        style={{ WebkitTapHighlightColor: 'transparent' }}
        title="Bold (Cmd+B)"
      >
        B
      </button>
      <div className="w-px h-5 bg-border mx-0.5 shrink-0" />
      {SIZE_ORDER.map((size) => (
        <SizeButton
          key={size}
          size={size}
          currentSize={currentSize}
          onClick={() => {
            setCurrentSize(size);
            updateNodeFontSize(size);
          }}
        />
      ))}
    </div>
  );

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', minWidth: 60 }}
      onDoubleClick={startEdit}
    >
      <Handle type="target" position={Position.Left}   style={handleStyle} />
      <Handle type="source" position={Position.Right}  style={handleStyle} />
      <Handle type="target" position={Position.Top}    style={handleStyle} />
      <Handle type="source" position={Position.Bottom} style={handleStyle} />

      {editing && mounted && typeof document !== 'undefined' && createPortal(
        <div
          id={`textlabel-popup-${id}`}
          className="nodrag nopan"
          style={{
            position: 'absolute',
            left: popupPosition.x,
            top: popupPosition.y,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            pointerEvents: 'all',
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {renderToolbar()}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Escape') commitEdit();
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitEdit(); }
            }}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              fontSize,
              fontWeight,
              color,
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              outline: 'none',
              borderRadius: 4,
              resize: 'none',
              padding: '8px',
              fontFamily: 'inherit',
              lineHeight: 1.3,
              minWidth: 100,
              maxWidth: 300,
            }}
            rows={1}
            placeholder="Type something..."
          />
        </div>,
        document.body
      )}

      <span
        style={{
          fontSize,
          fontWeight,
          color,
          lineHeight: 1.3,
          whiteSpace: 'pre-wrap',
          cursor: 'default',
          display: 'block',
          padding: '4px',
          userSelect: 'none',
        }}
      >
        {text || <span style={{ opacity: 0.4, fontStyle: 'italic' }}>Double-click to edit</span>}
      </span>
    </div>
  );
}

export const TextLabelNode = memo(TextLabelNodeComponent);
