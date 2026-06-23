import { apiKeyManager } from '../utils/apiKeyManager';
import type { SharedState, ArchitectureEdge, ArchitectureNode, CommunicationType, PathType, HandlePosition, MarkerType } from '../types';
import { EDGE_AGENT_PROMPT, COMMUNICATION_STYLES } from '../constants';
import { EDGE_CONFIG } from '@/lib/config';
import { getStrictPortConfig } from '@/lib/componentPorts';
import { validateEdgeOutput } from '../utils/outputValidator';
import { extractUserPreferences } from '../utils/userInputExtractor';
import logger from '@/lib/logger';

const MAX_EDGE_RETRIES = 2;

interface PortAssignment {
  sourceHandle: string;
  targetHandle: string;
}

const RIGHT_PORTS = ['right-top', 'right-mid', 'right-bot', 'right'];
const LEFT_PORTS = ['left-top', 'left-mid', 'left-bot', 'left'];

function getPortIndex(connectionIndex: number, totalConnections: number, maxPorts: number): number {
  if (totalConnections <= 1 || maxPorts <= 1) return 0;
  
  const availableSlots = Math.min(totalConnections, maxPorts);
  const slotSize = Math.ceil(totalConnections / availableSlots);
  return Math.min(Math.floor(connectionIndex / slotSize), availableSlots - 1);
}

function calculateHandlePosition(
  node: ArchitectureNode,
  isSource: boolean,
  connectionIndex: number,
  totalConnections: number
): string {
  const componentType = node.type || 'microservice';
  
  let maxPorts: number;
  try {
    const portConfig = getStrictPortConfig(componentType);
    maxPorts = isSource ? portConfig.outputs : portConfig.inputs;
  } catch {
    maxPorts = 3;
  }
  
  maxPorts = Math.min(maxPorts, 4);
  
  const layer = node.layer;
  
  if (isSource) {
    if (layer === 'data' || layer === 'observability' || layer === 'external') {
      return LEFT_PORTS[getPortIndex(connectionIndex, totalConnections, maxPorts)];
    }
    return RIGHT_PORTS[getPortIndex(connectionIndex, totalConnections, maxPorts)];
  } else {
    if (layer === 'gateway' || layer === 'presentation') {
      return RIGHT_PORTS[getPortIndex(connectionIndex, totalConnections, maxPorts)];
    }
    return LEFT_PORTS[getPortIndex(connectionIndex, totalConnections, maxPorts)];
  }
}

function assignPortsToEdges(
  edges: Partial<ArchitectureEdge>[],
  nodes: ArchitectureNode[]
): Map<string, PortAssignment> {
  const portAssignments = new Map<string, PortAssignment>();
  const nodeConnectionIndices = new Map<string, number>();
  
  for (const node of nodes) {
    nodeConnectionIndices.set(`${node.id}-source`, 0);
    nodeConnectionIndices.set(`${node.id}-target`, 0);
  }
  
  const sourceConnections = new Map<string, number>();
  const targetConnections = new Map<string, number>();
  
  for (const edge of edges) {
    if (edge.source) {
      sourceConnections.set(edge.source, (sourceConnections.get(edge.source) || 0) + 1);
    }
    if (edge.target) {
      targetConnections.set(edge.target, (targetConnections.get(edge.target) || 0) + 1);
    }
  }
  
  for (const edge of edges) {
    if (!edge.id) continue;
    
    const sourceIdx = nodeConnectionIndices.get(`${edge.source}-source`) || 0;
    const targetIdx = nodeConnectionIndices.get(`${edge.target}-target`) || 0;
    
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    
    const sourceHandle = sourceNode 
      ? calculateHandlePosition(sourceNode, true, sourceIdx, sourceConnections.get(edge.source!) || 1)
      : 'right';
    
    const targetHandle = targetNode 
      ? calculateHandlePosition(targetNode, false, targetIdx, targetConnections.get(edge.target!) || 1)
      : 'left';
    
    portAssignments.set(edge.id, { sourceHandle, targetHandle });
    
    nodeConnectionIndices.set(`${edge.source}-source`, sourceIdx + 1);
    nodeConnectionIndices.set(`${edge.target}-target`, targetIdx + 1);
  }
  
  return portAssignments;
}

