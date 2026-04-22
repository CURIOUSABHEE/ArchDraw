'use client';

import { useRef, useState } from 'react';
import { generatePureSVG } from '@/lib/svgExport';
import {
  Download, Trash2, Upload, ChevronDown,
  Undo2, Redo2, Share2, Loader2, Check,
  GraduationCap, Sparkles, MoreHorizontal, HelpCircle,
  Plus, X, PanelLeftClose, LayoutTemplate, Pin, FolderOpen,
  LayoutDashboard, LayoutGrid,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { useDiagramStore } from '@/store/diagramStore';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { ShareModal } from '@/components/ShareModal';
import { TemplateModal } from '@/components/TemplateModal';
import { EmailCaptureModal, type EmailCaptureReason } from '@/components/EmailCaptureModal';

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

type ExportFormat = 'png-dark-4x' | 'png-light-4x' | 'png-transparent-4x' | 'svg-dark' | 'svg-light' | 'svg-transparent' | 'json' | 'pdf' | 'html-embed';

interface EmbedNode {
  id: string;
  width?: number | null;
  height?: number | null;
  position: { x: number; y: number };
  data?: Record<string, unknown>;
}

interface EmbedEdge {
  source: string;
  target: string;
  data?: Record<string, unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  style?: any;
}

function generateEmbedHTML(nodes: EmbedNode[], edges: EmbedEdge[]): string {
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
  const [shareSessionId, setShareSessionId] = useState('');
  const [shareAccessType, setShareAccessType] = useState<'restricted' | 'anyone'>('anyone');
  const [shareLinkPermission, setShareLinkPermission] = useState<'viewer' | 'editor'>('viewer');
  const [sharePeople, setSharePeople] = useState<Array<{email: string; name: string; role: string}>>([]);
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

  // Count nodes/edges in current canvas for delete confirmation
  const currentCanvasForDelete = canvases.find(c => c.id === activeCanvasId);
  const deleteNodeCount = currentCanvasForDelete?.nodes.length ?? 0;
  const deleteEdgeCount = currentCanvasForDelete?.edges.length ?? 0;

  const handleDeleteCanvas = () => {
    setConfirmDeleteId(activeCanvasId);
  };

  const confirmDelete = () => {
    if (confirmDeleteId) {
      removeCanvas(confirmDeleteId);
      setConfirmDeleteId(null);
    }
  };

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

  const dataUrlToBlob = (dataUrl: string): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert to blob'));
          }
        }, 'image/png');
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = dataUrl;
    });
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
          const pngBlob = await dataUrlToBlob(pngDataUrl);
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
        'png-dark-4x': 4,
        'png-light-4x': 4,
        'png-transparent-4x': 4,
      };
      
      const pixelRatio = pixelRatioMap[format] || 4;
      
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
        downloadFile(await dataUrlToBlob(dataUrl), `archdraw-export${suffix}.png`);
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
    // Get user info for owner
    const user = useAuthStore.getState().user;
    const userEmail = user?.email || 'owner@local';
    const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Owner';
    
    try {
      const response = await fetch('/api/diagram/load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes,
          edges,
          label: activeCanvas?.name ?? 'Shared Diagram',
          source: 'manual',
          accessType: 'anyone',
          linkPermission: 'viewer',
          users: [{
            email: userEmail,
            name: userName,
            role: 'owner',
            addedAt: Date.now(),
          }],
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
        const shareUrl = `${baseUrl}/share/${data.sessionId}`;
        setShareUrl(shareUrl);
        setShareSessionId(data.sessionId);
        setShareAccessType('anyone');
        setShareLinkPermission('viewer');
        
        // Capture users from response if exists
        const user = useAuthStore.getState().user;
        const userEmail = user?.email || 'owner@local';
        const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Owner';
        setSharePeople([{ email: userEmail, name: userName, role: 'owner' }]);
        
        setShareModalOpen(true);
      } else {
        toast.error('Could not generate share link');
      }
    } catch (err) {
      console.error('Share error:', err);
      toast.error('Could not generate share link');
    }
    
    setIsSharing(false);
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
      <header
        className="floating-toolbar flex items-center justify-between px-4 z-50"
        style={{
          position: 'fixed',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
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
            className="floating-icon-btn !w-9 !h-9"
            title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>

          {/* This button now toggles the canvas sidebar directly */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('toggle-canvas-sidebar'))}
            className="floating-icon-btn !w-9 !h-9"
            title="Toggle canvases"
          >
            <FolderOpen className="w-4 h-4" />
          </button>

          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-accent"
            title="Go to Dashboard"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          {/* Current Canvas Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-[14px] text-xs font-medium transition-all cursor-pointer"
                style={{ background: '#EDEDED', color: '#1A1A1A' }}
                onDoubleClick={(e) => {
                  if (activeCanvas) {
                    e.stopPropagation();
                    startRename(activeCanvasId, activeCanvas.name, e);
                  }
                }}
              >
                {editingId === activeCanvasId ? (
                  <input
                    ref={editInputRef}
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === 'Enter') commitRename();
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-transparent outline-none border-none text-xs font-medium w-full min-w-0"
                    style={{ color: 'inherit', background: 'transparent', maxWidth: 120 }}
                    autoFocus
                  />
                ) : (
                  <>
                    <div className="w-5 h-5 rounded-[8px] flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                      <LayoutGrid className="w-3 h-3 text-white" />
                    </div>
                    <span className="truncate max-w-[120px]">{activeCanvas?.name || 'Select Canvas'}</span>
                    <ChevronDown className="w-3 h-3 shrink-0" style={{ color: '#6B6B6B' }} />
                  </>
                )}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="p-2"
              style={{ background: 'white', borderRadius: 16, boxShadow: '0 10px 40px rgba(0,0,0,0.1)', border: 'none' }}
            >
              {canvases
                .sort((a, b) => (b.lastAccessedAt || 0) - (a.lastAccessedAt || 0))
                .map((canvas) => (
                  <DropdownMenuItem
                    key={canvas.id}
                    onClick={() => switchCanvas(canvas.id)}
                    className="flex items-center gap-3 px-3 py-2 rounded-[10px] cursor-pointer"
                    style={{
                      background: canvas.id === activeCanvasId ? '#F2F2F2' : 'transparent',
                    }}
                  >
                    <div
                      className="w-6 h-6 rounded-[6px] flex items-center justify-center"
                      style={{ background: '#F2F2F2' }}
                    >
                      <LayoutGrid className="w-3 h-3" style={{ color: '#6B6B6B' }} />
                    </div>
                    <span className="text-sm" style={{ color: '#1A1A1A' }}>{canvas.name}</span>
                  </DropdownMenuItem>
                ))}
              <DropdownMenuSeparator className="my-2" style={{ background: '#F2F2F2' }} />
              <DropdownMenuItem
                onClick={() => addCanvas()}
                className="flex items-center gap-3 px-3 py-2 rounded-[10px] cursor-pointer"
                style={{ background: 'transparent' }}
              >
                <div
                  className="w-6 h-6 rounded-[6px] flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                >
                  <Plus className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm font-medium" style={{ color: '#6366f1' }}>New Canvas</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            onClick={() => addCanvas()}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-all focus:outline-none focus:ring-2 focus:ring-ring"
            title="New canvas"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 hover:bg-primary/15 text-primary transition-all"
            title="AI Generate Architecture"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI</span>
          </button>

          <button
            onClick={handleDeleteCanvas}
            className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
            title="Delete canvas"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleShare}
            disabled={isSharing || nodes.length === 0}
            className="floating-icon-btn disabled:opacity-40"
          >
            {isSharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
          </button>

          <div className="relative">
            <button
              onClick={() => setExportOpen(!exportOpen)}
              disabled={isExporting}
              className="floating-icon-btn"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            </button>

            {exportOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setExportOpen(false)} />
                <div
                  className="absolute right-0 top-full mt-3 w-56 rounded-2xl overflow-hidden z-30 bg-white"
                  style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}
                >
                  <div className="px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">PNG - Dark</p>
                  </div>
                  {([
                    { label: 'High Quality (4x)', format: 'png-dark-4x' as ExportFormat },
                  ]).map(({ label, format }) => (
                    <button
                      key={format}
                      onClick={() => handleExport(format)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-gray-100 transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                  <div className="px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">PNG - Light</p>
                  </div>
                  {([
                    { label: 'High Quality (4x)', format: 'png-light-4x' as ExportFormat },
                  ]).map(({ label, format }) => (
                    <button
                      key={format}
                      onClick={() => handleExport(format)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-gray-100 transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                  <div className="px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">PNG - Transparent</p>
                  </div>
                  {([
                    { label: 'High Quality (4x)', format: 'png-transparent-4x' as ExportFormat },
                  ]).map(({ label, format }) => (
                    <button
                      key={format}
                      onClick={() => handleExport(format)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-gray-100 transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                  <div className="px-4 py-3">
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
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-gray-100 transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                  <div className="px-4 py-3">
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
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-gray-100 transition-colors"
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
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-gray-100 transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {moreOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setMoreOpen(false)} />
                <div
                  className="absolute right-0 top-full mt-3 w-52 rounded-2xl overflow-hidden z-30 bg-white"
                  style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}
                >
                  {/* Resources Section */}
                  <div className="px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Resources</p>
                  </div>
                  <button
                    onClick={() => { router.push('/tutorials'); setMoreOpen(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-gray-100 transition-colors"
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    Learn
                  </button>
                  <button
                    onClick={() => { openGuide(); setMoreOpen(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-gray-100 transition-colors"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    Guide
                  </button>
                  
                  {/* Workspace Section */}
                  <div className="px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Workspace</p>
                  </div>
                  <button
                    onClick={() => { setTemplatesOpen(true); setMoreOpen(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-gray-100 transition-colors"
                  >
                    <LayoutTemplate className="w-3.5 h-3.5" />
                    Templates
                  </button>
                  <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
                  <button
                    onClick={() => { fileInputRef.current?.click(); setMoreOpen(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-gray-100 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Import JSON
                  </button>
                  
                  {/* Danger Zone */}
                  <div className="px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Danger</p>
                  </div>
                  <button
                    onClick={() => { handleClear(); setMoreOpen(false); }}
                    disabled={nodes.length === 0}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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

      {shareModalOpen && shareUrl && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          shareUrl={shareUrl}
          sessionId={shareSessionId}
          accessType={shareAccessType}
          linkPermission={shareLinkPermission}
          initialPeople={sharePeople.map(p => ({
            id: p.email,
            name: p.name,
            email: p.email,
            role: p.role === 'owner' ? 'owner' : p.role === 'editor' ? 'can edit' : 'can view',
          }))}
          onAccessChange={(accessType, linkPermission) => {
            setShareAccessType(accessType);
            setShareLinkPermission(linkPermission);
            
            // Persist to backend
            fetch('/api/diagram/load', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sessionId: shareSessionId,
                accessType,
                linkPermission,
              }),
            }).catch(console.error);
          }}
          onInvite={(email, role) => {
            const userName = email.split('@')[0];
            setSharePeople(prev => [...prev, { email, name: userName, role }]);
            
            fetch('/api/diagram/load', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sessionId: shareSessionId,
                email,
                name: userName,
                role: role === 'can edit' ? 'editor' : 'viewer',
              }),
            }).catch(console.error);
          }}
          onRemove={(userId) => {
            setSharePeople(prev => prev.filter(p => p.email !== userId));
            
            fetch('/api/diagram/load', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sessionId: shareSessionId,
                email: userId,
              }),
            }).catch(console.error);
          }}
          onRoleChange={(userId, newRole) => {
            setSharePeople(prev => prev.map(p => 
              p.email === userId ? { ...p, role: newRole === 'can edit' ? 'editor' : 'viewer' } : p
            ));
            
            fetch('/api/diagram/load', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sessionId: shareSessionId,
                email: userId,
                name: sharePeople.find(p => p.email === userId)?.name || userId,
                role: newRole === 'can edit' ? 'editor' : 'viewer',
              }),
            }).catch(console.error);
          }}
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
      {confirmDeleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            className="rounded-xl overflow-hidden w-80"
            style={{
              background: 'white',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5">
              <h3 className="text-base font-semibold" style={{ color: '#111827' }}>
                Delete canvas?
              </h3>
              <p className="text-sm mt-2" style={{ color: '#6B7280', lineHeight: 1.5 }}>
                This will delete <strong>"{currentCanvasForDelete?.name || 'this canvas'}"</strong> and remove {deleteNodeCount} node{deleteNodeCount !== 1 ? 's' : ''} and {deleteEdgeCount} edge{deleteEdgeCount !== 1 ? 's' : ''}.
              </p>
              <p className="text-sm mt-2" style={{ color: '#EF4444' }}>
                This action cannot be undone.
              </p>
            </div>
            <div className="flex border-t" style={{ borderColor: '#E5E7EB' }}>
              <button
                className="flex-1 py-3 text-sm font-medium transition-colors"
                style={{ color: '#6B7280' }}
                onClick={() => setConfirmDeleteId(null)}
              >
                Cancel
              </button>
              <button
                className="flex-1 py-3 text-sm font-medium transition-colors border-l"
                style={{ color: '#EF4444', borderColor: '#E5E7EB' }}
                onClick={() => {
                  removeCanvas(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
