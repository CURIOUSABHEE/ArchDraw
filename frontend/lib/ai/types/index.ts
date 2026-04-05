export interface UserIntent {
  description: string;
  systemType: string;
  complexity: 'low' | 'medium' | 'high';
}

export interface ArchitectureNode {
  id: string;
  type: string;
  label: string;
  layer: LayerType;
  position?: { x: number; y: number };
  width: number;
  height: number;
  icon: string;
  metadata: Record<string, unknown>;
  
  // LAYER INDEX (1-5 for ELK positioning)
  layerIndex?: number;
  
  // GROUP / CONTAINER FIELDS
  isGroup?: boolean;
  parentId?: string;
  groupLabel?: string;
  groupColor?: string;
  
  // SERVICE TYPE FIELD
  serviceType?: ServiceType;
}

export interface ArchitectureEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle: HandlePosition;
  targetHandle: HandlePosition;
  communicationType: CommunicationType;
  pathType: PathType;
  label: string;
  labelPosition: 'center';
  animated: boolean;
  style: {
    stroke: string;
    strokeDasharray: string;
    strokeWidth: number;
  };
  markerEnd: MarkerType;
  markerStart: MarkerType;
  edgeVariant?: EdgeVariant;
}

export interface LayoutConfig {
  algorithm: 'layered' | 'force';
  direction: 'RIGHT' | 'DOWN' | 'LEFT' | 'UP';
  elkOptions: Record<string, string>;
  layerOrder: LayerType[];
  totalWidth: number;
  totalHeight: number;
}

export interface ValidationIssue {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  nodeId: string | null;
  edgeId: string | null;
  description: string;
  fixHint: string;
}

export interface AgentHistory {
  agent: string;
  timestamp: number;
  action: string;
  result?: unknown;
}

export interface SharedState {
  userIntent: UserIntent;
  components: ArchitectureNode[];
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  layout: LayoutConfig;
  layoutHints: LayoutHints;
  issues: ValidationIssue[];
  score: number;
  iteration: number;
  history: AgentHistory[];
}

export interface ReactFlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    icon: string;
    layer: LayerType;
    layerIndex?: number;
    isGroup?: boolean;
    parentId?: string;
    groupLabel?: string;
    groupColor?: string;
    serviceType?: ServiceType;
  };
  width?: number;
  height?: number;
  zIndex?: number;
  extent?: 'parent';
  style?: Record<string, unknown>;
}

export interface ReactFlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle: HandlePosition;
  targetHandle: HandlePosition;
  type: string;
  animated: boolean;
  label: string;
  labelShowBg: boolean;
  labelBgPadding: [number, number];
  labelBgBorderRadius: number;
  labelBgStyle: { fill: string; fillOpacity?: number; stroke?: string };
  labelStyle: { fontSize: number; fontWeight: number; fill: string };
  style: {
    stroke: string;
    strokeWidth: number;
    strokeDasharray: string;
  };
  markerEnd: { type: string; color: string };
  data: {
    communicationType: CommunicationType;
    pathType: PathType;
    label: string;
    edgeVariant?: 'solid' | 'dashed' | 'dotted';
    labelX?: number;
    labelY?: number;
    labelAngle?: number;
    waypoints?: { x: number; y: number }[];
  };
}

export interface GenerationResult {
  type: 'architecture' | 'sequence';
  nodes: ReactFlowNode[];
  edges: ReactFlowEdge[];
  metadata: {
    score?: number;
    iterations?: number;
    totalNodes: number;
    totalEdges: number;
    systemType: string;
    generatedAt: string;
    edgeLayoutMetrics?: {
      pathOptimizationScore: number;
      labelPositioningScore: number;
      collisionsResolved: number;
      edgeCrossings: number;
      remainingLabelCollisions?: number;
    };
    layoutHints?: LayoutHints;
    title?: string;
    actors?: string[];
    mermaidSyntax?: string;
  };
}

export type LayerType = 
  | 'client' 
  | 'gateway' 
  | 'service' 
  | 'queue' 
  | 'database' 
  | 'cache' 
  | 'external' 
  | 'devops'
  | 'group';

export type ServiceType = 
  | 'database'
  | 'cache'
  | 'queue'
  | 'api'
  | 'loadbalancer'
  | 'storage'
  | 'cdn'
  | 'auth'
  | 'compute'
  | 'monitor'
  | 'gateway'
  | 'client'
  | 'generic';

export type CommunicationType = 'sync' | 'async' | 'stream' | 'event' | 'dep';

export type PathType = 'smooth' | 'bezier' | 'step' | 'straight';

export type HandlePosition = 'right' | 'left' | 'top' | 'bottom' | 'right-top' | 'right-mid' | 'right-bot' | 'left-top' | 'left-mid' | 'left-bot' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export type MarkerType = 'arrowclosed' | 'arrow' | 'none';

export type EdgeVariant = 'solid' | 'dashed' | 'dotted';

export type AgentAction = 'component' | 'layout' | 'edges' | 'edge_fix' | 'validate' | 'stop';

export interface PlannerDecision {
  next_action: AgentAction;
  reasoning: string;
  priority_issues: string[];
}

export interface ValidationResult {
  pass: boolean;
  critical_issues: ValidationIssue[];
  summary: string;
}

export interface ScoreResult {
  score: number;
  breakdown: {
    layout_quality: number;
    edge_quality: number;
    intent_match: number;
    communication_accuracy: number;
    penalties: number;
  };
  verdict: 'stop' | 'continue_edges' | 'continue_layout' | 'restart';
  top_improvements: string[];
}

export interface GenerationProgress {
  phase: 'planning' | 'components' | 'layout' | 'edges' | 'validating' | 'scoring' | 'complete' | 'error';
  iteration: number;
  currentAgent: string;
  score: number;
  message: string;
  progress: number;
}

export interface PrimaryFlow {
  id: string;
  nodeIds: string[];
  flowType: 'request' | 'processing' | 'async' | 'response';
}

export interface ComponentGroup {
  id: string;
  label: string;
  nodeIds: string[];
  color: string;
}

export interface LayoutHints {
  primaryFlow: PrimaryFlow[];
  groups: ComponentGroup[];
  layers: Record<LayerType, { x: number; y: number }>;
}
