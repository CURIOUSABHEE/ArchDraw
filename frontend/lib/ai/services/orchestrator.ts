import type {
  SharedState,
  UserIntent,
  GenerationResult,
  GenerationProgress,
  ReactFlowNode,
  ReactFlowEdge,
  ArchitectureEdge,
  ArchitectureNode,
  PathType,
  HandlePosition,
  CommunicationType,
  LayoutHints,
} from '../types';
import {
  runPlannerAgent,
  runComponentAgent,
  runEdgeAgent,
  runScorerAgent,
} from '../agents';
import { generateLayoutHints } from './layoutHints';
import {
  MAX_ITERATIONS,
  SCORE_THRESHOLD,
  LAYER_ORDER,
  DEFAULT_ELK_OPTIONS,
  LAYER_X_POSITIONS,
  NODE_WIDTH_STANDARD,
  NODE_HEIGHT_STANDARD,
  NODE_SPACING_VERTICAL,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  COMMUNICATION_STYLES,
  EDGE_LABEL_CONFIG,
} from '../constants';
import {
  computeELKLayout,
  computeEdgePathsWithELK,
} from './elkLayoutService';
import {
  computeEdgeLayout,
  type EdgePath,
} from './edgeLayout';
import {
  detectEdgeCollisions,
  resolveCollisions,
} from './edgeCollisionDetector';
import {
  optimizeEdgePaths,
} from './edgePathOptimizer';
import {
  computeOptimalLabelPositions,
} from './edgeLabelPositioner';

export type ProgressCallback = (progress: GenerationProgress) => void;

