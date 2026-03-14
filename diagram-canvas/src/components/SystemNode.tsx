import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

/** Custom node rendering for infrastructure components */
function SystemNodeComponent({ data }: NodeProps<{ label: string; category: string }>) {
  return (
    <div
      className="group relative min-w-[160px] rounded-xl bg-card p-0 transition-shadow duration-200"
      style={{
        boxShadow: 'var(--node-shadow)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--node-shadow-hover)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--node-shadow)';
      }}
    >
      {/* Connection handles on all four sides */}
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground/40 !w-2 !h-2 !border-none" />
      <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground/40 !w-2 !h-2 !border-none" />
      <Handle type="target" position={Position.Left} className="!bg-muted-foreground/40 !w-2 !h-2 !border-none" />
      <Handle type="source" position={Position.Right} className="!bg-muted-foreground/40 !w-2 !h-2 !border-none" />

      <div className="flex flex-col p-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {data.category}
        </span>
        <span className="text-sm font-semibold text-foreground mt-0.5">
          {data.label}
        </span>
      </div>

      {/* Bottom accent bar */}
      <div className="h-1 w-full rounded-b-xl bg-muted group-hover:bg-primary transition-colors duration-200" />
    </div>
  );
}

export const SystemNode = memo(SystemNodeComponent);
