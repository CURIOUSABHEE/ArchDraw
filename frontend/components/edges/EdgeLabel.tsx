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

export function EdgeLabel({ edgeId, label, labelX, labelY }: EdgeLabelProps) {
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
            background: isDark ? '#1F2937' : '#FFFFFF',
            border: `1px solid ${styles.border}`,
            borderRadius: 4,
            color: styles.text,
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
            background: styles.bg,
            color: styles.text,
            borderRadius: 4,
            border: `1px solid ${styles.border}`,
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