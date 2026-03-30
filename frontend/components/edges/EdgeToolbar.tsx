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
        className="flex items-center gap-1 rounded-full border border-border bg-card px-2 py-1 shadow-lg"
        style={{
          position: 'absolute',
          transform: `translate(-50%, -100%) translate(${labelX}px, ${labelY - 24}px)`,
          pointerEvents: 'all',
          zIndex: 20,
        }}
      >
        {/* Edge Type Selector */}
        <div className="relative">
          <button
            onClick={() => { setShowTypeMenu(!showTypeMenu); setShowPathMenu(false); }}
            title="Change edge type"
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase cursor-pointer"
            style={{
              background: `${activeConfig.color}20`,
              border: `1px solid ${activeConfig.color}20`,
              color: activeConfig.color,
            }}
          >
            {activeConfig.label}
            <ChevronDown className="w-3 h-3" />
          </button>
          
          {showTypeMenu && (
            <div
              ref={typeMenuRef}
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 min-w-[100px] rounded-lg border border-border bg-card p-1 shadow-lg"
            >
              {EDGE_TYPES.map((type) => {
                const cfg = EDGE_TYPE_CONFIGS[type];
                const isActive = type === currentEdgeType;
                return (
                  <button
                    key={type}
                    onClick={() => handleEdgeTypeChange(type)}
                    className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors ${
                      isActive ? '' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    }`}
                    style={isActive ? { background: `${cfg.color}20`, color: cfg.color } : {}}
                  >
                    <span 
                      className="w-4 h-0.5 rounded"
                      style={{ background: cfg.color, opacity: cfg.animated ? 0.6 : 1 }}
                    />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Path Type Selector */}
        <div className="relative">
          <button
            onClick={() => { setShowPathMenu(!showPathMenu); setShowTypeMenu(false); }}
            title="Change path type"
            className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-medium capitalize cursor-pointer text-muted-foreground hover:text-foreground"
            style={{ background: 'transparent' }}
          >
            <Spline className="w-3 h-3" />
            {activePathType}
          </button>
          
          {showPathMenu && (
            <div
              ref={pathMenuRef}
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 min-w-[90px] rounded-lg border border-border bg-card p-1 shadow-lg"
            >
              {PATH_TYPES.map((type) => {
                const isActive = type === activePathType;
                return (
                  <button
                    key={type}
                    onClick={() => handlePathTypeChange(type)}
                    className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs capitalize transition-colors ${
                      isActive ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="mx-1 h-4 w-px bg-border" />

        {isEditing ? (
          <>
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveLabel();
                if (e.key === 'Escape') handleCancelEdit();
              }}
              className="w-20 rounded border border-border bg-background px-1.5 py-0.5 text-xs text-foreground"
              placeholder="Label..."
            />
            <button onClick={handleSaveLabel} className="text-emerald-500 hover:text-emerald-400">
              <Check className="w-3 h-3" />
            </button>
            <button onClick={handleCancelEdit} className="text-muted-foreground hover:text-foreground">
              <X className="w-3 h-3" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setIsEditing(true)}
              className="text-muted-foreground hover:text-foreground"
              title="Edit label"
            >
              <Edit3 className="w-3 h-3" />
            </button>
            <span className="max-w-[100px] truncate text-[10px] text-muted-foreground">
              {currentLabel || 'Add label'}
            </span>
          </>
        )}

        <button
          onClick={handleDelete}
          className="text-muted-foreground hover:text-destructive"
          title="Delete edge"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </EdgeLabelRenderer>
  );
}
