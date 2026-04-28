'use client';

import { Handle, NodeProps, Position } from 'reactflow';
import { useDiagramStore } from '@/store/diagramStore';

export default function CustomNode({ id, data, selected }: NodeProps) {
  const setSelectedNodeId = useDiagramStore((s) => s.setSelectedNodeId);
  const label = data.label ?? '';
  
  const onClick = () => {
    setSelectedNodeId(id);
  };
  
  return (
    <div 
      onClick={onClick}
      style={{
        position: 'relative',
        cursor: 'pointer',
      }}
    >
      <Handle type="target" position={Position.Left} id="target-left" style={{ width: 10, height: 10, background: '#fff', border: '2px solid #94a3b8', borderRadius: '50%' }} />
      <Handle type="source" position={Position.Right} id="source-right" style={{ width: 10, height: 10, background: '#fff', border: '2px solid #94a3b8', borderRadius: '50%' }} />
      <Handle type="target" position={Position.Top} id="target-top" style={{ width: 10, height: 10, background: '#fff', border: '2px solid #94a3b8', borderRadius: '50%' }} />
      <Handle type="source" position={Position.Bottom} id="source-bottom" style={{ width: 10, height: 10, background: '#fff', border: '2px solid #94a3b8', borderRadius: '50%' }} />

      <div
        style={{
          background: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 500,
          color: '#1a1a1a',
          whiteSpace: 'nowrap',
          border: selected ? '2px solid #94a3b8' : '1px solid #e5e7eb',
          minWidth: 60,
        }}
      >
        {label}
      </div>
    </div>
  );
}