interface ValidationIssue {
  edgeId: string;
  source: string;
  target: string;
  issue: string;
  severity: 'error' | 'warning';
}

function validateArchitectureRules(
  edges: Partial<ArchitectureEdge>[],
  nodes: ArchitectureNode[]
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  const getLayer = (nodeId: string): string => {
    return nodeMap.get(nodeId)?.layer || 'application';
  };

  const getNodeLabel = (nodeId: string): string => {
    return nodeMap.get(nodeId)?.label || nodeId;
  };

  for (const edge of edges) {
    if (!edge.source || !edge.target) continue;

    const sourceLayer = getLayer(edge.source);
    const targetLayer = getLayer(edge.target);
    const sourceLabel = getNodeLabel(edge.source);
    const targetLabel = getNodeLabel(edge.target);

    if (sourceLayer === 'presentation' && targetLayer === 'data') {
      issues.push({
        edgeId: edge.id || 'unknown',
        source: sourceLabel,
        target: targetLabel,
        issue: 'Presentation cannot connect directly to data tier',
        severity: 'error'
      });
    }

    if (sourceLayer === 'presentation' && targetLayer === 'async') {
      issues.push({
        edgeId: edge.id || 'unknown',
        source: sourceLabel,
        target: targetLabel,
        issue: 'Presentation cannot connect directly to async tier',
        severity: 'error'
      });
    }

    if (sourceLayer === 'presentation' && targetLayer === 'external') {
      issues.push({
        edgeId: edge.id || 'unknown',
        source: sourceLabel,
        target: targetLabel,
        issue: 'Presentation cannot connect directly to external API',
        severity: 'error'
      });
    }

    if (['data', 'observability', 'external'].includes(sourceLayer)) {
      issues.push({
        edgeId: edge.id || 'unknown',
        source: sourceLabel,
        target: targetLabel,
        issue: `${sourceLayer} nodes are sink nodes and cannot initiate connections`,
        severity: 'error'
      });
    }

    if (['gateway', 'presentation'].includes(targetLayer)) {
      issues.push({
        edgeId: edge.id || 'unknown',
        source: sourceLabel,
        target: targetLabel,
        issue: `${targetLayer} cannot receive connections (only emits)`,
        severity: 'error'
      });
    }

    if (sourceLayer === 'external' && targetLayer === 'application') {
      const issuesForThis = issues.filter(i => i.edgeId === edge.id);
      if (issuesForThis.length === 0) {
        issues.push({
          edgeId: edge.id || 'unknown',
          source: sourceLabel,
          target: targetLabel,
          issue: 'External APIs should not orchestrate services',
          severity: 'warning'
        });
      }
    }

    if (sourceLayer === 'observability' && targetLayer === 'application') {
      issues.push({
        edgeId: edge.id || 'unknown',
        source: sourceLabel,
        target: targetLabel,
        issue: 'Observability tier should not be in request path',
        severity: 'warning'
      });
    }

    if (edge.source === edge.target) {
      issues.push({
        edgeId: edge.id || 'unknown',
        source: sourceLabel,
        target: targetLabel,
        issue: 'Self-loops are not allowed',
        severity: 'error'
      });
    }
  }

  const asyncNodes = nodes.filter(n => n.layer === 'async');
  for (const queue of asyncNodes) {
    const producers = edges.filter(e => e.source !== queue.id && e.target === queue.id).length;
    const consumers = edges.filter(e => e.source === queue.id).length;

    if (producers === 0) {
      issues.push({
        edgeId: `queue-${queue.id}`,
        source: queue.label,
        target: '',
        issue: `Async ${queue.label} has no producers`,
        severity: 'warning'
      });
    }

    if (consumers === 0) {
      issues.push({
        edgeId: `queue-${queue.id}`,
        source: queue.label,
        target: '',
        issue: `Async ${queue.label} has no consumers`,
        severity: 'warning'
      });
    }
  }

  return issues;
}

