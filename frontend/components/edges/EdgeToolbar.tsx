import { EdgeLabelRenderer } from 'reactflow';
import { EDGE_TYPE_CONFIGS, EdgeType } from '@/data/edgeTypes';
import { useDiagramStore } from '@/store/diagramStore';

interface Props {
  edgeId: string;
  currentType: EdgeType;
  labelX: number;
  labelY: number;
}

export function EdgeToolbar({ edgeId, currentType, labelX, labelY }: Props) {
  const updateEdgeType = useDiagramStore((s) => s.updateEdgeType);

  return (
    <EdgeLabelRenderer>
      <div
        style={{
          position: 'absolute',
          transform: `translate(-50%, -100%) translate(${labelX}px, ${labelY - 18}px)`,
          pointerEvents: 'all',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          background: '#111827',
          border: '1px solid #1f2937',
          borderRadius: 999,
          padding: '4px 6px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
        }}
      >
        {Object.values(EDGE_TYPE_CONFIGS).map((cfg) => {
          const isActive = cfg.id === currentType;
          return (
            <button
              key={cfg.id}
              title={cfg.label}
              onClick={() => updateEdgeType(edgeId, cfg.id)}
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: isActive ? cfg.color + '33' : 'transparent',
                border: isActive ? `2px solid ${cfg.color}` : '2px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s',
              }}
            >
              <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: cfg.color,
                opacity: isActive ? 1 : 0.5,
              }} />
            </button>
          );
        })}
        <div style={{ width: 1, height: 14, background: '#1f2937', margin: '0 2px' }} />
        <span style={{ fontSize: 10, color: '#9ca3af', paddingRight: 4, whiteSpace: 'nowrap' }}>
          {EDGE_TYPE_CONFIGS[currentType].label}
        </span>
      </div>
    </EdgeLabelRenderer>
  );
}
