import { useState } from 'react';
import { EDGE_TYPE_CONFIGS } from '@/data/edgeTypes';

export function EdgeLegend() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{
      position: 'absolute',
      bottom: 80,   // above the React Flow zoom controls
      left: 12,
      zIndex: 10,
      fontFamily: 'system-ui, sans-serif',
    }}>
      {open && (
        <div style={{
          background: '#111827',
          border: '1px solid #1f2937',
          borderRadius: 10,
          padding: '10px 12px',
          marginBottom: 6,
          width: 210,
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        }}>
          <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
            Edge types
          </div>
          {Object.values(EDGE_TYPE_CONFIGS).map((cfg) => (
            <div key={cfg.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <svg width="28" height="10" viewBox="0 0 28 10">
                <defs>
                  <marker id={`leg-${cfg.id}`} markerWidth="5" markerHeight="5" refX="4" refY="2" orient="auto">
                    <path d="M0,0 L0,4 L5,2 z" fill={cfg.color} />
                  </marker>
                </defs>
                <line x1="2" y1="5" x2="22" y2="5"
                  stroke={cfg.color}
                  strokeWidth={Math.min(cfg.strokeWidth, 2)}
                  strokeDasharray={cfg.strokeDasharray || undefined}
                  markerEnd={`url(#leg-${cfg.id})`}
                />
              </svg>
              <span style={{ fontSize: 11, color: '#e5e7eb' }}>{cfg.label}</span>
              <span style={{ fontSize: 10, color: '#4b5563', marginLeft: 'auto' }}>
                press E
              </span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid #1f2937', marginTop: 8, paddingTop: 6, fontSize: 10, color: '#6b7280' }}>
            Right-click any edge to change type
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          background: '#111827',
          border: '1px solid #1f2937',
          borderRadius: 6,
          padding: '5px 10px',
          fontSize: 11,
          color: '#9ca3af',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', display: 'inline-block' }} />
        Edge types {open ? '▴' : '▾'}
      </button>
    </div>
  );
}
