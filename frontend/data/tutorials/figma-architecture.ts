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
  title: 'Collaborative Design Tool',
  subtitle: 'Build a collaborative design tool in 10 steps',
  description:
    'Build a collaborative design tool for 4 million teams. Learn CRDTs for conflict-free simultaneous editing, presence awareness, canvas rendering, and version history at scale.',
  estimatedTime: '~25 mins',
  unlocks: undefined,
  contextMessage:
    "Let's build Figma from scratch. 4 million design teams, simultaneous editing, and a CRDT implementation so good that two designers can move the same element at the same time without conflict. The browser was never supposed to be able to do this.",
  steps: [
    step({
      id: 1,
      title: 'Add the Web Client',
      explanation:
        "Figma runs entirely in the browser using WebAssembly. The client renders the design canvas, handles user input, and syncs changes with the server. It's one of the most complex browser applications ever built.",
      action: buildFirstStepAction('Web'),
      why: "Figma's web client is remarkable — it renders a full design canvas in the browser using WebGL for GPU-accelerated rendering. Most design tools required native apps; Figma proved the browser was powerful enough.",
      component: component('client_web', 'Web'),
      openingMessage: buildOpeningL1(
        'Figma',
        'Web Client',
        'run a full design canvas in the browser using WebAssembly and WebGL',
        "Figma's biggest technical achievement: solving the simultaneous edit problem. When two designers move the same element at the same time, neither edit is lost. They use CRDTs — Conflict-free Replicated Data Types.",
        'Web'
      ),
      celebrationMessage: buildCelebration(
        'Web Client',
        'nothing yet',
        "Figma runs entirely in the browser using WebAssembly and WebGL for GPU-accelerated rendering. This was thought impossible — native apps were the only way to handle complex vector graphics. Figma proved the browser was powerful enough.",
        'API Gateway'
      ),
      messages: [
        msg(
          "Welcome to the Figma Architecture tutorial. 4 million design teams, simultaneous editing, and a CRDT implementation so good that two designers can move the same element at the same time without conflict."
        ),
        msg(
          "Figma's biggest technical achievement: solving the simultaneous edit problem. When two designers move the same element at the same time, neither edit is lost. They use CRDTs — Conflict-free Replicated Data Types."
        ),
        msg('Press ⌘K and search for "Web" to add the client to the canvas.'),
      ],
      requiredNodes: ['client_web'],
      requiredEdges: [],
      successMessage: 'Web Client added. Now the API layer.',
      errorMessage: 'Add a Web Client node to the canvas first.',
    }),
    step({
      id: 2,
      title: 'Add the API Gateway',
      explanation:
        "Figma's API Gateway handles file loading, asset uploads, plugin API calls, and REST API requests. Real-time collaboration traffic goes through WebSockets, but file operations and asset management go through the gateway.",
      action: buildAction('API Gateway', 'Web', 'API Gateway', 'REST API requests for file operations, asset uploads, and plugin calls'),
      why: "Figma separates real-time collaboration (WebSocket) from file operations (REST). The API Gateway handles the REST side — loading files, saving versions, managing permissions, and serving the plugin API.",
      component: component('api_gateway', 'API Gateway'),
      openingMessage: buildOpeningL1(
        'Figma',
        'API Gateway',
        'handle REST API requests for file operations while WebSockets handle real-time collaboration',
        "The API Gateway handles the REST side: loading a file, saving a version, inviting a collaborator, or calling a plugin API. Real-time edit operations bypass the gateway and go directly to the collaboration server via WebSocket.",
        'API Gateway'
      ),
      celebrationMessage: buildCelebration(
        'API Gateway',
        'Web Client',
        "Figma has two communication channels: WebSockets for real-time edits, and REST API for file operations. The API Gateway handles the REST side — loading files, saving versions, managing permissions, and serving the plugin API.",
        'Load Balancer'
      ),
      messages: [
        msg(
          "Figma has two communication channels: WebSockets for real-time edits, and REST API for file operations."
        ),
        msg(
          "The API Gateway handles the REST side: loading a file, saving a version, inviting a collaborator, or calling a plugin API. Real-time edit operations bypass the gateway and go directly to the collaboration server via WebSocket."
        ),
        msg('Press ⌘K, search for "API Gateway", add it, then connect Web → API Gateway.'),
      ],
      requiredNodes: ['api_gateway'],
      requiredEdges: [edge('client_web', 'api_gateway')],
      successMessage: 'API Gateway added and connected. Now distribute the load.',
      errorMessage: 'Add an API Gateway and connect it from the Client.',
    }),
    step({
      id: 3,
      title: 'Add Load Balancer',
      explanation:
        "Figma's Load Balancer routes collaboration sessions to the correct server. All users editing the same file must be routed to the same collaboration server — this is sticky routing based on file ID.",
      action: buildAction('Load Balancer', 'API Gateway', 'Load Balancer', 'collaboration sessions being routed to the correct server using sticky routing by file ID'),
      why: "Sticky routing by file ID ensures all collaborators on the same file connect to the same server. This is essential for the CRDT engine — all edits must flow through a single point of coordination.",
      component: component('load_balancer', 'Load Balancer'),
      openingMessage: buildOpeningL1(
        'Figma',
        'Load Balancer',
        'route collaboration sessions using sticky routing so all collaborators on the same file hit the same server',
        "If Alice and Bob are both editing 'Homepage Design', they must connect to the same collaboration server. The load balancer hashes the file ID to determine which server handles that file. This ensures the CRDT engine sees all edits in one place.",
        'Load Balancer'
      ),
      celebrationMessage: buildCelebration(
        'Load Balancer',
        'API Gateway',
        "Figma's load balancer uses sticky routing — all users editing the same file go to the same server. If Alice and Bob edit the same file, they connect to the same collaboration server. This is essential for the CRDT engine to see all edits in one place.",
        'Auth Service'
      ),
      messages: [
        msg(
          "Figma's load balancer uses sticky routing — all users editing the same file go to the same server."
        ),
        msg(
          "If Alice and Bob are both editing 'Homepage Design', they must connect to the same collaboration server. The load balancer hashes the file ID to determine which server handles that file. This ensures the CRDT engine sees all edits in one place."
        ),
        msg('Press ⌘K, search for "Load Balancer", add it, then connect API Gateway → Load Balancer.'),
      ],
      requiredNodes: ['load_balancer'],
      requiredEdges: [edge('api_gateway', 'load_balancer')],
      successMessage: 'Load Balancer added and connected. Now authentication.',
      errorMessage: 'Add a Load Balancer and connect it from the API Gateway.',
    }),
    step({
      id: 4,
      title: 'Add Auth Service',
      explanation:
        "Figma's Auth Service handles user authentication and file permissions. It enforces access control — can this user view, edit, or comment on this file? Permissions are checked on every WebSocket connection and every API call.",
      action: buildAction('Auth Service', 'Load Balancer', 'Auth Service', 'user authentication and file permissions being enforced at the connection level'),
      why: "Figma files can be public, team-only, or private. The Auth Service enforces these permissions at the connection level — a viewer can't send edit operations even if they bypass the UI.",
      component: component('auth_service', 'Auth'),
      openingMessage: buildOpeningL1(
        'Figma',
        'Auth Service',
        'enforce file permissions at the connection level so viewers cannot send edit operations',
        "When you connect to a Figma file via WebSocket, the Auth Service checks your permission level. Viewers get a read-only connection. Editors get a read-write connection. Even if a viewer modifies the client code, the server rejects edit operations from viewer-level connections.",
        'Auth Service'
      ),
      celebrationMessage: buildCelebration(
        'Auth Service',
        'Load Balancer',
        "Figma's auth enforces permissions at the connection level — not just the UI. Viewers get a read-only connection; editors get a read-write connection. Even if a viewer modifies the client code, the server rejects edit operations from viewer-level connections.",
        'CRDT Engine'
      ),
      messages: [
        msg(
          "Figma's auth enforces permissions at the connection level — not just the UI."
        ),
        msg(
          "When you connect to a Figma file via WebSocket, the Auth Service checks your permission level. Viewers get a read-only connection. Editors get a read-write connection. Even if a viewer modifies the client code, the server rejects edit operations from viewer-level connections."
        ),
        msg('Press ⌘K, search for "Auth Service", add it, then connect Load Balancer → Auth Service.'),
      ],
      requiredNodes: ['auth_service'],
      requiredEdges: [edge('load_balancer', 'auth_service')],
      successMessage: 'Auth Service added and connected. Now the heart of Figma — the CRDT engine.',
      errorMessage: 'Add an Auth Service and connect it from the Load Balancer.',
    }),
    step({
      id: 5,
      title: 'Add CRDT Engine',
      explanation:
        "The CRDT Engine is Figma's core innovation. CRDTs (Conflict-free Replicated Data Types) allow multiple users to edit the same document simultaneously without conflicts. Every edit is represented as an operation that can be merged with any other operation in any order.",
      action: buildAction('CRDT Engine', 'Auth', 'CRDT Engine', 'concurrent edits being merged conflict-free so two users can edit the same element simultaneously'),
      why: "Without CRDTs, simultaneous edits require a lock — only one user can edit at a time. CRDTs eliminate locks entirely. Two users can move the same element simultaneously and both edits are preserved without either user waiting.",
      component: component('crdt_engine', 'CRDT'),
      openingMessage: buildOpeningL1(
        'Figma',
        'CRDT Engine',
        'merge concurrent edits conflict-free so two users can edit the same element simultaneously without locks',
        "When Alice moves a rectangle to (100, 200) and Bob simultaneously moves it to (300, 400), the CRDT engine merges both operations. The result is deterministic — both clients converge to the same final state. Figma uses a last-write-wins CRDT for position.",
        'CRDT Engine'
      ),
      celebrationMessage: buildCelebration(
        'CRDT Engine',
        'Auth Service',
        "CRDTs eliminate locks entirely. When Alice and Bob both move the same rectangle simultaneously, the CRDT engine merges both operations. The result is deterministic — both clients converge to the same final state. This is what makes Figma's simultaneous editing work.",
        'Presence Service'
      ),
      messages: [
        msg(
          "The CRDT Engine is what makes Figma's collaboration feel instant. No locks, no conflicts, no 'waiting for other user'."
        ),
        msg(
          "When Alice moves a rectangle to (100, 200) and Bob simultaneously moves it to (300, 400), the CRDT engine merges both operations. The result is deterministic — both clients converge to the same final state. Figma uses a last-write-wins CRDT for position, which means the later timestamp wins."
        ),
        msg('Press ⌘K, search for "CRDT Engine", add it, then connect Auth Service → CRDT Engine.'),
      ],
      requiredNodes: ['crdt_engine'],
      requiredEdges: [edge('auth_service', 'crdt_engine')],
      successMessage: 'CRDT Engine added and connected. Now presence awareness.',
      errorMessage: 'Add a CRDT Engine and connect it from the Auth Service.',
    }),
    step({
      id: 6,
      title: 'Add Presence Service',
      explanation:
        "The Presence Service tracks who is currently in a file, where their cursor is, and what they're selecting. This is what powers the colored cursors and 'Alice is viewing this frame' indicators in Figma.",
      action: buildAction('Presence Service', 'CRDT', 'Presence Service', 'live cursor positions and selection states being broadcast to all collaborators'),
      why: "Presence data is ephemeral and high-frequency — cursor positions update 60 times per second. It's stored in memory, not a database. The Presence Service broadcasts cursor positions to all collaborators in real-time.",
      component: component('presence_service', 'Presence'),
      openingMessage: buildOpeningL1(
        'Figma',
        'Presence Service',
        'track live cursor positions and selection states for all collaborators in real-time',
        "Cursor positions update up to 60 times per second. Storing this in a database would be catastrophic. The Presence Service keeps cursor state in memory and broadcasts updates via WebSocket. When a user disconnects, their cursor disappears within 1 second.",
        'Presence Service'
      ),
      celebrationMessage: buildCelebration(
        'Presence Service',
        'CRDT Engine',
        "The Presence Service powers the colored cursors — you can see exactly where your teammates are looking in real-time. Cursor positions update 60 times per second and are stored in memory, not a database. When a user disconnects, their cursor disappears within 1 second.",
        'Canvas Renderer'
      ),
      messages: [
        msg(
          "The Presence Service powers the colored cursors — you can see exactly where your teammates are looking in real-time."
        ),
        msg(
          "Cursor positions update up to 60 times per second. Storing this in a database would be catastrophic. The Presence Service keeps cursor state in memory and broadcasts updates via WebSocket. When a user disconnects, their cursor disappears within 1 second."
        ),
        msg('Press ⌘K, search for "Presence Service", add it, then connect CRDT Engine → Presence Service.'),
      ],
      requiredNodes: ['presence_service'],
      requiredEdges: [edge('crdt_engine', 'presence_service')],
      successMessage: 'Presence Service added and connected. Now the canvas renderer.',
      errorMessage: 'Add a Presence Service and connect it from the CRDT Engine.',
    }),
    step({
      id: 7,
      title: 'Add Canvas Renderer',
      explanation:
        "Figma's Canvas Renderer uses WebGL to render the design canvas at 60fps. It handles zoom, pan, layer rendering, and vector graphics. The renderer runs on the client but the server maintains the authoritative canvas state.",
      action: buildAction('Canvas Renderer', 'CRDT', 'Canvas Renderer', 'the design canvas being rendered at 60fps using WebGL for GPU acceleration'),
      why: "WebGL gives Figma GPU-accelerated rendering. A complex design with thousands of layers renders at 60fps because the GPU handles the compositing. CPU-based rendering would be too slow for large files.",
      component: component('canvas_renderer', 'Canvas'),
      openingMessage: buildOpeningL1(
        'Figma',
        'Canvas Renderer',
        'render the design canvas at 60fps using WebGL for GPU-accelerated compositing',
        "The renderer receives the document state from the CRDT engine and renders it using WebGL. When you zoom in, the renderer re-renders at higher resolution. When a collaborator moves an element, the CRDT engine updates the state and the renderer re-draws that element.",
        'Canvas Renderer'
      ),
      celebrationMessage: buildCelebration(
        'Canvas Renderer',
        'CRDT Engine',
        "Figma's Canvas Renderer uses WebGL for GPU-accelerated rendering — that's why it stays smooth even with thousands of layers. A complex design renders at 60fps because the GPU handles compositing. CPU-based rendering would be too slow for large files.",
        'Version History'
      ),
      messages: [
        msg(
          "Figma's Canvas Renderer uses WebGL for GPU-accelerated rendering — that's why it stays smooth even with thousands of layers."
        ),
        msg(
          "The renderer receives the document state from the CRDT engine and renders it using WebGL. When you zoom in, the renderer re-renders at higher resolution. When a collaborator moves an element, the CRDT engine updates the state and the renderer re-draws that element."
        ),
        msg('Press ⌘K, search for "Canvas Renderer", add it, then connect CRDT Engine → Canvas Renderer.'),
      ],
      requiredNodes: ['canvas_renderer'],
      requiredEdges: [edge('crdt_engine', 'canvas_renderer')],
      successMessage: 'Canvas Renderer added and connected. Now version history.',
      errorMessage: 'Add a Canvas Renderer and connect it from the CRDT Engine.',
    }),
    step({
      id: 8,
      title: 'Add Version History',
      explanation:
        "Figma's Version History stores snapshots of the document at regular intervals and whenever a user manually saves a version. You can revert to any previous version. Figma stores the full document state, not just diffs.",
      action: buildAction('Version History', 'CRDT', 'Version History', 'automatic snapshots of the document being stored every 30 minutes and on-demand'),
      why: "Storing full snapshots (not diffs) makes version restore instant — no need to replay operations. The tradeoff is storage cost, but Figma compresses snapshots aggressively.",
      component: component('version_history', 'Version'),
      openingMessage: buildOpeningL1(
        'Figma',
        'Version History',
        'store full document snapshots for instant version restore every 30 minutes and on-demand',
        "Every 30 minutes, Figma saves an automatic version. Users can also save named versions ('Before client review'). Each version is a compressed snapshot of the full document. Restoring is instant because there's no diff replay — just load the snapshot.",
        'Version History'
      ),
      celebrationMessage: buildCelebration(
        'Version History',
        'CRDT Engine',
        "Figma stores full document snapshots for version history — not diffs. Restoring a version is instant because there's no diff replay. Every 30 minutes, an automatic version is saved. Users can also save named versions like 'Before client review'.",
        'Object Storage'
      ),
      messages: [
        msg(
          "Figma stores full document snapshots for version history — not diffs. Restoring a version is instant."
        ),
        msg(
          "Every 30 minutes, Figma saves an automatic version. Users can also save named versions ('Before client review'). Each version is a compressed snapshot of the full document. Restoring is instant because there's no diff replay — just load the snapshot."
        ),
        msg('Press ⌘K, search for "Version History", add it, then connect CRDT Engine → Version History.'),
      ],
      requiredNodes: ['version_history'],
      requiredEdges: [edge('crdt_engine', 'version_history')],
      successMessage: 'Version History added and connected. Now the storage layer.',
      errorMessage: 'Add a Version History and connect it from the CRDT Engine.',
    }),
    step({
      id: 9,
      title: 'Add Object Storage',
      explanation:
        "Figma stores design files, version snapshots, exported assets, and uploaded images in Object Storage. A large Figma file can be hundreds of megabytes — object storage handles this at any scale.",
      action: buildAction('Object Storage', 'Version', 'Object Storage', 'design files and version snapshots being stored as binary blobs'),
      why: "Design files are binary blobs — not structured data. Object storage is the right tool: infinitely scalable, cheap per GB, and accessible via URL for direct client downloads.",
      component: component('object_storage', 'Object'),
      openingMessage: buildOpeningL1(
        'Figma',
        'Object Storage',
        'store design files and version snapshots as binary blobs with infinite scalability',
        "When you open a Figma file, the client downloads the binary file directly from Object Storage via a signed URL. The CRDT engine then applies any pending operations on top of the stored state. This is faster than serving files through the API server.",
        'Object Storage'
      ),
      celebrationMessage: buildCelebration(
        'Object Storage',
        'Version History',
        "Figma files are stored as binary blobs in Object Storage — not in a database. When you open a file, the client downloads it directly via a signed URL. The CRDT engine then applies pending operations on top of the stored state.",
        'In-Memory Cache'
      ),
      messages: [
        msg(
          "Figma files are stored as binary blobs in Object Storage — not in a database."
        ),
        msg(
          "When you open a Figma file, the client downloads the binary file directly from Object Storage via a signed URL. The CRDT engine then applies any pending operations on top of the stored state. This is faster than serving files through the API server."
        ),
        msg('Press ⌘K, search for "Object Storage", add it, then connect Version History → Object Storage.'),
      ],
      requiredNodes: ['object_storage'],
      requiredEdges: [edge('version_history', 'object_storage')],
      successMessage: 'Object Storage added and connected. Final step — the cache layer.',
      errorMessage: 'Add an Object Storage and connect it from the Version History.',
    }),
    step({
      id: 10,
      title: 'Add In-Memory Cache',
      explanation:
        "Figma caches active document state, user permissions, and team metadata in an in-memory cache. Active files are kept hot in memory so collaborators can join instantly without loading from Object Storage.",
      action: buildAction('In-Memory Cache', 'CRDT', 'In-Memory Cache', 'active document state being cached for instant collaborator joins'),
      why: "When 10 designers are actively editing a file, loading it from Object Storage on every connection would be slow. The cache keeps the active document state in memory so new collaborators join instantly.",
      component: component('in_memory_cache', 'Cache'),
      openingMessage: buildOpeningL1(
        'Figma',
        'In-Memory Cache',
        'cache active document state so collaborators can join instantly without loading from Object Storage',
        "The In-Memory Cache stores the current document state for active files. When you join a file, the server sends you the cached state plus any pending CRDT operations. When the last collaborator leaves, the state is flushed to Object Storage and evicted from cache.",
        'In-Memory Cache'
      ),
      celebrationMessage: buildCelebration(
        'In-Memory Cache',
        'CRDT Engine',
        "Active Figma files are kept in memory — when you join a file that others are editing, you get the live state instantly. When the last collaborator leaves, the state is flushed to Object Storage and evicted from cache. You have built Figma.",
        'nothing — you have built Figma'
      ),
      messages: [
        msg(
          "Active Figma files are kept in memory — when you join a file that others are editing, you get the live state instantly."
        ),
        msg(
          "The In-Memory Cache stores the current document state for active files. When you join a file, the server sends you the cached state plus any pending CRDT operations. When the last collaborator leaves, the state is flushed to Object Storage and evicted from cache."
        ),
        msg('Press ⌘K, search for "In-Memory Cache", add it, then connect CRDT Engine → In-Memory Cache.'),
      ],
      requiredNodes: ['in_memory_cache'],
      requiredEdges: [edge('crdt_engine', 'in_memory_cache')],
      successMessage: 'Tutorial complete! You have built Figma.',
      errorMessage: 'Add an In-Memory Cache and connect it from the CRDT Engine.',
    }),
  ],
});

