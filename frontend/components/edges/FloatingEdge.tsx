import { useCallback } from 'react';
import { 
  useStore, 
  getSmoothStepPath, 
  EdgeProps,
  ReactFlowState,
  MarkerType,
} from 'reactflow';
import { getEdgeParams } from '@/lib/utils/floatingEdgeUtils';

export default function FloatingEdge({
  id,
  source,
  target,
  markerEnd,
  style,
  label,
  data,
}: EdgeProps) {
  const sourceNode = useStore(
    useCallback((store: ReactFlowState) => store.nodeInternals.get(source), [source])
  );
  const targetNode = useStore(
    useCallback((store: ReactFlowState) => store.nodeInternals.get(target), [target])
  );

  if (!sourceNode || !targetNode) return null;

  const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(
    sourceNode,
    targetNode
  );

  const [edgePath] = getSmoothStepPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sourcePos,
    targetPosition: targetPos,
    targetX: tx,
    targetY: ty,
    borderRadius: 8,
  });

  return (
    <path
      id={id}
      className="react-flow__edge-path"
      d={edgePath}
      markerEnd={markerEnd}
      style={style}
    />
  );
}
