import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Connection, Edge, EdgeChange, Node, NodeChange } from 'reactflow';

const isBrowser = typeof window !== 'undefined';

function isAbortError(e: unknown): boolean {
  return e instanceof Error && (e.name === 'AbortError' || e.message.includes('AbortError'));
}

function isLockError(e: unknown): boolean {
  return e instanceof Error && (e.message.includes('Lock') || e.message.includes('lock') || e.message.includes('steal'));
}

export const serializedStorage = {
  getItem: (key: string): string | null => {
    if (!isBrowser) return null;
    try {
      return localStorage.getItem(key);
    } catch (e) {
      if (isLockError(e) || isAbortError(e)) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const msg = `[storage] ${isLockError(e) ? 'Lock conflict' : 'AbortError'} on getItem("${key}") - returning null`;
        // logger.warn(msg);
        return null;
      }
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (!isBrowser) return;
    
    const maxRetries = 2;
    let attempt = 0;

    const trySet = (k: string, v: string) => {
      try {
        localStorage.setItem(k, v);
        return true;
      } catch (e) {
        const isLock = isLockError(e);
        const isAbort = isAbortError(e);

        if ((isLock || isAbort) && attempt < maxRetries) {
          attempt++;
          return false;
        }

        return true;
      }
    };

    while (attempt <= maxRetries) {
      if (trySet(key, value)) break;
    }
  },
  removeItem: (key: string): void => {
    if (!isBrowser) return;
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // Ignore
    }
  },
};

import { addEdge, applyNodeChanges, applyEdgeChanges, MarkerType } from 'reactflow';
import { getSupabaseClient, isSupabaseConfigured, isReachable, type UserCanvasesTable } from '@/lib/supabase';
import { type Database } from '@/types/supabase';
import { DEFAULT_EDGE_TYPE, type EdgeType } from '@/data/edgeTypes';
import { getNodeShape } from '@/lib/nodeShapes';
import { getStrictPortConfig } from '@/lib/componentPorts';
import { validateAndFixNodes } from '@/lib/utils/nodeValidation';
import logger from '@/lib/logger';
import { EDGE_CONFIG, STORAGE_KEY, STORAGE_VERSION, NODE_CONFIG } from '@/lib/config';
import { createNode, createEdge } from '@/lib/factory';

const NODE_PADDING = 25;
const MIN_NODE_SPACING = 25;

function resolveNodeCollisions(nodes: Node[]): Node[] {
  if (!nodes || !Array.isArray(nodes)) return [];
  const result = [...nodes];
  
  const getExtent = (node: Node) => {
    const w = node.width ?? 180;
    const h = node.height ?? 70;
    return {
      x1: node.position.x - NODE_PADDING,
      y1: node.position.y - NODE_PADDING,
      x2: node.position.x + w + NODE_PADDING,
      y2: node.position.y + h + NODE_PADDING,
    };
  };

  for (let iter = 0; iter < 10; iter++) {
    let moved = false;
    
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const a = result[i];
        const b = result[j];
        
        if (a.parentId !== b.parentId) continue;
        
        const extA = getExtent(a);
        const extB = getExtent(b);
        
        const overlapX = Math.min(extA.x2, extB.x2) - Math.max(extA.x1, extB.x1);
        const overlapY = Math.min(extA.y2, extB.y2) - Math.max(extA.y1, extB.y1);
        
        if (overlapX > 0 && overlapY > 0) {
          const dx = a.position.x < b.position.x ? -MIN_NODE_SPACING : MIN_NODE_SPACING;
          a.position.x += dx;
          b.position.x -= dx;
          moved = true;
        }
        
        const gapX = Math.min(Math.abs(extA.x2 - extB.x1), Math.abs(extB.x2 - extA.x2));
        const gapY = Math.min(Math.abs(extA.y2 - extB.y1), Math.abs(extB.y2 - extA.y1));
        
        if (gapX < MIN_NODE_SPACING && gapY < MIN_NODE_SPACING) {
          const shift = (MIN_NODE_SPACING - Math.max(gapX, gapY)) / 2;
          if (a.position.x < b.position.x) {
            a.position.x -= shift;
            b.position.x += shift;
          } else {
            a.position.x += shift;
            b.position.x -= shift;
          }
          moved = true;
        }
      }
    }
    
    if (!moved) break;
  }
  
  return result;
}

const RESERVED_LAYER_LABELS = new Set([
  'presentation', 'presentation layer',
  'gateway', 'gateway layer',
  'application', 'application layer',
  'data', 'data layer',
  'async', 'async layer',
  'observability', 'observability layer',
  'external', 'external layer',
]);

function stripReservedLayerNodes(nodes: Node[]): Node[] {
  const result: Node[] = [];
  const labelMap = new Map<string, Node>();
  
  for (const node of nodes) {
    const data = node.data as Record<string, unknown> | undefined;
    const label = typeof data?.label === 'string' ? data.label.toLowerCase().trim() : '';
    const isGroup = data?.isGroup === true;
    
    if (isGroup) {
      result.push(node);
      continue;
    }
    
    if (RESERVED_LAYER_LABELS.has(label)) {
      logger.log(`[Store] Stripping reserved layer node: "${data?.label}" (${node.id})`);
      continue;
    }
    
    const existing = labelMap.get(label);
    if (existing && existing.id !== node.id) {
      logger.log(`[Store] Duplicate label "${data?.label}" — keeping ${node.id}, removing ${existing.id}`);
      continue;
    }
    
    labelMap.set(label, node);
    result.push(node);
  }
  
  return result;
}

// Module-level fitView callback — set by Canvas on mount, avoids circular imports
type FitViewOptions = { padding?: number; duration?: number; maxZoom?: number };
let fitViewCallback: ((opts?: FitViewOptions) => void) | null = null;
export function registerFitViewCallback(fn: (opts?: FitViewOptions) => void) {
  fitViewCallback = fn;
}

// Debounce helper
function debounce<T extends (...args: Parameters<T>) => void>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export interface GuideLine {
  orientation: 'h' | 'v';
  position: number;
  spacingArrows?: { from: number; to: number };
}

export interface NodeData {
  label: string;
  category: string;
  layer?: string;
  componentType?: string;
  color?: string;
  icon?: string;
  iconUrl?: string;
  description?: string;
  tech?: string;
  status?: 'healthy' | 'warning' | 'error' | 'unknown';
  isExternal?: boolean;
  hideTierTag?: boolean;
  sublabel?: string;
  subtitle?: string;
  hasError?: boolean;
  accentColor?: string;
  technology?: string;
  nodeWidth?: number;
  shape?: string;
  groupLabel?: string;
}

export interface CanvasTab {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
  updatedAt?: number;
  isOpen?: boolean;
  isPinned?: boolean;
  isFavorite?: boolean;
  lastAccessedAt?: number;
  thumbnail?: string;
}

export interface UserProfile {
  id: string;
  email?: string;
  name?: string;
  avatar_url?: string;
}

interface HistoryEntry {
  nodes: Node[];
  edges: Edge[];
}

interface DiagramState {
  // ── Multi-canvas ──────────────────────────────────────────────────────────
  canvases: CanvasTab[];
  activeCanvasId: string;
  openCanvasIds: string[];
  nodes: Node[];
  edges: Edge[];

  // ── Sequence Diagrams ───────────────────────────────────────────────────
  sequenceDiagrams: Record<string, { mermaidSyntax: string; title: string }>;
  setSequenceDiagram: (canvasId: string, mermaidSyntax: string, title: string) => void;
  clearSequenceDiagram: (canvasId: string) => void;
  importSequenceDiagram: (mermaidSyntax: string, title: string) => void;

