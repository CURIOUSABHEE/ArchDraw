'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDiagramStore } from '@/store/diagramStore';
import { useCanvasTheme } from '@/lib/theme';

interface EdgeLabelProps {
  edgeId: string;
  label?: string;
  labelX: number;
  labelY: number;
  edgeColor?: string;
}

function parseColorToRgb(color: string): { r: number; g: number; b: number } | null {
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return { r, g, b };
    }
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return { r, g, b };
    }
  }

  if (color.startsWith('rgb(')) {
    const values = color.slice(4, -1).split(',').map((v) => v.trim());
    if (values.length === 3) {
      return { r: Number(values[0]), g: Number(values[1]), b: Number(values[2]) };
    }
  }

  if (color.startsWith('rgba(')) {
    const values = color.slice(5, -1).split(',').map((v) => v.trim());
    if (values.length >= 3) {
      return { r: Number(values[0]), g: Number(values[1]), b: Number(values[2]) };
    }
  }

  return null;
}

function getReadableTextColor(bgColor: string): string {
  const rgb = parseColorToRgb(bgColor);
  if (!rgb) return '#ffffff';
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.6 ? '#111827' : '#ffffff';
}

function blendWithBase(color: string, base: string, baseWeight: number): string {
  const rgb = parseColorToRgb(color);
  const baseRgb = parseColorToRgb(base);
  if (!rgb || !baseRgb) return color;

  const w = Math.max(0, Math.min(1, baseWeight));
  const r = Math.round(rgb.r * (1 - w) + baseRgb.r * w);
  const g = Math.round(rgb.g * (1 - w) + baseRgb.g * w);
  const b = Math.round(rgb.b * (1 - w) + baseRgb.b * w);

  return `rgb(${r}, ${g}, ${b})`;
}

export function EdgeLabel({ edgeId, label, labelX, labelY, edgeColor }: EdgeLabelProps) {
  const updateEdgeLabel = useDiagramStore((s) => s.updateEdgeLabel);
  const { isDark } = useCanvasTheme();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const displayText = label?.trim() ? label.trim() : null;

  const enterEdit = useCallback(() => {
    setDraft(label?.trim() ?? '');
    setEditing(true);
  }, [label]);

  const commit = useCallback(() => {
    updateEdgeLabel(edgeId, draft);
    setEditing(false);
  }, [edgeId, draft, updateEdgeLabel]);

  const cancel = useCallback(() => {
    setEditing(false);
  }, []);

  useEffect(() => {
    if (editing) {
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [editing]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
    }
    e.stopPropagation();
  };

  const inputWidth = Math.max(80, Math.min(150, draft.length * 6 + 32));

  const styles = isDark 
    ? {
        bg: '#374151',
        border: '#4B5563',
        text: '#E5E7EB',
        placeholder: '#9CA3AF',
      }
    : {
        bg: '#F3F4F6',
        border: '#E5E7EB',
        text: '#374151',
        placeholder: '#9CA3AF',
      };

  const softenedColor = edgeColor
    ? blendWithBase(edgeColor, isDark ? '#111827' : '#ffffff', isDark ? 0.55 : 0.72)
    : undefined;
  const labelBg = softenedColor || styles.bg;
  const labelBorder = softenedColor || styles.border;
  const labelText = edgeColor ? blendWithBase(edgeColor, isDark ? '#cbd5e1' : '#334155', 0.2) : styles.text;

  if (!displayText && !editing) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {editing ? (
        <motion.input
          key="edit"
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commit}
          placeholder="Label"
          autoFocus
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
          style={{
            width: inputWidth,
            background: labelBg,
            border: `1px solid ${labelBorder}`,
            borderRadius: 4,
            color: labelText,
            fontSize: 10,
            fontFamily: 'Inter, -apple-system, sans-serif',
            padding: '2px 6px',
            outline: 'none',
            textAlign: 'center',
            boxShadow: isDark 
              ? '0 1px 3px rgba(0,0,0,0.3)' 
              : '0 1px 3px rgba(0,0,0,0.1)',
          }}
        />
      ) : (
        <motion.span
          key="read"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            enterEdit();
          }}
          title="Double-click to edit"
          style={{
            display: 'inline-block',
            background: labelBg,
            color: labelText,
            borderRadius: 4,
            border: `1px solid ${labelBorder}`,
            fontSize: 10,
            fontFamily: 'Inter, -apple-system, sans-serif',
            fontWeight: 500,
            padding: '2px 6px',
            cursor: 'text',
            userSelect: 'none',
            whiteSpace: 'nowrap',
            boxShadow: isDark 
              ? '0 1px 3px rgba(0,0,0,0.3)' 
              : '0 1px 2px rgba(0,0,0,0.08)',
          }}
        >
          {displayText}
        </motion.span>
      )}
    </AnimatePresence>
  );
}
