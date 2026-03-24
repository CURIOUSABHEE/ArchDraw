import { useState, useRef, useEffect } from 'react';
import { EdgeLabelRenderer } from 'reactflow';
import { EDGE_TYPE_CONFIGS, EdgeType } from '@/data/edgeTypes';
import { useDiagramStore } from '@/store/diagramStore';
import { Trash2, Edit3, Check, X } from 'lucide-react';

interface Props {
  edgeId: string;
  currentType: EdgeType;
  currentLabel?: string;
  labelX: number;
  labelY: number;
}

export function EdgeToolbar({ edgeId, currentType, currentLabel, labelX, labelY }: Props) {
  const updateEdgeType = useDiagramStore((s) => s.updateEdgeType);
  const updateEdgeData = useDiagramStore((s) => s.updateEdgeData);
  const deleteEdge = useDiagramStore((s) => s.deleteEdge);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(currentLabel || '');
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);
  
  useEffect(() => {
    setEditValue(currentLabel || '');
  }, [currentLabel]);

  const handleSaveLabel = () => {
    updateEdgeData(edgeId, { label: editValue });
    setIsEditing(false);
  };
  
  const handleCancelEdit = () => {
    setEditValue(currentLabel || '');
    setIsEditing(false);
  };
  
  const handleDelete = () => {
    deleteEdge(edgeId);
  };

  return (
    <EdgeLabelRenderer>
      <div
        style={{
          position: 'absolute',
          transform: `translate(-50%, -100%) translate(${labelX}px, ${labelY - 24}px)`,
          pointerEvents: 'all',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
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
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: isActive ? cfg.color + '33' : 'transparent',
                border: isActive ? `2px solid ${cfg.color}` : '2px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s',
                padding: 0,
              }}
            >
              <div style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: cfg.color,
                opacity: isActive ? 1 : 0.5,
              }} />
            </button>
          );
        })}
        
        <div style={{ width: 1, height: 14, background: '#1f2937', margin: '0 2px' }} />
        
        {isEditing ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveLabel();
                if (e.key === 'Escape') handleCancelEdit();
              }}
              style={{
                width: 80,
                padding: '2px 6px',
                fontSize: 10,
                borderRadius: 4,
                border: '1px solid #3b82f6',
                background: '#1f2937',
                color: '#e5e7eb',
                outline: 'none',
              }}
              placeholder="Label..."
            />
            <button
              onClick={handleSaveLabel}
              style={{
                width: 16,
                height: 16,
                borderRadius: 4,
                background: '#3b82f6',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
            >
              <Check className="w-3 h-3" style={{ color: 'white' }} />
            </button>
            <button
              onClick={handleCancelEdit}
              style={{
                width: 16,
                height: 16,
                borderRadius: 4,
                background: '#374151',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
            >
              <X className="w-3 h-3" style={{ color: '#9ca3af' }} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            title="Edit label"
            style={{
              width: 20,
              height: 20,
              borderRadius: 4,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
            }}
          >
            <Edit3 className="w-3 h-3" style={{ color: '#6b7280' }} />
          </button>
        )}
        
        <button
          onClick={handleDelete}
          title="Delete edge"
          style={{
            width: 20,
            height: 20,
            borderRadius: 4,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
          }}
        >
          <Trash2 className="w-3 h-3" style={{ color: '#ef4444' }} />
        </button>
        
        <span style={{ fontSize: 10, color: '#9ca3af', paddingRight: 2, whiteSpace: 'nowrap' }}>
          {EDGE_TYPE_CONFIGS[currentType].label}
        </span>
      </div>
    </EdgeLabelRenderer>
  );
}
