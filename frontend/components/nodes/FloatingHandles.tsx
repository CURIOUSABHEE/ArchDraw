'use client';

import { Handle, Position } from 'reactflow';

const ghost: React.CSSProperties = {
  opacity: 0,
  width: 1,
  height: 1,
  border: 'none',
  background: 'transparent',
  pointerEvents: 'none',
  minWidth: 0,
  minHeight: 0,
};

export function FloatingHandles() {
  return (
    <>
      {/* Left — source and target share id="left" */}
      <Handle type="target" position={Position.Left} id="left" style={{ ...ghost, left: 0, top: '50%', transform: 'translate(-50%, -50%)' }} />
      <Handle type="source" position={Position.Left} id="left" style={{ ...ghost, left: 0, top: '50%', transform: 'translate(-50%, -50%)' }} />

      {/* Right — source and target share id="right" */}
      <Handle type="target" position={Position.Right} id="right" style={{ ...ghost, right: 0, top: '50%', transform: 'translate(50%, -50%)' }} />
      <Handle type="source" position={Position.Right} id="right" style={{ ...ghost, right: 0, top: '50%', transform: 'translate(50%, -50%)' }} />

      {/* Top — source and target share id="top" */}
      <Handle type="target" position={Position.Top} id="top" style={{ ...ghost, top: 0, left: '50%', transform: 'translate(-50%, -50%)' }} />
      <Handle type="source" position={Position.Top} id="top" style={{ ...ghost, top: 0, left: '50%', transform: 'translate(-50%, -50%)' }} />

      {/* Bottom — source and target share id="bottom" */}
      <Handle type="target" position={Position.Bottom} id="bottom" style={{ ...ghost, bottom: 0, left: '50%', transform: 'translate(-50%, 50%)' }} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ ...ghost, bottom: 0, left: '50%', transform: 'translate(-50%, 50%)' }} />

      {/* Generic fallback handles for edges that don't specify a handleId */}
      <Handle type="source" position={Position.Top} style={{ ...ghost, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
      <Handle type="target" position={Position.Top} style={{ ...ghost, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
    </>
  );
}
