'use client';

import { useState } from 'react';
import { Search, ChevronDown, ChevronRight, Server, type LucideIcon } from 'lucide-react';
import {
  Monitor, Globe, RadioTower, Webhook, Scale, Shuffle,
  Boxes, Zap, Timer, Box,
  Database, Leaf, HardDrive, FolderOpen, Building2,
  Layers, AppWindow,
  MessageSquare, Radio, Activity,
  Shield, KeyRound, Key, ShieldAlert,
  ScrollText, BarChart2, GitBranch, Bell, LayoutDashboard,
  Brain, Network, GitMerge, Bot,
  Mail, CreditCard, Smartphone, Map, Plug,
  GitPullRequest, Package, Lock, Settings,
  Cpu,
  UserCheck, Flame, Users, ShieldCheck,
  Wallet, ShoppingCart,
  Phone,
  Sparkles, Wind, Image, Mic, AudioLines,
  Container, AlertTriangle, TrendingUp,
  FileText, BookOpen,
  Flag, Clock,
  Chrome, Github, Twitter, Linkedin,
  Upload, Video,
} from 'lucide-react';
import componentsData from '@/data/components.json';
import { NodeIcon } from '@/components/NodeIcon';
import { iconRegistry } from '@/lib/iconRegistry';
import { useTutorialStore } from '@/store/tutorialStore';

const ICON_MAP: Record<string, LucideIcon> = {
  Monitor, Globe, RadioTower, Webhook, Scale, Shuffle,
  Server, Boxes, Zap, Timer, Box,
  Database, Leaf, HardDrive, FolderOpen, Search, Building2,
  Layers, AppWindow,
  MessageSquare, Radio, Activity,
  Shield, KeyRound, Key, ShieldAlert,
  ScrollText, BarChart2, GitBranch, Bell, LayoutDashboard,
  Brain, Network, GitMerge, Bot,
  Mail, CreditCard, Smartphone, Map, Plug,
  GitPullRequest, Package, Lock, Settings,
  Cpu,
  UserCheck, Flame, Users, ShieldCheck,
  Wallet, ShoppingCart,
  Phone,
  Sparkles, Wind, Image, Mic, AudioLines,
  Container, AlertTriangle, TrendingUp,
  FileText, BookOpen,
  Flag, Clock,
  Chrome, Github, Twitter, Linkedin,
  Upload, Video,
};

interface ComponentEntry {
  id: string;
  label: string;
  category: string;
  color: string;
  icon?: string;
  technology?: string;
}

function makeDragGhost(label: string, color: string) {
  const ghost = document.createElement('div');
  ghost.style.cssText = `position:fixed;top:-100px;left:-100px;background:white;border:1px solid rgba(0,0,0,0.08);border-left:1px solid ${color};border-radius:8px;padding:6px 10px;font-size:11px;font-weight:600;color:#1e293b;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,0.08);pointer-events:none;`;
  ghost.textContent = label;
  return ghost;
}

function getViewportCenter(): { x: number; y: number } {
  try {
    const el = document.querySelector('.react-flow__viewport') as HTMLElement | null;
    const vp = el ? (() => {
      const style = el.style.transform;
      const match = style.match(/translate\(([^,]+)px,\s*([^)]+)px\)\s*scale\(([^)]+)\)/);
      if (!match) return null;
      return { x: parseFloat(match[1]), y: parseFloat(match[2]), zoom: parseFloat(match[3]) };
    })() : null;
    const bounds = document.querySelector('.react-flow__renderer')?.getBoundingClientRect();
    if (!vp || !bounds) return { x: 400 + Math.random() * 40 - 20, y: 300 + Math.random() * 40 - 20 };
    return {
      x: (bounds.width / 2 - vp.x) / vp.zoom + Math.random() * 40 - 20,
      y: (bounds.height / 2 - vp.y) / vp.zoom + Math.random() * 40 - 20,
    };
  } catch {
    return { x: 400 + Math.random() * 40 - 20, y: 300 + Math.random() * 40 - 20 };
  }
}