function validateFlowCompleteness(
  edges: Partial<ArchitectureEdge>[],
  nodes: ArchitectureNode[]
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  
  const getLayer = (nodeId: string): string => {
    return nodeMap.get(nodeId)?.layer || 'application';
  };
  
  const layersPresent = new Set(nodes.map(n => n.layer));
  
  const hasWriteFlow = layersPresent.has('presentation') && layersPresent.has('application');
  const hasDatabase = layersPresent.has('data');
  const hasQueue = layersPresent.has('async');
  
  if (layersPresent.has('application') && hasDatabase) {
    const serviceToDb = edges.filter(e => {
      const source = e.source;
      const target = e.target;
      if (!source || !target) return false;
      return getLayer(source) === 'application' && getLayer(target) === 'data';
    });
    
    if (serviceToDb.length === 0 && hasWriteFlow) {
      issues.push({
        edgeId: 'flow-write',
        source: 'application',
        target: 'data',
        issue: 'No write flow: application should connect to data tier for persistence',
        severity: 'warning'
      });
    }
  }
  
  if (hasQueue) {
    const queueNodes = nodes.filter(n => n.layer === 'async');
    
    for (const queue of queueNodes) {
      const producers = edges.filter(e => e.target === queue.id).length;
      const consumers = edges.filter(e => e.source === queue.id).length;
      
      if (producers === 0) {
        issues.push({
          edgeId: `queue-missing-${queue.id}`,
          source: 'application',
          target: queue.label,
          issue: `Queue ${queue.label} has no producer (async flow incomplete)`,
          severity: 'warning'
        });
      }
      
      if (consumers === 0) {
        issues.push({
          edgeId: `queue-consumer-${queue.id}`,
          source: queue.label,
          target: 'worker',
          issue: `Queue ${queue.label} has no consumer (fan-out incomplete)`,
          severity: 'warning'
        });
      }
    }
  }
  
  const presentationNodes = nodes.filter(n => n.layer === 'presentation');
  const gatewayNodes = nodes.filter(n => n.layer === 'gateway');
  
  if (presentationNodes.length > 0 && gatewayNodes.length > 0) {
    const presentationToGateway = edges.filter(e => {
      const source = e.source;
      const target = e.target;
      if (!source || !target) return false;
      return getLayer(source) === 'presentation' && getLayer(target) === 'gateway';
    });
    
    if (presentationToGateway.length === 0) {
      issues.push({
        edgeId: 'flow-presentation-gateway',
        source: 'presentation',
        target: 'gateway',
        issue: 'Presentation exists but does not connect to gateway tier',
        severity: 'warning'
      });
    }
  }
  
  return issues;
}

function fixArchitectureIssues(
  edges: ArchitectureEdge[],
  nodes: ArchitectureNode[]
): ArchitectureEdge[] {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const fixedEdges: ArchitectureEdge[] = [];
  
  const getLayer = (nodeId: string): string => {
    return nodeMap.get(nodeId)?.layer || 'application';
  };

  for (const edge of edges) {
    const sourceLayer = getLayer(edge.source);
    const targetLayer = getLayer(edge.target);

    let shouldSkip = false;

    if (sourceLayer === 'presentation' && (targetLayer === 'data' || targetLayer === 'async' || targetLayer === 'external')) {
      logger.warn(`[EdgeAgent] Removing invalid edge: presentation -> ${targetLayer}`);
      shouldSkip = true;
    }

    if (['data', 'observability', 'external'].includes(sourceLayer)) {
      logger.warn(`[EdgeAgent] Removing invalid edge: ${sourceLayer} initiates connection`);
      shouldSkip = true;
    }

    if (edge.source === edge.target) {
      logger.warn(`[EdgeAgent] Removing self-loop: "${edge.source}" -> "${edge.target}" (id: ${edge.id})`);
      shouldSkip = true;
    }

    if (!shouldSkip) {
      fixedEdges.push(edge);
    }
  }

  return fixedEdges;
}

