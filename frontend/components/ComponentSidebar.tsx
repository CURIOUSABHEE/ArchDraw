'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, ChevronDown, ChevronRight, Server, LucideIcon, X, Star, Clock } from 'lucide-react';
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
  Sparkles, Wind, Image, Mic, AudioLines, AudioWaveform,
  Container, AlertTriangle, TrendingUp, TrendingDown,
  FileText, BookOpen,
  Flag, Clock as ClockIcon,
  Chrome, Github, Twitter, Linkedin,
  Upload, Video,
  MessageSquareWarning, ListTodo, Wrench, Play,
  FileCode, FileInput, ScanSearch, ScanText, ImagePlus, Eye,
  ArrowUpDown, ArrowLeftRight, Expand, Share2,
  Braces, Hash as HashIcon, DollarSign, ThumbsUp, Lightbulb,
  FlaskConical, Dumbbell, Table, Minimize, Split, Copy,
  LayoutList, GraduationCap, Tag, Download, Wand2, Code,
  Link, Volume2, CheckCheck, Sliders,
} from 'lucide-react';
import componentsData from '@/data/components.json';
import awsData from '@/data/aws-components.json';
import dbData from '@/data/db-components.json';
import servicesData from '@/data/services-components.json';
import { useDiagramStore } from '@/store/diagramStore';
import { NodeIcon } from '@/components/NodeIcon';
import { iconRegistry } from '@/lib/iconRegistry';
import { UserAvatar } from '@/components/UserAvatar';
import { useAuthStore } from '@/store/authStore';

function getViewportCenter(): { x: number; y: number } {
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
}

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
  Sparkles, Wind, Image, Mic, AudioLines, AudioWaveform,
  Container, AlertTriangle, TrendingUp, TrendingDown,
  FileText, BookOpen,
  Flag, Clock: ClockIcon,
  Chrome, Github, Twitter, Linkedin,
  Upload, Video,
  MessageSquareWarning, ListTodo, Wrench, Play,
  FileCode, FileInput, ScanSearch, ScanText, ImagePlus, Eye,
  ArrowUpDown, ArrowLeftRight, Expand, Share2,
  Braces, Hash: HashIcon, DollarSign, ThumbsUp, Lightbulb,
  FlaskConical, Dumbbell, Table, Minimize, Split, Copy,
  LayoutList, GraduationCap, Tag, Download, Wand2, Code,
  Link, Volume2, CheckCheck, Sliders,
};

interface ComponentEntry {
  id: string;
  label: string;
  category: string;
  color: string;
  icon?: string;
  technology?: string;
}

const FAVORITES_KEY = 'archdraw:favorites';
const RECENT_KEY = 'archdraw:recent';
const MAX_RECENT = 8;

function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(defaultValue);

  /* eslint-disable */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        setValue(parsed);
      }
    } catch {}
  }, [key]);

  const setStoredValue = useCallback((newValue: T | ((prev: T) => T)) => {
    setValue(prev => {
      const result = typeof newValue === 'function' ? (newValue as (prev: T) => T)(prev) : newValue;
      try {
        localStorage.setItem(key, JSON.stringify(result));
      } catch {}
      return result;
    });
  }, [key]);

  return [value, setStoredValue];
}

