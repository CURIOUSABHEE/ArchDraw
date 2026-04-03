'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Settings, Type, Palette, Trash2 } from 'lucide-react';
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
    <div className="floating-panel p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
          <span className="text-sm font-medium">Edge</span>
        </div>
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
  const techOptions = TECH_OPTIONS[data.category] ?? [];
  const activeAccent = data.accentColor ?? data.color ?? '#6366f1';

  const commitLabel = () => {
    if (localLabel.trim()) updateNodeData(node.id, { label: localLabel.trim() });
  };

  return (
    <div className="floating-panel p-4" style={{ minWidth: 260 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: activeAccent }} />
          <span className="text-sm font-medium">Properties</span>
        </div>
        <button
          onClick={() => setSelectedNodeId(null)}
          className="floating-icon-btn !w-8 !h-8"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4 mt-4">
        {/* Category badge */}
        {data.category && (
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-medium"
              style={{ background: `${activeAccent}15`, color: activeAccent }}
            >
              {data.category}
            </span>
          </div>
        )}

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

        {/* Tech */}
        {techOptions.length > 0 && (
          <div>
            <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground block mb-2 flex items-center gap-1.5">
              <Settings className="w-3 h-3" />
              Technology
            </label>
            <div className="flex flex-wrap gap-1.5">
              {techOptions.map((tech) => (
                <button
                  key={tech}
                  onClick={() => updateNodeData(node.id, { tech, icon: undefined })}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${
                    data.tech === tech
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-accent/50 text-muted-foreground hover:bg-accent'
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
          <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground block mb-2.5 flex items-center gap-1.5">
            <Palette className="w-3 h-3" />
            Color
          </label>
          <div className="flex gap-2">
            {ACCENT_SWATCHES.map(({ color, label }) => (
              <button
                key={color}
                title={label}
                onClick={() => updateNodeData(node.id, { color, accentColor: color })}
                className="w-6 h-6 rounded-full transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50"
                style={{
                  background: color,
                  boxShadow: activeAccent === color ? `0 0 0 2px white, 0 0 0 4px ${color}` : undefined,
                }}
              />
            ))}
          </div>
        </div>

        {/* Delete */}
        <div className="pt-4">
          <button
            onClick={() => { removeNode(node.id); setSelectedNodeId(null); }}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}