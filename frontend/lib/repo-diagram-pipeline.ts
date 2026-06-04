import { ingestRepo } from './github-ingestion';
import { deepClassify } from './agents/repo-deep-classifier';
import { analyzeDependencies } from './agents/repo-dependency-intelligence';
import { extractComponents } from './agents/repo-component-extractor';
import { analyzeRelationships } from './agents/repo-relationship-analyst';
import { reviewArchitecture } from './agents/repo-architecture-reviewer';
import { compileToDiagram } from './agents/repo-schema-compiler';
import type { ExtractedNode, RichEdge, PipelineResult, RepoSnapshot, RepoProfile, DependencyIntelligence } from './types/repo-diagram';

function sanitizeRepoGraph(
  nodes: ExtractedNode[],
  edges: RichEdge[]
): { nodes: ExtractedNode[]; edges: RichEdge[] } {
  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  const dedup = new Set<string>();
  const validEdges: RichEdge[] = [];
  for (const edge of edges) {
    if (!nodeById.has(edge.from) || !nodeById.has(edge.to)) continue;
    if (edge.from === edge.to) continue;
    const key = `${edge.from}->${edge.to}->${edge.type}->${edge.label}`;
    if (dedup.has(key)) continue;
    dedup.add(key);
    validEdges.push(edge);
  }

  const connected = new Set<string>();
  for (const edge of validEdges) {
    connected.add(edge.from);
    connected.add(edge.to);
  }

  let keptNodes = nodes.filter((n) => connected.has(n.id));
  if (keptNodes.length === 0) {
    keptNodes = nodes.slice(0, Math.min(nodes.length, 2));
  }

  const keptNodeIds = new Set(keptNodes.map((n) => n.id));
  const keptEdges = validEdges.filter((e) => keptNodeIds.has(e.from) && keptNodeIds.has(e.to));

  return { nodes: keptNodes, edges: keptEdges };
}

function applyReviewCorrections(
  nodes: ExtractedNode[],
  edges: RichEdge[],
  workflows: { name: string; description: string; steps: string[] }[],
  corrections: {
    addNodes: ExtractedNode[];
    removeNodeIds: string[];
    mergeNodes: { keepId: string; removeId: string; newLabel: string }[];
    addEdges: RichEdge[];
    removeEdgeIndexes: number[];
    updateEdges: { index: number; changes: Partial<RichEdge> }[];
    workflowCorrections: string[];
  }
): { nodes: ExtractedNode[]; edges: RichEdge[]; workflows: { name: string; description: string; steps: string[] }[] } {
  let updatedNodes = [...nodes];
  let updatedEdges = [...edges];
  let updatedWorkflows = [...workflows];

  // Remove nodes
  if (corrections.removeNodeIds.length > 0) {
    updatedNodes = updatedNodes.filter((n) => !corrections.removeNodeIds.includes(n.id));
  }

  // Merge nodes
  for (const merge of corrections.mergeNodes) {
    const keepIdx = updatedNodes.findIndex((n) => n.id === merge.keepId);
    const removeIdx = updatedNodes.findIndex((n) => n.id === merge.removeId);
    if (keepIdx >= 0 && removeIdx >= 0) {
      updatedNodes[keepIdx].label = merge.newLabel;
      updatedNodes[keepIdx].sourceFiles = [
        ...new Set([...updatedNodes[keepIdx].sourceFiles, ...updatedNodes[removeIdx].sourceFiles]),
      ];
      updatedNodes.splice(removeIdx, 1);
      // Rewire edges from removed node to kept
      updatedEdges = updatedEdges.map((e) => ({
        ...e,
        from: e.from === merge.removeId ? merge.keepId : e.from,
        to: e.to === merge.removeId ? merge.keepId : e.to,
      }));
    }
  }

  // Add nodes
  if (corrections.addNodes.length > 0) {
    const existingIds = new Set(updatedNodes.map((n) => n.id));
    const toAdd = corrections.addNodes.filter((n) => !existingIds.has(n.id));
    updatedNodes.push(...toAdd);
  }

  // Remove edges by index (descending to preserve indices)
  if (corrections.removeEdgeIndexes.length > 0) {
    const sorted = [...corrections.removeEdgeIndexes].sort((a, b) => b - a);
    for (const idx of sorted) {
      if (idx >= 0 && idx < updatedEdges.length) {
        updatedEdges.splice(idx, 1);
      }
    }
  }

  // Update edges
  for (const update of corrections.updateEdges) {
    if (update.index >= 0 && update.index < updatedEdges.length) {
      updatedEdges[update.index] = { ...updatedEdges[update.index], ...update.changes };
    }
  }

  // Add edges
  if (corrections.addEdges.length > 0) {
    updatedEdges.push(...corrections.addEdges);
  }

  return { nodes: updatedNodes, edges: updatedEdges, workflows: updatedWorkflows };
}

