'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Trash2, RotateCcw } from 'lucide-react';
import { useDiagramStore } from '@/store/diagramStore';
import { EDGE_TYPE_CONFIGS, EdgeType } from '@/data/edgeTypes';

const TECH_OPTIONS: Record<string, string[]> = {
  'Data Storage': ['PostgreSQL', 'MySQL', 'SQLite', 'MongoDB', 'DynamoDB', 'Cassandra', 'Elasticsearch', 'S3', 'GCS'],
  'Caching': ['Redis', 'Memcached', 'Varnish'],
  'Messaging & Events': ['RabbitMQ', 'Kafka', 'SQS', 'SNS', 'NATS', 'Pulsar'],
  'Compute': ['Node.js', 'Python', 'Go', 'Java', 'Rust', '.NET', 'Ruby'],
  'Auth & Security': ['Auth0', 'Keycloak', 'Okta', 'Cognito', 'Firebase Auth'],
  'Observability': ['Prometheus', 'Grafana', 'Datadog', 'New Relic', 'Jaeger', 'Zipkin'],
  'AI / ML': ['OpenAI', 'Anthropic', 'Pinecone', 'Weaviate', 'HuggingFace'],
};

// Section 5 — 8 preset swatches + default reset
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

export function PropertiesPanel() {
  const {
    selectedNodeId, nodes, updateNodeData, removeNode, setSelectedNodeId,
    selectedEdgeId, edges, updateEdgeData, setSelectedEdgeId,
  } = useDiagramStore();

  const node = nodes.find((n) => n.id === selectedNodeId);
  const edge = edges.find((e) => e.id === selectedEdgeId);

  const labelRef = useRef<HTMLInputElement>(null);
  const [localLabel, setLocalLabel] = useState('');

  useEffect(() => {
    if (node) setLocalLabel(node.data.label ?? '');
  }, [node?.id]);

  // ── Edge panel ──────────────────────────────────────────────────────────────
  if (edge && !node) {
    const edgeType: EdgeType = edge.data?.edgeType ?? 'sync';
    const updateEdgeType = useDiagramStore.getState().updateEdgeType;
    return (
      <aside
        key={`${edge.id}-${edge.data?.edgeType}`}
        className="w-64 border-l border-border bg-card flex flex-col h-full shrink-0 animate-in slide-in-from-right-4 duration-200"
        style={{ boxShadow: '-4px 0 16px rgba(0,0,0,0.06)' }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-xs font-semibold text-foreground">Edge Properties</span>
          <button onClick={() => setSelectedEdgeId(null)} className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <p className="text-[10px] text-muted-foreground leading-relaxed mb-4">
            Double-click the edge to add a label. Drag the blue handles to reshape the curve.
          </p>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.06em',
              color: '#6b7280',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}>
              Edge label
            </label>
            <input
              type="text"
              defaultValue={edge.data?.label ?? ''}
              placeholder={`e.g. ${EDGE_TYPE_CONFIGS[edgeType].id} or "calls user API"`}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  useDiagramStore.getState().updateEdgeLabel(edge.id, (e.target as HTMLInputElement).value);
                  (e.target as HTMLInputElement).blur();
                }
                e.stopPropagation(); // prevent Delete key from deleting the edge while typing
              }}
              onBlur={(e) => {
                useDiagramStore.getState().updateEdgeLabel(edge.id, e.target.value);
              }}
              style={{
                width: '100%',
                background: '#0f172a',
                border: `1px solid ${EDGE_TYPE_CONFIGS[edgeType].color}66`,
                borderRadius: 7,
                color: EDGE_TYPE_CONFIGS[edgeType].color,
                fontSize: 13,
                padding: '7px 10px',
                outline: 'none',
                fontFamily: 'system-ui, sans-serif',
                caretColor: EDGE_TYPE_CONFIGS[edgeType].color,
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onFocus={(e) => {
                (e.target as HTMLInputElement).style.borderColor = EDGE_TYPE_CONFIGS[edgeType].color;
                (e.target as HTMLInputElement).style.boxShadow = `0 0 0 3px ${EDGE_TYPE_CONFIGS[edgeType].color}22`;
              }}
            />
            <p style={{ fontSize: 10, color: '#4b5563', marginTop: 4 }}>
              Press Enter or click away to save. Leave blank to show type name.
            </p>
          </div>
          <Field label="Connection Type">
            <select
              value={edgeType}
              onChange={(e) => updateEdgeType(edge.id, e.target.value as EdgeType)}
              className="w-full px-2.5 py-1.5 text-xs bg-[#1e293b] text-[#f8fafc] border border-border rounded-md outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {Object.values(EDGE_TYPE_CONFIGS).map(cfg => (
                <option key={cfg.id} value={cfg.id} className="bg-[#0f172a] text-[#f8fafc] py-1">
                  {cfg.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </aside>
    );
  }

  if (!node) return null;

  const data = node.data;
  const techOptions = TECH_OPTIONS[data.category] ?? [];
  const activeAccent = data.accentColor ?? data.color ?? '#6366f1';

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
        <Field label="Label">
          <input
            ref={labelRef}
            value={localLabel}
            onChange={(e) => setLocalLabel(e.target.value)}
            onBlur={commitLabel}
            onKeyDown={(e) => e.key === 'Enter' && commitLabel()}
            className="w-full px-2.5 py-1.5 text-xs bg-muted border border-border rounded-md outline-none focus:ring-2 focus:ring-ring/30 font-medium"
          />
        </Field>

        {/* Description */}
        <Field label="Description">
          <textarea
            value={data.description ?? ''}
            onChange={(e) => updateNodeData(node.id, { description: e.target.value })}
            placeholder="What does this component do?"
            rows={3}
            className="w-full px-2.5 py-1.5 text-xs bg-muted border border-border rounded-md outline-none focus:ring-2 focus:ring-ring/30 resize-none placeholder:text-muted-foreground/60"
          />
        </Field>

        {/* Technology */}
        {techOptions.length > 0 && (
          <Field label="Technology">
            <select
              value={data.tech ?? ''}
              onChange={(e) => updateNodeData(node.id, { tech: e.target.value || undefined })}
              className="w-full px-2.5 py-1.5 text-xs bg-muted border border-border rounded-md outline-none focus:ring-2 focus:ring-ring/30 font-mono"
            >
              <option value="">— select —</option>
              {techOptions.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
        )}

        {/* Section 5 — Accent color with 8 swatches + default reset */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Accent Color</label>
            {data.accentColor && (
              <button
                onClick={() => updateNodeData(node.id, { accentColor: undefined })}
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                title="Reset to category color"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                Reset
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ACCENT_SWATCHES.map(({ color, label }) => (
              <button
                key={color}
                onClick={() => updateNodeData(node.id, { accentColor: color })}
                title={label}
                className="w-5 h-5 rounded-full transition-transform hover:scale-110 active:scale-95"
                style={{
                  background: color,
                  outline: data.accentColor === color ? `2px solid ${color}` : 'none',
                  outlineOffset: '2px',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Delete */}
      <div className="p-4 border-t border-border">
        <button
          onClick={() => removeNode(node.id)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete Node
        </button>
      </div>
    </aside>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}
