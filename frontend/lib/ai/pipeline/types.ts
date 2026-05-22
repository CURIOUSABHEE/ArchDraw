import type { ServiceType } from '../types';

// Pipeline internal types

export type PipelineLayer = 
  | 'client'
  | 'presentation'
  | 'edge'
  | 'gateway'
  | 'compute'
  | 'application' 
  | 'async'
  | 'queue'
  | 'data'
  | 'observe'
  | 'observability'
  | 'external';

export interface RawNode {
  id: string;
  label: string;
  subtitle?: string;
  layer: PipelineLayer;
  icon?: string;
  serviceType?: ServiceType;
  isGroup?: boolean;
  groupLabel?: string;
  groupColor?: string;
  parentId?: string;
}

export interface RawFlow {
  path: string[];
  label?: string;
  async: boolean;
}

export interface ParsedDiagram {
  nodes: RawNode[];
  flows: RawFlow[];
}

export interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  async: boolean;
}

export interface ValidatedDiagram {
  nodes: RawNode[];
  edges: DiagramEdge[];
}

export interface LayoutedNode extends RawNode {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface IntentResult {
  type: string;
  confidence: number;
  ambiguous: boolean;
}

export interface ReasoningResult {
  systemType: string;
  nfrs: Record<string, string>;
  capPosition: string;
  boundaries: {
    entryPoints: string[];
    exitPoints: string[];
    trustZones: string[];
  };
  layerAssignment: Record<string, string>;
  patterns: { pattern: string; justification: string }[];
  stressTests: { scenario: string; outcome: string; safe: boolean; mitigation: string }[];
  keyDecisions: string[];
  // NEW: Structured architectural plan
  layers?: Record<string, { description: string; components: string[] }>;
  keyFlows?: Array<{ name: string; description: string; path: string[] }>;
  architecturalPlan?: string;
}

export interface DiagramScore {
  grade: 'A' | 'B' | 'C' | 'F';
  nodeCount: number;
  edgeCount: number;
  orphanCount: number;
  hasGroups?: boolean;
  score: number;
  // Preservation metrics
  nodesRemoved?: number;
  edgesRemoved?: number;
  groupsRemoved?: number;
  preservationPenalty?: number;
}