export async function generateRepoArchitectureDiagram(repoUrl: string): Promise<PipelineResult> {
  // Step 1: Ingest
  console.log('Step 1: Ingesting repo (phase 1 triage)...');
  const snapshot: RepoSnapshot = await ingestRepo(repoUrl);
  console.log('Step 1b: Deep file selection based on surface classification...');

  // Step 2: Deep classify
  console.log('Step 2: Classifying repository type and architecture pattern...');
  const repoProfile: RepoProfile = await deepClassify(snapshot);

  // Step 3: Analyze dependencies
  console.log('Step 3: Analyzing dependency intelligence...');
  const dependencyMap = await analyzeDependencies(snapshot);

  // Step 4: Extract components
  console.log('Step 4: Extracting architectural components...');
  const nodes: ExtractedNode[] = await extractComponents(snapshot, repoProfile, dependencyMap);

  // Step 5: Analyze relationships
  console.log('Step 5: Mapping relationships and reconstructing workflows...');
  const relationshipOutput = await analyzeRelationships(snapshot, nodes, repoProfile, dependencyMap);
  let edges: RichEdge[] = relationshipOutput.edges;
  let workflows = relationshipOutput.workflows;

  // Sanitize (remove self-loops, dedup, remove orphan edges)
  const sanitized = sanitizeRepoGraph(nodes, edges);
  edges = sanitized.edges;
  let workingNodes = sanitized.nodes;

  // Step 6: Review architecture
  console.log('Step 6: Reviewing and correcting extracted architecture...');
  const reviewResult = await reviewArchitecture(
    workingNodes,
    edges,
    workflows,
    repoProfile,
    dependencyMap.dependencies
  );

  // Apply corrections
  if (!reviewResult.approved || reviewResult.corrections.addNodes.length > 0 || reviewResult.corrections.removeNodeIds.length > 0) {
    const corrected = applyReviewCorrections(
      workingNodes,
      edges,
      workflows,
      reviewResult.corrections
    );
    workingNodes = corrected.nodes;
    edges = corrected.edges;
    workflows = corrected.workflows;
  }

  // Step 7: Compile
  console.log(`Step 7: Compiling final diagram... (${workingNodes.length} nodes, ${edges.length} edges, ${workflows.length} workflows)`);
  const ndjson = compileToDiagram(workingNodes, edges, workflows);

  // Determine overall confidence
  const allConfidences = [
    repoProfile.confidence,
    ...workingNodes.map((n) => n.confidence || 'medium'),
    ...edges.map((e) => e.confidence || 'medium'),
  ];
  const hasLow = allConfidences.some((c) => c === 'low');
  const allHigh = allConfidences.every((c) => c === 'high');
  const pipelineConfidence: 'high' | 'medium' | 'low' = allHigh ? 'high' : hasLow ? 'low' : 'medium';

  return {
    ndjson,
    nodeCount: workingNodes.length,
    edgeCount: edges.length,
    workflowCount: workflows.length,
    workflows,
    repoProfile,
    dependencyMap: dependencyMap.dependencies,
    reviewNotes: reviewResult.reviewNotes,
    confidence: pipelineConfidence,
    repoMeta: snapshot.repoMeta,
  };
}
