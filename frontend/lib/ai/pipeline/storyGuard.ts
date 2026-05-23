import type { DiagramEdge, RawNode } from './types';

const MEDIA_PROMPT = /\b(video|audio|streaming|media|vod|hls|dash|transcod|cdn|drm)\b/i;
const PAYMENT_PROMPT = /\b(payment|billing|checkout|cart|subscription|purchase|order|invoice|stripe)\b/i;
const DRM_PROMPT = /\b(drm|license|licensing|widevine|fairplay|playready|entitlement)\b/i;

export function prunePromptIrrelevantNodes(nodes: RawNode[], prompt?: string): RawNode[] {
  if (!prompt) return nodes;

  return nodes.filter((node) => {
    const text = `${node.label} ${node.subtitle || ''}`.toLowerCase();

    if (!PAYMENT_PROMPT.test(prompt) && /\b(payment|billing|checkout|stripe|invoice)\b/i.test(text)) {
      return false;
    }

    if (!DRM_PROMPT.test(prompt) && /\b(drm|license|licensing|widevine|fairplay|playready|entitlement)\b/i.test(text)) {
      return false;
    }

    return true;
  });
}

export function ensurePromptRequiredNodes(nodes: RawNode[], prompt?: string): RawNode[] {
  if (!prompt) return nodes;

  const result = [...nodes];
  const add = (id: string, label: string, layer: RawNode['layer'], subtitle: string, patterns: RegExp[]) => {
    if (findNode(result, patterns)) return;
    result.push({ id, label, layer, subtitle });
  };

  if (/\b(web|browser|frontend|client|user|mobile|app)\b/i.test(prompt) && !MEDIA_PROMPT.test(prompt)) {
    add('client-app', 'Client App', 'client', 'User interface', [/client/, /web app/, /mobile app/]);
  }

  if (/\b(api|gateway|backend|auth|login|drm|license|recommend|search|payment|checkout|notification)\b/i.test(prompt)) {
    add('api-gateway', 'API Gateway', 'gateway', 'Routes control-plane requests', [/api gateway/, /gateway/]);
  }

  if (/\b(auth|login|sign.?in|oauth|user authentication)\b/i.test(prompt)) {
    add('auth-service', 'Auth Service', 'application', 'Login and token validation', [/auth/, /identity/]);
    add('user-database', 'User Database', 'data', 'Users and entitlements', [/user.*db/, /user.*database/, /entitlement/]);
  }

  if (DRM_PROMPT.test(prompt)) {
    add('drm-license-service', 'DRM License Service', 'application', 'License and entitlement checks', [/drm/, /license/, /licensing/]);
  }

  if (/\b(recommend\w*|personaliz\w*|ranking)\b/i.test(prompt)) {
    add('event-stream', 'Event Stream', 'queue', 'User behavior events', [/event stream/, /analytics.*stream/, /watch.*event/, /click.*event/]);
    add('recommendation-engine', 'Recommendation Engine', 'application', 'Personalized ranking', [/recommend/]);
    add('metadata-store', 'Metadata Store', 'data', 'Catalog and item metadata', [/metadata/, /catalog/]);
  }

  if (MEDIA_PROMPT.test(prompt)) {
    const audio = /\b(audio|music|song|podcast|spotify)\b/i.test(prompt);
    add(audio ? 'audio-player' : 'video-player', audio ? 'Audio Player' : 'Video Player', 'client', 'Playback client', [/player/, /client/, /web app/, /mobile app/]);
    add('cdn', audio ? 'Audio CDN' : 'CDN', 'edge', audio ? 'Segment delivery' : 'HLS/DASH edge delivery', [/\bcdn\b/, /content delivery/]);
    add('raw-media-storage', audio ? 'Raw Audio Storage' : 'Raw Media Storage', 'data', 'Uploaded source files', [/raw.*(storage|store|bucket)/, /(storage|store|bucket).*raw/]);
    add('processed-media-storage', audio ? 'Processed Audio Storage' : 'Processed Media Storage', 'data', audio ? 'Encoded audio segments' : 'Packaged HLS/DASH output', [/processed.*(storage|store|bucket)/, /content store/, /(storage|store|bucket).*hls/, /(storage|store|bucket).*dash/]);
  }

  if (/\b(transcod\w*|encode|encoding|rendition|hls|dash|pipeline)\b/i.test(prompt) && MEDIA_PROMPT.test(prompt)) {
    add('transcoding-queue', 'Transcoding Queue', 'queue', 'Encoding jobs', [/transcod.*queue/, /ingestion queue/, /queue/]);
    add('transcoding-worker', 'Transcoding Worker', 'application', 'Creates adaptive renditions', [/transcod.*worker/, /transcod.*service/, /encoder/, /packager/]);
  }

  if (/\b(search)\b/i.test(prompt)) {
    add('search-service', 'Search Service', 'application', 'Search query handling', [/search/]);
    add('search-index', 'Search Index', 'data', 'Indexed documents', [/search.*index/, /opensearch/, /elasticsearch/]);
  }

  if (PAYMENT_PROMPT.test(prompt)) {
    add('payment-service', 'Payment Service', 'application', 'Payment orchestration', [/payment service/, /checkout/]);
    add('payment-provider', 'Payment Provider', 'external', 'Stripe/payment API', [/stripe/, /payment provider/, /payment gateway/]);
  }

  if (/\b(notification|push|email|sms)\b/i.test(prompt)) {
    add('notification-service', 'Notification Service', 'application', 'Push/email/SMS fanout', [/notification/]);
  }

  return result;
}

