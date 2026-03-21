import { step, level, tutorial, component, edge, msg } from '@/lib/tutorial/factories';
import {
  buildAction,
  buildFirstStepAction,
  buildOpeningL1,
  buildOpeningL2,
  buildOpeningL3,
  buildCelebration,
} from '@/lib/tutorial/defaults';
import type { Tutorial } from '@/lib/tutorial/types';

const l1 = level({
  level: 1,
  title: 'Real-Time Collaboration',
  subtitle: 'Build a collaborative workspace in 9 steps',
  description:
    'Build a real-time collaborative workspace. Learn operational transforms, block-based data models, conflict resolution, and how 35 million users edit documents simultaneously.',
  estimatedTime: '~28 mins',
  unlocks: undefined,
  contextMessage:
    "Let's build Notion from scratch. 35 million users collaboratively editing documents, databases, and wikis in real time. The hardest problem: when two people edit the same sentence simultaneously, neither should lose their work. This is the fundamental challenge of real-time collaboration that shapes every architectural decision.",
  steps: [
    step({
      id: 1,
      title: 'Start with the Client',
      explanation:
        "Notion's client is a web app built on a block-based editor. Every paragraph, heading, image, and database is a block with a unique ID. The client maintains a local copy of the document and syncs changes in real time.",
      action: buildFirstStepAction('Web'),
      why: "The block-based client model is fundamental to Notion's architecture. Every edit is a block operation — insert, update, delete — which makes conflict resolution tractable.",
      component: component('client_web', 'Web'),
      openingMessage: buildOpeningL1(
        'Notion',
        'Block-based Editor',
        'treat every element as a block with a unique ID — paragraphs, headings, images, databases — each editable as an atomic operation',
        "When you type, you're not editing a string of text — you're creating block operations (insert, update, delete) that sync to all collaborators. This block-based model makes conflict resolution tractable: you resolve conflicts at the block level, not the character level.",
        'Web'
      ),
      celebrationMessage: buildCelebration(
        'Web Client',
        'nothing yet',
        "Notion's editor treats every element as a block with a unique ID. When you type, you're creating block operations — insert, update, delete — that sync to all collaborators. This block-level model makes conflict resolution tractable.",
        'API Gateway'
      ),
      messages: [
        msg(
          "Welcome to the Notion Architecture tutorial. 35 million users collaboratively editing documents, databases, and wikis in real time."
        ),
        msg(
          "Notion's client is a block-based editor — every element is a block with a unique ID. When you type, you're not editing a string, you're creating block operations that get synced to every collaborator."
        ),
        msg('Press ⌘K and search for "Web" to add the client to the canvas.'),
      ],
      requiredNodes: ['client_web'],
      requiredEdges: [],
      successMessage: 'Client added. Now the entry layer.',
      errorMessage: 'Add a Web Client node using ⌘K → search "Web".',
    }),
    step({
      id: 2,
      title: 'Add the API Gateway',
      explanation:
        "All requests from Notion clients flow through an API Gateway. It handles authentication, routes REST requests to backend services, and upgrades WebSocket connections for real-time collaboration.",
      action: buildAction(
        'API Gateway',
        'Web',
        'API Gateway',
        'both REST requests for page loads and WebSocket upgrades for real-time collaboration being handled at the same entry point'
      ),
      why: "The API Gateway is the single entry point that handles both REST (page loads, search) and WebSocket (real-time sync) traffic. Separating these concerns at the gateway level simplifies the backend.",
      component: component('api_gateway', 'API Gateway'),
      openingMessage: buildOpeningL1(
        'Notion',
        'API Gateway',
        'handle both REST requests for page loads and WebSocket upgrades for real-time document synchronization',
        "A page load is a REST request to fetch block data. Opening a shared document upgrades to a WebSocket connection for live sync. Both traffic types flow through the same gateway — it routes REST to services and handles the WebSocket upgrade for real-time connections.",
        'API Gateway'
      ),
      celebrationMessage: buildCelebration(
        'API Gateway',
        'Web Client',
        "Notion handles two types of traffic through the same gateway: REST for page loads and search, WebSocket for real-time sync. The gateway routes REST to services and handles the WebSocket upgrade for collaborative editing.",
        'Auth Service'
      ),
      messages: [
        msg(
          "Notion handles two types of traffic: REST requests for page loads and WebSocket connections for real-time collaboration."
        ),
        msg(
          "The API Gateway routes both. A page load is a REST request to fetch block data. Opening a shared document upgrades to a WebSocket connection for live sync."
        ),
        msg('Press ⌘K, search for "API Gateway", add it, then connect Web → API Gateway.'),
      ],
      requiredNodes: ['api_gateway'],
      requiredEdges: [edge('client_web', 'api_gateway')],
      successMessage: 'API Gateway added and connected. Now the auth layer.',
      errorMessage: 'Add an API Gateway and connect Web → API Gateway.',
    }),
    step({
      id: 3,
      title: 'Add Auth Service',
      explanation:
        "Notion authenticates users via email magic links or Google OAuth. The Auth Service issues session tokens and enforces workspace-level permissions — who can view, comment, or edit each page.",
      action: buildAction(
        'Auth Service',
        'API Gateway',
        'Auth Service',
        'magic link and OAuth authentication being validated with workspace-level permission checks on every block read or write'
      ),
      why: "Notion's permission model is hierarchical — workspace > teamspace > page. The Auth Service must evaluate this hierarchy on every request to determine what a user can see and edit.",
      component: component('auth_service', 'Auth'),
      openingMessage: buildOpeningL1(
        'Notion',
        'Auth Service',
        'authenticate users via magic links or OAuth and enforce a hierarchical permission model: workspace admins, members, guests, and public viewers',
        "Notion's permission hierarchy — workspace > teamspace > page — means every block read and write must be permission-checked. The Auth Service evaluates this hierarchy on every request to determine what a user can see and edit.",
        'Auth Service'
      ),
      celebrationMessage: buildCelebration(
        'Auth Service',
        'API Gateway',
        "Notion uses magic link email or Google OAuth — no passwords. The Auth Service enforces a hierarchical permission model: workspace admins, members, guests, and public viewers. Every block read and write is permission-checked against this hierarchy.",
        'Sync Service'
      ),
      messages: [
        msg("Notion uses magic link email auth or Google OAuth — no passwords to remember."),
        msg(
          "The Auth Service also enforces Notion's permission hierarchy: workspace admins, members, guests, and public viewers all have different access levels. Every block read or write is permission-checked."
        ),
        msg('Press ⌘K, search for "Auth Service", add it, then connect API Gateway → Auth Service.'),
      ],
      requiredNodes: ['auth_service'],
      requiredEdges: [edge('api_gateway', 'auth_service')],
      successMessage: 'Auth added and connected. Now the real-time sync layer.',
      errorMessage: 'Add an Auth Service and connect API Gateway → Auth Service.',
    }),
    step({
      id: 4,
      title: 'Add Sync Service',
      explanation:
        "The Sync Service is the heart of Notion's real-time collaboration. It receives block operations from clients, applies them using operational transforms, and broadcasts the result to all connected collaborators.",
      action: buildAction(
        'Microservice',
        'Auth',
        'Sync Service',
        'block operations from multiple collaborators being received and resolved using operational transforms so concurrent edits are merged correctly'
      ),
      why: "Real-time collaboration requires a central authority to order concurrent edits. The Sync Service ensures that when two people edit the same block simultaneously, both edits are applied correctly without data loss.",
      component: component('microservice', 'Microservice'),
      openingMessage: buildOpeningL1(
        'Notion',
        'Sync Service',
        'receive block operations from multiple users, resolve conflicts using operational transforms, and broadcast merged results to all collaborators',
        "When two people edit the same sentence simultaneously, the Sync Service receives both operations, transforms them so they're compatible — neither person's work is lost — and broadcasts the merged result. This is the core algorithm behind Google Docs and Notion.",
        'Microservice'
      ),
      celebrationMessage: buildCelebration(
        'Sync Service',
        'Auth Service',
        "The Sync Service uses operational transforms — the core algorithm behind Google Docs and Notion. When two people edit the same block simultaneously, both operations are transformed to be compatible and applied. Neither person loses their work. This is the hardest problem in real-time collaboration.",
        'Block Service'
      ),
      messages: [
        msg("Here's the hard problem: two people edit the same sentence at the same time. Who wins?"),
        msg(
          "The Sync Service uses operational transforms — it receives both edits, transforms them so they're compatible, and applies both. Neither person loses their work. This is the core algorithm behind Google Docs and Notion."
        ),
        msg('Press ⌘K, search for "Microservice", add it, then connect Auth Service → Sync Service.'),
      ],
      requiredNodes: ['microservice'],
      requiredEdges: [edge('auth_service', 'microservice')],
      successMessage: 'Sync Service added. Now the block storage layer.',
      errorMessage: 'Add a Microservice (Sync Service) and connect Auth Service → Sync Service.',
    }),
    step({
      id: 5,
      title: 'Add Block Service',
      explanation:
        "The Block Service handles CRUD operations on Notion's block tree. Every page is a tree of blocks. The Block Service resolves block IDs, fetches subtrees, and applies block mutations atomically.",
      action: buildAction(
        'Microservice',
        'Microservice',
        'Block Service',
        'block tree operations being handled: resolving block IDs, fetching subtrees, and applying atomic mutations like moving a block between pages'
      ),
      why: "Separating block storage logic into its own service means the Sync Service can focus on conflict resolution while the Block Service handles the complexity of tree traversal, block versioning, and atomic mutations.",
      component: component('microservice', 'Microservice'),
      openingMessage: buildOpeningL1(
        'Notion',
        'Block Service',
        'handle all CRUD operations on the block tree: resolving block IDs, fetching subtrees, and applying atomic mutations',
        "Every Notion page is a tree of blocks. When you move a block, it atomically removes it from one parent and inserts it into another — no partial states. The Sync Service passes resolved operations here; the Block Service handles the persistence complexity.",
        'Microservice'
      ),
      celebrationMessage: buildCelebration(
        'Block Service',
        'Sync Service',
        "Every Notion page is a tree of blocks. Moving a block is atomic — removed from one parent, inserted into another, no partial states. The Block Service handles tree traversal, block versioning, and atomic mutations. The Sync Service focuses purely on conflict resolution.",
        'NoSQL Database'
      ),
      messages: [
        msg(
          "Every Notion page is a tree of blocks. A page block contains heading blocks, paragraph blocks, database blocks — each with their own children."
        ),
        msg(
          "The Block Service handles all reads and writes to this tree. When you move a block, it atomically removes it from one parent and inserts it into another — no partial states."
        ),
        msg(
          'Press ⌘K, search for "Microservice", add another one for the Block Service, then connect Sync Service → Block Service.'
        ),
      ],
      requiredNodes: ['microservice'],
      requiredEdges: [edge('microservice', 'microservice')],
      successMessage: 'Block Service added. Now the database layer.',
      errorMessage: 'Add a second Microservice (Block Service) and connect it from the Sync Service.',
    }),
    step({
      id: 6,
      title: 'Add NoSQL Database',
      explanation:
        "Notion stores all blocks in a NoSQL database. Each block is a document with an ID, type, properties, and parent reference. The flexible document model handles Notion's 50+ block types without schema migrations.",
      action: buildAction(
        'NoSQL Database',
        'Microservice',
        'NoSQL Database',
        'all blocks being persisted as flexible documents with ID, type, properties, and parent reference — handling 50+ block types without schema migrations'
      ),
      why: "Notion's 50+ block types (paragraph, heading, database, kanban, calendar, etc.) have different properties. NoSQL's flexible document model handles this without requiring a new SQL column for every block type.",
      component: component('nosql_db', 'NoSQL'),
      openingMessage: buildOpeningL1(
        'Notion',
        'NoSQL Database',
        'persist all blocks as flexible documents with varying schemas — paragraphs, databases, kanban boards, calendars each have different properties',
        "NoSQL's flexible document model handles all 50+ block types perfectly. A paragraph block has text content. A database block has schema and rows. Both are just documents with different shapes — no schema migrations needed when Notion adds a new block type.",
        'NoSQL Database'
      ),
      celebrationMessage: buildCelebration(
        'NoSQL Database',
        'Block Service',
        "Notion has 50+ block types — paragraphs, databases, kanban boards, calendars, embeds — each with different properties. NoSQL's flexible document model handles all of them without schema migrations. When Notion adds a new block type, there's no database migration.",
        'In-Memory Cache'
      ),
      messages: [
        msg(
          "Notion has 50+ block types — paragraphs, databases, kanban boards, calendars, embeds. Each has different properties."
        ),
        msg(
          "NoSQL's flexible document model handles this perfectly. A paragraph block has text content. A database block has schema and rows. Both are just documents with different shapes — no schema migrations needed."
        ),
        msg('Press ⌘K, search for "NoSQL Database", add it, then connect Block Service → NoSQL Database.'),
      ],
      requiredNodes: ['nosql_db'],
      requiredEdges: [edge('microservice', 'nosql_db')],
      successMessage: 'NoSQL Database added. Now the cache layer.',
      errorMessage: 'Add a NoSQL Database and connect Block Service → NoSQL Database.',
    }),
    step({
      id: 7,
      title: 'Add In-Memory Cache',
      explanation:
        "Notion caches frequently accessed pages and block trees in Redis. When you open a popular shared page, the block tree is served from cache — not the database. Cache TTL is 60 seconds for collaborative pages.",
      action: buildAction(
        'In-Memory Cache',
        'Microservice',
        'In-Memory Cache',
        'frequently accessed block trees being served from cache in under 5ms with a 60-second TTL for collaborative pages'
      ),
      why: "Page loads must be fast. Fetching a complex block tree from the database on every load would be too slow. The cache serves the block tree in under 5ms, making page loads feel instant.",
      component: component('in_memory_cache', 'Cache'),
      openingMessage: buildOpeningL1(
        'Notion',
        'In-Memory Cache',
        'serve frequently accessed block trees from Redis in under 5ms with a 60-second TTL to keep collaborative pages fresh',
        "When 1000 people have the same Notion page open, you don't want 1000 database reads per second. The cache serves the block tree in under 5ms. Cache TTL is short — 60 seconds — because collaborative pages change frequently. But even 60 seconds dramatically reduces database load.",
        'In-Memory Cache'
      ),
      celebrationMessage: buildCelebration(
        'In-Memory Cache',
        'Block Service',
        "When 1000 people have the same Notion page open, the Block Service serves block trees from Redis in under 5ms — no database read. Cache TTL is 60 seconds because collaborative pages change frequently. This is what makes page loads feel instant.",
        'Message Queue'
      ),
      messages: [
        msg(
          "When 1000 people have the same Notion page open, you don't want 1000 database reads per second."
        ),
        msg(
          "The cache stores the block tree for popular pages. Cache TTL is short — 60 seconds — because collaborative pages change frequently. But even a 60-second cache dramatically reduces database load."
        ),
        msg('Press ⌘K, search for "In-Memory Cache", add it, then connect Block Service → In-Memory Cache.'),
      ],
      requiredNodes: ['in_memory_cache'],
      requiredEdges: [edge('microservice', 'in_memory_cache')],
      successMessage: 'Cache added. Now the async event layer.',
      errorMessage: 'Add an In-Memory Cache and connect Block Service → In-Memory Cache.',
    }),
    step({
      id: 8,
      title: 'Add Message Queue',
      explanation:
        "When a block is updated, downstream services need to react — search indexing, notification delivery, analytics, and backup. A Message Queue decouples these from the write path so they don't slow down the editor.",
      action: buildAction(
        'Message Queue',
        'Microservice',
        'Message Queue',
        'block_updated events being published so search indexing, notifications, and analytics can process asynchronously without blocking the editor'
      ),
      why: "Search indexing and notification delivery are slow operations. Running them synchronously on every block edit would make the editor feel laggy. The queue makes the write path fast and lets downstream services catch up asynchronously.",
      component: component('message_queue', 'Message'),
      openingMessage: buildOpeningL1(
        'Notion',
        'Message Queue',
        'decouple search indexing and notifications from the write path so the editor stays fast while downstream services process asynchronously',
        "Every block edit triggers downstream work: update the search index, send notifications to @mentioned users, log analytics. The Block Service publishes a 'block_updated' event and returns immediately. Search indexing happens asynchronously — the editor never waits.",
        'Message Queue'
      ),
      celebrationMessage: buildCelebration(
        'Message Queue',
        'Block Service',
        "Every block edit publishes a 'block_updated' event to the queue. Search indexing, @mention notifications, and analytics consume it asynchronously. The editor never waits for any of these — the write path stays fast. You have built Notion.",
        'Object Storage'
      ),
      messages: [
        msg(
          "Every block edit triggers downstream work: update the search index, send notifications to @mentioned users, log analytics..."
        ),
        msg(
          "A Message Queue decouples all of this from the write path. The Block Service publishes a 'block_updated' event and returns immediately. Search indexing happens asynchronously — the editor stays fast."
        ),
        msg('Press ⌘K, search for "Message Queue", add it, then connect Block Service → Message Queue.'),
      ],
      requiredNodes: ['message_queue'],
      requiredEdges: [edge('microservice', 'message_queue')],
      successMessage: 'Message Queue added. Final step — object storage.',
      errorMessage: 'Add a Message Queue and connect Block Service → Message Queue.',
    }),
    step({
      id: 9,
      title: 'Add Object Storage',
      explanation:
        "Images, files, and attachments uploaded to Notion are stored in object storage. Files are uploaded directly from the client to object storage using pre-signed URLs — they never pass through Notion's servers.",
      action: buildAction(
        'Object Storage',
        'Microservice',
        'Object Storage',
        'files being uploaded directly from the client to storage via pre-signed URL — Notion servers handle only metadata, never file transfer'
      ),
      why: "Direct client-to-storage uploads via pre-signed URLs offload bandwidth from Notion's servers. A 100MB file upload goes directly to S3 — Notion's backend only handles the metadata.",
      component: component('object_storage', 'Object'),
      openingMessage: buildOpeningL1(
        'Notion',
        'Object Storage',
        'persist uploaded files directly via pre-signed URLs — client uploads straight to S3, servers handle only metadata',
        "Notion generates a pre-signed URL, the client uploads directly to S3, then tells Notion the upload is complete. Notion stores the URL as a block property. This keeps Notion's servers entirely out of the file transfer path — a 100MB file never touches Notion's bandwidth.",
        'Object Storage'
      ),
      celebrationMessage: buildCelebration(
        'Object Storage',
        'Block Service',
        "Notion uses pre-signed URLs for direct client uploads — files up to 100MB upload directly to S3, never touching Notion's servers. Notion stores only the URL as a block property. This keeps Notion's infrastructure entirely out of the file transfer path. You have built Notion.",
        'nothing — you have built Notion'
      ),
      messages: [
        msg(
          "When you upload an image to Notion, it doesn't go through Notion's servers. It goes directly to object storage."
        ),
        msg(
          "Notion generates a pre-signed URL, the client uploads directly to S3, then tells Notion the upload is complete. Notion stores the URL as a block property. This keeps Notion's servers out of the file transfer path entirely."
        ),
        msg('Press ⌘K, search for "Object Storage", add it, then connect Block Service → Object Storage.'),
      ],
      requiredNodes: ['object_storage'],
      requiredEdges: [edge('microservice', 'object_storage')],
      successMessage: 'Object Storage added and connected. You have built Notion.',
      errorMessage: 'Add an Object Storage and connect Block Service → Object Storage.',
    }),
  ],
});