export async function generateDiagram(
  userIntent: UserIntent,
  onProgress?: ProgressCallback
): Promise<GenerationResult> {
  const initialLayoutHints: LayoutHints = {
    primaryFlow: [],
    groups: [],
    layers: {
      client: { x: 0, y: 200 },
      gateway: { x: 200, y: 200 },
      service: { x: 400, y: 200 },
      queue: { x: 600, y: 200 },
      database: { x: 800, y: 200 },
      cache: { x: 800, y: 100 },
      external: { x: 1000, y: 200 },
      devops: { x: 600, y: 400 }
    }
  };

  const state: SharedState = {
    userIntent,
    components: [],
    nodes: [],
    edges: [],
    layout: {
      algorithm: 'layered',
      direction: 'RIGHT',
      elkOptions: DEFAULT_ELK_OPTIONS,
      layerOrder: LAYER_ORDER,
      totalWidth: 0,
      totalHeight: 0,
    },
    layoutHints: initialLayoutHints,
    issues: [],
    score: 0,
    iteration: 0,
    history: [],
  };

  const emit = (phase: GenerationProgress['phase'], message: string, progress = 50) => {
    onProgress?.({
      phase,
      iteration: state.iteration,
      currentAgent: phase,
      score: state.score,
      message,
      progress,
    });
  };

  emit('planning', 'Starting diagram generation...', 10);

  // ELK Layout result storage
  let elkLayoutResult: Awaited<ReturnType<typeof computeELKLayout>> | null = null;

  try {
    // PHASE 1: Generate components (1 API call)
    emit('components', 'Analyzing system components...', 20);
    state.components = await runComponentAgent(state);
    emit('components', `Found ${state.components.length} components`, 30);

    // PHASE 2: Generate edges (1 API call)
    emit('edges', 'Creating connections between components...', 40);
    state.edges = await runEdgeAgent(state);
    console.log(`[Orchestrator] Generated ${state.edges.length} edges`);
    emit('edges', `Created ${state.edges.length} connections`, 50);

    // PHASE 3: Compute layout with ELK (0 API calls, uses elkjs)
    emit('layout', 'Computing layout with ELK.js...', 60);
    elkLayoutResult = await computeELKLayout(state.components, state.edges);
    console.log(`[Orchestrator] ELK layout computed ${elkLayoutResult.nodes.length} nodes`);

    // PHASE 4: Score the diagram (1 API call)
    emit('scoring', 'Calculating quality score...', 80);
    const scoreResult = await runScorerAgent({
      ...state,
      nodes: state.components.map(c => ({ ...c, position: elkLayoutResult!.nodes.find(n => n.id === c.id)?.position ?? { x: 0, y: 0 } })),
    });
    state.score = scoreResult.score;
    emit('scoring', `Score: ${scoreResult.score}/100 - ${scoreResult.verdict}`, 85);

    // PHASE 5: If score is low, regenerate edges once (1 API call)
    if (scoreResult.score < 70) {
      console.log('[Orchestrator] Score low, regenerating edges...');
      emit('edges', 'Regenerating connections...', 75);
      state.edges = await runEdgeAgent(state);
    }

    emit('complete', 'Generation complete!', 100);

  } catch (error) {
    console.error('Generation error:', error);
    emit('error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 100);
    throw error;
  }

  // Use ELK layout if available, otherwise fallback to computeLayeredLayout
  console.log(`[Orchestrator] state.components.length: ${state.components.length}`);
  console.log(`[Orchestrator] state.edges.length: ${state.edges.length}`);
  console.log(`[Orchestrator] elkLayoutResult?.nodes.length: ${elkLayoutResult?.nodes.length ?? 'null'}`);
  
  let reactFlowNodes: ReturnType<typeof computeLayeredLayout>;
  if (elkLayoutResult && elkLayoutResult.nodes.length > 0) {
    reactFlowNodes = elkLayoutResult.nodes;
    console.log('[Orchestrator] Using ELK layout');
  } else {
    reactFlowNodes = computeLayeredLayout(state.components, state.edges);
    console.log('[Orchestrator] Using fallback layout');
  }
  
  console.log(`[Orchestrator] reactFlowNodes.length: ${reactFlowNodes.length}`);
  
  const nodeIdSet = new Set(reactFlowNodes.map(n => n.id));
  console.log(`[Orchestrator] nodeIdSet.size: ${nodeIdSet.size}`);
  
  const reactFlowEdges = convertToReactFlowEdges(state.edges, nodeIdSet);
  console.log(`[Orchestrator] reactFlowEdges.length: ${reactFlowEdges.length}`);

  // Edge Layout Pipeline - Collision avoidance loops until ALL collisions are resolved
  let edgePaths = computeEdgeLayout(reactFlowNodes, reactFlowEdges);
  let totalCollisionsResolved = 0;
  let finalOptimizationScore = 0;
  let finalCrossings = 0;
  let collisionLoopCount = 0;

  while (true) {
    collisionLoopCount++;
    console.log(`[EdgeLayout] Collision avoidance loop #${collisionLoopCount}`);

    // 1. Detect collisions
    const collisionReport = detectEdgeCollisions(reactFlowNodes, reactFlowEdges, edgePaths);
    
    if (!collisionReport.hasCollisions) {
      console.log(`[EdgeLayout] All collisions resolved! (loops: ${collisionLoopCount})`);
      break;
    }

    console.log(`[EdgeLayout] Found ${collisionReport.totalCollisions} collisions - resolving...`);

    // 2. Resolve all collisions in one pass
    const { resolvedPaths } = resolveCollisions(
      reactFlowNodes,
      reactFlowEdges,
      edgePaths,
      collisionReport.collisions
    );
    edgePaths = resolvedPaths;
    totalCollisionsResolved += collisionReport.collisions.length;

    // 3. Optimize paths (parallel edge separation + crossing minimization)
    const optimizationResult = optimizeEdgePaths(reactFlowNodes, reactFlowEdges, edgePaths);
    edgePaths = optimizationResult.optimizedPaths;
    finalOptimizationScore = optimizationResult.score;
    finalCrossings = optimizationResult.metrics.edgeCrossings;

    // Safety check - prevent infinite loops (max 20 collision avoidance loops)
    if (collisionLoopCount >= 20) {
      console.warn(`[EdgeLayout] Max collision loops reached (20) - stopping`);
      break;
    }
  }

  // Final optimization pass
  const finalOptimization = optimizeEdgePaths(reactFlowNodes, reactFlowEdges, edgePaths);
  edgePaths = finalOptimization.optimizedPaths;
  finalOptimizationScore = finalOptimization.score;
  finalCrossings = finalOptimization.metrics.edgeCrossings;

  // Compute optimal label positions (single pass, collision-aware)
  const labelPositioningResult = computeOptimalLabelPositions(
    reactFlowNodes,
    reactFlowEdges,
    edgePaths
  );

  // Apply computed label positions to edges
  const finalEdges = reactFlowEdges.map(edge => {
    const labelPos = labelPositioningResult.positions.get(edge.id);
    const pathData = edgePaths.find(p => p.id === edge.id);
    
    return {
      ...edge,
      data: {
        ...edge.data,
        labelX: labelPos?.x ?? 0,
        labelY: labelPos?.y ?? 0,
        labelAngle: labelPos?.angle ?? 0,
        waypoints: pathData?.waypoints,
      },
    };
  });

  // Final collision check
  const finalCollisionCheck = detectEdgeCollisions(reactFlowNodes, finalEdges, edgePaths);
  const remainingCollisions = finalCollisionCheck.totalCollisions;

  console.log(`[EdgeLayout] Complete - Resolved: ${totalCollisionsResolved}, Remaining: ${remainingCollisions}`);

  const layoutHints = generateLayoutHints(state.components, state.edges);

  return {
    nodes: reactFlowNodes,
    edges: finalEdges,
    metadata: {
      score: state.score,
      iterations: state.iteration,
      totalNodes: reactFlowNodes.length,
      totalEdges: finalEdges.length,
      systemType: state.userIntent.systemType,
      generatedAt: new Date().toISOString(),
      edgeLayoutMetrics: {
        pathOptimizationScore: finalOptimizationScore,
        labelPositioningScore: labelPositioningResult.score,
        collisionsResolved: totalCollisionsResolved,
        edgeCrossings: finalCrossings,
        remainingLabelCollisions: remainingCollisions,
      },
      layoutHints,
    },
  };
}

/**
 * Compute LEFT-TO-RIGHT layered layout:
 * - Each layer at a fixed X position
 * - Nodes vertically CENTERED within the canvas
 * - Consistent spacing between nodes
 */
function computeLayeredLayout(
  nodes: ArchitectureNode[],
  _edges: ArchitectureEdge[]
): ReactFlowNode[] {
  const reactFlowNodes: ReactFlowNode[] = [];
  const nodeWidth = NODE_WIDTH_STANDARD;
  const nodeHeight = NODE_HEIGHT_STANDARD;

  console.log(`[computeLayeredLayout] Input nodes count: ${nodes.length}`);
  if (nodes.length > 0) {
    console.log(`[computeLayeredLayout] First node sample:`, JSON.stringify(nodes[0]));
  }

  // 1. Group nodes by layer
  const nodesByLayer: Record<string, ArchitectureNode[]> = {};
  for (const node of nodes) {
    const layer = node.layer || 'service';
    if (!nodesByLayer[layer]) {
      nodesByLayer[layer] = [];
    }
    nodesByLayer[layer].push(node);
  }

  console.log(`[computeLayeredLayout] nodesByLayer keys:`, Object.keys(nodesByLayer));

  // 2. Calculate vertical centering offset
  // Find the row with most nodes and calculate centerY based on that
  let maxNodesInRow = 0;
  for (const layer of LAYER_ORDER) {
    const layerNodes = nodesByLayer[layer] || [];
    maxNodesInRow = Math.max(maxNodesInRow, layerNodes.length);
  }
  console.log(`[computeLayeredLayout] maxNodesInRow: ${maxNodesInRow}`);
  const totalNodesHeight = maxNodesInRow * nodeHeight + (maxNodesInRow - 1) * NODE_SPACING_VERTICAL;
  const centerY = Math.max(50, (CANVAS_HEIGHT - totalNodesHeight) / 2);

  // 3. Position nodes in each layer (vertically centered)
  for (const layer of LAYER_ORDER) {
    const layerNodes = nodesByLayer[layer] || [];
    if (layerNodes.length === 0) continue;

    const layerX = LAYER_X_POSITIONS[layer] ?? 50;
    console.log(`[computeLayeredLayout] Layer ${layer}: ${layerNodes.length} nodes at x=${layerX}`);

    // Calculate vertical centering for this layer
    const layerTotalHeight = layerNodes.length * nodeHeight +
                             (layerNodes.length - 1) * NODE_SPACING_VERTICAL;
    const layerStartY = centerY;

    // Position each node in this layer
    layerNodes.forEach((node, index) => {
      const y = layerStartY + index * (nodeHeight + NODE_SPACING_VERTICAL);

      reactFlowNodes.push({
        id: node.id,
        type: 'systemNode',
        position: { x: layerX, y: y },
        data: {
          label: node.label || 'Unknown',
          icon: node.icon || 'server',
          layer: node.layer || 'service',
        },
        width: nodeWidth,
        height: nodeHeight,
      });
    });
  }

  console.log(`[computeLayeredLayout] Output nodes count: ${reactFlowNodes.length}`);

  // 4. Add any remaining nodes not in standard layers
  const addedIds = new Set(reactFlowNodes.map(n => n.id));
  const remainingNodes = nodes.filter(n => !addedIds.has(n.id));

  if (remainingNodes.length > 0) {
    console.log(`[computeLayeredLayout] Remaining nodes: ${remainingNodes.length}`);
    const defaultX = LAYER_X_POSITIONS.service ?? 490;
    const layerTotalHeight = remainingNodes.length * nodeHeight +
                             (remainingNodes.length - 1) * NODE_SPACING_VERTICAL;
    const layerStartY = centerY;

    remainingNodes.forEach((node, index) => {
      const y = layerStartY + index * (nodeHeight + NODE_SPACING_VERTICAL);

      reactFlowNodes.push({
        id: node.id,
        type: 'systemNode',
        position: { x: defaultX, y: y },
        data: {
          label: node.label || 'Unknown',
          icon: node.icon || 'server',
          layer: node.layer || 'service',
        },
        width: nodeWidth,
        height: nodeHeight,
      });
    });
  }

  console.log(`[computeLayeredLayout] Final output nodes count: ${reactFlowNodes.length}`);

  return reactFlowNodes;
}

/**
 * Convert internal edges to React Flow edges with proper configuration.
 * Uses FlowEdge's custom rendering via the 'custom' type mapping.
 *
 * For LEFT-TO-RIGHT layout:
 * - Uses right handles (source) and left handles (target)
 * - Assigns different handles for multi-edge separation
 * - Applies smooth path for most connections (from COMMUNICATION_STYLES)
 * - Labels have dark backgrounds to prevent collision issues
 */
function convertToReactFlowEdges(
  edges: ArchitectureEdge[],
  validNodeIds: Set<string>
): ReactFlowEdge[] {
  const reactFlowEdges: ReactFlowEdge[] = [];
  
  // Track edge counts per source-target pair for multi-edge handling
  const pairEdgeCount: Record<string, number> = {};
  const pairEdgeIndex: Record<string, number> = {};

  // Handle assignment patterns for multi-edge separation (LEFT-TO-RIGHT flow)
  const sourceHandles: HandlePosition[] = ['right', 'right', 'right', 'right'];
  const targetHandles: HandlePosition[] = ['left', 'left', 'left', 'left'];

  for (const edge of edges) {
    if (!validNodeIds.has(edge.source) || !validNodeIds.has(edge.target)) {
      continue;
    }

    const commType = (edge.communicationType || 'sync') as CommunicationType;

    // Track pair for multi-edge handling
    const pairKey = `${edge.source}→${edge.target}`;
    if (!pairEdgeCount[pairKey]) {
      pairEdgeCount[pairKey] = 0;
      pairEdgeIndex[pairKey] = 0;
    }
    const edgeIndex = pairEdgeIndex[pairKey]++;
    pairEdgeCount[pairKey]++;

    // Assign handles based on edge index for multi-edge separation
    const sourceHandle = sourceHandles[edgeIndex % sourceHandles.length];
    const targetHandle = targetHandles[edgeIndex % targetHandles.length];

    // Get style from COMMUNICATION_STYLES
    const style = COMMUNICATION_STYLES[commType] ?? COMMUNICATION_STYLES.sync;

    reactFlowEdges.push({
      id: `ai-${edge.source}-${edge.target}-${Math.random().toString(36).slice(2, 7)}`,
      source: edge.source,
      target: edge.target,
      sourceHandle,
      targetHandle,
      type: 'custom',
      animated: style.animated,
      label: edge.label || '',
      labelShowBg: EDGE_LABEL_CONFIG.labelShowBg,
      labelBgPadding: EDGE_LABEL_CONFIG.labelBgPadding,
      labelBgBorderRadius: EDGE_LABEL_CONFIG.labelBgBorderRadius,
      labelBgStyle: EDGE_LABEL_CONFIG.labelBgStyle,
      labelStyle: EDGE_LABEL_CONFIG.labelStyle,
      style: {
        stroke: style.color,
        strokeWidth: 2,
        strokeDasharray: style.strokeDasharray,
      },
      markerEnd: { type: style.markerEnd, color: style.color },
      data: {
        communicationType: commType,
        pathType: style.pathType,
        label: edge.label,
      },
    });
  }

  return reactFlowEdges;
}

/**
 * Check for edge-node and edge-edge label collisions
 */
function checkEdgeCollisions(
  nodes: ReactFlowNode[],
  edges: ReactFlowEdge[]
): { hasCollisions: boolean; details: string[] } {
  const collisions: string[] = [];
  
  // Create node bounding boxes
  const nodeBoxes = nodes.map(node => ({
    id: node.id,
    x: node.position.x,
    y: node.position.y,
    width: node.width ?? NODE_WIDTH_STANDARD,
    height: node.height ?? NODE_HEIGHT_STANDARD,
  }));

  for (const edge of edges) {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    
    if (!sourceNode || !targetNode) continue;

    // Get source and target handle positions
    const sourceX = sourceNode.position.x + (sourceNode.width ?? NODE_WIDTH_STANDARD) / 2;
    const sourceY = sourceNode.position.y + (sourceNode.height ?? NODE_HEIGHT_STANDARD);
    const targetX = targetNode.position.x + (targetNode.width ?? NODE_WIDTH_STANDARD) / 2;
    const targetY = targetNode.position.y;

    // Check if edge passes through any node
    for (const nodeBox of nodeBoxes) {
      if (nodeBox.id === edge.source || nodeBox.id === edge.target) continue;

      // Simple intersection check for edge line with node box
      const edgeMinX = Math.min(sourceX, targetX);
      const edgeMaxX = Math.max(sourceX, targetX);
      const edgeMinY = Math.min(sourceY, targetY);
      const edgeMaxY = Math.max(sourceY, targetY);

      const intersectsX = edgeMaxX > nodeBox.x && edgeMinX < nodeBox.x + nodeBox.width;
      const intersectsY = edgeMaxY > nodeBox.y && edgeMinY < nodeBox.y + nodeBox.height;

      if (intersectsX && intersectsY) {
        collisions.push(`Edge ${edge.id} passes through node ${nodeBox.id}`);
      }
    }
  }

  // Check for overlapping edge labels
  const labelBoxes: { x: number; y: number; edgeId: string }[] = [];
  for (const edge of edges) {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    
    if (!sourceNode || !targetNode) continue;

    const labelX = (sourceNode.position.x + targetNode.position.x) / 2 + (sourceNode.width ?? NODE_WIDTH_STANDARD) / 2;
    const labelY = (sourceNode.position.y + targetNode.position.y) / 2;
    
    for (const existing of labelBoxes) {
      const dx = Math.abs(labelX - existing.x);
      const dy = Math.abs(labelY - existing.y);
      if (dx < 80 && dy < 30) {
        collisions.push(`Labels overlap: ${edge.id} and ${existing.edgeId}`);
      }
    }
    labelBoxes.push({ x: labelX, y: labelY, edgeId: edge.id });
  }

  return {
    hasCollisions: collisions.length > 0,
    details: collisions,
  };
}

/**
 * Calculate adjusted ELK options with increased spacing to resolve collisions
 */
function getCollisionSafeElkOptions(currentOptions: Record<string, string>): Record<string, string> {
  const edgeNodeSpacing = parseInt(currentOptions['elk.spacing.edgeNode'] ?? '40', 10);
  const newSpacing = edgeNodeSpacing + 10;
  
  return {
    ...currentOptions,
    'elk.spacing.edgeNode': newSpacing.toString(),
  };
}