export function repairStoryEdges(nodes: RawNode[], edges: DiagramEdge[], prompt?: string): DiagramEdge[] {
  const nodeMap = new Map(nodes.map(node => [node.id, node]));
  const validIds = new Set(nodes.map(node => node.id));

  let repaired = edges.filter(edge => {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);
    if (!source || !target) return false;

    if (!validIds.has(edge.source) || !validIds.has(edge.target)) return false;
    if (edge.source === edge.target) return false;

    const sourceLayer = normalizeLayer(source.layer);
    const targetLayer = normalizeLayer(target.layer);
    const sourceText = nodeText(source);
    const targetText = nodeText(target);

    if (targetLayer === 'client' && sourceLayer !== 'client') return false;
    if (sourceLayer === 'observability') return false;
    if (sourceLayer === 'data' && targetLayer !== 'observability') return false;
    if (/recommend|ranking|personaliz/.test(sourceText) && /transcod|worker|encoder|packag/.test(targetText)) return false;
    if (/transcod|encoder|packag/.test(targetText) && !/queue|storage|store|upload|ingest/.test(sourceText)) return false;
    if (/auth|identity/.test(targetText) && !/gateway|login|client|mobile|web/.test(sourceText) && !/token|register|refresh|authenticate|login/i.test(edge.label || '')) return false;

    if (MEDIA_PROMPT.test(prompt || '')) {
      if (isCdn(sourceText) && /transcod|worker|encoder|packag/.test(targetText)) return false;
      if (/drm|license|licensing|widevine|fairplay|playready/.test(sourceText) && /transcod|worker|encoder|packag/.test(targetText)) return false;
      if (/log|monitor|metric|trace|observ/.test(sourceText) && !/log|monitor|metric|trace|observ/.test(targetText)) return false;
    }

    return true;
  });

  if (MEDIA_PROMPT.test(prompt || '')) {
    repaired = addMediaStoryEdges(nodes, repaired);
  }
  repaired = addGenericFeatureStoryEdges(nodes, repaired, prompt);

  return dedupeEdges(repaired);
}

function addMediaStoryEdges(nodes: RawNode[], edges: DiagramEdge[]): DiagramEdge[] {
  const result = [...edges];
  const client = findNode(nodes, [/player/, /client/, /web app/, /mobile app/]);
  const cdn = findNode(nodes, [/cdn/, /edge cache/]);
  const gateway = findNode(nodes, [/api gateway/, /gateway/, /playback api/]);
  const auth = findNode(nodes, [/auth/, /identity/]);
  const drm = findNode(nodes, [/drm/, /license/, /licensing/, /entitlement/]);
  const rawStore = findNode(nodes, [/raw.*(storage|store|bucket)/, /(storage|store|bucket).*raw/]);
  const outputStore = findNode(nodes, [/processed.*(storage|store|bucket)/, /content store/, /video content store/, /(storage|store|bucket).*hls/, /(storage|store|bucket).*dash/]);
  const queue = findNode(nodes, [/ingestion queue/, /transcod.*queue/, /content.*queue/, /kafka/, /queue/]);
  const transcoder = findNode(nodes, [/transcod.*worker/, /transcod.*service/, /encoder/, /packager/]);
  const recommendation = findNode(nodes, [/recommend/]);
  const eventStream = findNode(nodes, [/analytics.*stream/, /event stream/, /play.*event/, /watch.*event/, /kafka/]);
  const metadata = findNode(nodes, [/metadata/, /catalog/]);

  push(result, client, cdn, 'requests media', false);
  push(result, outputStore || rawStore, cdn, 'origin fetch', false);
  push(result, client, gateway, 'control API', false);
  push(result, gateway, auth, 'login/token', false);
  push(result, gateway, drm, 'license request', false);
  push(result, rawStore, queue, 'media uploaded', true);
  push(result, queue, transcoder, 'trigger transcode', true);
  push(result, transcoder, outputStore || rawStore, 'store renditions', true);
  push(result, client, eventStream, 'play events', true);
  push(result, eventStream, recommendation, 'watch signals', true);
  push(result, recommendation, metadata, 'read metadata', false);
  push(result, gateway, recommendation, 'recommendations API', false);

  return result;
}

