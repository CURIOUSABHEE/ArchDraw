'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useDiagramStore } from '@/store/diagramStore';

const TECH_OPTIONS: Record<string, string[]> = {
  'Data Storage': ['PostgreSQL', 'MySQL', 'SQLite', 'MongoDB', 'DynamoDB', 'Cassandra', 'Elasticsearch', 'S3', 'GCS'],
  'Caching': ['Redis', 'Memcached', 'Varnish'],
  'Messaging & Events': ['RabbitMQ', 'Kafka', 'SQS', 'SNS', 'NATS', 'Pulsar'],
  'Compute': ['Node.js', 'Python', 'Go', 'Java', 'Rust', '.NET', 'Ruby'],
  'Auth & Security': ['Auth0', 'Keycloak', 'Okta', 'Cognito', 'Firebase Auth'],
  'Observability': ['Prometheus', 'Grafana', 'Datadog', 'New Relic', 'Jaeger', 'Zipkin'],
  'AI / ML': ['OpenAI', 'Anthropic', 'Pinecone', 'Weaviate', 'HuggingFace'],
};

const ACCENT_SWATCHES = [
  { color: '#06b6d4', label: 'Teal' },
  { color: '#ec4899', label: 'Pink' },
  { color: '#f59e0b', label: 'Amber' },
  { color: '#3b82f6', label: 'Blue' },
  { color: '#8b5cf6', label: 'Purple' },
  { color: '#f97316', label: 'Coral' },
  { color: '#10b981', label: 'Green' },
  { color: '#ef4444', label: 'Red' },
];

function EdgePropertiesPanel() {
  const { selectedEdgeId, edges, updateEdgeLabel, setSelectedEdgeId } = useDiagramStore();
  const edge = edges.find((e) => e.id === selectedEdgeId);
  const [localLabel, setLocalLabel] = useState(edge?.data?.label ?? '');

  useEffect(() => {
    if (edge) setLocalLabel(edge.data?.label ?? '');
  }, [edge?.data?.label]);

  if (!edge) return null;

  return (
    <aside
      className="w-64 border-l border-border bg-card flex flex-col h-full shrink-0 animate-in slide-in-from-right-4 duration-200"
      style={{ boxShadow: '-4px 0 16px rgba(0,0,0,0.06)' }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-xs font-semibold text-foreground">Edge Properties</span>
        <button 
          onClick={() => setSelectedEdgeId(null)} 
          className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <p className="text-[10px] text-muted-foreground leading-relaxed mb-4">
          Double-click the edge to add a label.
        </p>
        
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
            Edge label
          </label>
          <input
            type="text"
            value={localLabel}
            placeholder="e.g. calls user API"
            onChange={(e) => setLocalLabel(e.target.value)}
            onBlur={() => {
              if (selectedEdgeId) updateEdgeLabel(selectedEdgeId, localLabel);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (selectedEdgeId) updateEdgeLabel(selectedEdgeId, localLabel);
                (e.target as HTMLInputElement).blur();
              }
              e.stopPropagation();
            }}
            className="w-full px-2.5 py-1.5 text-xs bg-accent border border-indigo-500/30 rounded-md outline-none focus:ring-1 focus:ring-indigo-500 text-indigo-500 placeholder:text-indigo-500/50"
          />
          <p className="text-[10px] text-muted-foreground mt-1">
            Press Enter or click away to save.
          </p>
        </div>
      </div>
    </aside>
  );
}

export function PropertiesPanel() {
  const {
    selectedNodeId, nodes, updateNodeData, removeNode, setSelectedNodeId,
    selectedEdgeId,
  } = useDiagramStore();

  const node = nodes.find((n) => n.id === selectedNodeId);

  if (selectedEdgeId && !node) {
    return <EdgePropertiesPanel />;
  }

  if (!node) return null;

  const data = node.data;
  const techOptions = TECH_OPTIONS[data.category] ?? [];
  const activeAccent = data.accentColor ?? data.color ?? '#6366f1';

  const labelRef = useRef<HTMLInputElement>(null);
  const [localLabel, setLocalLabel] = useState(node.data.label ?? '');

  useEffect(() => {
    if (node) setLocalLabel(node.data.label ?? '');
  }, [node?.id]);

  const commitLabel = () => {
    if (localLabel.trim()) updateNodeData(node.id, { label: localLabel.trim() });
  };

  return (
    <aside
      className="w-64 border-l border-border bg-card flex flex-col h-full shrink-0 animate-in slide-in-from-right-4 duration-200"
      style={{ boxShadow: '-4px 0 16px rgba(0,0,0,0.06)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: activeAccent }} />
          <span className="text-xs font-semibold text-foreground">Properties</span>
        </div>
        <button
          onClick={() => setSelectedNodeId(null)}
          className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Category badge */}
        {data.category && (
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Category</label>
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{ background: `${activeAccent}18`, color: activeAccent }}
            >
              {data.category}
            </span>
          </div>
        )}

        {/* Label */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Label</label>
          <input
            ref={labelRef}
            value={localLabel}
            onChange={(e) => setLocalLabel(e.target.value)}
            onBlur={commitLabel}
            onKeyDown={(e) => { if (e.key === 'Enter') labelRef.current?.blur(); e.stopPropagation(); }}
            className="w-full px-2.5 py-1.5 text-xs bg-accent border border-border rounded-md outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Tech */}
        {techOptions.length > 0 && (
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Technology</label>
            <div className="flex flex-wrap gap-1">
              {techOptions.map((tech) => (
                <button
                  key={tech}
                  onClick={() => updateNodeData(node.id, { tech, icon: undefined })}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                    data.tech === tech
                      ? 'bg-indigo-600 text-white'
                      : 'bg-accent text-muted-foreground hover:bg-indigo-100 dark:hover:bg-indigo-900'
                  }`}
                >
                  {tech}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Accent swatches */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">Accent Color</label>
          <div className="flex gap-1.5">
            {ACCENT_SWATCHES.map(({ color, label }) => (
              <button
                key={color}
                title={label}
                onClick={() => updateNodeData(node.id, { color, accentColor: color })}
                className="w-5 h-5 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                style={{
                  background: color,
                  boxShadow: activeAccent === color ? `0 0 0 2px hsl(var(--card)), 0 0 0 4px ${color}` : undefined,
                }}
              />
            ))}
          </div>
        </div>

        {/* Delete */}
        <div className="pt-2 border-t border-border">
          <button
            onClick={() => { removeNode(node.id); setSelectedNodeId(null); }}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-md transition-colors"
          >
            <X className="w-3 h-3" />
            Delete node
          </button>
        </div>
      </div>
    </aside>
  );
}
