import React, { useEffect, useRef } from 'react';
import { EDGE_TYPE_CONFIGS, EdgeType } from '@/data/edgeTypes';
import { useDiagramStore } from '@/store/diagramStore';

interface Props {
  edgeId: string;
  currentType: EdgeType;
  position: { x: number; y: number };
  onClose: () => void;
}

export function EdgeContextMenu({ edgeId, currentType, position, onClose }: Props) {
  const updateEdgeType = useDiagramStore((s) => s.updateEdgeType);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  const MENU_W = 240;
  const MENU_H = 300;
  const left = Math.min(position.x, window.innerWidth - MENU_W - 8);
  const top  = Math.min(position.y, window.innerHeight - MENU_H - 8);

  const handleSelect = (type: EdgeType) => {
    updateEdgeType(edgeId, type);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top,
        left,
        width: MENU_W,
        background: '#111827',
        border: '1px solid #1f2937',
        borderRadius: 10,
        padding: '6px 4px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        zIndex: 99999,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ padding: '4px 10px 8px', fontSize: 10, color: '#6b7280', letterSpacing: '0.06em', fontWeight: 600, textTransform: 'uppercase' }}>
        Connection type
      </div>
      {(Object.values(EDGE_TYPE_CONFIGS)).map((cfg) => {
        const isActive = cfg.id === currentType;
        return (
          <button
            key={cfg.id}
            onClick={() => handleSelect(cfg.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              padding: '8px 10px',
              background: isActive ? '#1a1d2e' : 'transparent',
              border: 'none',
              borderRadius: 7,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            {/* Color swatch + mini edge preview */}
            <svg width="36" height="14" viewBox="0 0 36 14" style={{ flexShrink: 0 }}>
              <defs>
                <marker id={`cm-${cfg.id}`} markerWidth="6" markerHeight="6" refX="5" refY="2" orient="auto">
                  <path d="M0,0 L0,4 L5,2 z" fill={cfg.color} />
                </marker>
              </defs>
              <line
                x1="2" y1="7" x2="30" y2="7"
                stroke={cfg.color}
                strokeWidth={cfg.strokeWidth > 2 ? 2 : cfg.strokeWidth}
                strokeDasharray={cfg.strokeDasharray || undefined}
                markerEnd={`url(#cm-${cfg.id})`}
              />
            </svg>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#e5e7eb', lineHeight: 1.3 }}>
                {cfg.label}
                {isActive && (
                  <span style={{ marginLeft: 6, fontSize: 10, color: cfg.color }}>✓</span>
                )}
              </div>
              <div style={{ fontSize: 10, color: '#6b7280', marginTop: 1, lineHeight: 1.4 }}>
                {cfg.description}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
