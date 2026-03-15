'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import {
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
  Cpu,
  LucideIcon,
} from 'lucide-react';
import { useDiagramStore, NodeData } from '@/store/diagramStore';
import { NodeIcon, resolveNodeColor } from '@/components/NodeIcon';

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
  Cpu,
};

/** Shorten long category strings to a single line */
const CATEGORY_SHORT: Record<string, string> = {
  'Client & Entry':    'Entry',
  'Data Storage':      'Storage',
  'Messaging & Events':'Messaging',
  'Auth & Security':   'Security',
  'External Services': 'External',
  'DevOps / Infra':    'DevOps',
};

function SystemNodeComponent({ id, data, selected }: NodeProps<NodeData>) {
  const setSelectedNodeId = useDiagramStore((s) => s.setSelectedNodeId);
  const Icon: LucideIcon = (data.icon ? ICON_MAP[data.icon] : undefined) ?? Server;
  const accent = data.accentColor ?? data.color ?? '#6366f1';
  const hasError = data.hasError;
  const categoryLabel = CATEGORY_SHORT[data.category] ?? data.category;
  // Use brand color from iconRegistry when technology is set
  const resolvedAccent = data.technology ? resolveNodeColor(data.technology, accent) : accent;

  const borderColor = hasError ? '#ef4444' : selected ? resolvedAccent : undefined;

  const glowStyle = selected
    ? { boxShadow: `0 0 0 2px ${resolvedAccent}55, 0 0 0 4px ${resolvedAccent}22, 0 8px 24px -4px ${resolvedAccent}33` }
    : hasError
    ? { boxShadow: '0 0 0 2px #ef444455, 0 4px 12px rgba(239,68,68,0.2)' }
    : {};

  return (
    <div
      className="group relative flex flex-col rounded-xl transition-all duration-200 cursor-pointer"
      style={{
        width: 160,
        borderLeft: `3px solid ${hasError ? '#ef4444' : resolvedAccent}`,
        border: `1px solid ${borderColor ?? 'rgba(0,0,0,0.08)'}`,
        background: `linear-gradient(135deg, ${resolvedAccent}22 0%, hsl(var(--card)) 50%)`,
        ...glowStyle,
      }}
      onClick={() => setSelectedNodeId(id)}
    >
      {/* Handles — fixed size, no transform on hover to avoid offset */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ width: 10, height: 10, background: `${resolvedAccent}99`, border: '2px solid hsl(var(--card))', borderRadius: '50%' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ width: 10, height: 10, background: resolvedAccent, border: '2px solid hsl(var(--card))', borderRadius: '50%' }}
      />

      {/* Content */}
      <div className="flex items-center gap-2.5 px-3 pt-3 pb-2">
        <div
          className="flex items-center justify-center rounded-lg shrink-0"
          style={{
            width: 36,
            height: 36,
            background: `${resolvedAccent}28`,
            border: `1.5px solid ${resolvedAccent}55`,
          }}
        >
          {data.technology ? (
            <NodeIcon technology={data.technology} size={18} />
          ) : (
            <Icon size={18} style={{ color: resolvedAccent }} strokeWidth={1.8} />
          )}
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          {/* Label — wraps to 2 lines max */}
          <span
            className="text-[11px] font-semibold text-foreground leading-tight"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {data.label}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5 whitespace-nowrap">
            {categoryLabel}
          </span>
          {data.tech && (
            <span className="text-[9px] font-mono text-muted-foreground/70 mt-0.5 truncate">
              {data.tech}
            </span>
          )}
        </div>
      </div>

      {hasError && (
        <div className="px-3 pb-2">
          <span className="text-[9px] text-red-500 font-medium">⚠ No connections</span>
        </div>
      )}

      <div
        className="h-0.5 w-full rounded-b-xl transition-opacity duration-200 opacity-30 group-hover:opacity-80"
        style={{ background: resolvedAccent }}
      />
    </div>
  );
}

export const SystemNode = memo(SystemNodeComponent);
