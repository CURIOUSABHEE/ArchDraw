import { step, level, tutorial, component, edge, msg } from '@/lib/tutorial/factories';
import {
  buildAction,
  buildFirstStepAction,
  buildOpeningL1,
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
  estimatedTime: '~25 mins',
  levels: [l1],
});