const COMPONENT_DESCRIPTIONS: Record<string, string> = {
  client_web: 'Browser-based web app that initiates requests',
  client_mobile: 'iOS or Android app that initiates requests',
  dns: 'Resolves domain names to IP addresses',
  cdn: 'Distributes static assets globally for low latency',
  api_gateway: 'Single entry point that routes and authenticates API calls',
  load_balancer: 'Distributes traffic across multiple backend instances',
  reverse_proxy: 'Forwards client requests to backend servers',
  server_monolith: 'Single deployable unit containing all application logic',
  microservice: 'Small, independently deployable service',
  serverless_fn: 'Event-driven function that scales to zero',
  worker_job: 'Background process for async or scheduled tasks',
  container: 'Isolated runtime environment for your application',
  sql_db: 'Relational database with ACID guarantees',
  nosql_db: 'Schema-flexible database for unstructured data',
  object_storage: 'Scalable blob storage for files and backups',
  file_system: 'Hierarchical file storage mounted to compute',
  search_engine: 'Full-text search over large datasets',
  data_warehouse: 'Columnar store optimized for analytics',
  in_memory_cache: 'Sub-millisecond key-value store for hot data',
  cdn_cache: 'Edge-cached responses from CDN nodes',
  app_cache: 'Application-level cache layer',
  message_queue: 'Durable queue decoupling producers and consumers',
  event_bus: 'Publish-subscribe system for domain events',
  kafka_streaming: 'High-throughput distributed log for real-time streams',
  webhook: 'HTTP callback triggered by external events',
  auth_service: 'Issues and validates JWT tokens',
  oauth_provider: 'Handles OAuth 2.0 / OIDC flows',
  api_key_manager: 'Generates and validates API keys',
  firewall_waf: 'Filters malicious traffic and enforces security rules',
  logger: 'Collects and stores structured application logs',
  metrics_collector: 'Aggregates time-series metrics from services',
  tracing_service: 'Tracks distributed request traces',
  alert_manager: 'Routes and deduplicates monitoring alerts',
  dashboard: 'Visualizes metrics and logs in real-time',
  llm_api: 'Large language model API for text generation',
  vector_db: 'Stores and queries high-dimensional embeddings',
  embedding_service: 'Converts text or media into vector embeddings',
  rag_pipeline: 'Retrieval-augmented generation pipeline',
  model_server: 'Serves ML model inference over HTTP or gRPC',
  email_service: 'Transactional and marketing email delivery',
  payment_gateway: 'Processes payments and manages billing',
  sms_push: 'Sends SMS and mobile push notifications',
  maps_api: 'Geolocation, routing, and mapping services',
  third_party_api: 'Generic external API integration',
  cicd_pipeline: 'Automates build, test, and deployment workflows',
  container_registry: 'Stores and distributes container images',
  secret_manager: 'Securely stores and rotates credentials',
  config_service: 'Centralized configuration management',
};

function getDescription(comp: ComponentEntry): string {
  if (COMPONENT_DESCRIPTIONS[comp.id]) return COMPONENT_DESCRIPTIONS[comp.id];
  if (comp.technology && iconRegistry[comp.technology]) return iconRegistry[comp.technology].description;
  return comp.label;
}

function makeDragGhost(label: string, color: string) {
  const ghost = document.createElement('div');
  ghost.style.cssText = `position:fixed;top:-100px;left:-100px;background:white;border:1px solid #e2e8f0;border-left:3px solid ${color};border-radius:8px;padding:6px 10px;font-size:11px;font-weight:600;color:#1e293b;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,0.15);pointer-events:none;`;
  ghost.textContent = label;
  return ghost;
}

interface SectionProps {
  title: string;
  items: ComponentEntry[];
  sectionKey: string;
  collapsed: Record<string, boolean>;
  onToggle: (key: string) => void;
  onAdd: (comp: ComponentEntry) => void;
  favorites: Set<string>;
  onToggleFavorite: (id: string) => void;
}