const l2 = level({
  level: 2,
  title: "Figma at Scale",
  subtitle: "Stream real-time design events with CRDT sync monitoring",
  description:
    "Add Kafka event streaming, real-time presence caching, CDC pipelines, and SLO tracking to Figma's architecture. Handle millions of CRDT operations per second and monitor 60fps canvas rendering.",
  estimatedTime: "~28 mins",
  unlocks: undefined,
  contextMessage:
    "Let's scale Figma. 4 million design teams, millions of CRDT operations per second, and 60fps canvas rendering. This requires Kafka for event streaming, Redis for presence, and performance-grade observability.",
  steps: [
    step({
      id: 1,
      title: "Add Kafka Streaming",
      explanation:
        "Figma's Event Bus streams document events: element moves, comment additions, and cursor updates. Cursor updates alone stream millions of events per second during busy design sessions.",
      action: buildAction("Kafka / Streaming", "Auth", "Kafka Streaming", "element moves, comment additions, and cursor updates being streamed for real-time collaboration"),
      why: "Without Kafka, computing analytics and sending notifications would require synchronous calls — slowing down the collaboration path. Kafka decouples event producers from consumers.",
      component: component("kafka_streaming", "Kafka / Streaming", "Kafka / Streaming"),
      openingMessage: buildOpeningL2(
        "Figma",
        "Kafka Streaming",
        "stream document events: element moves, comment additions, and cursor updates at millions of events per second",
        "Figma's Event Bus streams document events: element moves, comment additions, and cursor updates. Cursor updates alone stream millions of events per second during busy design sessions.",
        "Kafka / Streaming"
      ),
      celebrationMessage: buildCelebration(
        "Kafka Streaming",
        "Auth Service",
        "Figma's Event Bus streams document events: element moves, comment additions, and cursor updates. Cursor updates alone stream millions of events per second during busy design sessions.",
        "Notification Worker"
      ),
      messages: [
        msg("Level 2: Figma at Scale. Millions of CRDT operations per second, real-time presence caching, and performance-grade observability."),
        msg("Figma's Event Bus streams document events: element moves, comment additions, and cursor updates. Cursor updates alone stream millions of events per second during busy design sessions."),
        msg("Press ⌘K, search for 'Kafka / Streaming', add it, then connect Auth Service → Kafka Streaming.")
      ],
      requiredNodes: ["kafka_streaming"],
      requiredEdges: [edge("auth_service", "kafka_streaming")],
      successMessage: "Kafka Streaming added. Now notifications.",
      errorMessage: "Add Kafka Streaming connected from the Auth Service.",
    }),
    step({
      id: 2,
      title: "Add Notification Worker",
      explanation:
        "Figma's Notification Worker sends in-app and email notifications for comments, mentions, and file sharing. Notifications must be delivered in seconds — designers collaborate in real-time.",
      action: buildAction("Worker", "Kafka", "Notification Worker", "in-app and email notifications being sent for comments, mentions, and file sharing"),
      why: "Synchronous notification delivery would slow down the collaboration path. Kafka consumers handle notifications asynchronously — comments and mentions are delivered in seconds.",
      component: component("worker_job", "Worker"),
      openingMessage: buildOpeningL2(
        "Figma",
        "Notification Worker",
        "send in-app and email notifications for comments, mentions, and file sharing in seconds",
        "Figma's Notification Worker sends in-app and email notifications for comments, mentions, and file sharing. Notifications must be delivered in seconds — designers collaborate in real-time.",
        "Worker"
      ),
      celebrationMessage: buildCelebration(
        "Notification Worker",
        "Kafka Streaming",
        "Figma's Notification Worker sends in-app and email notifications for comments, mentions, and file sharing. Notifications must be delivered in seconds — designers collaborate in real-time.",
        "In-Memory Cache"
      ),
      messages: [
        msg("Figma's Notification Worker sends in-app and email notifications for comments, mentions, and file sharing."),
        msg("Notifications must be delivered in seconds — designers collaborate in real-time and expect immediate feedback on comments and mentions."),
        msg("Press ⌘K, search for 'Worker / Background Job', add it, then connect Kafka Streaming → Notification Worker.")
      ],
      requiredNodes: ["worker_job"],
      requiredEdges: [edge("kafka_streaming", "worker_job")],
      successMessage: "Notification Worker added. Now caching.",
      errorMessage: "Add a Worker connected from Kafka Streaming.",
    }),
    step({
      id: 3,
      title: "Add In-Memory Cache",
      explanation:
        "Figma's Redis Cache stores active document sessions and presence state. When 30 designers edit the same file, their presence and cursors are cached in Redis for sub-10ms retrieval.",
      action: buildAction("In-Memory Cache", "CRDT", "In-Memory Cache", "active document sessions and presence state being cached for sub-10ms retrieval"),
      why: "Presence data is ephemeral and high-frequency — cursor positions update 60 times per second. Redis caches this data for sub-10ms retrieval, reducing load on the CRDT engine.",
      component: component("in_memory_cache", "In-Memory Cache"),
      openingMessage: buildOpeningL2(
        "Figma",
        "Redis Cache",
        "store active document sessions and presence state for sub-10ms retrieval when multiple designers edit simultaneously",
        "Figma's Redis Cache stores active document sessions and presence state. When 30 designers edit the same file, their presence and cursors are cached in Redis for sub-10ms retrieval.",
        "In-Memory Cache"
      ),
      celebrationMessage: buildCelebration(
        "In-Memory Cache",
        "CRDT Engine",
        "Figma's Redis Cache stores active document sessions and presence state. When 30 designers edit the same file, their presence and cursors are cached in Redis for sub-10ms retrieval.",
        "CDC Connector"
      ),
      messages: [
        msg("Figma's Redis Cache stores active document sessions and presence state."),
        msg("When 30 designers edit the same file, their presence and cursors are cached in Redis for sub-10ms retrieval."),
        msg("Press ⌘K, search for 'In-Memory Cache', add it, then connect CRDT Engine → In-Memory Cache.")
      ],
      requiredNodes: ["in_memory_cache"],
      requiredEdges: [edge("crdt_engine", "in_memory_cache")],
      successMessage: "In-Memory Cache added. Now CDC pipeline.",
      errorMessage: "Add an In-Memory Cache connected from the CRDT Engine.",
    }),
    step({
      id: 4,
      title: "Add CDC Connector",
      explanation:
        "Figma's CDC Connector mirrors document changes to the analytics platform. Design engagement metrics, collaboration frequency, and feature usage stream to ClickHouse.",
      action: buildAction("CDC Connector", "CRDT", "CDC Connector", "document changes being mirrored to ClickHouse for design engagement analytics"),
      why: "CDC enables real-time analytics without impacting the CRDT engine. Design engagement metrics, collaboration frequency, and feature usage stream to ClickHouse without synchronous database queries.",
      component: component("cdc_connector", "CDC Connector"),
      openingMessage: buildOpeningL2(
        "Figma",
        "CDC Connector",
        "mirror document changes to ClickHouse for design engagement metrics and collaboration analytics",
        "Figma's CDC Connector mirrors document changes to the analytics platform. Design engagement metrics, collaboration frequency, and feature usage stream to ClickHouse.",
        "CDC Connector"
      ),
      celebrationMessage: buildCelebration(
        "CDC Connector",
        "CRDT Engine",
        "Figma's CDC Connector mirrors document changes to the analytics platform. Design engagement metrics, collaboration frequency, and feature usage stream to ClickHouse.",
        "SQL Database"
      ),
      messages: [
        msg("Figma's CDC Connector mirrors document changes to the analytics platform."),
        msg("Design engagement metrics, collaboration frequency, and feature usage stream to ClickHouse for product analytics."),
        msg("Press ⌘K, search for 'CDC Connector', add it, then connect CRDT Engine → CDC Connector.")
      ],
      requiredNodes: ["cdc_connector"],
      requiredEdges: [edge("crdt_engine", "cdc_connector")],
      successMessage: "CDC Connector added. Now SQL database.",
      errorMessage: "Add a CDC Connector connected from the CRDT Engine.",
    }),
    step({
      id: 5,
      title: "Add SQL Database",
      explanation:
        "Figma's MySQL stores user accounts, organization settings, and billing. Document content (the actual design files) is stored in custom document storage — not in MySQL.",
      action: buildAction("SQL Database", "Auth", "SQL Database", "user accounts, organization settings, and billing being stored with ACID guarantees"),
      why: "User accounts and billing require ACID transactions — eventual consistency is unacceptable for financial data. Document content uses custom storage optimized for binary design files.",
      component: component("sql_db", "SQL Database"),
      openingMessage: buildOpeningL2(
        "Figma",
        "SQL Database",
        "store user accounts, organization settings, and billing with ACID guarantees",
        "Figma's MySQL stores user accounts, organization settings, and billing. Document content (the actual design files) is stored in custom document storage — not in MySQL.",
        "SQL Database"
      ),
      celebrationMessage: buildCelebration(
        "SQL Database",
        "Auth Service",
        "Figma's MySQL stores user accounts, organization settings, and billing. Document content (the actual design files) is stored in custom document storage — not in MySQL.",
        "Structured Logger"
      ),
      messages: [
        msg("Figma's MySQL stores user accounts, organization settings, and billing."),
        msg("Document content (the actual design files) is stored in custom document storage — not in MySQL."),
        msg("Press ⌘K, search for 'SQL Database', add it, then connect Auth Service → SQL Database.")
      ],
      requiredNodes: ["sql_db"],
      requiredEdges: [edge("auth_service", "sql_db")],
      successMessage: "SQL Database added. Now structured logging.",
      errorMessage: "Add a SQL Database connected from the Auth Service.",
    }),
    step({
      id: 6,
      title: "Add Structured Logger",
      explanation:
        "Figma's Structured Logger captures render events, CRDT operations, and plugin executions. Performance logs track render latency — Figma's target is 60fps canvas rendering.",
      action: buildAction("Structured Logger", "CRDT", "Structured Logger", "render events, CRDT operations, and plugin executions being captured for performance analysis"),
      why: "Text logs require regex parsing — structured JSON enables fast LogQL aggregation across billions of entries. Performance logs track render latency — Figma's target is 60fps canvas rendering.",
      component: component("structured_logger", "Structured Logger"),
      openingMessage: buildOpeningL2(
        "Figma",
        "Structured Logger",
        "capture render events, CRDT operations, and plugin executions with 60fps render latency tracking",
        "Figma's Structured Logger captures render events, CRDT operations, and plugin executions. Performance logs track render latency — Figma's target is 60fps canvas rendering.",
        "Structured Logger"
      ),
      celebrationMessage: buildCelebration(
        "Structured Logger",
        "CRDT Engine",
        "Figma's Structured Logger captures render events, CRDT operations, and plugin executions. Performance logs track render latency — Figma's target is 60fps canvas rendering.",
        "SLO Tracker"
      ),
      messages: [
        msg("Figma's Structured Logger captures render events, CRDT operations, and plugin executions."),
        msg("Performance logs track render latency — Figma's target is 60fps canvas rendering."),
        msg("Press ⌘K, search for 'Structured Logger', add it, then connect CRDT Engine → Structured Logger.")
      ],
      requiredNodes: ["structured_logger"],
      requiredEdges: [edge("crdt_engine", "structured_logger")],
      successMessage: "Structured Logger added. Now SLO tracking.",
      errorMessage: "Add a Structured Logger connected from the CRDT Engine.",
    }),
    step({
      id: 7,
      title: "Add SLO Tracker",
      explanation:
        "Figma's SLO Tracker monitors canvas render latency, collaboration sync time, and file load time. Canvas rendering must stay under 16ms (60fps) — tracked as a critical SLO.",
      action: buildAction("SLO/SLI Tracker", "Canvas Renderer", "SLO Tracker", "canvas render latency and collaboration sync time being tracked against 60fps SLO"),
      why: "Without SLOs, engineering teams argue about what 'good' means. With SLOs, there's a clear contractual target — canvas rendering must stay under 16ms (60fps) for all users.",
      component: component("slo_tracker", "SLO/SLI Tracker"),
      openingMessage: buildOpeningL2(
        "Figma",
        "SLO Tracker",
        "monitor canvas render latency and collaboration sync time against 60fps SLO targets",
        "Figma's SLO Tracker monitors canvas render latency, collaboration sync time, and file load time. Canvas rendering must stay under 16ms (60fps) — tracked as a critical SLO.",
        "SLO/SLI Tracker"
      ),
      celebrationMessage: buildCelebration(
        "SLO Tracker",
        "Canvas Renderer",
        "Figma's SLO Tracker monitors canvas render latency, collaboration sync time, and file load time. Canvas rendering must stay under 16ms (60fps) — tracked as a critical SLO.",
        "Error Budget Alert"
      ),
      messages: [
        msg("Figma's SLO Tracker monitors canvas render latency, collaboration sync time, and file load time."),
        msg("Canvas rendering must stay under 16ms (60fps) — tracked as a critical SLO."),
        msg("Press ⌘K, search for 'SLO/SLI Tracker', add it, then connect Canvas Renderer → SLO Tracker.")
      ],
      requiredNodes: ["slo_tracker"],
      requiredEdges: [edge("canvas_renderer", "slo_tracker")],
      successMessage: "SLO Tracker added. Now error budget monitoring.",
      errorMessage: "Add an SLO/SLI Tracker connected from the Canvas Renderer.",
    }),
    step({
      id: 8,
      title: "Add Error Budget Monitor",
      explanation:
        "Figma's Error Budget Monitor tracks collaboration sync SLO. When sync latency degrades during a team review, engineers are paged before the error budget is consumed.",
      action: buildAction("Error Budget Monitor", "SLO", "Error Budget Monitor", "collaboration sync SLO being tracked with proactive paging when error budget burns"),
      why: "The error budget is the 'spare' reliability — when depleted, feature launches pause until reliability improves. This prevents 60fps canvas rendering from being sacrificed for velocity.",
      component: component("error_budget_alert", "Error Budget Monitor"),
      openingMessage: buildOpeningL2(
        "Figma",
        "Error Budget Monitor",
        "track collaboration sync SLO and page engineers before error budget is consumed",
        "Figma's Error Budget Monitor tracks collaboration sync SLO. When sync latency degrades during a team review, engineers are paged before the error budget is consumed.",
        "Error Budget Monitor"
      ),
      celebrationMessage: buildCelebration(
        "Error Budget Alert",
        "SLO Tracker",
        "Figma's Error Budget Monitor tracks collaboration sync SLO. When sync latency degrades during a team review, engineers are paged before the error budget is consumed. Figma is now scaled for millions of CRDT operations.",
        "Level 3"
      ),
      messages: [
        msg("Figma's Error Budget Monitor tracks collaboration sync SLO."),
        msg("When sync latency degrades during a team review, engineers are paged before the error budget is consumed."),
        msg("Press ⌘K, search for 'Error Budget Monitor', add it, then connect SLO Tracker → Error Budget Monitor.")
      ],
      requiredNodes: ["error_budget_alert"],
      requiredEdges: [edge("slo_tracker", "error_budget_alert")],
      successMessage: "Error Budget Monitor added. Figma is now scaled for millions of CRDT operations.",
      errorMessage: "Add an Error Budget Monitor connected from the SLO Tracker.",
    }),
  ],
});

