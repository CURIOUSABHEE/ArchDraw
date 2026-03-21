import type {
  Tutorial,
  TutorialLevel,
  TutorialStep,
  ComponentRef,
  EdgeRequirement,
  TutorialMessage,
} from './types';

// ── EDGE_LABEL map ────────────────────────────────────────────────────────────
// Maps component IDs to the first word of their canvas label.
// Used by edge() to resolve component IDs → display labels for requiredEdges.
// Rule: use the first significant word of the component's canvas label.
export const EDGE_LABEL: Record<string, string> = {
  // Clients
  client_web: 'Web',
  client_mobile: 'Mobile',
  // Networking
  dns: 'DNS',
  cdn: 'CDN',
  api_gateway: 'API Gateway',
  load_balancer: 'Load Balancer',
  firewall_waf: 'Firewall',
  // Auth / Security
  auth_service: 'Auth',
  api_key_manager: 'API',
  secret_manager: 'Secret',
  // Services
  microservice: 'Microservice',
  serverless_fn: 'Serverless',
  worker_job: 'Worker',
  notification_service: 'Notification',
  upload_service: 'Upload',
  user_service: 'User',
  fanout_service: 'Fan-out',
  feed_service: 'Feed',
  data_ingestion_service: 'Data',
  recommendation_service: 'Recommendation',
  ml_service: 'ML',
  embedding_service: 'Embedding',
  llm_api: 'LLM',
  rag_pipeline: 'RAG',
  tracing_service: 'Tracing',
  config_service: 'Config',
  model_server: 'Model',
  // External Services
  maps_api: 'Maps',
  payment_gateway: 'Payment',
  // Compute (additional)
  pricing_engine: 'Pricing',
  trust_service: 'Trust',
  routing_engine: 'Routing',
  geofence_service: 'Geofence',
  location_service: 'Location',
  fraud_detection_service: 'Fraud',
  // Clients (additional)
  driver_app: 'Driver',
  // Messaging
  kafka_streaming: 'Kafka',
  message_queue: 'Message',
  event_bus: 'Event',
  // Storage
  nosql_db: 'NoSQL',
  sql_db: 'SQL',
  object_storage: 'Object',
  in_memory_cache: 'Cache',
  vector_db: 'Vector',
  data_warehouse: 'Data',
  // Observability
  logger: 'Logger',
  metrics_collector: 'Metrics',
  dashboard: 'Dashboard',
  circuit_breaker: 'Circuit',
  search_engine: 'Search',
  // AirBnb-specific
  availability_service: 'Availability',
  review_service: 'Review',
  // Discord-specific
  signaling_server: 'Signaling',
  media_server: 'Media',
  presence_service: 'Presence',
  stun_server: 'STUN',
  webrtc_server: 'WebRTC',
  // Zoom-specific
  turn_server: 'TURN',
  // Spotify-specific
  audio_cdn: 'Audio',
  playlist_service: 'Playlist',
  audio_transcoder: 'Audio',
  offline_sync: 'Offline',
  // LinkedIn-specific
  feed_ranker: 'Feed',
  graph_database: 'Graph',
  timeline_service: 'Timeline',
  // Shopify-specific
  cart_service: 'Cart',
  checkout_service: 'Checkout',
  fulfillment_service: 'Fulfillment',
  tax_service: 'Tax',
  inventory_service: 'Inventory',
  order_service: 'Order',
  // Figma-specific
  crdt_engine: 'CRDT',
  canvas_renderer: 'Canvas',
  version_history: 'Version',
  // DoorDash-specific
  dasher_service: 'Dasher',
  eta_service: 'ETA',
  // GitHub-specific
  code_review_service: 'Code',
  ci_runner: 'CI',
  git_storage: 'Git',
  webhook_dispatcher: 'Webhook',
  // WhatsApp-specific
  trending_service: 'Trending',
  media_service: 'Media',
  // AI Agent system
  agent_orchestrator: 'Agent',
  agent_planner: 'Agent',
  agent_executor: 'Agent',
  agent_memory: 'Memory',
  agent_supervisor: 'Supervisor',
  tool_registry: 'Tool',
  llm_gateway: 'LLM',
  // Service Mesh
  sidecar_proxy: 'Sidecar',
  service_mesh: 'Mesh',
  control_plane: 'Control',
  // Rate Limiting
  token_bucket_limiter: 'Token',
  sliding_window_limiter: 'Sliding',
  leaky_bucket_limiter: 'Leaky',
  rate_limit_redis: 'Rate',
  // Data Pipelines
  cdc_connector: 'CDC',
  event_store: 'Event',
  cqrs_command_handler: 'Command',
  cqrs_query_handler: 'Query',
  saga_orchestrator: 'Saga',
  saga_participant: 'Saga',
  // Distributed Coordination
  raft_consensus: 'Raft',
  distributed_lock: 'Lock',
  leader_election: 'Leader',
  service_discovery: 'Discovery',
  configuration_sync: 'Config',
  consistent_hash_ring: 'Hash',
  virtual_nodes: 'Virtual',
  // API Patterns
  bff_gateway: 'BFF',
  graphql_federation: 'GraphQL',
  graphql_subgraph: 'Subgraph',
  api_composition: 'API',
  // Security
  mtls_certificate_authority: 'mTLS',
  oauth_pkce_flow: 'OAuth',
  jwt_validator: 'JWT',
  token_rotation: 'Token',
  zero_trust_proxy: 'Zero',
  // Observability Advanced
  otel_collector: 'OTel',
  correlation_id_handler: 'Correlation',
  slo_tracker: 'SLO',
  error_budget_alert: 'Budget',
  structured_logger: 'Structured',
  // Database Advanced
  read_replica: 'Replica',
  write_shard: 'Shard',
  connection_pooler: 'Pooler',
  // Caching Advanced
  change_data_cache: 'CDC',
  cache_stampede_guard: 'Stampede',
  write_through_cache: 'Write',
  cache_aside: 'Cache',
  // Networking
  cdn_anycast: 'Anycast',
  ddos_mitigation: 'DDoS',
  prefetch_cache: 'Prefetch',
  cdn_tiered_cache: 'Tiered',
  surrogate_key_purge: 'Surrogate',
};

