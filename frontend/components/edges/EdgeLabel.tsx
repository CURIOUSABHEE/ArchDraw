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
}

export function EdgeLabel({ edgeId, label }: EdgeLabelProps) {
  const { isDark } = useCanvasTheme();
  const updateEdgeLabel = useDiagramStore((s) => s.updateEdgeLabel);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Normalize label text (uppercase and max 4 words)
  const getCleanedText = useCallback((txt?: string): string => {
    if (!txt) return '';
    const cleaned = txt.trim().toUpperCase();
    const words = cleaned.split(/\s+/);
    if (words.length > 4) {
      return words.slice(0, 4).join(' ');
    }
    return cleaned;
  }, []);

  const displayText = label?.trim() ? getCleanedText(label) : null;

  const enterEdit = useCallback(() => {
    setDraft(label?.trim() ?? '');
    setEditing(true);
  }, [label]);

  const commit = useCallback(() => {
    const cleaned = getCleanedText(draft);
    updateEdgeLabel(edgeId, cleaned);
    setEditing(false);
  }, [edgeId, draft, updateEdgeLabel, getCleanedText]);

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

  const pillStyle: React.CSSProperties = {
    background: isDark ? '#1e293b' : '#f8f7f4',
    color: isDark ? '#cbd5e1' : '#4B5563',
    borderRadius: 4,
    border: isDark ? '1px solid rgba(203,213,225,0.12)' : 'none',
    fontSize: 8,
    fontFamily: 'Inter, -apple-system, sans-serif',
    fontWeight: 500,
    padding: '2.5px 5px',
    textAlign: 'center',
    outline: 'none',
    boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.4)' : '0 1px 3px rgba(0,0,0,0.05)',
    position: 'relative',
    zIndex: 1000,
    textTransform: 'uppercase',
  };

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
          placeholder="LABEL"
          autoFocus
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
          style={{
            ...pillStyle,
            width: inputWidth,
            cursor: 'text',
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
            ...pillStyle,
            display: 'inline-block',
            cursor: 'text',
            userSelect: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {displayText}
        </motion.span>
      )}
    </AnimatePresence>
  );
}
