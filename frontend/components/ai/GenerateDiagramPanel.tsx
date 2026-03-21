'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { X, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { useDiagramStore } from '@/store/diagramStore';
import type { Node, Edge } from 'reactflow';

// SSE event types from the API
type SSEEvent =
  | { type: 'status'; phase: string; message: string; detail?: string }
  | { type: 'clarification'; question: string }
  | { type: 'layer_complete'; layer: string; layerName: string; serviceCount: number }
  | { type: 'stream_start'; totalNodes: number; totalEdges: number }
  | { type: 'add_node'; node: Node; index: number; total: number }
  | { type: 'nodes_complete'; nodeCount: number }
  | { type: 'add_edge'; edge: Edge; index: number; total: number }
  | { type: 'complete'; meta: { projectName: string; nodeCount: number; edgeCount: number; criticScore: number; customNodesCreated: number } }
  | { type: 'error'; message: string };

type Phase = 'idle' | 'thinking' | 'streaming' | 'complete' | 'error' | 'clarifying';

interface LayerStatus {
  layer: string;
  name: string;
  color: string;
  serviceCount: number;
}

interface Props {
  onClose: () => void;
}

const LAYER_META: Record<string, { color: string }> = {
  A: { color: '#6366f1' },
  B: { color: '#22d3ee' },
  C: { color: '#f59e0b' },
  D: { color: '#a78bfa' },
};

