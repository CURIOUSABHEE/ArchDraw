'use client';

import { useRef, useState } from 'react';
import {
  Download, Trash2, Upload, ChevronDown, FileJson, Image,
  FileImage, FileText, Undo2, Redo2, Grid3X3, Zap, Moon, Sun,
  Type, StickyNote, Group, Maximize2,
} from 'lucide-react';
import { useDiagramStore } from '@/store/diagramStore';
import { toPng, toSvg } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

export function Toolbar() {
  const {
    clearDiagram, nodes, edges, importDiagram,
    undo, redo, past, future,
    deleteSelected, selectedNodeId,
    toggleEdgeAnimations, edgeAnimations,
    toggleGrid, showGrid,
    toggleDarkMode, darkMode,
    selectedNodeIds, createGroup,
    pushHistory, fitView,
  } = useDiagramStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const getFlowElement = () =>
    document.querySelector('.react-flow__viewport') as HTMLElement | null;

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ nodes, edges }, null, 2)], { type: 'application/json' });
    downloadFile(blob, 'diagram.json');
    toast.success('Exported as JSON');
    setExportOpen(false);
  };

  const exportPng = async () => {
    const el = getFlowElement(); if (!el) return;
    const dataUrl = await toPng(el, { backgroundColor: '#f5f7fa', pixelRatio: 2 });
    downloadFile(await (await fetch(dataUrl)).blob(), 'diagram.png');
    toast.success('Exported as PNG');
    setExportOpen(false);
  };

  const exportSvg = async () => {
    const el = getFlowElement(); if (!el) return;
    const dataUrl = await toSvg(el, { backgroundColor: '#f5f7fa' });
    const svgText = decodeURIComponent(dataUrl.split(',')[1]);
    downloadFile(new Blob([svgText], { type: 'image/svg+xml' }), 'diagram.svg');
    toast.success('Exported as SVG');
    setExportOpen(false);
  };

  const exportPdf = async () => {
    const el = getFlowElement(); if (!el) return;
    const dataUrl = await toPng(el, { backgroundColor: '#f5f7fa', pixelRatio: 2 });
    const img = new window.Image(); img.src = dataUrl;
    await new Promise((r) => (img.onload = r));
    const pdf = new jsPDF({
      orientation: img.width > img.height ? 'landscape' : 'portrait',
      unit: 'px', format: [img.width, img.height],
    });
    pdf.addImage(dataUrl, 'PNG', 0, 0, img.width, img.height);
    pdf.save('diagram.pdf');
    toast.success('Exported as PDF');
    setExportOpen(false);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (Array.isArray(data.nodes) && Array.isArray(data.edges)) {
          importDiagram(data.nodes, data.edges);
          toast.success('Diagram imported');
        }
      } catch { toast.error('Invalid file'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const addSpecialNode = (type: string, data: Record<string, unknown>) => {
    pushHistory();
    useDiagramStore.setState((s) => ({
      nodes: [
        ...s.nodes,
        { id: `${type}-${Date.now()}`, type, position: { x: 300 + Math.random() * 200, y: 200 + Math.random() * 200 }, data },
      ],
    }));
  };

  return (
    <header className="h-12 border-b border-border bg-card flex items-center justify-between px-4 z-20 shrink-0 gap-2">
      {/* Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
          <div className="w-3 h-3 border-2 border-primary-foreground rounded-sm" />
        </div>
        <span className="font-bold text-foreground tracking-tight text-sm">ArchDraw</span>
      </div>

      {/* Center actions */}
      <div className="flex items-center gap-0.5">
        <ToolBtn onClick={undo} disabled={!past.length} title="Undo (⌘Z)">
          <Undo2 className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={redo} disabled={!future.length} title="Redo (⌘⇧Z)">
          <Redo2 className="w-3.5 h-3.5" />
        </ToolBtn>

        <Divider />

        <ToolBtn onClick={deleteSelected} disabled={!selectedNodeId} title="Delete selected (Del)">
          <Trash2 className="w-3.5 h-3.5" />
        </ToolBtn>

        <Divider />

        <ToolBtn onClick={toggleGrid} active={showGrid} title="Toggle grid">
          <Grid3X3 className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={toggleEdgeAnimations} active={edgeAnimations} title="Toggle edge animation">
          <Zap className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={toggleDarkMode} title="Toggle dark mode">
          {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </ToolBtn>
        <ToolBtn onClick={fitView} title="Fit all nodes in view (⌘⇧F)">
          <Maximize2 className="w-3.5 h-3.5" />
        </ToolBtn>

        <Divider />

        {/* Section 2 — Create Group */}
        <ToolBtn
          onClick={createGroup}
          disabled={selectedNodeIds.length < 2}
          title="Create Group from selected nodes"
        >
          <Group className="w-3.5 h-3.5" />
        </ToolBtn>

        {/* Section 3 — Add Text Label */}
        <ToolBtn
          onClick={() => addSpecialNode('textLabelNode', { text: 'Label', fontSize: 'medium' })}
          title="Add Text Label"
        >
          <Type className="w-3.5 h-3.5" />
        </ToolBtn>

        {/* Section 6 — Add Note */}
        <ToolBtn
          onClick={() => addSpecialNode('annotationNode', { title: 'Note', body: '' })}
          title="Add Note"
        >
          <StickyNote className="w-3.5 h-3.5" />
        </ToolBtn>
      </div>
      {/* Stats */}
      <div className="hidden md:flex items-center gap-3 text-[11px] text-muted-foreground font-mono">
        <span>{nodes.length} nodes</span>
        <span>{edges.length} edges</span>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          Import
        </button>
        <button
          onClick={clearDiagram}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-destructive rounded-md hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear
        </button>

        <div className="relative">
          <button
            onClick={() => setExportOpen(!exportOpen)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-foreground text-background text-xs font-semibold rounded-md hover:opacity-90 transition-all shadow-sm active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            Export
            <ChevronDown className="w-3 h-3 ml-0.5" />
          </button>
          {exportOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setExportOpen(false)} />
              <div className="absolute right-0 mt-2 w-44 bg-card rounded-lg border border-border shadow-lg z-40 overflow-hidden">
                {[
                  { label: 'Export as JSON', icon: FileJson, fn: exportJson },
                  { label: 'Export as PNG', icon: Image, fn: exportPng },
                  { label: 'Export as SVG', icon: FileImage, fn: exportSvg },
                  { label: 'Export as PDF', icon: FileText, fn: exportPdf },
                ].map(({ label, icon: Icon, fn }) => (
                  <button key={label} onClick={fn} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-secondary-foreground hover:bg-muted transition-colors">
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
  );
}

function ToolBtn({
  children, onClick, disabled, title, active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-md transition-colors ${
        active
          ? 'bg-primary/15 text-primary'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      } disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-4 bg-border mx-1" />;
}
