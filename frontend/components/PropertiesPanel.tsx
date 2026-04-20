'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Type, Database, Server, Zap, Globe, Activity, Shield } from 'lucide-react';
import { useDiagramStore } from '@/store/diagramStore';

const TIER_ICONS: Record<string, React.ElementType> = {
  client: Globe,
  edge: Shield,
  compute: Server,
  async: Zap,
  data: Database,
  observe: Activity,
};

const TECH_LABELS: Record<string, string> = {
  postgres: 'PostgreSQL',
  mysql: 'MySQL',
  mongodb: 'MongoDB',
  redis: 'Redis',
  elasticsearch: 'Elasticsearch',
  kafka: 'Kafka',
  rabbitmq: 'RabbitMQ',
  sqs: 'Amazon SQS',
  react: 'React',
  nextjs: 'Next.js',
  nodejs: 'Node.js',
  python: 'Python',
  golang: 'Go',
  typescript: 'TypeScript',
  javascript: 'JavaScript',
  docker: 'Docker',
  kubernetes: 'Kubernetes',
  aws: 'AWS',
  nginx: 'Nginx',
  grafana: 'Grafana',
  prometheus: 'Prometheus',
  lambda: 'AWS Lambda',
  service: 'Service',
  database: 'Database',
  queue: 'Queue',
  cache: 'Cache',
  gateway: 'Gateway',
  loadbalancer: 'Load Balancer',
  auth: 'Authentication',
  firewall: 'Firewall',
  monitoring: 'Monitoring',
  external: 'External',
};

function EdgePropertiesPanel() {
  const { selectedEdgeId, edges, updateEdgeLabel, setSelectedEdgeId } = useDiagramStore();
  const edge = edges.find((e) => e.id === selectedEdgeId);
  const [localLabel, setLocalLabel] = useState(edge?.data?.label ?? '');

  useEffect(() => {
    if (edge) setLocalLabel(edge.data?.label ?? '');
  }, [edge?.data?.label]);

  if (!edge) return null;

  return (
    <div className="floating-panel p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium">Edge Properties</span>
        <button 
          onClick={() => setSelectedEdgeId(null)} 
          className="floating-icon-btn !w-8 !h-8"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-4 space-y-4">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Double-click the edge on canvas to add a label.
        </p>
        
        <div>
          <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground block mb-2">
            Label
          </label>
          <input
            type="text"
            value={localLabel}
            placeholder="e.g. calls API"
            onChange={(e) => setLocalLabel(e.target.value)}
            onBlur={() => {
              if (selectedEdgeId) updateEdgeLabel(selectedEdgeId, localLabel);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (selectedEdgeId) updateEdgeLabel(selectedEdgeId, localLabel);
                (e.target as HTMLTextAreaElement).blur();
              }
              e.stopPropagation();
            }}
            className="w-full px-3 py-2 text-xs bg-secondary rounded-xl outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>
    </div>
  );
}

export function PropertiesPanel() {
  const {
    selectedNodeId, nodes, updateNodeData, removeNode, setSelectedNodeId,
    selectedEdgeId,
  } = useDiagramStore();

  const node = nodes.find((n) => n.id === selectedNodeId);

  const labelRef = useRef<HTMLInputElement>(null);
  const [localLabel, setLocalLabel] = useState(node?.data?.label ?? '');

  useEffect(() => {
    if (node) setLocalLabel(node.data.label ?? '');
  }, [node?.id]);

  if (selectedEdgeId && !node) {
    return <EdgePropertiesPanel />;
  }

  if (!node) return null;

  const data = node.data;
  const TierIcon = TIER_ICONS[data.category?.toLowerCase()] || Server;
  const techLabel = data.tech ? TECH_LABELS[data.tech.toLowerCase()] || data.tech : null;

  const commitLabel = () => {
    if (localLabel.trim()) updateNodeData(node.id, { label: localLabel.trim() });
  };

  return (
    <div 
      className="floating-panel p-4 overflow-y-auto"
      style={{ 
        minWidth: 260,
        position: 'fixed',
        top: 96,
        right: 20,
        bottom: 110,
        maxHeight: 'calc(100vh - 206px)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium">Node Info</span>
        <button
          onClick={() => setSelectedNodeId(null)}
          className="floating-icon-btn !w-8 !h-8"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4 mt-4">
        {/* Label */}
        <div>
          <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground block mb-2 flex items-center gap-1.5">
            <Type className="w-3 h-3" />
            Label
          </label>
          <input
            ref={labelRef}
            value={localLabel}
            onChange={(e) => setLocalLabel(e.target.value)}
            onBlur={commitLabel}
            onKeyDown={(e) => { if (e.key === 'Enter') labelRef.current?.blur(); e.stopPropagation(); }}
            className="w-full px-3 py-2 text-xs bg-secondary rounded-xl outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Category / Tier */}
        {data.category && (
          <div>
            <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground block mb-2 flex items-center gap-1.5">
              <TierIcon className="w-3 h-3" />
              Tier
            </label>
            <div className="px-3 py-2 text-xs bg-secondary rounded-xl capitalize">
              {data.category}
            </div>
          </div>
        )}

        {/* Technology */}
        {(data.tech || data.technology) && (
          <div>
            <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground block mb-2">
              Technology
            </label>
            <div className="px-3 py-2 text-xs bg-secondary rounded-xl">
              {techLabel || data.technology || data.tech}
            </div>
          </div>
        )}

        {/* Subtitle / Description */}
        {(data.sublabel || data.description) && (
          <div>
            <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground block mb-2">
              Description
            </label>
            <div className="px-3 py-2 text-xs bg-secondary rounded-xl text-muted-foreground">
              {data.sublabel || data.description}
            </div>
          </div>
        )}

        {/* Component Type */}
        {data.componentType && (
          <div>
            <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground block mb-2">
              Type
            </label>
            <div className="px-3 py-2 text-xs bg-secondary rounded-xl capitalize">
              {data.componentType}
            </div>
          </div>
        )}

        {/* Node ID (for reference) */}
        <div>
          <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground block mb-2">
            ID
          </label>
          <div className="px-3 py-2 text-xs bg-secondary rounded-xl text-muted-foreground font-mono truncate" title={node.id}>
            {node.id}
          </div>
        </div>

        {/* Delete */}
        <div className="pt-4 border-t border-border/50">
          <button
            onClick={() => { removeNode(node.id); setSelectedNodeId(null); }}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
          >
            Delete Node
          </button>
        </div>
      </div>
    </div>
  );
}
