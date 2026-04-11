'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDiagramStore } from '@/store/diagramStore';

interface EdgeLabelProps {
  edgeId: string;
  label?: string;
  labelX: number;
  labelY: number;
}

export function EdgeLabel({ edgeId, label, labelX, labelY }: EdgeLabelProps) {
  const updateEdgeLabel = useDiagramStore((s) => s.updateEdgeLabel);

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
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: 4,
            color: '#111118',
            fontSize: 10,
            fontFamily: 'Inter, -apple-system, sans-serif',
            padding: '2px 6px',
            outline: 'none',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
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
            background: '#FFFFFF',
            color: '#6B7280',
            borderRadius: 4,
            border: '1px solid #E5E7EB',
            fontSize: 10,
            fontFamily: 'Inter, -apple-system, sans-serif',
            fontWeight: 500,
            padding: '2px 6px',
            cursor: 'text',
            userSelect: 'none',
            whiteSpace: 'nowrap',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          {displayText}
        </motion.span>
      )}
    </AnimatePresence>
  );
}