function SidebarSection({ title, items, sectionKey, collapsed, onToggle, onAdd, favorites, onToggleFavorite }: SectionProps) {
  const grouped = items.reduce<Record<string, ComponentEntry[]>>((acc, c) => {
    (acc[c.category] ??= []).push(c);
    return acc;
  }, {});

  const isTopCollapsed = collapsed[`top:${sectionKey}`];

  return (
    <div className="mb-3">
      <button
        onClick={() => onToggle(`top:${sectionKey}`)}
        className="w-full flex items-center justify-between px-3 py-1.5 rounded-md hover:bg-accent/70 transition-colors duration-150 group"
      >
        <span className="text-[10px] font-semibold text-muted-foreground/80 group-hover:text-foreground/90 transition-colors tracking-wide uppercase">
          {title}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-muted-foreground/50 font-medium">{items.length}</span>
          {isTopCollapsed
            ? <ChevronRight className="w-3 h-3 text-muted-foreground/60" />
            : <ChevronDown className="w-3 h-3 text-muted-foreground/60" />
          }
        </div>
      </button>

      {!isTopCollapsed && (
        <div className="pl-1 pr-2 mt-0.5">
          {Object.entries(grouped).map(([category, catItems]) => {
            const catKey = `cat:${sectionKey}:${category}`;
            const isCatCollapsed = collapsed[catKey];
            return (
              <div key={category}>
                <button
                  onClick={() => onToggle(catKey)}
                  className="w-full flex items-center justify-between px-3 py-1 rounded-md hover:bg-accent/50 transition-colors duration-150 group"
                >
                  <span className="text-[9px] font-medium text-muted-foreground/70 group-hover:text-foreground/80 transition-colors">
                    {category}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[8px] text-muted-foreground/40">{catItems.length}</span>
                    {isCatCollapsed
                      ? <ChevronRight className="w-2 h-2 text-muted-foreground/40" />
                      : <ChevronDown className="w-2 h-2 text-muted-foreground/40" />
                    }
                  </div>
                </button>

                {!isCatCollapsed && (
                  <div className="space-y-0.5 mb-2 ml-1 border-l border-border/30 pl-2">
                    {catItems.map((comp) => {
                      const FallbackIcon: LucideIcon = (comp.icon ? ICON_MAP[comp.icon] : undefined) ?? Server;
                      const displayColor = comp.technology
                        ? (iconRegistry[comp.technology]?.color ?? comp.color)
                        : comp.color;
                      const isFavorite = favorites.has(comp.id);
                      return (
                        <div
                          key={comp.id}
                          className="group/component relative"
                        >
                          <button
                            draggable
                            data-onboarding="component-item"
                            onDragStart={(e) => {
                              e.dataTransfer.setData('application/archdraw', JSON.stringify(comp));
                              e.dataTransfer.effectAllowed = 'move';
                              const ghost = makeDragGhost(comp.label, displayColor);
                              document.body.appendChild(ghost);
                              e.dataTransfer.setDragImage(ghost, 0, 0);
                              setTimeout(() => document.body.removeChild(ghost), 0);
                            }}
                            onClick={() => onAdd(comp)}
                            title={getDescription(comp)}
                            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium text-foreground rounded-md transition-all duration-100 hover:bg-accent cursor-grab active:cursor-grabbing active:bg-accent/80"
                          >
                            <div
                              className="flex items-center justify-center rounded shrink-0 transition-transform duration-100 group-hover/component:scale-110"
                              style={{ width: 22, height: 22, background: `${displayColor}15`, border: `1px solid ${displayColor}30` }}
                            >
                              {comp.technology ? (
                                <NodeIcon technology={comp.technology} size={11} />
                              ) : (
                                <FallbackIcon size={11} style={{ color: displayColor }} strokeWidth={1.75} />
                              )}
                            </div>
                            <span className="flex-1 text-left leading-tight text-foreground/90">{comp.label}</span>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onToggleFavorite(comp.id); }}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover/component:opacity-100 transition-opacity duration-100 p-0.5 rounded hover:bg-accent/80"
                            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            <Star
                              size={12}
                              className={`transition-colors duration-100 ${isFavorite ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40 hover:text-amber-500'}`}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const AI_CATEGORIES = [
  'AI Agents', 'LLM Models', 'RAG', 'Vector Databases',
  'ML Infrastructure', 'ML Serving', 'MLOps', 'LLM Ops',
  'AI Frameworks', 'AI Data Pipeline', 'Speech & Audio', 'Vision AI',
];

// Top-level sections config
const TOP_SECTIONS = [
  { key: 'general',   title: 'General',               data: (componentsData as ComponentEntry[]).filter(c => !AI_CATEGORIES.includes(c.category)) },
  { key: 'aws',       title: 'AWS Services',           data: awsData as ComponentEntry[] },
  { key: 'databases', title: 'Databases & Storage',    data: (dbData as ComponentEntry[]).filter(c => ['Databases','ORMs & Tools','Search'].includes(c.category)) },
  { key: 'devtools',  title: 'Developer Tools',        data: (dbData as ComponentEntry[]).filter(c => !['Databases','ORMs & Tools','Search'].includes(c.category)) },
  { key: 'services',  title: 'Services & Integrations', data: servicesData as ComponentEntry[] },
  { key: 'ai',        title: 'AI & Machine Learning',  data: (componentsData as ComponentEntry[]).filter(c => AI_CATEGORIES.includes(c.category)) },
];

export function ComponentSidebar() {
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [favorites, setFavorites] = useLocalStorage<Set<string>>(FAVORITES_KEY, new Set());
  const [recent, setRecent] = useLocalStorage<string[]>(RECENT_KEY, []);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const addNode = useDiagramStore((s) => s.addNode);

  const toggleKey = (key: string) =>
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addToRecent = (id: string) => {
    setRecent(prev => {
      const filtered = prev.filter(x => x !== id);
      return [id, ...filtered].slice(0, MAX_RECENT);
    });
  };

  const handleAdd = (comp: ComponentEntry) => {
    addNode(comp.id, comp.label, comp.category, comp.color, comp.icon, comp.technology, getViewportCenter());
    addToRecent(comp.id);
  };

  const q = search.toLowerCase().trim();

  const allItems = TOP_SECTIONS.flatMap((s) => s.data);
  const filtered = q
    ? allItems.filter(
        (c) =>
          c.label.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          (c.technology && c.technology.toLowerCase().includes(q))
      )
    : [];

  const favoriteItems = q ? [] : allItems.filter(c => favorites.has(c.id));
  const recentItems = q ? [] : allItems.filter(c => recent.includes(c.id));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = q ? filtered : [...recentItems, ...favoriteItems];
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && selectedIndex >= 0 && items[selectedIndex]) {
      e.preventDefault();
      handleAdd(items[selectedIndex]);
    } else if (e.key === 'Escape') {
      setSearch('');
      searchInputRef.current?.blur();
    }
  };

  useEffect(() => {
    setSelectedIndex(-1);
  }, [q]);

  if (q) {
    return (
      <aside className="w-60 border-r border-border bg-sidebar flex flex-col h-full shrink-0">
        <SearchBar value={search} onChange={setSearch} onClear={() => setSearch('')} inputRef={searchInputRef} onKeyDown={handleKeyDown} />
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No components found</p>
          ) : (
            filtered.map((comp, i) => {
              const FallbackIcon: LucideIcon = (comp.icon ? ICON_MAP[comp.icon] : undefined) ?? Server;
              const displayColor = comp.technology
                ? (iconRegistry[comp.technology]?.color ?? comp.color)
                : comp.color;
              return (
                <button
                  key={`search-${i}-${comp.id}`}
                  draggable
                  data-onboarding="component-item"
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/archdraw', JSON.stringify(comp));
                    e.dataTransfer.effectAllowed = 'move';
                    const ghost = makeDragGhost(comp.label, displayColor);
                    document.body.appendChild(ghost);
                    e.dataTransfer.setDragImage(ghost, 0, 0);
                    setTimeout(() => document.body.removeChild(ghost), 0);
                  }}
                  onClick={() => handleAdd(comp)}
                  title={getDescription(comp)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium text-foreground rounded-md transition-all duration-100 cursor-grab active:cursor-grabbing ${i === selectedIndex ? 'bg-accent ring-1 ring-ring/30' : 'hover:bg-accent'}`}
                >
                  <div
                    className="flex items-center justify-center rounded shrink-0"
                    style={{ width: 22, height: 22, background: `${displayColor}12`, border: `1px solid ${displayColor}25` }}
                  >
                    {comp.technology ? (
                      <NodeIcon technology={comp.technology} size={11} />
                    ) : (
                      <FallbackIcon size={11} style={{ color: displayColor }} strokeWidth={1.75} />
                    )}
                  </div>
                  <span className="flex-1 text-left leading-tight text-foreground/90">{comp.label}</span>
                </button>
              );
            })
          )}
        </div>
        <SidebarFooter />
      </aside>
    );
  }

  return (
    <aside className="w-60 border-r border-border bg-sidebar flex flex-col h-full shrink-0">
      <SearchBar value={search} onChange={setSearch} onClear={() => setSearch('')} inputRef={searchInputRef} onKeyDown={handleKeyDown} />
      <div className="flex-1 overflow-y-auto p-2">
        {!collapsed['top:favorites'] && favoriteItems.length > 0 && (
          <div className="mb-3">
            <button
              onClick={() => toggleKey('top:favorites')}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-md hover:bg-accent/70 transition-colors duration-150 group"
            >
              <span className="text-[10px] font-semibold text-amber-500/80 group-hover:text-amber-500 transition-colors tracking-wide uppercase flex items-center gap-1.5">
                <Star size={10} className="fill-amber-400" /> Favorites
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-muted-foreground/50 font-medium">{favoriteItems.length}</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground/60" />
              </div>
            </button>
            <div className="space-y-0.5 mt-0.5 ml-1 border-l border-border/30 pl-2">
              {favoriteItems.map((comp) => {
                const FallbackIcon: LucideIcon = (comp.icon ? ICON_MAP[comp.icon] : undefined) ?? Server;
                const displayColor = comp.technology
                  ? (iconRegistry[comp.technology]?.color ?? comp.color)
                  : comp.color;
                return (
                  <button
                    key={comp.id}
                    draggable
                    data-onboarding="component-item"
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/archdraw', JSON.stringify(comp));
                      e.dataTransfer.effectAllowed = 'move';
                      const ghost = makeDragGhost(comp.label, displayColor);
                      document.body.appendChild(ghost);
                      e.dataTransfer.setDragImage(ghost, 0, 0);
                      setTimeout(() => document.body.removeChild(ghost), 0);
                    }}
                    onClick={() => handleAdd(comp)}
                    title={getDescription(comp)}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium text-foreground rounded-md transition-all duration-100 hover:bg-accent cursor-grab active:cursor-grabbing active:bg-accent/80"
                  >
                    <div
                      className="flex items-center justify-center rounded shrink-0"
                      style={{ width: 22, height: 22, background: `${displayColor}15`, border: `1px solid ${displayColor}30` }}
                    >
                      {comp.technology ? (
                        <NodeIcon technology={comp.technology} size={11} />
                      ) : (
                        <FallbackIcon size={11} style={{ color: displayColor }} strokeWidth={1.75} />
                      )}
                    </div>
                    <span className="flex-1 text-left leading-tight text-foreground/90">{comp.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {!collapsed['top:recent'] && recentItems.length > 0 && (
          <div className="mb-3">
            <button
              onClick={() => toggleKey('top:recent')}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-md hover:bg-accent/70 transition-colors duration-150 group"
            >
              <span className="text-[10px] font-semibold text-muted-foreground/80 group-hover:text-foreground/90 transition-colors tracking-wide uppercase flex items-center gap-1.5">
                <Clock size={10} /> Recent
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-muted-foreground/50 font-medium">{recentItems.length}</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground/60" />
              </div>
            </button>
            <div className="space-y-0.5 mt-0.5 ml-1 border-l border-border/30 pl-2">
              {recentItems.map((comp) => {
                const FallbackIcon: LucideIcon = (comp.icon ? ICON_MAP[comp.icon] : undefined) ?? Server;
                const displayColor = comp.technology
                  ? (iconRegistry[comp.technology]?.color ?? comp.color)
                  : comp.color;
                return (
                  <button
                    key={comp.id}
                    draggable
                    data-onboarding="component-item"
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/archdraw', JSON.stringify(comp));
                      e.dataTransfer.effectAllowed = 'move';
                      const ghost = makeDragGhost(comp.label, displayColor);
                      document.body.appendChild(ghost);
                      e.dataTransfer.setDragImage(ghost, 0, 0);
                      setTimeout(() => document.body.removeChild(ghost), 0);
                    }}
                    onClick={() => handleAdd(comp)}
                    title={getDescription(comp)}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium text-foreground rounded-md transition-all duration-100 hover:bg-accent cursor-grab active:cursor-grabbing active:bg-accent/80"
                  >
                    <div
                      className="flex items-center justify-center rounded shrink-0"
                      style={{ width: 22, height: 22, background: `${displayColor}15`, border: `1px solid ${displayColor}30` }}
                    >
                      {comp.technology ? (
                        <NodeIcon technology={comp.technology} size={11} />
                      ) : (
                        <FallbackIcon size={11} style={{ color: displayColor }} strokeWidth={1.75} />
                      )}
                    </div>
                    <span className="flex-1 text-left leading-tight text-foreground/90">{comp.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {(favoriteItems.length > 0 || recentItems.length > 0) && (
          <div className="h-px bg-border/50 my-2" />
        )}

        {TOP_SECTIONS.map((section) => (
          <SidebarSection
            key={section.key}
            title={section.title}
            items={section.data}
            sectionKey={section.key}
            collapsed={collapsed}
            onToggle={toggleKey}
            onAdd={handleAdd}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
          />
        ))}
      </div>
      <SidebarFooter />
    </aside>
  );
}

function SearchBar({ value, onChange, onClear, inputRef, onKeyDown }: {
  value: string;
  onChange: (v: string) => void;
  onClear: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="p-2.5 border-b border-border/50">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
        <input
          type="text"
          ref={inputRef}
          placeholder="Search components..."
          className="w-full pl-8 pr-8 py-1.5 text-xs bg-accent/40 border border-transparent rounded-md focus:ring-1 focus:ring-ring/20 focus:bg-accent transition-all outline-none placeholder:text-muted-foreground/50"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
        />
        {value && (
          <button
            onClick={onClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-accent/80 transition-colors"
          >
            <X className="w-3 h-3 text-muted-foreground/60" />
          </button>
        )}
      </div>
    </div>
  );
}

function SidebarFooter() {
  const { user } = useAuthStore();
  return (
    <div className="border-t border-border/50">
      {user && <UserAvatar />}
      {!user && (
        <div className="px-3 py-2">
          <p className="text-[9px] text-muted-foreground/60 text-center">Click or drag to add</p>
        </div>
      )}
    </div>
  );
}