  getRandomAnimalName: () => string;
       addCanvas: (customName?: string, canvasId?: string) => string;
       duplicateCanvas: (id: string) => string | undefined;
       removeCanvas: (id: string) => void;
       switchCanvas: (id: string) => void;
       renameCanvas: (id: string, name: string) => void;
       openCanvas: (id: string) => void;
       closeCanvas: (id: string) => void;
       togglePinCanvas: (id: string) => void;
       toggleFavorite: (id: string) => void;
       getOpenCanvases: () => CanvasTab[];
  getVisibleCanvases: () => CanvasTab[];
  getOverflowCanvases: () => CanvasTab[];
  getActiveCanvasId: () => string;

  // ── User / Auth ───────────────────────────────────────────────────────────
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile | null) => void;
  loadCanvasesFromDB: () => Promise<void>;
  saveCanvasToDB: (canvasId: string) => void; // debounced
  savingState: 'idle' | 'saving' | 'saved';
  setSavingState: (s: 'idle' | 'saving' | 'saved') => void;

  // ── Selection ─────────────────────────────────────────────────────────────
  selectedNodeId: string | null;
  selectedNodeIds: string[];
  selectedEdgeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  setSelectedNodeIds: (ids: string[]) => void;
  setSelectedEdgeId: (id: string | null) => void;

  // ── UI state ──────────────────────────────────────────────────────────────
  guideLines: GuideLine[];
  edgeAnimations: boolean;
  showGrid: boolean;
  darkMode: boolean;
  canvasDarkMode: boolean;
  sidebarOpen: boolean;
  canvasMode: 'empty' | 'editing' | 'template';
  activeLayoutPresetId: string;
  setGuideLines: (lines: GuideLine[]) => void;
  toggleEdgeAnimations: () => void;
  toggleGrid: () => void;
  toggleDarkMode: () => void;
  toggleCanvasDarkMode: () => void;
  setCanvasDarkMode: (mode: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setCanvasMode: (mode: 'empty' | 'editing' | 'template') => void;
  setActiveLayoutPresetId: (id: string) => void;

  // ── History ───────────────────────────────────────────────────────────────
  past: HistoryEntry[];
  future: HistoryEntry[];
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  // ── Node/edge operations ──────────────────────────────────────────────────
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (node: Node<NodeData> | string, label?: string, category?: string, color?: string, icon?: string, technology?: string, position?: { x: number; y: number }) => void;
  removeNode: (id: string) => void;
  updateNodeData: (id: string, data: Partial<NodeData>) => void;
  updateNodeSize: (id: string, size: { width?: number; height?: number }) => void;
  updateEdgeData: (id: string, data: Record<string, unknown>) => void;
  deleteEdge: (edgeId: string) => void;
  onReconnect: (oldEdge: Edge, newConnection: Connection) => void;
  importDiagram: (nodes: Node[], edges: Edge[]) => void;
  clearDiagram: () => void;
  deleteSelected: () => void;
  selectAll: () => void;
  createGroup: (parentId?: string) => void;
  ungroupNodes: (groupId: string) => void;
  moveToGroup: (nodeId: string, groupId: string | null) => void;
  loadTemplate: (nodes: Node[], edges: Edge[]) => void;
  loadDefaultArchitecture: () => void;
  alignConnectedNodes: () => void;

  // ── Fit view ──────────────────────────────────────────────────────────────
  fitView: (options?: FitViewOptions) => void;

  // ── Edge editing ──────────────────────────────────────────────────────────
  editingEdgeId: string | null;
  setEditingEdgeId: (id: string | null) => void;
  pendingEditEdgeId: string | null;
  setPendingEditEdgeId: (id: string | null) => void;
  pendingLabelEdgeId: string | null;
  setPendingLabelEdgeId: (id: string | null) => void;
  
  updateEdgeLabel: (edgeId: string, label: string) => void;

  // ── AI Streaming (real-time canvas building) ──────────────────────────────
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  appendNode: (node: Node) => void;
  appendEdge: (edge: Edge) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeCanvas(name: string, id?: string): CanvasTab {
  return { 
    id: id || `canvas-${Date.now()}-${Math.random().toString(36).slice(2)}`, 
    name, 
    nodes: [], 
    edges: [], 
    updatedAt: Date.now() 
  };
}

const INITIAL_CANVAS = makeCanvas('Elephant');

function syncActiveCanvas(
  canvases: CanvasTab[],
  activeCanvasId: string,
  nodes: Node[],
  edges: Edge[]
): CanvasTab[] {
  return canvases.map((c) =>
    c.id === activeCanvasId ? { ...c, nodes, edges, updatedAt: Date.now() } : c
  );
}

function migrateEdgesToSmoothstep(edges: Edge[]): Edge[] {
  return edges.map((edge) => {
    if (edge.data?.pathType === 'smooth') {
      return {
        ...edge,
        data: { ...edge.data, pathType: 'Smoothstep' },
      };
    }
    return edge;
  });
}

const KNOWN_NODE_TYPES = new Set([
  'systemNode',
  'architectureNode',
  'baseNode',
  'databaseNode',
  'cacheNode',
  'shapeNode',
  'groupNode',
  'group',
  'textLabelNode',
  'annotationNode',
  'messageBrokerNode',
  'customNode',
]);

const KNOWN_EDGE_TYPES = new Set(['custom', 'simpleFloating', 'default']);

function normalizeNodeType(type?: string): string {
  if (!type) return 'systemNode';
  
  // These types are all unified to systemNode to follow the global 'plate' style
  if ([
    'architectureNode', 
    'baseNode', 
    'databaseNode', 
    'cacheNode', 
    'customNode', 
    'messageBrokerNode',
    'system'
  ].includes(type)) {
    return 'systemNode';
  }
  
  if (!KNOWN_NODE_TYPES.has(type)) return 'systemNode';
  return type;
}

function normalizeNodes(nodes: Node[]): Node[] {
  return nodes.map((node) => ({
    ...node,
    type: normalizeNodeType(node.type as string | undefined),
  }));
}

function normalizeEdge(edge: Edge): Edge {
  return {
    ...edge,
    type: 'smoothstep',
    markerEnd: edge.markerEnd ?? {
      type: EDGE_CONFIG.markerType,
      color: EDGE_CONFIG.strokeColor,
      width: 20,
      height: 20,
    },
  };
}

function distributeTargetHandles(nodes: Node[], edges: Edge[]): Edge[] {
  // Group edges by their target node
  const incomingEdgesByTarget = new Map<string, Edge[]>();
  for (const edge of edges) {
    const target = edge.target;
    if (!incomingEdgesByTarget.has(target)) {
      incomingEdgesByTarget.set(target, []);
    }
    incomingEdgesByTarget.get(target)!.push(edge);
  }

  return edges.map(edge => {
    const target = edge.target;
    const incoming = incomingEdgesByTarget.get(target) || [];
    
    // Sort incoming edges by the source node's Y coordinate to keep routing clean and prevent crossings
    const sortedIncoming = [...incoming].sort((a, b) => {
      const nodeA = nodes.find(n => n.id === a.source);
      const nodeB = nodes.find(n => n.id === b.source);
      const yA = nodeA?.position?.y ?? 0;
      const yB = nodeB?.position?.y ?? 0;
      return yA - yB;
    });

    const index = sortedIncoming.findIndex(e => e.id === edge.id);
    
    // Determine the general direction from source to target
    const srcNode = nodes.find(n => n.id === edge.source);
    const tgtNode = nodes.find(n => n.id === edge.target);
    
    const srcX = srcNode?.position?.x ?? 0;
    const tgtX = tgtNode?.position?.x ?? 0;
    const srcY = srcNode?.position?.y ?? 0;
    const tgtY = tgtNode?.position?.y ?? 0;

    let targetHandle = 'left';
    const sourceHandle = tgtX > srcX ? 'right' : 'left';

    if (incoming.length < 3) {
      if (incoming.length === 2) {
        if (index === 0) {
          targetHandle = tgtY > srcY ? 'top' : 'bottom';
        } else {
          targetHandle = 'left';
        }
      } else {
        if (tgtX > srcX + 100) {
          targetHandle = 'left';
        } else if (srcX > tgtX + 100) {
          targetHandle = 'right';
        } else if (tgtY > srcY) {
          targetHandle = 'top';
        } else {
          targetHandle = 'bottom';
        }
      }
    } else {
      const handles = ['top', 'left', 'bottom'];
      targetHandle = handles[index % 3];
    }

    return {
      ...edge,
      sourceHandle,
      targetHandle,
      type: 'smoothstep',
    };
  });
}

function normalizeEdges(edges: Edge[]): Edge[] {
  const migrated = migrateEdgesToSmoothstep(edges);
  
  // Clean up legacy duplicate keys that might be stuck in localStorage
  const seenIds = new Set<string>();
  const deduplicated = migrated.map(edge => {
    let id = edge.id;
    while (seenIds.has(id)) {
      id = `${id}-${Math.random().toString(36).slice(2, 8)}`;
    }
    seenIds.add(id);
    return { ...edge, id };
  });

  return deduplicated.map(normalizeEdge);
}

function sanitizeNodes(nodes: Node[]): Node[] {
  return nodes.map(node => {
    const hasRequired =
      node.data?.typeId &&
      node.data?.color &&
      node.data?.category &&
      node.data?.icon;

    if (!hasRequired) {
      logger.warn(`[sanitize] Node ${node.id} missing fields. Rebuilding.`);
      return createNode(
        (node.data as any)?.typeId ?? 'default',
        (node.data as any)?.label ?? 'Unknown',
        node.position,
      );
    }
    return node;
  });
}

function sanitizeEdges(edges: Edge[]): Edge[] {
  return edges.map(edge => {
    const hasRequired =
      edge.type === 'floating' &&
      edge.markerEnd &&
      edge.style?.stroke;

    if (!hasRequired) {
      return createEdge(edge.source, edge.target, String(edge.label ?? ''));
    }
    return edge;
  });
}

function mergeCanvases(localCanvases: CanvasTab[], dbCanvases: CanvasTab[]): CanvasTab[] {
  const merged = new Map<string, CanvasTab>();

  // Add all DB canvases first
  for (const c of dbCanvases) {
    if (!c.id) continue;
    merged.set(c.id, c);
  }

  // Merge local canvases, keeping the more recently updated version
  for (const local of localCanvases) {
    if (!local.id) continue;
    const existing = merged.get(local.id);
    if (!existing) {
      // New canvas not in DB yet - keep it
      merged.set(local.id, local);
    } else {
      // Canvas exists in both - keep the more recent version
      const localTime = local.updatedAt || 0;
      const dbTime = existing.updatedAt || 0;
      if (localTime > dbTime) {
        merged.set(local.id, { ...local, isOpen: existing.isOpen, isPinned: existing.isPinned });
      }
    }
  }

  return Array.from(merged.values()).sort((a, b) => (b.lastAccessedAt || 0) - (a.lastAccessedAt || 0));
}
// ── Debounced DB save (module-level so it's shared across calls) ──────────────
const _debouncedSave = debounce(async (canvasId: string, get: () => DiagramState) => {
  if (!isSupabaseConfigured || !isReachable) return;
  const state = get();
  if (!state.userProfile || state.userProfile.id === 'guest') return;
  const canvas = state.canvases.find((c) => c.id === canvasId);
  if (!canvas) return;
  state.setSavingState('saving');
  try {
    const supabase = getSupabaseClient();
    await (supabase.from('user_canvases') as unknown as UserCanvasesTable).upsert({
      id: canvasId,
      user_id: state.userProfile.id,
      name: canvas.name,
      nodes: canvas.nodes as unknown as import('@/types/supabase').Json,
      edges: canvas.edges as unknown as import('@/types/supabase').Json,
      updated_at: new Date().toISOString(),
    });
    state.setSavingState('saved');
    // Reset to idle after 2s
    setTimeout(() => {
      if (get().savingState === 'saved') get().setSavingState('idle');
    }, 2000);
  } catch {
    state.setSavingState('idle');
  }
}, 1500);

// Delete canvas from Supabase
async function deleteCanvasFromDB(canvasId: string, get: () => DiagramState): Promise<void> {
  if (!isSupabaseConfigured || !isReachable) return;
  const state = get();
  if (!state.userProfile || state.userProfile.id === 'guest') return;
  try {
    const supabase = getSupabaseClient();
    await (supabase.from('user_canvases') as unknown as UserCanvasesTable).delete().eq('id', canvasId);
  } catch {
    // Silently fail - canvas is already removed from local state
  }
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useDiagramStore = create<DiagramState>()(
  persist(
    (set, get) => ({
      // ── Multi-canvas ───────────────────────────────────────────────────────
      canvases: [{ ...INITIAL_CANVAS, isOpen: true, lastAccessedAt: Date.now() }],
      activeCanvasId: INITIAL_CANVAS.id,
      openCanvasIds: [INITIAL_CANVAS.id],
      nodes: [],
      edges: [],
      sequenceDiagrams: {},

      getRandomAnimalName: () => {
        const animals = ['Elephant', 'Lion', 'Panda', 'Tiger', 'Falcon', 'Shark', 'Wolf', 'Fox', 'Bear', 'Eagle', 'Owl', 'Hawk', 'Dolphin', 'Penguin', 'Zebra', 'Giraffe', 'Leopard', 'Jaguar', 'Panther', 'Cheetah'];
        const usedNames = get().canvases.map(c => c.name);
        const available = animals.filter(a => !usedNames.includes(a));
        if (available.length > 0) {
          return available[Math.floor(Math.random() * available.length)];
        }
        const baseAnimal = animals[Math.floor(Math.random() * animals.length)];
        let counter = 1;
        while (usedNames.includes(`${baseAnimal} ${counter}`)) {
          counter++;
        }
        return `${baseAnimal} ${counter}`;
      },

       addCanvas: (customName?: string, canvasId?: string) => {
         const { canvases, openCanvasIds, getRandomAnimalName } = get();
         
         if (canvasId) {
           const existing = canvases.find(c => c.id === canvasId);
           if (existing) {
             get().switchCanvas(canvasId);
             return canvasId;
           }
         }

         const baseName = customName || getRandomAnimalName();
         let newName = baseName;
         const existingNames = new Set(canvases.map(c => c.name));
         
         let counter = 1;
         while (existingNames.has(newName)) {
           counter++;
           newName = `${baseName} ${counter}`;
         }
         
         const newCanvas = makeCanvas(newName, canvasId);
         const canvasWithMeta = { ...newCanvas, isOpen: true, lastAccessedAt: Date.now() };
         const newOpenIds = [...openCanvasIds, newCanvas.id];
         set({ 
           canvases: [...canvases, canvasWithMeta], 
           openCanvasIds: newOpenIds,
           activeCanvasId: newCanvas.id, 
           nodes: [], 
           edges: [], 
           past: [], 
           future: [] 
         });
         return newCanvas.id;
       },

       duplicateCanvas: (id: string) => {
         const { canvases, openCanvasIds } = get();
         const source = canvases.find(c => c.id === id);
         if (!source) return;
         
         const baseName = `${source.name} Copy`;
         let newName = baseName;
         const existingNames = new Set(canvases.map(c => c.name));
         
         let counter = 1;
         while (existingNames.has(newName)) {
           counter++;
           newName = `${baseName} ${counter}`;
         }
         
         const newId = `canvas-${Date.now()}-${Math.random().toString(36).slice(2)}`;
         const duplicated: CanvasTab = {
           ...source,
           id: newId,
           name: newName,
           isOpen: true,
           lastAccessedAt: Date.now(),
           nodes: JSON.parse(JSON.stringify(source.nodes)),
           edges: JSON.parse(JSON.stringify(source.edges)),
         };
         
         const newOpenIds = [...openCanvasIds, newId];
         set({
           canvases: [...canvases, duplicated],
           openCanvasIds: newOpenIds,
           activeCanvasId: newId,
           nodes: duplicated.nodes,
           edges: duplicated.edges,
           past: [],
           future: [],
         });
         return newId;
       },

      removeCanvas: (id) => {
        const { canvases, activeCanvasId, openCanvasIds, nodes, edges } = get();
        if (canvases.length <= 1) return;
        
        // Sync active canvas before removing
        const synced = syncActiveCanvas(canvases, activeCanvasId, nodes, edges);
        
        const idx = synced.findIndex((c) => c.id === id);
        const next = synced.filter((c) => c.id !== id);
        const newOpenIds = openCanvasIds.filter((cid) => cid !== id);
        
        let nextActiveId = activeCanvasId;
        if (activeCanvasId === id) {
          const newIdx = Math.max(0, idx - 1);
          nextActiveId = next[newIdx]?.id || next[0]?.id;
        }
        const active = next.find((c) => c.id === nextActiveId);
        set({ 
          canvases: next, 
          openCanvasIds: newOpenIds,
          activeCanvasId: nextActiveId, 
          nodes: active?.nodes || [], 
          edges: active?.edges || [], 
          past: [], 
          future: [] 
        });
        
        // Delete from Supabase
        deleteCanvasFromDB(id, get);
      },

      switchCanvas: (id) => {
        const { canvases, activeCanvasId, nodes, edges, openCanvasIds } = get();
        if (id === activeCanvasId) return;
        
        const saved = syncActiveCanvas(canvases, activeCanvasId, nodes, edges);
        const target = saved.find((c) => c.id === id);
        
        if (!target) return;
        
        let newOpenIds = openCanvasIds;
        if (!openCanvasIds.includes(id)) {
          newOpenIds = [...openCanvasIds, id];
        }
        
        const updatedCanvases = saved.map((c) => {
          if (c.id === id) {
            return { ...c, lastAccessedAt: Date.now() };
          }
          return c;
        });
        
        set({ 
          canvases: updatedCanvases, 
          openCanvasIds: newOpenIds,
          activeCanvasId: id, 
          nodes: validateAndFixNodes(normalizeNodes(target.nodes || [])), 
          edges: normalizeEdges(target.edges || []), 
          past: [], 
          future: [], 
          selectedNodeId: null, 
          selectedEdgeId: null 
        });
        setTimeout(() => get().fitView(), 80);
      },

      renameCanvas: (id, name) => {
        const canvases = get().canvases.map((c) => c.id === id ? { ...c, name, updatedAt: Date.now() } : c);
        set({ canvases });
        get().saveCanvasToDB(id);
      },

      openCanvas: (id) => {
        const { canvases, activeCanvasId, openCanvasIds, nodes, edges } = get();
        const isAlreadyOpen = openCanvasIds.includes(id);
        
        const saved = syncActiveCanvas(canvases, activeCanvasId, nodes, edges);
        const target = saved.find((c) => c.id === id);
        
        if (!target) return;
        
        let newOpenIds: string[];
        if (isAlreadyOpen) {
          newOpenIds = openCanvasIds;
        } else {
          newOpenIds = [...openCanvasIds, id];
        }
        
        const updatedCanvases = saved.map((c) => {
          if (c.id === id) {
            return { ...c, isOpen: true, lastAccessedAt: Date.now() };
          }
          return c;
        });
        
        set({ 
          canvases: updatedCanvases, 
          openCanvasIds: newOpenIds,
          activeCanvasId: id,
          nodes: validateAndFixNodes(normalizeNodes(target.nodes || [])),
          edges: normalizeEdges(target.edges || []),
          past: [],
          future: [],
          selectedNodeId: null,
          selectedEdgeId: null,
        });
        setTimeout(() => get().fitView(), 80);
      },

      closeCanvas: (id) => {
        const { canvases, activeCanvasId, openCanvasIds, nodes, edges } = get();
        
        if (openCanvasIds.length <= 1) return;
        
        const idx = openCanvasIds.indexOf(id);
        const newOpenIds = openCanvasIds.filter((cid) => cid !== id);
        
        let nextActiveId = activeCanvasId;
        if (activeCanvasId === id) {
          const newIdx = Math.max(0, idx - 1);
          nextActiveId = newOpenIds[newIdx] || newOpenIds[0];
        }
        
        const saved = syncActiveCanvas(canvases, activeCanvasId, nodes, edges);
        const nextActive = saved.find((c) => c.id === nextActiveId);
        
        const updatedCanvases = saved.map((c) => {
          if (c.id === id) {
            return { ...c, isOpen: false };
          }
          return c;
        });
        
        set({ 
          canvases: updatedCanvases,
          openCanvasIds: newOpenIds,
          activeCanvasId: nextActiveId,
          nodes: validateAndFixNodes(normalizeNodes(nextActive?.nodes || [])),
          edges: normalizeEdges(nextActive?.edges || []),
          past: [],
          future: [],
        });
      },

      togglePinCanvas: (id) => {
        const canvases = get().canvases.map((c) => 
          c.id === id ? { ...c, isPinned: !c.isPinned } : c
        );
        set({ canvases });
      },

      toggleFavorite: (id) => {
        const canvases = get().canvases.map((c) => 
          c.id === id ? { ...c, isFavorite: !c.isFavorite } : c
        );
        set({ canvases });
      },

      getOpenCanvases: () => {
        const { canvases, openCanvasIds } = get();
        return openCanvasIds
          .map((id) => canvases.find((c) => c.id === id))
          .filter((c): c is CanvasTab => c !== undefined);
      },

      getVisibleCanvases: () => {
        const { canvases, activeCanvasId, openCanvasIds } = get();
        const MAX_VISIBLE = 3;
        
        // Get open canvases in order of openCanvasIds
        const openCanvases = openCanvasIds
          .map((id) => canvases.find((c) => c.id === id))
          .filter((c): c is CanvasTab => c !== undefined);
        
        if (openCanvases.length <= MAX_VISIBLE) {
          return openCanvases;
        }
        
        // Separate active, pinned, and other canvases
        const activeCanvas = openCanvases.find((c) => c.id === activeCanvasId);
        const pinned = openCanvases.filter((c) => c.isPinned && c.id !== activeCanvasId);
        const other = openCanvases.filter((c) => !c.isPinned && c.id !== activeCanvasId);
        
        // Build visible list: active first, then pinned, then others
        const visible: CanvasTab[] = [];
        
        // 1. Always include active canvas first
        if (activeCanvas) {
          visible.push(activeCanvas);
        }
        
        // 2. Add pinned canvases (up to remaining slots)
        const remainingSlots = MAX_VISIBLE - visible.length;
        for (const c of pinned) {
          if (visible.length >= MAX_VISIBLE) break;
          visible.push(c);
        }
        
        // 3. Add other canvases by last accessed time
        const sortedOther = [...other].sort((a, b) => (b.lastAccessedAt || 0) - (a.lastAccessedAt || 0));
        for (const c of sortedOther) {
          if (visible.length >= MAX_VISIBLE) break;
          visible.push(c);
        }
        
        return visible;
      },

      getOverflowCanvases: () => {
        const { canvases, activeCanvasId, openCanvasIds } = get();
        const MAX_VISIBLE = 3;
        
        // Get open canvases in order of openCanvasIds
        const openCanvases = openCanvasIds
          .map((id) => canvases.find((c) => c.id === id))
          .filter((c): c is CanvasTab => c !== undefined);
        
        if (openCanvases.length <= MAX_VISIBLE) {
          return [];
        }
        
        const visible = get().getVisibleCanvases();
        const visibleIds = new Set(visible.map((c) => c.id));
        
        // Return overflow: open canvases not in visible
        return openCanvases.filter((c) => !visibleIds.has(c.id));
      },

      getActiveCanvasId: () => {
        return get().activeCanvasId;
      },

      // ── User / Auth ────────────────────────────────────────────────────────
      userProfile: null,
      setUserProfile: (profile) => set({ userProfile: profile }),
      savingState: 'idle',
      setSavingState: (s) => set({ savingState: s }),

      loadCanvasesFromDB: async () => {
        if (!isSupabaseConfigured || !isReachable) return;
        const { activeCanvasId, canvases: localCanvases } = get();
        try {
          const supabase = getSupabaseClient();
          const { data } = await (supabase.from('user_canvases') as unknown as UserCanvasesTable)
            .select('*')
            .order('updated_at', { ascending: false });
          if (data && data.length > 0) {
            const dbCanvases: CanvasTab[] = data.map((d: Database['public']['Tables']['user_canvases']['Row']) => {
              const rawNodes = normalizeNodes((d.nodes as unknown as Node[]) ?? []);
              const sortedNodes = validateAndFixNodes(rawNodes);
              return {
                id: d.id,
                name: d.name,
                nodes: sortedNodes,
                edges: normalizeEdges((d.edges as unknown as Edge[]) ?? []),
                updatedAt: d.updated_at ? new Date(d.updated_at).getTime() : Date.now(),
                isOpen: true,
                lastAccessedAt: d.updated_at ? new Date(d.updated_at).getTime() : Date.now(),
              };
            });

            // Merge local and DB canvases, keeping the most recent version of each
            const mergedCanvases = mergeCanvases(localCanvases, dbCanvases);
            
            const openIds = mergedCanvases.map((c) => c.id);
            const targetCanvas = mergedCanvases.find((c) => c.id === activeCanvasId) || mergedCanvases[0];
            set({
              canvases: mergedCanvases,
              openCanvasIds: openIds,
              activeCanvasId: targetCanvas.id,
              nodes: validateAndFixNodes(normalizeNodes(targetCanvas.nodes || [])),
              edges: normalizeEdges(targetCanvas.edges || []),
            });
          }
        } catch {
          // silently fail — guest fallback
        }
      },

      saveCanvasToDB: (canvasId) => {
        _debouncedSave(canvasId, get);
      },

      // ── Selection ──────────────────────────────────────────────────────────
      selectedNodeId: null,
      selectedNodeIds: [],
      selectedEdgeId: null,
      setSelectedNodeId: (id) => set({ selectedNodeId: id }),
      setSelectedNodeIds: (ids) => set({ selectedNodeIds: ids }),
      setSelectedEdgeId: (id) => set({ selectedEdgeId: id }),

      // ── UI state ───────────────────────────────────────────────────────────
      guideLines: [],
      edgeAnimations: true,
      showGrid: true,
      darkMode: true,
      canvasDarkMode: false,
      sidebarOpen: true,
      canvasMode: 'empty',
      activeLayoutPresetId: 'layered-lr',
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setGuideLines: (lines) => set({ guideLines: lines }),
      setCanvasMode: (mode) => set({ canvasMode: mode }),
      setActiveLayoutPresetId: (id) => set({ activeLayoutPresetId: id }),
      toggleGrid: () => set({ showGrid: !get().showGrid }),
      toggleDarkMode: () => {
        const next = !get().darkMode;
        set({ darkMode: next });
      },
      toggleCanvasDarkMode: () => {
        set((state) => ({ canvasDarkMode: !state.canvasDarkMode }));
      },
      setCanvasDarkMode: (mode: boolean) => {
        set({ canvasDarkMode: mode });
      },
      toggleEdgeAnimations: () => {
        const next = !get().edgeAnimations;
        const edges = get().edges.map((e) => ({ ...e, animated: next }));
        const canvases = syncActiveCanvas(get().canvases, get().activeCanvasId, get().nodes, edges);
        set({ edgeAnimations: next, edges, canvases });
      },

      // ── History ────────────────────────────────────────────────────────────
      past: [],
      future: [],
      pushHistory: () => {
        const { nodes, edges, past } = get();
        set({ past: [...past.slice(-30), { nodes, edges }], future: [] });
      },
      undo: () => {
        const { past, nodes, edges, future, activeCanvasId, canvases } = get();
        if (!past.length) return;
        const prev = past[past.length - 1];
        const newCanvases = syncActiveCanvas(canvases, activeCanvasId, prev.nodes, prev.edges);
        set({ past: past.slice(0, -1), future: [{ nodes, edges }, ...future], nodes: prev.nodes, edges: prev.edges, canvases: newCanvases });
      },
      redo: () => {
        const { future, nodes, edges, past, activeCanvasId, canvases } = get();
        if (!future.length) return;
        const next = future[0];
        const newCanvases = syncActiveCanvas(canvases, activeCanvasId, next.nodes, next.edges);
        set({ future: future.slice(1), past: [...past, { nodes, edges }], nodes: next.nodes, edges: next.edges, canvases: newCanvases });
      },

      // ── Node/edge operations ───────────────────────────────────────────────
      onNodesChange: (changes) => {
        const structural = changes.filter((c) => c.type === 'add' || c.type === 'remove');
        if (structural.length) get().pushHistory();
        let nodes = applyNodeChanges(changes, get().nodes);
        if (structural.length > 0) {
          nodes = validateAndFixNodes(nodes);
        }
        const canvases = syncActiveCanvas(get().canvases, get().activeCanvasId, nodes, get().edges);
        set({ nodes, canvases });
        get().saveCanvasToDB(get().activeCanvasId);
      },

      onEdgesChange: (changes) => {
        const structural = changes.filter((c) => c.type === 'remove');
        if (structural.length) get().pushHistory();
        const edges = applyEdgeChanges(changes, get().edges);
        const canvases = syncActiveCanvas(get().canvases, get().activeCanvasId, get().nodes, edges);
        set({ edges, canvases });
        get().saveCanvasToDB(get().activeCanvasId);
      },

      onConnect: (connection) => {
        get().pushHistory();
        const { source, target, sourceHandle, targetHandle } = connection;
        if (!source || !target) return;

        const newEdge = createEdge(source, target, '', {
            sourceHandle,
            targetHandle,
        });

        const rawEdges = addEdge(
          newEdge,
          get().edges
        );
        const edges = distributeTargetHandles(get().nodes, rawEdges);
        const canvases = syncActiveCanvas(get().canvases, get().activeCanvasId, get().nodes, edges);
        set({ edges, canvases });
        get().saveCanvasToDB(get().activeCanvasId);
      },

      onReconnect: (oldEdge, newConnection) => {
        get().pushHistory();
        const rawEdges = get().edges.map(e => {
          if (e.id === oldEdge.id) {
            return {
              ...e,
              source: newConnection.source || e.source,
              target: newConnection.target || e.target,
              sourceHandle: newConnection.sourceHandle || e.sourceHandle,
              targetHandle: newConnection.targetHandle || e.targetHandle,
            };
          }
          return e;
        });
        const edges = distributeTargetHandles(get().nodes, rawEdges);
        const canvases = syncActiveCanvas(get().canvases, get().activeCanvasId, get().nodes, edges);
        set({ edges, canvases });
        get().saveCanvasToDB(get().activeCanvasId);
      },

      addNode: (type, label, category, color, icon, technology, position) => {
        get().pushHistory();
        
        let newNode: Node<NodeData>;
        
        // Check if first arg is a pre-built node (from factory)
        if (typeof type === 'object' && 'id' in type && 'data' in type) {
          newNode = type as Node<NodeData>;
        } else {
          // Legacy path - construct node through factory
          const pos = position ?? { x: 400 + Math.random() * 200 - 100, y: 300 + Math.random() * 200 - 100 };
          const shape = getNodeShape(category || 'Compute');
          
          let componentType = type;
          try {
            getStrictPortConfig(type);
          } catch {
            componentType = (category || 'compute').toLowerCase().replace(/[^a-z0-9]/g, '_');
          }
          
          newNode = createNode(
            type,
            label || type,
            pos,
            {
              type: 'systemNode',
              data: {
                category: category || 'Compute',
                color,
                icon,
                technology,
                shape,
                componentType,
              }
            }
          ) as Node<NodeData>;
        }
        
        const nodes = [...get().nodes, newNode];
        const canvases = syncActiveCanvas(get().canvases, get().activeCanvasId, nodes, get().edges);
        set({ nodes, canvases });
        get().saveCanvasToDB(get().activeCanvasId);
      },

      removeNode: (id) => {
        get().pushHistory();
        const nodes = get().nodes;
        const targetNode = nodes.find((n) => n.id === id);
        
        let updatedNodes = nodes.filter((n) => n.id !== id);
        
        // If deleting a group node, ungroup its children first
        if (targetNode?.type === 'groupNode' || targetNode?.type === 'group') {
          const groupPosition = targetNode.position;
          updatedNodes = updatedNodes.map((n) => {
            if (n.parentId === id || (n as Record<string, unknown>).parentNode === id) {
              return {
                ...n,
                position: {
                  x: n.position.x + groupPosition.x,
                  y: n.position.y + groupPosition.y,
                },
                parentId: undefined,
                parentNode: undefined,
                extent: undefined,
              };
            }
            return n;
          });
        }
        
        // Clean orphaned children and validate node order
        const validatedNodes = validateAndFixNodes(updatedNodes);
        
        const edges = get().edges.filter((e) => e.source !== id && e.target !== id);
        const canvases = syncActiveCanvas(get().canvases, get().activeCanvasId, validatedNodes, edges);
        set({ nodes: validatedNodes, edges, canvases, selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId });
        get().saveCanvasToDB(get().activeCanvasId);
      },

      updateNodeData: (id, data) => {
        const nodes = get().nodes.map((n) => n.id === id ? { ...n, data: { ...n.data, ...data } } : n);
        const canvases = syncActiveCanvas(get().canvases, get().activeCanvasId, nodes, get().edges);
        set({ nodes, canvases });
        get().saveCanvasToDB(get().activeCanvasId);
      },

      updateNodeSize: (id, size) => {
        const nodes = get().nodes.map((n) => {
          if (n.id !== id) return n;
          return {
            ...n,
            ...(size.width !== undefined && { width: size.width }),
            ...(size.height !== undefined && { height: size.height }),
          };
        });
        const canvases = syncActiveCanvas(get().canvases, get().activeCanvasId, nodes, get().edges);
        set({ nodes, canvases });
        get().saveCanvasToDB(get().activeCanvasId);
      },

      updateEdgeData: (id, data) => {
        const edges = get().edges.map((e) => e.id === id ? { ...e, data: { ...e.data, ...data } } : e);
        const canvases = syncActiveCanvas(get().canvases, get().activeCanvasId, get().nodes, edges);
        set({ edges, canvases });
        get().saveCanvasToDB(get().activeCanvasId);
      },

      deleteEdge: (edgeId) => {
        get().pushHistory();
        const edges = get().edges.filter((e) => e.id !== edgeId);
        const canvases = syncActiveCanvas(get().canvases, get().activeCanvasId, get().nodes, edges);
        set({ edges, canvases, selectedEdgeId: null });
        get().saveCanvasToDB(get().activeCanvasId);
      },

      importDiagram: (nodes, edges) => {
        get().pushHistory();
        
        const normalizedNodes = normalizeNodes(nodes);
        const cleanedNodes = stripReservedLayerNodes(normalizedNodes);
        const validatedNodes = validateAndFixNodes(cleanedNodes);
        const resolvedNodes = resolveNodeCollisions(validatedNodes);
        const normalizedEdges = normalizeEdges(edges);
        
        const edgesWithHandles = distributeTargetHandles(resolvedNodes, normalizedEdges);
        
        const canvases = syncActiveCanvas(get().canvases, get().activeCanvasId, resolvedNodes, edgesWithHandles);
        set({ nodes: resolvedNodes, edges: edgesWithHandles, canvases });
        get().saveCanvasToDB(get().activeCanvasId);
      },

      clearDiagram: () => {
        get().pushHistory();
        const canvases = syncActiveCanvas(get().canvases, get().activeCanvasId, [], []);
        set({ nodes: [], edges: [], canvases, selectedNodeId: null });
        get().saveCanvasToDB(get().activeCanvasId);
      },

      deleteSelected: () => {
        const { selectedNodeId, selectedNodeIds, selectedEdgeId, deleteEdge, pushHistory, nodes: currentNodes, edges: currentEdges, canvases: currentCanvases, activeCanvasId } = get();
        
        if (selectedEdgeId) {
          pushHistory();
          deleteEdge(selectedEdgeId);
          return;
        }
        
        const idsToDelete = selectedNodeIds.length > 0 ? selectedNodeIds : (selectedNodeId ? [selectedNodeId] : []);
        
        if (idsToDelete.length === 0) return;
        
        pushHistory();
        
        const groupIdsToDelete = idsToDelete.filter((id) => {
          const node = currentNodes.find((n) => n.id === id);
          return node?.type === 'groupNode';
        });
        
        const childIdsOfGroups = new Set(
          groupIdsToDelete.flatMap((gid) =>
            currentNodes.filter((n) => n.parentId === gid || (n as Record<string, unknown>).parentNode === gid).map((n) => n.id)
          )
        );
        
        const allIdsToDelete = new Set([...idsToDelete, ...Array.from(childIdsOfGroups)]);
        
        let finalNodes = currentNodes.filter((n) => !allIdsToDelete.has(n.id));
        finalNodes = validateAndFixNodes(finalNodes);
        
        const newEdges = currentEdges.filter((e) => {
          if (allIdsToDelete.has(e.source) || allIdsToDelete.has(e.target)) return false;
          return true;
        });
        
        const syncedCanvases = syncActiveCanvas(currentCanvases, activeCanvasId, finalNodes, newEdges);
        
        set({ nodes: finalNodes, edges: newEdges, canvases: syncedCanvases, selectedNodeIds: [], selectedNodeId: null });
        get().saveCanvasToDB(activeCanvasId);
      },

      selectAll: () => set({ selectedNodeId: null }),

      createGroup: (parentId?: string) => {
        const { nodes, selectedNodeIds, pushHistory, activeCanvasId, canvases, edges } = get();
        if (selectedNodeIds.length < 2) return;
        pushHistory();
        const PAD = 24;
        const selected = nodes.filter((n) => selectedNodeIds.includes(n.id));
        
        let minX = Math.min(...selected.map((n) => n.position.x)) - PAD;
        let minY = Math.min(...selected.map((n) => n.position.y)) - PAD;
        let maxX = Math.max(...selected.map((n) => n.position.x + (n.width ?? 160))) + PAD;
        let maxY = Math.max(...selected.map((n) => n.position.y + (n.height ?? 80))) + PAD;
        
        if (parentId) {
          const parent = nodes.find((n) => n.id === parentId);
          if (parent) {
            minX = parent.position.x + PAD;
            minY = parent.position.y + PAD;
            maxX = parent.position.x + (parent.width ?? 400) - PAD;
            maxY = parent.position.y + (parent.height ?? 300) - PAD;
          }
        }
        
        const groupId = `group-${Date.now()}`;
        const groupNode: Node = {
          id: groupId, 
          type: 'groupNode',
          position: { x: minX, y: minY },
          style: { width: maxX - minX, height: maxY - minY },
          data: { label: 'Group', groupLabel: 'Group' }, 
          zIndex: -1,
          draggable: true,
          selectable: true,
        };
        
        const newNodes = [
          groupNode,
          ...nodes.filter((n) => !selectedNodeIds.includes(n.id)),
          ...selected.map((n) => ({
            ...n,
            parentId: groupId,
            parentNode: groupId,
            extent: 'parent' as const,
            position: { x: n.position.x - minX, y: n.position.y - minY },
          }))
        ];
        
        const newCanvases = syncActiveCanvas(canvases, activeCanvasId, newNodes, edges);
        set({ nodes: newNodes, canvases: newCanvases, selectedNodeIds: [], selectedNodeId: groupId });
        get().saveCanvasToDB(activeCanvasId);
      },

      ungroupNodes: (groupId: string) => {
        const { nodes, pushHistory, activeCanvasId, canvases, edges } = get();
        const group = nodes.find((n) => n.id === groupId);
        if (!group || group.type !== 'groupNode') return;
        pushHistory();
        
        const children = nodes.filter((n) => n.parentId === groupId || (n as Record<string, unknown>).parentNode === groupId);
        const parentOffset = { x: group.position.x, y: group.position.y };
        
        let newNodes = nodes
          .filter((n) => n.id !== groupId)
          .map((n) => {
            if (n.parentId === groupId || (n as Record<string, unknown>).parentNode === groupId) {
              return {
                ...n,
                parentId: undefined,
                parentNode: undefined,
                extent: undefined,
                position: { x: n.position.x + parentOffset.x, y: n.position.y + parentOffset.y },
              };
            }
            return n;
          });
        newNodes = validateAndFixNodes(newNodes);
        
        const newCanvases = syncActiveCanvas(canvases, activeCanvasId, newNodes, edges);
        set({ nodes: newNodes, canvases: newCanvases, selectedNodeIds: children.map((c) => c.id) });
        get().saveCanvasToDB(activeCanvasId);
      },

      moveToGroup: (nodeId: string, groupId: string | null) => {
        const { nodes, pushHistory, activeCanvasId, canvases, edges } = get();
        const node = nodes.find((n) => n.id === nodeId);
        if (!node) return;
        pushHistory();
        
        let newPosition = { ...node.position };
        if (groupId) {
          const group = nodes.find((n) => n.id === groupId);
          if (group) {
            newPosition = { x: node.position.x - group.position.x, y: node.position.y - group.position.y };
          }
        } else if (node.parentId) {
          const parent = nodes.find((n) => n.id === node.parentId);
          if (parent) {
            newPosition = { x: node.position.x + parent.position.x, y: node.position.y + parent.position.y };
          }
        }
        
        const newNodes = nodes.map((n) =>
          n.id === nodeId
            ? { ...n, parentId: groupId ?? undefined, extent: groupId ? 'parent' as const : undefined, position: newPosition }
            : n
        );
        
        const newCanvases = syncActiveCanvas(canvases, activeCanvasId, newNodes, edges);
        set({ nodes: newNodes, canvases: newCanvases });
        get().saveCanvasToDB(activeCanvasId);
      },

      loadTemplate: (nodes, edges) => {
        get().pushHistory();
        const normalizedNodes = normalizeNodes(nodes);
        const cleanedNodes = stripReservedLayerNodes(normalizedNodes);
        const validatedNodes = validateAndFixNodes(cleanedNodes);
        const resolvedNodes = resolveNodeCollisions(validatedNodes);
        const normalizedEdges = normalizeEdges(edges);
        const canvases = syncActiveCanvas(get().canvases, get().activeCanvasId, resolvedNodes, normalizedEdges);
        set({ nodes: resolvedNodes, edges: normalizedEdges, canvases, selectedNodeId: null, selectedEdgeId: null });
        get().saveCanvasToDB(get().activeCanvasId);
      },

      // ── Fit view ───────────────────────────────────────────────────────────
      fitView: (opts) => {
        fitViewCallback?.(opts ?? { padding: 0.1, duration: 400 });
      },

      // ── Edge editing ───────────────────────────────────────────────────────
      editingEdgeId: null,
      setEditingEdgeId: (id) => set({ editingEdgeId: id }),
      pendingEditEdgeId: null,
      setPendingEditEdgeId: (id) => set({ pendingEditEdgeId: id }),
      pendingLabelEdgeId: null,
      setPendingLabelEdgeId: (id) => set({ pendingLabelEdgeId: id }),
      
      updateEdgeLabel: (edgeId, label) => {
        const edges = get().edges.map((e) =>
          e.id === edgeId ? { ...e, data: { ...e.data, label: label.trim() } } : e
        );
        const canvases = syncActiveCanvas(get().canvases, get().activeCanvasId, get().nodes, edges);
        set({ edges, canvases });
        get().saveCanvasToDB(get().activeCanvasId);
      },

      // ── AI Streaming ──────────────────────────────────────────────────────
      setNodes: (nodes) => {
        const validatedNodes = validateAndFixNodes(normalizeNodes(nodes));
        const canvases = syncActiveCanvas(get().canvases, get().activeCanvasId, validatedNodes, get().edges);
        set({ nodes: validatedNodes, canvases });
        get().saveCanvasToDB(get().activeCanvasId);
      },
      setEdges: (edges) => {
        const normalized = normalizeEdges(edges);
        const canvases = syncActiveCanvas(get().canvases, get().activeCanvasId, get().nodes, normalized);
        set({ edges: normalized, canvases });
        get().saveCanvasToDB(get().activeCanvasId);
      },
      appendNode: (node) => {
        const nodes = [...get().nodes, { ...node, type: normalizeNodeType(node.type as string | undefined) }];
        const canvases = syncActiveCanvas(get().canvases, get().activeCanvasId, nodes, get().edges);
        set({ nodes, canvases });
        get().saveCanvasToDB(get().activeCanvasId);
      },
      appendEdge: (edge) => {
        const edges = [...get().edges, normalizeEdge(edge)];
        const canvases = syncActiveCanvas(get().canvases, get().activeCanvasId, get().nodes, edges);
        set({ edges, canvases });
        get().saveCanvasToDB(get().activeCanvasId);
      },

      setSequenceDiagram: (canvasId: string, mermaidSyntax: string, title: string) => {
        set((state) => ({
          sequenceDiagrams: {
            ...state.sequenceDiagrams,
            [canvasId]: { mermaidSyntax, title },
          },
        }));
      },
      clearSequenceDiagram: (canvasId: string) => {
        set((state) => {
          const { [canvasId]: _, ...rest } = state.sequenceDiagrams;
          return { sequenceDiagrams: rest };
        });
      },
      importSequenceDiagram: (mermaidSyntax: string, title: string) => {
        const canvasId = get().activeCanvasId;
        set((state) => ({
          sequenceDiagrams: {
            ...state.sequenceDiagrams,
            [canvasId]: { mermaidSyntax, title },
          },
          nodes: [],
          edges: [],
        }));
        get().saveCanvasToDB(canvasId);
      },

      loadDefaultArchitecture: () => {
        const defaultNodes: Node[] = [
          createNode('client-1', 'Web Client', { x: 50, y: 100 }, { type: 'systemNode', data: { icon: '🌐', category: 'Client' } }),
          createNode('client-2', 'Mobile App', { x: 50, y: 250 }, { type: 'systemNode', data: { icon: '📱', category: 'Client' } }),
          createNode('gateway', 'API Gateway', { x: 300, y: 175 }, { type: 'systemNode', data: { icon: '🚪', category: 'Compute' } }),
          createNode('auth', 'Auth Service', { x: 550, y: 50 }, { type: 'systemNode', data: { icon: '🔐', category: 'Compute' } }),
          createNode('core', 'Core API', { x: 550, y: 175 }, { type: 'systemNode', data: { icon: '⚙️', category: 'Compute' } }),
          createNode('billing', 'Billing Service', { x: 550, y: 300 }, { type: 'systemNode', data: { icon: '💳', category: 'Compute' } }),
          createNode('queue', 'Task Queue', { x: 800, y: 175 }, { type: 'systemNode', data: { icon: '📋', category: 'Message' } }),
          createNode('email', 'Email Service', { x: 1050, y: 100 }, { type: 'systemNode', data: { icon: '📧', category: 'Compute' } }),
          createNode('notif', 'Notification Svc', { x: 1050, y: 250 }, { type: 'systemNode', data: { icon: '🔔', category: 'Compute' } }),
          createNode('db', 'PostgreSQL', { x: 1300, y: 175 }, { type: 'systemNode', data: { icon: '🐘', category: 'Database' } }),
          createNode('cache', 'Redis Cache', { x: 1300, y: 300 }, { type: 'systemNode', data: { icon: '⚡', category: 'Cache' } }),
        ] as Node[];

        const defaultEdges: Edge[] = [
          createEdge('client-1', 'gateway', 'HTTPS'),
          createEdge('client-2', 'gateway', 'HTTPS'),
          createEdge('gateway', 'auth', 'auth'),
          createEdge('gateway', 'core', 'API'),
          createEdge('gateway', 'billing', 'API'),
          createEdge('core', 'queue', 'enqueue', { data: { edgeType: 'async' } }),
          createEdge('billing', 'queue', 'enqueue', { data: { edgeType: 'async' } }),
          createEdge('queue', 'email', 'process', { data: { edgeType: 'async' } }),
          createEdge('queue', 'notif', 'notify', { data: { edgeType: 'async' } }),
          createEdge('core', 'db', 'read/write'),
          createEdge('core', 'cache', 'cache'),
          createEdge('billing', 'db', 'read/write'),
        ];

        get().pushHistory();
        const normalizedNodes = normalizeNodes(defaultNodes);
        const normalizedEdges = normalizeEdges(defaultEdges);
        const canvases = syncActiveCanvas(get().canvases, get().activeCanvasId, normalizedNodes, normalizedEdges);
        set({ nodes: normalizedNodes, edges: normalizedEdges, canvases, selectedNodeId: null, selectedEdgeId: null });
        get().saveCanvasToDB(get().activeCanvasId);
      },

      alignConnectedNodes: () => {
        const { nodes, edges, selectedNodeIds } = get();
        const sel = new Set(selectedNodeIds);
        if (sel.size < 2) return;

        const relevantEdges = edges.filter(e => sel.has(e.source) && sel.has(e.target));
        if (relevantEdges.length === 0) return;

        get().pushHistory();

        const updated = nodes.map(n => ({
          ...n,
          position: { ...n.position },
          data: { ...n.data } as NodeData,
        }));

        for (const edge of relevantEdges) {
          const source = updated.find(n => n.id === edge.source);
          const target = updated.find(n => n.id === edge.target);
          if (!source || !target) continue;

          const dx = target.position.x - source.position.x;
          const dy = target.position.y - source.position.y;

          const sw = source.width ?? (source.data as NodeData)?.nodeWidth ?? 180;
          const sh = source.height ?? 70;
          const tw = target.width ?? (target.data as NodeData)?.nodeWidth ?? 180;
          const th = target.height ?? 70;

          if (Math.abs(dx) > Math.abs(dy)) {
            const srcCenterY = source.position.y + sh / 2;
            target.position.y = srcCenterY - th / 2;
          } else {
            const srcCenterX = source.position.x + sw / 2;
            target.position.x = srcCenterX - tw / 2;
          }
        }

        const canvases = syncActiveCanvas(get().canvases, get().activeCanvasId, updated, get().edges);
        set({ nodes: updated, canvases });
        get().saveCanvasToDB(get().activeCanvasId);
      },
    }),
    {
      name: 'archdraw-storage',
      storage: createJSONStorage(() => serializedStorage),
      partialize: (s) => ({
        canvases: s.canvases,
        activeCanvasId: s.activeCanvasId,
        nodes: s.nodes,
        edges: s.edges,
        darkMode: s.darkMode,
        canvasDarkMode: s.canvasDarkMode,
        edgeAnimations: s.edgeAnimations,
        showGrid: s.showGrid,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.canvases && state.canvases.length > 0) {
          // Ensure activeCanvasId is valid
          if (!state.activeCanvasId || !state.canvases.find((c: CanvasTab) => c.id === state.activeCanvasId)) {
            state.activeCanvasId = state.canvases[0].id;
          }
          
          const active = state.canvases.find((c: CanvasTab) => c.id === state.activeCanvasId);
          if (active) {
            // Strip reserved layer nodes, resolve collisions
            const normalizedNodes = normalizeNodes(active.nodes || []);
            const cleaned = stripReservedLayerNodes(normalizedNodes);
            const validated = validateAndFixNodes(cleaned);
            state.nodes = resolveNodeCollisions(sanitizeNodes(validated));
            state.edges = sanitizeEdges(normalizeEdges(active.edges || []));
            // Normalize node and edge types in all canvases
            state.canvases = state.canvases.map((c: CanvasTab) => ({
              ...c,
              nodes: sanitizeNodes(validateAndFixNodes(normalizeNodes(c.nodes || []))),
              edges: sanitizeEdges(normalizeEdges(c.edges || [])),
            }));
          } else {
            // Fallback: create a default canvas if none exist
            const defaultCanvas: CanvasTab = {
              id: `canvas-${Date.now()}`,
              name: 'Default',
              nodes: [],
              edges: [],
              updatedAt: Date.now(),
              isOpen: true,
              lastAccessedAt: Date.now(),
            };
            state.canvases = [defaultCanvas];
            state.activeCanvasId = defaultCanvas.id;
            state.nodes = [];
            state.edges = [];
          }
        }
      },
    }
  )
);