export async function runEdgeAgent(state: SharedState, model?: string): Promise<ArchitectureEdge[]> {
  const nodesToUse = state.components.length > 0 ? state.components : state.nodes;
  const selectedModel = model || 'llama-3.3-70b-versatile';
  const provider = selectedModel.includes('/') ? 'openrouter' : 'groq';
  
  if (nodesToUse.length === 0) {
    logger.warn('[EdgeAgent] No nodes available, returning empty edges');
    return [];
  }

  const nodesJson = JSON.stringify(nodesToUse.map(n => ({
    id: n.id,
    label: n.label,
    layer: n.layer
  })), null, 2);

  const userPreferences = extractUserPreferences(state.userIntent.description);

  const userFlowSection = userPreferences.flows.length > 0 ? `
══════════════════════════════════════════════════════════════════════════════
USER-SPECIFIED FLOWS (MUST CREATE THESE EDGES EXACTLY):
══════════════════════════════════════════════════════════════════════════════
The user described these specific flows. Create edges that follow this exact order:
${userPreferences.flows.map(flow => {
  const steps = flow.steps.join(' → ');
  const critical = flow.critical ? ' [CRITICAL - must be prominent]' : '';
  const type = `[${flow.type.toUpperCase()}]`;
  return `${type} ${steps}${critical}`;
}).join('\n')}

For each flow:
1. Find matching nodes in the current nodes list (fuzzy match on labels)
2. Create edges connecting them in the exact order specified
3. Use the correct communication type for each connection
`.trim() : '';

  let lastError = '';

  for (let attempt = 1; attempt <= MAX_EDGE_RETRIES; attempt++) {
    try {
      const prompt = `${EDGE_AGENT_PROMPT}

${userFlowSection ? `${userFlowSection}\n` : ''}
User's System Description (USE AS AUTHORITY):
${state.userIntent.description}

Current Nodes (${nodesToUse.length}):
${nodesJson}

IMPORTANT: Create edges that EXACTLY match the flows described by the user.
Every node must have at least one connection.

Output JSON with an "edges" array. Each edge must have:
- id: unique edge id
- source: source node id
- target: target node id  
- communicationType: "sync" | "async" | "stream" | "event" | "dep"
- label: descriptive label for the connection`;

      const result = await apiKeyManager.executeWithRetry(async (client) => {
        const completion = await client.chat.completions.create({
          model: selectedModel,
          messages: [
            { role: 'system', content: 'You are a JSON-only output system. Always respond with valid JSON object with an "edges" array. Do NOT wrap in markdown code blocks.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.1,
          max_tokens: 4096,
        });

        const content = completion.choices[0]?.message?.content ?? '';
        return content;
      }, { provider });

      const cleanedResult = result
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/gi, '')
        .trim();

      let parsed: Partial<ArchitectureEdge>[] = [];
      try {
        const jsonObj = JSON.parse(cleanedResult);
        if (Array.isArray(jsonObj)) {
          parsed = jsonObj;
        } else if (jsonObj.edges && Array.isArray(jsonObj.edges)) {
          parsed = jsonObj.edges;
        } else if (jsonObj.connections && Array.isArray(jsonObj.connections)) {
          parsed = jsonObj.connections;
        }
      } catch {
        logger.warn('[EdgeAgent] JSON parse failed, trying regex extraction');
        const arrayMatch = cleanedResult.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          try {
            parsed = JSON.parse(arrayMatch[0]);
          } catch {
            logger.warn('[EdgeAgent] Regex extraction failed');
          }
        }
      }

      if (parsed.length === 0) {
        logger.warn('[EdgeAgent] No edges parsed from LLM, using default generation');
        return generateDefaultEdges(nodesToUse);
      }

      const portAssignments = assignPortsToEdges(parsed, nodesToUse);
      
      const edges = parsed.map((edge) => createFullEdge(edge, nodesToUse, portAssignments));

      const edgesWithMonitoring = edges.map(edge => {
        const targetNode = nodesToUse.find(n => n.id === edge.target);
        if (targetNode?.serviceType === 'monitor' && edge.edgeVariant === 'solid') {
          logger.log(`[EdgeAgent] Overriding edgeVariant to dashed for monitoring target: ${edge.target}`);
          return { ...edge, edgeVariant: 'dashed' as const };
        }
        return edge;
      });

      const validationIssues = validateArchitectureRules(edgesWithMonitoring, nodesToUse);
      if (validationIssues.length > 0) {
        logger.warn(`[EdgeAgent] Found ${validationIssues.length} architecture issues:`, validationIssues);
        
        const fixedEdges = fixArchitectureIssues(edgesWithMonitoring, nodesToUse);
        
        const remainingIssues = validateArchitectureRules(fixedEdges, nodesToUse);
        if (remainingIssues.length > 0) {
          logger.warn(`[EdgeAgent] After fix, ${remainingIssues.length} issues remain:`, remainingIssues);
        }
        
        return fixedEdges;
      }

      const edgeValidation = validateEdgeOutput(edgesWithMonitoring, nodesToUse);
      if (!edgeValidation.valid) {
        lastError = edgeValidation.failures.join('\n');
        logger.warn(`[EdgeAgent] Validation failed (attempt ${attempt}/${MAX_EDGE_RETRIES}):`, lastError);
        
        if (attempt < MAX_EDGE_RETRIES) {
          continue;
        }
      }

      return edgeValidation.autoFixed;
    } catch (error) {
      lastError = String(error);
      logger.error(`[EdgeAgent] Error (attempt ${attempt}/${MAX_EDGE_RETRIES}):`, error);
      
      if (attempt === MAX_EDGE_RETRIES) {
        break;
      }
    }
  }

  logger.error('[EdgeAgent] All retries failed, using defaults after validation failure:', lastError);
  return generateDefaultEdges(nodesToUse);
}

