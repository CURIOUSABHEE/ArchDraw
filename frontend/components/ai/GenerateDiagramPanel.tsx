'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { X, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { useDiagramStore } from '@/store/diagramStore';
import type { Node, Edge } from 'reactflow';

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

  const wordCount = 0;
  const qualityColor = '#6366f1';
  const qualityWidth = '0%';

  return (
    <>
      {/* Backdrop blur overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-background/20 backdrop-blur-sm z-[999]"
        onClick={onClose}
      />
      
      {/* Panel */}
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[600px] h-auto max-h-[80vh] bg-background/80 backdrop-blur-xl border border-border/80 rounded-t-2xl z-[1000] flex flex-col shadow-2xl"
      >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
            <Sparkles size={14} className="text-white" />
          </div>
          <span className="text-sm font-bold text-foreground tracking-tight">AI Architect</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-muted-foreground">Multi-agent · Groq · Real-time canvas</span>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">

          {/* IDLE / COMING SOON */}
          {phase === 'idle' && (
            <motion.div 
              key="idle" 
              initial={{ opacity: 0, y: 8 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 py-10 text-center px-5"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-2">
                <Sparkles size={28} className="text-white" />
              </div>

              <div>
                <div className="text-base font-bold text-foreground mb-1.5">Coming Soon</div>
                <div className="text-sm text-muted-foreground leading-relaxed max-w-80">
                  AI-powered diagram generation is temporarily unavailable while we make improvements.
                </div>
              </div>

              <div className="bg-accent/50 border border-border rounded-lg p-3 mt-2">
                <div className="text-[11px] text-muted-foreground mb-2">What will be available:</div>
                <div className="flex flex-col gap-1.5 text-left">
                  {[
                    'Describe systems in plain English',
                    'Auto-generate architecture diagrams',
                    'Layer-based component layout',
                    'AI-powered explanations',
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                      <span className="text-xs text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={onClose}
                className="mt-2 px-6 py-2.5 text-sm font-medium bg-secondary text-secondary-foreground rounded-lg border border-border hover:bg-accent transition-colors"
              >
                Close
              </button>
            </motion.div>
          )}

          {/* ERROR */}
          {phase === 'error' && (
            <motion.div 
              key="error" 
              initial={{ opacity: 0, y: 8 }} 
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-4 py-10 text-center px-5"
            >
              <AlertCircle size={32} className="text-red-400" />
              
              <div>
                <div className="text-sm font-semibold text-red-400 mb-1.5">Generation Failed</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{errorMsg}</div>
              </div>

              <button
                onClick={onClose}
                className="px-6 py-2.5 text-sm font-medium bg-secondary text-secondary-foreground rounded-lg border border-border hover:bg-accent transition-colors"
              >
                Close
              </button>
            </motion.div>
          )}

          {/* CLARIFICATION */}
          {phase === 'clarifying' && (
            <motion.div 
              key="clarify" 
              initial={{ opacity: 0, y: 8 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0 }}
              className="flex flex-col gap-3"
            >
              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-3">
                <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Quick question</div>
                <div className="text-sm text-foreground leading-relaxed">{clarificationQ}</div>
              </div>
              <textarea 
                value={clarificationAnswer} 
                onChange={(e) => setClarificationAnswer(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder="Your answer..."
                rows={3}
                className="w-full bg-accent border border-input rounded-lg text-sm text-foreground p-2.5 outline-none resize-y font-inherit placeholder:text-muted-foreground"
              />
              <div className="flex gap-2">
                <button 
                  onClick={() => setPhase('idle')} 
                  className="flex-1 py-2 text-xs font-medium bg-secondary text-secondary-foreground rounded-lg border border-border hover:bg-accent transition-colors"
                >
                  Back
                </button>
                <button 
                  onClick={() => {
                    if (clarificationAnswer.trim()) {
                      // runGeneration(`${description.trim()}\n\nAdditional context: ${clarificationAnswer.trim()}`);
                    }
                  }} 
                  className="flex-[2] py-2 text-xs font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg"
                >
                  Continue →
                </button>
              </div>
            </motion.div>
          )}

          {/* THINKING / STREAMING */}
          {(phase === 'thinking' || phase === 'streaming') && (
            <motion.div 
              key="thinking" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="flex flex-col gap-3"
            >
              <div className="flex items-start gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-3.5 h-3.5 border-2 border-muted border-t-indigo-500 rounded-full shrink-0 mt-0.5"
                />
                <div>
                  <div className="text-sm font-semibold text-foreground leading-snug">{statusMessage}</div>
                  {statusDetail && <div className="text-[10px] text-indigo-400 mt-1 leading-snug">{statusDetail}</div>}
                </div>
              </div>

              {/* Layer completion badges */}
              {layers.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-bold">Layers analysed</div>
                  {layers.map((l) => (
                    <motion.div 
                      key={l.layer}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 bg-accent rounded-md p-1.5 border"
                      style={{ borderColor: `${l.color}25` }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: l.color }} />
                      <span className="text-xs text-foreground flex-1">{l.name}</span>
                      <span className="text-[10px] font-bold" style={{ color: l.color }}>{l.serviceCount} services</span>
                      <CheckCircle2 size={11} style={{ color: l.color }} />
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Streaming counters */}
              {phase === 'streaming' && (
                <motion.div 
                  initial={{ opacity: 0, y: 2 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-accent border border-border rounded-lg p-3"
                >
                  <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-bold mb-2">Live canvas</div>
                  <div className="flex gap-3">
                    {[
                      { label: 'Nodes', value: streamProgress.nodes, total: streamProgress.totalNodes, color: '#6366f1' },
                      { label: 'Edges', value: streamProgress.edges, total: streamProgress.totalEdges, color: '#22d3ee' },
                    ].map((item) => (
                      <div key={item.label} className="flex-1">
                        <div className="text-[10px] text-muted-foreground mb-1">{item.label}</div>
                        <div className="h-0.5 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: item.color }}
                            animate={{ width: item.total > 0 ? `${(item.value / item.total) * 100}%` : '0%' }}
                            transition={{ duration: 0.1 }}
                          />
                        </div>
                        <div className="text-sm font-bold mt-1 tabular-nums" style={{ color: item.color }}>
                          {item.value} <span className="text-muted-foreground font-normal">/ {item.total}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              <button 
                onClick={() => { abortRef.current?.abort(); setPhase('idle'); }}
                className="w-full py-1.5 text-xs text-muted-foreground bg-transparent border border-border rounded-lg hover:bg-accent transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          )}

          {/* COMPLETE */}
          {phase === 'complete' && completeMeta && (
            <motion.div 
              key="complete" 
              initial={{ opacity: 0, scale: 0.97 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0 }}
              className="flex flex-col gap-2.5"
            >
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                >
                  <CheckCircle2 size={28} className="text-emerald-500 mx-auto mb-2.5" />
                </motion.div>
                <div className="text-sm font-bold text-emerald-400 mb-0.5 tracking-tight">{completeMeta.projectName}</div>
                <div className="text-xs text-emerald-400/80">{completeMeta.nodeCount} nodes · {completeMeta.edgeCount} edges</div>
                <div className="text-[10px] text-emerald-400/70 mt-1">Quality score: {completeMeta.criticScore}/10</div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => { setPhase('idle'); setLayers([]); }}
                  className="flex-1 py-2 text-xs font-medium bg-secondary text-secondary-foreground rounded-lg border border-border hover:bg-accent transition-colors"
                >
                  New
                </button>
                <button 
                  onClick={onClose}
                  className="flex-[2] py-2 text-xs font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg"
                >
                  View diagram
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </motion.div>
    </>
  );
}