const l3 = level({
  level: 3,
  title: "Figma Enterprise",
  subtitle: "Add zero-trust plugin isolation, CRDT tracing, and event sourcing",
  description:
    "Implement zero-trust plugin isolation with SPIFFE certificates, distributed tracing for CRDT sync operations, and event sourcing for perfect versioning. Figma Enterprise serves design teams with compliance and security requirements.",
  estimatedTime: "~29 mins",
  unlocks: undefined,
  contextMessage:
    "Let's make Figma enterprise-grade. Zero-trust plugin isolation, CRDT distributed tracing, and event sourcing for perfect versioning. Figma Enterprise serves Fortune 500 companies with security requirements that drive every architectural decision.",
  steps: [
    step({
      id: 1,
      title: "Add Service Mesh",
      explanation:
        "Figma's Service Mesh (Envoy) handles mTLS between document servers, rendering workers, and plugin hosts. Plugin isolation is critical — third-party plugins must not compromise document security.",
      action: buildAction("Service Mesh", "Load Balancer", "Service Mesh", "mTLS being enforced between document servers, rendering workers, and plugin hosts"),
      why: "Without a service mesh, each service implements TLS, circuit breaking, and retries differently — inconsistent and hard to maintain. Envoy handles this transparently at the infrastructure layer.",
      component: component("service_mesh", "Service Mesh"),
      openingMessage: buildOpeningL3(
        "Figma",
        "Service Mesh",
        "enforce mTLS between document servers, rendering workers, and plugin hosts with zero-trust security",
        "Figma's Service Mesh (Envoy) handles mTLS between document servers, rendering workers, and plugin hosts. Plugin isolation is critical — third-party plugins must not compromise document security.",
        "Service Mesh"
      ),
      celebrationMessage: buildCelebration(
        "Service Mesh",
        "Load Balancer",
        "Figma's Service Mesh (Envoy) handles mTLS between document servers, rendering workers, and plugin hosts. Plugin isolation is critical — third-party plugins must not compromise document security.",
        "GraphQL Federation"
      ),
      messages: [
        msg("Level 3: Figma Enterprise. Zero-trust plugin isolation, CRDT distributed tracing, and event sourcing for perfect versioning."),
        msg("Figma's Service Mesh (Envoy) handles mTLS between document servers, rendering workers, and plugin hosts. Plugin isolation is critical — third-party plugins must not compromise document security."),
        msg("Press ⌘K, search for 'Service Mesh', add it, then connect Load Balancer → Service Mesh.")
      ],
      requiredNodes: ["service_mesh"],
      requiredEdges: [edge("load_balancer", "service_mesh")],
      successMessage: "Service Mesh added. Now GraphQL Federation.",
      errorMessage: "Add a Service Mesh connected from the Load Balancer.",
    }),
    step({
      id: 2,
      title: "Add GraphQL Federation",
      explanation:
        "Figma's GraphQL Federation composes the API from document, comments, design systems, and teams domains. Each domain owns its schema while the gateway provides a unified API.",
      action: buildAction("GraphQL Federation Gateway", "API Gateway", "GraphQL Federation Gateway", "document, comments, design systems, and teams schemas being composed into a unified API"),
      why: "Without Federation, clients make multiple round trips to different REST endpoints. GraphQL Federation lets clients fetch all needed data in a single query — reducing mobile API calls by 60%.",
      component: component("graphql_federation", "GraphQL Federation Gateway"),
      openingMessage: buildOpeningL3(
        "Figma",
        "GraphQL Federation",
        "compose document, comments, design systems, and teams schemas into a unified API with domain ownership",
        "Figma's GraphQL Federation composes the API from document, comments, design systems, and teams domains. Each domain owns its schema while the gateway provides a unified API.",
        "GraphQL Federation Gateway"
      ),
      celebrationMessage: buildCelebration(
        "GraphQL Federation Gateway",
        "API Gateway",
        "Figma's GraphQL Federation composes the API from document, comments, design systems, and teams domains. Each domain owns its schema while the gateway provides a unified API.",
        "Token Bucket Rate Limiter"
      ),
      messages: [
        msg("Figma's GraphQL Federation composes the API from document, comments, design systems, and teams domains."),
        msg("Each domain owns its schema while the gateway provides a unified API for clients."),
        msg("Press ⌘K, search for 'GraphQL Federation Gateway', add it, then connect API Gateway → GraphQL Federation Gateway.")
      ],
      requiredNodes: ["graphql_federation"],
      requiredEdges: [edge("api_gateway", "graphql_federation")],
      successMessage: "GraphQL Federation added. Now rate limiting.",
      errorMessage: "Add a GraphQL Federation Gateway connected from the API Gateway.",
    }),
    step({
      id: 3,
      title: "Add Token Bucket Rate Limiter",
      explanation:
        "Figma's Rate Limiter uses token buckets per plan: Free (1M ops/month), Professional (10M), Organization (100M). Token buckets prevent resource exhaustion from runaway plugins.",
      action: buildAction("Token Bucket Rate Limiter", "API Gateway", "Token Bucket Rate Limiter", "token buckets per plan preventing resource exhaustion from runaway plugins"),
      why: "Fixed rate limiting cannot handle legitimate bursts. Token buckets allow burst capacity while maintaining average limits — preventing resource exhaustion from runaway plugins.",
      component: component("token_bucket_limiter", "Token Bucket Rate Limiter"),
      openingMessage: buildOpeningL3(
        "Figma",
        "Token Bucket Rate Limiter",
        "enforce token buckets per plan: Free (1M ops/month), Professional (10M), Organization (100M)",
        "Figma's Rate Limiter uses token buckets per plan: Free (1M ops/month), Professional (10M), Organization (100M). Token buckets prevent resource exhaustion from runaway plugins.",
        "Token Bucket Rate Limiter"
      ),
      celebrationMessage: buildCelebration(
        "Token Bucket Rate Limiter",
        "API Gateway",
        "Figma's Rate Limiter uses token buckets per plan: Free (1M ops/month), Professional (10M), Organization (100M). Token buckets prevent resource exhaustion from runaway plugins.",
        "OpenTelemetry Collector"
      ),
      messages: [
        msg("Figma's Rate Limiter uses token buckets per plan: Free (1M ops/month), Professional (10M), Organization (100M)."),
        msg("Token buckets prevent resource exhaustion from runaway plugins."),
        msg("Press ⌘K, search for 'Token Bucket Rate Limiter', add it, then connect API Gateway → Token Bucket Rate Limiter.")
      ],
      requiredNodes: ["token_bucket_limiter"],
      requiredEdges: [edge("api_gateway", "token_bucket_limiter")],
      successMessage: "Token Bucket Rate Limiter added. Now distributed tracing.",
      errorMessage: "Add a Token Bucket Rate Limiter connected from the API Gateway.",
    }),
    step({
      id: 4,
      title: "Add OpenTelemetry Collector",
      explanation:
        "Figma's OTel Collector traces CRDT sync operations across document servers. A single element move can trigger sync operations across dozens of servers — tracing is essential for debugging desync.",
      action: buildAction("OpenTelemetry Collector", "CRDT", "OpenTelemetry Collector", "CRDT sync operations being traced across document servers for desync debugging"),
      why: "Without OTel, each service uses different tracing libraries. The OTel Collector normalizes everything — one instrumentation, multiple backends for tracing, metrics, and logs.",
      component: component("otel_collector", "OpenTelemetry Collector"),
      openingMessage: buildOpeningL3(
        "Figma",
        "OpenTelemetry Collector",
        "trace CRDT sync operations across document servers — essential for debugging desync issues",
        "Figma's OTel Collector traces CRDT sync operations across document servers. A single element move can trigger sync operations across dozens of servers — tracing is essential for debugging desync.",
        "OpenTelemetry Collector"
      ),
      celebrationMessage: buildCelebration(
        "OpenTelemetry Collector",
        "CRDT Engine",
        "Figma's OTel Collector traces CRDT sync operations across document servers. A single element move can trigger sync operations across dozens of servers — tracing is essential for debugging desync.",
        "Correlation ID Handler"
      ),
      messages: [
        msg("Figma's OTel Collector traces CRDT sync operations across document servers."),
        msg("A single element move can trigger sync operations across dozens of servers — tracing is essential for debugging desync."),
        msg("Press ⌘K, search for 'OpenTelemetry Collector', add it, then connect CRDT Engine → OpenTelemetry Collector.")
      ],
      requiredNodes: ["otel_collector"],
      requiredEdges: [edge("crdt_engine", "otel_collector")],
      successMessage: "OpenTelemetry Collector added. Now correlation IDs.",
      errorMessage: "Add an OpenTelemetry Collector connected from the CRDT Engine.",
    }),
    step({
      id: 5,
      title: "Add Correlation ID Handler",
      explanation:
        "Figma's Correlation ID links a design action (moving an element) to every service: CRDT engine, presence service, plugin host, and CDN upload. Debugging a lost edit requires tracing across all components.",
      action: buildAction("Correlation ID Handler", "CRDT", "Correlation ID Handler", "design actions being traced across CRDT engine, presence service, plugin host, and CDN upload"),
      why: "Without correlation IDs, debugging a lost edit requires checking logs from CRDT engine, presence service, plugin host, and CDN upload separately. Correlation IDs link all logs under one trace.",
      component: component("correlation_id_handler", "Correlation ID Handler"),
      openingMessage: buildOpeningL3(
        "Figma",
        "Correlation ID Handler",
        "link design actions to every service for end-to-end tracing of lost edits",
        "Figma's Correlation ID links a design action (moving an element) to every service: CRDT engine, presence service, plugin host, and CDN upload. Debugging a lost edit requires tracing across all components.",
        "Correlation ID Handler"
      ),
      celebrationMessage: buildCelebration(
        "Correlation ID Handler",
        "CRDT Engine",
        "Figma's Correlation ID links a design action (moving an element) to every service: CRDT engine, presence service, plugin host, and CDN upload. Debugging a lost edit requires tracing across all components.",
        "mTLS Certificate Authority"
      ),
      messages: [
        msg("Figma's Correlation ID links a design action to every service involved."),
        msg("Debugging a lost edit requires tracing across CRDT engine, presence service, plugin host, and CDN upload."),
        msg("Press ⌘K, search for 'Correlation ID Handler', add it, then connect CRDT Engine → Correlation ID Handler.")
      ],
      requiredNodes: ["correlation_id_handler"],
      requiredEdges: [edge("crdt_engine", "correlation_id_handler")],
      successMessage: "Correlation ID Handler added. Now mTLS CA.",
      errorMessage: "Add a Correlation ID Handler connected from the CRDT Engine.",
    }),
    step({
      id: 6,
      title: "Add mTLS Certificate Authority",
      explanation:
        "Figma's SPIFFE CA issues certificates to every rendering worker and plugin host. Plugin isolation requires cryptographic guarantees — plugins run in sandboxed environments with limited certificates.",
      action: buildAction("mTLS Certificate Authority", "Service Mesh", "mTLS Certificate Authority", "SPIFFE certificates being issued to rendering workers and plugin hosts for zero-trust plugin isolation"),
      why: "Plugin isolation requires cryptographic guarantees — SPIFFE certificates ensure plugins run in sandboxed environments with limited, auditable access to Figma's services.",
      component: component("mtls_certificate_authority", "mTLS Certificate Authority"),
      openingMessage: buildOpeningL3(
        "Figma",
        "SPIFFE CA",
        "issue certificates to every rendering worker and plugin host for cryptographic plugin isolation",
        "Figma's SPIFFE CA issues certificates to every rendering worker and plugin host. Plugin isolation requires cryptographic guarantees — plugins run in sandboxed environments with limited certificates.",
        "mTLS Certificate Authority"
      ),
      celebrationMessage: buildCelebration(
        "mTLS Certificate Authority",
        "Service Mesh",
        "Figma's SPIFFE CA issues certificates to every rendering worker and plugin host. Plugin isolation requires cryptographic guarantees — plugins run in sandboxed environments with limited certificates.",
        "Cache Stampede Guard"
      ),
      messages: [
        msg("Figma's SPIFFE CA issues certificates to every rendering worker and plugin host."),
        msg("Plugin isolation requires cryptographic guarantees — plugins run in sandboxed environments with limited certificates."),
        msg("Press ⌘K, search for 'mTLS Certificate Authority', add it, then connect Service Mesh → mTLS Certificate Authority.")
      ],
      requiredNodes: ["mtls_certificate_authority"],
      requiredEdges: [edge("service_mesh", "mtls_certificate_authority")],
      successMessage: "mTLS Certificate Authority added. Now cache protection.",
      errorMessage: "Add an mTLS Certificate Authority connected from the Service Mesh.",
    }),
    step({
      id: 7,
      title: "Add Cache Stampede Guard",
      explanation:
        "Figma's Cache Stampede Guard protects document session caches from stampedes when a popular shared file is opened by many users simultaneously.",
      action: buildAction("Cache Stampede Guard", "In-Memory Cache", "Cache Stampede Guard", "document session caches being protected from stampedes during simultaneous popular file access"),
      why: "When a popular shared file opens simultaneously by many users, without stampede protection, thousands of requests rebuild the cache simultaneously — causing cache server overload.",
      component: component("cache_stampede_guard", "Cache Stampede Guard"),
      openingMessage: buildOpeningL3(
        "Figma",
        "Cache Stampede Guard",
        "protect document session caches from stampedes when a popular shared file is opened by many users simultaneously",
        "Figma's Cache Stampede Guard protects document session caches from stampedes when a popular shared file is opened by many users simultaneously.",
        "Cache Stampede Guard"
      ),
      celebrationMessage: buildCelebration(
        "Cache Stampede Guard",
        "In-Memory Cache",
        "Figma's Cache Stampede Guard protects document session caches from stampedes when a popular shared file is opened by many users simultaneously.",
        "Change Data Cache"
      ),
      messages: [
        msg("Figma's Cache Stampede Guard protects document session caches from stampedes."),
        msg("When a popular shared file is opened by many users simultaneously, stampede protection prevents cache server overload."),
        msg("Press ⌘K, search for 'Cache Stampede Guard', add it, then connect In-Memory Cache → Cache Stampede Guard.")
      ],
      requiredNodes: ["cache_stampede_guard"],
      requiredEdges: [edge("in_memory_cache", "cache_stampede_guard")],
      successMessage: "Cache Stampede Guard added. Now CDC cache.",
      errorMessage: "Add a Cache Stampede Guard connected from the In-Memory Cache.",
    }),
    step({
      id: 8,
      title: "Add Change Data Cache",
      explanation:
        "Figma's CDC pipeline precomputes comment threads and version history previews. These are materialized in Redis for instant retrieval when navigating document history.",
      action: buildAction("Change Data Cache", "CDC Connector", "Change Data Cache", "comment threads and version history previews being precomputed and materialized in Redis"),
      why: "Precomputing comment threads and version history previews eliminates slow queries during document history navigation. These are materialized in Redis for instant retrieval.",
      component: component("change_data_cache", "Change Data Cache"),
      openingMessage: buildOpeningL3(
        "Figma",
        "Change Data Cache",
        "precompute comment threads and version history previews in Redis for instant document history navigation",
        "Figma's CDC pipeline precomputes comment threads and version history previews. These are materialized in Redis for instant retrieval when navigating document history.",
        "Change Data Cache"
      ),
      celebrationMessage: buildCelebration(
        "Change Data Cache",
        "CDC Connector",
        "Figma's CDC pipeline precomputes comment threads and version history previews. These are materialized in Redis for instant retrieval when navigating document history.",
        "Data Warehouse"
      ),
      messages: [
        msg("Figma's CDC pipeline precomputes comment threads and version history previews."),
        msg("These are materialized in Redis for instant retrieval when navigating document history."),
        msg("Press ⌘K, search for 'Change Data Cache', add it, then connect CDC Connector → Change Data Cache.")
      ],
      requiredNodes: ["change_data_cache"],
      requiredEdges: [edge("cdc_connector", "change_data_cache")],
      successMessage: "Change Data Cache added. Now data warehouse.",
      errorMessage: "Add a Change Data Cache connected from the CDC Connector.",
    }),
    step({
      id: 9,
      title: "Add Data Warehouse",
      explanation:
        "Figma's Data Warehouse (ClickHouse) stores design analytics: feature usage, collaboration patterns, and performance metrics. This data drives Figma's product roadmap and performance optimizations.",
      action: buildAction("Data Warehouse", "CDC Connector", "Data Warehouse", "design analytics being stored in ClickHouse for feature usage, collaboration patterns, and performance metrics"),
      why: "Design analytics data (feature usage, collaboration patterns, performance metrics) drives Figma's product roadmap. This data cannot be stored in operational databases — it requires a data warehouse.",
      component: component("data_warehouse", "Data Warehouse"),
      openingMessage: buildOpeningL3(
        "Figma",
        "Data Warehouse",
        "store design analytics in ClickHouse for feature usage, collaboration patterns, and performance metrics",
        "Figma's Data Warehouse (ClickHouse) stores design analytics: feature usage, collaboration patterns, and performance metrics. This data drives Figma's product roadmap and performance optimizations.",
        "Data Warehouse"
      ),
      celebrationMessage: buildCelebration(
        "Data Warehouse",
        "CDC Connector",
        "Figma's Data Warehouse (ClickHouse) stores design analytics: feature usage, collaboration patterns, and performance metrics. This data drives Figma's product roadmap and performance optimizations.",
        "Event Store"
      ),
      messages: [
        msg("Figma's Data Warehouse (ClickHouse) stores design analytics: feature usage, collaboration patterns, and performance metrics."),
        msg("This data drives Figma's product roadmap and performance optimizations."),
        msg("Press ⌘K, search for 'Data Warehouse', add it, then connect CDC Connector → Data Warehouse.")
      ],
      requiredNodes: ["data_warehouse"],
      requiredEdges: [edge("cdc_connector", "data_warehouse")],
      successMessage: "Data Warehouse added. Now event sourcing.",
      errorMessage: "Add a Data Warehouse connected from the CDC Connector.",
    }),
    step({
      id: 10,
      title: "Add Event Store",
      explanation:
        "Figma's Event Store stores every design operation as an immutable event. Event sourcing enables perfect undo/redo, document versioning, and offline sync reconciliation.",
      action: buildAction("Event Store", "CRDT", "Event Store", "every design operation being stored as an immutable event for perfect undo/redo and versioning"),
      why: "Event sourcing stores every design operation as an immutable event. This enables perfect undo/redo, document versioning, and offline sync reconciliation without data loss.",
      component: component("event_store", "Event Store"),
      openingMessage: buildOpeningL3(
        "Figma",
        "Event Store",
        "store every design operation as an immutable event for perfect undo/redo, versioning, and offline sync",
        "Figma's Event Store stores every design operation as an immutable event. Event sourcing enables perfect undo/redo, document versioning, and offline sync reconciliation.",
        "Event Store"
      ),
      celebrationMessage: buildCelebration(
        "Event Store",
        "CRDT Engine",
        "Figma's Event Store stores every design operation as an immutable event. Event sourcing enables perfect undo/redo, document versioning, and offline sync reconciliation.",
        "BFF Gateway"
      ),
      messages: [
        msg("Figma's Event Store stores every design operation as an immutable event."),
        msg("Event sourcing enables perfect undo/redo, document versioning, and offline sync reconciliation."),
        msg("Press ⌘K, search for 'Event Store', add it, then connect CRDT Engine → Event Store.")
      ],
      requiredNodes: ["event_store"],
      requiredEdges: [edge("crdt_engine", "event_store")],
      successMessage: "Event Store added. Now the BFF Gateway.",
      errorMessage: "Add an Event Store connected from the CRDT Engine.",
    }),
    step({
      id: 11,
      title: "Add BFF Gateway",
      explanation:
        "Figma's BFF Gateway serves the web client with optimized canvas APIs. The BFF batches CRDT operations, handles file compression, and manages WebSocket connections for real-time sync.",
      action: buildAction("BFF Gateway", "API Gateway", "BFF Gateway", "CRDT operations being batched, file compression handled, and WebSocket connections managed for real-time sync"),
      why: "The BFF batches CRDT operations, handles file compression, and manages WebSocket connections — optimizing for the web client's specific needs without impacting other clients.",
      component: component("bff_gateway", "BFF Gateway"),
      openingMessage: buildOpeningL3(
        "Figma",
        "BFF Gateway",
        "serve optimized canvas APIs with CRDT batching, file compression, and WebSocket management",
        "Figma's BFF Gateway serves the web client with optimized canvas APIs. The BFF batches CRDT operations, handles file compression, and manages WebSocket connections for real-time sync.",
        "BFF Gateway"
      ),
      celebrationMessage: buildCelebration(
        "BFF Gateway",
        "API Gateway",
        "Figma's BFF Gateway serves the web client with optimized canvas APIs. The BFF batches CRDT operations, handles file compression, and manages WebSocket connections for real-time sync. Figma Enterprise is complete.",
        "nothing — you have built Figma Enterprise"
      ),
      messages: [
        msg("Figma's BFF Gateway serves the web client with optimized canvas APIs."),
        msg("The BFF batches CRDT operations, handles file compression, and manages WebSocket connections for real-time sync."),
        msg("Press ⌘K, search for 'BFF Gateway', add it, then connect API Gateway → BFF Gateway.")
      ],
      requiredNodes: ["bff_gateway"],
      requiredEdges: [edge("api_gateway", "bff_gateway")],
      successMessage: "BFF Gateway added. You have built Figma Enterprise.",
      errorMessage: "Add a BFF Gateway connected from the API Gateway.",
    }),
  ],
});

export const figmaTutorial: Tutorial = tutorial({
  id: 'figma-architecture',
  title: 'How to Design Figma Architecture',
  description:
    'Build a collaborative design tool for 4 million teams. Learn CRDTs for conflict-free simultaneous editing, presence awareness, canvas rendering, and version history at scale.',
  difficulty: 'Advanced',
  category: 'Collaboration Tools',
  isLive: false,
  icon: 'PenTool',
  color: '#f24e1e',
  tags: ['CRDTs', 'Collaboration', 'Canvas', 'Presence'],
  estimatedTime: '~87 mins',
  levels: [l1, l2, l3],
});
