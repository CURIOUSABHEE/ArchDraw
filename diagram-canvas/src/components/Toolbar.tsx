import { useRef, useState } from 'react';
import { Download, Trash2, Upload, ChevronDown, FileJson, Image, FileImage, FileText } from 'lucide-react';
import { useDiagramStore } from '@/store/diagramStore';
import { toPng, toSvg } from 'html-to-image';
import { jsPDF } from 'jspdf';

/** Top toolbar with branding, import, export, and clear actions */
export function Toolbar() {
  const { clearDiagram, nodes, edges, importDiagram } = useDiagramStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exportOpen, setExportOpen] = useState(false);

  // ---- helpers ----
  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getFlowElement = () =>
    document.querySelector('.react-flow__viewport') as HTMLElement | null;

  // ---- export handlers ----
  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ nodes, edges }, null, 2)], { type: 'application/json' });
    downloadFile(blob, 'diagram.json');
  };

  const exportPng = async () => {
    const el = getFlowElement();
    if (!el) return;
    const dataUrl = await toPng(el, { backgroundColor: '#f5f7fa', pixelRatio: 2 });
    const res = await fetch(dataUrl);
    downloadFile(await res.blob(), 'diagram.png');
    setExportOpen(false);
  };

  const exportSvg = async () => {
    const el = getFlowElement();
    if (!el) return;
    const dataUrl = await toSvg(el, { backgroundColor: '#f5f7fa' });
    const svgText = decodeURIComponent(dataUrl.split(',')[1]);
    downloadFile(new Blob([svgText], { type: 'image/svg+xml' }), 'diagram.svg');
    setExportOpen(false);
  };

  const exportPdf = async () => {
    const el = getFlowElement();
    if (!el) return;
    const dataUrl = await toPng(el, { backgroundColor: '#f5f7fa', pixelRatio: 2 });
    const img = new window.Image();
    img.src = dataUrl;
    await new Promise((r) => (img.onload = r));
    const pdf = new jsPDF({
      orientation: img.width > img.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [img.width, img.height],
    });
    pdf.addImage(dataUrl, 'PNG', 0, 0, img.width, img.height);
    pdf.save('diagram.pdf');
    setExportOpen(false);
  };

  // ---- import handler ----
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (Array.isArray(data.nodes) && Array.isArray(data.edges)) {
          importDiagram(data.nodes, data.edges);
        }
      } catch {
        // invalid file — silently ignore
      }
    };
    reader.readAsText(file);
    // reset so same file can be re-imported
    e.target.value = '';
  };

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-6 z-20 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
          <div className="w-3.5 h-3.5 border-2 border-primary-foreground rounded-sm" />
        </div>
        <span className="font-bold text-foreground tracking-tight text-base">
          ArchDraw
          <span className="text-muted-foreground font-medium ml-1.5 text-sm">MVP</span>
        </span>
      </div>

      {/* Node/edge count */}
      <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
        <span>{nodes.length} nodes</span>
        <span>{edges.length} edges</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Import */}
        <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          Import
        </button>

        {/* Clear */}
        <button
          onClick={clearDiagram}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-destructive rounded-md hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear
        </button>

        {/* Export dropdown */}
        <div className="relative">
          <button
            onClick={() => setExportOpen(!exportOpen)}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-foreground text-background text-xs font-semibold rounded-md hover:opacity-90 transition-all shadow-sm active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            Export
            <ChevronDown className="w-3 h-3 ml-0.5" />
          </button>

          {exportOpen && (
            <>
              {/* Backdrop to close */}
              <div className="fixed inset-0 z-30" onClick={() => setExportOpen(false)} />
              <div className="absolute right-0 mt-2 w-44 bg-card rounded-lg border border-border shadow-lg z-40 overflow-hidden">
                <button onClick={exportJson} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-secondary-foreground hover:bg-muted transition-colors">
                  <FileJson className="w-3.5 h-3.5 text-muted-foreground" />
                  Export as JSON
                </button>
                <button onClick={exportPng} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-secondary-foreground hover:bg-muted transition-colors">
                  <Image className="w-3.5 h-3.5 text-muted-foreground" />
                  Export as PNG
                </button>
                <button onClick={exportSvg} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-secondary-foreground hover:bg-muted transition-colors">
                  <FileImage className="w-3.5 h-3.5 text-muted-foreground" />
                  Export as SVG
                </button>
                <button onClick={exportPdf} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-secondary-foreground hover:bg-muted transition-colors">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                  Export as PDF
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