const l2 = level({
  level: 2,
  title: "Notion at Scale",
  subtitle: "Stream block operations with real-time collaboration monitoring",
  description:
    "Add Kafka event streaming, Redis presence caching, CDC pipelines, and SLO tracking to Notion's architecture. Handle millions of block operations per second and monitor collaboration sync latency.",
  estimatedTime: "~28 mins",
  unlocks: undefined,
  contextMessage:
    "Let's scale Notion. 35 million users, millions of block operations per second, and sub-200ms document loads. This requires Kafka for block event streaming, Redis for presence, and performance-grade observability.",
  steps: [
    step({
      id: 1,
      title: "Add Kafka Streaming",
      explanation:
        "Notion's Event Bus streams block operations, comment additions, and permission changes. Every keystroke in a shared document generates an event that must be broadcast to all collaborators.",
      action: buildAction(
        "Kafka / Streaming",
        "API Gateway",
        "Kafka Streaming",
        "block operations being streamed so search indexing, notifications, and collaboration sync can react in real time"
      ),
      why: "Without Kafka, computing trending lists would require synchronous database queries that slow down every view.",
      component: component("kafka_streaming", "Kafka / Streaming", "Kafka / Streaming"),
      openingMessage: buildOpeningL2(
        "Notion",
        "Kafka",
        "stream block operations, comment additions, and permission changes to all collaborators in real time",
        "Every keystroke in a shared document generates an event that must be broadcast to all collaborators.",
        "Kafka / Streaming"
      ),
      celebrationMessage: buildCelebration(
        "Kafka Streaming",
        "API Gateway",
        "Notion's Event Bus streams block operations to all collaborators. Every keystroke in a shared document is broadcast in real time through Kafka.",
        "Notification Worker"
      ),
      messages: [
        msg("Level 2 — Notion at Scale. Kafka streams block operations to all collaborators."),
        msg("Every keystroke in a shared document generates an event that must be broadcast to all collaborators. Kafka enables this at scale."),
        msg('Press ⌘K, search for "Kafka / Streaming", add it, then connect API Gateway → Kafka Streaming.'),
      ],
      requiredNodes: ["kafka_streaming"],
      requiredEdges: [edge("api_gateway", "kafka_streaming")],
      successMessage: "Events streaming. Now notifications.",
      errorMessage: "Add Kafka Streaming connected from the API Gateway.",
    }),
    step({
      id: 2,
      title: "Add Notification Worker",
      explanation:
        "Notion's Notification Worker handles @mentions, comments, and shared document alerts. Notifications must be delivered in seconds — collaboration depends on timely awareness.",
      action: buildAction(
        "Worker",
        "Kafka",
        "Notification Worker",
        "@mentions, comments, and shared document alerts being processed and delivered in seconds"
      ),
      why: "Collaboration depends on timely awareness. When someone @mentions you in a comment, the notification must arrive within seconds.",
      component: component("worker_job", "Worker"),
      openingMessage: buildOpeningL2(
        "Notion",
        "Notification Worker",
        "handle @mentions, comments, and shared document alerts with delivery in seconds",
        "Notifications must be delivered in seconds — collaboration depends on timely awareness.",
        "Worker"
      ),
      celebrationMessage: buildCelebration(
        "Notification Worker",
        "Kafka Streaming",
        "Notion's Notification Worker handles @mentions, comments, and shared document alerts. When someone @mentions you, the notification arrives within seconds.",
        "In-Memory Cache"
      ),
      messages: [
        msg("Notification workers handle @mentions, comments, and shared document alerts."),
        msg("Notifications must be delivered in seconds — collaboration depends on timely awareness of changes."),
        msg('Press ⌘K, search for "Worker / Background Job", add it, then connect Kafka Streaming → Notification Worker.'),
      ],
      requiredNodes: ["worker_job"],
      requiredEdges: [edge("kafka_streaming", "worker_job")],
      successMessage: "Notifications added. Now Redis presence cache.",
      errorMessage: "Add a Worker connected from Kafka Streaming.",
    }),
    step({
      id: 3,
      title: "Add In-Memory Cache",
      explanation:
        "Notion's Redis Cache stores active document sessions and presence state. When 20 team members edit a shared database, their presence and cursors are cached for instant retrieval.",
      action: buildAction(
        "In-Memory Cache",
        "API Gateway",
        "In-Memory Cache",
        "active document sessions and presence state being cached for instant retrieval of collaborator cursors"
      ),
      why: "Presence and cursor positions must be cached for instant retrieval. When 20 team members edit a shared document, their cursors are cached in Redis.",
      component: component("in_memory_cache", "In-Memory Cache"),
      openingMessage: buildOpeningL2(
        "Notion",
        "Redis Cache",
        "store active document sessions and presence state for instant retrieval of collaborator cursors",
        "When 20 team members edit a shared database, their presence and cursors are cached for instant retrieval.",
        "In-Memory Cache"
      ),
      celebrationMessage: buildCelebration(
        "In-Memory Cache",
        "API Gateway",
        "Notion's Redis Cache stores active document sessions and presence state. When 20 team members edit a shared database, their presence and cursors are cached for instant retrieval.",
        "CDC Connector"
      ),
      messages: [
        msg("Notion's Redis Cache stores active document sessions and presence state."),
        msg("When 20 team members edit a shared database, their presence and cursors are cached for instant retrieval."),
        msg('Press ⌘K, search for "In-Memory Cache", add it, then connect API Gateway → In-Memory Cache.'),
      ],
      requiredNodes: ["in_memory_cache"],
      requiredEdges: [edge("api_gateway", "in_memory_cache")],
      successMessage: "Presence caching added. Now CDC pipeline.",
      errorMessage: "Add an In-Memory Cache connected from the API Gateway.",
    }),
    step({
      id: 4,
      title: "Add CDC Connector",
      explanation:
        "Notion's CDC Connector mirrors document activity to the analytics platform. Block usage, template engagement, and collaboration metrics stream to ClickHouse.",
      action: buildAction(
        "CDC Connector",
        "Sync Service",
        "CDC Connector",
        "document activity being mirrored to analytics platform with block usage and collaboration metrics"
      ),
      why: "CDC captures every change in the database and streams it to analytics. Block usage, template engagement, and collaboration patterns inform product decisions.",
      component: component("cdc_connector", "CDC Connector"),
      openingMessage: buildOpeningL2(
        "Notion",
        "CDC Connector",
        "mirror document activity to analytics with block usage, template engagement, and collaboration metrics",
        "CDC captures every change in the database and streams it to analytics for product insights.",
        "CDC Connector"
      ),
      celebrationMessage: buildCelebration(
        "CDC Connector",
        "Sync Service",
        "Notion's CDC Connector mirrors document activity to the analytics platform. Block usage, template engagement, and collaboration metrics stream to ClickHouse.",
        "SQL Database"
      ),
      messages: [
        msg("CDC Connector mirrors document activity to the analytics platform."),
        msg("Block usage, template engagement, and collaboration metrics stream to ClickHouse for product insights."),
        msg('Press ⌘K, search for "CDC Connector", add it, then connect Sync Service → CDC Connector.'),
      ],
      requiredNodes: ["cdc_connector"],
      requiredEdges: [edge("microservice", "cdc_connector")],
      successMessage: "CDC pipeline added. Now SQL for user data.",
      errorMessage: "Add a CDC Connector connected from the Sync Service.",
    }),
    step({
      id: 5,
      title: "Add SQL Database",
      explanation:
        "Notion's PostgreSQL stores user accounts, workspaces, and permissions. Document content is stored as structured JSON in PostgreSQL — Notion's block-based model maps naturally to JSON.",
      action: buildAction(
        "SQL Database",
        "Auth Service",
        "SQL Database",
        "user accounts, workspaces, and permissions being stored with structured JSON for block content"
      ),
      why: "User accounts, workspaces, and permissions require ACID transactions. Document content stored as JSON in PostgreSQL maps naturally to Notion's block-based model.",
      component: component("sql_db", "SQL Database"),
      openingMessage: buildOpeningL2(
        "Notion",
        "SQL Database",
        "store user accounts, workspaces, and permissions with block content as structured JSON",
        "Document content is stored as structured JSON in PostgreSQL — Notion's block-based model maps naturally to JSON.",
        "SQL Database"
      ),
      celebrationMessage: buildCelebration(
        "SQL Database",
        "Auth Service",
        "Notion's PostgreSQL stores user accounts, workspaces, and permissions. Document content is stored as structured JSON — Notion's block-based model maps naturally to JSON.",
        "Structured Logger"
      ),
      messages: [
        msg("PostgreSQL stores user accounts, workspaces, and permissions."),
        msg("Document content is stored as structured JSON in PostgreSQL — Notion's block-based model maps naturally to JSON."),
        msg('Press ⌘K, search for "SQL Database", add it, then connect Auth Service → SQL Database.'),
      ],
      requiredNodes: ["sql_db"],
      requiredEdges: [edge("auth_service", "sql_db")],
      successMessage: "User data secured. Now structured logging.",
      errorMessage: "Add a SQL Database connected from the Auth Service.",
    }),
    step({
      id: 6,
      title: "Add Structured Logger",
      explanation:
        "Notion's Structured Logger captures query latency, cache hit rates, and collaboration sync times. Performance logs track p99 latency — Notion's target is <200ms for document loads.",
      action: buildAction(
        "Structured Logger",
        "API Gateway",
        "Structured Logger",
        "query latency, cache hit rates, and collaboration sync times being captured with p99 latency tracking"
      ),
      why: "Performance logs track p99 latency — Notion's target is <200ms for document loads. Structured logging enables real-time performance monitoring.",
      component: component("structured_logger", "Structured Logger"),
      openingMessage: buildOpeningL2(
        "Notion",
        "Structured Logger",
        "capture query latency, cache hit rates, and collaboration sync times with p99 latency tracking",
        "Performance logs track p99 latency — Notion's target is <200ms for document loads.",
        "Structured Logger"
      ),
      celebrationMessage: buildCelebration(
        "Structured Logger",
        "API Gateway",
        "Notion's Structured Logger captures query latency, cache hit rates, and collaboration sync times. Performance logs track p99 latency — Notion's target is <200ms for document loads.",
        "SLO Tracker"
      ),
      messages: [
        msg("Structured Logger captures query latency, cache hit rates, and collaboration sync times."),
        msg("Performance logs track p99 latency — Notion's target is <200ms for document loads."),
        msg('Press ⌘K, search for "Structured Logger", add it, then connect API Gateway → Structured Logger.'),
      ],
      requiredNodes: ["structured_logger"],
      requiredEdges: [edge("api_gateway", "structured_logger")],
      successMessage: "Structured logging added. Now SLO tracking.",
      errorMessage: "Add a Structured Logger connected from the API Gateway.",
    }),
    step({
      id: 7,
      title: "Add SLO Tracker",
      explanation:
        "Notion's SLO Tracker monitors document load time, collaboration sync latency, and search response time. Document load must complete in <200ms — tracked as a critical SLO.",
      action: buildAction(
        "SLO/SLI Tracker",
        "Structured Logger",
        "SLO Tracker",
        "document load time, collaboration sync latency, and search response time being monitored against SLO targets"
      ),
      why: "Document load must complete in <200ms — tracked as a critical SLO. Without SLOs, there's no clear contractual target for performance.",
      component: component("slo_tracker", "SLO/SLI Tracker"),
      openingMessage: buildOpeningL2(
        "Notion",
        "SLO Tracker",
        "monitor document load time, collaboration sync latency, and search response time against SLO targets",
        "Document load must complete in <200ms — tracked as a critical SLO.",
        "SLO/SLI Tracker"
      ),
      celebrationMessage: buildCelebration(
        "SLO Tracker",
        "Structured Logger",
        "Notion's SLO Tracker monitors document load time, collaboration sync latency, and search response time. Document load must complete in <200ms — tracked as a critical SLO.",
        "Error Budget Alert"
      ),
      messages: [
        msg("SLO Tracker monitors document load time, collaboration sync latency, and search response time."),
        msg("Document load must complete in <200ms — tracked as a critical SLO."),
        msg('Press ⌘K, search for "SLO/SLI Tracker", add it, then connect Structured Logger → SLO Tracker.'),
      ],
      requiredNodes: ["slo_tracker"],
      requiredEdges: [edge("structured_logger", "slo_tracker")],
      successMessage: "SLO tracking added. Now error budgets.",
      errorMessage: "Add an SLO/SLI Tracker connected from the Structured Logger.",
    }),
    step({
      id: 8,
      title: "Add Error Budget Alert",
      explanation:
        "Notion's Error Budget Monitor tracks collaboration sync SLO. When sync latency degrades during peak editing hours, engineers are alerted before the budget is depleted.",
      action: buildAction(
        "Error Budget Monitor",
        "SLO/SLI Tracker",
        "Error Budget Alert",
        "collaboration sync SLO being tracked with alerts when latency degrades during peak editing hours"
      ),
      why: "When sync latency degrades during peak editing hours, engineers must be alerted before the error budget is depleted.",
      component: component("error_budget_alert", "Error Budget Monitor"),
      openingMessage: buildOpeningL2(
        "Notion",
        "Error Budget Monitor",
        "track collaboration sync SLO with alerts when latency degrades during peak editing hours",
        "When sync latency degrades during peak editing hours, engineers are alerted before the budget is depleted.",
        "Error Budget Monitor"
      ),
      celebrationMessage: buildCelebration(
        "Error Budget Alert",
        "SLO/SLI Tracker",
        "Notion's Error Budget Monitor tracks collaboration sync SLO. When sync latency degrades during peak editing hours, engineers are alerted before the budget is depleted. You have scaled Notion.",
        "Level 3"
      ),
      messages: [
        msg("Error Budget Monitor tracks collaboration sync SLO."),
        msg("When sync latency degrades during peak editing hours, engineers are alerted before the budget is depleted."),
        msg('Press ⌘K, search for "Error Budget Monitor", add it, then connect SLO Tracker → Error Budget Alert.'),
      ],
      requiredNodes: ["error_budget_alert"],
      requiredEdges: [edge("slo_tracker", "error_budget_alert")],
      successMessage: "Error budget monitoring added. Notion is now production-ready.",
      errorMessage: "Add an Error Budget Monitor connected from the SLO Tracker.",
    }),
  ],
});

