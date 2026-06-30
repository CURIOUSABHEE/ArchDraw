'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { X, Check, AlertCircle, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDiagramStore } from '@/store/diagramStore';
import { reactFlowToMermaid } from '@/lib/ai/pipeline/mermaid-pipeline/mermaidTranslator';
import { runMermaidPipeline } from '@/lib/mermaid/pipeline';
import { toast } from 'sonner';

interface MermaidCodePanelProps {
  onClose: () => void;
}

function hashNodesEdges(nodes: any[], edges: any[]): string {
  let h = `${nodes.length}:${edges.length}`;
  for (const n of nodes) h += `|${n.id}:${n.type}:${(n as any).parentNode || ''}`;
  for (const e of edges) h += `|${e.id}:${e.source}-${e.target}`;
  return h;
}

export function MermaidCodePanel({ onClose }: MermaidCodePanelProps) {
  const { nodes, edges, importDiagram } = useDiagramStore();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const isFocusedRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastProcessedRef = useRef<string>('');


  const activeLayoutPresetId = useDiagramStore((s) => s.activeLayoutPresetId);
  const mermaidDirection = activeLayoutPresetId === 'layered-lr' ? 'LR' : 'TD';

  // Sync canvas changes to code panel only when structure actually changes
  const structureHash = useMemo(() => hashNodesEdges(nodes, edges), [nodes, edges]);
  useEffect(() => {
    if (isFocusedRef.current) return;
    const currentMermaid = reactFlowToMermaid(nodes, edges, mermaidDirection);
    setCode(currentMermaid);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [structureHash, mermaidDirection]);

  // Copy code handler
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Mermaid code copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy code');
    }
  };

  // Real-time parsed update function
  const handleCodeChange = (newCode: string) => {
    setCode(newCode);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (!newCode.trim()) {
        setError('Diagram code cannot be empty.');
        return;
      }

      if (newCode === lastProcessedRef.current) return;

      try {
        const result = runMermaidPipeline(newCode);

        if (!result.success) {
          setError(result.warnings.join('; '));
          return;
        }

        const processedNodes = result.nodes.map(node => {
          const isGroup = node.type === 'groupNode' || (node.data?.isGroup as boolean);
          const mappedNode: any = {
            id: node.id,
            type: isGroup ? 'groupNode' : 'shapeNode',
            position: { ...node.position },
            data: { ...node.data },
            width: node.width,
            height: node.height,
            style: node.style ? { ...node.style } : undefined,
            zIndex: node.zIndex,
          };
          if (node.parentNode) {
            mappedNode.parentId = node.parentNode;
            mappedNode.parentNode = node.parentNode;
            mappedNode.extent = 'parent';
          }
          return mappedNode;
        });

        const processedEdges = result.edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
          type: 'simpleFloating',
          label: edge.label,
          data: edge.data,
          animated: edge.animated,
        }));

        importDiagram(processedNodes, processedEdges);
        lastProcessedRef.current = newCode;
        setError(null);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(`Pipeline error: ${msg}`);
      }
    }, 400);
  };

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 20, stiffness: 150 }}
      className="fixed right-4 top-[80px] bottom-[180px] w-96 md:w-[450px] z-50 flex flex-col overflow-hidden bg-card/95 backdrop-blur-md border border-border/40 shadow-soft-3 rounded-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/10">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-primary" />
          <h2 className="text-sm font-semibold text-foreground">Mermaid Code Editor</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="floating-icon-btn !w-8 !h-8"
            title="Copy Code"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="floating-icon-btn !w-8 !h-8"
            title="Close Panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Code Area */}
      <div className="flex-1 p-4 flex flex-col gap-3 overflow-hidden">
        <textarea
          value={code}
          onChange={(e) => handleCodeChange(e.target.value)}
          onFocus={() => { isFocusedRef.current = true; }}
          onBlur={() => { isFocusedRef.current = false; }}
          spellCheck={false}
          className="flex-1 w-full p-4 font-mono text-xs text-foreground bg-muted/20 border border-border/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none rounded-xl resize-none leading-relaxed transition-all"
          placeholder="graph TD&#10;  subgraph CLIENT[&quot;Client Tier&quot;]&#10;    CV[&quot;Customer View&quot;]&#10;  end"
        />

        {/* Status / Errors */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="flex items-start gap-2.5 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold">Syntax Error</p>
                <p className="opacity-90 leading-relaxed break-words">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