export function GenerateDiagramPanel({ onClose }: Props) {
  const [description, setDescription] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [statusDetail, setStatusDetail] = useState('');
  const [layers, setLayers] = useState<LayerStatus[]>([]);
  const [streamProgress, setStreamProgress] = useState({ nodes: 0, totalNodes: 0, edges: 0, totalEdges: 0 });
  const [completeMeta, setCompleteMeta] = useState<{ projectName: string; nodeCount: number; edgeCount: number; criticScore: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [clarificationQ, setClarificationQ] = useState('');
  const [clarificationAnswer, setClarificationAnswer] = useState('');

  const abortRef = useRef<AbortController | null>(null);
  const nodeBufferRef = useRef<Node[]>([]);
  const edgeBufferRef = useRef<Edge[]>([]);
  const drainingNodes = useRef(false);
  const drainingEdges = useRef(false);

  const setNodes = useDiagramStore((s) => s.setNodes);
  const setEdges = useDiagramStore((s) => s.setEdges);
  const appendNode = useDiagramStore((s) => s.appendNode);
  const appendEdge = useDiagramStore((s) => s.appendEdge);
  const pushHistory = useDiagramStore((s) => s.pushHistory);
  const fitView = useDiagramStore((s) => s.fitView);

  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  const drainNodes = useCallback(async () => {
    if (drainingNodes.current) return;
    drainingNodes.current = true;
    while (nodeBufferRef.current.length > 0) {
      const node = nodeBufferRef.current.shift()!;
      appendNode(node);
      setStreamProgress((p) => ({ ...p, nodes: p.nodes + 1 }));
      await new Promise((r) => setTimeout(r, 80));
    }
    drainingNodes.current = false;
  }, [appendNode]);

  const drainEdges = useCallback(async () => {
    if (drainingEdges.current) return;
    drainingEdges.current = true;
    // Wait for node drain to finish + 200ms pause
    await new Promise((r) => {
      const interval = setInterval(() => {
        if (!drainingNodes.current && nodeBufferRef.current.length === 0) {
          clearInterval(interval);
          r(undefined);
        }
      }, 50);
    });
    await new Promise((r) => setTimeout(r, 200));
    while (edgeBufferRef.current.length > 0) {
      const edge = edgeBufferRef.current.shift()!;
      appendEdge(edge);
      setStreamProgress((p) => ({ ...p, edges: p.edges + 1 }));
      await new Promise((r) => setTimeout(r, 60));
    }
    drainingEdges.current = false;
    // Fit view after all edges are placed
    setTimeout(() => fitView?.(), 200);
  }, [appendEdge, fitView]);

  const handleSSEEvent = useCallback((event: SSEEvent) => {
    switch (event.type) {
      case 'status':
        setPhase('thinking');
        setStatusMessage(event.message ?? '');
        setStatusDetail(typeof event.detail === 'string' ? event.detail : '');
        break;

      case 'clarification':
        setClarificationQ(typeof event.question === 'string' ? event.question : 'Could you clarify?');
        setPhase('clarifying');
        break;

      case 'layer_complete':
        setLayers((prev) => {
          if (prev.find((l) => l.layer === event.layer)) return prev;
          return [...prev, {
            layer: event.layer,
            name: event.layerName,
            color: LAYER_META[event.layer]?.color ?? '#6b7280',
            serviceCount: event.serviceCount,
          }];
        });
        break;

      case 'stream_start':
        pushHistory();
        setNodes([]);
        setEdges([]);
        nodeBufferRef.current = [];
        edgeBufferRef.current = [];
        drainingNodes.current = false;
        drainingEdges.current = false;
        setStreamProgress({ nodes: 0, totalNodes: event.totalNodes, edges: 0, totalEdges: event.totalEdges });
        setPhase('streaming');
        setStatusMessage('Building your diagram...');
        break;

      case 'add_node':
        nodeBufferRef.current.push(event.node);
        drainNodes();
        break;

      case 'nodes_complete':
        drainEdges();
        break;

      case 'add_edge':
        edgeBufferRef.current.push(event.edge);
        break;

      case 'complete':
        setCompleteMeta(event.meta);
        setPhase('complete');
        toast.success(`✓ ${event.meta.projectName} — ${event.meta.nodeCount} nodes, ${event.meta.edgeCount} edges`);
        
        // Fit view after all nodes finish rendering — ensures Layer D is never clipped
        setTimeout(() => {
          const store = useDiagramStore.getState();
          if (typeof store.fitView === 'function') {
            store.fitView({ padding: 0.12, duration: 500, maxZoom: 1 });
          }
        }, 600);
        break;

      case 'error':
        setPhase('error');
        setErrorMsg(typeof event.message === 'string' ? event.message : 'Unknown error');
        break;
    }
  }, [pushHistory, setNodes, setEdges, drainNodes, drainEdges]);

  const runGeneration = useCallback(async (text: string) => {
    setPhase('thinking');
    setLayers([]);
    setStatusMessage('Analysing your description...');
    setStatusDetail('');
    nodeBufferRef.current = [];
    edgeBufferRef.current = [];

    abortRef.current = new AbortController();

    try {
      const response = await fetch('/api/generate-diagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: text }),
        signal: abortRef.current.signal,
      });

      if (!response.ok || !response.body) throw new Error(`Server error: ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';
        for (const part of parts) {
          if (!part.startsWith('data: ')) continue;
          try { handleSSEEvent(JSON.parse(part.slice(6))); } catch { /* skip malformed */ }
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setPhase('error');
      setErrorMsg((err as Error).message ?? 'Generation failed');
    }
  }, [handleSSEEvent]);

  const wordCount = description.trim().split(/\s+/).filter(Boolean).length;
  const qualityColor = wordCount < 10 ? '#f59e0b' : wordCount < 30 ? '#6366f1' : '#22d3ee';
  const qualityWidth = `${Math.min(100, (wordCount / 60) * 100)}%`;

  return (
    <motion.div
      initial={{ y: '100%', opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 600, height: 'auto', maxHeight: '80vh',
        background: '#09090b', borderTop: '1px solid #18181b', borderLeft: '1px solid #18181b', borderRight: '1px solid #18181b',
        borderRadius: '16px 16px 0 0',
        zIndex: 1000, display: 'flex', flexDirection: 'column',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        boxShadow: '0 -20px 60px rgba(0,0,0,.5)',
      }}
    >
      {/* Header */}
      <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid #18181b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={12} color="#fff" />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fafafa', letterSpacing: '-0.01em' }}>AI Architect</span>
          </div>
          <div style={{ fontSize: 10, color: '#52525b', marginTop: 2, marginLeft: 33 }}>Multi-agent · Groq · Real-time canvas</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#52525b', cursor: 'pointer', padding: 5, borderRadius: 6, display: 'flex' }}>
          <X size={15} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
        <AnimatePresence mode="wait">

          {/* IDLE / ERROR */}
          {(phase === 'idle' || phase === 'error') && (
            <motion.div key="idle" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

              {phase === 'error' && (
                <div style={{ background: '#1c0a0a', border: '1px solid #450a0a', borderRadius: 8, padding: '9px 11px', display: 'flex', gap: 7 }}>
                  <AlertCircle size={12} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 11, color: '#fca5a5', lineHeight: 1.5 }}>{errorMsg}</span>
                </div>
              )}

              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#52525b', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }}>Describe your system</div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && description.trim().length >= 3) {
                      runGeneration(description.trim());
                    }
                  }}
                  placeholder={'Describe your system — brief or detailed.\nExamples:\n• "App like Uber"\n• "Food delivery app with real-time tracking, payments, and push notifications"'}
                  rows={7}
                  style={{
                    width: '100%', background: '#0f0f12', border: '1.5px solid #27272a',
                    borderRadius: 8, color: '#e4e4e7', fontSize: 12, padding: '9px 11px',
                    outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.65,
                    caretColor: '#6366f1', boxSizing: 'border-box',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#6366f1'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#27272a'; }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span style={{ fontSize: 10, color: '#3f3f46' }}>More detail = better diagram</span>
                  <span style={{ fontSize: 10, color: qualityColor, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{wordCount}w</span>
                </div>
                <div style={{ height: 2, background: '#18181b', borderRadius: 1, marginTop: 3 }}>
                  <div style={{ height: '100%', width: qualityWidth, background: qualityColor, borderRadius: 1, transition: 'all 0.3s' }} />
                </div>
              </div>

              <button
                onClick={() => { if (description.trim().length >= 3) runGeneration(description.trim()); }}
                disabled={description.trim().length < 3}
                style={{
                  background: description.trim().length >= 3
                    ? 'linear-gradient(135deg, #6366f1, #a855f7)' : '#18181b',
                  color: description.trim().length >= 3 ? '#fff' : '#52525b',
                  border: 'none', borderRadius: 8, padding: '10px 0', fontSize: 13,
                  fontWeight: 600, cursor: description.trim().length >= 3 ? 'pointer' : 'not-allowed',
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  transition: 'opacity 0.2s', letterSpacing: '-0.01em',
                }}
              >
                <Sparkles size={13} /> Generate Diagram <span style={{ fontSize: 10, opacity: 0.65 }}>⌘↵</span>
              </button>

              {/* Example prompts */}
              <div style={{ borderTop: '1px solid #18181b', paddingTop: 10 }}>
                <div style={{ fontSize: 10, color: '#3f3f46', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>Quick examples</div>
                {[
                  'App like Uber',
                  'E-commerce platform with payments and inventory',
                  'Real-time chat app with media sharing',
                  'Food delivery app like Zomato',
                ].map((ex, i) => (
                  <button key={i} onClick={() => setDescription(ex)}
                    style={{ display: 'block', width: '100%', textAlign: 'left', background: '#0f0f12', border: '1px solid #27272a', borderRadius: 6, padding: '6px 9px', fontSize: 11, color: '#a1a1aa', cursor: 'pointer', marginBottom: 4, transition: 'border-color 0.15s, color 0.15s', letterSpacing: '-0.01em' }}
                    onMouseEnter={(e) => { (e.currentTarget).style.borderColor = '#6366f1'; (e.currentTarget).style.color = '#e4e4e7'; }}
                    onMouseLeave={(e) => { (e.currentTarget).style.borderColor = '#27272a'; (e.currentTarget).style.color = '#a1a1aa'; }}>
                    {ex}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* CLARIFICATION */}
          {phase === 'clarifying' && (
            <motion.div key="clarify" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ background: '#111118', border: '1px solid #4338ca', borderRadius: 8, padding: '12px 13px' }}>
                <div style={{ fontSize: 10, color: '#818cf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>Quick question</div>
                <div style={{ fontSize: 13, color: '#e4e4e7', lineHeight: 1.6 }}>{clarificationQ}</div>
              </div>
              <textarea value={clarificationAnswer} onChange={(e) => setClarificationAnswer(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder="Your answer..."
                rows={3}
                style={{ width: '100%', background: '#0f0f12', border: '1.5px solid #27272a', borderRadius: 8, color: '#e4e4e7', fontSize: 12, padding: '9px 11px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setPhase('idle')} style={{ flex: 1, background: 'none', border: '1px solid #27272a', borderRadius: 7, color: '#71717a', padding: '8px 0', fontSize: 12, cursor: 'pointer' }}>Back</button>
                <button onClick={() => {
                  if (clarificationAnswer.trim()) {
                    runGeneration(`${description.trim()}\n\nAdditional context: ${clarificationAnswer.trim()}`);
                  }
                }} style={{ flex: 2, background: 'linear-gradient(135deg, #6366f1, #a855f7)', border: 'none', borderRadius: 7, color: '#fff', padding: '8px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  Continue →
                </button>
              </div>
            </motion.div>
          )}

          {/* THINKING / STREAMING */}
          {(phase === 'thinking' || phase === 'streaming') && (
            <motion.div key="thinking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{ width: 14, height: 14, border: '2px solid #27272a', borderTopColor: '#6366f1', borderRadius: '50%', flexShrink: 0, marginTop: 1 }}
                />
                <div>
                  <div style={{ fontSize: 12, color: '#fafafa', fontWeight: 600, lineHeight: 1.4 }}>{statusMessage}</div>
                  {statusDetail && <div style={{ fontSize: 10, color: '#6366f1', marginTop: 3, lineHeight: 1.4 }}>{statusDetail}</div>}
                </div>
              </div>

              {/* Layer completion badges */}
              {layers.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ fontSize: 10, color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 700 }}>Layers analysed</div>
                  {layers.map((l) => (
                    <motion.div key={l.layer}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#0f0f12', borderRadius: 6, padding: '6px 9px', border: `1px solid ${l.color}25` }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: l.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: '#d4d4d8', flex: 1 }}>{l.name}</span>
                      <span style={{ fontSize: 10, color: l.color, fontWeight: 700 }}>{l.serviceCount} services</span>
                      <CheckCircle2 size={11} color={l.color} />
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Streaming counters */}
              {phase === 'streaming' && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: '#0f0f12', border: '1px solid #18181b', borderRadius: 8, padding: '11px 12px' }}>
                  <div style={{ fontSize: 10, color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 700, marginBottom: 8 }}>Live canvas</div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {[
                      { label: 'Nodes', value: streamProgress.nodes, total: streamProgress.totalNodes, color: '#6366f1' },
                      { label: 'Edges', value: streamProgress.edges, total: streamProgress.totalEdges, color: '#22d3ee' },
                    ].map((item) => (
                      <div key={item.label} style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, color: '#52525b', marginBottom: 4 }}>{item.label}</div>
                        <div style={{ height: 3, background: '#27272a', borderRadius: 2, overflow: 'hidden' }}>
                          <motion.div
                            style={{ height: '100%', background: item.color, borderRadius: 2 }}
                            animate={{ width: item.total > 0 ? `${(item.value / item.total) * 100}%` : '0%' }}
                            transition={{ duration: 0.1 }}
                          />
                        </div>
                        <div style={{ fontSize: 12, color: item.color, fontWeight: 700, marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>
                          {item.value} <span style={{ color: '#52525b', fontWeight: 400 }}>/ {item.total}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              <button onClick={() => { abortRef.current?.abort(); setPhase('idle'); }}
                style={{ background: 'none', border: '1px solid #27272a', borderRadius: 7, color: '#52525b', padding: '7px 0', fontSize: 11, cursor: 'pointer', width: '100%' }}>
                Cancel
              </button>
            </motion.div>
          )}

          {/* COMPLETE */}
          {phase === 'complete' && completeMeta && (
            <motion.div key="complete" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ background: '#051a0f', border: '1px solid #14532d', borderRadius: 10, padding: '16px', textAlign: 'center' }}>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 18 }}>
                  <CheckCircle2 size={28} color="#22c55e" style={{ margin: '0 auto 10px' }} />
                </motion.div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#4ade80', marginBottom: 3, letterSpacing: '-0.01em' }}>{completeMeta.projectName}</div>
                <div style={{ fontSize: 12, color: '#86efac' }}>{completeMeta.nodeCount} nodes · {completeMeta.edgeCount} edges</div>
                <div style={{ fontSize: 10, color: '#4ade80', marginTop: 4, opacity: 0.7 }}>Quality score: {completeMeta.criticScore}/10</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setPhase('idle'); setDescription(''); setLayers([]); }}
                  style={{ flex: 1, background: 'none', border: '1px solid #27272a', borderRadius: 7, color: '#71717a', padding: '8px 0', fontSize: 11, cursor: 'pointer' }}>
                  New
                </button>
                <button onClick={onClose}
                  style={{ flex: 2, background: 'linear-gradient(135deg, #6366f1, #a855f7)', border: 'none', borderRadius: 7, color: '#fff', padding: '8px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  View diagram
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </motion.div>
  );
}
