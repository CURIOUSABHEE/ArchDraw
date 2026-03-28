import { apiKeyManager } from '../utils/apiKeyManager';
import type { SharedState, ArchitectureEdge, ArchitectureNode, CommunicationType, PathType, HandlePosition, MarkerType } from '../types';
import { EDGE_AGENT_PROMPT, COMMUNICATION_STYLES, LAYER_ORDER } from '../constants';

export async function runEdgeAgent(state: SharedState): Promise<ArchitectureEdge[]> {
  // Use components if nodes are empty
  const nodesToUse = state.components.length > 0 ? state.components : state.nodes;
  
  if (nodesToUse.length === 0) {
    console.warn('[EdgeAgent] No nodes available, returning empty edges');
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
      console.warn('[EdgeAgent] JSON parse failed, trying regex extraction');
      const arrayMatch = cleanedResult.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        try {
          parsed = JSON.parse(arrayMatch[0]);
        } catch {
          console.warn('[EdgeAgent] Regex extraction failed');
        }
      }
    }

    if (parsed.length === 0) {
      console.warn('[EdgeAgent] No edges parsed from LLM, using default generation');
      return generateDefaultEdges(nodesToUse, state.userIntent);
    }

    return parsed.map((edge) => createFullEdge(edge, nodesToUse));
  } catch (error) {
    console.error('[EdgeAgent] Error:', error);
    return generateDefaultEdges(nodesToUse, state.userIntent);
  }
}

function createFullEdge(edge: Partial<ArchitectureEdge>, nodes: ArchitectureNode[]): ArchitectureEdge {
  const commType = (edge.communicationType ?? 'sync') as CommunicationType;
  const style = COMMUNICATION_STYLES[commType] ?? COMMUNICATION_STYLES.sync;

  const sourceNode = nodes.find(n => n.id === edge.source);
  const targetNode = nodes.find(n => n.id === edge.target);

  const sourceLayer = sourceNode?.layer ?? 'service';
  const targetLayer = targetNode?.layer ?? 'service';

  return {
    id: edge.id ?? `edge-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    source: edge.source ?? '',
    target: edge.target ?? '',
    sourceHandle: 'right',
    targetHandle: 'left',
    communicationType: commType,
    pathType: 'bezier',
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
    console.warn('[EdgeAgent] Less than 2 nodes, cannot create edges');
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

  return deduplicateEdges(edges);
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
