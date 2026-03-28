import { useState, useRef, useEffect } from 'react';
import { EdgeLabelRenderer } from 'reactflow';
import { useDiagramStore } from '@/store/diagramStore';
import { Trash2, Edit3, Check, X, ChevronDown, GitBranch, Spline } from 'lucide-react';
import { EDGE_TYPE_CONFIGS, type EdgeType, type PathType } from '@/data/edgeTypes';

interface Props {
  edgeId: string;
  currentLabel?: string;
  currentEdgeType?: EdgeType;
  currentPathType?: PathType;
  labelX: number;
  labelY: number;
}

const EDGE_TYPES: EdgeType[] = ['sync', 'async', 'stream', 'event', 'dep'];
const PATH_TYPES: PathType[] = ['smooth', 'bezier', 'step', 'straight'];

export function EdgeToolbar({ edgeId, currentLabel, currentEdgeType, currentPathType, labelX, labelY }: Props) {
  const updateEdgeData = useDiagramStore((s) => s.updateEdgeData);
  const deleteEdge = useDiagramStore((s) => s.deleteEdge);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(currentLabel || '');
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showPathMenu, setShowPathMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const typeMenuRef = useRef<HTMLDivElement>(null);
  const pathMenuRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);
  
  useEffect(() => {
    setEditValue(currentLabel || '');
  }, [currentLabel]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (typeMenuRef.current && !typeMenuRef.current.contains(e.target as Node)) {
        setShowTypeMenu(false);
      }
      if (pathMenuRef.current && !pathMenuRef.current.contains(e.target as Node)) {
        setShowPathMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);
  
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

  const handleEdgeTypeChange = (type: EdgeType) => {
    updateEdgeData(edgeId, { edgeType: type });
    setShowTypeMenu(false);
  };

  const handlePathTypeChange = (type: PathType) => {
    updateEdgeData(edgeId, { pathType: type });
    setShowPathMenu(false);
  };

  const activeConfig = EDGE_TYPE_CONFIGS[currentEdgeType || 'sync'];
  const activePathType = currentPathType || activeConfig.pathType;

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
          gap: 4,
          background: '#111827',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 999,
          padding: '4px 8px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
        }}
      >
        {/* Edge Type Selector */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowTypeMenu(!showTypeMenu); setShowPathMenu(false); }}
            title="Change edge type"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 6px',
              borderRadius: 4,
              background: `${activeConfig.color}20`,
              border: `1px solid ${activeConfig.color}20`,
              cursor: 'pointer',
              fontSize: 9,
              fontWeight: 600,
              color: activeConfig.color,
              textTransform: 'uppercase',
            }}
          >
            {activeConfig.label}
            <ChevronDown className="w-3 h-3" />
          </button>
          
          {showTypeMenu && (
            <div
              ref={typeMenuRef}
              style={{
                position: 'absolute',
                bottom: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                marginBottom: 6,
                background: '#111827',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                padding: 4,
                minWidth: 100,
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
                      gap: 8,
                      width: '100%',
                      padding: '6px 8px',
                      background: isActive ? `${cfg.color}20` : 'transparent',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 11,
                      color: isActive ? cfg.color : '#9ca3af',
                    }}
                  >
                    <span style={{
                      width: 16,
                      height: 2,
                      background: cfg.color,
                      borderRadius: 1,
                      opacity: cfg.animated ? 0.6 : 1,
                    }} />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Path Type Selector */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowPathMenu(!showPathMenu); setShowTypeMenu(false); }}
            title="Change path type"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              padding: '2px 6px',
              borderRadius: 4,
              background: '#1f2937',
              border: '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer',
              fontSize: 9,
              fontWeight: 500,
              color: '#9ca3af',
              textTransform: 'capitalize',
            }}
          >
            <Spline className="w-3 h-3" />
            {activePathType}
          </button>
          
          {showPathMenu && (
            <div
              ref={pathMenuRef}
              style={{
                position: 'absolute',
                bottom: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                marginBottom: 6,
                background: '#111827',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                padding: 4,
                minWidth: 90,
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
                      gap: 8,
                      width: '100%',
                      padding: '6px 8px',
                      background: isActive ? '#374151' : 'transparent',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 11,
                      color: isActive ? '#e5e7eb' : '#9ca3af',
                      textTransform: 'capitalize',
                    }}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ width: 1, height: 16, background: '#374151', margin: '0 4px' }} />

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
                width: 60,
                padding: '2px 6px',
                fontSize: 10,
                borderRadius: 4,
                border: '1px solid rgba(59,130,246,0.3)',
                background: '#1f2937',
                color: '#e5e7eb',
                outline: 'none',
              }}
              placeholder="Label..."
            />
            <button onClick={handleSaveLabel} style={iconBtnStyle('#3b82f6')}>
              <Check className="w-3 h-3" style={{ color: 'white' }} />
            </button>
            <button onClick={handleCancelEdit} style={iconBtnStyle('#374151')}>
              <X className="w-3 h-3" style={{ color: '#9ca3af' }} />
            </button>
          </div>
        ) : (
          <>
            <button onClick={() => setIsEditing(true)} title="Edit label" style={iconBtnStyle('transparent')}>
              <Edit3 className="w-3.5 h-3.5" style={{ color: '#6b7280' }} />
            </button>
            <button onClick={handleDelete} title="Delete edge" style={iconBtnStyle('transparent')}>
              <Trash2 className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
            </button>
          </>
        )}
      </div>
    </EdgeLabelRenderer>
  );
}

const iconBtnStyle = (bg: string) => ({
  width: 24,
  height: 24,
  borderRadius: 4,
  background: bg,
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
});
