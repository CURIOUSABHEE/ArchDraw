import React, { useEffect, useRef } from 'react';
import { useDiagramStore } from '@/store/diagramStore';
import { Trash2, GitBranch, Spline, ChevronRight } from 'lucide-react';
import { EDGE_TYPE_CONFIGS, type EdgeType, type PathType } from '@/data/edgeTypes';

interface Props {
  edgeId: string;
  position: { x: number; y: number };
  onClose: () => void;
  currentEdgeType?: EdgeType;
  currentPathType?: PathType;
}

const EDGE_TYPES: EdgeType[] = ['sync', 'async', 'stream', 'event', 'dep'];
const PATH_TYPES: PathType[] = ['smooth', 'bezier', 'step', 'straight'];

export function EdgeContextMenu({ edgeId, position, onClose, currentEdgeType, currentPathType }: Props) {
  const updateEdgeData = useDiagramStore((s) => s.updateEdgeData);
  const deleteEdge = useDiagramStore((s) => s.deleteEdge);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const [showSubmenu, setShowSubmenu] = React.useState<'type' | 'path' | null>(null);

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

  const MENU_W = 160;
  const MENU_H = 180;
  const left = Math.min(position.x, window.innerWidth - MENU_W - 8);
  const top  = Math.min(position.y, window.innerHeight - MENU_H - 8);

  const handleDelete = () => {
    deleteEdge(edgeId);
    onClose();
  };

  const handleEdgeTypeChange = (type: EdgeType) => {
    updateEdgeData(edgeId, { edgeType: type });
    onClose();
  };

  const handlePathTypeChange = (type: PathType) => {
    updateEdgeData(edgeId, { pathType: type });
    onClose();
  };

  const activeConfig = EDGE_TYPE_CONFIGS[currentEdgeType || 'sync'];
  const activePathType = currentPathType || activeConfig.pathType;

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top,
        left,
        width: MENU_W,
        background: '#111827',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10,
        padding: '6px 4px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        zIndex: 99999,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Change Type Submenu */}
      <div style={{ position: 'relative' }}>
        <button
          onMouseEnter={() => setShowSubmenu('type')}
          onClick={() => setShowSubmenu(showSubmenu === 'type' ? null : 'type')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '8px 12px',
            background: showSubmenu === 'type' ? '#1f2937' : 'transparent',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            color: '#e5e7eb',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <GitBranch size={14} style={{ color: activeConfig.color }} />
            <span style={{ fontSize: 12, fontWeight: 500 }}>Edge Type</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, color: activeConfig.color, fontWeight: 600 }}>{activeConfig.label}</span>
            <ChevronRight size={12} style={{ color: '#6b7280' }} />
          </div>
        </button>
        
        {showSubmenu === 'type' && (
          <div
            style={{
              position: 'absolute',
              left: '100%',
              top: 0,
              marginLeft: 4,
              background: '#111827',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              padding: 4,
              minWidth: 120,
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}
          >
            {EDGE_TYPES.map((type) => {
              const cfg = EDGE_TYPE_CONFIGS[type];
              const isActive = type === currentEdgeType;
              return (
                <button
                  key={type}
                  onClick={() => handleEdgeTypeChange(type)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '8px 10px',
                    background: isActive ? `${cfg.color}20` : 'transparent',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 12,
                    color: isActive ? cfg.color : '#9ca3af',
                  }}
                >
                  <span style={{
                    width: 24,
                    height: 3,
                    background: cfg.color,
                    borderRadius: 2,
                    opacity: cfg.animated ? 0.7 : 1,
                  }} />
                  {cfg.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Change Path Submenu */}
      <div style={{ position: 'relative' }}>
        <button
          onMouseEnter={() => setShowSubmenu('path')}
          onClick={() => setShowSubmenu(showSubmenu === 'path' ? null : 'path')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '8px 12px',
            background: showSubmenu === 'path' ? '#1f2937' : 'transparent',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            color: '#e5e7eb',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Spline size={14} style={{ color: '#6b7280' }} />
            <span style={{ fontSize: 12, fontWeight: 500 }}>Path Shape</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, color: '#6b7280', fontWeight: 500, textTransform: 'capitalize' }}>{activePathType}</span>
            <ChevronRight size={12} style={{ color: '#6b7280' }} />
          </div>
        </button>
        
        {showSubmenu === 'path' && (
          <div
            style={{
              position: 'absolute',
              left: '100%',
              top: 40,
              marginLeft: 4,
              background: '#111827',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              padding: 4,
              minWidth: 100,
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}
          >
            {PATH_TYPES.map((type) => {
              const isActive = type === activePathType;
              return (
                <button
                  key={type}
                  onClick={() => handlePathTypeChange(type)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '8px 10px',
                    background: isActive ? '#374151' : 'transparent',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 12,
                    color: isActive ? '#e5e7eb' : '#9ca3af',
                    textTransform: 'capitalize',
                  }}
                >
                  <svg width="24" height="16" viewBox="0 0 24 16">
                    {type === 'smooth' && (
                      <path d="M 2 14 Q 6 2, 12 8 Q 18 14, 22 2" stroke="#6366f1" strokeWidth="0.1" fill="none" />
                    )}
                    {type === 'bezier' && (
                      <path d="M 2 14 C 8 14, 6 2, 12 8 C 18 14, 16 2, 22 2" stroke="#6366f1" strokeWidth="0.1" fill="none" />
                    )}
                    {type === 'step' && (
                      <path d="M 2 14 L 12 14 L 12 2 L 22 2" stroke="#6366f1" strokeWidth="0.1" fill="none" />
                    )}
                    {type === 'straight' && (
                      <path d="M 2 14 L 22 2" stroke="#6366f1" strokeWidth="0.1" fill="none" />
                    )}
                  </svg>
                  {type}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ height: 1, background: '#1f2937', margin: '6px 0' }} />

      <button
        onClick={handleDelete}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          padding: '8px 12px',
          background: 'transparent',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          textAlign: 'left',
          color: '#ef4444',
        }}
      >
        <Trash2 size={14} />
        <span style={{ fontSize: 12, fontWeight: 500 }}>Delete Edge</span>
      </button>
    </div>
  );
}
