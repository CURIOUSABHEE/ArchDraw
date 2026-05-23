/**
 * parse-prompt.ts
 * Pre-analyzes a user's natural language architecture request and extracts:
 * - Domain (e.g., "video streaming", "e-commerce")
 * - Detected tech stack
 * - Explicit features requested
 * - Recommended diagram direction
 * - Domain-required nodes that must not be omitted
 *
 * Call this tool BEFORE generate_diagram when the user provides a descriptive prompt,
 * then use the output to build accurate, prompt-faithful nodes and edges.
 */

interface ParsedPrompt {
  domain: string;
  confidence: number;
  detectedTechStack: string[];
  customFeatures: string[];
  recommendedDirection: 'RIGHT' | 'DOWN';
  diagramLabel: string;
  domainRequiredNodes: string[];
  architectureHints: string[];
  warnings: string[];
}

const TECH_PATTERNS: Array<{ pattern: RegExp; tech: string }> = [
  // Cloud providers
  { pattern: /\baws\b/i, tech: 'AWS' },
  { pattern: /\bgcp\b|google cloud/i, tech: 'GCP' },
  { pattern: /\bazure\b/i, tech: 'Azure' },
  // AWS services
  { pattern: /\blambda\b/i, tech: 'AWS Lambda' },
  { pattern: /\bec2\b/i, tech: 'EC2' },
  { pattern: /\becs\b/i, tech: 'ECS' },
  { pattern: /\beks\b/i, tech: 'EKS' },
  { pattern: /\bs3\b/i, tech: 'S3' },
  { pattern: /\bdynamodb\b/i, tech: 'DynamoDB' },
  { pattern: /\brds\b/i, tech: 'RDS' },
  { pattern: /\baurora\b/i, tech: 'Aurora' },
  { pattern: /\bcloudfront\b/i, tech: 'CloudFront' },
  { pattern: /\bapi gateway\b/i, tech: 'API Gateway' },
  { pattern: /\bsqs\b/i, tech: 'SQS' },
  { pattern: /\bsns\b/i, tech: 'SNS' },
  { pattern: /\bkinesis\b/i, tech: 'Kinesis' },
  { pattern: /\bcognito\b/i, tech: 'Cognito' },
  // Databases
  { pattern: /\bpostgres(ql)?\b/i, tech: 'PostgreSQL' },
  { pattern: /\bmysql\b/i, tech: 'MySQL' },
  { pattern: /\bmongodb\b/i, tech: 'MongoDB' },
  { pattern: /\bcassandra\b/i, tech: 'Cassandra' },
  { pattern: /\bfirebase\b/i, tech: 'Firebase' },
  { pattern: /\bsupabase\b/i, tech: 'Supabase' },
  // Caching & Queuing
  { pattern: /\bredis\b/i, tech: 'Redis' },
  { pattern: /\bkafka\b/i, tech: 'Kafka' },
  { pattern: /\brabbitmq\b/i, tech: 'RabbitMQ' },
  { pattern: /\belasticsearch\b/i, tech: 'Elasticsearch' },
  // Frameworks & Languages
  { pattern: /\bnext\.js\b/i, tech: 'Next.js' },
  { pattern: /\breact\b/i, tech: 'React' },
  { pattern: /\bvue\b/i, tech: 'Vue' },
  { pattern: /\bangular\b/i, tech: 'Angular' },
  { pattern: /\bsvelte\b/i, tech: 'Svelte' },
  { pattern: /\bnode\.js\b/i, tech: 'Node.js' },
  { pattern: /\bexpress\b/i, tech: 'Express' },
  { pattern: /\bfastapi\b/i, tech: 'FastAPI' },
  { pattern: /\bdjango\b/i, tech: 'Django' },
  { pattern: /\bspring boot\b/i, tech: 'Spring Boot' },
  { pattern: /\bgo(lang)?\b/i, tech: 'Go' },
  { pattern: /\brust\b/i, tech: 'Rust' },
  { pattern: /\bpython\b/i, tech: 'Python' },
  { pattern: /\bjava\b/i, tech: 'Java' },
  { pattern: /\btypescript\b/i, tech: 'TypeScript' },
  // Protocols
  { pattern: /\bgraphql\b/i, tech: 'GraphQL' },
  { pattern: /\bgrpc\b/i, tech: 'gRPC' },
  { pattern: /\bwebsocket\b/i, tech: 'WebSocket' },
  // Infra
  { pattern: /\bdocker\b/i, tech: 'Docker' },
  { pattern: /\bkubernetes\b|k8s/i, tech: 'Kubernetes' },
  { pattern: /\bnginx\b/i, tech: 'Nginx' },
  { pattern: /\bterraform\b/i, tech: 'Terraform' },
  { pattern: /\bcloudflare\b/i, tech: 'Cloudflare' },
  { pattern: /\bvercel\b/i, tech: 'Vercel' },
  { pattern: /\brailway\b/i, tech: 'Railway' },
  // Observability
  { pattern: /\bprometheus\b/i, tech: 'Prometheus' },
  { pattern: /\bgrafana\b/i, tech: 'Grafana' },
  { pattern: /\bdatadog\b/i, tech: 'Datadog' },
  { pattern: /\bsentry\b/i, tech: 'Sentry' },
  { pattern: /\bjaeger\b/i, tech: 'Jaeger' },
  // External services
  { pattern: /\bstripe\b/i, tech: 'Stripe' },
  { pattern: /\btwilio\b/i, tech: 'Twilio' },
  { pattern: /\bsendgrid\b/i, tech: 'SendGrid' },
  { pattern: /\bauth0\b/i, tech: 'Auth0' },
  // Video/Media
  { pattern: /\bhls\b/i, tech: 'HLS' },
  { pattern: /\bdash\b/i, tech: 'DASH' },
  { pattern: /\bffmpeg\b/i, tech: 'FFmpeg' },
  { pattern: /\bdrm\b/i, tech: 'DRM' },
  { pattern: /\bwidevine\b/i, tech: 'Widevine' },
  { pattern: /\bfairplay\b/i, tech: 'FairPlay' },
];

