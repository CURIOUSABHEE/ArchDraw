'use client';

import { useRef, useState } from 'react';
import {
  Download, Trash2, Upload, ChevronDown, FileJson,
  Undo2, Redo2, Share2, Loader2, Check,
  GraduationCap, Sparkles, MoreHorizontal, HelpCircle,
  Plus, X, PanelLeftClose, LayoutTemplate,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDiagramStore } from '@/store/diagramStore';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { ShareModal } from '@/components/ShareModal';
import { TemplateModal } from '@/components/TemplateModal';
import { EmailCaptureModal, type EmailCaptureReason } from '@/components/EmailCaptureModal';
import { isSupabaseConfigured, getSupabaseClient } from '@/lib/supabase';
import { useOnboardingStore } from '@/store/onboardingStore';
import { GenerateDiagramPanel } from '@/components/ai/GenerateDiagramPanel';
import { AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from 'next-themes';
import { useDiagramStore as useDiagramStoreTyped } from '@/store/diagramStore';

type ExportFormat = 'png-dark' | 'png-light' | 'png-transparent' | 'json' | 'pdf';

function formatRelative(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function Toolbar() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const router = useRouter();
  const {
    clearDiagram, nodes, edges, importDiagram,
    undo, redo, past, future,
    canvases, activeCanvasId, addCanvas, removeCanvas, switchCanvas, renameCanvas,
    savingState, userProfile, setSidebarOpen, sidebarOpen,
    aiPanelOpen, closeAIPanel,
  } = useDiagramStore();

  const { user } = useAuthStore();
  const isGuest = !user;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [emailCapture, setEmailCapture] = useState<EmailCaptureReason | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  const openGuide = useOnboardingStore((s) => s.open);

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
    const element = document.querySelector('.react-flow__viewport') as HTMLElement | null;
    if (!element) return;
    setIsExporting(true);
    const { fitView } = useDiagramStoreTyped.getState();
    fitView();
    await new Promise((r) => setTimeout(r, 120));
    try {
      const { toPng } = await import('html-to-image');
      const bgColor =
        format === 'png-dark'    ? '#0f172a'
        : format === 'png-light' ? '#ffffff'
        : undefined;
      const dataUrl = await toPng(element, {
        backgroundColor: bgColor,
        pixelRatio: 3,
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
      if (format === 'pdf') {
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
        pdf.save('archflow-export.pdf');
        toast.success('Exported as PDF');
      } else {
        downloadFile(await (await fetch(dataUrl)).blob(), 'archflow-export.png');
        toast.success('Exported as PNG');
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
        className="h-12 flex items-center justify-between px-4 z-30 shrink-0"
        style={{
          background: isDark 
            ? 'linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(15, 23, 42, 0.9) 100%)' 
            : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: isDark 
            ? '1px solid rgba(255, 255, 255, 0.06)' 
            : '1px solid rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* LEFT: Sidebar toggle + Canvas tabs */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-md transition-colors hover:bg-accent/50"
            title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          >
            <PanelLeftClose className="w-4 h-4 text-muted-foreground" />
          </button>

          <div className="flex items-center gap-1.5">
            {canvases.map((canvas) => {
              const isActive = canvas.id === activeCanvasId;
              const isEditing = editingId === canvas.id;

              return (
                <button
                  key={canvas.id}
                  onClick={() => !isEditing && switchCanvas(canvas.id)}
                  className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-accent/80 text-foreground shadow-sm'
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
                      onDoubleClick={(e) => startRename(canvas.id, canvas.name, e)}
                      title={canvas.updatedAt ? `Last edited ${formatRelative(canvas.updatedAt)}` : canvas.name}
                    >
                      {canvas.name}
                    </span>
                  )}

                  {canvases.length > 1 && !isEditing && (
                    <button
                      onClick={(e) => handleCloseClick(canvas.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-destructive/15 hover:text-destructive transition-all"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </button>
              );
            })}

            <button
              onClick={addCanvas}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-all"
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

          <button
            onClick={() => closeAIPanel()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)',
              color: 'white',
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
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
                  className="absolute right-0 top-full mt-2 w-48 rounded-xl overflow-hidden z-30"
                  style={{
                    background: isDark ? 'rgba(15, 23, 42, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.1)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  <div className="px-3 py-2 border-b border-border/50">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">PNG</p>
                  </div>
                  {([
                    { label: 'Dark background', format: 'png-dark' },
                    { label: 'Light background', format: 'png-light' },
                    { label: 'Transparent', format: 'png-transparent' },
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
                  className="absolute right-0 top-full mt-2 w-48 rounded-xl overflow-hidden z-30"
                  style={{
                    background: isDark ? 'rgba(15, 23, 42, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.1)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                  }}
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
        {aiPanelOpen && <GenerateDiagramPanel onClose={() => closeAIPanel()} />}
      </AnimatePresence>
      {templatesOpen && <TemplateModal onClose={() => setTemplatesOpen(false)} />}

      {/* Delete confirmation modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div 
            className="rounded-xl p-5 w-64"
            style={{
              background: isDark ? 'rgba(15, 23, 42, 0.98)' : 'rgba(255, 255, 255, 0.98)',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
              boxShadow: '0 16px 64px rgba(0, 0, 0, 0.4)',
            }}
          >
            <p className="text-sm font-semibold text-foreground mb-1">Delete canvas?</p>
            <p className="text-[11px] text-muted-foreground mb-4">
              This canvas has nodes. Deleting it is permanent.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2 text-xs font-medium rounded-lg border border-border hover:bg-accent/40 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { removeCanvas(confirmDeleteId); setConfirmDeleteId(null); }}
                className="flex-1 py-2 text-xs font-medium rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
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
