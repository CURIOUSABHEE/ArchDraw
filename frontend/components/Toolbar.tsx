'use client';

import { useRef, useState } from 'react';
import { generatePureSVG } from '@/lib/svgExport';
import {
  Download, Trash2, Upload, ChevronDown,
  Undo2, Redo2, Share2, Loader2, Check,
  GraduationCap, Sparkles, MoreHorizontal, HelpCircle,
  Plus, X, PanelLeftClose, LayoutTemplate, Pin, FolderOpen,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { useDiagramStore } from '@/store/diagramStore';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { ShareModal } from '@/components/ShareModal';
import { TemplateModal } from '@/components/TemplateModal';
import { EmailCaptureModal, type EmailCaptureReason } from '@/components/EmailCaptureModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { isSupabaseConfigured, getSupabaseClient } from '@/lib/supabase';
import { useOnboardingStore } from '@/store/onboardingStore';
import { AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '@/components/ThemeToggle';
import { EDGE_TYPE_CONFIGS, type EdgeType, type PathType } from '@/data/edgeTypes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type ExportFormat = 'png-dark-1x' | 'png-dark-2x' | 'png-dark-4x' | 'png-light-1x' | 'png-light-2x' | 'png-light-4x' | 'png-transparent-1x' | 'png-transparent-2x' | 'png-transparent-4x' | 'svg-dark' | 'svg-light' | 'svg-transparent' | 'json' | 'pdf' | 'html-embed';

function generateEmbedHTML(nodes: { id: string; width?: number | null; height?: number | null; position: { x: number; y: number }; data?: any }[], edges: { source: string; target: string; data?: any; style?: any }[]): string {
  const svgWidth = 1200;
  const svgHeight = 800;
  
  const nodeMap = new Map<string, { x: number; y: number; width: number; height: number }>();
  const renderedNodes = nodes.map(node => {
    const width = node.width || 140;
    const height = node.height || 72;
    nodeMap.set(node.id, { x: node.position.x, y: node.position.y, width, height });
    return {
      ...node,
      width,
      height,
      color: node.data?.color || '#6366f1',
      label: node.data?.label || node.id,
    };
  });
  
  const renderedEdges = edges.map(edge => ({
    source: edge.source,
    target: edge.target,
    label: edge.data?.label || '',
    color: edge.style?.stroke || '#64748b',
  }));
  
  const nodesSVG = renderedNodes.map(node => {
    const { position: { x, y }, width, height, color, label } = node;
    return `
    <g transform="translate(${x}, ${y})" class="node">
      <rect width="${width}" height="${height}" rx="8" fill="#1e293b" stroke="${color}" stroke-width="2"/>
      <rect width="${width}" height="4" rx="2" fill="${color}"/>
      <text x="${width/2}" y="${height/2 + 5}" text-anchor="middle" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="12" font-weight="500">${label}</text>
    </g>`;
  }).join('');
  
  const edgesSVG = renderedEdges.map(edge => {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);
    if (!source || !target) return '';
    
    const sx = source.x + source.width;
    const sy = source.y + source.height / 2;
    const tx = target.x;
    const ty = target.y + target.height / 2;
    const mx = (sx + tx) / 2;
    
    const path = `M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ty}, ${tx} ${ty}`;
    const labelX = (sx + tx) / 2;
    const labelY = (sy + ty) / 2 - 8;
    
    return `
    <g class="edge">
      <path d="${path}" fill="none" stroke="${edge.color}" stroke-width="2" marker-end="url(#arrowhead)"/>
      ${edge.label ? `<text x="${labelX}" y="${labelY}" text-anchor="middle" fill="#94a3b8" font-family="system-ui,sans-serif" font-size="10">${edge.label}</text>` : ''}
    </g>`;
  }).join('');
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ArchFlow Diagram</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      background: #0f172a; 
      min-height: 100vh; 
      display: flex; 
      align-items: center; 
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: #1e293b;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.08);
      padding: 20px;
      max-width: 100%;
      overflow: auto;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .title {
      color: #f1f5f9;
      font-family: system-ui, sans-serif;
      font-size: 14px;
      font-weight: 600;
    }
    .badge {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 10px;
      font-weight: 500;
    }
    svg { display: block; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="title">Architecture Diagram</span>
      <span class="badge">Created with ArchFlow</span>
    </div>
    <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#64748b"/>
        </marker>
      </defs>
      <!-- Grid pattern -->
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" stroke-width="0.5" opacity="0.5"/>
      </pattern>
      <rect width="100%" height="100%" fill="url(#grid)"/>
      <!-- Edges -->
      ${edgesSVG}
      <!-- Nodes -->
      ${nodesSVG}
    </svg>
  </div>
</body>
</html>`;
}

function formatRelative(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function Toolbar() {
  const router = useRouter();
  const {
    clearDiagram, nodes, edges, importDiagram,
    undo, redo, past, future,
    canvases, activeCanvasId, addCanvas, removeCanvas, switchCanvas, renameCanvas,
    openCanvas, closeCanvas, togglePinCanvas, getVisibleCanvases, getOverflowCanvases, openCanvasIds,
    savingState, userProfile, setSidebarOpen, sidebarOpen,
  } = useDiagramStore();

  const { user } = useAuthStore();
  const isGuest = !user;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [embedUrl, setEmbedUrl] = useState('');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [emailCapture, setEmailCapture] = useState<EmailCaptureReason | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);
  const [selectedEdgeType, setSelectedEdgeType] = useState<string>('smooth');
  const [overflowOpen, setOverflowOpen] = useState(false);

  const openGuide = useOnboardingStore((s) => s.open);

  const visibleCanvases = getVisibleCanvases();
  const overflowCanvases = getOverflowCanvases();
  const overflowCount = overflowCanvases.length;

  const normalizePathType = (type: string): string => {
    // Normalize invalid values to valid ones
    if (type === 'smoothstep') return 'smooth';
    if (!['smooth', 'bezier', 'step', 'straight'].includes(type)) return 'smooth';
    return type;
  };

  const updateAllEdgesPathType = (pathType: PathType) => {
    const normalizedType = normalizePathType(pathType);
    if (edges.length === 0) {
      setSelectedEdgeType(normalizedType);
      return;
    }
    setSelectedEdgeType(normalizedType);
    const updatedEdges = edges.map((edge) => ({
      ...edge,
      data: {
        ...edge.data,
        connectionType: normalizedType,
        pathType: normalizedType,
      },
    }));
    const canvases = useDiagramStore.getState().canvases.map((c) =>
      c.id === useDiagramStore.getState().activeCanvasId
        ? { ...c, edges: updatedEdges, updatedAt: Date.now() }
        : c
    );
    useDiagramStore.setState({ edges: updatedEdges, canvases });
  };

  const activeCanvas = canvases.find((c) => c.id === activeCanvasId);

  const wasEmailModalDismissed = () =>
    typeof window !== 'undefined' && sessionStorage.getItem('emailModalDismissed') === 'true';

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const doExport = async (format: ExportFormat) => {
    setExportOpen(false);
    if (format === 'json') {
      const blob = new Blob([JSON.stringify({ nodes, edges }, null, 2)], { type: 'application/json' });
      downloadFile(blob, 'diagram.json');
      toast.success('Exported as JSON');
      return;
    }
    if (format === 'html-embed') {
      const htmlContent = generateEmbedHTML(nodes, edges);
      const iframeCode = `<iframe 
  src="data:text/html,${encodeURIComponent(htmlContent)}" 
  width="100%" 
  height="600" 
  style="border:none;border-radius:12px;"
  title="ArchFlow Diagram"
></iframe>`;
      await navigator.clipboard.writeText(iframeCode);
      toast.success('Embed code (iframe) copied to clipboard');
      return;
    }
    
    const isSvg = format.startsWith('svg-');
    const isPng = format.startsWith('png-');
    
    const bgType = format.includes('dark') ? 'dark' : format.includes('light') ? 'light' : 'transparent';
    const bgColor = bgType === 'dark' ? '#0f172a' : bgType === 'light' ? '#ffffff' : undefined;
    
    const isFullDiagram = true;
    
    const { fitView } = useDiagramStore.getState();
    
    setIsExporting(true);
    
    try {
      if (isSvg) {
        const { nodes, edges } = useDiagramStore.getState();
        const isDark = bgType === 'dark';
        const bg = bgType === 'dark' ? '#0f172a' : bgType === 'light' ? '#ffffff' : 'transparent';
        
        fitView({ padding: 0.1, duration: 300 });
        await new Promise((r) => setTimeout(r, 350));
        
        const svgContent = generatePureSVG(nodes, edges, isDark, bg || '#0f172a');
        
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        
        const MAX_SIZE = 3 * 1024 * 1024;
        if (blob.size > MAX_SIZE) {
          const { toPng } = await import('html-to-image');
          const element = document.querySelector('.react-flow__viewport') as HTMLElement | null;
          if (!element) return;
          const pngDataUrl = await toPng(element, {
            backgroundColor: bgColor,
            pixelRatio: 2,
            cacheBust: true,
            filter: (node: HTMLElement) => {
              const cls = node.classList;
              if (!cls) return true;
              return (
                !cls.contains('react-flow__minimap') &&
                !cls.contains('react-flow__controls') &&
                !cls.contains('react-flow__panel') &&
                !cls.contains('react-flow__background')
              );
            },
          });
          const pngBlob = await (await fetch(pngDataUrl)).blob();
          downloadFile(pngBlob, 'archdraw-export.png');
          toast.warning('SVG too large, exported as PNG instead');
        } else {
          downloadFile(blob, 'archdraw-export.svg');
          toast.success('Exported as SVG');
        }
        setIsExporting(false);
        return;
      }
      
      const { toPng } = await import('html-to-image');
      
      const pixelRatioMap: Record<string, number> = {
        'png-dark-1x': 1,
        'png-dark-2x': 2,
        'png-dark-4x': 4,
        'png-light-1x': 1,
        'png-light-2x': 2,
        'png-light-4x': 4,
        'png-transparent-1x': 1,
        'png-transparent-2x': 2,
        'png-transparent-4x': 4,
      };
      
      const pixelRatio = pixelRatioMap[format] || 2;
      
      const element = document.querySelector('.react-flow__viewport') as HTMLElement | null;
      if (!element) return;
      
      fitView({ padding: 0.1, duration: 300 });
      await new Promise((r) => setTimeout(r, 350));
      
      const dataUrl = await toPng(element, {
        backgroundColor: bgColor,
        pixelRatio,
        cacheBust: true,
        filter: (node: HTMLElement) => {
          const cls = node.classList;
          if (!cls) return true;
          return (
            !cls.contains('react-flow__minimap') &&
            !cls.contains('react-flow__controls') &&
            !cls.contains('react-flow__panel') &&
            !cls.contains('react-flow__background')
          );
        },
      });
      
      if (format.includes('pdf')) {
        const { jsPDF } = await import('jspdf');
        const img = new window.Image();
        img.src = dataUrl;
        await new Promise<void>((r) => { img.onload = () => r(); });
        const pdf = new jsPDF({
          orientation: img.width > img.height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [img.width, img.height],
        });
        pdf.addImage(dataUrl, 'PNG', 0, 0, img.width, img.height);
        pdf.save('archdraw-export.pdf');
        toast.success('Exported as PDF');
      } else {
        const suffix = pixelRatio === 1 ? '' : pixelRatio === 2 ? '@2x' : '@4x';
        downloadFile(await (await fetch(dataUrl)).blob(), `archdraw-export${suffix}.png`);
        toast.success(`Exported as PNG ${pixelRatio}x`);
      }
    } catch (err) {
      toast.error('Export failed. Please try again.');
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = (format: ExportFormat) => {
    if (isGuest && !wasEmailModalDismissed() && format !== 'json') {
      setEmailCapture('download');
      return;
    }
    doExport(format);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (Array.isArray(data.nodes) && Array.isArray(data.edges)) {
          importDiagram(data.nodes, data.edges);
          toast.success('Diagram imported');
        }
      } catch {
        toast.error('Invalid file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const doShare = async () => {
    if (!isSupabaseConfigured) {
      toast.error('Supabase is not configured');
      return;
    }
    setIsSharing(true);
    try {
      const supabase = getSupabaseClient();
      const canvasName = activeCanvas?.name ?? 'Untitled';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('shared_canvases')
        .insert({ canvas_name: canvasName, nodes, edges })
        .select('id')
        .single();
      if (error) {
        console.error('Share error:', error);
        toast.error('Could not generate link: ' + error.message);
        return;
      }
      if (!data?.id) {
        toast.error('Could not generate link, try again');
        return;
      }
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
      setShareUrl(baseUrl + '/share/' + data.id);
      setEmbedUrl(baseUrl + '/embed/' + data.id);
      setShareModalOpen(true);
    } catch (err) {
      console.error('Share exception:', err);
      toast.error('Could not generate link, try again');
    } finally {
      setIsSharing(false);
    }
  };

  const handleShare = () => {
    if (isGuest && !wasEmailModalDismissed()) {
      setEmailCapture('share');
      return;
    }
    doShare();
  };

  const handleClear = () => {
    if (nodes.length === 0) return;
    if (window.confirm('Clear all nodes and edges from the canvas?')) {
      clearDiagram();
      toast.success('Canvas cleared');
    }
  };

  const startRename = (id: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditDraft(currentName);
  };

  const commitRename = () => {
    if (editingId && editDraft.trim()) {
      renameCanvas(editingId, editDraft.trim());
    }
    setEditingId(null);
  };

  const handleCloseClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const canvas = canvases.find((c) => c.id === id);
    if (canvas && canvas.nodes.length > 0) {
      setConfirmDeleteId(id);
    } else {
      removeCanvas(id);
    }
  };

  return (
    <>
      {/* Gradient accent line at top */}
      <div 
        className="h-[2px] w-full"
        style={{
          background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)',
        }}
      />
      <header 
        className="h-12 flex items-center justify-between px-4 z-30 shrink-0 border-b"
        style={{
          backgroundColor: 'var(--card)',
          borderColor: 'var(--border)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* LEFT: Sidebar toggle + Canvas tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const newState = !sidebarOpen;
              setSidebarOpen(newState);
              if (newState) {
                window.dispatchEvent(new CustomEvent('close-canvas-sidebar'));
              }
            }}
            className="p-1.5 rounded-md transition-colors hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring"
            title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          >
            <PanelLeftClose className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* This button now toggles the canvas sidebar directly */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('toggle-canvas-sidebar'))}
            className="p-1.5 rounded-md transition-colors hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring"
            title="Toggle canvases"
          >
            <FolderOpen className="w-4 h-4 text-muted-foreground" />
          </button>

          <div className="flex items-center gap-1">
            {visibleCanvases.map((canvas) => {
              const isActive = canvas.id === activeCanvasId;
              const isEditing = editingId === canvas.id;

              return (
                <div
                  key={canvas.id}
                  role="tab"
                  onClick={() => !isEditing && switchCanvas(canvas.id)}
                  onDoubleClick={(e) => isEditing ? undefined : startRename(canvas.id, canvas.name, e)}
                  aria-selected={isActive}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isEditing) {
                      switchCanvas(canvas.id);
                    }
                  }}
                  className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring ${
                    isActive
                      ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
                  }`}
                >
                  {isEditing ? (
                    <input
                      ref={editInputRef}
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); commitRename(); }
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-transparent outline-none border-none text-xs font-medium w-20"
                      autoFocus
                    />
                  ) : (
                    <span
                      title={canvas.updatedAt ? `Last edited ${formatRelative(canvas.updatedAt)}` : canvas.name}
                    >
                      {canvas.name}
                    </span>
                  )}

                  {canvases.length > 1 && !isEditing && (
                    <button
                      onClick={(e) => handleCloseClick(canvas.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-destructive/15 hover:text-destructive focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}

            {overflowCount > 0 && (
              <DropdownMenu 
                open={overflowOpen} 
                onOpenChange={(open) => {
                  if (open && sidebarOpen) {
                    setSidebarOpen(false);
                  }
                  setOverflowOpen(open);
                }}
              >
                <DropdownMenuTrigger asChild>
                  <button 
                    className="h-7 px-2 text-xs font-medium text-muted-foreground hover:text-foreground bg-transparent border-0 rounded-md hover:bg-accent"
                    onClick={() => {
                      if (!overflowOpen) {
                        window.dispatchEvent(new CustomEvent('open-canvas-sidebar'));
                      }
                    }}
                  >
                    +{overflowCount} <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${overflowOpen ? 'rotate-180' : ''}`} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="max-h-60 overflow-auto">
                  {overflowCanvases.map((canvas) => (
                    <DropdownMenuItem 
                      key={canvas.id}
                      onClick={() => {
                        openCanvas(canvas.id);
                        setOverflowOpen(false);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {canvas.isPinned && <span className="text-amber-500">📌</span>}
                        <span>{canvas.name}</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <button
              onClick={() => addCanvas()}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-all focus:outline-none focus:ring-2 focus:ring-ring"
              title="New canvas"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* CENTER: Context info */}
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
          <span>{nodes.length} nodes</span>
          <span className="w-px h-3 bg-border/50" />
          <span>{edges.length} edges</span>
          <span className="w-px h-3 bg-border/50" />
          <Select value={selectedEdgeType} onValueChange={(v) => updateAllEdgesPathType(v as PathType)}>
            <SelectTrigger className="h-7 w-32 text-[11px] gap-1">
              <SelectValue placeholder="Edge style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="smooth">
                <div className="flex items-center gap-3">
                  <svg width="40" height="16" viewBox="0 0 40 16" className="overflow-visible">
                    <path d="M2,8 Q10,2 20,8 T38,8" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                  <span>Smooth</span>
                </div>
              </SelectItem>
              <SelectItem value="bezier">
                <div className="flex items-center gap-3">
                  <svg width="40" height="16" viewBox="0 0 40 16" className="overflow-visible">
                    <path d="M2,12 C8,2 15,14 38,4" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                  <span>Bezier</span>
                </div>
              </SelectItem>
              <SelectItem value="step">
                <div className="flex items-center gap-3">
                  <svg width="40" height="16" viewBox="0 0 40 16" className="overflow-visible">
                    <path d="M2,12 L12,12 L12,4 L38,4" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                  <span>Step</span>
                </div>
              </SelectItem>
              <SelectItem value="straight">
                <div className="flex items-center gap-3">
                  <svg width="40" height="16" viewBox="0 0 40 16" className="overflow-visible">
                    <path d="M2,8 L38,8" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                  <span>Straight</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          {userProfile && savingState !== 'idle' && (
            <>
              <span className="w-px h-3 bg-border/50" />
              <span className="flex items-center gap-1">
                {savingState === 'saving' ? (
                  <><Loader2 className="w-3 h-3 animate-spin" /> Saving</>
                ) : (
                  <><Check className="w-3 h-3 text-emerald-500" /> Saved</>
                )}
              </span>
            </>
          )}
        </div>

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={undo}
            disabled={!past.length}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            title="Undo (Cmd+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={!future.length}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            title="Redo (Cmd+Shift+Z)"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <span className="w-px h-4 bg-border/50 mx-1" />

          <ThemeToggle />

          <span className="w-px h-4 bg-border/50 mx-1" />

          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-ai-generate'))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 text-foreground border border-indigo-500/30 transition-all"
            title="AI Generate Architecture"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Generate</span>
          </button>

          <button
            onClick={handleShare}
            disabled={isSharing || nodes.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent/60 hover:bg-accent text-foreground transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSharing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>Share</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setExportOpen(!exportOpen)}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent/60 hover:bg-accent text-foreground transition-all disabled:opacity-40"
            >
              {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>Export</span>
              <ChevronDown className="w-3 h-3 ml-0.5" />
            </button>

            {exportOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setExportOpen(false)} />
                <div
                  className="absolute right-0 top-full mt-2 w-56 rounded-xl overflow-hidden z-30 bg-card/98 border border-border/80 shadow-lg backdrop-blur-md"
                >
                  <div className="px-3 py-2 border-b border-border/50">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">PNG - Dark</p>
                  </div>
                  {([
                    { label: 'Standard (1x)', format: 'png-dark-1x' },
                    { label: 'High-Res (2x)', format: 'png-dark-2x' },
                    { label: 'Ultra (4x)', format: 'png-dark-4x' },
                  ] as { label: string; format: ExportFormat }[]).map(({ label, format }) => (
                    <button
                      key={format}
                      onClick={() => handleExport(format)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                  <div className="px-3 py-2 border-t border-b border-border/50">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">PNG - Light</p>
                  </div>
                  {([
                    { label: 'Standard (1x)', format: 'png-light-1x' },
                    { label: 'High-Res (2x)', format: 'png-light-2x' },
                    { label: 'Ultra (4x)', format: 'png-light-4x' },
                  ] as { label: string; format: ExportFormat }[]).map(({ label, format }) => (
                    <button
                      key={format}
                      onClick={() => handleExport(format)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                  <div className="px-3 py-2 border-t border-b border-border/50">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">PNG - Transparent</p>
                  </div>
                  {([
                    { label: 'Standard (1x)', format: 'png-transparent-1x' },
                    { label: 'High-Res (2x)', format: 'png-transparent-2x' },
                    { label: 'Ultra (4x)', format: 'png-transparent-4x' },
                  ] as { label: string; format: ExportFormat }[]).map(({ label, format }) => (
                    <button
                      key={format}
                      onClick={() => handleExport(format)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                  <div className="px-3 py-2 border-t border-b border-border/50">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">SVG (Vector)</p>
                  </div>
                  {([
                    { label: 'Dark background', format: 'svg-dark' },
                    { label: 'Light background', format: 'svg-light' },
                    { label: 'Transparent', format: 'svg-transparent' },
                  ] as { label: string; format: ExportFormat }[]).map(({ label, format }) => (
                    <button
                      key={format}
                      onClick={() => handleExport(format)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                  <div className="px-3 py-2 border-t border-b border-border/50">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Other</p>
                  </div>
                  {([
                    { label: 'JSON', format: 'json' },
                    { label: 'PDF', format: 'pdf' },
                    { label: 'HTML Embed', format: 'html-embed' },
                  ] as { label: string; format: ExportFormat }[]).map(({ label, format }) => (
                    <button
                      key={format}
                      onClick={() => handleExport(format)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {moreOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setMoreOpen(false)} />
                <div
                  className="absolute right-0 top-full mt-2 w-48 rounded-xl overflow-hidden z-30 bg-card/98 border border-border/80 shadow-lg backdrop-blur-md"
                >
                  {/* Resources Section */}
                  <div className="px-3 py-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Resources</p>
                  </div>
                  <button
                    onClick={() => { router.push('/tutorials'); setMoreOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors"
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    Learn
                  </button>
                  <button
                    onClick={() => { openGuide(); setMoreOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    Guide
                  </button>
                  
                  {/* Workspace Section */}
                  <div className="px-3 pt-2 pb-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Workspace</p>
                  </div>
                  <button
                    onClick={() => { setTemplatesOpen(true); setMoreOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors"
                  >
                    <LayoutTemplate className="w-3.5 h-3.5" />
                    Templates
                  </button>
                  <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
                  <button
                    onClick={() => { fileInputRef.current?.click(); setMoreOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Import JSON
                  </button>
                  
                  {/* Danger Zone */}
                  <div className="border-t border-border/50 my-1.5" />
                  <button
                    onClick={() => { handleClear(); setMoreOpen(false); }}
                    disabled={nodes.length === 0}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear Canvas
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {shareModalOpen && (
        <ShareModal
          shareUrl={shareUrl}
          embedUrl={embedUrl}
          canvasName={activeCanvas?.name ?? 'Untitled'}
          onClose={() => setShareModalOpen(false)}
        />
      )}
      {emailCapture && (
        <EmailCaptureModal
          reason={emailCapture}
          onClose={() => setEmailCapture(null)}
        />
      )}
      <AnimatePresence>
      </AnimatePresence>
      {templatesOpen && <TemplateModal onClose={() => setTemplatesOpen(false)} />}

      {/* Delete confirmation modal */}
      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        title="Delete canvas?"
        description="This canvas has nodes. Deleting it is permanent."
        confirmText="Delete"
        destructive
        onConfirm={() => {
          if (confirmDeleteId) {
            removeCanvas(confirmDeleteId);
            setConfirmDeleteId(null);
          }
        }}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </>
  );
}
