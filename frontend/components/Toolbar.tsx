'use client';

import { useRef, useState } from 'react';
import {
  Download, Trash2, Upload, ChevronDown, FileJson, Image,
  FileImage, FileText, Undo2, Redo2, Grid3X3, Zap, Moon, Sun,
  Type, StickyNote, Group, Maximize2, LayoutTemplate,
} from 'lucide-react';
import { useDiagramStore } from '@/store/diagramStore';
import { toPng, toSvg } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import { TemplateModal } from '@/components/TemplateModal';
import { TooltipWrapper } from '@/components/TooltipWrapper';

export function Toolbar() {
  const {
    clearDiagram, nodes, edges, importDiagram,
    undo, redo, past, future,
    deleteSelected, selectedNodeId,
    toggleEdgeAnimations, edgeAnimations,
    toggleGrid, showGrid,
    toggleDarkMode, darkMode,
    selectedNodeIds, createGroup,
    fitView,
  } = useDiagramStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getFlowEl = () =>
    document.querySelector('.react-flow__viewport') as HTMLElement | null;

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ nodes, edges }, null, 2)], { type: 'application/json' });
    downloadFile(blob, 'diagram.json');
    toast.success('Exported as JSON');
    setExportOpen(false);
  };

  const exportPng = async () => {
    const el = getFlowEl();
    if (!el) return;
    const dataUrl = await toPng(el, { backgroundColor: '#f5f7fa', pixelRatio: 2 });
    downloadFile(await (await fetch(dataUrl)).blob(), 'diagram.png');
    toast.success('Exported as PNG');
    setExportOpen(false);
  };

  const exportSvg = async () => {
    const el = getFlowEl();
    if (!el) return;
    const dataUrl = await toSvg(el, { backgroundColor: '#f5f7fa' });
    const svgText = decodeURIComponent(dataUrl.split(',')[1]);
    downloadFile(new Blob([svgText], { type: 'image/svg+xml' }), 'diagram.svg');
    toast.success('Exported as SVG');
    setExportOpen(false);
  };

  const exportPdf = async () => {
    const el = getFlowEl();
    if (!el) return;
    const dataUrl = await toPng(el, { backgroundColor: '#f5f7fa', pixelRatio: 2 });
    const img = new window.Image();
    img.src = dataUrl;
    await new Promise<void>((r) => { img.onload = () => r(); });
    const pdf = new jsPDF({
      orientation: img.width > img.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [img.width, img.height],
    });
    pdf.addImage(dataUrl, 'PNG', 0, 0, img.width, img.height);
    pdf.save('diagram.pdf');
    toast.success('Exported as PDF');
    setExportOpen(false);
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
      id: `${nodeType}-${Date.now()}`,
      type: nodeType,
      position: { x: 300 + Math.random() * 200, y: 200 + Math.random() * 200 },
      data: nodeData,
    };
    store.importDiagram([...store.nodes, newNode], store.edges);
  };

  return (
    <>
      <header className="h-11 border-b border-border/60 bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 z-20 shrink-0 gap-2">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-5 h-5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-md flex items-center justify-center">
            <div className="w-2 h-2 border border-white/80 rounded-sm" />
          </div>
          <span className="font-semibold text-foreground text-sm tracking-tight">Archflow</span>
        </div>

        <div className="flex items-center gap-0.5">
          <TooltipWrapper label="Undo (cmd+Z)">
            <ToolBtn onClick={undo} disabled={!past.length}>
              <Undo2 className="w-3.5 h-3.5" />
            </ToolBtn>
          </TooltipWrapper>
          <TooltipWrapper label="Redo (cmd+shift+Z)">
            <ToolBtn onClick={redo} disabled={!future.length}>
              <Redo2 className="w-3.5 h-3.5" />
            </ToolBtn>
          </TooltipWrapper>
          <Divider />
          <TooltipWrapper label="Delete selected">
            <ToolBtn onClick={deleteSelected} disabled={!selectedNodeId}>
              <Trash2 className="w-3.5 h-3.5" />
            </ToolBtn>
          </TooltipWrapper>
          <Divider />
          <TooltipWrapper label="Toggle grid">
            <ToolBtn onClick={toggleGrid} active={showGrid}>
              <Grid3X3 className="w-3.5 h-3.5" />
            </ToolBtn>
          </TooltipWrapper>
          <TooltipWrapper label="Toggle edge animation">
            <ToolBtn onClick={toggleEdgeAnimations} active={edgeAnimations}>
              <Zap className="w-3.5 h-3.5" />
            </ToolBtn>
          </TooltipWrapper>
          <TooltipWrapper label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
            <ToolBtn onClick={toggleDarkMode}>
              {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </ToolBtn>
          </TooltipWrapper>
          <TooltipWrapper label="Fit view">
            <ToolBtn onClick={fitView}>
              <Maximize2 className="w-3.5 h-3.5" />
            </ToolBtn>
          </TooltipWrapper>
          <Divider />
          <TooltipWrapper label="Group selected nodes">
            <ToolBtn onClick={createGroup} disabled={selectedNodeIds.length < 2}>
              <Group className="w-3.5 h-3.5" />
            </ToolBtn>
          </TooltipWrapper>
          <TooltipWrapper label="Add text label">
            <ToolBtn onClick={() => addSpecialNode('textLabelNode', { text: 'Label', fontSize: 'medium' })}>
              <Type className="w-3.5 h-3.5" />
            </ToolBtn>
          </TooltipWrapper>
          <TooltipWrapper label="Add sticky note">
            <ToolBtn onClick={() => addSpecialNode('annotationNode', { title: 'Note', body: '' })}>
              <StickyNote className="w-3.5 h-3.5" />
            </ToolBtn>
          </TooltipWrapper>
          <Divider />
          <TooltipWrapper label="Browse templates">
            <ToolBtn onClick={() => setTemplatesOpen(true)}>
              <LayoutTemplate className="w-3.5 h-3.5" />
            </ToolBtn>
          </TooltipWrapper>
        </div>

        <div className="hidden md:flex items-center gap-3 text-[10px] text-muted-foreground font-medium">
          <span>{nodes.length} nodes</span>
          <span>{edges.length} edges</span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          <TooltipWrapper label="Import JSON diagram">
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
          <div className="relative">
            <TooltipWrapper label="Export diagram">
              <button
                onClick={() => setExportOpen(!exportOpen)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-medium rounded-md hover:opacity-90 transition-all shadow-sm active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                Export
                <ChevronDown className="w-3 h-3 ml-0.5" />
              </button>
            </TooltipWrapper>
            {exportOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setExportOpen(false)} />
                <div className="absolute right-0 mt-2 w-44 bg-card/95 backdrop-blur-sm rounded-lg border border-border shadow-xl z-40 overflow-hidden">
                  {[
                    { label: 'Export as JSON', icon: FileJson,  fn: exportJson },
                    { label: 'Export as PNG',  icon: Image,     fn: exportPng  },
                    { label: 'Export as SVG',  icon: FileImage, fn: exportSvg  },
                    { label: 'Export as PDF',  icon: FileText,  fn: exportPdf  },
                  ].map(({ label, icon: Icon, fn }) => (
                    <button
                      key={label}
                      onClick={fn}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground/80 hover:bg-accent hover:text-foreground transition-colors"
                    >
                      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
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
    </>
  );
}

function ToolBtn({
  children, onClick, disabled, active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
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
