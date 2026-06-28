import { getDiagramState } from '../lib/diagram-state.js';
import { ExportDiagramInputSchema } from '../lib/schema.js';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000';

export async function exportDiagram(input: unknown) {
  const validated = ExportDiagramInputSchema.parse(input);
  const { sessionId, format } = validated;

  const state = getDiagramState();
  if (state.nodes.length === 0) {
    return {
      success: false,
      error: 'No diagram loaded. Generate or load a diagram first.',
    };
  }

  try {
    const response = await fetch(`${API_BASE}/api/diagram/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, format }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as { error?: string };
      return {
        success: false,
        error: errorData.error || `Export failed: ${response.status}`,
      };
    }

    const data = await response.json() as { nodes?: unknown[]; edges?: unknown[]; label?: string; editorUrl?: string };

    if (format === 'json') {
      return {
        success: true,
        format: 'json',
        nodes: data.nodes,
        edges: data.edges,
        label: data.label,
        message: 'Diagram exported as JSON. You can save this data to a file.',
      };
    }

    return {
      success: true,
      format,
      message: `To export as ${format.toUpperCase()}, open the editor URL in your browser and use the export button.`,
      editorUrl: data.editorUrl,
      instructions: {
        json: 'Use format: "json" to get raw diagram data',
        png: 'Open editor and click Export → PNG',
        svg: 'Open editor and click Export → SVG',
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Export failed',
    };
  }
}