export function TutorialSidebar() {
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const { nodes, setNodes, setTutorialNodes } = useTutorialStore();

  const handleAdd = (comp: ComponentEntry) => {
    const position = getViewportCenter();
    const id = `${comp.id}-${Date.now()}`;
    const newNode = {
      id,
      type: 'systemNode' as const,
      position,
      data: {
        label: comp.label,
        category: comp.category,
        color: comp.color,
        icon: comp.icon,
        technology: comp.technology,
      },
    };
    const updated = [...nodes, newNode];
    setNodes(updated);
    setTutorialNodes(updated);
  };

  const toggleKey = (key: string) =>
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  const allItems = componentsData as ComponentEntry[];
  const q = search.toLowerCase().trim();
  const filtered = q
    ? allItems.filter(
        (c) =>
          c.label.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          (c.technology && c.technology.toLowerCase().includes(q))
      )
    : null;

  const grouped = filtered
    ? null
    : allItems.reduce<Record<string, ComponentEntry[]>>((acc, c) => {
        (acc[c.category] ??= []).push(c);
        return acc;
      }, {});

  const renderItem = (comp: ComponentEntry) => {
    const FallbackIcon: LucideIcon = (comp.icon ? ICON_MAP[comp.icon] : undefined) ?? Server;
    const displayColor = comp.technology
      ? (iconRegistry[comp.technology]?.color ?? comp.color)
      : comp.color;
    return (
      <button
        key={comp.id}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('application/archdraw', JSON.stringify(comp));
          e.dataTransfer.effectAllowed = 'move';
          const ghost = makeDragGhost(comp.label, displayColor);
          document.body.appendChild(ghost);
          e.dataTransfer.setDragImage(ghost, 0, 0);
          setTimeout(() => document.body.removeChild(ghost), 0);
        }}
        onClick={() => handleAdd(comp)}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-grab active:cursor-grabbing"
        style={{ color: 'rgba(203,213,225,0.9)' }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <div
          className="flex items-center justify-center rounded shrink-0"
          style={{
            width: 22,
            height: 22,
            background: `${displayColor}12`,
            border: `1px solid ${displayColor}25`,
          }}
        >
          {comp.technology ? (
            <NodeIcon technology={comp.technology} size={11} />
          ) : (
            <FallbackIcon size={11} style={{ color: displayColor }} strokeWidth={1.5} />
          )}
        </div>
        <span className="flex-1 text-left leading-tight">{comp.label}</span>
      </button>
    );
  };

  return (
    <aside
      className="w-56 flex flex-col h-full shrink-0"
      style={{ background: '#0d1117', borderRight: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Search */}
      <div className="p-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" style={{ strokeWidth: 1.5 }} />
          <input
            type="text"
            placeholder="Search components..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md outline-none placeholder:text-slate-600"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#cbd5e1',
            }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-2">
        {filtered ? (
          filtered.length === 0 ? (
            <p className="text-xs text-slate-600 text-center py-8">No components found</p>
          ) : (
            <div className="space-y-0.5">{filtered.map(renderItem)}</div>
          )
        ) : (
          grouped &&
          Object.entries(grouped).map(([category, items]) => {
            const isCollapsed = collapsed[category];
            return (
              <div key={category} className="mb-2">
                <button
                  onClick={() => toggleKey(category)}
                  className="w-full flex items-center justify-between px-2 py-1 rounded-md transition-colors"
                  style={{ color: '#64748b' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#94a3b8')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
                >
                  <span className="text-[9px] font-medium uppercase tracking-wide">{category}</span>
                  {isCollapsed ? (
                    <ChevronRight className="w-2.5 h-2.5" style={{ strokeWidth: 1.5 }} />
                  ) : (
                    <ChevronDown className="w-2.5 h-2.5" style={{ strokeWidth: 1.5 }} />
                  )}
                </button>
                {!isCollapsed && (
                  <div
                    className="space-y-0.5 ml-1 pl-2"
                    style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    {items.map(renderItem)}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="px-3 py-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-[9px] text-slate-700 text-center">Click or drag to add</p>
      </div>
    </aside>
  );
}
