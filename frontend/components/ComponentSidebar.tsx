'use client';

import { useState } from 'react';
import { Search, ChevronDown, ChevronRight, Server, LucideIcon } from 'lucide-react';
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
  Flag, Clock,
  Chrome, Github, Twitter, Linkedin,
  Upload, Video,
  MessageSquareWarning, ListTodo, Wrench, Play,
  FileCode, FileInput, ScanSearch, ScanText, ImagePlus, Eye,
  ArrowUpDown, ArrowLeftRight, Expand, Share2,
  Braces, Hash, DollarSign, ThumbsUp, Lightbulb,
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
  Flag, Clock,
  Chrome, Github, Twitter, Linkedin,
  Upload, Video,
  MessageSquareWarning, ListTodo, Wrench, Play,
  FileCode, FileInput, ScanSearch, ScanText, ImagePlus, Eye,
  ArrowUpDown, ArrowLeftRight, Expand, Share2,
  Braces, Hash, DollarSign, ThumbsUp, Lightbulb,
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
}

function SidebarSection({ title, items, sectionKey, collapsed, onToggle, onAdd }: SectionProps) {
  const grouped = items.reduce<Record<string, ComponentEntry[]>>((acc, c) => {
    (acc[c.category] ??= []).push(c);
    return acc;
  }, {});

  const isCollapsed = collapsed[sectionKey];

  return (
    <div className="mb-2">
      <button
        onClick={() => onToggle(sectionKey)}
        className="w-full flex items-center justify-between px-3 py-2 rounded hover:bg-accent transition-colors"
      >
        <span className="text-xs font-medium text-muted-foreground">{title}</span>
        {isCollapsed
          ? <ChevronRight className="w-4 h-4 text-muted-foreground" />
          : <ChevronDown className="w-4 h-4 text-muted-foreground" />
        }
      </button>

      {!isCollapsed && (
        <div className="pl-2">
          {Object.entries(grouped).map(([category, catItems]) => {
            const catKey = `${sectionKey}:${category}`;
            const isCatCollapsed = collapsed[catKey];
            return (
              <div key={category}>
                <button
                  onClick={() => onToggle(catKey)}
                  className="w-full flex items-center justify-between px-3 py-1 rounded hover:bg-accent transition-colors"
                >
                  <span className="text-[10px] font-medium text-muted-foreground/70">{category}</span>
                  {isCatCollapsed
                    ? <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
                    : <ChevronDown className="w-3 h-3 text-muted-foreground/50" />
                  }
                </button>

                {!isCatCollapsed && (
                  <div className="space-y-0.5 mb-2 ml-2">
                    {catItems.map((comp) => {
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
                          onClick={() => onAdd(comp)}
                          title={getDescription(comp)}
                          className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-foreground rounded hover:bg-accent cursor-grab active:cursor-grabbing"
                        >
                          <div
                            className="flex items-center justify-center rounded shrink-0"
                            style={{ width: 20, height: 20, background: `${displayColor}15`, border: `1px solid ${displayColor}30` }}
                          >
                            {comp.technology ? (
                              <NodeIcon technology={comp.technology} size={10} />
                            ) : (
                              <FallbackIcon size={10} style={{ color: displayColor }} strokeWidth={1.75} />
                            )}
                          </div>
                          <span className="flex-1 text-left">{comp.label}</span>
                        </button>
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

const TOP_SECTIONS = [
  { key: 'general',   title: 'General',               data: (componentsData as ComponentEntry[]).filter(c => !AI_CATEGORIES.includes(c.category)) },
  { key: 'aws',       title: 'AWS Services',           data: awsData as ComponentEntry[] },
  { key: 'databases', title: 'Databases & Storage',   data: (dbData as ComponentEntry[]).filter(c => ['Databases','ORMs & Tools','Search'].includes(c.category)) },
  { key: 'devtools',  title: 'Developer Tools',        data: (dbData as ComponentEntry[]).filter(c => !['Databases','ORMs & Tools','Search'].includes(c.category)) },
  { key: 'services',  title: 'Services',               data: servicesData as ComponentEntry[] },
  { key: 'ai',        title: 'AI & ML',               data: (componentsData as ComponentEntry[]).filter(c => AI_CATEGORIES.includes(c.category)) },
];

export function ComponentSidebar() {
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const addNode = useDiagramStore((s) => s.addNode);

  const toggleKey = (key: string) =>
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleAdd = (comp: ComponentEntry) => {
    addNode(comp.id, comp.label, comp.category, comp.color, comp.icon, comp.technology, getViewportCenter());
  };

  const q = search.toLowerCase().trim();

  if (q) {
    const allItems = TOP_SECTIONS.flatMap((s) => s.data);
    const filtered = allItems.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        (c.technology && c.technology.toLowerCase().includes(q))
    );

    return (
      <aside className="w-60 border-r border-border bg-sidebar flex flex-col h-full shrink-0">
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-accent border-transparent rounded-md outline-none placeholder:text-muted-foreground"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No components found</p>
          ) : (
            filtered.map((comp) => {
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
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-foreground rounded hover:bg-accent cursor-grab active:cursor-grabbing"
                >
                  <div
                    className="flex items-center justify-center rounded shrink-0"
                    style={{ width: 20, height: 20, background: `${displayColor}15`, border: `1px solid ${displayColor}30` }}
                  >
                    {comp.technology ? (
                      <NodeIcon technology={comp.technology} size={10} />
                    ) : (
                      <FallbackIcon size={10} style={{ color: displayColor }} strokeWidth={1.75} />
                    )}
                  </div>
                  <span className="flex-1 text-left">{comp.label}</span>
                </button>
              );
            })
          )}
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-60 border-r border-border bg-sidebar flex flex-col h-full shrink-0">
      <div className="p-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-accent border-transparent rounded-md outline-none placeholder:text-muted-foreground"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {TOP_SECTIONS.map((section) => (
          <SidebarSection
            key={section.key}
            title={section.title}
            items={section.data}
            sectionKey={section.key}
            collapsed={collapsed}
            onToggle={toggleKey}
            onAdd={handleAdd}
          />
        ))}
      </div>
    </aside>
  );
}