const DOMAIN_PATTERNS: Array<{
  pattern: RegExp;
  domain: string;
  requiredNodes: string[];
  hints: string[];
}> = [
  {
    pattern: /video stream|vod|video platform|streaming platform|netflix|youtube/i,
    domain: 'Video Streaming',
    requiredNodes: [
      'Object Storage (raw video)',
      'Transcoding Worker (FFmpeg/AWS MediaConvert)',
      'Object Storage (processed HLS/DASH)',
      'CDN (CloudFront/Akamai)',
      'DRM License Service (via API Gateway)',
      'Analytics Event Stream (Kafka/Kinesis)',
      'Recommendation Engine',
    ],
    hints: [
      'Use async edges for upload → transcoding → storage pipeline',
      'DRM must route through API Gateway, never directly from client',
      'Analytics stream feeds recommendation engine — show the feedback loop',
      'CDN must have Object Storage as its origin (not directly from services)',
    ],
  },
  {
    pattern: /social media|instagram|twitter|tiktok|facebook|feed|timeline|posts/i,
    domain: 'Social Media',
    requiredNodes: [
      'Object Storage (media blobs)',
      'CDN (media delivery)',
      'Engagement Event Stream (Kafka)',
      'Feed Ranking Service',
      'Notification Service',
      'Search Service',
    ],
    hints: [
      'Like/share/comment events must flow through an event stream',
      'Feed ranking is separate from the main API — it reads from the event stream',
      'Push notifications require a dedicated notification service',
    ],
  },
  {
    pattern: /e-?comm|shop|store|marketplace|checkout|cart|order/i,
    domain: 'E-Commerce',
    requiredNodes: [
      'Payment Gateway (Stripe)',
      'Order Queue (Kafka/SQS)',
      'Inventory Service',
      'Notification Service (email/SMS)',
      'Cart Service',
    ],
    hints: [
      'Order creation must be async (queue) to ensure reliability',
      'Payment goes to external Stripe API',
      'Inventory check happens before payment confirmation',
    ],
  },
  {
    pattern: /ride.?shar|uber|lyft|delivery|driver|passenger/i,
    domain: 'Ride-sharing',
    requiredNodes: [
      'Real-time Location Service (WebSocket)',
      'Driver Matching Engine',
      'Payment Gateway',
      'Push Notification Service',
      'Route Optimization Service',
    ],
    hints: [
      'Location updates must use WebSocket (stream) edges',
      'Matching algorithm is a separate compute service',
    ],
  },
  {
    pattern: /chat|messag|slack|discord|whatsapp|real.?time/i,
    domain: 'Chat / Messaging',
    requiredNodes: [
      'WebSocket Gateway',
      'Message Queue (Kafka/Redis)',
      'Notification Service',
      'Media Storage (S3)',
      'Presence Service',
    ],
    hints: [
      'Use stream edges for WebSocket connections',
      'Messages should persist asynchronously via queue',
    ],
  },
  {
    pattern: /audio stream|music|spotify|podcast|soundcloud/i,
    domain: 'Audio Streaming',
    requiredNodes: [
      'Object Storage (audio files)',
      'CDN',
      'Transcoding Worker',
      'Recommendation Engine',
      'Analytics Event Stream',
    ],
    hints: [
      'Similar to video streaming — CDN origin must be object storage',
      'Play events feed the recommendation engine',
    ],
  },
  {
    pattern: /saas|b2b|dashboard|workspace|tenant/i,
    domain: 'SaaS / B2B',
    requiredNodes: [
      'Auth Service (login/token only)',
      'Billing / Subscription Service',
      'Audit Log',
      'Webhook Delivery Service',
    ],
    hints: [
      'Multi-tenancy must be enforced at the API layer',
      'Billing events trigger webhooks to customers',
    ],
  },
];

