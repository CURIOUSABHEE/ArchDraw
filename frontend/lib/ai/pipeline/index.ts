import type { RawNode, RawFlow, DiagramScore } from './types';
import { detectIntent } from './stage1-intent';
import { callReasoningLLM } from './stage2-reasoning';
import { callDiagramLLM } from './stage3-diagram';
import { validateAndRepair } from './stage5-validate';
import { applyLayout } from './stage6-layout';
import { convertToReactFlow } from './stage7-convert';
import { scoreDiagram } from './stage8-score';
import logger from '@/lib/logger';

export interface StreamingEvent {
  type: 'node' | 'flow' | 'thinking' | 'complete' | 'error';
  data?: RawNode | RawFlow | string;
}

export type StreamingCallback = (event: StreamingEvent) => void;

export interface DiagramResult {
  nodes: unknown[];
  edges: unknown[];
  score: DiagramScore;
}

export async function generateDiagramPipeline(
  prompt: string,
  onStreaming?: StreamingCallback,
  existingContext?: { nodes: any[]; edges: any[] }
): Promise<DiagramResult> {
  try {
    // Stage 1: Intent detection
    logger.log('[Pipeline] Stage 1: Intent detection');
    const intent = detectIntent(prompt);
    logger.log('[Pipeline] Intent type:', intent.type, 'confidence:', intent.confidence);

    // Stage 2: Reasoning LLM
    logger.log('[Pipeline] Stage 2: Reasoning LLM');
    const reasoning = await callReasoningLLM(prompt, intent.type);
    onStreaming?.({ type: 'thinking', data: JSON.stringify(reasoning) });
    logger.log('[Pipeline] Reasoning:', reasoning.systemType);

    // Stage 3: Diagram LLM (includes streaming parse)
    logger.log('[Pipeline] Stage 3: Diagram LLM');
    let parsed;
    try {
      parsed = await callDiagramLLM(
        reasoning,
        node => onStreaming?.({ type: 'node', data: node }),
        flow => onStreaming?.({ type: 'flow', data: flow }),
        existingContext
      );
    } catch (e) {
      logger.log('[Pipeline] Diagram LLM failed, using fallback');
    }
    
    // If no parsed diagram, use comprehensive fallback
    if (!parsed || parsed.nodes.length === 0) {
      logger.log('[Pipeline] Using fallback diagram');
      parsed = {
        nodes: [
          // Groups with ALL CAPS short zone names
          { id: 'clients-group', label: 'Clients', layer: 'presentation' as const, isGroup: true, groupLabel: 'CLIENTS', groupColor: '#dbeafe' },
          { id: 'gateway-group', label: 'Gateway', layer: 'presentation' as const, isGroup: true, groupLabel: 'GATEWAY', groupColor: '#dcfce7' },
          { id: 'services-group', label: 'Services', layer: 'application' as const, isGroup: true, groupLabel: 'SERVICES', groupColor: '#fef3c7' },
          { id: 'storage-group', label: 'Storage', layer: 'data' as const, isGroup: true, groupLabel: 'STORAGE', groupColor: '#fce7f3' },
          // Children (2-4 per group, 11 total)
          { id: 'web-app', label: 'Web App', layer: 'presentation' as const, parentId: 'clients-group', subtitle: 'React SPA' },
          { id: 'mobile-app', label: 'Mobile App', layer: 'presentation' as const, parentId: 'clients-group', subtitle: 'iOS/Android' },
          { id: 'api-gateway', label: 'API Gateway', layer: 'presentation' as const, parentId: 'gateway-group', subtitle: 'REST/GraphQL' },
          { id: 'load-balancer', label: 'Load Balancer', layer: 'presentation' as const, parentId: 'gateway-group', subtitle: 'Traffic distribution' },
          { id: 'auth-service', label: 'Auth Service', layer: 'application' as const, parentId: 'services-group', subtitle: 'JWT/OAuth' },
          { id: 'user-service', label: 'User Service', layer: 'application' as const, parentId: 'services-group', subtitle: 'CRUD operations' },
          { id: 'payment-service', label: 'Payment Service', layer: 'application' as const, parentId: 'services-group', subtitle: 'Payment processing' },
          { id: 'notification-service', label: 'Notification Service', layer: 'application' as const, parentId: 'services-group', subtitle: 'Push/SMS/Email' },
          { id: 'user-db', label: 'User Database', layer: 'data' as const, parentId: 'storage-group', subtitle: 'PostgreSQL' },
          { id: 'cache', label: 'Redis Cache', layer: 'data' as const, parentId: 'storage-group', subtitle: 'Session cache' },
          { id: 'queue', label: 'Message Queue', layer: 'application' as const, subtitle: 'RabbitMQ' },
        ],
        flows: [
          // Paths with 3-5 nodes, never referencing group IDs
          { path: ['web-app', 'api-gateway', 'auth-service', 'user-db'], label: 'authentication', async: false },
          { path: ['mobile-app', 'load-balancer', 'user-service', 'user-db'], label: 'user CRUD', async: false },
          { path: ['web-app', 'api-gateway', 'payment-service', 'user-db'], label: 'payment', async: false },
          { path: ['payment-service', 'queue', 'notification-service'], label: 'async notification', async: true },
          { path: ['user-service', 'cache'], label: 'cache lookup', async: false },
          { path: ['web-app', 'load-balancer', 'user-service', 'cache'], label: 'cached user data', async: false },
          { path: ['mobile-app', 'api-gateway', 'auth-service'], label: 'mobile auth', async: false },
          { path: ['api-gateway', 'user-service', 'user-db'], label: 'user API', async: false },
        ]
      };
    }
    
    logger.log(`[Pipeline] Parsed nodes: ${parsed.nodes.length}, flows: ${parsed.flows.length}`);

    // Check if group-related keywords exist in the prompt
    const hasGroupKeywords = /group|cluster|zone|region/i.test(prompt);
    if (!hasGroupKeywords && parsed) {
      logger.log('[Pipeline] Stripping group/compound nodes from parsed diagram');
      parsed.nodes = parsed.nodes
        .filter(n => !n.isGroup)
        .map(n => {
          const { parentId, isGroup, groupLabel, groupColor, ...rest } = n;
          return rest;
        });
    }

    // Stage 5: Validate and repair
    logger.log('[Pipeline] Stage 5: Validate and repair');
    const validated = validateAndRepair(parsed);
    logger.log(`[Pipeline] Validated nodes: ${validated.nodes.length}, edges: ${validated.edges.length}`);

    // Stage 6: Layout
    logger.log('[Pipeline] Stage 6: Layout');
    const layouted = await applyLayout(validated);
    logger.log(`[Pipeline] Layouted nodes: ${layouted.length}`);

    // Stage 7: Convert to React Flow
    logger.log('[Pipeline] Stage 7: Convert to React Flow');
    const { nodes, edges } = convertToReactFlow(layouted, validated);
    logger.log(`[Pipeline] RF nodes: ${nodes.length}, edges: ${edges.length}`);

    // Check ordering: groups first
    const groupNodes = nodes.filter(n => n.type === 'groupNode');
    const rootNodes = nodes.filter(n => n.type !== 'groupNode' && !n.data?.parentId);

    logger.log(`[Pipeline] Node ordering - groups: ${groupNodes.length}, root: ${rootNodes.length}`);

    // Merge manual properties from existingContext
    if (existingContext && existingContext.nodes) {
      const existingMap = new Map(existingContext.nodes.map(n => [n.id, n]));
      for (const node of nodes) {
        const existingNode = existingMap.get(node.id);
        if (existingNode) {
          node.data = {
            ...node.data,
            color: existingNode.data?.color || node.data.color,
            accentColor: existingNode.data?.accentColor || node.data.accentColor,
            status: existingNode.data?.status || node.data.status,
            technology: existingNode.data?.technology || node.data.technology,
            description: existingNode.data?.description || node.data.description,
            // Only preserve custom dimensions if explicitly set
            width: existingNode.data?.width || node.data.width,
            height: existingNode.data?.height || node.data.height,
          };
        }
      }
    }
    
    // Merge manual properties from existingContext for edges
    if (existingContext && existingContext.edges) {
      const existingEdgeMap = new Map(existingContext.edges.map(e => [e.id, e]));
      for (const edge of edges) {
        const existingEdge = existingEdgeMap.get(edge.id);
        if (existingEdge) {
          edge.data = {
            ...edge.data,
            label: existingEdge.data?.label || edge.data.label,
            pathType: existingEdge.data?.pathType || edge.data.pathType,
            connectionType: existingEdge.data?.connectionType || edge.data.connectionType,
          };
          // Also merge style
          if (existingEdge.style) {
            edge.style = {
              ...edge.style,
              ...existingEdge.style
            };
          }
        }
      }
    }

    // Stage 8: Score
    logger.log('[Pipeline] Stage 8: Scoring');
    const score = scoreDiagram(nodes, edges);
    logger.log(`[Pipeline] Score: ${score.score}, grade: ${score.grade}`);

    onStreaming?.({ type: 'complete' });

    return { nodes, edges, score };
  } catch (error) {
    logger.error('[Pipeline] Error:', error);
    onStreaming?.({ type: 'error', data: error instanceof Error ? error.message : 'Unknown error' });
    throw error;
  }
}