/** Resolve a component ID to its edge label (first word of canvas label).
 *  Falls back to the raw string if the ID is not in the map. */
export function edgeLabel(componentId: string): string {
  return EDGE_LABEL[componentId] ?? componentId;
}

// ── Primitive builders ───────────────────────────────────────────────────────

/** Build a component reference. searchHint defaults to label. */
export function component(id: string, label: string, searchHint?: string): ComponentRef {
  return { id, label, searchHint: searchHint ?? label };
}

/** Build an edge requirement.
 *  `from` and `to` should be component IDs (e.g. 'client_web', 'api_gateway').
 *  They are resolved to their canvas label first-words via EDGE_LABEL.
 *  Raw label strings are also accepted and passed through unchanged. */
export function edge(from: string, to: string, label?: string): EdgeRequirement {
  const resolvedFrom = EDGE_LABEL[from] ?? from;
  const resolvedTo = EDGE_LABEL[to] ?? to;
  return { from: resolvedFrom, to: resolvedTo, ...(label ? { label } : {}) };
}

/** Build an AI message */
export function msg(content: string): TutorialMessage {
  return { role: 'ai', content };
}

// ── Step builder ─────────────────────────────────────────────────────────────

export function step(config: {
  id: number;
  title: string;
  explanation: string;
  action: string;
  why: string;
  component: ComponentRef;
  openingMessage: string;
  celebrationMessage: string;
  connectingMessage?: string;
  messages: TutorialMessage[];
  requiredNodes: string[];
  requiredEdges: EdgeRequirement[];
  successMessage?: string;
  errorMessage?: string;
}): TutorialStep {
  const { successMessage, errorMessage, requiredNodes, requiredEdges, ...rest } = config;
  return {
    ...rest,
    requiredNodes,
    requiredEdges,
    validation: {
      successMessage: successMessage ?? `${config.component.label} added and connected correctly.`,
      errorMessage: errorMessage ?? `Add ${config.component.label} using ⌘K and connect it as instructed.`,
    },
  };
}

// ── Level builder ────────────────────────────────────────────────────────────

/** stepCount is always computed from steps.length — never set manually */
export function level(config: {
  level: 1 | 2 | 3;
  title: string;
  subtitle: string;
  description: string;
  estimatedTime: string;
  contextMessage: string;
  unlocks?: string;
  prerequisite?: string;
  steps: TutorialStep[];
}): TutorialLevel {
  return {
    ...config,
    stepCount: config.steps.length,
  };
}

// ── Tutorial builder ─────────────────────────────────────────────────────────

export function tutorial(
  config: Omit<Tutorial, 'levels'> & {
    levels: [TutorialLevel] | [TutorialLevel, TutorialLevel] | [TutorialLevel, TutorialLevel, TutorialLevel];
  },
): Tutorial {
  return config;
}