const FEATURE_PATTERNS: Array<{ pattern: RegExp; feature: string }> = [
  { pattern: /rate.?limit/i, feature: 'Rate Limiting' },
  { pattern: /push notif/i, feature: 'Push Notifications' },
  { pattern: /real.?time/i, feature: 'Real-time Updates' },
  { pattern: /search/i, feature: 'Search' },
  { pattern: /recommend/i, feature: 'Recommendations' },
  { pattern: /a\/b test/i, feature: 'A/B Testing' },
  { pattern: /drm/i, feature: 'DRM' },
  { pattern: /auth|login|sign.?in/i, feature: 'Authentication' },
  { pattern: /payment|checkout|billing/i, feature: 'Payments' },
  { pattern: /upload/i, feature: 'File Upload' },
  { pattern: /export|download/i, feature: 'Export / Download' },
  { pattern: /analytics|metric|telemetry/i, feature: 'Analytics' },
  { pattern: /webhook/i, feature: 'Webhooks' },
  { pattern: /multi.?tenant/i, feature: 'Multi-tenancy' },
  { pattern: /cach/i, feature: 'Caching' },
  { pattern: /monitor|observ|log/i, feature: 'Observability' },
  { pattern: /cdn/i, feature: 'CDN' },
  { pattern: /transcod/i, feature: 'Video Transcoding' },
  { pattern: /livestream/i, feature: 'Live Streaming' },
  { pattern: /social.?log|oauth/i, feature: 'Social Login / OAuth' },
];

export function parseUserPrompt(userPrompt: string): ParsedPrompt {
  const warnings: string[] = [];

  // Detect domain
  let domain = 'General';
  let confidence = 0;
  let domainRequiredNodes: string[] = [];
  let architectureHints: string[] = [];

  for (const dp of DOMAIN_PATTERNS) {
    if (dp.pattern.test(userPrompt)) {
      domain = dp.domain;
      confidence = 0.85;
      domainRequiredNodes = dp.requiredNodes;
      architectureHints = dp.hints;
      break;
    }
  }

  // Extract tech stack
  const detectedTechStack: string[] = [];
  for (const tp of TECH_PATTERNS) {
    if (tp.pattern.test(userPrompt)) {
      if (!detectedTechStack.includes(tp.tech)) {
        detectedTechStack.push(tp.tech);
      }
    }
  }

  // Extract custom features
  const customFeatures: string[] = [];
  for (const fp of FEATURE_PATTERNS) {
    if (fp.pattern.test(userPrompt)) {
      if (!customFeatures.includes(fp.feature)) {
        customFeatures.push(fp.feature);
      }
    }
  }

  // Generate diagram label
  const diagramLabel = domain !== 'General'
    ? `${domain} Architecture`
    : 'System Architecture';

  // Direction recommendation
  const recommendedDirection: 'RIGHT' | 'DOWN' =
    /pipeline|ci.?cd|workflow|step|stage/i.test(userPrompt) ? 'DOWN' : 'RIGHT';

  // Warnings for common mistakes
  if (/auth.*service|service.*auth/i.test(userPrompt)) {
    warnings.push('REMINDER: Auth Service must only receive login/register/token-refresh routes from the gateway. Never use Auth as a per-request hop for business operations.');
  }
  if (/cdn/i.test(userPrompt) && !/s3|storage|bucket|blob/i.test(userPrompt)) {
    warnings.push('WARNING: CDN detected but no object storage mentioned. CDN must pull from an origin (S3/GCS/Azure Blob). Add an Object Storage node as the CDN origin.');
  }
  if (/drm/i.test(userPrompt)) {
    warnings.push('SECURITY: DRM License Service must route through the API Gateway — never connect directly from client tier. Gateway verifies subscription before issuing DRM licenses.');
  }

  return {
    domain,
    confidence,
    detectedTechStack,
    customFeatures,
    recommendedDirection,
    diagramLabel,
    domainRequiredNodes,
    architectureHints,
    warnings,
  };
}