function addGenericFeatureStoryEdges(nodes: RawNode[], edges: DiagramEdge[], prompt?: string): DiagramEdge[] {
  const result = [...edges];
  const client = findNode(nodes, [/client/, /web app/, /mobile app/, /player/, /frontend/]);
  const gateway = findNode(nodes, [/api gateway/, /gateway/, /edge gateway/, /bff/]);
  const auth = findNode(nodes, [/auth/, /identity/]);
  const userStore = findNode(nodes, [/user.*(db|database|store)/, /profile.*(db|database|store)/, /entitlement/]);
  const recommendation = findNode(nodes, [/recommend/, /ranking/, /personaliz/]);
  const eventStream = findNode(nodes, [/event stream/, /analytics.*stream/, /watch.*event/, /click.*event/, /play.*event/, /kafka/]);
  const metadata = findNode(nodes, [/metadata/, /catalog/]);
  const search = findNode(nodes, [/search service/, /^search$/]);
  const searchIndex = findNode(nodes, [/search.*index/, /opensearch/, /elasticsearch/]);
  const paymentService = findNode(nodes, [/payment service/, /checkout service/, /billing service/]);
  const paymentProvider = findNode(nodes, [/payment provider/, /payment gateway/, /stripe/]);
  const notification = findNode(nodes, [/notification/, /push/, /email service/, /sms/]);
  const queue = findNode(nodes, [/queue/, /event bus/, /kafka/]);

  push(result, client, gateway, 'requests API', false);
  push(result, gateway, auth, 'login/token', false);
  push(result, auth, userStore, 'verify user', false);

  if (/\b(recommend\w*|personaliz\w*|ranking|feed)\b/i.test(prompt || '') || recommendation) {
    push(result, client, eventStream, 'behavior events', true);
    push(result, eventStream, recommendation, 'ranking signals', true);
    push(result, recommendation, metadata, 'read metadata', false);
    push(result, gateway, recommendation, 'recommendations API', false);
  }

  if (/\bsearch\b/i.test(prompt || '') || search) {
    push(result, gateway, search, 'search query', false);
    push(result, search, searchIndex, 'query index', false);
  }

  if (PAYMENT_PROMPT.test(prompt || '') || paymentService) {
    push(result, gateway, paymentService, 'checkout request', false);
    push(result, paymentService, paymentProvider, 'charge API', false);
  }

  if (/\b(notification|push|email|sms)\b/i.test(prompt || '') || notification) {
    push(result, queue, notification, 'delivery event', true);
  }

  return result;
}

function push(
  edges: DiagramEdge[],
  source: RawNode | undefined,
  target: RawNode | undefined,
  label: string,
  async: boolean
) {
  if (!source || !target || source.id === target.id) return;
  if (edges.some(edge => edge.source === source.id && edge.target === target.id)) return;

  edges.push({
    id: `story-${source.id}-${target.id}`,
    source: source.id,
    target: target.id,
    label,
    async,
    communicationType: async ? 'async' : 'sync',
  });
}

function findNode(nodes: RawNode[], patterns: RegExp[]): RawNode | undefined {
  return nodes.find(node => {
    const text = nodeText(node);
    return patterns.some(pattern => pattern.test(text));
  });
}

function dedupeEdges(edges: DiagramEdge[]): DiagramEdge[] {
  const seen = new Set<string>();
  return edges.filter(edge => {
    const key = `${edge.source}->${edge.target}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function nodeText(node: RawNode): string {
  return `${node.label} ${node.subtitle || ''}`.toLowerCase();
}

function isCdn(text: string): boolean {
  return /\bcdn\b|content delivery|akamai|cloudfront/.test(text);
}

function normalizeLayer(layer?: string): string {
  if (!layer) return 'application';
  if (layer === 'presentation') return 'client';
  if (layer === 'compute') return 'application';
  if (layer === 'async') return 'queue';
  if (layer === 'observe') return 'observability';
  return layer;
}
