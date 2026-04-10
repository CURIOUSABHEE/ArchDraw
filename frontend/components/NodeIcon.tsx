'use client';

import {
  Server, Zap, Boxes, Box, CircleDot, Sprout,
  HardDrive, Disc, FolderOpen, Archive,
  Database, Layers, Gauge, Sparkles, BarChart2, FileText,
  Webhook, RadioTower, Globe, Network, Scale, Shuffle,
  MessageSquare, Bell, Radio, Activity,
  Users, KeyRound, Lock, ShieldAlert, Shield,
  LayoutDashboard, GitBranch, ScrollText,
  GitPullRequest, Hammer, Package, Settings,
  Leaf, Bug, Flame, Triangle, Droplets, Code2,
  ShieldCheck, UserCheck, Search, AlertTriangle,
  Brain, Cpu, Link, Bot,
  Train, Cloud, Plane,
  Monitor, Timer, AppWindow, Key,
  GitMerge, Mail, CreditCard, Smartphone, Map, Plug,
  LucideIcon,
} from 'lucide-react';
import { iconRegistry } from '@/lib/iconRegistry';
import { AWSIcon, getAWSIcon } from './icons/AWSIcon';

const LUCIDE_MAP: Record<string, LucideIcon> = {
  Server, Zap, Boxes, Box, CircleDot, Sprout,
  HardDrive, Disc, FolderOpen, Archive,
  Database, Layers, Gauge, Sparkles, BarChart2, FileText,
  Webhook, RadioTower, Globe, Network, Scale, Shuffle,
  MessageSquare, Bell, Radio, Activity,
  Users, KeyRound, Lock, ShieldAlert, Shield,
  LayoutDashboard, GitBranch, ScrollText,
  GitPullRequest, Hammer, Package, Settings,
  Leaf, Bug, Flame, Triangle, Droplets, Code2,
  ShieldCheck, UserCheck, Search, AlertTriangle,
  Brain, Cpu, Link, Bot,
  Train, Cloud, Plane,
  Monitor, Timer, AppWindow, Key,
  GitMerge, Mail, CreditCard, Smartphone, Map, Plug,
};

interface NodeIconProps {
  technology?: string;
  fallbackIcon?: string;
  fallbackColor?: string;
  size?: number;
}

export function NodeIcon({ technology, fallbackIcon, fallbackColor, size = 18 }: NodeIconProps) {
  const entry = technology ? iconRegistry[technology] : undefined;
  const iconName = entry?.icon ?? fallbackIcon ?? 'Server';
  const color = entry?.color ?? fallbackColor ?? '#6366f1';
  
  if (entry?.kind === 'aws') {
    const awsIcon = getAWSIcon(entry.icon);
    if (awsIcon) {
      return <AWSIcon iconId={entry.icon} size={size} color={color} />;
    }
  }
  
  const Icon = LUCIDE_MAP[iconName] ?? Server;
  return <Icon size={size} style={{ color }} strokeWidth={2} />;
}

export function resolveNodeColor(technology?: string, fallbackColor?: string): string {
  if (technology && iconRegistry[technology]) return iconRegistry[technology].color;
  return fallbackColor ?? '#6366f1';
}

export function getNodeIcon(technology?: string): { icon: LucideIcon | typeof AWSIcon; kind: 'lucide' | 'aws'; color: string } | null {
  if (!technology) return null;
  
  const entry = iconRegistry[technology];
  if (!entry) return null;
  
  return {
    icon: entry.kind === 'aws' ? AWSIcon : (LUCIDE_MAP[entry.icon] ?? Server),
    kind: entry.kind,
    color: entry.color,
  };
}
