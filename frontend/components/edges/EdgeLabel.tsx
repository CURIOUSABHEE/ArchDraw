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

  // Display text: use label if non-empty, otherwise fall back to type id
  const displayText = label?.trim() ? label.trim() : cfg.id;

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
  const inputWidth = Math.max(80, Math.min(220, draft.length * 8 + 32));

  return (
    <AnimatePresence mode="wait">
      {editing ? (
        <motion.div
          key="edit"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ duration: 0.12, ease: 'easeOut' }}
          style={{ display: 'inline-flex', alignItems: 'center' }}
        >
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={commit}
            placeholder={cfg.id}
            style={{
              width: inputWidth,
              background: '#0d0f1a',
              border: `1.5px solid ${cfg.color}`,
              borderRadius: 999,
              color: cfg.color,
              fontSize: 11,
              fontWeight: 600,
              fontFamily: 'system-ui, sans-serif',
              padding: '2px 10px',
              outline: 'none',
              textAlign: 'center',
              caretColor: cfg.color,
              boxShadow: `0 0 0 3px ${cfg.color}22`,
              transition: 'width 0.1s ease',
              letterSpacing: '0.03em',
            }}
          />
        </motion.div>
      ) : (
        <motion.span
          key="read"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ duration: 0.12, ease: 'easeOut' }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            enterEdit();
          }}
          title="Double-click to edit label"
          style={{
            display: 'inline-block',
            background: cfg.badgeColor,
            color: cfg.color,
            border: `1px solid ${cfg.color}44`,
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 600,
            fontFamily: 'system-ui, sans-serif',
            padding: '2px 8px',
            letterSpacing: '0.04em',
            cursor: 'text',
            userSelect: 'none',
            whiteSpace: 'nowrap',
            transition: 'opacity 0.1s',
            opacity: 1,
            // Dark halo masks the edge line behind the label
            boxShadow: '0 0 0 3px #0d0f1a',
          }}
        >
          {displayText}
        </motion.span>
      )}
    </AnimatePresence>
  );
}
