// ─── File Entry ───────────────────────────────────────────────

export type FileEntry = {
  path: string;
  content: string;
};

// ─── Surface Classification (Phase 1 output) ──────────────────

export type SurfaceClassification = {
  primaryLanguage: string;
  detectedFrameworks: string[];
  hasDocker: boolean;
  hasMultipleServices: boolean;
  isMonorepo: boolean;
  projectType: 'unknown';
};

// ─── Repo Snapshot ────────────────────────────────────────────

export type RepoSnapshot = {
  repoUrl: string;
  owner: string;
  repo: string;
  fileTree: string[];
  selectedFiles: FileEntry[];
  repoMeta: {
    hasAppDir: boolean;
    hasPagesDir: boolean;
    hasPrisma: boolean;
    hasMiddleware: boolean;
    hasEnvExample: boolean;
    packageJson: Record<string, unknown> | null;
  };
  // New fields
  surfaceClassification: SurfaceClassification;
  phase1Files: FileEntry[];
  phase2Files: FileEntry[];
};

// ─── Repo Profile (Deep Classifier output) ────────────────────

export type RepoType =
  | 'documentation'
  | 'static_site'
  | 'library'
  | 'framework'
  | 'cli_tool'
  | 'frontend_only'
  | 'backend_only'
  | 'fullstack_monolith'
  | 'fullstack_separated'
  | 'microservices'
  | 'monorepo'
  | 'mobile'
  | 'data_ml'
  | 'devops_config'
  | 'unknown';

export type ArchitecturePattern =
  | 'mvc'
  | 'layered'
  | 'clean_architecture'
  | 'hexagonal'
  | 'event_driven'
  | 'serverless'
  | 'jamstack'
  | 'microservices'
  | 'monolithic'
  | 'pipeline'
  | 'unknown';

export type Confidence = 'high' | 'medium' | 'low';

export type RepoProfile = {
  repoType: RepoType;
  architecturePattern: ArchitecturePattern;
  primaryStack: {
    framework: string | null;
    language: string;
    runtime: string;
  };
  confidence: Confidence;
  reasoning: string;
  extractionStrategy: {
    keyDirectories: string[];
    entryPoints: string[];
    moduleStructure: string;
    focusAreas: string[];
  };
};

// ─── Dependency Intelligence ──────────────────────────────────

export type DependencyIntelligence = {
  name: string;
  category: string;
  purpose: string;
  usedIn: string[];
  usagePattern: string;
  architecturalRole: string;
  externalEndpoint: string | null;
  isOnCriticalPath: boolean;
};

export type DependencyMap = {
  dependencies: DependencyIntelligence[];
};

// ─── Extracted Node ───────────────────────────────────────────

export type NodeType =
  | 'PAGE'
  | 'API_ROUTE'
  | 'DATABASE'
  | 'EXTERNAL_SERVICE'
  | 'AUTH'
  | 'MIDDLEWARE'
  | 'UI_COMPONENT'
  | 'SERVICE'
  | 'CONTROLLER'
  | 'WORKER'
  | 'QUEUE'
  | 'CACHE'
  | 'STORAGE'
  | 'API_GATEWAY'
  | 'CDN'
  | 'STATE_MANAGEMENT'
  | 'DOCUMENTATION_SECTION'
  | 'CORE_MODULE'
  | 'PLUGIN_SYSTEM'
  | 'INFRASTRUCTURE'
  | 'UNKNOWN';

export type ExtractedNode = {
  id: string;
  label: string;
  type: NodeType;
  description: string;
  sourceFiles: string[];
  confidence: Confidence;
  layer?: string;
};

// ─── Rich Edge ────────────────────────────────────────────────

export type RichEdge = {
  from: string;
  to: string;
  type: string;
  label: string;
  direction: 'sync' | 'async' | 'event';
  protocol: string;
  dataFlow: string;
  triggeredBy: string;
  description: string;
  confidence: Confidence;
};

// ─── Workflow ─────────────────────────────────────────────────

export type Workflow = {
  name: string;
  description: string;
  steps: string[];
};

// ─── Relationship Analyst Output ──────────────────────────────

export type RelationshipOutput = {
  edges: RichEdge[];
  workflows: Workflow[];
};

// ─── Review Result ────────────────────────────────────────────

export type ReviewCorrection = {
  addNodes: ExtractedNode[];
  removeNodeIds: string[];
  mergeNodes: { keepId: string; removeId: string; newLabel: string }[];
  addEdges: RichEdge[];
  removeEdgeIndexes: number[];
  updateEdges: { index: number; changes: Partial<RichEdge> }[];
  workflowCorrections: string[];
};

export type ReviewResult = {
  approved: boolean;
  corrections: ReviewCorrection;
  reviewNotes: string;
};

// ─── Pipeline Result ──────────────────────────────────────────

export type PipelineResult = {
  ndjson: string;
  nodeCount: number;
  edgeCount: number;
  workflowCount: number;
  workflows: Workflow[];
  repoProfile: RepoProfile;
  dependencyMap: DependencyIntelligence[];
  reviewNotes: string;
  confidence: Confidence;
  repoMeta: RepoSnapshot['repoMeta'];
};

/** JSON body returned by POST /api/repo-diagram on success. */
export type RepoDiagramApiResponse = {
  success: true;
  ndjson: string;
  nodeCount: number;
  edgeCount: number;
  workflowCount: number;
  workflows: Workflow[];
  repoMeta: RepoSnapshot['repoMeta'];
  repoProfile: RepoProfile;
  dependencyMap: DependencyIntelligence[];
  reviewNotes: string;
  confidence: Confidence;
};
