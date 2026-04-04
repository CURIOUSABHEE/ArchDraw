import { apiKeyManager } from '../utils/apiKeyManager';
import type { SharedState, ArchitectureEdge, ArchitectureNode, CommunicationType, PathType, HandlePosition, MarkerType } from '../types';
import { EDGE_AGENT_PROMPT, COMMUNICATION_STYLES, LAYER_ORDER } from '../constants';
import { COMPONENT_PORTS, getStrictPortConfig } from '@/lib/componentPorts';
import logger from '@/lib/logger';

interface PortAssignment {
  sourceHandle: string;
  targetHandle: string;
}

interface ConnectionCount {
  sourceCount: number;
  targetCount: number;
}

const RIGHT_PORTS = ['right-top', 'right-mid', 'right-bot', 'right'];
const LEFT_PORTS = ['left-top', 'left-mid', 'left-bot', 'left'];

function countConnections(edges: Partial<ArchitectureEdge>[], nodes: ArchitectureNode[]): Map<string, ConnectionCount> {
  const counts = new Map<string, ConnectionCount>();
  
  for (const node of nodes) {
    counts.set(node.id, { sourceCount: 0, targetCount: 0 });
  }
  
  for (const edge of edges) {
    if (edge.source) {
      const current = counts.get(edge.source);
      if (current) current.sourceCount++;
    }
    if (edge.target) {
      const current = counts.get(edge.target);
      if (current) current.targetCount++;
    }
  }
  
  return counts;
}

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
    if (layer === 'database' || layer === 'cache' || layer === 'external') {
      return LEFT_PORTS[getPortIndex(connectionIndex, totalConnections, maxPorts)];
    }
    return RIGHT_PORTS[getPortIndex(connectionIndex, totalConnections, maxPorts)];
  } else {
    if (layer === 'gateway' || layer === 'client') {
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
    return nodeMap.get(nodeId)?.layer || 'service';
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

    const isSourceSink = ['database', 'cache', 'devops'].includes(sourceLayer);
    const isTargetSource = ['gateway', 'client'].includes(targetLayer);

    if (sourceLayer === 'client' && targetLayer === 'database') {
      issues.push({
        edgeId: edge.id || 'unknown',
        source: sourceLabel,
        target: targetLabel,
        issue: 'Client cannot connect directly to database',
        severity: 'error'
      });
    }

    if (sourceLayer === 'client' && targetLayer === 'queue') {
      issues.push({
        edgeId: edge.id || 'unknown',
        source: sourceLabel,
        target: targetLabel,
        issue: 'Client cannot connect directly to queue',
        severity: 'error'
      });
    }

    if (sourceLayer === 'client' && targetLayer === 'external') {
      issues.push({
        edgeId: edge.id || 'unknown',
        source: sourceLabel,
        target: targetLabel,
        issue: 'Client cannot connect directly to external API',
        severity: 'error'
      });
    }

    if (isSourceSink) {
      issues.push({
        edgeId: edge.id || 'unknown',
        source: sourceLabel,
        target: targetLabel,
        issue: `${sourceLayer} nodes are sink nodes and cannot initiate connections`,
        severity: 'error'
      });
    }

    if (isTargetSource) {
      issues.push({
        edgeId: edge.id || 'unknown',
        source: sourceLabel,
        target: targetLabel,
        issue: `${targetLayer} cannot receive connections (only emits)`,
        severity: 'error'
      });
    }

    if (sourceLayer === 'external' && targetLayer === 'service') {
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

    if (sourceLayer === 'devops' && targetLayer === 'service') {
      issues.push({
        edgeId: edge.id || 'unknown',
        source: sourceLabel,
        target: targetLabel,
        issue: 'DevOps/observability should not be in request path',
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

  const queueNodes = nodes.filter(n => n.layer === 'queue');
  for (const queue of queueNodes) {
    const producers = edges.filter(e => e.source !== queue.id && e.target === queue.id).length;
    const consumers = edges.filter(e => e.source === queue.id).length;

    if (producers === 0) {
      issues.push({
        edgeId: `queue-${queue.id}`,
        source: queue.label,
        target: '',
        issue: `Queue ${queue.label} has no producers`,
        severity: 'warning'
      });
    }

    if (consumers === 0) {
      issues.push({
        edgeId: `queue-${queue.id}`,
        source: queue.label,
        target: '',
        issue: `Queue ${queue.label} has no consumers`,
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
    return nodeMap.get(nodeId)?.layer || 'service';
  };
  
  const layersPresent = new Set(nodes.map(n => n.layer));
  
  const hasWriteFlow = layersPresent.has('client') && layersPresent.has('service');
  const hasDatabase = layersPresent.has('database');
  const hasQueue = layersPresent.has('queue');
  const hasCache = layersPresent.has('cache');
  const hasGateway = layersPresent.has('gateway');
  
  if (layersPresent.has('service') && hasDatabase) {
    const serviceToDb = edges.filter(e => {
      const source = e.source;
      const target = e.target;
      if (!source || !target) return false;
      return getLayer(source) === 'service' && getLayer(target) === 'database';
    });
    
    if (serviceToDb.length === 0 && hasWriteFlow) {
      issues.push({
        edgeId: 'flow-write',
        source: 'service',
        target: 'database',
        issue: 'No write flow: services should connect to database for persistence',
        severity: 'warning'
      });
    }
  }
  
  if (hasCache) {
    const serviceToCache = edges.filter(e => {
      const source = e.source;
      const target = e.target;
      if (!source || !target) return false;
      return getLayer(source) === 'service' && getLayer(target) === 'cache';
    });
    
    if (serviceToCache.length === 0 && hasWriteFlow) {
      issues.push({
        edgeId: 'flow-cache',
        source: 'service',
        target: 'cache',
        issue: 'Cache exists but no service connects to it (read optimization missing)',
        severity: 'warning'
      });
    }
    
    const cacheToDb = edges.filter(e => {
      const source = e.source;
      const target = e.target;
      if (!source || !target) return false;
      return getLayer(source) === 'cache' && getLayer(target) === 'database';
    });
    
    if (serviceToCache.length > 0 && cacheToDb.length === 0) {
      issues.push({
        edgeId: 'flow-cache-fallback',
        source: 'cache',
        target: 'database',
        issue: 'Cache exists but has no fallback to database',
        severity: 'warning'
      });
    }
  }
  
  if (hasQueue) {
    const queueNodes = nodes.filter(n => n.layer === 'queue');
    
    for (const queue of queueNodes) {
      const producers = edges.filter(e => e.target === queue.id).length;
      const consumers = edges.filter(e => e.source === queue.id).length;
      
      if (producers === 0) {
        issues.push({
          edgeId: `queue-missing-${queue.id}`,
          source: 'service',
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
  
  const clientNodes = nodes.filter(n => n.layer === 'client');
  const gatewayNodes = nodes.filter(n => n.layer === 'gateway');
  const serviceNodes = nodes.filter(n => n.layer === 'service');
  
  if (clientNodes.length > 0 && gatewayNodes.length > 0) {
    const clientToGateway = edges.filter(e => {
      const source = e.source;
      const target = e.target;
      if (!source || !target) return false;
      return getLayer(source) === 'client' && getLayer(target) === 'gateway';
    });
    
    if (clientToGateway.length === 0) {
      issues.push({
        edgeId: 'flow-client-gateway',
        source: 'client',
        target: 'gateway',
        issue: 'Client exists but does not connect to gateway',
        severity: 'warning'
      });
    }
  }
  
  if (gatewayNodes.length > 0 && serviceNodes.length > 0) {
    const gatewayToService = edges.filter(e => {
      const source = e.source;
      const target = e.target;
      if (!source || !target) return false;
      return getLayer(source) === 'gateway' && getLayer(target) === 'service';
    });
    
    if (gatewayToService.length === 0) {
      issues.push({
        edgeId: 'flow-gateway-service',
        source: 'gateway',
        target: 'service',
        issue: 'Gateway exists but does not connect to services',
        severity: 'warning'
      });
    }
  }
  
  return issues;
}

interface FlowGraphValidation {
  hasRequestFlow: boolean;
  hasProcessingFlow: boolean;
  hasAsyncFlow: boolean;
  hasResponseFlow: boolean;
  issues: ValidationIssue[];
}

function validateFlowGraph(
  nodes: ArchitectureNode[],
  edges: Partial<ArchitectureEdge>[]
): FlowGraphValidation {
  const issues: ValidationIssue[] = [];
  
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  
  const getLayer = (nodeId: string): string => {
    return nodeMap.get(nodeId)?.layer || 'service';
  };
  
  const nodeTypeMap = new Map<string, string>();
  for (const node of nodes) {
    const label = node.label.toLowerCase();
    const type = node.type || 'unknown';
    
    if (label.includes('client') || label.includes('browser') || label.includes('mobile')) {
      nodeTypeMap.set(node.id, 'client');
    } else if (label.includes('gateway') || label.includes('load balancer') || label.includes('cdn')) {
      nodeTypeMap.set(node.id, 'gateway');
    } else if (label.includes('websocket') || label.includes('socket') || label.includes('sse')) {
      nodeTypeMap.set(node.id, 'response');
    } else if (label.includes('queue') || label.includes('kafka') || label.includes('rabbitmq') || label.includes('sqs') || label.includes('pubsub')) {
      nodeTypeMap.set(node.id, 'async');
    } else if (label.includes('worker') || label.includes('job')) {
      nodeTypeMap.set(node.id, 'worker');
    } else if (label.includes('database') || label.includes('db') || label.includes('postgres') || label.includes('mongo') || label.includes('sql')) {
      nodeTypeMap.set(node.id, 'data');
    } else if (label.includes('cache') || label.includes('redis') || label.includes('memcached')) {
      nodeTypeMap.set(node.id, 'cache');
    } else if (label.includes('llm') || label.includes('openai') || label.includes('anthropic') || label.includes('gpt') || label.includes('embedding')) {
      nodeTypeMap.set(node.id, 'llm');
    } else if (label.includes('rag') || label.includes('vector') || label.includes('pinecone') || label.includes('weaviate')) {
      nodeTypeMap.set(node.id, 'rag');
    } else if (label.includes('service') || label.includes('api') || label.includes('server')) {
      nodeTypeMap.set(node.id, 'processor');
    } else {
      nodeTypeMap.set(node.id, 'processor');
    }
  }
  
  const hasClient = Array.from(nodeTypeMap.values()).includes('client');
  const hasGateway = Array.from(nodeTypeMap.values()).includes('gateway');
  const hasProcessor = Array.from(nodeTypeMap.values()).includes('processor');
  const hasData = Array.from(nodeTypeMap.values()).includes('data');
  const hasCache = Array.from(nodeTypeMap.values()).includes('cache');
  const hasAsync = Array.from(nodeTypeMap.values()).includes('async');
  const hasWorker = Array.from(nodeTypeMap.values()).includes('worker');
  const hasResponse = Array.from(nodeTypeMap.values()).includes('response');
  const hasLLM = Array.from(nodeTypeMap.values()).includes('llm');
  const hasRAG = Array.from(nodeTypeMap.values()).includes('rag');
  
  const hasRequestFlow = hasClient || hasGateway || hasProcessor;
  const hasProcessingFlow = hasProcessor || hasData || hasCache || hasRAG;
  const hasAsyncFlow = hasAsync || hasWorker;
  const hasResponseFlow = hasResponse || hasLLM;
  
  for (const edge of edges) {
    const sourceType = nodeTypeMap.get(edge.source || '');
    const targetType = nodeTypeMap.get(edge.target || '');
    const sourceLabel = nodeMap.get(edge.source || '')?.label || 'unknown';
    const targetLabel = nodeMap.get(edge.target || '')?.label || 'unknown';
    
    if (sourceType === 'response' && (targetType === 'data' || targetType === 'rag' || targetType === 'cache')) {
      issues.push({
        edgeId: edge.id || 'unknown',
        source: sourceLabel,
        target: targetLabel,
        issue: `Response component (${sourceLabel}) cannot connect directly to data layer (${targetLabel})`,
        severity: 'error'
      });
    }
    
    if ((sourceType === 'data' || sourceType === 'cache') && targetType === 'response') {
      issues.push({
        edgeId: edge.id || 'unknown',
        source: sourceLabel,
        target: targetLabel,
        issue: `Data layer (${sourceLabel}) cannot connect to response layer (${targetLabel})`,
        severity: 'error'
      });
    }
    
    if (sourceType === 'rag' && targetType === 'llm') {
      issues.push({
        edgeId: edge.id || 'unknown',
        source: sourceLabel,
        target: targetLabel,
        issue: `RAG pipeline (${sourceLabel}) should connect TO LLM, not FROM LLM`,
        severity: 'error'
      });
    }
    
    if (sourceType === 'llm' && targetType === 'rag') {
      issues.push({
        edgeId: edge.id || 'unknown',
        source: sourceLabel,
        target: targetLabel,
        issue: `LLM (${sourceLabel}) should connect FROM RAG pipeline, not to RAG`,
        severity: 'error'
      });
    }
    
    if (sourceType === 'response' && targetType === 'processor') {
      const sourceLabel = nodeMap.get(edge.source || '')?.label || '';
      if (!sourceLabel.toLowerCase().includes('websocket') && !sourceLabel.toLowerCase().includes('socket')) {
        issues.push({
          edgeId: edge.id || 'unknown',
          source: sourceLabel,
          target: targetLabel,
          issue: `Response component (${sourceLabel}) should only connect to services returning responses`,
          severity: 'warning'
        });
      }
    }
  }
  
  if (hasRAG && hasLLM) {
    const ragToLLM = edges.some(e => {
      const sourceType = nodeTypeMap.get(e.source || '');
      const targetType = nodeTypeMap.get(e.target || '');
      return sourceType === 'processor' && (targetType === 'llm' || targetType === 'rag');
    });
    
    if (!ragToLLM) {
      issues.push({
        edgeId: 'rag-pipeline',
        source: 'processor',
        target: 'llm',
        issue: 'RAG pipeline must sit between Chat Service and LLM API',
        severity: 'warning'
      });
    }
  }
  
  if (hasResponse && hasLLM) {
    const llmToResponse = edges.some(e => {
      const sourceType = nodeTypeMap.get(e.source || '');
      const targetType = nodeTypeMap.get(e.target || '');
      return sourceType === 'llm' && targetType === 'response';
    });
    
    if (!llmToResponse) {
      issues.push({
        edgeId: 'token-stream',
        source: 'llm',
        target: 'websocket',
        issue: 'Token streaming must originate from LLM API → WebSocket → Client',
        severity: 'warning'
      });
    }
  }
  
  return {
    hasRequestFlow,
    hasProcessingFlow,
    hasAsyncFlow,
    hasResponseFlow,
    issues
  };
}

function fixArchitectureIssues(
  edges: ArchitectureEdge[],
  nodes: ArchitectureNode[]
): ArchitectureEdge[] {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const fixedEdges: ArchitectureEdge[] = [];
  
  const getLayer = (nodeId: string): string => {
    return nodeMap.get(nodeId)?.layer || 'service';
  };

  for (const edge of edges) {
    const sourceLayer = getLayer(edge.source);
    const targetLayer = getLayer(edge.target);

    let shouldSkip = false;

    if (sourceLayer === 'client' && (targetLayer === 'database' || targetLayer === 'queue' || targetLayer === 'external')) {
      logger.warn(`[EdgeAgent] Removing invalid edge: client -> ${targetLayer}`);
      shouldSkip = true;
    }

    if (['database', 'cache', 'devops'].includes(sourceLayer)) {
      logger.warn(`[EdgeAgent] Removing invalid edge: ${sourceLayer} initiates connection`);
      shouldSkip = true;
    }

    if (sourceLayer === edge.target) {
      logger.warn(`[EdgeAgent] Removing self-loop`);
      shouldSkip = true;
    }

    if (!shouldSkip) {
      fixedEdges.push(edge);
    }
  }

  const connectedNodeIds = new Set<string>();
  for (const edge of fixedEdges) {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  }

  return fixedEdges;
}

export async function runEdgeAgent(state: SharedState): Promise<ArchitectureEdge[]> {
  // Use components if nodes are empty
  const nodesToUse = state.components.length > 0 ? state.components : state.nodes;
  
  if (nodesToUse.length === 0) {
    logger.warn('[EdgeAgent] No nodes available, returning empty edges');
    return [];
  }

  const nodesJson = JSON.stringify(nodesToUse.map(n => ({
    id: n.id,
    label: n.label,
    layer: n.layer
  })), null, 2);

  const prompt = `${EDGE_AGENT_PROMPT}

User's System Description:
${state.userIntent.description}

System Type: ${state.userIntent.systemType}

Current Nodes (${nodesToUse.length}):
${nodesJson}

IMPORTANT: You MUST create edges connecting all the nodes. Every node must have at least one connection.

Output JSON with an "edges" array. Each edge must have:
- id: unique edge id
- source: source node id
- target: target node id  
- communicationType: "sync" | "async" | "stream" | "event" | "dep"
- label: descriptive label for the connection`;

  try {
    const result = await apiKeyManager.executeWithRetry(async (groq) => {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a JSON-only output system. Always respond with valid JSON object with an "edges" array. Do NOT wrap in markdown code blocks.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 4096,
      });

      const content = completion.choices[0]?.message?.content ?? '';
      return content;
    });

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
    } catch (parseError) {
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
      return generateDefaultEdges(nodesToUse, state.userIntent);
    }

    const portAssignments = assignPortsToEdges(parsed, nodesToUse);
    
    const edges = parsed.map((edge) => createFullEdge(edge, nodesToUse, portAssignments));

    const validationIssues = validateArchitectureRules(edges, nodesToUse);
    if (validationIssues.length > 0) {
      logger.warn(`[EdgeAgent] Found ${validationIssues.length} architecture issues:`, validationIssues);
      
      const fixedEdges = fixArchitectureIssues(edges, nodesToUse);
      
      const remainingIssues = validateArchitectureRules(fixedEdges, nodesToUse);
      if (remainingIssues.length > 0) {
        logger.warn(`[EdgeAgent] After fix, ${remainingIssues.length} issues remain:`, remainingIssues);
      }
      
      return fixedEdges;
    }

    const flowIssues = validateFlowCompleteness(edges, nodesToUse);
    if (flowIssues.length > 0) {
      logger.warn(`[EdgeAgent] Found ${flowIssues.length} flow issues:`, flowIssues);
    }

    const flowGraphValidation = validateFlowGraph(nodesToUse, edges);
    if (flowGraphValidation.issues.length > 0) {
      logger.warn(`[EdgeAgent] Flow graph issues:`, flowGraphValidation.issues);
    }
    
    logger.log(`[EdgeAgent] Flow Graph Summary:`, {
      hasRequestFlow: flowGraphValidation.hasRequestFlow,
      hasProcessingFlow: flowGraphValidation.hasProcessingFlow,
      hasAsyncFlow: flowGraphValidation.hasAsyncFlow,
      hasResponseFlow: flowGraphValidation.hasResponseFlow,
    });

    return edges;
  } catch (error) {
    logger.error('[EdgeAgent] Error:', error);
    return generateDefaultEdges(nodesToUse, state.userIntent);
  }
}

function createFullEdge(
  edge: Partial<ArchitectureEdge>, 
  nodes: ArchitectureNode[],
  portAssignments?: Map<string, PortAssignment>
): ArchitectureEdge {
  const commType = (edge.communicationType ?? 'sync') as CommunicationType;
  const style = COMMUNICATION_STYLES[commType] ?? COMMUNICATION_STYLES.sync;

  const sourceNode = nodes.find(n => n.id === edge.source);
  const targetNode = nodes.find(n => n.id === edge.target);

  const sourceLayer = sourceNode?.layer ?? 'service';
  const targetLayer = targetNode?.layer ?? 'service';

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
    pathType: style.pathType,
    label: edge.label ?? `${commType.toUpperCase()} Call`,
    labelPosition: 'center',
    animated: style.animated,
    style: {
      stroke: style.color,
      strokeDasharray: style.strokeDasharray,
      strokeWidth: 2,
    },
    markerEnd: style.markerEnd as MarkerType,
    markerStart: 'none',
  };
}

function generateDefaultEdges(nodes: ArchitectureNode[], userIntent: SharedState['userIntent']): ArchitectureEdge[] {
  const edges: ArchitectureEdge[] = [];
  
  if (nodes.length < 2) {
    logger.warn('[EdgeAgent] Less than 2 nodes, cannot create edges');
    return edges;
  }

  // Group nodes by layer
  const nodesByLayer: Record<string, ArchitectureNode[]> = {};
  for (const node of nodes) {
    const layer = node.layer || 'service';
    if (!nodesByLayer[layer]) {
      nodesByLayer[layer] = [];
    }
    nodesByLayer[layer].push(node);
  }

  // 1. Connect client to gateway or first service
  const clientNodes = nodesByLayer.client ?? [];
  const gatewayNodes = nodesByLayer.gateway ?? [];
  const serviceNodes = nodesByLayer.service ?? [];
  const externalNodes = nodesByLayer.external ?? [];
  const devopsNodes = nodesByLayer.devops ?? [];
  const databaseNodes = nodesByLayer.database ?? [];
  const cacheNodes = nodesByLayer.cache ?? [];

  // Client -> Gateway (if gateway exists) or Client -> first Service
  if (clientNodes.length > 0) {
    const client = clientNodes[0];
    if (gatewayNodes.length > 0) {
      edges.push(createEdge(client, gatewayNodes[0], 'sync', 'HTTP Request'));
    } else if (serviceNodes.length > 0) {
      edges.push(createEdge(client, serviceNodes[0], 'sync', 'HTTP Request'));
    }
  }

  // Gateway -> Services
  for (const gateway of gatewayNodes) {
    for (const service of serviceNodes) {
      // Route auth-related services first
      if (service.label.toLowerCase().includes('auth')) {
        edges.push(createEdge(gateway, service, 'sync', 'Auth Request'));
      }
    }
  }

  // 2. Connect services in sequence (pipeline flow)
  if (serviceNodes.length > 0) {
    // Sort services by label to create logical flow
    const sortedServices = [...serviceNodes].sort((a, b) => {
      const aPriority = getServicePriority(a.label);
      const bPriority = getServicePriority(b.label);
      return aPriority - bPriority;
    });

    // Connect in sequence
    for (let i = 0; i < sortedServices.length - 1; i++) {
      const from = sortedServices[i];
      const to = sortedServices[i + 1];
      const { commType, label } = getConnectionType(from.label, to.label);
      edges.push(createEdge(from, to, commType, label));
    }

    // Also connect first service to last service (if more than 2)
    if (sortedServices.length > 2) {
      edges.push(createEdge(sortedServices[0], sortedServices[sortedServices.length - 1], 'event', 'Init Event'));
    }
  }

  // 3. Connect services to external (payment, etc.)
  for (const service of serviceNodes) {
    if (service.label.toLowerCase().includes('payment')) {
      for (const external of externalNodes) {
        if (external.label.toLowerCase().includes('payment') || external.label.toLowerCase().includes('stripe')) {
          edges.push(createEdge(service, external, 'sync', 'Payment Request'));
        }
      }
    }
  }

  // 4. Connect services to database
  for (const service of serviceNodes) {
    if (!service.label.toLowerCase().includes('notification')) {
      for (const db of databaseNodes) {
        edges.push(createEdge(service, db, 'sync', 'Data Query'));
      }
    }
  }

  // 5. Connect services to cache
  for (const service of serviceNodes) {
    for (const cache of cacheNodes) {
      edges.push(createEdge(service, cache, 'dep', 'Cache Lookup'));
    }
  }

  // 6. Connect ALL services to DevOps (monitoring)
  for (const service of serviceNodes) {
    for (const devops of devopsNodes) {
      edges.push(createEdge(service, devops, 'event', 'Monitoring Event'));
    }
  }

  // 7. Ensure every node has at least one connection
  const connectedNodeIds = new Set<string>();
  for (const edge of edges) {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  }

  // Connect any unconnected nodes
  for (const node of nodes) {
    if (!connectedNodeIds.has(node.id)) {
      // Find a connected node of the same layer or adjacent layer
      const sameLayerNodes = nodesByLayer[node.layer] ?? [];
      const connectedSameLayer = sameLayerNodes.find(n => connectedNodeIds.has(n.id));
      
      if (connectedSameLayer) {
        edges.push(createEdge(connectedSameLayer, node, 'sync', 'Connection'));
        connectedNodeIds.add(node.id);
      } else if (serviceNodes.length > 0) {
        edges.push(createEdge(serviceNodes[0], node, 'sync', 'Connection'));
        connectedNodeIds.add(node.id);
      }
    }
  }

  const dedupedEdges = deduplicateEdges(edges);
  
  const portAssignments = assignPortsToEdges(dedupedEdges, nodes);
  
  return dedupedEdges.map(edge => {
    const portAssignment = portAssignments.get(edge.id);
    return {
      ...edge,
      sourceHandle: (portAssignment?.sourceHandle ?? 'right') as HandlePosition,
      targetHandle: (portAssignment?.targetHandle ?? 'left') as HandlePosition,
    };
  });
}

function getServicePriority(label: string): number {
  const lower = label.toLowerCase();
  if (lower.includes('auth')) return 1;
  if (lower.includes('gateway') || lower.includes('api')) return 2;
  if (lower.includes('real-time') || lower.includes('websocket') || lower.includes('socket')) return 3;
  if (lower.includes('ride') || lower.includes('matching')) return 4;
  if (lower.includes('trip') || lower.includes('status')) return 5;
  if (lower.includes('pricing')) return 6;
  if (lower.includes('payment')) return 7;
  if (lower.includes('chat') || lower.includes('message')) return 8;
  if (lower.includes('notification')) return 9;
  return 10;
}

function getConnectionType(fromLabel: string, toLabel: string): { commType: CommunicationType; label: string } {
  const from = fromLabel.toLowerCase();
  const to = toLabel.toLowerCase();

  // Real-time connections
  if (from.includes('real-time') || from.includes('websocket') || from.includes('socket')) {
    return { commType: 'stream', label: 'Real-time Update' };
  }
  if (to.includes('real-time') || to.includes('websocket') || to.includes('socket')) {
    return { commType: 'stream', label: 'Real-time Update' };
  }

  // Auth connections
  if (from.includes('auth') || to.includes('auth')) {
    if (from.includes('client') || from.includes('gateway')) {
      return { commType: 'sync', label: 'Auth Request' };
    }
    return { commType: 'sync', label: 'Auth Response' };
  }

  // Trip/Status connections
  if (from.includes('trip') || from.includes('status')) {
    return { commType: 'stream', label: 'Status Update' };
  }
  if (to.includes('trip') || to.includes('status')) {
    return { commType: 'sync', label: 'Trip Request' };
  }

  // Ride/Matching
  if (from.includes('ride') || from.includes('matching')) {
    return { commType: 'async', label: 'Match Request' };
  }
  if (to.includes('ride') || to.includes('matching')) {
    return { commType: 'async', label: 'Ride Request' };
  }

  // Pricing
  if (from.includes('pricing') || to.includes('pricing')) {
    return { commType: 'sync', label: 'Pricing Response' };
  }

  // Chat
  if (from.includes('chat') || from.includes('message')) {
    return { commType: 'stream', label: 'Chat Message' };
  }

  // Payment
  if (from.includes('payment') || to.includes('payment')) {
    return { commType: 'sync', label: 'Payment Processing' };
  }

  // Default
  return { commType: 'sync', label: 'HTTP Request' };
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
    pathType: style.pathType,
    label,
    labelPosition: 'center',
    animated: style.animated,
    style: {
      stroke: style.color,
      strokeDasharray: style.strokeDasharray,
      strokeWidth: 2,
    },
    markerEnd: style.markerEnd as MarkerType,
    markerStart: 'none',
  };
}

function deduplicateEdges(edges: ArchitectureEdge[]): ArchitectureEdge[] {
  const seen = new Set<string>();
  return edges.filter(edge => {
    const key = `${edge.source}-${edge.target}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
