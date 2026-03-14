import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import {
  // Client & Entry
  Monitor, Globe, RadioTower, Webhook, Scale, Shuffle,
  // Compute
  Server, Boxes, Zap, Timer, Box,
  // Data Storage
  Database, Leaf, HardDrive, FolderOpen, Search, Building2,
  // Caching
  Layers, AppWindow,
  // Messaging & Events
  MessageSquare, Radio, Activity,
  // Auth & Security
  Shield, KeyRound, Key, ShieldAlert,
  // Observability
  ScrollText, BarChart2, GitBranch, Bell, LayoutDashboard,
  // AI / ML
  Brain, Binary, Network, GitMerge, Bot,
  // External Services
  Mail, CreditCard, Smartphone, Map, Plug,
  // DevOps / Infra
  GitPullRequest, Package, Lock, Settings,
  LucideIcon,
} from 'lucide-react';

/** Map icon name (from components.json) → Lucide component */
const ICON_MAP: Record<string, LucideIcon> = {
  Monitor, Globe, RadioTower, Webhook, Scale, Shuffle,
  Server, Boxes, Zap, Timer, Box,
  Database, Leaf, HardDrive, FolderOpen, Search, Building2,
  Layers, AppWindow,
  MessageSquare, Radio, Activity,
  Shield, KeyRound, Key, ShieldAlert,
  ScrollText, BarChart2, GitBranch, Bell, LayoutDashboard,
  Brain, Binary, Network, GitMerge, Bot,
  Mail, CreditCard, Smartphone, Map, Plug,
  GitPullRequest, Package, Lock, Settings,
};

/** Custom node rendering for infrastructure components — big icon, small label */
function SystemNodeComponent({
  data,
}: NodeProps<{ label: string; category: string; color?: string; icon?: string }>) {
  const Icon = (data.icon && ICON_MAP[data.icon]) ?? Server;
  const accent = data.color ?? '#6366f1';

  return (
    <div
      className="group relative flex flex-col items-center rounded-xl bg-card transition-shadow duration-200"
      style={{
        width: 120,
        boxShadow: 'var(--node-shadow)',
        border: '1px solid rgba(0,0,0,0.07)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--node-shadow-hover)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--node-shadow)';
      }}
    >
      {/* Left = input, Right = output — enforces left-to-right workflow */}
      <Handle type="target" position={Position.Left} className="!bg-muted-foreground/40 !w-2.5 !h-2.5 !border-2 !border-card" />
      <Handle type="source" position={Position.Right} className="!bg-primary/70 !w-2.5 !h-2.5 !border-2 !border-card" />

      {/* Icon area */}
      <div
        className="flex items-center justify-center mt-4 mb-3 rounded-2xl"
        style={{
          width: 56,
          height: 56,
          background: `${accent}18`,
          border: `1.5px solid ${accent}33`,
        }}
      >
        <Icon size={28} style={{ color: accent }} strokeWidth={1.6} />
      </div>

      {/* Label + category */}
      <div className="flex flex-col items-center px-2 pb-3 text-center">
        <span className="text-[11px] font-semibold text-foreground leading-tight">
          {data.label}
        </span>
        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">
          {data.category}
        </span>
      </div>

      {/* Bottom accent bar */}
      <div
        className="h-1 w-full rounded-b-xl transition-opacity duration-200 opacity-40 group-hover:opacity-100"
        style={{ background: accent }}
      />
    </div>
  );
}

export const SystemNode = memo(SystemNodeComponent);
