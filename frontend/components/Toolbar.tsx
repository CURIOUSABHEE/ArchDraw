'use client';

import { useRef, useState } from 'react';
import {
  Download, Trash2, Upload, ChevronDown, FileJson,
  Undo2, Redo2, Grid3X3, Zap, Moon, Sun,
  Type, StickyNote, Group, Maximize2, LayoutTemplate, Share2, Loader2, Check, HelpCircle,
  GraduationCap, Sparkles,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDiagramStore } from '@/store/diagramStore';
import { useAuthStore } from '@/store/authStore';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import { TemplateModal } from '@/components/TemplateModal';
import { TooltipWrapper } from '@/components/TooltipWrapper';
import { ShareModal } from '@/components/ShareModal';
import { EmailCaptureModal, type EmailCaptureReason } from '@/components/EmailCaptureModal';
import { isSupabaseConfigured, getSupabaseClient } from '@/lib/supabase';
import { useOnboardingStore } from '@/store/onboardingStore';
import { GenerateDiagramPanel } from '@/components/ai/GenerateDiagramPanel';
import { AnimatePresence } from 'framer-motion';

type ExportFormat = 'png-dark' | 'png-light' | 'png-transparent' | 'json' | 'pdf';

export function Toolbar() {
  const router = useRouter();
  const {
    clearDiagram, nodes, edges, importDiagram,
    undo, redo, past, future,
    deleteSelected, selectedNodeId,
    toggleEdgeAnimations, edgeAnimations,
    toggleGrid, showGrid,
    toggleDarkMode, darkMode,
    selectedNodeIds, createGroup,
    fitView, canvases, activeCanvasId,
    savingState, userProfile,
  } = useDiagramStore();

  const { user } = useAuthStore();
  const isGuest = !user;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [emailCapture, setEmailCapture] = useState<EmailCaptureReason | null>(null);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

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
    fitView();
    await new Promise((r) => setTimeout(r, 120));
    try {
      const bgColor =
        format === 'png-dark'    ? '#0f172a'
        : format === 'png-light' ? '#ffffff'
        : undefined;
      const dataUrl = await toPng(element, {
        backgroundColor: bgColor,
        pixelRatio: 3,
        cacheBust: true,
        filter: (node) => {
          const cls = (node as HTMLElement).classList;
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

  const addSpecialNode = (nodeType: string, nodeData: Record<string, unknown>) => {
    const store = useDiagramStore.getState();
    store.pushHistory();
    const newNode = {
      id: nodeType + '-' + Date.now(),
      type: nodeType,
      position: { x: 300 + Math.random() * 200, y: 200 + Math.random() * 200 },
      data: nodeData,
    };
    store.importDiagram([...store.nodes, newNode], store.edges);
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

  return (
    <>
      <header className="h-11 border-b border-border/60 bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 z-20 shrink-0 gap-2">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-5 h-5 bg-indigo-600 rounded-md flex items-center justify-center">
            <div className="w-2 h-2 border border-white/80 rounded-sm" />
          </div>
          <span className="font-semibold text-foreground text-sm tracking-tight">Archflow</span>
        </div>

        <div className="flex items-center gap-0.5">
          <TooltipWrapper label="Undo (cmd+Z)">
            <ToolBtn onClick={undo} disabled={!past.length}><Undo2 className="w-3.5 h-3.5" /></ToolBtn>
          </TooltipWrapper>
          <TooltipWrapper label="Redo (cmd+shift+Z)">
            <ToolBtn onClick={redo} disabled={!future.length}><Redo2 className="w-3.5 h-3.5" /></ToolBtn>
          </TooltipWrapper>
          <Divider />
          <TooltipWrapper label="Delete selected">
            <ToolBtn onClick={deleteSelected} disabled={!selectedNodeId}><Trash2 className="w-3.5 h-3.5" /></ToolBtn>
          </TooltipWrapper>
          <Divider />
          <TooltipWrapper label="Toggle grid">
            <ToolBtn onClick={toggleGrid} active={showGrid}><Grid3X3 className="w-3.5 h-3.5" /></ToolBtn>
          </TooltipWrapper>
          <TooltipWrapper label="Toggle edge animation">
            <ToolBtn onClick={toggleEdgeAnimations} active={edgeAnimations}><Zap className="w-3.5 h-3.5" /></ToolBtn>
          </TooltipWrapper>
          <TooltipWrapper label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
            <ToolBtn onClick={toggleDarkMode}>
              {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </ToolBtn>
          </TooltipWrapper>
          <TooltipWrapper label="Fit view">
            <ToolBtn onClick={fitView}><Maximize2 className="w-3.5 h-3.5" /></ToolBtn>
          </TooltipWrapper>
          <Divider />
          <TooltipWrapper label="Group selected nodes">
            <ToolBtn onClick={createGroup} disabled={selectedNodeIds.length < 2}><Group className="w-3.5 h-3.5" /></ToolBtn>
          </TooltipWrapper>
          <TooltipWrapper label="Add text label">
            <ToolBtn onClick={() => addSpecialNode('textLabelNode', { text: 'Label', fontSize: 'medium' })}><Type className="w-3.5 h-3.5" /></ToolBtn>
          </TooltipWrapper>
          <TooltipWrapper label="Add sticky note">
            <ToolBtn onClick={() => addSpecialNode('annotationNode', { title: 'Note', body: '' })}><StickyNote className="w-3.5 h-3.5" /></ToolBtn>
          </TooltipWrapper>
          <Divider />
          <TooltipWrapper label="Browse templates">
            <ToolBtn onClick={() => setTemplatesOpen(true)} data-onboarding="templates-btn"><LayoutTemplate className="w-3.5 h-3.5" /></ToolBtn>
          </TooltipWrapper>
        </div>

        <div className="hidden md:flex items-center gap-3 text-[10px] text-muted-foreground font-medium">
          <span>{nodes.length} nodes · {edges.length} edges</span>
          {userProfile && savingState !== 'idle' && (
            <span className="flex items-center gap-1 text-slate-400">
              {savingState === 'saving'
                ? <><Loader2 className="w-3 h-3 animate-spin" /> Saving...</>
                : <><Check className="w-3 h-3 text-green-500" /> Saved</>
              }
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <TooltipWrapper label="Generate with AI">
            <button
              onClick={() => setAiPanelOpen(!aiPanelOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs font-medium rounded-md transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">AI Generate</span>
            </button>
          </TooltipWrapper>

          <TooltipWrapper label="Interactive Tutorials">
            <button
              onClick={() => router.push('/tutorials')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Learn</span>
            </button>
          </TooltipWrapper>

          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />

          <TooltipWrapper label="Quick Guide">
            <button
              onClick={openGuide}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Guide</span>
            </button>
          </TooltipWrapper>

          <TooltipWrapper label="Import JSON">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Import</span>
            </button>
          </TooltipWrapper>

          <TooltipWrapper label="Clear canvas">
            <button
              onClick={clearDiagram}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-destructive rounded-md hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          </TooltipWrapper>

          <TooltipWrapper label={nodes.length === 0 ? 'Add nodes to share' : 'Share this diagram'}>
            <button
              onClick={handleShare}
              disabled={isSharing || nodes.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSharing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
              {isSharing ? 'Sharing...' : 'Share'}
            </button>
          </TooltipWrapper>

          <div className="relative">
            <TooltipWrapper label="Export diagram">
              <button
                onClick={() => setExportOpen(!exportOpen)}
                disabled={isExporting}
                data-onboarding="export-btn"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-md transition-all shadow-sm active:scale-95 disabled:opacity-60"
              >
                {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                {isExporting ? 'Exporting...' : 'Export'}
                {!isExporting && <ChevronDown className="w-3 h-3 ml-0.5" />}
              </button>
            </TooltipWrapper>

            {exportOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setExportOpen(false)} />
                <div className="absolute right-0 mt-2 w-52 bg-card/95 backdrop-blur-sm rounded-lg border border-border shadow-xl z-40 overflow-hidden">
                  <div className="px-3 py-2 border-b border-border/40">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">PNG Export</p>
                  </div>
                  {([
                    { label: 'Dark background',        format: 'png-dark'        },
                    { label: 'Light background',       format: 'png-light'       },
                    { label: 'Transparent background', format: 'png-transparent' },
                  ] as { label: string; format: ExportFormat }[]).map(({ label, format }) => (
                    <button
                      key={format}
                      onClick={() => handleExport(format)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground/80 hover:bg-accent hover:text-foreground transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-muted-foreground" />
                      {label}
                    </button>
                  ))}
                  <div className="px-3 py-2 border-t border-border/40">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Other</p>
                  </div>
                  {([
                    { label: 'Export as JSON', format: 'json' },
                    { label: 'Export as PDF',  format: 'pdf'  },
                  ] as { label: string; format: ExportFormat }[]).map(({ label, format }) => (
                    <button
                      key={format}
                      onClick={() => handleExport(format)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground/80 hover:bg-accent hover:text-foreground transition-colors"
                    >
                      <FileJson className="w-3.5 h-3.5 text-muted-foreground" />
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {templatesOpen && <TemplateModal onClose={() => setTemplatesOpen(false)} />}
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
        {aiPanelOpen && <GenerateDiagramPanel onClose={() => setAiPanelOpen(false)} />}
      </AnimatePresence>
    </>
  );
}

function ToolBtn({
  children, onClick, disabled, active, ...rest
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
} & React.HTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      {...rest}
      className={`p-1.5 rounded-md transition-all duration-150 ${
        active
          ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
      } disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-4 bg-border/60 mx-1" />;
}
