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
  existingContext?: { nodes: any[]; edges: any[] },
  diagramSize: 'small' | 'medium' | 'large' = 'medium'
): Promise<DiagramResult> {
  try {
    // Stage 1: Intent detection
    logger.log('[Pipeline] Stage 1: Intent detection');
    const intent = detectIntent(prompt);
    logger.log('[Pipeline] Intent type:', intent.type, 'confidence:', intent.confidence);

    // Stage 2: Reasoning LLM
    logger.log('[Pipeline] Stage 2: Reasoning LLM');
    const reasoning = await callReasoningLLM(prompt, intent.type, diagramSize);
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
        existingContext,
        diagramSize
      );
    } catch (e) {
      logger.log('[Pipeline] Diagram LLM failed, using fallback');
    }
    
    // If no parsed diagram, use comprehensive fallback
    if (!parsed || parsed.nodes.length === 0) {
      logger.log('[Pipeline] Using fallback diagram');
      parsed = buildPromptFallback(prompt, intent.type);
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
    const validationResult = validateAndRepair(parsed, prompt);
    const validated = validationResult.diagram;
    logger.log(`[Pipeline] Validated nodes: ${validated.nodes.length}, edges: ${validated.edges.length}`);

    // Stage 6: Layout
    logger.log('[Pipeline] Stage 6: Layout');
    const layouted = await applyLayout(validated, diagramSize);
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

function buildPromptFallback(prompt: string, intentType: string): { nodes: RawNode[]; flows: RawFlow[] } {
  const p = prompt.toLowerCase();
  const nodes: RawNode[] = [];
  const add = (id: string, label: string, layer: RawNode['layer'], subtitle: string) => {
    if (nodes.some(node => node.id === id)) return;
    nodes.push({ id, label, layer, subtitle });
  };

  if (/\b(video|streaming|vod|cdn|transcod|drm|recommend)\b/.test(p)) {
    add('video-player', 'Video Player', 'client', 'Playback client');
    add('cdn', 'CDN', 'edge', 'HLS/DASH delivery');
    add('api-gateway', 'API Gateway', 'gateway', 'Playback control API');
    if (/\bauth|login|user\b/.test(p)) add('auth-service', 'Auth Service', 'application', 'Token validation');
    if (/\bdrm|license|widevine|fairplay\b/.test(p)) add('drm-license-service', 'DRM License Service', 'application', 'Entitlement checks');
    add('raw-video-storage', 'Raw Video Storage', 'data', 'Uploaded source files');
    add('transcoding-queue', 'Transcoding Queue', 'queue', 'Encoding jobs');
    add('transcoding-worker', 'Transcoding Worker', 'application', 'FFmpeg renditions');
    add('processed-video-storage', 'Processed Video Storage', 'data', 'HLS/DASH segments');
    if (/\brecommend/.test(p)) {
      add('watch-event-stream', 'Watch Event Stream', 'queue', 'Playback events');
      add('recommendation-engine', 'Recommendation Engine', 'application', 'Personalized ranking');
      add('metadata-store', 'Metadata Store', 'data', 'Catalog metadata');
    }
  } else {
    if (/\b(web|browser|frontend|user|client)\b/.test(p)) add('client-app', 'Client App', 'client', 'User interface');
    if (/\bmobile|ios|android\b/.test(p)) add('mobile-app', 'Mobile App', 'client', 'Native client');
    if (/\bapi|gateway|graphql|rest|backend|service\b/.test(p)) add('api-gateway', 'API Gateway', 'gateway', 'Request routing');
    if (/\bauth|login|user\b/.test(p)) add('auth-service', 'Auth Service', 'application', 'Login and tokens');
    if (/\bsearch\b/.test(p)) add('search-service', 'Search Service', 'application', 'Query handling');
    if (/\brecommend|rank|feed\b/.test(p)) add('ranking-service', 'Ranking Service', 'application', 'Personalization');
    if (/\bqueue|event|async|worker|job\b/.test(p)) add('event-queue', 'Event Queue', 'queue', 'Async messages');
    if (/\bworker|job|background\b/.test(p)) add('worker-service', 'Worker Service', 'application', 'Background jobs');
    if (/\bpostgres|mysql|database|db|store|persist\b/.test(p)) add('primary-database', 'Primary Database', 'data', 'Operational data');
    if (/\bredis|cache\b/.test(p)) add('cache', 'Cache', 'data', 'Hot data');
    if (/\bstorage|file|upload|media\b/.test(p)) add('object-storage', 'Object Storage', 'data', 'Files and blobs');
    if (/\bpayment|billing|checkout|stripe\b/.test(p)) add('payment-provider', 'Payment Provider', 'external', 'Payments API');
  }

  if (nodes.length === 0) {
    add('domain-service', `${titleCase(intentType.replace(/-/g, ' '))} Service`, 'application', 'Core domain workflow');
    add('primary-store', 'Primary Store', 'data', 'Persistent state');
  }

  const ordered = [...nodes].sort((a, b) => layerRank(a.layer) - layerRank(b.layer));
  const flows: RawFlow[] = [];
  for (let i = 0; i < ordered.length - 1; i++) {
    flows.push({
      path: [ordered[i].id, ordered[i + 1].id],
      label: edgeLabelFor(ordered[i], ordered[i + 1]),
      async: ordered[i].layer === 'queue' || ordered[i + 1].layer === 'queue',
    });
  }

  return { nodes, flows };
}

function layerRank(layer: RawNode['layer']): number {
  const normalized = layer === 'presentation' ? 'client' : layer === 'compute' ? 'application' : layer === 'async' ? 'queue' : layer;
  const order = ['client', 'edge', 'gateway', 'application', 'queue', 'data', 'observability', 'external'];
  const idx = order.indexOf(normalized);
  return idx >= 0 ? idx : 3;
}

function edgeLabelFor(source: RawNode, target: RawNode): string {
  if (target.layer === 'data') return 'reads/writes';
  if (target.layer === 'queue') return 'publishes';
  if (source.layer === 'queue') return 'consumes';
  if (source.layer === 'client') return 'requests';
  return 'routes';
}

function titleCase(value: string): string {
  return value.replace(/\b\w/g, c => c.toUpperCase());
}
