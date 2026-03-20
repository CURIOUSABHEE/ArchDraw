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
  estimatedTime: '~28 mins',
  levels: [l1],
});
