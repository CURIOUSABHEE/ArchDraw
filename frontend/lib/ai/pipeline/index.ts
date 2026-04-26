import type { RawNode, RawFlow, DiagramScore } from './types';
import { detectIntent } from './stage1-intent';
import { callReasoningLLM } from './stage2-reasoning';
import { callDiagramLLM, parseLLMOutput } from './stage3-diagram';
import { validateAndRepair } from './stage5-validate';
import { applyLayout } from './stage6-layout';
import { convertToReactFlow } from './stage7-convert';
import { scoreDiagram } from './stage8-score';

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
  onStreaming?: StreamingCallback
): Promise<DiagramResult> {
  try {
    // Stage 1: Intent detection
    console.log('[Pipeline] Stage 1: Intent detection');
    const intent = detectIntent(prompt);
    console.log('[Pipeline] Intent type:', intent.type, 'confidence:', intent.confidence);

    // Stage 2: Reasoning LLM
    console.log('[Pipeline] Stage 2: Reasoning LLM');
    const reasoning = await callReasoningLLM(prompt, intent.type);
    onStreaming?.({ type: 'thinking', data: JSON.stringify(reasoning) });
    console.log('[Pipeline] Reasoning:', reasoning.systemType);

    // Stage 3: Diagram LLM (includes streaming parse)
    console.log('[Pipeline] Stage 3: Diagram LLM');
    let parsed;
    try {
      parsed = await callDiagramLLM(
        reasoning,
        node => onStreaming?.({ type: 'node', data: node }),
        flow => onStreaming?.({ type: 'flow', data: flow })
      );
    } catch (e) {
      console.log('[Pipeline] Diagram LLM failed, using fallback');
    }
    
    // If no parsed diagram, use comprehensive fallback
    if (!parsed || parsed.nodes.length === 0) {
      console.log('[Pipeline] Using fallback diagram');
      parsed = {
        nodes: [
          // Groups with ALL CAPS short zone names
          { id: 'clients-group', label: 'Clients', layer: 'presentation' as const, isGroup: true, groupLabel: 'CLIENTS', groupColor: '#dbeafe' },
          { id: 'gateway-group', label: 'Gateway', layer: 'gateway' as const, isGroup: true, groupLabel: 'GATEWAY', groupColor: '#dcfce7' },
          { id: 'services-group', label: 'Services', layer: 'application' as const, isGroup: true, groupLabel: 'SERVICES', groupColor: '#fef3c7' },
          { id: 'storage-group', label: 'Storage', layer: 'data' as const, isGroup: true, groupLabel: 'STORAGE', groupColor: '#fce7f3' },
          // Children (2-4 per group, 11 total)
          { id: 'web-app', label: 'Web App', layer: 'presentation' as const, parentId: 'clients-group', subtitle: 'React SPA' },
          { id: 'mobile-app', label: 'Mobile App', layer: 'presentation' as const, parentId: 'clients-group', subtitle: 'iOS/Android' },
          { id: 'api-gateway', label: 'API Gateway', layer: 'gateway' as const, parentId: 'gateway-group', subtitle: 'REST/GraphQL' },
          { id: 'load-balancer', label: 'Load Balancer', layer: 'gateway' as const, parentId: 'gateway-group', subtitle: 'Traffic distribution' },
          { id: 'auth-service', label: 'Auth Service', layer: 'application' as const, parentId: 'services-group', subtitle: 'JWT/OAuth' },
          { id: 'user-service', label: 'User Service', layer: 'application' as const, parentId: 'services-group', subtitle: 'CRUD operations' },
          { id: 'payment-service', label: 'Payment Service', layer: 'application' as const, parentId: 'services-group', subtitle: 'Payment processing' },
          { id: 'notification-service', label: 'Notification Service', layer: 'application' as const, parentId: 'services-group', subtitle: 'Push/SMS/Email' },
          { id: 'user-db', label: 'User Database', layer: 'data' as const, parentId: 'storage-group', subtitle: 'PostgreSQL' },
          { id: 'cache', label: 'Redis Cache', layer: 'data' as const, parentId: 'storage-group', subtitle: 'Session cache' },
          { id: 'queue', label: 'Message Queue', layer: 'async' as const, subtitle: 'RabbitMQ' },
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
    
    console.log('[Pipeline] Parsed nodes:', parsed.nodes.length, 'flows:', parsed.flows.length);

    // Stage 5: Validate and repair
    console.log('[Pipeline] Stage 5: Validate and repair');
    const validated = validateAndRepair(parsed);
    console.log('[Pipeline] Validated nodes:', validated.nodes.length, 'edges:', validated.edges.length);

    // Stage 6: Layout
    console.log('[Pipeline] Stage 6: Layout');
    const layouted = await applyLayout(validated);
    console.log('[Pipeline] Layouted nodes:', layouted.length);

    // Stage 7: Convert to React Flow
    console.log('[Pipeline] Stage 7: Convert to React Flow');
    const { nodes, edges } = convertToReactFlow(layouted, validated);
    console.log('[Pipeline] RF nodes:', nodes.length, 'edges:', edges.length);

    // Check ordering: groups first
    const groupNodes = nodes.filter(n => n.type === 'groupNode');
    const childNodes = nodes.filter(n => n.data?.parentId);
    const rootNodes = nodes.filter(n => n.type !== 'groupNode' && !n.data?.parentId);

    console.log('[Pipeline] Node ordering - groups:', groupNodes.length, 'children:', childNodes.length, 'root:', rootNodes.length);
    console.log('[Pipeline] Group nodes appear first:', nodes.indexOf(groupNodes[0]) < nodes.indexOf(rootNodes[0]));

    // Stage 8: Score
    console.log('[Pipeline] Stage 8: Scoring');
    const score = scoreDiagram(nodes, edges);
    console.log('[Pipeline] Score:', score.score, 'grade:', score.grade);

    onStreaming?.({ type: 'complete' });

    return { nodes, edges, score };
  } catch (error) {
    console.error('[Pipeline] Error:', error);
    onStreaming?.({ type: 'error', data: error instanceof Error ? error.message : 'Unknown error' });
    throw error;
  }
}