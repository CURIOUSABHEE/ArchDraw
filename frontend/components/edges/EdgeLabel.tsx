'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EDGE_TYPE_CONFIGS, EdgeType } from '@/data/edgeTypes';
import { useDiagramStore } from '@/store/diagramStore';

interface EdgeLabelProps {
  edgeId: string;
  edgeType: EdgeType;
  label?: string;       // current stored label (may be undefined)
  labelX: number;       // from getBezierPath / getSmoothStepPath
  labelY: number;
}

export function EdgeLabel({ edgeId, edgeType, label, labelX, labelY }: EdgeLabelProps) {
  const cfg = EDGE_TYPE_CONFIGS[edgeType];
  const updateEdgeLabel = useDiagramStore((s) => s.updateEdgeLabel);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Display text: only show if user has set a custom label
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

  // Auto-focus input when edit mode opens
  useEffect(() => {
    if (editing) {
      // Small delay so AnimatePresence has mounted the input before we focus
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
    // Prevent React Flow from intercepting Delete/Backspace while typing
    e.stopPropagation();
  };

  // Estimate input width from draft length so the box doesn't feel too wide or narrow
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
            background: '#1e293b',
            border: '1px solid #475569',
            borderRadius: 9999,
            color: '#f1f5f9',
            fontSize: 10,
            fontFamily: 'system-ui, sans-serif',
            padding: '2px 8px',
            outline: 'none',
            textAlign: 'center',
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
            background: '#1e293b',
            color: '#94a3b8',
            borderRadius: 9999,
            fontSize: 10,
            fontFamily: 'system-ui, sans-serif',
            padding: '1px 6px',
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