function createFullEdge(
  edge: Partial<ArchitectureEdge>, 
  nodes: ArchitectureNode[],
  portAssignments?: Map<string, PortAssignment>
): ArchitectureEdge {
  const commType = (edge.communicationType ?? 'sync') as CommunicationType;
  const style = COMMUNICATION_STYLES[commType] ?? COMMUNICATION_STYLES.sync;

  const portAssignment = edge.id ? portAssignments?.get(edge.id) : undefined;
  const sourceHandle = portAssignment?.sourceHandle ?? 'right';
  const targetHandle = portAssignment?.targetHandle ?? 'left';

  return {
    id: edge.id ?? `edge-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    source: edge.source ?? '',
    target: edge.target ?? '',
    sourceHandle: sourceHandle as HandlePosition,
    targetHandle: targetHandle as HandlePosition,
    communicationType: commType,
    pathType: (style.pathType ?? 'smooth') as PathType,
    label: edge.label ?? `${commType.toUpperCase()} Call`,
    labelPosition: 'center',
    animated: style.animated,
    style: {
      stroke: style.color,
      strokeDasharray: style.strokeDasharray ?? '',
      strokeWidth: EDGE_CONFIG.strokeWidth,
    },
    markerEnd: (style.markerEnd ?? 'arrowclosed') as MarkerType,
    markerStart: 'none',
    edgeVariant: edge.edgeVariant ?? 'solid',
  };
}

function generateDefaultEdges(nodes: ArchitectureNode[]): ArchitectureEdge[] {
  const edges: ArchitectureEdge[] = [];
  
  if (nodes.length < 2) {
    logger.warn('[EdgeAgent] Less than 2 nodes, cannot create edges');
    return edges;
  }

  // Simplified default generation
  const presentation = nodes.filter(n => n.layer === 'presentation');
  const application = nodes.filter(n => n.layer === 'application');
  const data = nodes.filter(n => n.layer === 'data');

  if (presentation.length > 0 && application.length > 0) {
    presentation.forEach(p => {
      application.forEach(a => {
        edges.push(createEdge(p, a, 'sync', 'HTTP'));
      });
    });
  }

  if (application.length > 0 && data.length > 0) {
    application.forEach(a => {
      data.forEach(d => {
        edges.push(createEdge(a, d, 'sync', 'Query'));
      });
    });
  }

  return edges;
}

function createEdge(
  source: ArchitectureNode,
  target: ArchitectureNode,
  commType: CommunicationType,
  label: string
): ArchitectureEdge {
  const style = COMMUNICATION_STYLES[commType] ?? COMMUNICATION_STYLES.sync;

  return {
    id: `edge-${source.id}-${target.id}`,
    source: source.id,
    target: target.id,
    sourceHandle: 'right',
    targetHandle: 'left',
    communicationType: commType,
    pathType: (style.pathType ?? 'smooth') as PathType,
    label,
    labelPosition: 'center',
    animated: style.animated,
    style: {
      stroke: style.color,
      strokeDasharray: style.strokeDasharray ?? '',
      strokeWidth: EDGE_CONFIG.strokeWidth,
    },
    markerEnd: (style.markerEnd ?? 'arrowclosed') as MarkerType,
    markerStart: 'none',
  };
}
