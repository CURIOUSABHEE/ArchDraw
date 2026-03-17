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
  const Icon = LUCIDE_MAP[iconName] ?? Server;
  return <Icon size={size} style={{ color }} strokeWidth={1.8} />;
}

export function resolveNodeColor(technology?: string, fallbackColor?: string): string {
  if (technology && iconRegistry[technology]) return iconRegistry[technology].color;
  return fallbackColor ?? '#6366f1';
}