const l3 = level({
  level: 3,
  title: "Notion Enterprise",
  subtitle: "Add zero-trust workspace isolation, OT tracing, and event sourcing",
  description:
    "Implement zero-trust workspace isolation with SPIFFE certificates, distributed tracing for operational transform sync, and event sourcing for infinite versioning. Notion Enterprise serves companies with security and compliance requirements.",
  estimatedTime: "~29 mins",
  unlocks: undefined,
  contextMessage:
    "Let's make Notion enterprise-grade. Zero-trust workspace isolation, OT distributed tracing, and event sourcing for infinite undo/redo. Notion Enterprise serves Fortune 500 companies with security requirements that drive architectural decisions.",
  steps: [
    step({
      id: 1,
      title: "Add Service Mesh",
      explanation:
        "Notion's Service Mesh (Envoy) handles mTLS between document servers, search services, and API gateways. Notion's block-based architecture has dozens of specialized services — each requires secure inter-service communication.",
      action: buildAction(
        "Service Mesh (Istio)",
        "API Gateway",
        "Service Mesh",
        "mTLS encryption between document servers, search services, and API gateways being enforced at the sidecar proxy level"
      ),
      why: "Notion's block-based architecture has dozens of specialized services — each requires secure inter-service communication with mTLS.",
      component: component("service_mesh", "Service Mesh (Istio)"),
      openingMessage: buildOpeningL3(
        "Notion",
        "Service Mesh (Envoy)",
        "handle mTLS between document servers, search services, and API gateways with secure inter-service communication",
        "Notion's block-based architecture has dozens of specialized services — each requires secure inter-service communication.",
        "Service Mesh (Istio)"
      ),
      celebrationMessage: buildCelebration(
        "Service Mesh",
        "API Gateway",
        "Notion's Service Mesh (Envoy) handles mTLS between document servers, search services, and API gateways. Every inter-service call is encrypted with mTLS.",
        "BFF Gateway"
      ),
      messages: [
        msg("Level 3 — Notion Enterprise. Service Mesh adds mTLS between all services."),
        msg("Notion's block-based architecture has dozens of specialized services — each requires secure inter-service communication."),
        msg('Press ⌘K, search for "Service Mesh (Istio)", add it, then connect API Gateway → Service Mesh.'),
      ],
      requiredNodes: ["service_mesh"],
      requiredEdges: [edge("api_gateway", "service_mesh")],
      successMessage: "Service mesh added. Now BFF Gateway.",
      errorMessage: "Add a Service Mesh connected from the API Gateway.",
    }),
    step({
      id: 2,
      title: "Add BFF Gateway",
      explanation:
        "Notion's BFF Gateway serves the web and mobile clients with optimized block APIs. The BFF batches block operations, handles offline sync reconciliation, and manages collaborative cursor positions.",
      action: buildAction(
        "BFF Gateway",
        "Service Mesh",
        "BFF Gateway",
        "optimized block APIs serving web and mobile clients with batched operations and offline sync reconciliation"
      ),
      why: "The BFF batches block operations for the client, handles offline sync reconciliation, and manages collaborative cursor positions — optimizing for mobile network conditions.",
      component: component("bff_gateway", "BFF Gateway"),
      openingMessage: buildOpeningL3(
        "Notion",
        "BFF Gateway",
        "serve optimized block APIs for web and mobile with batched operations and offline sync reconciliation",
        "The BFF batches block operations, handles offline sync reconciliation, and manages collaborative cursor positions.",
        "BFF Gateway"
      ),
      celebrationMessage: buildCelebration(
        "BFF Gateway",
        "Service Mesh",
        "Notion's BFF Gateway serves optimized block APIs for web and mobile. It batches block operations, handles offline sync reconciliation, and manages collaborative cursor positions.",
        "Token Bucket Limiter"
      ),
      messages: [
        msg("BFF Gateway serves optimized block APIs for web and mobile clients."),
        msg("It batches block operations, handles offline sync reconciliation, and manages collaborative cursor positions."),
        msg('Press ⌘K, search for "BFF Gateway", add it, then connect Service Mesh → BFF Gateway.'),
      ],
      requiredNodes: ["bff_gateway"],
      requiredEdges: [edge("service_mesh", "bff_gateway")],
      successMessage: "BFF Gateway added. Now rate limiting.",
      errorMessage: "Add a BFF Gateway connected from the Service Mesh.",
    }),
    step({
      id: 3,
      title: "Add Token Bucket Rate Limiter",
      explanation:
        "Notion's Rate Limiter uses token buckets per workspace: Free (1000 requests/min), Plus (5000), Business (20000). Token buckets prevent runaway API usage from integrations.",
      action: buildAction(
        "Rate Limiter",
        "BFF Gateway",
        "Token Bucket Limiter",
        "token buckets per workspace being enforced: Free (1000/min), Plus (5000), Business (20000) to prevent runaway API usage"
      ),
      why: "Token buckets prevent runaway API usage from integrations. Per-workspace limits ensure fair resource allocation across Notion's multi-tenant architecture.",
      component: component("token_bucket_limiter", "Rate Limiter"),
      openingMessage: buildOpeningL3(
        "Notion",
        "Token Bucket Rate Limiter",
        "enforce per-workspace token buckets: Free (1000/min), Plus (5000), Business (20000) to prevent runaway API usage",
        "Token buckets prevent runaway API usage from integrations. Per-workspace limits ensure fair resource allocation.",
        "Rate Limiter"
      ),
      celebrationMessage: buildCelebration(
        "Token Bucket Limiter",
        "BFF Gateway",
        "Notion's Rate Limiter uses token buckets per workspace: Free (1000 requests/min), Plus (5000), Business (20000). Token buckets prevent runaway API usage from integrations.",
        "OTel Collector"
      ),
      messages: [
        msg("Token Bucket Rate Limiter enforces per-workspace limits: Free (1000/min), Plus (5000), Business (20000)."),
        msg("Token buckets prevent runaway API usage from integrations and ensure fair resource allocation."),
        msg('Press ⌘K, search for "Rate Limiter", add it, then connect BFF Gateway → Token Bucket Limiter.'),
      ],
      requiredNodes: ["token_bucket_limiter"],
      requiredEdges: [edge("bff_gateway", "token_bucket_limiter")],
      successMessage: "Rate limiting added. Now distributed tracing.",
      errorMessage: "Add a Rate Limiter connected from the BFF Gateway.",
    }),
    step({
      id: 4,
      title: "Add OpenTelemetry Collector",
      explanation:
        "Notion's OTel Collector traces block operations across document servers. A single paste operation can touch: block creation, search indexing, permission evaluation, and webhook delivery.",
      action: buildAction(
        "OTel Collector",
        "Service Mesh",
        "OTel Collector",
        "block operations being traced across document servers, search indexing, permission evaluation, and webhook delivery"
      ),
      why: "A single paste operation can touch: block creation, search indexing, permission evaluation, and webhook delivery. OTel traces connect these into a single distributed trace.",
      component: component("otel_collector", "OTel Collector"),
      openingMessage: buildOpeningL3(
        "Notion",
        "OpenTelemetry Collector",
        "trace block operations across document servers with spans for block creation, search indexing, and permission evaluation",
        "A single paste operation can touch: block creation, search indexing, permission evaluation, and webhook delivery.",
        "OTel Collector"
      ),
      celebrationMessage: buildCelebration(
        "OTel Collector",
        "Service Mesh",
        "Notion's OTel Collector traces block operations across document servers. A single paste operation can touch: block creation, search indexing, permission evaluation, and webhook delivery.",
        "Correlation ID Handler"
      ),
      messages: [
        msg("OTel Collector traces block operations across document servers."),
        msg("A single paste operation can touch: block creation, search indexing, permission evaluation, and webhook delivery."),
        msg('Press ⌘K, search for "OTel Collector", add it, then connect Service Mesh → OTel Collector.'),
      ],
      requiredNodes: ["otel_collector"],
      requiredEdges: [edge("service_mesh", "otel_collector")],
      successMessage: "Distributed tracing added. Now correlation IDs.",
      errorMessage: "Add an OTel Collector connected from the Service Mesh.",
    }),
    step({
      id: 5,
      title: "Add Correlation ID Handler",
      explanation:
        "Notion's Correlation ID links a block edit to every service: OT engine, search indexer, permission service, and notification worker. Debugging a lost edit requires tracing across all these components.",
      action: buildAction(
        "Correlation ID",
        "BFF Gateway",
        "Correlation ID Handler",
        "block edits being linked to OT engine, search indexer, permission service, and notification worker through correlation IDs"
      ),
      why: "Debugging a lost edit requires tracing across OT engine, search indexer, permission service, and notification worker. Correlation IDs link every service call.",
      component: component("correlation_id_handler", "Correlation ID"),
      openingMessage: buildOpeningL3(
        "Notion",
        "Correlation ID Handler",
        "link block edits to OT engine, search indexer, permission service, and notification worker through correlation IDs",
        "Debugging a lost edit requires tracing across all these components — correlation IDs link every service call.",
        "Correlation ID"
      ),
      celebrationMessage: buildCelebration(
        "Correlation ID Handler",
        "BFF Gateway",
        "Notion's Correlation ID links a block edit to every service: OT engine, search indexer, permission service, and notification worker. Debugging a lost edit requires tracing across all these components.",
        "mTLS CA"
      ),
      messages: [
        msg("Correlation ID Handler links block edits to every service in the request chain."),
        msg("Debugging a lost edit requires tracing across OT engine, search indexer, permission service, and notification worker."),
        msg('Press ⌘K, search for "Correlation ID", add it, then connect BFF Gateway → Correlation ID Handler.'),
      ],
      requiredNodes: ["correlation_id_handler"],
      requiredEdges: [edge("bff_gateway", "correlation_id_handler")],
      successMessage: "Correlation IDs added. Now workspace isolation.",
      errorMessage: "Add a Correlation ID connected from the BFF Gateway.",
    }),
    step({
      id: 6,
      title: "Add mTLS Certificate Authority",
      explanation:
        "Notion's SPIFFE CA issues certificates to every workspace worker and sync server. Workspace isolation is critical — compromised workers must not access other workspaces' data.",
      action: buildAction(
        "SPIFFE CA",
        "Service Mesh",
        "mTLS Certificate Authority",
        "SPIFFE certificates being issued to every workspace worker and sync server for zero-trust workspace isolation"
      ),
      why: "Workspace isolation is critical — compromised workers must not access other workspaces' data. SPIFFE certificates enforce this at the network layer.",
      component: component("mtls_certificate_authority", "SPIFFE CA"),
      openingMessage: buildOpeningL3(
        "Notion",
        "SPIFFE CA",
        "issue certificates to every workspace worker and sync server for zero-trust workspace isolation",
        "Workspace isolation is critical — compromised workers must not access other workspaces' data.",
        "SPIFFE CA"
      ),
      celebrationMessage: buildCelebration(
        "mTLS Certificate Authority",
        "Service Mesh",
        "Notion's SPIFFE CA issues certificates to every workspace worker and sync server. Workspace isolation is critical — compromised workers must not access other workspaces' data.",
        "Cache Stampede Guard"
      ),
      messages: [
        msg("SPIFFE CA issues certificates to every workspace worker and sync server."),
        msg("Workspace isolation is critical — compromised workers must not access other workspaces' data."),
        msg('Press ⌘K, search for "SPIFFE CA", add it, then connect Service Mesh → mTLS Certificate Authority.'),
      ],
      requiredNodes: ["mtls_certificate_authority"],
      requiredEdges: [edge("service_mesh", "mtls_certificate_authority")],
      successMessage: "SPIFFE CA added. Now cache protection.",
      errorMessage: "Add an mTLS Certificate Authority connected from the Service Mesh.",
    }),
    step({
      id: 7,
      title: "Add Cache Stampede Guard",
      explanation:
        "Notion's Cache Stampede Guard protects workspace session caches from stampedes when a popular shared template is opened by many users simultaneously.",
      action: buildAction(
        "Cache Stampede Guard",
        "In-Memory Cache",
        "Cache Stampede Guard",
        "workspace session caches being protected from stampedes when popular templates are opened by many users simultaneously"
      ),
      why: "When a popular shared template is opened by many users simultaneously, cache stampedes can overwhelm Redis. The stampede guard prevents this.",
      component: component("cache_stampede_guard", "Cache Stampede Guard"),
      openingMessage: buildOpeningL3(
        "Notion",
        "Cache Stampede Guard",
        "protect workspace session caches from stampedes when popular templates are opened simultaneously",
        "When a popular shared template is opened by many users simultaneously, cache stampedes can overwhelm Redis.",
        "Cache Stampede Guard"
      ),
      celebrationMessage: buildCelebration(
        "Cache Stampede Guard",
        "In-Memory Cache",
        "Notion's Cache Stampede Guard protects workspace session caches from stampedes when a popular shared template is opened by many users simultaneously.",
        "Change Data Cache"
      ),
      messages: [
        msg("Cache Stampede Guard protects workspace session caches from stampedes."),
        msg("When a popular shared template is opened by many users simultaneously, the stampede guard prevents cache overwhelm."),
        msg('Press ⌘K, search for "Cache Stampede Guard", add it, then connect In-Memory Cache → Cache Stampede Guard.'),
      ],
      requiredNodes: ["cache_stampede_guard"],
      requiredEdges: [edge("in_memory_cache", "cache_stampede_guard")],
      successMessage: "Cache protection added. Now CDC cache.",
      errorMessage: "Add a Cache Stampede Guard connected from the In-Memory Cache.",
    }),
    step({
      id: 8,
      title: "Add Change Data Cache",
      explanation:
        "Notion's CDC pipeline precomputes workspace activity feeds and mention notifications. These are materialized in Redis for instant retrieval — @mention notifications must appear in under 1 second.",
      action: buildAction(
        "Change Data Cache",
        "CDC Connector",
        "Change Data Cache",
        "workspace activity feeds and @mention notifications being precomputed and materialized in Redis for instant retrieval"
      ),
      why: "@mention notifications must appear in under 1 second. Precomputing these in Redis enables instant retrieval without database queries.",
      component: component("change_data_cache", "Change Data Cache"),
      openingMessage: buildOpeningL3(
        "Notion",
        "Change Data Cache",
        "precompute workspace activity feeds and @mention notifications in Redis for instant retrieval in under 1 second",
        "@mention notifications must appear in under 1 second — precomputing in Redis enables instant retrieval.",
        "Change Data Cache"
      ),
      celebrationMessage: buildCelebration(
        "Change Data Cache",
        "CDC Connector",
        "Notion's CDC pipeline precomputes workspace activity feeds and mention notifications. These are materialized in Redis for instant retrieval — @mention notifications must appear in under 1 second.",
        "Data Warehouse"
      ),
      messages: [
        msg("Change Data Cache precomputes workspace activity feeds and @mention notifications in Redis."),
        msg("@mention notifications must appear in under 1 second — precomputing enables instant retrieval."),
        msg('Press ⌘K, search for "Change Data Cache", add it, then connect CDC Connector → Change Data Cache.'),
      ],
      requiredNodes: ["change_data_cache"],
      requiredEdges: [edge("cdc_connector", "change_data_cache")],
      successMessage: "CDC cache added. Now data warehouse.",
      errorMessage: "Add a Change Data Cache connected from the CDC Connector.",
    }),
    step({
      id: 9,
      title: "Add Data Warehouse",
      explanation:
        "Notion's Data Warehouse (ClickHouse) stores workspace analytics: feature usage, template engagement, and collaboration patterns. This data drives Notion's product decisions and growth strategies.",
      action: buildAction(
        "Data Warehouse",
        "CDC Connector",
        "Data Warehouse",
        "workspace analytics being stored including feature usage, template engagement, and collaboration patterns"
      ),
      why: "Workspace analytics drive Notion's product decisions and growth strategies. ClickHouse handles billions of events with fast OLAP queries.",
      component: component("data_warehouse", "Data Warehouse"),
      openingMessage: buildOpeningL3(
        "Notion",
        "Data Warehouse (ClickHouse)",
        "store workspace analytics: feature usage, template engagement, and collaboration patterns for product decisions",
        "This data drives Notion's product decisions and growth strategies — ClickHouse handles billions of events.",
        "Data Warehouse"
      ),
      celebrationMessage: buildCelebration(
        "Data Warehouse",
        "CDC Connector",
        "Notion's Data Warehouse (ClickHouse) stores workspace analytics: feature usage, template engagement, and collaboration patterns. This data drives Notion's product decisions and growth strategies.",
        "Event Store"
      ),
      messages: [
        msg("Data Warehouse stores workspace analytics: feature usage, template engagement, and collaboration patterns."),
        msg("This data drives Notion's product decisions and growth strategies."),
        msg('Press ⌘K, search for "Data Warehouse", add it, then connect CDC Connector → Data Warehouse.'),
      ],
      requiredNodes: ["data_warehouse"],
      requiredEdges: [edge("cdc_connector", "data_warehouse")],
      successMessage: "Data warehouse added. Now event sourcing.",
      errorMessage: "Add a Data Warehouse connected from the CDC Connector.",
    }),
    step({
      id: 10,
      title: "Add Event Store",
      explanation:
        "Notion's Event Store stores every block operation as an immutable event. Event sourcing enables infinite undo/redo, document version history, and offline sync reconciliation.",
      action: buildAction(
        "Event Store",
        "Sync Service",
        "Event Store",
        "every block operation being stored as an immutable event for infinite undo/redo, version history, and offline sync"
      ),
      why: "Event sourcing enables infinite undo/redo, document version history, and offline sync reconciliation. Every block operation is an immutable event.",
      component: component("event_store", "Event Store"),
      openingMessage: buildOpeningL3(
        "Notion",
        "Event Store",
        "store every block operation as an immutable event for infinite undo/redo, version history, and offline sync",
        "Event sourcing enables infinite undo/redo, document version history, and offline sync reconciliation.",
        "Event Store"
      ),
      celebrationMessage: buildCelebration(
        "Event Store",
        "Sync Service",
        "Notion's Event Store stores every block operation as an immutable event. Event sourcing enables infinite undo/redo, document version history, and offline sync reconciliation.",
        "GraphQL Federation"
      ),
      messages: [
        msg("Event Store stores every block operation as an immutable event."),
        msg("Event sourcing enables infinite undo/redo, document version history, and offline sync reconciliation."),
        msg('Press ⌘K, search for "Event Store", add it, then connect Sync Service → Event Store.'),
      ],
      requiredNodes: ["event_store"],
      requiredEdges: [edge("microservice", "event_store")],
      successMessage: "Event store added. Now GraphQL Federation.",
      errorMessage: "Add an Event Store connected from the Sync Service.",
    }),
    step({
      id: 11,
      title: "Add GraphQL Federation",
      explanation:
        "Notion's GraphQL Federation composes the API from blocks, databases, comments, and search domains. Each domain team owns their schema while the gateway provides a unified API.",
      action: buildAction(
        "GraphQL Federation Gateway",
        "API Gateway",
        "GraphQL Federation",
        "blocks, databases, comments, and search domains being composed into a unified API with each team owning their schema"
      ),
      why: "Each domain team owns their schema while the gateway provides a unified API. GraphQL Federation enables independent service evolution.",
      component: component("graphql_federation", "GraphQL Federation Gateway"),
      openingMessage: buildOpeningL3(
        "Notion",
        "GraphQL Federation",
        "compose blocks, databases, comments, and search domains into a unified API with domain team ownership",
        "Each domain team owns their schema while the gateway provides a unified API — enabling independent service evolution.",
        "GraphQL Federation Gateway"
      ),
      celebrationMessage: buildCelebration(
        "GraphQL Federation",
        "API Gateway",
        "Notion's GraphQL Federation composes the API from blocks, databases, comments, and search domains. Each domain team owns their schema while the gateway provides a unified API. You have built Notion Enterprise.",
        "nothing — you have built Notion Enterprise"
      ),
      messages: [
        msg("GraphQL Federation composes the API from blocks, databases, comments, and search domains."),
        msg("Each domain team owns their schema while the gateway provides a unified API."),
        msg('Press ⌘K, search for "GraphQL Federation Gateway", add it, then connect API Gateway → GraphQL Federation.'),
      ],
      requiredNodes: ["graphql_federation"],
      requiredEdges: [edge("api_gateway", "graphql_federation")],
      successMessage: "GraphQL Federation added. You have built Notion Enterprise.",
      errorMessage: "Add a GraphQL Federation Gateway connected from the API Gateway.",
    }),
  ],
});

export const notionTutorial: Tutorial = tutorial({
  id: 'notion-architecture',
  title: 'How to Design Notion Architecture',
  description:
    'Build a real-time collaborative workspace. Learn operational transforms, block-based data models, conflict resolution, and how 35 million users edit documents simultaneously.',
  difficulty: 'Advanced',
  category: 'Collaboration',
  isLive: false,
  icon: 'FileText',
  color: '#ffffff',
  tags: ['CRDT', 'Real-time', 'Collaboration', 'Sync', 'Blocks'],
  estimatedTime: '~87 mins',
  levels: [l1, l2, l3],
});
